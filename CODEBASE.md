# 📁 GreenLane — Codebase Documentation

> File-by-file reference for the entire GreenLane repository.

---

## Root

| File | Description |
|------|-------------|
| `package.json` | Root monorepo config (pnpm workspaces). Declares workspaces for `extension`, `backend`, `dashboard`, and `shared`. |
| `pnpm-workspace.yaml` | pnpm workspace definition linking all sub-packages. |
| `pnpm-lock.yaml` | Lockfile for deterministic dependency resolution across all workspaces. |
| `.gitignore` | Root ignore rules: secrets, `node_modules`, build outputs, `.venv`, ML model binaries (`.pte`, `.gguf`), IDE configs. |
| `README.md` | Project overview, architecture, setup guide, and API reference. |
| `CODEBASE.md` | This file — detailed documentation of every source file. |
| `LOCAL_LLM_TASKS.md` | Development task tracker for the ExecuTorch local LLM integration. |

---

## Extension — Chrome Extension (`extension/`)

Plasmo-based Chrome MV3 extension with React UI, content scripts, and a background service worker.

| File | Description |
|------|-------------|
| `package.json` | Extension manifest and dependencies. Declares host permissions for Amazon domains, `activeTab` and `storage` permissions. Uses Plasmo v0.90.5. |
| `tsconfig.json` | TypeScript config for the extension, extending Plasmo defaults. |
| `.prettierrc.mjs` | Prettier formatting config for the extension codebase. |
| `.env.example` | Example environment variables (API URL). |
| `.gitignore` | Extension-specific ignores: `node_modules`, `.plasmo`, `build/`, `dist/`. |

### TypeScript Files

| File | Description |
|------|-------------|
| `popup.tsx` | **Main popup UI** (~1600 lines). Renders the full extension interface: sustainability score display, positives/negatives breakdown, eco-alternatives, tips, settings panel, login form, and the **Go Private** toggle. Manages two analysis modes — cloud (green theme, sends to backend) and private (purple theme, calls local ExecuTorch on port 8765). Handles cache-key isolation between modes, prevents private scans from being recorded to the dashboard, and re-triggers analysis on mode toggle. |
| `background.ts` | **Background service worker**. Handles user auth (register/login via backend API), product analysis requests with in-memory caching (30-minute TTL with mode-aware cache keys), and the `RECORD_SCAN` message handler that saves cloud-mode scans to the backend. Routes messages between popup and content scripts. |
| `contents/amazon-scraper.ts` | **Content script** injected on Amazon product pages. Scrapes product data from the DOM — title, price, brand, image URL, materials, and product URL — and responds to `GET_PRODUCT_DATA` messages from the popup with the extracted data. |

### Workflows

| File | Description |
|------|-------------|
| `.github/workflows/submit.yml` | GitHub Actions workflow for Chrome Web Store submission (Plasmo BPP). |

---

## Backend — Express API Server (`backend/`)

Node.js + Express + TypeScript API serving sustainability analysis, user management, scan tracking, and achievement gamification.

| File | Description |
|------|-------------|
| `package.json` | Backend dependencies: Express, Mongoose, cors, dotenv, novita-sdk, tsx. Dev script runs via `tsx watch`. |
| `tsconfig.json` | TypeScript config targeting ES2020 with strict mode. |
| `.env.example` | Example env vars: `MONGODB_URI`, `NOVITA_API_KEY`, `ACTIAN_*` credentials, `PORT`. |
| `.gitignore` | Backend-specific ignores: `node_modules`, `.env`, `dist/`, `*.log`, secrets. |
| `test-api.sh` | Shell script with curl commands to smoke-test all API endpoints. |

### Config

| File | Description |
|------|-------------|
| `src/config/database.ts` | MongoDB connection manager using Mongoose. Handles connection retries (up to 5 attempts), reconnection events, and exposes `connectDB()`, `disconnectDB()`, and `isConnected()`. |

### Models (Mongoose Schemas)

| File | Description |
|------|-------------|
| `src/models/index.ts` | Barrel file re-exporting all Mongoose models and their TypeScript interfaces. |
| `src/models/User.ts` | **User schema**. Fields: email, displayName, extensionId, stats (totalScans, averageScore, carbonSaved, currentStreak, longestStreak, greenChoices), preferences (theme, notifications, privacy), and linked achievements array. Includes a leaderboard query static method. |
| `src/models/Product.ts` | **Product schema**. Fields: title, brand, price, URL, imageUrl, materials, category, sustainability analysis (greenScore, reasons, positives, negatives, carbonFootprint, recommendation), and scanCount. Statics: `findOrCreate`, `getTopSustainable`. |
| `src/models/Scan.ts` | **Scan schema**. Links a user to a product scan with greenScore, userChoice (purchased/skipped/alternative), carbonImpact, and timestamps. Methods for user history, stats aggregation, and weekly activity. |
| `src/models/Achievement.ts` | **Achievement schema**. Defines gamification badges with code, name, description, icon, category (scanning/sustainability/engagement/streak), rarity (common/rare/epic/legendary), requirement threshold, and xpReward. `UserAchievement` join table tracks unlocks. Includes `seedAchievements()` for 12 default badges. |
| `src/models/Notification.ts` | **Notification schema**. Types: achievement, streak, tip, system. Fields: userId, title, message, type, read status. Static factory methods for creating typed notifications. |

