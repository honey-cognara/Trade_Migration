"""
Embeddings – AWS Bedrock Titan Embedding Client
Converts text chunks into 1536-dimensional float vectors
using Amazon Bedrock's titan-embed-text-v1 model.

Usage:
    from backend.vector.embeddings import embed_text, embed_texts

    vector = await embed_text("Electrician with 5 years experience")
    vectors = await embed_texts(["chunk one", "chunk two"])
"""

import json
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

BEDROCK_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
EMBED_MODEL_ID = "amazon.titan-embed-text-v1"
EMBED_DIMENSIONS = 1536    # Fixed for titan-embed-text-v1


# ── Client (lazy singleton) ──────────────────────────────────────────────────

_bedrock_client = None


def _get_bedrock_client():
    """Return a lazily-initialised boto3 Bedrock Runtime client."""
    global _bedrock_client
    if _bedrock_client is None:
        try:
            import boto3
            _bedrock_client = boto3.client(
                "bedrock-runtime",
                region_name=BEDROCK_REGION,
            )
        except Exception as e:
            raise RuntimeError(
                f"Could not create Bedrock client: {e}. "
                "Ensure AWS credentials are configured (environment variables "
                "or IAM role)."
            )
    return _bedrock_client


# ── Core Embedding Function ───────────────────────────────────────────────────

def embed_text_sync(text: str) -> List[float]:
    """
    Embed a single text string using Bedrock Titan (synchronous).

    Returns a list of 1536 floats representing the embedding vector.
    Raises RuntimeError if Bedrock is unreachable or credentials are missing.
    """
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text.")

    client = _get_bedrock_client()

    body = json.dumps({"inputText": text.strip()})

    try:
        response = client.invoke_model(
            modelId=EMBED_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body,
        )
        result = json.loads(response["body"].read())
        return result["embedding"]
    except Exception as e:
        logger.error(f"Bedrock embedding failed: {e}")
        raise RuntimeError(f"Embedding generation failed: {e}")


async def embed_text(text: str) -> List[float]:
    """
    Async wrapper – runs the synchronous Bedrock call in a thread pool
    so it does not block the FastAPI event loop.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, embed_text_sync, text)


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed multiple text chunks sequentially.

    Returns a list of embedding vectors in the same order as `texts`.
    """
    import asyncio
    results = []
    for text in texts:
        vector = await embed_text(text)
        results.append(vector)
    return results


# ── Stub / Fallback ──────────────────────────────────────────────────────────

def embed_text_stub(text: str) -> List[float]:
    """
    Returns a zero vector of the correct dimension.
    Use this in tests / local dev when Bedrock is not available.
    """
    return [0.0] * EMBED_DIMENSIONS
