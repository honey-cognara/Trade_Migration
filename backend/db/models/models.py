"""
Tradie Migration App – Database Models (SQLAlchemy ORM)
Based on Section 12A of the Prototype Delivery Proposal v2
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Text, ForeignKey,
    DateTime, Enum as SAEnum, TIMESTAMP, Float
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, DeclarativeBase
# pgvector — distinguish Python package availability from PostgreSQL extension availability
# The Python package may be installed (pip) but the PG extension not installed.
# setup.py sets PGVECTOR_PG_EXTENSION_OK=true *only* when the PG extension loads successfully.
import os as _os

try:
    from pgvector.sqlalchemy import Vector
    _PGVECTOR_PYTHON_PACKAGE = True
except Exception:
    Vector = None
    _PGVECTOR_PYTHON_PACKAGE = False

# True only when BOTH the Python package AND the PostgreSQL extension are available
PGVECTOR_AVAILABLE = (
    _PGVECTOR_PYTHON_PACKAGE and
    _os.getenv("PGVECTOR_PG_EXTENSION_OK", "false").lower() == "true"
)


class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────
class User(Base):
    """All authenticated users across all roles."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cognito_sub = Column(String, unique=True, nullable=False)
    role = Column(
        SAEnum("candidate", "employer", "admin", "company_admin",
               "migration_agent", "training_provider", name="user_role"),
        nullable=False
    )
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)   # Hashed with bcrypt; nullable for future SSO/OAuth
    status = Column(String, default="active")       # "pending" until email verified, then "active"
    email_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    reset_token = Column(String(64), nullable=True)          # short-lived token issued after OTP verified
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    employer_company = relationship("EmployerCompany", back_populates="owner_user", uselist=False)
    consent_records = relationship("ConsentRecord", back_populates="user")


# ─────────────────────────────────────────────
# CANDIDATE PROFILES
# ─────────────────────────────────────────────
class CandidateProfile(Base):
    """Overseas tradesperson profile."""
    __tablename__ = "candidate_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    nationality = Column(String)
    country_of_residence = Column(String)
    trade_category = Column(String)           # e.g. "electrician", "plumber"
    is_electrical_worker = Column(Boolean, default=False)
    years_experience = Column(Integer)
    languages = Column(JSONB)                 # e.g. [{"name": "English", "level": "B2"}]
    work_types = Column(JSONB, nullable=True)  # e.g. ["domestic", "industrial", "commercial", "powerlines"]
    profile_summary = Column(Text)
    published = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    documents = relationship("ApplicantDocument", back_populates="candidate")
    eois_received = relationship("ExpressionOfInterest", back_populates="candidate")
    visa_applications = relationship("VisaApplication", back_populates="candidate")
    electrical_score = relationship("ElectricalWorkerScore", back_populates="candidate", uselist=False)
    text_chunks = relationship("TextChunk", back_populates="candidate")
    recommended_courses = relationship("CandidateRecommendedCourse", back_populates="candidate")
    employer_consents = relationship("CandidateEmployerConsent", back_populates="candidate")
    visa_share_approvals = relationship("VisaShareApproval", back_populates="candidate")


# ─────────────────────────────────────────────
# EMPLOYER COMPANIES
# ─────────────────────────────────────────────
class EmployerCompany(Base):
    """Australian employer organisations."""
    __tablename__ = "employer_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_name = Column(String, nullable=False)
    abn_or_identifier = Column(String)
    contact_name = Column(String)
    contact_email = Column(String)
    industry = Column(String)
    verification_status = Column(
        SAEnum("pending", "approved", "rejected", name="verification_status"),
        default="pending"
    )
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    owner_user = relationship("User", back_populates="employer_company")
    eois_submitted = relationship("ExpressionOfInterest", back_populates="employer_company")
    visa_applications = relationship("VisaApplication", back_populates="employer_company")


# ─────────────────────────────────────────────
# VISA APPLICATIONS
# ─────────────────────────────────────────────
class VisaApplication(Base):
    """Company admin visa application case management."""
    __tablename__ = "visa_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    employer_company_id = Column(UUID(as_uuid=True), ForeignKey("employer_companies.id"), nullable=True)
    status = Column(
        SAEnum("draft", "submitted", "under_review", "approved", "rejected",
               name="visa_status"),
        default="draft"
    )
    country_of_application = Column(String)   # e.g. "Pakistan", "Australia"
    notes = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="visa_applications")
    employer_company = relationship("EmployerCompany", back_populates="visa_applications")
    documents = relationship("ApplicantDocument", back_populates="visa_application")
    # new relationship for migration agents
    assignments = relationship("VisaCaseAssignment", back_populates="visa_application")


class VisaCaseAssignment(Base):
    """Maps a Migration Agent to a Visa Application Case."""
    __tablename__ = "visa_case_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visa_application_id = Column(UUID(as_uuid=True), ForeignKey("visa_applications.id"), nullable=False)
    # The user here MUST have the 'migration_agent' role
    agent_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active") # "active" or "unassigned"
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    visa_application = relationship("VisaApplication", back_populates="assignments")
    agent = relationship("User", foreign_keys=[agent_user_id])


