# Tradie Migration App — Figma UI/UX Design Brief
### For: Shaun (UI/UX Designer)
### Version: Draft v1 | Based on Prototype Proposal v2

---

## 1. Product Overview

The Tradie Migration App connects **overseas tradespeople** (initially Pakistan/India) with **Australian employers**. The platform handles candidate profile discovery, visa document management, AI-assisted document Q&A, and employer expressions of interest.

---

## 2. User Roles & Their Primary Screens

| Role | Key Screens to Design |
|---|---|
| **Candidate** | Registration → Profile Builder → Document Uploader → EOI Inbox → Dashboard |
| **Employer** | Registration → Candidate Search → Candidate Profile View → EOI Form |
| **Company Admin** | Dashboard → Visa Case List → Visa Case Detail → Document Checklist → Status Workflow |
| **Migration Agent** | Case Queue → Candidate Document Checklist → Notes & Upload → RAG Chat |
| **Training Provider** | Provider Profile → Course Listings → Add/Edit Course |
| **Admin** | Employer Approval Queue → User Management → Platform Overview |

---

## 3. Screen List (MVP Design Priority)

### Priority 1 — Must Have for Demo
1. **Login / Register** (shared, role-selector)
2. **Candidate — Profile Builder** (multi-step form: personal → trade → languages → summary)
3. **Candidate — Document Upload** (grouped by document category with progress)
4. **Candidate — EOI Inbox** (list of received expressions of interest)
5. **Employer — Candidate Search** (filter sidebar + candidate card grid)
6. **Employer — Candidate Profile View** (full profile + documents + score + EOI button)
7. **Company Admin — Dashboard** (stats cards + recent cases + pending employer approvals)
8. **Company Admin — Visa Case Detail** (status stepper + document checklist + notes)
9. **Migration Agent — Case Queue** (table of assigned cases with status pills)
10. **Admin — Employer Verification** (pending employer cards with approve/reject actions)

### Priority 2 — Nice to Have for Demo
11. **RAG Chat Panel** (floating panel overlay on candidate profile: ask AI about documents)
12. **Electrical Scoring Card** (score breakdown: trade type / experience / certs / safety / English)
13. **Training Provider — Course Listing** (course cards for electrical workers)
14. **Candidate — Recommended Courses** (linked courses section on candidate profile)

---

## 4. Design Direction & Brand

**Tone:** Professional, trustworthy, and welcoming. This platform is handling sensitive life decisions (visas, careers, relocation) — it should feel calm, structured, and credible. NOT flashy or startup-gimmicky.

**Colour Palette Suggestion:**
- Primary: Deep navy `#1A2B4A` (trust, professionalism)
- Accent: Warm amber `#F59E0B` (energy, trades, Australian palette)
- Success: Teal `#0D9488`
- Danger: `#DC2626`
- Background: Light grey `#F8FAFC`
- Card backgrounds: White `#FFFFFF`

**Typography:**
- Headings: `Inter` or `DM Sans` — bold and clean
- Body: `Inter` — 16px minimum
- Code/Data labels: `JetBrains Mono`

**Iconography:** Use Phosphor Icons or Heroicons (both free, consistent line style)

---

## 5. Key UI Components Needed

### Navigation
- **Sidebar nav** (role-aware — shows different items per role)
- Top header with user avatar, role badge, notifications bell

### Candidate Search (Employer View)
- Filter sidebar: Trade Category | Country | Experience (years) | Published only
- Candidate card: Name, trade, country, experience, score badge, "View Profile" CTA
- Pagination or infinite scroll

### Visa Case Detail (Company Admin / Agent)
- **Status stepper**: Draft → Submitted → Under Review → Approved / Rejected
- **Document Checklist**: Grouped by category (Identity, Education, Work Experience, etc.)
  - Each document shows: type label, status chip (Missing / Uploaded / Reviewed), upload button
- **Notes panel**: Chronological thread of internal case notes

### Document Uploader (Candidate)
- Step-by-step grouped document upload
- Each group (Identity, Trade Certs, English Evidence, etc.) expands
- Status: Not started / In progress / Complete
- Support: PDF, JPG, PNG (no video here — video is separate)

### Electrical Score Card
- Circular total score (e.g. 80/100) with colour ring
- Breakdown bars: Trade Type / Experience / Certifications / Safety / English
- Each bar shows score + max (e.g. 18/25)

### RAG Chat Panel
- Slide-in overlay from right side
- Input field: "Ask about this candidate's documents..."
- Response with source document citations (document name + excerpt)
- Scope notice: "Answers based only on this candidate's uploaded documents"

---

## 6. Mobile Responsiveness

The MVP can be **desktop-first** but should be usable on tablet (1024px minimum).
Candidate-facing screens should be **mobile-friendly** (many candidates will use phones).
Admin/Case management screens are desktop only for MVP.

---

## 7. Figma Deliverables Expected

- [ ] Component library / design system (colours, typography, buttons, form elements, cards, badges)
- [ ] Wireframes for all Priority 1 screens (greyscale, low-fi)
- [ ] High-fidelity mockups for:
  - Candidate Profile Builder
  - Employer Candidate Search
  - Company Admin Dashboard
  - Visa Case Detail
- [ ] Mobile versions of Candidate screens
- [ ] Prototype flow: Registration → Profile → Published → EOI received

---

## 8. Document Group & Type Reference (for Checklist UI)

**Document Groups (tabs/sections):**
- Identity
- Education & Trade
- Work Experience
- English Language
- Character & Health
- Skills Assessment
- EOI Information
- Visa Application

**Example document types per group:**

| Group | Document Types |
|---|---|
| Identity | Passport, CNIC, FRC |
| Education & Trade | Trade Certificate, Apprenticeship Certificate, Academic Transcript, Vocational Certificate |
| Work Experience | Employment Reference, Payslip, Bank Statement, Tax Record, EOBI Record |
| English Language | English Test Result |
| Character & Health | Police Certificate, Medical Result |
| Skills Assessment | Skills Assessment Result |
| Visa Application | Form 80, Form 1221, Proof of Funds, Visa Fee Receipt |

---

## 9. Key User Journey Flows to Prototype in Figma

**Flow 1 — Candidate Onboarding**
Register → Verify Email → Complete Profile → Upload Documents → Accept Consent → Publish Profile

**Flow 2 — Employer Finds Candidate**
Login → Search Candidates → Filter by Electrician → View Profile → Submit EOI

**Flow 3 — Visa Case Management**
Company Admin logs in → Opens new case → Links to candidate → Uploads documents → Moves status → Adds notes

**Flow 4 — Migration Agent Reviews Case**
Login → Case Queue → Opens case → Reviews document checklist → Uploads missing doc → Adds note → Moves to Under Review
