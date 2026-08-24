# StockPulse — AI-Powered Inventory & Dynamic Pricing System

StockPulse is an intelligent inventory management platform that helps businesses track stock, detect low-inventory situations automatically, and get AI-driven pricing and reorder recommendations — with a manager able to accept or reject every suggestion before it takes effect.

Built as part of an AI-assisted development exercise, using Cline (AI coding agent) inside VS Code to build, debug, and iterate on the full stack.

---

## 🎯 Problem Statement

Businesses managing physical inventory face two recurring problems:
1. They don't notice stock running low until it's too late (lost sales, stockouts).
2. Pricing decisions during high-demand or low-stock situations are reactive and manual.

StockPulse solves this by automatically watching stock levels and demand patterns, and generating AI-backed pricing/reorder suggestions the moment a risk condition is detected — while keeping a human in the loop for the final decision.

---

## 🧩 Core Features

| Feature | Description |
|---|---|
| Product Management | Create, edit, delete, and view products (SKU, category, price, stock, thresholds) |
| Inventory Tracking | Stock IN / Stock OUT operations with full history snapshots |
| Low-Stock Detection | Automatically flags products crossing their reorder threshold |
| Demand Velocity Tracking | Tracks how fast a product is selling |
| AI Pricing Suggestions | Recommends price increase/decrease based on stock + demand signals |
| AI Reorder Suggestions | Recommends how much stock to reorder and why |
| Accept / Reject Workflow | Manager reviews every AI suggestion before it's applied — nothing changes automatically |
| Dashboard Analytics | Live view of total products, low stock, out of stock, and inventory value |

---

## 🏗️ Tech Stack

**Frontend:** React (Vite)
**Backend:** Node.js + Express
**Database:** MongoDB (Mongoose) — with automatic local JSON fallback
**AI Layer:** LLM API — with a deterministic local recommendation engine as fallback

---

## 🧠 Why Two Fallback Systems? (Important design decision)

This is the most important architectural decision in the project, and it's worth explaining clearly:

### 1. Database Fallback
MongoDB Atlas can be unreachable (network/firewall issues, IP allowlist delays, etc.). Instead of letting the whole app crash when that happens, StockPulse:
- Tries to connect to MongoDB first.
- If it fails, it **automatically switches to a local JSON file** (`server/data/demoData.json`) as a lightweight database substitute.
- The app **always knows which mode it's in** and logs it clearly (`MongoDB Connected` vs `MongoDB unavailable — using local demo storage`).
- Every controller checks the current mode before querying, so both paths behave identically from the user's perspective.

**Why this matters:** a production inventory system cannot go down just because a database connection blips. Graceful degradation > hard crash.

### 2. AI Fallback
The external LLM can be unavailable (rate limits, budget caps, network issues). Instead of failing the "AI suggestion" feature entirely, StockPulse:
- Tries calling the LLM first for pricing/reorder reasoning.
- If that call fails, it falls back to a **deterministic rule-based recommendation engine** (e.g., if stock is low and demand velocity is high → recommend a price increase with a clear, human-readable justification).
- The user always sees a suggestion with a confidence score and reasoning — they never know or care whether it came from the LLM or the local engine.

**Why this matters:** the "intelligence" of the app shouldn't be a single point of failure. A rules-based safety net keeps the feature usable end-to-end.

---

## 🔄 How a Suggestion Gets Created (End-to-End Flow)

```
User does Stock OUT (sale/shipment)
        ↓
Product stock level updates
        ↓
System checks: did stock just cross below the reorder threshold?
        ↓ (yes)
generatePricingSuggestion() + generateReorderSuggestion() are triggered
        ↓
Try LLM → if it fails → use local rule-based engine
        ↓
Suggestion saved with status = PENDING
        ↓
Manager sees it on the Suggestions page
        ↓
Manager clicks Accept → price/reorder is applied, status = ACCEPTED
Manager clicks Reject → nothing changes, status = REJECTED
```

---

## 📡 API Endpoints

**Products**
- `GET /api/products` — list all products
- `POST /api/products` — create product
- `GET /api/products/:id` — get one product
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — delete product
- `PATCH /api/products/:id/stock` — stock IN/OUT

**Suggestions**
- `GET /api/suggestions/pricing` — pending pricing suggestions
- `PATCH /api/suggestions/pricing/:id/accept`
- `PATCH /api/suggestions/pricing/:id/reject`
- `GET /api/suggestions/reorder` — pending reorder suggestions
- `PATCH /api/suggestions/reorder/:id/accept`
- `PATCH /api/suggestions/reorder/:id/reject`

**Dashboard**
- `GET /api/dashboard/stats` — aggregate stats for the dashboard

---

## ▶️ Running the Project

**Backend**
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:2000`

**Frontend**
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`

No environment setup is required for the demo to work — if MongoDB or the LLM API isn't reachable, the app automatically uses its local fallbacks and pre-seeds demo product data.

---

## 🗣️ How to Explain This in Simple Terms (for the demo/viva)

Use this if someone asks "walk me through it":

> "StockPulse is an inventory app. You add products, and when stock runs low, it automatically suggests two things — should I change the price, and how much should I reorder. It uses an AI model to generate that suggestion, but if the AI is down, it falls back to a simple rule: low stock + high demand = suggest a price increase; excess stock + low demand = suggest a price cut. Same idea for the database — if MongoDB isn't reachable, it just saves everything to a local file instead of crashing, so the demo always works. Every suggestion needs a human to accept or reject it — the AI never changes prices on its own."

**If asked "why build two fallback systems?"**
> "Because in a real business, you can't have your pricing engine or your inventory system go down just because one external dependency (a database or an API) is temporarily unavailable. This shows resilience — the same design pattern (try the ideal path, fall back to a reliable local path, always be transparent about which one is active) is used for both the database and the AI layer."

**If asked "what would you improve with more time?"**
> "Move the local JSON fallback to something like SQLite for better concurrency handling, add authentication/roles for who can accept suggestions, and add real historical sales data to make the demand velocity calculation more accurate instead of the simplified version currently used."

---

## 📁 Project Structure

```
ZycusProject/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Dashboard, Products, Suggestions
│       ├── components/
│       ├── services/       # API calls
│       └── hooks/
├── server/                 # Node.js + Express backend
│   ├── config/db.js        # MongoDB connection + fallback logic
│   ├── controllers/        # Product, Suggestion, Dashboard controllers
│   ├── models/              # Mongoose schemas
│   ├── utils/
│   │   ├── llmService.js   # LLM API wrapper
│   │   └── localStorage.js # JSON-file fallback "database"
│   └── data/demoData.json  # Auto-generated local fallback data
└── README.md
```

---

## 🔐 Note on Credentials

The LLM API key used for this project is passed via environment variables (`.env`, not committed to GitHub) and is never hardcoded in source.