"""
RAG Service – Orchestrator
Ties together document processing, embedding, storage, and retrieval.

Two main flows:
  1. INGEST:  process_and_store_document()
              Upload → extract text → chunk → embed → store in pgvector

  2. QUERY:   answer_question()
              Question → embed → similarity search → build context → OpenAI LLM answer
"""

import logging
import os
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.processors.document_processor import process_document
from backend.vector.embeddings import embed_text, embed_texts
from backend.vector.search import similarity_search, store_chunks

logger = logging.getLogger(__name__)

# Set USE_STUB_EMBEDDINGS=true in .env to skip real OpenAI calls during local dev/testing
USE_STUB_EMBEDDINGS = os.getenv("USE_STUB_EMBEDDINGS", "false").lower() == "true"


# ── Flow 1 — Ingest ──────────────────────────────────────────────────────────

async def process_and_store_document(
    db: AsyncSession,
    candidate_id: str,
    source_document_id: str,
    file_bytes: bytes,
    file_name: str,
) -> dict:
    """
    Full ingestion pipeline for one uploaded document.

    Steps:
      1. Extract text from PDF or DOCX.
      2. Split into overlapping chunks.
      3. Generate OpenAI embeddings for each chunk.
      4. Persist TextChunk rows to Postgres / pgvector.

    Args:
        db:                 Async DB session.
        candidate_id:       UUID of the CandidateProfile owner.
        source_document_id: UUID of the ApplicantDocument record.
        file_bytes:         Raw bytes of the uploaded file.
        file_name:          Original filename (used for format detection).

    Returns:
        Dict with chunk_count, candidate_id, source_document_id.

    Raises:
        ValueError:   Unsupported file type or empty document.
        RuntimeError: OpenAI unavailable and stub mode is off.
    """
    # Step 1 + 2 — extract and chunk
    logger.info(f"Processing document '{file_name}' for candidate {candidate_id}")
    chunks: List[str] = process_document(file_bytes, file_name)

    if not chunks:
        raise ValueError(f"No text could be extracted from '{file_name}'.")

    logger.info(f"  → {len(chunks)} chunks created")

    # Step 3 — embed
    if USE_STUB_EMBEDDINGS:
        logger.warning("USE_STUB_EMBEDDINGS=true — using zero vectors (dev mode)")
        embeddings = [[0.0] * 1536 for _ in chunks]
    else:
        embeddings = await embed_texts(chunks)

    # Step 4 — store
    stored = await store_chunks(
        db=db,
        candidate_id=candidate_id,
        source_document_id=source_document_id,
        chunks=chunks,
        embeddings=embeddings,
    )
    logger.info(f"  → {stored} chunks stored in pgvector")

    return {
        "candidate_id": candidate_id,
        "source_document_id": source_document_id,
        "chunk_count": stored,
    }


# ── Custom Retriever ─────────────────────────────────────────────────────────

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from pydantic import Field
from typing import Any

class CandidateRetriever(BaseRetriever):
    """Wraps similarity_search into a LangChain BaseRetriever."""
    db: Any = Field(exclude=True)
    candidate_id: str
    top_k: int = 5

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        raise NotImplementedError("Sync retrieval not supported")

    async def _aget_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        if USE_STUB_EMBEDDINGS:
            query_vector = [0.0] * 1536
        else:
            query_vector = await embed_text(query)
            
        results = await similarity_search(
            db=self.db,
            candidate_id=self.candidate_id,
            query_embedding=query_vector,
            top_k=self.top_k,
        )
        
        return [
            Document(
                page_content=r["chunk_text"],
                metadata={
                    "chunk_id": r["id"],
                    "source_document_id": r["source_document_id"],
                    "distance": r["distance"],
                }
            )
            for r in results
        ]

# ── Flow 2 — Query ────────────────────────────────────────────────────────────

async def answer_question(
    db: AsyncSession,
    candidate_id: str,
    question: str,
    top_k: int = 5,
) -> dict:
    """
    RAG query pipeline using LangChain LCEL.

    Steps:
      1. Embed question and retrieve top-K similar chunks from pgvector.
      2. (MultiQuery) Generate 2 alternative phrasings with LLM, retrieve for each,
         then deduplicate by chunk_id to broaden coverage.
      3. Feed combined unique chunks as context to LLM for final answer.
    """
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    # 1. Base retriever (always needed)
    base_retriever = CandidateRetriever(db=db, candidate_id=candidate_id, top_k=top_k)

    # 2. Stub mode — skip OpenAI
    llm_model = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")
    if USE_STUB_EMBEDDINGS:
        docs = await base_retriever.ainvoke(question)
        return {
            "candidate_id": candidate_id,
            "question": question,
            "answer": f"[RAG stub — dev mode] Question received: '{question}'. OpenAI not called.",
            "sources": [
                {
                    "chunk_id": doc.metadata.get("chunk_id"),
                    "source_document_id": doc.metadata.get("source_document_id"),
                    "excerpt": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "distance": doc.metadata.get("distance", 0.0),
                }
                for doc in docs
            ],
            "status": "success" if docs else "no_documents",
        }

    llm = ChatOpenAI(model=llm_model, temperature=0)

    # 3. Multi-query expansion: ask LLM to rephrase the question twice
    rephrase_prompt = PromptTemplate.from_template(
        "Generate 2 alternative phrasings of the following question to improve document retrieval. "
        "Output ONLY the 2 questions, one per line, no numbering or extra text.\n\nQuestion: {question}"
    )
    rephrase_chain = rephrase_prompt | llm | StrOutputParser()
    try:
        rephrasings_raw = await rephrase_chain.ainvoke({"question": question})
        alt_questions = [q.strip() for q in rephrasings_raw.splitlines() if q.strip()]
    except Exception:
        alt_questions = []

    # 4. Retrieve for original + rephrased questions, deduplicate by chunk_id
    all_queries = [question] + alt_questions[:2]
    seen_ids: set = set()
    retrieved_docs = []
    for q in all_queries:
        try:
            docs = await base_retriever.ainvoke(q)
            for doc in docs:
                cid = doc.metadata.get("chunk_id")
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    retrieved_docs.append(doc)
        except Exception as exc:
            logger.warning(f"Retrieval failed for query '{q}': {exc}")

    if not retrieved_docs:
        return {
            "candidate_id": candidate_id,
            "question": question,
            "answer": None,
            "sources": [],
            "status": "no_documents",
            "message": "No document chunks found for this candidate. Upload and process documents first.",
        }

    # 5. Build context and run answer LLM
    context_str = "\n\n---\n\n".join(
        f"[Source {i + 1}] {doc.page_content}"
        for i, doc in enumerate(retrieved_docs)
    )

    answer_prompt = PromptTemplate.from_template(
        "You are an AI assistant helping migration agents assess international tradespeople.\n"
        "Answer the question below using ONLY the provided context. "
        "If the context does not contain enough information, say so clearly.\n\n"
        "### Context:\n{context}\n\n"
        "### Question:\n{question}\n\n"
        "### Answer:"
    )
    chain = answer_prompt | llm | StrOutputParser()
    answer = await chain.ainvoke({"context": context_str, "question": question})

    return {
        "candidate_id": candidate_id,
        "question": question,
        "answer": answer,
        "sources": [
            {
                "chunk_id": doc.metadata.get("chunk_id"),
                "source_document_id": doc.metadata.get("source_document_id"),
                "excerpt": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "distance": doc.metadata.get("distance", 0.0),
            }
            for doc in retrieved_docs
        ],
        "status": "success",
    }
