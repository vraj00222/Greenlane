# GreenLane — Project Explanation Guide

> Everything to cover when presenting GreenLane at SFHacks 2026.

---

## 1. The Problem (30 seconds)

- Online shopping is exploding — but consumers have **zero visibility** into product sustainability
- No easy way to know: Is this product eco-friendly? Are there greener options? What's my shopping footprint?
- Existing solutions require users to **manually research** materials, certifications, and brand practices
- Privacy concern: sustainability tools that exist require sending your **entire shopping history** to third-party servers

**Key stat to mention:** The average consumer checks 3+ products before buying — but never considers environmental impact because the information isn't accessible at the point of purchase.

---

## 2. The Solution — GreenLane (1 minute)

GreenLane is a **Chrome extension + web dashboard** that brings sustainability intelligence directly into your shopping experience.

### Core value props:
1. **Instant analysis** — Open the extension on any Amazon product, get a sustainability score (0–100) in seconds
2. **AI-powered** — Uses DeepSeek V3 to evaluate 15 sustainability metrics (materials, certifications, carbon footprint, toxicity, etc.)
3. **Greener alternatives** — AI recommends more sustainable products with comparison scores
4. **Gamified tracking** — Dashboard with scan history, achievements, streaks, and a community leaderboard
5. **Privacy-first** — **Go Private mode** runs AI entirely on your device — zero data leaves your machine

---

## 3. Go Private Mode — The Differentiator (1 minute)

This is the **standout feature** and the Meta ExecuTorch sponsor track entry.

### What it does:
- Toggle "Go Private" in the extension
- All AI analysis switches from cloud to a **locally-running Llama 3.2 1B model**
- Powered by **Meta ExecuTorch** — Meta's on-device inference runtime
- The model runs in a Docker container on the user's machine

### Why it matters:
- **No data ever leaves your device** — no product URLs, no browsing patterns, no shopping history sent anywhere
- **No account required** — works without login
- **No scan history saved** — truly ephemeral analysis
- **Purple-themed UI** — visually distinct so users always know they're in private mode

### Technical depth (for judges who ask):
- Llama 3.2 1B (1 billion parameters) compiled to ExecuTorch `.pte` format
- Custom ops loaded via `ctypes`: `llama::custom_sdpa.out` (scaled dot-product attention) and `llama::update_cache.out` (KV cache management)
- TikToken tokenizer (`pytorch_tokenizers.TiktokenTokenizer`)
- Completion-style prompting: model generates free-text sustainability analysis
- Score extraction via regex + sentiment fallback
- Blended scoring: 60% LLM output + 40% keyword analysis for reliability
- ~8 tokens/second on Apple Silicon (M-series Mac) via Docker ARM64
- Model reloaded per inference to reset KV cache (stateless design)
- EOS token suppression during generation to ensure full analysis output

---

## 4. Architecture (30 seconds)

### Two modes, one extension:

**Cloud Mode (Green):**
```
Extension → Backend API (Express) → Novita AI (DeepSeek V3) → MongoDB
                                  → Actian Vector DB (alternatives)
                                  → Dashboard (Next.js)
```

**Private Mode (Purple):**
```
Extension → Local Docker Container (ExecuTorch + Llama 3.2 1B)
           (nothing else — no network, no database, no tracking)
```

### Components:
| Component | Tech | Port |
|-----------|------|------|
| Chrome Extension | Plasmo, React, TypeScript | — |
| Backend API | Express, TypeScript, Mongoose | 3001 |
| Dashboard | Next.js 15, shadcn/ui, Recharts | 3002 |
| MongoDB | Mongoose ODM | 27017 |
| Local LLM | ExecuTorch, Llama 3.2 1B, Python | 8765 |
| Cloud AI | Novita AI (DeepSeek V3) | — |
| Vector Search | Actian Vector DB | — |

---

## 5. Live Demo Flow (2–3 minutes)

### Demo Script:

**Step 1: Show the extension on an Amazon product**
- Navigate to a product page (e.g., plastic forks or bamboo cutting board)
- Click the GreenLane extension icon
- Show the green-themed analysis: score, positives, negatives, recommendation

**Step 2: Show greener alternatives**
- Scroll down in the popup to see AI-recommended alternatives
- Click one to navigate to it

**Step 3: Toggle Go Private**
- Click the Go Private toggle
- Point out: UI turns **purple** immediately
- Extension clears the previous analysis and re-analyzes using local Llama
- Show the "🔒 Private Analysis" badge and "Powered by Meta ExecuTorch" label
- Point out: no login required, no data saved

**Step 4: Compare results**
- Toggle back to cloud mode — show it re-analyzes with the cloud AI
- Compare scores between local and cloud — both give meaningful results