### Routes (REST API)

| File | Description |
|------|-------------|
| `src/routes/users.ts` | `/api/users` — GET by ID or extensionId, POST create/login (find-or-create by email), PATCH update preferences, GET leaderboard top users. |
| `src/routes/scans.ts` | `/api/scans` — POST record new scan (creates product, updates user stats, triggers achievement checks), GET user scan history, GET weekly activity aggregation, PATCH update user choice on a scan. |
| `src/routes/achievements.ts` | `/api/achievements` — GET all achievement definitions, GET user achievements with progress calculation, POST seed default achievements, POST manually award an achievement. |
| `src/routes/products.ts` | `/api/products` — GET product by ID or URL, GET top sustainable products, GET product search, GET sustainable alternatives for a given product. |
| `src/routes/notifications.ts` | `/api/notifications` — GET user notifications (with optional unread-only filter), GET unread count, PATCH mark as read. |

### Services (AI & Vector DB)

| File | Description |
|------|-------------|
| `src/services/novita.ts` | **Novita AI integration**. Calls OpenAI-compatible API with a detailed 15-metric sustainability scoring prompt. Uses DeepSeek V3 as primary model with automatic fallback to Llama 3.1 70B and Qwen 2.5 72B on rate limits. Parses structured JSON responses with green score, reasons, positives, negatives, and recommendations. |
| `src/services/actian.ts` | **Actian Vector DB integration**. Provides semantic search for sustainable product alternatives. Detects product categories, searches eco-product embeddings with similarity scoring, and returns category-specific sustainability tips (e.g., GPU power efficiency, clothing fabric guides). |

### Server Entry Point

| File | Description |
|------|-------------|
| `src/server.ts` | **Main Express server** (port 3001). Configures CORS, JSON parsing, mounts all route modules under `/api/*`, defines the inline `/api/analyze-product` endpoint (calls Novita + Actian), provides `/health` and `/api/log-choice` endpoints, connects to MongoDB, and starts listening. |

---

## Dashboard — Next.js Web App (`dashboard/`)

Next.js 15 web dashboard with shadcn/ui components, showing user stats, scan history, achievements, and leaderboard.

| File | Description |
|------|-------------|
| `package.json` | Dashboard dependencies: Next.js 15, React 19, Tailwind CSS, shadcn/ui, Recharts, SWR, Radix UI primitives. |
| `tsconfig.json` | TypeScript config with `@/` path alias to `src/`. |
| `next.config.ts` | Next.js config (minimal, default settings). |
| `components.json` | shadcn/ui component registry config (New York style, CSS variables enabled). |
| `eslint.config.mjs` | ESLint config extending Next.js defaults. |
| `postcss.config.mjs` | PostCSS config with Tailwind CSS plugin. |
| `next-env.d.ts` | Auto-generated Next.js type declarations. |

### Pages (App Router)

| File | Description |
|------|-------------|
| `src/app/layout.tsx` | **Root layout**. Wraps the app in `ThemeProvider` (light/dark), `TooltipProvider`, `UserProvider` (auth context), and `DashboardLayout` (sidebar + header). Uses Geist font. |
| `src/app/globals.css` | Tailwind CSS config with custom color theme variables for light/dark modes, including sidebar, chart, and accent color tokens. |
| `src/app/page.tsx` | **Dashboard home page**. Shows welcome message with leaderboard rank, stats overview cards, weekly activity chart, recent scans list, achievements widget, and leaderboard widget. |
| `src/app/history/page.tsx` | **Scan history page**. Lists all past product scans with green scores, product images, timestamps, and interactive purchased/skipped choice buttons that PATCH the backend. |
| `src/app/achievements/page.tsx` | **Achievements page**. Displays all user achievements grouped by category with rarity-colored badges (common/rare/epic/legendary), progress bars, XP earned, and unlock dates. |
| `src/app/leaderboard/page.tsx` | **Leaderboard page**. Ranks users by total scans and average sustainability score. Crown/medal icons for top 3, current user highlighted. |
| `src/app/settings/page.tsx` | **Settings page**. Shows account profile info, app preferences (theme toggle, notification settings, privacy), and logout. |
| `src/app/help/page.tsx` | **Help center**. Static FAQ section (eco-score methodology, data privacy) with links to documentation, support, and GitHub. |

