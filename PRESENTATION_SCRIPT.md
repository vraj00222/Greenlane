# GreenLane — Presentation Script

> **SFHacks 2026 | Total Time: ~5 minutes**
> Read speaking lines naturally — don't memorize word-for-word. The flow matters more than exact phrasing.

---

## Pre-Demo Setup Checklist

Before you walk up to present, make sure everything is running:

```
✅ MongoDB running (port 27017)
✅ Backend running (port 3001) — verify: curl http://localhost:3001/health
✅ Dashboard running (port 3002) — open http://localhost:3002
✅ Docker ExecuTorch container running (port 8765) — verify: curl http://localhost:8765/health
✅ Chrome open with GreenLane extension pinned
✅ Two Amazon tabs ready:
   - Tab 1: A plastic/disposable product (e.g., plastic forks, disposable plates)
   - Tab 2: A sustainable product (e.g., bamboo cutting board, organic cotton shirt)
✅ Dashboard logged in, with a few existing scans visible
✅ Terminal ready to show `docker ps` if asked
```

---

## PART 1 — The Hook (30 seconds)

**[LAPTOP: Chrome open on an Amazon product page, extension NOT yet clicked]**

> "Every single thing we buy online has an environmental footprint — but as consumers, we're completely blind to it. There's no label, no rating, no signal telling you whether the product you're about to click 'Buy Now' on is sustainably made or destroying the planet.

> We built **GreenLane** — a Chrome extension that brings real-time sustainability intelligence directly into your shopping experience, right at the point of purchase. And for users who care about privacy, we built something we think is really special — but I'll get to that in a minute."

---

## PART 2 — Cloud Mode Demo (1 minute)

**[LAPTOP: Click the GreenLane extension icon on the plastic product tab]**

> "Let me show you how it works. I'm on an Amazon product page right now. I click the GreenLane extension—"

**[LAPTOP: Extension popup opens. Loading spinner appears. Analysis loads in ~3 seconds.]**

> "—and within seconds, the AI analyzes this product across fifteen sustainability metrics: materials, durability, certifications, carbon footprint, toxicity, ethical sourcing, and more. It returns a score out of a hundred."

**[LAPTOP: Point at the green score circle and the positives/negatives lists]**

> "Here you can see this product scored a [read score]. The AI highlights the positives — [read one or two] — and flags the concerns — [read one]. It also gives an actionable recommendation: [read the recommendation]."

**[LAPTOP: Scroll down to the greener alternatives section]**

> "Below that, GreenLane uses AI to suggest greener alternatives. Each alternative has its own sustainability score and a direct link to find it on Amazon. So we're not just telling you something is bad — we're helping you make a better choice."

