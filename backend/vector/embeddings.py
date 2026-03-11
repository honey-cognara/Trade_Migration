"""
Embeddings – OpenAI Embedding Client via LangChain
Converts text chunks into 1536-dimensional float vectors
using OpenAI's text-embedding-3-small model.

Usage:
    from backend.vector.embeddings import embed_text, embed_texts

    vector = await embed_text("Electrician with 5 years experience")
    vectors = await embed_texts(["chunk one", "chunk two"])
"""

import os
import logging
from typing import List

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

EMBED_MODEL_ID = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536    # Fixed for text-embedding-3-small


# ── Client (lazy singleton) ──────────────────────────────────────────────────

_embeddings_client = None

def _get_embeddings_client():
    """Return a lazily-initialised LangChain OpenAIEmbeddings client."""
    global _embeddings_client
    if _embeddings_client is None:
        try:
            from langchain_openai import OpenAIEmbeddings
            
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
                
            _embeddings_client = OpenAIEmbeddings(
                model=EMBED_MODEL_ID,
                api_key=api_key
            )
        except Exception as e:
            raise RuntimeError(f"Could not create OpenAI embeddings client: {e}")
    return _embeddings_client


# ── Core Embedding Function ───────────────────────────────────────────────────

async def embed_text(text: str) -> List[float]:
    """
    Embed a single text string using OpenAI text-embedding-3-small.
    """
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text.")

    client = _get_embeddings_client()
    try:
        return await client.aembed_query(text.strip())
    except Exception as e:
        logger.error(f"OpenAI embedding failed: {e}")
        raise RuntimeError(f"Embedding generation failed: {e}")


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple text chunks.
    """
    if not texts:
        return []
        
    client = _get_embeddings_client()
    try:
        return await client.aembed_documents(texts)
    except Exception as e:
        logger.error(f"OpenAI batch embedding failed: {e}")
        raise RuntimeError(f"Batch embedding generation failed: {e}")


# ── Stub / Fallback ──────────────────────────────────────────────────────────

def embed_text_stub(text: str) -> List[float]:
    """
    Returns a zero vector of the correct dimension.
    Use this in tests / local dev when Bedrock is not available.
    """
    return [0.0] * EMBED_DIMENSIONS