# ─────────────────────────────────────────────
# APPLICANT DOCUMENTS
# ─────────────────────────────────────────────
class ApplicantDocument(Base):
    """
    All uploaded documents for a candidate.
    Grouped by document_group and document_type.
    """
    __tablename__ = "applicant_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    visa_application_id = Column(UUID(as_uuid=True), ForeignKey("visa_applications.id"), nullable=True)

    document_group = Column(String, nullable=False)
    document_type = Column(String, nullable=False)

    issuing_country = Column(String)
    file_name = Column(String, nullable=False)
    s3_key = Column(String, nullable=False, unique=True)
    uploaded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="documents")
    visa_application = relationship("VisaApplication", back_populates="documents")
    text_chunks = relationship("TextChunk", back_populates="source_document")


# ─────────────────────────────────────────────
# EXPRESSIONS OF INTEREST
# ─────────────────────────────────────────────
class ExpressionOfInterest(Base):
    """Employer submits EOI to a candidate."""
    __tablename__ = "expressions_of_interest"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_company_id = Column(UUID(as_uuid=True), ForeignKey("employer_companies.id"), nullable=False)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    job_title = Column(String)
    message = Column(Text)
    sponsorship_flag = Column(Boolean, default=False)
    status = Column(SAEnum("unread", "read", name="eoi_status"), default="unread")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    employer_company = relationship("EmployerCompany", back_populates="eois_submitted")
    candidate = relationship("CandidateProfile", back_populates="eois_received")


# ─────────────────────────────────────────────
# ELECTRICAL WORKER SCORES
# ─────────────────────────────────────────────
class ElectricalWorkerScore(Base):
    """Rule-based suitability score for electrical workers only."""
    __tablename__ = "electrical_worker_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False, unique=True)
    trade_type_score = Column(Integer, default=0)
    experience_score = Column(Integer, default=0)
    certification_score = Column(Integer, default=0)
    safety_compliance_score = Column(Integer, default=0)
    english_score = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    scoring_version = Column(String, default="v1.0")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="electrical_score")


# ─────────────────────────────────────────────
# CONSENT RECORDS
# ─────────────────────────────────────────────
class ConsentRecord(Base):
    """GDPR/Privacy consent tracking."""
    __tablename__ = "consent_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    consent_type = Column(String, nullable=False)    # e.g. "data_processing", "profile_publish"
    consent_version = Column(String, nullable=False) # e.g. "2025-v1"
    accepted_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="consent_records")


# ─────────────────────────────────────────────
# TEXT CHUNKS (RAG / pgvector)
# ─────────────────────────────────────────────
class TextChunk(Base):
    """
    Vector embeddings of candidate documents for RAG search.
    Uses pgvector. Strictly scoped per candidate.
    """
    __tablename__ = "text_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    source_document_id = Column(UUID(as_uuid=True), ForeignKey("applicant_documents.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    # 1536-dim vector from OpenAI text-embedding-3-small; falls back to Text if pgvector missing
    embedding = Column(Vector(1536) if PGVECTOR_AVAILABLE else Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="text_chunks")
    source_document = relationship("ApplicantDocument", back_populates="text_chunks")


# ─────────────────────────────────────────────
# TRAINING PROVIDERS
# ─────────────────────────────────────────────
class TrainingProvider(Base):
    """Registered training organisations (RTOs)."""
    __tablename__ = "training_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    contact_email = Column(String)
    website_url = Column(String)
    country = Column(String)
    status = Column(String, default="active")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    courses = relationship("TrainingCourse", back_populates="provider")


# ─────────────────────────────────────────────
# TRAINING COURSES
# ─────────────────────────────────────────────
class TrainingCourse(Base):
    """Courses published by training providers."""
    __tablename__ = "training_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("training_providers.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    trade_category = Column(String, default="electrical")  # Electrical only in MVP
    delivery_mode = Column(String)                          # e.g. "online", "in-person", "blended"
    location = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    provider = relationship("TrainingProvider", back_populates="courses")
    candidate_recommendations = relationship("CandidateRecommendedCourse", back_populates="course")


# ─────────────────────────────────────────────
# CANDIDATE RECOMMENDED COURSES
# ─────────────────────────────────────────────
class CandidateRecommendedCourse(Base):
    """Links a training course recommendation to a candidate."""
    __tablename__ = "candidate_recommended_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("training_courses.id"), nullable=False)
    linked_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="recommended_courses")
    course = relationship("TrainingCourse", back_populates="candidate_recommendations")


# ─────────────────────────────────────────────
# CANDIDATE EMPLOYER CONSENT
# ─────────────────────────────────────────────
class CandidateEmployerConsent(Base):
    """
    Tracks explicit candidate consent for an employer to view their full profile.
    Candidates grant/revoke access per employer company.
    """
    __tablename__ = "candidate_employer_consents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    employer_company_id = Column(UUID(as_uuid=True), ForeignKey("employer_companies.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    granted_at = Column(TIMESTAMP, default=datetime.utcnow)
    revoked_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="employer_consents")
    employer_company = relationship("EmployerCompany")


# ─────────────────────────────────────────────
# VISA SHARE APPROVAL
# ─────────────────────────────────────────────
class VisaShareApproval(Base):
    """
    Candidate explicitly approves sharing their visa/migration documents
    with a specific employer as a compiled PDF export.
    Only valid when an EOI relationship already exists between the parties.
    """
    __tablename__ = "visa_share_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    employer_company_id = Column(UUID(as_uuid=True), ForeignKey("employer_companies.id"), nullable=False)
    eoi_id = Column(UUID(as_uuid=True), ForeignKey("expressions_of_interest.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    approved_at = Column(TIMESTAMP, default=datetime.utcnow)
    revoked_at = Column(TIMESTAMP, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="visa_share_approvals")
    employer_company = relationship("EmployerCompany")
    eoi = relationship("ExpressionOfInterest")