**[LAPTOP: Click 'Find Better Sustainable Products' if alternatives haven't loaded]**

> "Behind the scenes, this is powered by **DeepSeek V3** — a 685-billion parameter model — accessed through Novita AI. We also integrate **Actian Vector DB** for semantic product search to find relevant eco-friendly alternatives. And if DeepSeek is unavailable, we have automatic failover to **Llama 3.1 70B**, then **Qwen 2.5 72B**, then **Mistral Large** — so the user never sees a failure."

---

## PART 3 — Go Private Mode + ExecuTorch (1.5 minutes)

> "Now here's the thing — every sustainability tool that exists today requires you to send your shopping data to a server. Your product URLs, your browsing patterns, your entire purchase history — it all gets shipped to some third-party cloud. That's a real problem."

**[LAPTOP: Click the settings gear icon in the extension]**

> "So we built **Go Private** mode."

**[LAPTOP: Toggle the 'Go Private' switch ON. UI turns purple. Point at the status indicator showing local server connected.]**

> "When I flip this toggle, everything changes. The entire UI turns purple to clearly indicate you're in private mode. And more importantly — all AI analysis now runs **entirely on your device**. Nothing — not a single byte of data — leaves your machine."

**[LAPTOP: Go back to the analysis view. The extension re-analyzes the product. Wait ~10-15 seconds for local analysis to complete.]**

> "The extension is now running the analysis locally using **Llama 3.2 1B** — Meta's one-billion parameter model — compiled into ExecuTorch's `.pte` format and running inside a Docker container on this laptop."

**[LAPTOP: Point at the purple 'Private Analysis' banner and the 'Powered by Meta ExecuTorch' badge]**

> "You can see right here — 'Private Analysis: Your data never left this device.' Powered by **Meta ExecuTorch**."

> "Let me explain what's happening under the hood. ExecuTorch is Meta's on-device inference runtime — purpose-built for running AI models efficiently on edge devices. Our server loads the Llama 3.2 `.pte` model file, uses ExecuTorch's custom operators — specifically `custom_sdpa` for scaled dot-product attention and `update_cache` for KV cache management — loaded via `ctypes` from ExecuTorch's shared library. The model processes tokens at about eight tokens per second on Apple Silicon, and the full analysis takes ten to fifteen seconds."

> "We use a blended scoring approach: sixty percent from the LLM's actual output and forty percent from keyword analysis — this ensures reliable scores even from a smaller model. We also suppress EOS tokens during generation so the model produces a complete analysis instead of stopping after two or three tokens."

**[LAPTOP: Point at score. Then briefly toggle back to cloud mode to show re-analysis in green UI]**

> "And if I toggle back to cloud mode — you see it switches back to green, re-analyzes with DeepSeek V3 in the cloud. Both modes give meaningful results. The cloud is faster and more detailed, but private mode gives you something no cloud can — **a mathematical guarantee that your data stays on your device**."

---

## PART 4 — Dashboard Demo (1 minute)

**[LAPTOP: Open the Dashboard tab at localhost:3002]**

> "Everything from cloud mode syncs to our web dashboard — built with **Next.js 15** and **shadcn/ui**."

**[LAPTOP: Show the Dashboard home page — stats cards, activity chart, leaderboard preview]**

> "The home page shows your average eco-score with a radial chart, total products scanned, a weekly activity chart with both scans and score trends, and where you rank on the global leaderboard."

**[LAPTOP: Click 'History' in the sidebar]**

> "The scan history page shows every product you've analyzed — with the product image, brand, score, and timestamp. Users can mark whether they purchased or skipped a product, and the system calculates the **carbon impact** of those decisions."

> "And here's the key point — **notice that scans from private mode do not appear here**. That's not a bug, that's the core privacy guarantee. Private scans are never saved — not to the database, not to the dashboard, not anywhere."

**[LAPTOP: Click 'Achievements' in the sidebar]**

> "We gamified the experience with twelve achievements across four categories: scanning milestones, sustainability scores, streak tracking, and community engagement. Each achievement has a rarity level — common, rare, epic, and legendary — with XP rewards and progress bars."

**[LAPTOP: Point at a few achievements, then click 'Leaderboard']**

> "The leaderboard ranks users globally by average eco-score. It shows scans completed, CO₂ saved, and highlights the top three with crown and medal icons. This gamification drives repeat engagement — users come back because they want to level up, maintain their streak, and climb the board."

**[LAPTOP: Briefly show the notification bell in the header — click it to show achievement notifications]**

> "Users also get real-time notifications when they unlock achievements — the system auto-checks all achievement requirements after every scan."

---

## PART 5 — Architecture & Technical Summary (30 seconds)

> "Quick architecture overview. GreenLane has four components:"

> "**One** — the Chrome extension, built with Plasmo and React on Manifest V3. It handles product scraping, analysis display, caching, and the private mode toggle."

> "**Two** — an Express and TypeScript backend that orchestrates AI calls, manages user data in MongoDB, and serves the REST API — including endpoints for scanning, achievements, leaderboard, and notifications."

> "**Three** — the Next.js dashboard for visualizing your sustainability journey with real-time data via SWR."

> "**Four** — the ExecuTorch inference server — a Python server inside Docker that loads Llama 3.2 1B and exposes a local API on port 8765. Completely isolated. No network calls out."

> "For cloud AI, we use **DeepSeek V3** as our primary model through Novita AI, with three fallback models for reliability. For alternative product search, we integrate **Actian Vector DB** for semantic similarity matching, with a curated fallback database of verified sustainable brands."

---

## PART 6 — Sponsor Track Alignment (30 seconds)

> "For sponsor tracks — we're submitting to the **Meta ExecuTorch** track."

> "We didn't just integrate ExecuTorch as a checkbox — we built an entire product feature around it. **Go Private mode exists because ExecuTorch makes on-device LLM inference practical.** The privacy guarantee — zero data leaving your device — is only possible because ExecuTorch can run Llama 3.2 efficiently on consumer hardware."

> "We use ExecuTorch's custom operators for attention and KV cache, the TikToken tokenizer, and the compiled `.pte` model format. The entire pipeline — from token input to sustainability score output — runs through ExecuTorch's runtime with no cloud dependency."

> "We also leverage **Novita AI** for cloud inference with DeepSeek V3 and multi-model failover, and **Actian Vector DB** for semantic alternative product search — making GreenLane a complete, production-ready system."

---

## PART 7 — Impact & Close (30 seconds)

> "GreenLane makes sustainability actionable at the moment it matters most — when you're about to click buy. Cloud mode gives you rich, detailed analysis. Private mode gives you the same intelligence with a hard privacy guarantee. And the dashboard turns individual choices into a visible, gamified journey."

> "Looking forward, we plan to support more retailers — Walmart, Target, eBay — bring ExecuTorch to the browser via WebAssembly so no Docker is needed, and build a community-sourced sustainability database. But today, right now, GreenLane works end-to-end on Amazon — and it works with your data staying exactly where it belongs: on your device."

> "Thank you."

---

## Quick-Reference: If Judges Ask...

| Question | Answer |
|----------|--------|
| **"Why ExecuTorch over Ollama or llama.cpp?"** | ExecuTorch is Meta's purpose-built runtime for on-device AI with hardware-specific optimizations via XNNPACK. It's designed for production deployment on edge devices, not just experimentation. |
| **"How accurate is local vs. cloud?"** | Cloud (DeepSeek V3, 685B params) gives richer detail. Local (Llama 3.2 1B) gives directionally correct scores — correctly identifies plastic as bad, bamboo as good. We use blended scoring (60% LLM + 40% keyword) to ensure reliability from the smaller model. |
| **"Does private mode really save nothing?"** | Yes. The `RECORD_SCAN` handler is double-guarded — it checks both the `localAnalysis` flag and the `localLLMEnabled` state. Cache keys are namespaced by mode (`::private` vs `::cloud`). Dashboard history proves it — private scans never appear. |
| **"How long does local inference take?"** | ~8 tokens/second on Apple Silicon. Full analysis: 10–15 seconds. Cloud: ~3 seconds. The tradeoff is speed for privacy. |
| **"What if the Docker container isn't running?"** | The extension detects it via the health endpoint. The Go Private toggle shows a red status dot, and the user stays on cloud mode. Graceful degradation. |
| **"What about the fallback AI system?"** | DeepSeek V3 is primary. If it fails, we auto-retry with Llama 3.1 70B → Qwen 2.5 72B → Mistral Large 2411, each with a 1-second delay. If all cloud models fail, we fall back to keyword-based heuristic scoring starting at 50. The user always gets a result. |
| **"How does the scoring work?"** | 15 metrics, max 100 points. Top-weighted: Durability (12), Certifications (10), Recycled Content (10). Penalties: Toxicity (−10), excess Packaging (−5). The AI evaluates each metric and returns a structured breakdown. |
| **"What's the carbon impact calculation?"** | When a user skips a low-scoring product or chooses a sustainable alternative, we estimate the CO₂ delta based on score difference and product category. This accumulates on the leaderboard as "kg CO₂ saved." |
| **"How do achievements work?"** | 12 achievements across 4 categories with rarity tiers. After every scan, the backend checks all requirements (scan count, avg score, streak length, carbon saved) against thresholds and auto-awards any newly unlocked achievements with notifications. |
| **"What databases do you use?"** | MongoDB for all user, product, scan, achievement, and notification data. Actian Vector DB for semantic product similarity search. Chrome's storage API for extension state and caching. |

---

## Timing Summary

| Section | Duration | Cumulative |
|---------|----------|------------|
| 1. Hook | 0:30 | 0:30 |
| 2. Cloud Mode Demo | 1:00 | 1:30 |
| 3. Go Private + ExecuTorch | 1:30 | 3:00 |
| 4. Dashboard Demo | 1:00 | 4:00 |
| 5. Architecture | 0:30 | 4:30 |
| 6. Sponsor Tracks | 0:30 | 5:00 |
| 7. Close | 0:30 | 5:30 |

> **Total: ~5 minutes speaking + demo. Adjust by cutting Part 5 if short on time.**

---

## Emergency Recovery

| Problem | Fix |
|---------|-----|
| Extension analysis hangs | Refresh the Amazon tab and click extension again |
| Docker container crashed | Run `cd local-llm && ./docker-run.sh` — takes ~30s to restart |
| Backend down | Run `cd backend && pnpm dev` |
| Dashboard won't load | Run `cd dashboard && pnpm dev` |
| MongoDB not connected | Run `mongosh --eval "db.runCommand({ping:1})"` to check, restart with `brew services start mongodb-community` |
| Private mode shows red dot | Docker isn't running — fall back to explaining the architecture verbally, skip the live private demo |
| Score looks wrong | Emphasize blended scoring: "The model provides directional analysis — the hybrid approach ensures meaningful results" |
