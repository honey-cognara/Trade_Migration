"""
File Storage – Local Filesystem Utility
=========================================
Saves, serves, and deletes applicant documents from the local
``uploads/`` directory that lives beside the project root.

Directory layout:
    uploads/
        <candidate_id>/
            <uuid>_<original_filename>

This module is the single source of truth for file paths so that
documents.py, the download endpoint, and the delete handler all agree
on where files live.
"""

import os
import uuid
import logging
import aiofiles

logger = logging.getLogger(__name__)

# ── Base uploads directory ────────────────────────────────────────────────────
# Resolve once at import time.  ``UPLOADS_DIR`` env var overrides the default
# so production deployments can point to a persistent volume.

_default_uploads = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
)
UPLOADS_BASE: str = os.getenv("UPLOADS_DIR", _default_uploads)


# ── Public helpers ────────────────────────────────────────────────────────────

def get_candidate_dir(candidate_id: str) -> str:
    """Return (and create if needed) the upload directory for one candidate."""
    path = os.path.join(UPLOADS_BASE, str(candidate_id))
    os.makedirs(path, exist_ok=True)
    return path


def build_storage_key(candidate_id: str, original_filename: str) -> str:
    """
    Generate a unique relative storage key (used as the persistent identifier
    stored in the DB ``s3_key`` column – kept for backwards compatibility).

    Format: ``<candidate_id>/<uuid>_<original_filename>``
    """
    safe_name = os.path.basename(original_filename)  # strip any path traversal
    return f"{candidate_id}/{uuid.uuid4()}_{safe_name}"


def get_absolute_path(storage_key: str) -> str:
    """Convert a relative storage key to an absolute filesystem path."""
    return os.path.join(UPLOADS_BASE, storage_key)


async def save_upload(storage_key: str, file_bytes: bytes) -> str:
    """
    Write ``file_bytes`` to disk at the path described by ``storage_key``.
    Creates intermediate directories as needed.

    Returns the absolute path of the saved file.
    """
    abs_path = get_absolute_path(storage_key)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)

    async with aiofiles.open(abs_path, "wb") as f:
        await f.write(file_bytes)

    logger.debug("Saved upload: %s (%d bytes)", abs_path, len(file_bytes))
    return abs_path


def delete_file(storage_key: str) -> None:
    """
    Delete the file identified by ``storage_key`` from disk.
    Silently ignores missing files (idempotent).
    """
    abs_path = get_absolute_path(storage_key)
    try:
        os.remove(abs_path)
        logger.debug("Deleted file: %s", abs_path)
    except FileNotFoundError:
        logger.debug("delete_file: file not found (already deleted?): %s", abs_path)
    except OSError as exc:
        logger.warning("Could not delete file %s: %s", abs_path, exc)


def file_exists(storage_key: str) -> bool:
    """Return True if the file exists on disk."""
    return os.path.isfile(get_absolute_path(storage_key))
