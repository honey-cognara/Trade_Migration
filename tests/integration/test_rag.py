"""
Integration tests for /rag/* endpoints.
OpenAI is fully mocked via conftest autouse fixture.
Covers: ask, ingest, list chunks + RBAC.
"""
import uuid
import pytest
from unittest.mock import AsyncMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def mock_rag_service(monkeypatch):
    """Mock the entire RAG service to avoid real LLM calls."""
    import backend.services.rag_service as rag

    async def _fake_answer(db, candidate_id, question, top_k=5):
        return {
            "candidate_id": str(candidate_id),
            "question": question,
            "answer": "Mock answer from RAG service.",
            "sources": [],
        }

    async def _fake_ingest(db, candidate_id, source_document_id, file_bytes, file_name):
        return {"candidate_id": str(candidate_id), "source_document_id": str(source_document_id), "chunk_count": 3}

    monkeypatch.setattr(rag, "answer_question", _fake_answer)
    monkeypatch.setattr(rag, "process_and_store_document", _fake_ingest)
    # Also patch the local reference in the route module (from ... import)
    import backend.api.routes.rag as rag_route
    monkeypatch.setattr(rag_route, "process_and_store_document", _fake_ingest)
    monkeypatch.setattr(rag_route, "answer_question", _fake_answer)


# ══════════════════════════════════════════════════════════════════════════════
# ASK QUESTION
# ══════════════════════════════════════════════════════════════════════════════

async def test_ask_question_as_admin_returns_answer(
    client, admin_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "What certifications does the candidate have?",
        "top_k": 5,
    }, headers=admin_user["headers"])
    assert r.status_code == 200
    assert "answer" in r.json()


async def test_ask_question_as_migration_agent_returns_200(
    client, migration_agent_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "How many years of experience?",
        "top_k": 3,
    }, headers=migration_agent_user["headers"])
    assert r.status_code == 200


async def test_ask_question_as_candidate_returns_403(
    client, candidate_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "What are my certifications?",
    }, headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_ask_question_empty_question_returns_422(
    client, admin_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "",
    }, headers=admin_user["headers"])
    assert r.status_code == 422


async def test_ask_question_too_short_returns_422(
    client, admin_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "Hi",  # less than 3 chars
    }, headers=admin_user["headers"])
    assert r.status_code == 422


async def test_ask_question_invalid_top_k_returns_422(
    client, admin_user, candidate_profile
):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "What experience does the candidate have?",
        "top_k": -1,
    }, headers=admin_user["headers"])
    assert r.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# INGEST DOCUMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_ingest_document_as_admin_returns_chunk_count(
    client, admin_user, candidate_profile, applicant_document
):
    r = await client.post(
        f"/rag/ingest/{candidate_profile.id}/{applicant_document.id}",
        files={"file": ("test.pdf", b"%PDF-1.4 fake content", "application/pdf")},
        headers=admin_user["headers"],
    )
    assert r.status_code in (200, 201)
    assert "chunk_count" in r.json()


async def test_ingest_nonexistent_document_returns_404(
    client, admin_user, candidate_profile
):
    r = await client.post(
        f"/rag/ingest/{candidate_profile.id}/{uuid.uuid4()}",
        files={"file": ("test.pdf", b"%PDF-1.4 fake content", "application/pdf")},
        headers=admin_user["headers"],
    )
    assert r.status_code == 404


async def test_ingest_as_candidate_returns_403(
    client, candidate_user, candidate_profile, applicant_document
):
    r = await client.post(
        f"/rag/ingest/{candidate_profile.id}/{applicant_document.id}",
        files={"file": ("test.pdf", b"%PDF-1.4 fake content", "application/pdf")},
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# LIST CHUNKS
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_chunks_as_admin_returns_list(
    client, admin_user, candidate_profile
):
    r = await client.get(
        f"/rag/candidates/{candidate_profile.id}/chunks",
        headers=admin_user["headers"],
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_list_chunks_as_candidate_returns_403(
    client, candidate_user, candidate_profile
):
    r = await client.get(
        f"/rag/candidates/{candidate_profile.id}/chunks",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403