### Components

| File | Description |
|------|-------------|
| `src/components/dashboard-layout.tsx` | Layout wrapper composing `AppSidebar` and `AppHeader` around page content with sidebar collapse state management. |
| `src/components/app-sidebar.tsx` | Collapsible sidebar navigation with links to Dashboard, History, Achievements, Leaderboard, Settings, and Help. GreenLane logo and branding. |
| `src/components/app-header.tsx` | Top header bar with search input, theme toggle (light/dark), notifications dropdown with unread badge, and user avatar with XP level display. |
| `src/components/stats-overview-connected.tsx` | Dashboard widget showing key user stats: average eco-score as a radial chart, total scans count, estimated carbon saved, and current streak. |
| `src/components/activity-chart-connected.tsx` | Weekly scan activity rendered as bar charts (scan count) and area charts (average score) using Recharts, with tabs to toggle between views. |
| `src/components/recent-activity-connected.tsx` | Scrollable list of the user's most recent product scans with color-coded score badges and relative timestamps. |
| `src/components/achievements-connected.tsx` | Dashboard widget fetching and displaying user achievements with rarity styling, progress bars, and XP earned. |
| `src/components/leaderboard-connected.tsx` | Compact leaderboard list with rank icons, user avatars, scan counts, and score highlights. |
| `src/components/login-card.tsx` | Login/signup form with email and display name fields, plus a "Demo Login" button for quick testing. Uses `UserContext` for auth. |
| `src/components/theme-provider.tsx` | Thin wrapper around `next-themes` `ThemeProvider` for light/dark/system theme support. |

### UI Primitives (shadcn/ui)

| File | Description |
|------|-------------|
| `src/components/ui/avatar.tsx` | Avatar component with image and fallback. |
| `src/components/ui/badge.tsx` | Badge component with variant styling. |
| `src/components/ui/button.tsx` | Button component with size/variant props. |
| `src/components/ui/card.tsx` | Card layout component (header, content, footer). |
| `src/components/ui/chart.tsx` | Recharts wrapper with theme-aware tooltip and legend. |
| `src/components/ui/dropdown-menu.tsx` | Dropdown menu built on Radix UI. |
| `src/components/ui/input.tsx` | Styled text input component. |
| `src/components/ui/label.tsx` | Form label component. |
| `src/components/ui/progress.tsx` | Progress bar component. |
| `src/components/ui/scroll-area.tsx` | Scrollable area with custom scrollbar. |
| `src/components/ui/separator.tsx` | Visual separator / divider. |
| `src/components/ui/sheet.tsx` | Slide-out sheet / drawer (Radix Dialog). |
| `src/components/ui/sidebar.tsx` | Sidebar layout primitives (provider, trigger, content, menu). |
| `src/components/ui/skeleton.tsx` | Loading skeleton placeholder. |
| `src/components/ui/tabs.tsx` | Tabbed interface component. |
| `src/components/ui/tooltip.tsx` | Tooltip component (Radix). |

### Library / Utilities

| File | Description |
|------|-------------|
| `src/lib/api.ts` | **API client module**. Typed functions for all backend endpoints: user CRUD, scans, achievements, leaderboard, weekly activity, notifications, health checks. Base URL from `NEXT_PUBLIC_API_URL`. |
| `src/lib/hooks.ts` | **SWR data-fetching hooks**. `useUser`, `useUserScans`, `useWeeklyActivity`, `useUserAchievements`, `useLeaderboard`, `useNotifications` — all with 5-second auto-refresh intervals. |
| `src/lib/user-context.tsx` | **Auth context provider**. Manages login/logout/current user state with `localStorage` persistence and SWR-based user data fetching. Provides `UserContext` consumed by all pages. |
| `src/lib/utils.ts` | Utility functions: `cn()` for Tailwind class merging (clsx + tailwind-merge), `formatNumber()` for compact display, and score-to-color mapping helpers. |
| `src/hooks/use-mobile.ts` | Custom React hook returning `true` when viewport is below 768px (mobile breakpoint) using `matchMedia` listener. |

---

## Shared Types (`shared/`)

| File | Description |
|------|-------------|
| `package.json` | Shared package config (name: `@greenlane/shared`). |
| `types/index.ts` | **Shared TypeScript interfaces** used across extension, backend, and dashboard: `ProductData`, `SustainabilityAnalysis` (greenScore, reasons, positives, negatives, recommendation, carbonFootprint), `AlternativeProduct`, `AnalysisResponse`, `UserChoice`, `UserStats`, `Achievement`, and `DashboardData`. |

