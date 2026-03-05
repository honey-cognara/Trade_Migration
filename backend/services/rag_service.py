"""
RAG Service – Orchestrator
Ties together document processing, embedding, storage, and retrieval.

Two main flows:
  1. INGEST:  process_and_store_document()
              Upload → extract text → chunk → embed → store in pgvector

  2. QUERY:   answer_question()
              Question → embed → similarity search → build context → LLM answer (Bedrock)
"""

import logging
import os
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.processors.document_processor import process_document
from backend.vector.embeddings import embed_text, embed_texts, embed_text_stub
from backend.vector.search import similarity_search, store_chunks

logger = logging.getLogger(__name__)

# Use stub embeddings when AWS credentials are not configured (local dev)
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
      3. Generate Bedrock embeddings for each chunk.
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
        RuntimeError: Bedrock unavailable and stub mode is off.
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


# ── Flow 2 — Query ────────────────────────────────────────────────────────────

async def answer_question(
    db: AsyncSession,
    candidate_id: str,
    question: str,
    top_k: int = 5,
) -> dict:
    """
    RAG query pipeline.

    Steps:
      1. Embed the user's question.
      2. Find top_k most similar TextChunks (pgvector cosine search).
      3. Build a context string from the retrieved chunks.
      4. Call Bedrock Claude to generate a grounded answer.

    Args:
        db:           Async DB session.
        candidate_id: UUID — restricts search to this candidate's documents.
        question:     Natural language question from the user.
        top_k:        How many chunks to retrieve as context.

    Returns:
        Dict with answer, sources, and status.
    """
    # Step 1 — embed the question
    if USE_STUB_EMBEDDINGS:
        query_vector = [0.0] * 1536
    else:
        query_vector = await embed_text(question)

    # Step 2 — similarity search
    relevant_chunks = await similarity_search(
        db=db,
        candidate_id=candidate_id,
        query_embedding=query_vector,
        top_k=top_k,
    )

    if not relevant_chunks:
        return {
            "candidate_id": candidate_id,
            "question": question,
            "answer": None,
            "sources": [],
            "status": "no_documents",
            "message": "No document chunks found for this candidate. Upload and process documents first.",
        }

    # Step 3 — build context
    context = "\n\n---\n\n".join(
        f"[Source {i+1}] {c['chunk_text']}"
        for i, c in enumerate(relevant_chunks)
    )

    # Step 4 — call Bedrock LLM (Claude)
    answer = await _call_bedrock_llm(question=question, context=context)

    return {
        "candidate_id": candidate_id,
        "question": question,
        "answer": answer,
        "sources": [
            {
                "chunk_id": c["id"],
                "source_document_id": c["source_document_id"],
                "excerpt": c["chunk_text"][:200] + "..." if len(c["chunk_text"]) > 200 else c["chunk_text"],
                "distance": c["distance"],
            }
            for c in relevant_chunks
        ],
        "status": "success",
    }


# ── Bedrock LLM Call ──────────────────────────────────────────────────────────

async def _call_bedrock_llm(question: str, context: str) -> str:
    """
    Send the question + retrieved context to Bedrock Claude and return the answer.
    Falls back to a stub response if Bedrock is unavailable.
    """
    import asyncio

    def _invoke() -> str:
        import json
        import boto3

        bedrock_region = os.getenv("AWS_REGION", "ap-southeast-2")
        model_id = os.getenv("BEDROCK_LLM_MODEL", "anthropic.claude-3-haiku-20240307-v1:0")

        prompt = (
            "You are an AI assistant helping migration agents assess international tradespeople.\n"
            "Answer the question below using ONLY the provided context. "
            "If the context does not contain enough information, say so clearly.\n\n"
            f"### Context:\n{context}\n\n"
            f"### Question:\n{question}\n\n"
            "### Answer:"
        )

        client = boto3.client("bedrock-runtime", region_name=bedrock_region)
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        })

        try:
            response = client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"].strip()
        except Exception as e:
            logger.error(f"Bedrock LLM call failed: {e}")
            # Graceful stub fallback
            return (
                f"[RAG stub] AWS Bedrock LLM integration pending. "
                f"Retrieved {context.count('---') + 1} relevant chunks for your question: '{question}'."
            )

    if USE_STUB_EMBEDDINGS:
        return (
            f"[RAG stub — dev mode] Question received: '{question}'. "
            "Bedrock not called (USE_STUB_EMBEDDINGS=true)."
        )

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _invoke)
