# 📘 Tradie Migration App – Complete User Guide

> **Version:** 0.1.0 | **Stack:** FastAPI (Python) + React (Vite) + PostgreSQL

---

## Table of Contents

1. [What Is This App?](#1-what-is-this-app)
2. [Prerequisites – What You Need to Install First](#2-prerequisites)
3. [Download & Clone the Project](#3-download--clone-the-project)
4. [Database Setup (PostgreSQL via Docker)](#4-database-setup)
5. [Backend Setup & Running](#5-backend-setup--running)
6. [Frontend Setup & Running](#6-frontend-setup--running)
7. [Using Swagger UI – Full API Reference](#7-using-swagger-ui)
8. [Step-by-Step Workflow Examples](#8-step-by-step-workflow-examples)
9. [User Roles Reference](#9-user-roles-reference)
10. [Common Errors & Fixes](#10-common-errors--fixes)
11. [Environment Variables Reference](#11-environment-variables-reference)

---

## 1. What Is This App?

The **Tradie Migration App** is a platform that connects skilled trade workers (candidates) from overseas with Australian employers. It supports:

- Candidate onboarding & profile management
- Employer company registration & discovery
- Expression of Interest (EOI) submissions
- Visa case management
- Electrical worker skills scoring
- AI-powered Q&A (RAG system)

---

## 2. Prerequisites

Install each of the following **before** doing anything else.

| Tool | Minimum Version | Download Link |
|------|----------------|---------------|
| **Python** | 3.12+ | https://www.python.org/downloads/ |
| **Node.js** | 18+ | https://nodejs.org/ |
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop/ |
| **Git** | Latest | https://git-scm.com/downloads |

> **Windows users:** During Python installation, tick ✅ **"Add Python to PATH"**.

Verify installations with:
```powershell
python --version
node --version
docker --version
git --version
```

---

## 3. Download & Clone the Project

### Option A – Using Git (Recommended)
```powershell
cd C:\Users\YourName\Projects
git clone <YOUR_REPOSITORY_URL> Trade_Migration_App
cd Trade_Migration_App
```

### Option B – Download ZIP
1. Go to the GitHub repository page
2. Click **Code** → **Download ZIP**
3. Extract the ZIP to a folder of your choice (e.g. `C:\Users\YourName\Projects\Trade_Migration_App`)
4. Open PowerShell and navigate to that folder:
```powershell
cd C:\Users\YourName\Projects\Trade_Migration_App
```

---

## 4. Database Setup

The app uses **PostgreSQL with pgvector**. The easiest way is via Docker (no PostgreSQL installation needed).

### Step 1 – Start Docker Desktop
Open Docker Desktop and wait until it shows **"Engine running"**.

### Step 2 – Start the Database Container
In PowerShell, from the project root:
```powershell
cd backend
docker-compose up -d
```

This will:
- Pull the `pgvector/pgvector:pg15` image automatically
- Create a database called `tradie_migration`
- Expose it on port **5432**
- Persist data in a Docker volume (data survives restarts)

### Step 3 – Verify the Database is Running
```powershell
docker ps
```
You should see `tradie_migration_db` with status **Up**.

### To Stop the Database Later
```powershell
docker-compose down
```

### To Stop and Delete All Data
```powershell
docker-compose down -v
```

---

## 5. Backend Setup & Running

### Step 1 – Create a Virtual Environment
From the project root (`Trade_Migration_App\`):
```powershell
python -m venv .venv
```

### Step 2 – Activate the Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```

> If you get a **script execution** error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

Your prompt should now show `(.venv)`.

### Step 3 – Install Python Dependencies
```powershell
pip install -r backend/requirements.txt
```

This installs FastAPI, SQLAlchemy, asyncpg, boto3, pydantic, and all other required packages.

### Step 4 – Configure Environment Variables
The `.env` file in the project root should already exist. Check it contains:
```
DATABASE_URL=postgresql+asyncpg://postgres:tradie123@localhost:5432/tradie_migration
JWT_SECRET_KEY=tradie-migration-super-secret-key-2025
```

If it doesn't exist, create it at `Trade_Migration_App\.env` with the above content.

### Step 5 – Run the Backend Server
```powershell
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

The API is now live at → **http://localhost:8000**

> 💡 The `--reload` flag means the server automatically restarts when you edit Python files. Remove it in production.

### Step 6 (Optional) – Seed Demo Data
To populate the database with sample users and data:
```powershell
python backend/seed_demo_data.py
```

---

## 6. Frontend Setup & Running

Open a **new** PowerShell window (keep the backend running in the first one).

### Step 1 – Navigate to the Frontend Folder
```powershell
cd Trade_Migration_App\frontend
```

### Step 2 – Install Node Packages
```powershell
npm install
```

### Step 3 – Start the Frontend Dev Server
```powershell
npm run dev
```

**Expected output:**
```
  VITE v6.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open your browser and go to → **http://localhost:5173**

---

## 7. Using Swagger UI

Swagger UI is a built-in interactive API explorer. It lets you test every endpoint without writing any code.

### How to Open Swagger UI
With the backend running, open your browser and go to:

> **http://localhost:8000/docs**

You will see the full API documentation with all endpoints grouped by tag.

### Alternative: ReDoc (read-only docs)
> **http://localhost:8000/redoc**

---

### How to Authenticate in Swagger UI

Most endpoints require a **Bearer Token (JWT)**. Here is how to do it:

#### Step 1 – Register or Login

1. In Swagger UI, scroll to the **Authentication** section
2. Click on `POST /auth/register` → click **"Try it out"**
3. Fill in the request body:
```json
{
  "email": "myemail@example.com",
  "password": "MyPassword123",
  "role": "candidate"
}
```
> Valid roles: `candidate`, `employer`, `admin`, `company_admin`, `migration_agent`

4. Click **Execute**
5. Copy the `access_token` from the response (it's a long string)

#### Step 2 – Set the Token in Swagger UI

1. Click the **🔒 Authorize** button at the top right of the Swagger UI page
2. In the **Value** field, type:
```
Bearer <paste your token here>
```
Example:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
3. Click **Authorize** then **Close**

✅ All subsequent requests will now include your token automatically.

---

## 8. Step-by-Step Workflow Examples

### 🧑 Workflow A: Candidate Registration & Profile Setup

| Step | Endpoint | Method | Notes |
|------|----------|--------|-------|
| 1 | `/auth/register` | POST | Role = `candidate` |
| 2 | `/auth/login` | POST | Copy the `access_token` |
| 3 | Authorize in Swagger | – | Paste `Bearer <token>` |
| 4 | `/candidates/profile` | POST | Create your profile |
| 5 | `/candidates/profile/publish` | POST | Make profile visible to employers |
| 6 | `/candidates/eois` | GET | View EOIs received from employers |
| 7 | `/eoi/received` | GET | Alternative EOI view |
| 8 | `/eoi/{eoi_id}/read` | PATCH | Mark an EOI as read |

**Example: Create Candidate Profile (Step 4)**
```json
{
  "full_name": "John Smith",
  "nationality": "South African",
  "country_of_residence": "South Africa",
  "trade_category": "Electrician",
  "is_electrical_worker": true,
  "years_experience": 8,
  "profile_summary": "Experienced electrician seeking visa sponsorship in Australia."
}
```

---

### 🏢 Workflow B: Employer Registration & Hiring

| Step | Endpoint | Method | Notes |
|------|----------|--------|-------|
| 1 | `/auth/register` | POST | Role = `employer` |
| 2 | `/auth/login` | POST | Copy the `access_token` |
| 3 | Authorize in Swagger | – | Paste `Bearer <token>` |
| 4 | `/employers/company` | POST | Register your company |
| 5 | *(Admin must approve your company)* | – | See Workflow C |
| 6 | `/employers/candidates` | GET | Search for candidates |
| 7 | `/employers/eoi` | POST | Submit EOI to a candidate |

**Example: Create Company (Step 4)**
```json
{
  "company_name": "Aussie Electrical Pty Ltd",
  "abn_or_identifier": "12 345 678 901",
  "contact_name": "Jane Doe",
  "contact_email": "jane@aussieelec.com.au",
  "industry": "Electrical"
}
```

**Example: Search Candidates (Step 6)**
```
GET /employers/candidates?trade_category=Electrician&min_years_experience=5
```

**Example: Submit EOI (Step 7)**
```json
{
  "candidate_id": "<uuid from search results>",
  "job_title": "Senior Electrician",
  "message": "We'd love to sponsor your 482 visa. Great fit for our team!",
  "sponsorship_flag": true
}
```

---

### 🛡️ Workflow C: Admin – Approve Employers

| Step | Endpoint | Method | Notes |
|------|----------|--------|-------|
| 1 | `/auth/register` | POST | Role = `admin` |
| 2 | `/auth/login` | POST | Copy the `access_token` |
| 3 | Authorize in Swagger | – | Paste `Bearer <token>` |
| 4 | `/admin/employers/pending` | GET | See companies awaiting approval |
| 5 | `/admin/employers/{id}/verify` | POST | Approve or reject |
| 6 | `/admin/candidates` | GET | View all candidate profiles |
| 7 | `/admin/users` | GET | View all registered users |

**Example: Approve an Employer (Step 5)**
```json
{
  "action": "approve"
}
```
> Use `"action": "reject"` to reject instead.

---

### 📋 Workflow D: Visa Case Management

> Requires role: `company_admin`, `migration_agent`, or `admin`

| Step | Endpoint | Method | Notes |
|------|----------|--------|-------|
| 1 | Login with appropriate role | POST `/auth/login` | |
| 2 | `/visa/` | POST | Create a visa application case |
| 3 | `/visa/` | GET | List all visa cases (filterable) |
| 4 | `/visa/{id}` | GET | View a single case |
| 5 | `/visa/{id}/status` | PUT | Update status/notes |

**Valid Visa Statuses:** `draft` → `submitted` → `under_review` → `approved` / `rejected`

**Example: Update Visa Status (Step 5)**
```json
{
  "status": "submitted",
  "notes": "All documents have been collected and lodged."
}
```

---

## 9. User Roles Reference

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `candidate` | Overseas trade worker | Create profile, view EOIs |
| `employer` | Australian employer | Register company, search candidates, submit EOIs |
| `company_admin` | HR admin inside a company | Create & manage visa applications |
| `migration_agent` | Licensed migration agent | Manage visa cases |
| `admin` | Platform administrator | Full access to all data, approve/reject employers |

---

## 10. Common Errors & Fixes

| Error | Meaning | Fix |
|-------|---------|-----|
| `401 Unauthorized` | No token or expired token | Login again and re-authorize in Swagger |
| `403 Forbidden` | Your role doesn't have permission | Check the role required for that endpoint |
| `400 Profile already exists` | You already created a profile | Use `PUT` to update instead of `POST` |
| `403 Company not yet approved` | Employer company pending admin review | Ask an admin to approve via `/admin/employers/{id}/verify` |
| `500 Internal Server Error` | Database not running | Make sure Docker container is running: `docker ps` |
| `Could not connect to database` | PostgreSQL is down | Run `docker-compose up -d` in the `backend` folder |
| `ModuleNotFoundError` | Virtual env not active | Run `.\.venv\Scripts\Activate.ps1` |

---

## 11. Environment Variables Reference

File location: `Trade_Migration_App\.env`

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:tradie123@localhost:5432/tradie_migration` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | `tradie-migration-super-secret-key-2025` | Secret key for signing JWT tokens |

> ⚠️ **Never commit your `.env` file to Git.** It is already listed in `.gitignore`.

---

## Quick Reference – All API Endpoints

| Tag | Endpoint | Method | Role Required |
|-----|----------|--------|---------------|
| **Auth** | `/auth/register` | POST | Public |
| **Auth** | `/auth/login` | POST | Public |
| **Auth** | `/auth/me` | GET | Any logged-in user |
| **Auth** | `/auth/logout` | POST | Any logged-in user |
| **Candidates** | `/candidates/profile` | POST | `candidate` |
| **Candidates** | `/candidates/profile` | GET | `candidate` |
| **Candidates** | `/candidates/profile` | PUT | `candidate` |
| **Candidates** | `/candidates/profile/publish` | POST | `candidate` |
| **Candidates** | `/candidates/profile/unpublish` | POST | `candidate` |
| **Candidates** | `/candidates/eois` | GET | `candidate` |
| **Employers** | `/employers/company` | POST | `employer` |
| **Employers** | `/employers/company` | GET | `employer` |
| **Employers** | `/employers/company` | PUT | `employer` |
| **Employers** | `/employers/candidates` | GET | `employer` (approved) |
| **Employers** | `/employers/candidates/{id}` | GET | `employer` (approved) |
| **Employers** | `/employers/eoi` | POST | `employer` (approved) |
| **EOI** | `/eoi/` | POST | `employer` (approved) |
| **EOI** | `/eoi/received` | GET | `candidate` |
| **EOI** | `/eoi/{id}/read` | PATCH | `candidate` |
| **Visa** | `/visa/` | POST | `company_admin`, `migration_agent`, `admin` |
| **Visa** | `/visa/` | GET | `company_admin`, `migration_agent`, `admin` |
| **Visa** | `/visa/{id}` | GET | `company_admin`, `migration_agent`, `admin` |
| **Visa** | `/visa/{id}/status` | PUT | `company_admin`, `migration_agent`, `admin` |
| **Admin** | `/admin/employers/pending` | GET | `admin` |
| **Admin** | `/admin/employers/{id}/verify` | POST | `admin` |
| **Admin** | `/admin/employers` | GET | `admin` |
| **Admin** | `/admin/candidates` | GET | `admin` |
| **Admin** | `/admin/candidates/{id}/unpublish` | POST | `admin` |
| **Admin** | `/admin/users` | GET | `admin` |
| **Dashboard** | `/dashboard/` | GET | Any logged-in user |
| **Dashboard** | `/dashboard/summary` | GET | Any logged-in user |
| **Scoring** | `/scoring/...` | Various | `candidate`, `admin` |
| **Training** | `/training/...` | Various | Various |
| **RAG** | `/rag/...` | Various | Any logged-in user |
| **Health** | `/health` | GET | Public |

---

*Made for the Tradie Migration App prototype – March 2026*
