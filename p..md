# Botivate AI Workspace - Unified Single-Port Architecture Analysis & Setup

## 1. Executive Summary

This document provides a comprehensive analysis of the Botivate AI Workspace repository, detailing its current working logic, functionality, and flow. Furthermore, it outlines a new **Unified Single-Port Combined Architecture** along with a **Centralized Global Configuration Flow**. This adapts the entire platform to run precisely equivalent functionalities—without missing any features—through a single combined port (e.g., Port `8000`). It also completely eliminates the redundant setup process by isolating "Global Workspace Company Details" from "Agent-Specific Database/Details", ensuring a seamless, one-time initial setup for any company.

---

## 2. Current Architecture & Flow Analysis

Currently, Botivate employs a dynamic Micro-Frontend and Multi-Service architecture driven by `config/workspace.config.json` and agent-specific `.env` files.

### Existing Components & Ports:

1. **Main Shell (Frontend)**: React 18, Vite, Tailwind. Runs on **Port 3000**.
2. **Gateway API (Backend)**: FastAPI. Runs on **Port 9000**. Connects everything, processes the central config.
3. **Agent 1: HR Recruiter & Screener**:
   - Backend: FastAPI (Port **8000**).
   - Frontend: Vanilla JS/HTML served via the same port 8000.
   - Setup: Has its own `.env` for API keys and SMTP.
4. **Agent 2: HR Employee Support**:
   - Backend: FastAPI, LangGraph, RAG (Port **8001**).
   - Frontend: React + Vite (Port **5175**).
   - Setup: Has its own `.env` for API keys, SMTP, Google Auth, DB, etc.

### Existing Setup Problem: Redundancy

Presently, if a company wants to deploy this workspace, they have to set up OpenAI keys, SMTP emails, and Company details individually for _both_ HR Recruiter and HR Support. This is redundant and error-prone.

---

## 3. The New Configuration Flow: Global Setup vs. Agent-Specific Setup

To solve the redundancy problem, the system will use a **Pre-Startup Global Setup** approach. The workspace collects common company details exactly **once** before the system starts, saving them globally. Agents then only request the specific integrations they uniquely need.

### 3.1 Global Workspace Setup (One-Time Input)

When the workspace is initialized for a company, it takes these global inputs:

- **Company Identity**: Company Name, Theme/Colors, Tagline, Subdomain.
- **Global API Credentials**: OpenAI API Key, Groq API Key, HuggingFace Token.
- **Global Communication**: Base SMTP User and Password (default email used by the system).
- **Core App Secrets**: JWT Secret Keys.

_These details are stored at the root level (in a master `.env` or `global_config.json`) and shared seamlessly across all agents. No agent will ever ask for the OpenAI key or company name again._

### 3.2 Agent-Specific Setup (Granular Input)

Agents will strictly only ask for links, configurations, or databases that are unique to their specific workflow.

- **HR Support Agent**: Only requires the `Google Sheets Database Link` (Service Account JSON) and its local `DATABASE_URL`.
- **HR Recruiter Agent**: Only requires its specific `Inbox Connection` if it needs to read from a specific recruitment email, or specific `Job Description Data Sources`.

**Execution Logic**: The `plugin_loader.py` or central FastAPI app reads the Master Global Config, and during the initialization of each agent, passes down these global variables. The agents then merge them with their own agent-specific configurations.

---

## 4. The New Unified Logic: Single-Port Execution

To transition all services into **a single port**, we adapt a **Monolithic Single-Server Strategy** using FastAPI as the central orchestrator routing both API calls and Static Frontend files.

### New Target Architecture:

- **Server**: FastAPI
- **Assigned Port**: `8000` (for completely everything: All Backends, Gateway, and All Frontends).

### Logic & Flow Redesign (The Combined Strategy):

1. **The Core FastAPI App (`main.py`)**: A single Uvicorn instance spinning up an `app = FastAPI()` object.
2. **API Namespace Separation**: Instead of multiple ports, we use sub-routing:
   - `/api/gateway/*` -> Replaces Gateway Port 9000.
   - `/api/recruiter/*` -> Replaces Recruiter Backend Port 8000 API logic.
   - `/api/hr-support/*` -> Replaces HR Support Backend Port 8001 logic.
3. **Frontend Unified Serving**: We will pre-build all React applications (`npm run build`) and mount their `dist` directories directly onto the FastAPI server.
4. **Root Fallback UI Router**: The React shell iframe logic is updated to simply target `/static/recruiter/index.html` and `/static/hr-support/index.html` instead of network ports like `http://localhost:5175`.

---

## 5. Comprehensive Setup Instructions & Code Strategy

### Step 1: Pre-Build Frontends

Because we no longer run live dev-servers for each node app, we must compile them:

