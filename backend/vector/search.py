"""
Vector Search – pgvector Similarity Search
Finds the most relevant TextChunk rows for a given query embedding
using cosine distance via the pgvector extension.

Usage:
    from backend.vector.search import similarity_search

    chunks = await similarity_search(
        db=db,
        candidate_id="uuid-string",
        query_embedding=[0.1, 0.2, ...],   # 1536 floats
        top_k=5,
    )
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from backend.db.models.models import TextChunk


# ── Similarity Search ─────────────────────────────────────────────────────────

async def similarity_search(
    db: AsyncSession,
    candidate_id: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[dict]:
    """
    Return the `top_k` most similar TextChunks for this candidate.

    Uses pgvector's cosine distance operator (<=>).
    Results are ordered from most to least relevant.

    Args:
        db:              Async database session.
        candidate_id:    UUID string – restricts search to one candidate's docs.
        query_embedding: 1536-dim float list from the Bedrock embedder.
        top_k:           Maximum number of chunks to return.

    Returns:
        List of dicts with keys: id, chunk_text, source_document_id, distance.
    """
    # Format the vector literal for pgvector:  '[0.1, 0.2, ...]'
    vector_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"

    # Raw SQL using pgvector <=> (cosine distance) operator
    stmt = text(
        """
        SELECT
            id,
            chunk_text,
            source_document_id,
            embedding <=> CAST(:vec AS vector) AS distance
        FROM text_chunks
        WHERE candidate_id = CAST(:cid AS uuid)
          AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :k
        """
    )

    result = await db.execute(
        stmt,
        {
            "vec": vector_literal,
            "cid": candidate_id,
            "k": top_k,
        },
    )
    rows = result.fetchall()

    return [
        {
            "id": str(row.id),
            "chunk_text": row.chunk_text,
            "source_document_id": str(row.source_document_id),
            "distance": float(row.distance),
        }
        for row in rows
    ]


# ── Store Chunks ──────────────────────────────────────────────────────────────

async def store_chunks(
    db: AsyncSession,
    candidate_id: str,
    source_document_id: str,
    chunks: List[str],
    embeddings: List[List[float]],
) -> int:
    """
    Persist text chunks and their embeddings to the `text_chunks` table.

    Args:
        db:                 Async database session.
        candidate_id:       UUID string.
        source_document_id: UUID string — the `ApplicantDocument` these chunks came from.
        chunks:             List of text strings (from document_processor).
        embeddings:         Parallel list of 1536-dim vectors (from embeddings.py).

    Returns:
        Number of chunks stored.
    """
    import uuid
    from backend.db.models.models import TextChunk

    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings lists must be the same length.")

    for chunk_text, embedding in zip(chunks, embeddings):
        chunk = TextChunk(
            id=uuid.uuid4(),
            candidate_id=candidate_id,
            source_document_id=source_document_id,
            chunk_text=chunk_text,
            embedding=embedding,
        )
        db.add(chunk)

    await db.commit()
    return len(chunks)
