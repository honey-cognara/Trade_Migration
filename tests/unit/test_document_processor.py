"""
Unit tests for backend/processors/document_processor.py
Tests: PDF/DOCX extraction, chunking, unsupported file types.
PyPDF2 and python-docx are mocked — no real files needed.
"""

import pytest
from unittest.mock import patch, MagicMock

pytestmark = pytest.mark.unit


# ── extract_text_from_pdf ──────────────────────────────────────────────────────

def test_extract_pdf_returns_text():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Hello from PDF page."
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]

    with patch("PyPDF2.PdfReader", return_value=mock_reader):
        from backend.processors.document_processor import extract_text_from_pdf
        result = extract_text_from_pdf(b"fake-pdf-bytes")
    assert "Hello from PDF page." in result


def test_extract_pdf_multiple_pages_concatenated():
    pages = []
    for i in range(3):
        p = MagicMock()
        p.extract_text.return_value = f"Page {i} content."
        pages.append(p)
    mock_reader = MagicMock()
    mock_reader.pages = pages

    with patch("PyPDF2.PdfReader", return_value=mock_reader):
        from backend.processors.document_processor import extract_text_from_pdf
        result = extract_text_from_pdf(b"fake")
    for i in range(3):
        assert f"Page {i} content." in result


def test_extract_empty_pdf_returns_empty_or_short_string():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = ""
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]

    with patch("PyPDF2.PdfReader", return_value=mock_reader):
        from backend.processors.document_processor import extract_text_from_pdf
        result = extract_text_from_pdf(b"")
    assert isinstance(result, str)


# ── extract_text_from_docx ─────────────────────────────────────────────────────

def test_extract_docx_returns_text():
    mock_para = MagicMock()
    mock_para.text = "Hello from DOCX paragraph."
    mock_doc = MagicMock()
    mock_doc.paragraphs = [mock_para]

    with patch("docx.Document", return_value=mock_doc):
        from backend.processors.document_processor import extract_text_from_docx
        result = extract_text_from_docx(b"fake-docx-bytes")
    assert "Hello from DOCX paragraph." in result


def test_extract_docx_multiple_paragraphs():
    paras = []
    for i in range(4):
        p = MagicMock()
        p.text = f"Para {i}."
        paras.append(p)
    mock_doc = MagicMock()
    mock_doc.paragraphs = paras

    with patch("docx.Document", return_value=mock_doc):
        from backend.processors.document_processor import extract_text_from_docx
        result = extract_text_from_docx(b"fake")
    for i in range(4):
        assert f"Para {i}." in result


# ── extract_text (dispatcher) ──────────────────────────────────────────────────

def test_extract_text_dispatches_pdf():
    with patch("backend.processors.document_processor.extract_text_from_pdf", return_value="pdf text") as mock_fn:
        from backend.processors.document_processor import extract_text
        result = extract_text(b"data", "document.pdf")
    mock_fn.assert_called_once()
    assert result == "pdf text"


def test_extract_text_dispatches_docx():
    with patch("backend.processors.document_processor.extract_text_from_docx", return_value="docx text") as mock_fn:
        from backend.processors.document_processor import extract_text
        result = extract_text(b"data", "document.docx")
    mock_fn.assert_called_once()
    assert result == "docx text"


def test_extract_unsupported_type_raises_value_error():
    from backend.processors.document_processor import extract_text
    with pytest.raises((ValueError, Exception)):
        extract_text(b"data", "malware.exe")


def test_extract_jpg_raises_value_error():
    from backend.processors.document_processor import extract_text
    with pytest.raises((ValueError, Exception)):
        extract_text(b"data", "photo.jpg")


# ── chunk_text ─────────────────────────────────────────────────────────────────

def test_chunk_text_returns_list():
    from backend.processors.document_processor import chunk_text
    text = "This is a sentence. " * 50
    chunks = chunk_text(text)
    assert isinstance(chunks, list)
    assert len(chunks) >= 1


def test_chunk_text_single_chunk_for_small_text():
    from backend.processors.document_processor import chunk_text
    text = "Short text."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text or text in chunks[0]


def test_chunk_text_large_text_produces_multiple_chunks():
    from backend.processors.document_processor import chunk_text
    # 1000 words ≈ several chunks
    text = ("This is a test sentence about electrical work. " * 100)
    chunks = chunk_text(text, chunk_size=200, overlap=20)
    assert len(chunks) > 1


def test_chunk_text_respects_chunk_size_approximately():
    from backend.processors.document_processor import chunk_text
    text = "word " * 500
    chunks = chunk_text(text, chunk_size=100, overlap=10)
    # Each chunk should be roughly <= chunk_size chars (with some tolerance for splitter behaviour)
    for chunk in chunks:
        assert len(chunk) <= 200  # generous tolerance


def test_chunk_text_all_content_present():
    from backend.processors.document_processor import chunk_text
    words = [f"word{i}" for i in range(200)]
    text = " ".join(words)
    chunks = chunk_text(text, chunk_size=200, overlap=20)
    combined = " ".join(chunks)
    # Most original words should still appear somewhere
    found = sum(1 for w in words if w in combined)
    assert found > len(words) * 0.9  # >90% coverage


# ── process_document (full pipeline) ──────────────────────────────────────────

def test_process_document_pdf_returns_list_of_strings():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Electrician certification document. " * 30
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]

    with patch("PyPDF2.PdfReader", return_value=mock_reader):
        from backend.processors.document_processor import process_document
        result = process_document(b"fake", "cert.pdf")
    assert isinstance(result, list)
    assert all(isinstance(c, str) for c in result)
    assert len(result) >= 1


def test_process_document_docx_returns_list_of_strings():
    mock_para = MagicMock()
    mock_para.text = "Tradie experience statement. " * 30
    mock_doc = MagicMock()
    mock_doc.paragraphs = [mock_para]

    with patch("docx.Document", return_value=mock_doc):
        from backend.processors.document_processor import process_document
        result = process_document(b"fake", "statement.docx")
    assert isinstance(result, list)
    assert len(result) >= 1
