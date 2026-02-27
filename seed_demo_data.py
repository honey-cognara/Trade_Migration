"""
Seed script – Inserts demo data into the database for staging/demo environment.
Run with: python seed_demo_data.py

Populates:
  - 1 Admin user
  - 2 Candidate users (1 electrical worker, 1 plumber)
  - 1 Employer user + company
  - 1 Company Admin user
  - 1 Migration Agent user
  - Sample visa application
  - Sample EOI
  - Electrical worker score for the electrician
"""

import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@localhost:5432/tradie_migration"
)

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    from backend.models.models import (
        User, CandidateProfile, EmployerCompany,
        VisaApplication, ExpressionOfInterest, ElectricalWorkerScore
    )

    async with SessionLocal() as db:

        # ── Users ───────────────────────────────────────────────────────────────
        admin_id = uuid.uuid4()
        electrician_user_id = uuid.uuid4()
        plumber_user_id = uuid.uuid4()
        employer_user_id = uuid.uuid4()
        company_admin_id = uuid.uuid4()
        agent_id = uuid.uuid4()

        users = [
            User(id=admin_id, cognito_sub="cognito-admin-001",
                 role="admin", email="admin@tradiemigration.com"),
            User(id=electrician_user_id, cognito_sub="cognito-cand-001",
                 role="candidate", email="ali.hassan@gmail.com"),
            User(id=plumber_user_id, cognito_sub="cognito-cand-002",
                 role="candidate", email="raj.kumar@gmail.com"),
            User(id=employer_user_id, cognito_sub="cognito-emp-001",
                 role="employer", email="jobs@voltcore.com.au"),
            User(id=company_admin_id, cognito_sub="cognito-cadmin-001",
                 role="company_admin", email="casemanager@tradiemigration.com"),
            User(id=agent_id, cognito_sub="cognito-agent-001",
                 role="migration_agent", email="agent@migrationpro.com.au"),
        ]
        db.add_all(users)
        await db.flush()

        # ── Candidate Profiles ──────────────────────────────────────────────────
        electrician_profile_id = uuid.uuid4()
        plumber_profile_id = uuid.uuid4()

        candidates = [
            CandidateProfile(
                id=electrician_profile_id,
                user_id=electrician_user_id,
                full_name="Ali Hassan",
                nationality="Pakistani",
                country_of_residence="Pakistan",
                trade_category="licensed_electrician",
                is_electrical_worker=True,
                years_experience=8,
                languages=[{"name": "English", "level": "B2"}, {"name": "Urdu", "level": "C2"}],
                profile_summary="Licensed electrician with 8 years in industrial and residential projects. "
                                "Experienced in HV/LV installations and safety compliance.",
                published=True,
            ),
            CandidateProfile(
                id=plumber_profile_id,
                user_id=plumber_user_id,
                full_name="Raj Kumar",
                nationality="Indian",
                country_of_residence="India",
                trade_category="plumber",
                is_electrical_worker=False,
                years_experience=5,
                languages=[{"name": "English", "level": "B1"}],
                profile_summary="Experienced plumber with 5 years in commercial fit-outs and residential services.",
                published=True,
            ),
        ]
        db.add_all(candidates)
        await db.flush()

        # ── Employer Company ────────────────────────────────────────────────────
        employer_company_id = uuid.uuid4()
        employer = EmployerCompany(
            id=employer_company_id,
            owner_user_id=employer_user_id,
            company_name="VoltCore Electrical Pty Ltd",
            abn_or_identifier="12 345 678 901",
            contact_name="Sarah Thompson",
            contact_email="jobs@voltcore.com.au",
            industry="Electrical Contracting",
            verification_status="approved",
        )
        db.add(employer)
        await db.flush()

        # ── Visa Application ────────────────────────────────────────────────────
        visa_app = VisaApplication(
            id=uuid.uuid4(),
            candidate_id=electrician_profile_id,
            employer_company_id=employer_company_id,
            status="under_review",
            country_of_application="Australia",
            notes="Subclass 482 TSS – candidate has trade cert and 8 years experience. "
                  "Awaiting Skills Assessment result from Engineers Australia.",
            created_by_user_id=company_admin_id,
        )
        db.add(visa_app)

        # ── Expression of Interest ──────────────────────────────────────────────
        eoi = ExpressionOfInterest(
            id=uuid.uuid4(),
            employer_company_id=employer_company_id,
            candidate_id=electrician_profile_id,
            job_title="Industrial Electrician – Sydney",
            message="We reviewed Ali's profile and believe he is an excellent fit for our expanding "
                    "Sydney team. We are open to sponsorship under TSS 482.",
            sponsorship_flag=True,
            status="unread",
        )
        db.add(eoi)

        # ── Electrical Worker Score ─────────────────────────────────────────────
        score = ElectricalWorkerScore(
            id=uuid.uuid4(),
            candidate_id=electrician_profile_id,
            trade_type_score=25,
            experience_score=20,
            certification_score=18,
            safety_compliance_score=10,
            english_score=7,
            total_score=80,
            scoring_version="v1.0",
        )
        db.add(score)

        await db.commit()
        print("✅ Demo seed data inserted successfully!")
        print(f"   Admin:       admin@tradiemigration.com")
        print(f"   Electrician: ali.hassan@gmail.com")
        print(f"   Plumber:     raj.kumar@gmail.com")
        print(f"   Employer:    jobs@voltcore.com.au  (VoltCore Electrical)")
        print(f"   Case Mgr:    casemanager@tradiemigration.com")
        print(f"   Agent:       agent@migrationpro.com.au")


if __name__ == "__main__":
    asyncio.run(seed())
