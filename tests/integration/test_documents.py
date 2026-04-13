"""
Integration tests for /documents/* endpoints.
Covers: upload, list, download, delete + RBAC.
File I/O is mocked via monkeypatch.
"""
import uuid
import pytest
from unittest.mock import AsyncMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def mock_file_storage(monkeypatch, tmp_path):
    """Redirect all file storage to a temp directory."""
    import backend.utils.file_storage as fs
    monkeypatch.setattr(fs, "UPLOADS_BASE", str(tmp_path))

    async def _fake_save(storage_key, file_bytes):
        dest = tmp_path / storage_key.replace("/", "_")
        dest.write_bytes(file_bytes)
        return str(dest)

    monkeypatch.setattr(fs, "save_upload", _fake_save)
    monkeypatch.setattr(fs, "file_exists", lambda key: True)
    monkeypatch.setattr(fs, "delete_file", lambda key: None)
    monkeypatch.setattr(fs, "get_absolute_path", lambda key: str(tmp_path / key.replace("/", "_")))


def _pdf_upload(name="cert.pdf"):
    return ("file", (name, b"%PDF-1.4 fake content", "application/pdf"))


def _docx_upload(name="doc.docx"):
    content = b"PK\x03\x04" + b"\x00" * 100  # minimal docx magic bytes
    return ("file", (name, content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))


# ══════════════════════════════════════════════════════════════════════════════
# UPLOAD
# ══════════════════════════════════════════════════════════════════════════════

async def test_upload_pdf_as_candidate_returns_201(
    client, candidate_user, candidate_profile
):
    r = await client.post(
        "/documents/",
        data={
            "document_group": "qualifications",
            "document_type": "trade_certificate",
            "issuing_country": "Pakistan",
        },
        files=[_pdf_upload()],
        headers=candidate_user["headers"],
    )
    assert r.status_code == 201


async def test_upload_as_employer_returns_403(client, employer_user):
    r = await client.post(
        "/documents/",
        data={"document_group": "qualifications", "document_type": "trade_certificate"},
        files=[_pdf_upload()],
        headers=employer_user["headers"],
    )
    assert r.status_code == 403


async def test_upload_unsupported_type_returns_422(
    client, candidate_user, candidate_profile
):
    r = await client.post(
        "/documents/",
        data={"document_group": "qualifications", "document_type": "trade_certificate"},
        files=[("file", ("malware.exe", b"MZ\x90", "application/octet-stream"))],
        headers=candidate_user["headers"],
    )
    assert r.status_code in (400, 422)


# ══════════════════════════════════════════════════════════════════════════════
# LIST DOCUMENTS
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_documents_as_candidate_returns_list(
    client, candidate_user, candidate_profile, applicant_document
):
    r = await client.get(
        f"/documents/{candidate_profile.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


async def test_list_documents_as_admin_returns_list(
    client, admin_user, candidate_profile, applicant_document
):
    r = await client.get(
        f"/documents/{candidate_profile.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_list_documents_as_employer_without_consent_returns_403(
    client, employer_user, approved_company, candidate_profile, applicant_document
):
    r = await client.get(
        f"/documents/{candidate_profile.id}",
        headers=employer_user["headers"],
    )
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# DELETE DOCUMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_delete_document_as_candidate_returns_200(
    client, candidate_user, candidate_profile, applicant_document
):
    r = await client.delete(
        f"/documents/{applicant_document.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code in (200, 204)


async def test_delete_document_as_employer_returns_403(
    client, employer_user, applicant_document
):
    r = await client.delete(
        f"/documents/{applicant_document.id}",
        headers=employer_user["headers"],
    )
    assert r.status_code == 403
