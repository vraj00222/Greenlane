# 🌿 GreenLane

> **AI-powered Chrome extension helping users make sustainable shopping choices**

Built for **SFHacks 2026** 🏆

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
3. **Recommends greener alternatives**
4. **Tracks your green choices** and rewards you with achievements

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
│  POST /api/scans                     │
│  GET  /api/users/:userId             │
└──────────────────────────────────────┘
          │                   │
          │                   │
    ┌─────▼─────┐       ┌─────▼─────┐
    │ Novita AI │       │  MongoDB  │
    │(DeepSeek) │       │           │
    └───────────┘       └───────────┘
                              ▲
                              │
┌─────────────────────────────┘
│   Dashboard (Next.js)
│   - User stats & achievements
│   - Scan history
│   - Leaderboard
└─────────────────────────────
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Extension** | TypeScript, React, [Plasmo](https://plasmo.com) |
| **Backend** | Node.js, Express, TypeScript |
| **Frontend** | Next.js 15, React, Tailwind CSS, shadcn/ui |
| **Database** | MongoDB |
| **AI/ML** | Novita AI (DeepSeek R1) |

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
│   │   ├── services/   # AI integration
│   │   ├── models/     # MongoDB models
│   │   └── routes/     # API routes
├── dashboard/          # Next.js web app
│   ├── src/app/        # App router pages
│   ├── src/components/ # React components
│   └── src/lib/        # Utilities
├── shared/             # Shared types & utilities
│   └── types/          # TypeScript interfaces
└── README.md           # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Chrome browser
- MongoDB (local or Atlas)
- Novita AI API key

### 1. Clone & Install

```bash
git clone https://github.com/vraj00222/Greenlane.git
cd Greenlane
pnpm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Extension (optional)
cp extension/.env.example extension/.env
```

### 3. Start Development

```bash
# Terminal 1: Backend (port 3001)
cd backend && pnpm dev

# Terminal 2: Dashboard (port 3002)
cd dashboard && pnpm dev

# Terminal 3: Extension
cd extension && pnpm dev
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
5. **Choose** - Log your decision
6. **Track** - View progress on your dashboard
7. **Earn** - Unlock achievements!

---

## � Sustainability Scoring System

GreenLane uses a comprehensive **15-metric scoring system** (max 100 points) to evaluate product sustainability:

| # | Metric | Points | Description |
|---|--------|--------|-------------|
| 1 | **Recycled Content** | 0-10 | Percentage of recycled materials used |
| 2 | **Natural/Organic Materials** | 0-8 | Certified organic or natural materials (bamboo, hemp, etc.) |
| 3 | **Product Durability** ⭐ | 0-12 | Expected lifespan and build quality (key metric) |
| 4 | **Repairability** | 0-6 | Ease of repair and parts availability |
| 5 | **End-of-Life Disposal** | 0-8 | Recyclability or compostability |
| 6 | **Energy Efficiency** | 0-8 | Power consumption during use |
| 7 | **Certifications** | 0-10 | B-Corp, Fair Trade, GOTS, FSC, Energy Star |
| 8 | **Packaging** | -5 to +5 | Minimal/plastic-free (+5) to excessive plastic (-5) |
| 9 | **Manufacturing Impact** | 0-8 | Clean production and renewable energy use |
| 10 | **Water Footprint** | 0-5 | Water usage in production |
| 11 | **Ethical Sourcing** | 0-8 | Supply chain ethics and fair wages |
| 12 | **Biodegradability** | 0-7 | Material breakdown in environment |
| 13 | **Toxicity** ⚠️ | -10 to 0 | Penalty for harmful chemicals (BPA, lead, etc.) |
| 14 | **Brand Sustainability Record** | 0-8 | Company's overall sustainability initiatives |
| 15 | **Carbon Footprint** | -5 to +5 | Carbon neutral (+5) to high emissions (-5) |

**Score Ranges:**
- 🟢 **75-100**: Excellent - Highly sustainable choice
- 🟡 **50-74**: Good - Above average sustainability
- 🟠 **25-49**: Fair - Room for improvement
- 🔴 **0-24**: Poor - Consider alternatives

---

## �📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze-product` | Analyze product sustainability |
| POST | `/api/scans` | Record a product scan |
| GET | `/api/users/:id` | Get user data |
| GET | `/api/scans/user/:id` | Get user scan history |
| GET | `/api/achievements/user/:id` | Get user achievements |
| GET | `/api/users/leaderboard/top` | Get leaderboard |

---

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:3001/health

# Test product analysis
curl -X POST http://localhost:3001/api/analyze-product \
  -H "Content-Type: application/json" \
  -d '{"productTitle": "Organic Cotton T-Shirt", "brand": "EcoWear", "price": "$29.99"}'
```
