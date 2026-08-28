# 🚗 Vaahan Saarthi — Vehicle Ownership Operating System for India

An AI-powered, India-focused **Vehicle Lifecycle Super App**. Add a vehicle once
and it becomes a **digital twin** — Vaahan Saarthi helps you across the entire journey:

> **Buy → Register → Insure → Maintain → Comply → Travel → Sell → Transfer → Scrap**

Built by combining the two product blueprints (`FULL_RTO_Vehicle_AI_India_Product_Blueprint.md`
and `RTO-Vehicle-AI-Product-Plan.md`) into a single, best-of-both experience.

---

## 🔐 Demo & admin accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | `admin@vaahansaarthi.com` | `Admin@123` | LLM model configuration only (Settings page). No vehicle data. |
| **Demo user 1** | `himanshu@example.com` | `demo123` | Full seeded garage — 3 vehicles, documents, challans |
| **Demo user 2** | `priya@example.com` | `demo123` | Empty garage — ideal for testing a new user |

- **LLM settings** (`/settings`) are visible and editable **only for Admin**.
- The model the admin selects applies **globally** to all users' AI assistant and agent calls.
- Demo user credentials are also shown as quick-login buttons on the login page.

---

## ✨ Highlights

- **Agentic AI assistant** — an orchestrator classifies your intent and routes it to
  one of **8 specialized agents** (Vehicle Intelligence, RTO Rules, Compliance,
  Document, Buying Advisor, Maintenance, Selling, Scrapping) with contextual **action cards**.
- **Azure OpenAI GPT** integration, with an **intelligent rule-based fallback** so the
  app is fully usable out of the box — no keys required.
- **Digital Vehicle Twin** — Vehicle 360° profile: identity, compliance, documents,
  financials & timeline.
- **My Garage** — add a vehicle by number (**RTO + web lookup**), **RC upload with OCR.space + AI extraction**, or manually.
- **Buying Advisor** — AI vehicle finder wizard, EV vs Petrol vs CNG vs Diesel 5-year
  cost projection, EMI calculator, on-road price calculator (state-wise).
- **RTO Workflow Engine** — interactive, state-aware workflows generate personalized
  checklists (forms, documents, steps, fees, timelines).
- **Smart Document Vault**, **Challan Center** (plain-language explanations),
  **Insurance AI**, **Maintenance & TCO tracker**, **Sell wizard + transfer tracker**,
  **Accident Assistant**, **Scrapping module**, **Travel Assistant**.
- **Fun, viral, animated UI** — dark AI-first theme, aurora glows, animated hero,
  scroll reveals, marquee, animated compliance rings and counters (Framer Motion),
  inspired by unitedcarriers.com's bold typographic motion design.

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | **React + Vite + TypeScript**, **Bootstrap 5**, **Framer Motion**, Recharts, React Router |
| Backend | **Python FastAPI**, Pydantic v2 |
| AI | **Azure OpenAI GPT** (optional) + agentic orchestrator with rule-based fallback |
| Data | Seeded in-memory store (demo) |

---

## 🚀 Run locally

### 1. Backend (FastAPI) — runs on port **8020**

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8020
```

(Optional) To enable real Azure OpenAI responses, copy `.env.example` to `.env`
and fill in your credentials:

```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

> Without keys, the AI layer automatically uses a smart rule-based fallback.

### 2. Frontend (React + Vite) — runs on port **5199**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5199**. The Vite dev server proxies `/api` → `http://127.0.0.1:8020`.

---

## 🗺️ App map

| Route | Module |
|---|---|
| `/` | Animated landing page |
| `/dashboard` | Home dashboard (greeting, scores, reminders, quick actions, timeline) |
| `/garage`, `/garage/:id` | My Garage & Vehicle 360° profile |
| `/buy` | Buying advisor wizard + fuel/EMI/on-road calculators |
| `/rto` | RTO workflow engine |
| `/documents` | Smart Document Vault (upload + OCR pipeline) |
| `/challans` | Challan Center |
| `/insurance` | Insurance AI (coverage, analyzer, quotes) |
| `/maintenance` | Maintenance & Total Cost of Ownership |
| `/sell` | Sell wizard + ownership transfer tracker |
| `/accident` | Accident Assistant |
| `/scrap` | Scrapping module + RVSF locator |
| `/travel` | Travel Assistant |
| `/agents` | **RTO Agent Marketplace** — filterable directory of agents |
| `/settings` | **AI Settings** — pick the LLM model used for all calls |

The floating **✨ AI Assistant** is available on every app page.

### 🔧 LLM model selector (Settings)

Pick the model used for **every** LLM call (assistant, agents, live-search synthesis)
at runtime from **⚙️ Settings** — no restart needed. Ships with GPT-5.4, GPT-4o,
GPT-4o mini, GPT-4.1, o4-mini (reasoning) and Codex, and you can **add a custom
model/deployment** by name. If a chosen model isn't deployed on your Azure resource,
Vaahan Saarthi safely falls back to the rule-based engine for that call.

API: `GET /api/ai/models`, `POST /api/ai/models/select`, `POST /api/ai/models/add`.

### 🧑‍💼 RTO Agent Marketplace

A directory of verified RTO agents who can perform tasks on your behalf, filterable and
sortable by:
- ⭐ star rating & number of reviews
- 📍 area / city
- 🧰 service / work type (transfer, NOC, address change, HSRP, scrapping…)
- 💰 charges, ⚡ response time, 🏁 turnaround time
- ✅ tasks completed, 🎖 years of experience
- 🛡 **RTO-authorized** & verified badges, 🟢 online status

API: `GET /api/rto-agents?area=&service=&min_rating=&max_charges=&sort=…`

---

## 🔐 Notes & disclaimers

- Vehicle data, valuations and OCR are **demo/simulated** for this build.
- AI outputs are **guidance, not official confirmations**. Real deployments should
  integrate VAHAN / Sarathi / DigiLocker / e-Challan via an abstraction gateway and
  comply with India's DPDP Act, 2023.