---

## Local LLM — ExecuTorch On-Device Inference (`local-llm/`)

Meta ExecuTorch + Llama 3.2 1B running locally in a Docker container for privacy-first sustainability analysis.

| File | Description |
|------|-------------|
| `.gitignore` | Ignores build outputs, model binaries (`.pte`, `.bin`, `.gguf`), IDE configs, Python cache. |
| `README.md` | Local LLM setup guide, Docker usage instructions, and API reference. |

### Python Server (Production — Docker)

| File | Description |
|------|-------------|
| `server_docker.py` | **Main inference server** (~640 lines, port 8765). Loads the Llama 3.2 1B `.pte` model via ExecuTorch runtime with custom ops (`llama::custom_sdpa.out`, `llama::update_cache.out`) loaded through `ctypes`. Uses `pytorch_tokenizers.TiktokenTokenizer` for encoding. Generates sustainability analysis with completion-style prompting, extracts scores via regex, and blends 60% LLM score + 40% keyword score. Provides `/analyze` and `/health` endpoints. Reloads model per inference to reset KV cache. Suppresses EOS tokens during generation. |

### Model Export Scripts

| File | Description |
|------|-------------|
| `export_executorch_model.py` | Script to export a custom `SustainabilityScorer` neural network (keyword-feature-based, 64→128→1 architecture) to ExecuTorch `.pte` format. |
| `export_model.py` | Script to export SmolLM (135M param) or other HuggingFace models to ExecuTorch `.pte` format using `torch.export` and the EXIR pipeline. |

### C++ Engine (Alternative Backend)

| File | Description |
|------|-------------|
| `src/inference.h` | C++ header defining `InferenceEngine` class (pimpl pattern) with `loadModel()`, `analyze()`, and stat methods. Declares `SustainabilityAnalysis` and `ProductData` structs. |
| `src/inference.cpp` | C++ `InferenceEngine` implementation. Builds sustainability prompts, runs keyword-based inference (with optional ExecuTorch backend when compiled with `USE_EXECUTORCH`), and parses JSON analysis results. |
| `src/tokenizer.h` | C++ header for `Tokenizer` class with encode/decode methods (pimpl pattern). |
| `src/tokenizer.cpp` | C++ tokenizer implementation. Simple whitespace-based mock tokenizer with hash-based token IDs (placeholder for full SentencePiece integration). |
| `src/main.cpp` | C++ HTTP server using cpp-httplib. Exposes `/analyze`, `/health`, and CORS-enabled endpoints. Loads the ExecuTorch model and delegates to `InferenceEngine`. |
| `CMakeLists.txt` | CMake build config for the C++ inference server. Links ExecuTorch libraries when available, falls back to mock inference. |

### Docker & DevOps

| File | Description |
|------|-------------|
| `Dockerfile` | Multi-stage Docker image building ExecuTorch with XNNPACK delegate on Python 3.11-slim for ARM64 Llama inference. Installs `executorch`, `pytorch-tokenizers`, and `tiktoken`. |
| `docker-compose.yml` | Docker Compose config running the ExecuTorch LLM container on port 8765 with the Llama 3.2 1B model and `server_docker.py` volume-mounted. Targets `linux/arm64`. |
| `docker-run.sh` | Shell script that checks prerequisites, tries pulling the pre-built `psiddh/executorch-hackathon:basic-arm64` image, falls back to building from the Dockerfile, and starts the container with volume mounts. |
| `setup_executorch.sh` | Setup script that downloads the Llama 3.2 1B `.pte` model (~2.3GB) and tokenizer from HuggingFace, then checks/installs the ExecuTorch runtime. |
| `scripts/download_model.sh` | Standalone script to download the Llama 3.2 1B ET model files from HuggingFace. |

### Model Files

| File | Description |
|------|-------------|
| `models/Llama-3.2-1B-ET/README.md` | Model card for the Llama 3.2 1B ExecuTorch export. |
| `models/Llama-3.2-1B-ET/config.json` | Model config (architecture: `LlamaForCausalLM`). |
| `models/Llama-3.2-1B-ET/params.json` | Model hyperparameters: dim=2048, n_layers=16, n_heads=32, vocab_size=128256, max_seq_len=2048. |
| `models/Llama-3.2-1B-ET/tokenizer.model` | TikToken tokenizer model file (2.1MB) used by `pytorch_tokenizers.TiktokenTokenizer`. |
| `models/Llama-3.2-1B-ET/llama3_2-1B.pte` | *(git-ignored, 2.3GB)* — The compiled ExecuTorch model binary. Downloaded via `setup_executorch.sh` or `docker-run.sh`. |
