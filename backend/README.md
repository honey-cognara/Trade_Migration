# Tradie Migration App — Backend (PyCharm Setup)

## Project Structure
```
tradie_migration_app/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── core/
│   │   ├── database.py            # DB engine, session, init_db()
│   │   └── electrical_scoring.py  # Rule-based scoring engine
│   ├── models/
│   │   └── models.py              # All SQLAlchemy ORM models
│   └── routers/
│       ├── dashboard.py           # ✅ Dashboard stats API (built)
│       ├── auth.py                # 🔲 Stage 4 — Cognito JWT + RBAC
│       ├── candidates.py          # 🔲 Stage 5 — Candidate portal
│       ├── employers.py           # 🔲 Stage 6 — Employer portal
│       ├── visa_applications.py   # 🔲 Stage 7 — Visa case management
│       ├── eoi.py                 # 🔲 Stage 6 — EOI submission
│       ├── electrical_scoring.py  # 🔲 Stage 8 — Scoring endpoint
│       ├── training_providers.py  # 🔲 Stage 10 — Training portal
│       └── rag.py                 # 🔲 Stage 9 — RAG assistant
├── seed_demo_data.py              # Inserts demo data for staging
├── requirements.txt               # Python dependencies
├── .env.example                   # Copy to .env and fill in values
└── FIGMA_DESIGN_BRIEF.md          # Design brief for Shaun
```

## Quick Start in PyCharm

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 15+ (with pgvector extension)
- AWS account (for S3, Cognito, Bedrock — can mock locally to start)

### 2. Setup
```bash
# Clone repo and open in PyCharm
# Create virtual environment (PyCharm does this automatically)

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your PostgreSQL details
```

### 3. Database Setup
```bash
# Make sure PostgreSQL is running locally
# Create the database
psql -U postgres -c "CREATE DATABASE tradie_migration;"

# Install pgvector extension (run in psql)
psql -U postgres -d tradie_migration -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 4. Run the App
```bash
# From project root
uvicorn backend.main:app --reload --port 8000

# API docs available at:
# http://localhost:8000/docs        (Swagger UI)
# http://localhost:8000/redoc       (ReDoc)
# http://localhost:8000/health      (health check)
```

### 5. Seed Demo Data
```bash
python seed_demo_data.py
```

## Build Stages (from Proposal)
| Stage | Status | Description |
|-------|--------|-------------|
| 0 | 📋 Planning | Scope freeze |
| 1 | 🔲 Todo | AWS Foundation + CI/CD |
| 2 | ✅ Done | Database schema (models.py) |
| 3 | 🔲 Todo | FastAPI + EC2/ALB deploy |
| 4 | 🔲 Todo | Auth + RBAC (Cognito) |
| 5 | 🔲 Todo | Candidate Portal |
| 6 | 🔲 Todo | Employer Portal |
| 7 | 🔲 Todo | Visa Case Management |
| 8 | ✅ Done | Electrical Scoring Engine |
| 9 | 🔲 Todo | Document Processing + RAG |
| 10 | 🔲 Todo | Training Provider Portal |
| 11 | 🔲 Todo | QA + Performance |
| 12 | 🔲 Todo | Deployment + Demo |

## Dashboard API (Built)
```
GET /api/v1/dashboard/stats          — Platform-wide stats
GET /api/v1/dashboard/recent-activity — Latest visa case updates
GET /api/v1/dashboard/pending-employers — Employers awaiting verification
```