**Step 5: Dashboard**
- Open http://localhost:3002
- Show scan history — **only cloud scans appear** (private scans are absent)
- Show achievements, leaderboard, weekly activity chart
- Point out: this proves private mode truly doesn't save data

**Step 6: Terminal proof (if time)**
- Show `curl http://localhost:8765/health` — model loaded, canInfer: true
- Show `docker ps` — the ExecuTorch container running locally

---

## 6. Sustainability Scoring — How It Works (30 seconds)

15-metric system, max 100 points:

**Top metrics to mention:**
- **Product Durability** (12 pts) — highest weighted, longer-lasting = more sustainable
- **Certifications** (10 pts) — B-Corp, Fair Trade, FSC, Energy Star
- **Recycled Content** (10 pts) — percentage of recycled materials
- **Toxicity** (−10 pts penalty) — BPA, lead, phthalates get penalized
- **Carbon Footprint** (−5 to +5) — carbon neutral products get bonus

**Score ranges:** 🟢 75+ Excellent · 🟡 50–74 Good · 🟠 25–49 Fair · 🔴 0–24 Poor

The AI model (cloud or local) analyzes the product against all 15 metrics and returns a structured breakdown with positives, negatives, and actionable recommendations.

---

## 7. Technical Challenges Overcome (30 seconds)

Pick 2–3 of these depending on audience:

1. **ExecuTorch custom ops** — Had to load `libcustom_ops_aot_lib.so` via ctypes because ExecuTorch's Llama model requires custom SDPA and cache operations not in the base runtime
2. **Tensor shape debugging** — ExecuTorch expects specific 2D token tensors `[[token_id]]` and 1D position tensors `[pos]` — different from standard PyTorch inference
3. **EOS suppression** — Llama 3.2 would stop generating after 2–3 tokens; had to mask EOS tokens (128001, 128008, 128009) during generation to force full analysis output
4. **Privacy isolation** — Cache keys include mode (`::private` / `::cloud`) to prevent cached cloud results from appearing in private mode, and `RECORD_SCAN` is double-guarded to never save private scans
5. **Sentence classification** — LLM output like "made of plastic, which is non-renewable" was being classified as a positive; fixed by prioritizing negative signal detection before positive

---

## 8. Impact & Future Vision (30 seconds)

### Current impact:
- Works on any Amazon product page
- Real-time analysis in <5 seconds (cloud) or <15 seconds (local)
- Gamification drives repeat usage (achievements, streaks, leaderboard)
- Privacy mode makes it accessible to privacy-conscious users

### Future:
- Support more retailers (Walmart, Target, eBay)
- Browser-native ExecuTorch (WebAssembly) — no Docker needed
- Community-sourced product sustainability database
- Carbon offset integration
- Mobile app with on-device Llama

---

## 9. Sponsor Track Alignment

### Meta ExecuTorch Track:
- ✅ Uses ExecuTorch runtime for on-device inference
- ✅ Llama 3.2 1B model (.pte format)
- ✅ Custom ops (SDPA + cache update)
- ✅ Real, meaningful use case — not just a demo
- ✅ Privacy is the core value proposition
- ✅ Docker-based deployment for reproducibility

### Key talking point for Meta judges:
> "We didn't just integrate ExecuTorch — we built a feature around it. Go Private mode exists *because* ExecuTorch makes on-device LLM inference practical. The privacy guarantee is only possible because the model runs locally via ExecuTorch's optimized runtime."

---

## 10. Quick Answers to Expected Questions

**Q: Why not just use Ollama or llama.cpp?**
A: ExecuTorch is Meta's purpose-built runtime for on-device AI with hardware-specific optimizations (XNNPACK). It's designed for production deployment, not just experimentation.

**Q: How accurate is the local model vs. cloud?**
A: Cloud (DeepSeek V3, 685B params) gives more detailed analysis. Local (Llama 3.2 1B) gives meaningful directional scores — it correctly identifies plastic as bad, bamboo as good, etc. We use blended scoring (60% LLM + 40% keyword) to ensure reliability.

**Q: Does private mode really not save anything?**
A: Correct. The RECORD_SCAN handler is double-guarded — it checks both `localAnalysis` flag AND `localLLMEnabled` state. Cache keys are mode-specific. You can verify by checking the dashboard — private scans never appear.

**Q: How long does local inference take?**
A: ~8 tokens/second on Apple Silicon. Full analysis takes 10–15 seconds. Cloud is faster (~3 seconds) but requires sending data externally.

**Q: Could this run on mobile?**
A: ExecuTorch is designed for mobile (iOS/Android). Llama 3.2 1B is small enough for modern phones. That's a natural next step.
