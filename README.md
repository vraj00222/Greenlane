# 🌿 GreenLane

> **AI-powered Chrome extension for sustainable shopping — with on-device private analysis via Meta ExecuTorch**

Built for **SFHacks 2026** 🏆

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/vraj00222/Greenlane)
[![Meta ExecuTorch](https://img.shields.io/badge/Meta-ExecuTorch-0668E1?logo=meta&logoColor=white)](https://github.com/pytorch/executorch)
[![Llama 3.2](https://img.shields.io/badge/Llama_3.2-1B-blueviolet)](https://llama.meta.com)

---

## 🎯 Problem

Every purchase has an environmental impact, but consumers have no way to know:
- How sustainable is this product?
- Are there greener alternatives?
- Can I get sustainability insights **without sharing my shopping data**?

## 💡 Solution

**GreenLane** is a Chrome extension + web dashboard that analyzes products on Amazon in real-time, scores their sustainability (0–100), recommends greener alternatives, and tracks your eco-impact with gamified achievements.

### 🔒 Go Private Mode — On-Device AI with Meta ExecuTorch

GreenLane's standout feature is **Go Private** mode: a toggle that switches all AI analysis from the cloud to a **locally-running Llama 3.2 1B model** powered by [Meta ExecuTorch](https://github.com/pytorch/executorch).

- **Your data never leaves your device** — no product URLs, no browsing history, no shopping patterns sent to any server
- **Llama 3.2 1B** runs inside a Docker container on your machine via ExecuTorch's optimized runtime
- **Purple-themed UI** clearly indicates when you're in private mode
- **No account required** — private analysis works without login
- **Scans are never saved** to the dashboard or any database

When private mode is off, GreenLane uses cloud AI (DeepSeek V3 via Novita AI) for richer analysis and saves your scan history to the dashboard.

---

## 🏗️ Architecture

```
┌──────────────────────────┐
│    Chrome Extension      │
│    (Plasmo / React / TS) │
│  ┌────────────────────┐  │
│  │   🟢 Cloud Mode    │──┼──── HTTPS ────┐
│  │   🟣 Private Mode  │──┼──── Local ──┐ │
│  └────────────────────┘  │             │ │
└──────────────────────────┘             │ │
                                         │ │
              ┌──────────────────────────┘ │
              │                            │
              ▼                            ▼
┌──────────────────────┐   ┌──────────────────────────────────┐
│ ExecuTorch LLM       │   │     Backend API (Express/TS)     │
│ Docker Container     │   │  POST /api/analyze-product       │
│ (Llama 3.2 1B)       │   │  POST /api/scans                 │
│ Port 8765            │   │  GET  /api/users/:id             │
│ 🔒 100% Local        │   └──────────────────────────────────┘
└──────────────────────┘             │                   │
                                ┌────▼────┐         ┌────▼────┐
                                │Novita AI│         │ MongoDB │
                                │DeepSeek │         │         │
                                └─────────┘         └─────────┘
                                                         ▲
                                                         │
                              ┌──────────────────────────┘
                              │   Dashboard (Next.js)
                              │   Stats · History · Achievements · Leaderboard
                              └──────────────────────────
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Extension** | TypeScript, React, [Plasmo](https://plasmo.com) (Chrome MV3) |
| **Backend** | Node.js, Express, TypeScript |
| **Dashboard** | Next.js 15, React, Tailwind CSS, shadcn/ui |
| **Database** | MongoDB (Mongoose) |
| **Cloud AI** | Novita AI — DeepSeek V3 / Llama 3.1 / Qwen (auto-fallback) |
| **Local AI** | Meta ExecuTorch + Llama 3.2 1B (on-device, Docker) |
| **Vector Search** | Actian Vector DB (eco-product alternatives) |

---

## 📁 Project Structure

```
greenlane/
├── extension/              # Chrome extension (Plasmo MV3)
│   ├── popup.tsx           # Main popup UI (analysis, settings, Go Private toggle)
│   ├── background.ts       # Service worker (auth, caching, scan recording)
│   ├── contents/           # Content scripts (Amazon product scraping)
│   └── assets/             # Icons and images
├── backend/                # Express API server
│   ├── src/server.ts       # Main entry point (port 3001)
│   ├── src/services/       # Novita AI + Actian Vector integrations
│   ├── src/models/         # MongoDB schemas (User, Product, Scan, Achievement)
│   └── src/routes/         # REST API routes
├── dashboard/              # Next.js web dashboard
│   ├── src/app/            # App router pages (home, history, achievements, leaderboard)
│   ├── src/components/     # React components (charts, sidebar, stats)
│   └── src/lib/            # API client, SWR hooks, auth context
├── local-llm/              # On-device ExecuTorch inference
│   ├── server_docker.py    # Python inference server (Llama 3.2 1B, port 8765)
│   ├── Dockerfile          # ExecuTorch Docker image (ARM64)
│   ├── docker-compose.yml  # One-command container startup
│   └── models/             # Model metadata + tokenizer (2.3GB .pte excluded)
├── shared/                 # Shared TypeScript types
│   └── types/index.ts      # ProductData, SustainabilityAnalysis, etc.
└── README.md
```

> See [CODEBASE.md](CODEBASE.md) for detailed file-by-file documentation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Chrome** browser
- **MongoDB** (local or Atlas)
- **Docker** (for Go Private / ExecuTorch — optional)
- **Novita AI** API key (for cloud mode)

### 1. Clone & Install

```bash
git clone https://github.com/vraj00222/Greenlane.git
cd Greenlane
pnpm install
```

### 2. Configure Environment

```bash
# Backend — set your API keys
cp backend/.env.example backend/.env

# Extension (optional)
cp extension/.env.example extension/.env
```

### 3. Start Services

```bash
# Terminal 1: MongoDB (if not already running)
mongod

# Terminal 2: Backend API (port 3001)
cd backend && pnpm dev

# Terminal 3: Dashboard (port 3002)
cd dashboard && pnpm dev

# Terminal 4: Extension (dev build with hot reload)
cd extension && pnpm dev
```

### 4. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `extension/build/chrome-mv3-dev`

### 5. Enable Go Private Mode (Optional)

Run the local ExecuTorch LLM server to enable on-device analysis:

```bash
# One-command Docker setup (downloads ~2.3GB model on first run)
cd local-llm
./docker-run.sh

# Or with Docker Compose:
docker compose up -d
```

Once the container is running on port 8765, toggle **Go Private** in the extension to switch to local AI.

---

## 🎮 How It Works

1. **Browse** → Visit any product page on Amazon
2. **Click** → Open the GreenLane extension popup
3. **Analyze** → AI scores the product's sustainability (0–100)
4. **Discover** → View greener alternatives with comparison scores
5. **Choose** → Log your decision (purchased / skipped / chose alternative)
6. **Track** → See your eco-impact on the dashboard
7. **Earn** → Unlock achievements and climb the leaderboard

### Cloud Mode vs. Private Mode

| | 🟢 Cloud Mode | 🟣 Private Mode |
|---|---|---|
| **AI Model** | DeepSeek V3 (via Novita AI) | Llama 3.2 1B (ExecuTorch) |
| **Where it runs** | Remote API server | Docker container on your machine |
| **Data sent** | Product info sent to cloud API | Nothing leaves your device |
| **Dashboard** | Scans saved to history | Nothing saved anywhere |
| **Account needed** | Yes (email login) | No |
| **Theme** | Green | Purple |

---

## 🌱 Sustainability Scoring

GreenLane uses a **15-metric scoring system** (max 100 points):

| # | Metric | Points | Description |
|---|--------|--------|-------------|
| 1 | **Recycled Content** | 0–10 | Percentage of recycled materials |
| 2 | **Natural/Organic Materials** | 0–8 | Bamboo, hemp, organic cotton, etc. |
| 3 | **Product Durability** ⭐ | 0–12 | Expected lifespan (highest-weighted) |
| 4 | **Repairability** | 0–6 | Ease of repair, parts availability |
| 5 | **End-of-Life Disposal** | 0–8 | Recyclability or compostability |
| 6 | **Energy Efficiency** | 0–8 | Power consumption during use |
| 7 | **Certifications** | 0–10 | B-Corp, Fair Trade, FSC, Energy Star |
| 8 | **Packaging** | −5 to +5 | Minimal packaging (+) vs. excessive plastic (−) |
| 9 | **Manufacturing Impact** | 0–8 | Clean production, renewable energy |
| 10 | **Water Footprint** | 0–5 | Water usage in production |
| 11 | **Ethical Sourcing** | 0–8 | Supply chain ethics, fair wages |
| 12 | **Biodegradability** | 0–7 | Material breakdown in environment |
| 13 | **Toxicity** ⚠️ | −10 to 0 | Penalty for BPA, lead, phthalates |
| 14 | **Brand Record** | 0–8 | Company sustainability initiatives |
| 15 | **Carbon Footprint** | −5 to +5 | Carbon neutral (+) vs. high emissions (−) |

**Score Ranges:** 🟢 75–100 Excellent · 🟡 50–74 Good · 🟠 25–49 Fair · 🔴 0–24 Poor

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/analyze-product` | Analyze product sustainability (cloud AI) |
| `POST` | `/api/scans` | Record a product scan |
| `GET` | `/api/users/:id` | Get user profile & stats |
| `GET` | `/api/scans/user/:id` | Get user scan history |
| `GET` | `/api/achievements/user/:id` | Get user achievements |
| `GET` | `/api/users/leaderboard/top` | Leaderboard rankings |

**ExecuTorch Local Endpoints** (port 8765):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Model status, inference readiness |
| `POST` | `/analyze` | Run on-device sustainability analysis |

---

## 🧪 Testing

```bash
# Health checks
curl http://localhost:3001/health          # Backend
curl http://localhost:8765/health          # ExecuTorch LLM

# Cloud analysis
curl -X POST http://localhost:3001/api/analyze-product \
  -H "Content-Type: application/json" \
  -d '{"productTitle": "Organic Cotton T-Shirt", "brand": "EcoWear"}'

# Local / private analysis (ExecuTorch)
curl -X POST http://localhost:8765/analyze \
  -H "Content-Type: application/json" \
  -d '{"productTitle": "Bamboo Cutting Board", "materials": "bamboo"}'
```

---

## 👥 Team

Built with 💚 at SFHacks 2026

---

## 📄 License

MIT
