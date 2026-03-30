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

import os as _os
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from backend.db.models.models import TextChunk


def _pgvector_enabled() -> bool:
    """
    Returns True only when the PostgreSQL vector extension is confirmed available.
    Reads at call-time so it correctly reflects the result from setup.py:init_db().
    """
    return _os.getenv("PGVECTOR_PG_EXTENSION_OK", "false").lower() == "true"


# ── Similarity Search ─────────────────────────────────────────────────────────

async def similarity_search(
    db: AsyncSession,
    candidate_id: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[dict]:
    """
    Return the `top_k` most similar TextChunks for this candidate.

    When pgvector IS installed: uses cosine distance operator (<=>).
    When pgvector is NOT installed: falls back to returning the most recent
    chunks sorted by creation date (no vector ranking). The pipeline still
    runs end-to-end for local dev / testing purposes.

    Args:
        db:              Async database session.
        candidate_id:    UUID string – restricts search to one candidate's docs.
        query_embedding: 1536-dim float list from the OpenAI embedder.
        top_k:           Maximum number of chunks to return.

    Returns:
        List of dicts with keys: id, chunk_text, source_document_id, distance.
    """
    if _pgvector_enabled():
        # ── pgvector path: real cosine similarity ─────────────────────────────
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
    else:
        # ── Fallback path: no pgvector — return most recent chunks ────────────
        # Keeps the pipeline functional for local dev / testing without pgvector.
        import uuid as _uuid
        cid_uuid = _uuid.UUID(candidate_id) if isinstance(candidate_id, str) else candidate_id
        stmt = (
            select(TextChunk)
            .where(TextChunk.candidate_id == cid_uuid)
            .order_by(TextChunk.created_at.desc())
            .limit(top_k)
        )
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        return [
            {
                "id": str(c.id),
                "chunk_text": c.chunk_text,
                "source_document_id": str(c.source_document_id),
                "distance": 0.0,   # No real distance without pgvector
            }
            for c in chunks
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

    When pgvector is installed: stores embeddings as native vector columns.
    When pgvector is not installed: serialises embeddings as JSON strings (TEXT).

    Args:
        db:                 Async database session.
        candidate_id:       UUID string.
        source_document_id: UUID string of the ApplicantDocument.
        chunks:             List of text strings (from document_processor).
        embeddings:         Parallel list of 1536-dim vectors (from embeddings.py).

    Returns:
        Number of chunks stored.
    """
    import uuid
    import json as _json
    from backend.db.models.models import TextChunk

    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings lists must be the same length.")

    for chunk_text, embedding in zip(chunks, embeddings):
        # When pgvector is not available the column is TEXT — store as JSON string
        stored_embedding = embedding if _pgvector_enabled() else _json.dumps(embedding)

        # Convert str IDs → uuid.UUID so asyncpg accepts them without casting errors
        cid = uuid.UUID(candidate_id) if isinstance(candidate_id, str) else candidate_id
        src_id = uuid.UUID(source_document_id) if isinstance(source_document_id, str) else source_document_id

        chunk = TextChunk(
            id=uuid.uuid4(),
            candidate_id=cid,
            source_document_id=src_id,
            chunk_text=chunk_text,
            embedding=stored_embedding,
        )
        db.add(chunk)

    await db.commit()
    return len(chunks)
