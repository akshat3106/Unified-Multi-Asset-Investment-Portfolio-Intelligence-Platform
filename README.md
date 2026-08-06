# AssetBridge — Unified Multi-Asset Investment Portfolio Intelligence Platform

AssetBridge is a unified platform that brings equities, mutual funds, and gold investments together in a single dashboard, paired with AI-powered portfolio analysis and financial education tools. It's built for investors who want a consolidated view of their holdings, real-market data, and actionable, explainable insights — without needing to jump between multiple broker apps.

**Live demo:** https://unified-multi-asset-investment.vercel.app/

---

## Features

- **Unified Dashboard** — View equities, mutual funds, and gold holdings in one place, with live pricing sourced from Yahoo Finance.
- **Portfolio Performance Tracking** — Historical portfolio value reconstruction from per-symbol historical prices, so growth charts reflect true past performance rather than a static snapshot.
- **AI Portfolio Analyzer** — A FastAPI microservice that evaluates diversification, computes a risk profile, generates a portfolio health score, and produces recommendations — all logged to an audit trail for transparency.
- **Finance Education Bot** — A retrieval-augmented generation (RAG) chatbot that answers financial literacy questions using a curated document set (RBI guidelines, KYC/DPDP regulations, market booklets, etc.), with built-in guardrails to avoid giving personalized investment advice.
- **Audit Logging** — Per-user audit trail of portfolio actions and AI-generated recommendations.
- **Broker Deep-Links & Advisor Access** — Quick links out to broker platforms and a human-advisor CTA, alongside self-serve AI tools.
- **Firebase Authentication** — Secure sign-in with backend token verification via Firebase Admin SDK.
- **Account Linking** — Link external accounts through a dedicated dropdown flow in the dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS + Vite, Chart.js, Lucide Icons |
| Backend API | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Authentication + Firebase Admin SDK |
| Market Data | Yahoo Finance (`yahoo-finance2`) |
| AI — Portfolio Analyzer | Python, FastAPI |
| AI — Finance Education Bot | Python, FastAPI, RAG (Qdrant vector store + Groq LLM) |
| Deployment | Vercel (frontend), Render (backend/AI services) |

---

## Project Structure

```
.
├── frontend/                  # Vite-powered frontend (dashboard, portfolio views, chat UI)
│   ├── api/                   # API client + service layer for talking to the backend
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── backend/                   # Express REST API
│   └── src/
│       ├── config/            # DB + Firebase configuration
│       ├── controllers/       # Route handlers (users, market, chat, portfolio, audit log)
│       ├── middleware/        # Auth middleware (Firebase token verification)
│       ├── models/            # Mongoose schemas (User, Holding, Transaction, Goal, etc.)
│       ├── routes/            # Express route definitions
│       ├── services/          # Market data service + provider integrations
│       └── scripts/           # One-off maintenance/seeding scripts
│
├── AI_models/
│   ├── Portfolio-Analyzer/    # FastAPI service: diversification, risk, health score, recommendations
│   ├── Finance-Education-Bot/ # FastAPI service: RAG-based financial literacy chatbot
│   └── documents/             # Source documents used for the education bot's knowledge base
│
└── .env.example                # Environment variable reference
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+ (with `uv` recommended for the AI services)
- A MongoDB instance (Atlas or local)
- A Firebase project (for authentication)
- API keys: Groq (LLM) and Qdrant (vector DB) for the AI services

### 1. Clone and configure environment variables

```bash
git clone https://github.com/akshat3106/Unified-Multi-Asset-Investment-Portfolio-Intelligence-Platform.git
cd Unified-Multi-Asset-Investment-Portfolio-Intelligence-Platform
cp .env.example .env
```

Fill in `.env` with your MongoDB URI, Firebase Admin SDK credentials, Firebase web config, Groq API key, and Qdrant credentials.

### 2. Run the backend

```bash
cd backend
npm install
npm run dev
```

The API starts on `http://localhost:5000` by default (health check at `/api/health`).

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and reads `VITE_API_BASE_URL` from the shared root `.env`.

### 4. Run the AI services (optional, for portfolio analysis / chatbot)

```bash
cd AI_models/Portfolio-Analyzer
uv sync   # or: pip install -r requirements.txt
uv run fastapi dev main.py

cd ../Finance-Education-Bot
uv sync   # or: pip install -r requirements.txt
uv run fastapi dev api.py
```

---

## API Overview

The backend exposes the following route groups under `http://localhost:5000`:

| Route | Description |
|---|---|
| `GET /api/health`, `/api/v1/health` | Health check |
| `POST /api/users/sync` | Sync authenticated user profile |
| `DELETE /api/users/me` | Delete account |
| `GET /api/market/search`, `/quote/:symbol`, `/chart/:symbol` | Market data lookups |
| `GET /api/market/indices`, `/mutual-funds/catalog`, `/equities/catalog`, `/gold/catalog` | Market catalogs |
| `GET /api/v1/portfolio/holdings`, `/performance` | Authenticated portfolio data |
| `POST /api/v1/portfolio/analyze` | Trigger AI portfolio analysis |
| `POST /api/v1/chat` | Chat with the finance education bot |
| `GET /api/v1/audit-log` | Retrieve audit log entries |

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
