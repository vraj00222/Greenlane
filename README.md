# 🌿 GreenLane

> **AI-powered Chrome extension helping users make sustainable shopping choices**

Built for **SFHacks 2026** 🏆

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Problem

Every purchase has an environmental impact, but it's nearly impossible for consumers to know:
- How sustainable is this product?
- Are there greener alternatives?
- What's my overall shopping footprint?

## 💡 Solution

**GreenLane** is a Chrome extension + web dashboard that:

1. **Analyzes products** on shopping sites (Amazon, etc.) using AI
2. **Scores sustainability** (0-100) based on materials, brand practices, and certifications
3. **Recommends greener alternatives** using semantic search
4. **Tracks your green choices** and rewards you with achievements
5. **Optional:** Mint achievement NFTs on Solana for permanent proof of impact

---

## 🏗️ Architecture

```
┌─────────────────────┐
│  Chrome Extension   │
│  (Plasmo/React/TS)  │
│  - Content Script   │ ──┐
│  - Background       │   │
│  - Popup UI         │   │
└─────────────────────┘   │
                          │ HTTPS
                          ▼
┌──────────────────────────────────────┐
│       Backend API (Express/TS)       │
│  POST /api/analyze-product           │
│  POST /api/log-choice                │
│  GET  /api/dashboard/:userId         │
└──────────────────────────────────────┘
          │         │         │
          │         │         │
    ┌─────▼─┐  ┌────▼────┐  ┌▼──────┐
    │Gemini │  │ VectorAI│  │MongoDB│
    │  API  │  │   DB    │  │ Atlas │
    └───────┘  └─────────┘  └───────┘
                          ▲
                          │
┌─────────────────────────┘
│   Dashboard (Next.js)
│   - User login
│   - Stats & achievements
│   - Timeline of choices
└─────────────────────────
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Extension** | TypeScript, React, [Plasmo](https://plasmo.com) |
| **Backend** | Node.js, Express, TypeScript |
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **Database** | MongoDB Atlas |
| **AI/ML** | Google Gemini API, Actian VectorAI DB |
| **Blockchain** | Solana (Devnet) - Optional NFT badges |

---

## 📁 Project Structure

```
greenlane/
├── extension/          # Chrome extension (Plasmo)
│   ├── popup.tsx       # Main popup UI
│   ├── contents/       # Content scripts
│   ├── background.ts   # Service worker
│   └── assets/         # Icons, images
├── backend/            # Express API server
│   ├── src/
│   │   ├── server.ts   # Main entry point
│   │   ├── services/   # Gemini, VectorAI, Solana
│   │   └── db/         # MongoDB models
│   └── scripts/        # Seed scripts
├── dashboard/          # Next.js web app
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities, auth
├── shared/             # Shared types & utilities
│   └── types/          # TypeScript interfaces
├── .gitignore          # Security-first ignore rules
├── package.json        # pnpm workspaces config
└── README.md           # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Chrome browser
- MongoDB Atlas account (free tier)
- Google AI Studio API key (Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/greenlane.git
cd greenlane
pnpm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Dashboard
cp dashboard/.env.example dashboard/.env
# Edit dashboard/.env with your secrets
```

### 3. Start Development

```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Dashboard
pnpm dev:dashboard

# Terminal 3: Extension
pnpm dev:extension
```

### 4. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/build/chrome-mv3-dev`

---

## 🎮 How It Works

1. **Browse** - Visit any product on Amazon
2. **Click** - Open GreenLane extension
3. **Analyze** - AI scores the product's sustainability
4. **Discover** - See greener alternatives
5. **Choose** - Log your decision (bought, alternative, skipped)
6. **Track** - View progress on your dashboard
7. **Earn** - Unlock achievements and NFT badges!

---

## 🏆 Hackathon Tracks

GreenLane is designed to compete in multiple tracks:

| Track | How We Qualify |
|-------|----------------|
| 🌍 **Climate Action** | Core mission: reduce shopping carbon footprint |
| 🎨 **Design** | Beautiful, intuitive extension + dashboard UX |
| 🤖 **Gemini API** | AI-powered sustainability analysis |
| 🍃 **MongoDB Atlas** | User data, choices, and achievements storage |
| ⛓️ **Solana** | NFT achievement badges on-chain |
| ☁️ **Vultr** | Backend deployment |
| 🌐 **.TECH Domain** | greenlane.tech |

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze-product` | Analyze product sustainability |
| POST | `/api/log-choice` | Log user's shopping choice |
| GET | `/api/dashboard/:userId` | Get user stats & timeline |

---

## 🔐 Security

- ❌ **Never** commit `.env` files
- ❌ **Never** commit API keys or secrets
- ✅ All secrets in `.env` (gitignored)
- ✅ `.env.example` files show required vars
- ✅ Pre-commit checks for leaked secrets

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test backend API
cd backend && ./test-api.sh

# Manual extension testing
# See extension/TEST_PLAN.md
```

---

## 📈 Roadmap

- [x] Phase 0: Repository setup
- [ ] Phase 1: Extension scaffold
- [ ] Phase 2: Backend mock API
- [ ] Phase 3: Extension ↔ Backend integration
- [ ] Phase 4: Gemini AI integration
- [ ] Phase 5: Dashboard foundation
- [ ] Phase 6: MongoDB setup
- [ ] Phase 7: User choice logging
- [ ] Phase 8: Dashboard real data
- [ ] Phase 9: Achievement system
- [ ] Phase 10: VectorAI recommendations
- [ ] Phase 11: Solana NFTs (optional)
- [ ] Phase 12: Polish & error handling
- [ ] Phase 13: Deployment
- [ ] Phase 14: Demo preparation

---

## 👥 Team

Built with 💚 for SFHacks 2026

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details