```powershell
# Build Main Shell
cd frontend && npm install && npm run build

# Build HR Support Frontend
cd ../HR_Support/frontend && npm install && npm run build
cd ../..
```

### Step 2: Unified Backend Setup

Create a unified virtual environment for the single monolithic service at the absolute root of AI-WorkSpace:

```powershell
# Create venv and install all requirements collectively
uv venv --python 3.10
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
pip install -r HR_Support/backend/requirements.txt
pip install -r Resume-Screening-Agent/requirements.txt
python -m spacy download en_core_web_sm
```

### Step 3: Centralized Environment Details (`.env`)

A **single `.env` at the root folder** handles all Global Configurations. Agent-specific databases are separated logically.

```env
# ==========================================
# BOTIVATE UNIFIED SYSTEM - MASTER CONFIG
# ==========================================
# --- GLOBAL WORKSPACE DETAILS (Taken Once) ---
COMPANY_NAME="Acme Corp"
APP_NAME="Botivate AI Workspace"
PORT=8000

# --- GLOBAL API KEYS ---
OPENAI_API_KEY="sk-proj-**********"
GROQ_API_KEY="gsk_*********"
HUGGINGFACE_API_TOKEN="hf_********"

# --- GLOBAL SMTP/EMAIL ---
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="team@botivate.com"
SMTP_PASSWORD="16-char-app-password"

# --- GLOBAL SECRETS ---
JWT_SECRET_KEY="32-char-random-string"

# ==========================================
# AGENT SPECIFIC SETUP (Only Unique Links)
# ==========================================
# HR Support Database & Google Integrations
HRSUPPORT_DB_URL="sqlite+aiosqlite:///./data/hr_support.db"
HRSUPPORT_GOOGLE_SERVICE_JSON="./credentials/google/service-account.json"
HRSUPPORT_GOOGLE_OAUTH_REDIRECT="http://localhost:8000/api/hr-support/oauth/callback"

# HR Recruiter Specifics (if any unique DB is needed later)
RECRUITER_DB_URL="sqlite+aiosqlite:///./data/recruiter.db"
```

### Step 4: The Merged FastAPI Application Structure (`server.py`)

A `server.py` file must be generated at the root that explicitly maps sub-routers and injects global config into them.

```python
# Pseudo-Logic for Unified Single-Port server.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Import existing backend apps routers
from hr_support.routers import hr_router
from resume_screening.routers import resume_router
from gateway.routers import gateway_router

app = FastAPI(title="Botivate Single-Port Unified System")

# 1. API Rounting Map
app.include_router(gateway_router, prefix="/api/config")
app.include_router(hr_router, prefix="/api/hr-support")
app.include_router(resume_router, prefix="/api/recruiter")

# 2. Frontend Static Mounts Map (Serving Pre-Built React Code)
app.mount("/hr-support-app", StaticFiles(directory="HR_Support/frontend/dist", html=True), name="hr_support_ui")
app.mount("/recruiter-app", StaticFiles(directory="Resume-Screening-Agent/Frontend", html=True), name="recruiter_ui")
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="shell_ui")
```

### Step 5: Start Implementation

Start the combined server simply with:

```powershell
uvicorn server:app --port 8000 --reload
```

- Shell Access: `http://localhost:8000/`
- HR Backend API: `http://localhost:8000/api/hr-support/...`
- Health: `http://localhost:8000/docs`

---

## 6. Modifications Required for 100% Identical Parity

1. **Startup Prompt / Configuration Loader**:
   - Write a `workspace_setup.py` that runs before the server starts. It asks the user for the Global Configurations once, writes them to the root `.env`, and for each active agent, asks _only_ for its specific database links.
2. **`workspace.config.json`**:
   - Alter the URLs inside `frontend.url` from `http://localhost:5175` to endpoint relative `/hr-support-app`.
   - Remove specific `port` assignments, everything uses port 8000 now.
3. **React API Fetching**:
   - In `HR_Support/frontend/.env`, set `VITE_API_URL="/api/hr-support"`.
   - Update `frontend/src` to call `/api/config` instead of `http://localhost:9000/api/config`.
4. **Google Security Console**:
   - Update OAuth Redirect URIs from Port 5175 to the Single Port `http://localhost:8000/api/hr-support/oauth/callback`.
5. **Shell Code iframe mapping**:
   - Focus the iframes on relative URLs (`/recruiter-app/index.html`) rather than absolute network ports.

**Conclusion**: This updated architecture completely unifies the Botivate system into a single background process (Port 8000) and structurally separates Global Company Setup from Agent-Specific Setup. Companies now enter their API keys, Company IDs, and SMTP details exactly once at the workspace level, completely avoiding redundant setup per AI system.