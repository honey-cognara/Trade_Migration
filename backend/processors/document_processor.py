"""
Document Processor – Text Extraction and Chunking
Handles PDF and DOCX files. Extracts raw text, then splits into
overlapping chunks ready for embedding.

Pipeline:
  raw file bytes → extract_text() → chunk_text() → List[str]
"""

import io
from typing import List


# ── Constants ─────────────────────────────────────────────────────────────────

CHUNK_SIZE = 800        # tokens per chunk
CHUNK_OVERLAP = 150     # tokens shared between adjacent chunks


# ── Text Extraction ────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        return "\n\n".join(pages)
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        raise ValueError(f"DOCX extraction failed: {e}")


def extract_text(file_bytes: bytes, file_name: str) -> str:
    """
    Dispatch to the correct extractor based on file extension.

    Supported formats: .pdf, .docx
    Raises ValueError for unsupported types.
    """
    lower_name = file_name.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(
            f"Unsupported file type: '{file_name}'. "
            "Only .pdf and .docx are supported."
        )


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> List[str]:
    """
    Split a long text into chunks using LangChain's RecursiveCharacterTextSplitter.

    Args:
        text:       The full document text to split.
        chunk_size: Maximum tokens per chunk.
        overlap:    Tokens shared between adjacent chunks.

    Returns:
        List of non-empty text chunks.
    """
    if not text or not text.strip():
        return []

    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = splitter.split_text(text.strip())
    return [c for c in chunks if c.strip()]


# ── Combined Pipeline ─────────────────────────────────────────────────────────

def process_document(file_bytes: bytes, file_name: str) -> List[str]:
    """
    Full pipeline: extract text from a file then split into chunks.

    Args:
        file_bytes: Raw bytes of the uploaded file.
        file_name:  Original filename, used to detect type (.pdf / .docx).

    Returns:
        List of text chunks ready for embedding.

    Raises:
        ValueError: If the file type is unsupported or extraction fails.
    """
    raw_text = extract_text(file_bytes, file_name)
    chunks = chunk_text(raw_text)
    return chunks
