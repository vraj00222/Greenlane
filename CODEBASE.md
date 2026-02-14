# 📁 GreenLane Codebase Documentation

> Quick reference for all TypeScript files and their purposes

---

## 🔧 Backend (`/backend/src/`)

### Config
| File | Purpose |
|------|---------|
| `config/database.ts` | MongoDB connection manager. Handles connecting/disconnecting to MongoDB with retry logic, connection status tracking, and event handlers for connection state changes. |

### Models
| File | Purpose |
|------|---------|
| `models/index.ts` | Central export file for all Mongoose models. Re-exports User, Product, Scan, Achievement models and their TypeScript interfaces for easy importing. |
| `models/User.ts` | User schema and model. Defines user profile (email, displayName), stats (totalScans, averageScore, streak), preferences (theme, notifications), and achievements array. Includes leaderboard query method. |
| `models/Product.ts` | Product schema for scanned items. Stores product details (title, brand, price, URL, imageUrl), sustainability analysis (greenScore, reasons, positives, negatives), and scan count. Includes findOrCreate and getTopSustainable methods. |
| `models/Scan.ts` | Scan history schema. Links users to products they've analyzed, stores greenScore, userChoice (purchased/skipped/alternative), and carbonImpact. Includes methods for user history, stats, and weekly activity aggregation. |
| `models/Achievement.ts` | Achievement system schemas. Defines achievement badges (code, name, icon, category, rarity, requirement, xpReward) and UserAchievement join table. Includes seedAchievements method to populate 12 default achievements. |

### Routes
| File | Purpose |
|------|---------|
| `routes/users.ts` | User API endpoints. GET user by ID, GET by extensionId, POST create/login user, PATCH update user, GET user stats, GET leaderboard top users. Handles user registration and profile management. |
| `routes/scans.ts` | Scan API endpoints. POST record new scan (creates product, updates user stats, checks achievements), GET user scan history, GET weekly activity, PATCH update user choice. Core scanning workflow. |
| `routes/achievements.ts` | Achievement API endpoints. GET all achievements, GET user achievements with progress calculation, POST seed achievements, POST manually award achievement. Tracks badge earning progress. |
| `routes/products.ts` | Product API endpoints. GET product by ID, GET by URL, GET top sustainable products, GET product stats overview, GET search products. Product catalog management. |

### Services
| File | Purpose |
|------|---------|
| `services/novita.ts` | Novita AI (DeepSeek R1) integration. Sends product data to AI for sustainability analysis, parses JSON response extracting greenScore, reasons, positives, negatives, and recommendation. Handles DeepSeek thinking tags. |

### Core
| File | Purpose |
|------|---------|
| `server.ts` | Main Express server entry point. Sets up CORS, JSON middleware, logging. Mounts all API routes, defines /health endpoint, /api/analyze-product endpoint with AI + heuristic fallback, starts server with MongoDB connection. |

---

## 🖥️ Dashboard (`/dashboard/src/`)

### App Pages (Next.js App Router)
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout component. Wraps app with ThemeProvider (dark/light mode), UserProvider (auth context), and global styles. Sets up HTML structure and metadata. |
| `app/page.tsx` | Main dashboard home page. Shows stats overview, activity chart, recent scans, achievements preview, and leaderboard. Uses DashboardLayout with connected components fetching real data. |
| `app/achievements/page.tsx` | Achievements page. Displays all user achievements in a grid, showing earned badges and progress toward unearned ones. Uses AchievementsConnected component. |
| `app/history/page.tsx` | Scan history page. Shows complete list of all products user has scanned with greenScores, dates, and product details. Paginated scan history view. |
| `app/leaderboard/page.tsx` | Leaderboard page. Shows top users ranked by average sustainability score, displaying avatars, stats, and rankings. Uses LeaderboardConnected component. |
| `app/settings/page.tsx` | Settings page. User preferences for notifications (email, push, weekly report), privacy (show on leaderboard, share stats), and theme selection. Form to update preferences. |
| `app/help/page.tsx` | Help/FAQ page. Static page with instructions on how to use the extension, interpret scores, and contact support. |

### Components - Connected (Real Data)
| File | Purpose |
|------|---------|
| `components/stats-overview-connected.tsx` | Fetches real user stats from API using SWR. Displays totalScans, averageScore, carbonSaved, and currentStreak. Shows loading skeleton while fetching. |
| `components/activity-chart-connected.tsx` | Fetches weekly scan activity from API. Renders bar chart showing scans per day for the past week. Handles empty state when no scans exist. |
| `components/recent-activity-connected.tsx` | Fetches recent scan history from API. Displays list of recently scanned products with greenScore badges, product images, and timestamps. |
| `components/achievements-connected.tsx` | Fetches user achievements from API. Shows earned achievements with icons and XP, plus progress bars for unearned achievements. Displays summary stats. |
| `components/leaderboard-connected.tsx` | Fetches leaderboard rankings from API. Displays top users with rank, avatar, name, averageScore, and totalScans. Highlights current user if in top 10. |

### Components - UI Display
| File | Purpose |
|------|---------|
| `components/stats-overview.tsx` | Pure UI component for stats display. Renders 4 stat cards (scans, score, carbon, streak) with icons and formatting. Accepts data as props. |
| `components/activity-chart.tsx` | Pure UI component for activity chart. Renders Recharts bar chart with date labels and scan counts. Accepts weekly data array as props. |
| `components/recent-activity.tsx` | Pure UI component for scan list. Renders product cards with image, title, score badge, and timestamp. Accepts scans array as props. |
| `components/achievements-card.tsx` | Pure UI component for single achievement. Shows icon, name, description, XP reward, and earned/progress status. Used in achievement grids. |
| `components/leaderboard-card.tsx` | Pure UI component for leaderboard row. Shows rank number, user avatar, display name, and stats. Used in leaderboard table. |
| `components/category-radar.tsx` | Radar chart component for category breakdown. Shows sustainability scores across different product categories (electronics, clothing, food, etc.). |
| `components/login-card.tsx` | Login form component. Email input with sign-in button. Calls UserContext login function. Shows loading state during authentication. |

### Components - Layout
| File | Purpose |
|------|---------|
| `components/dashboard-layout.tsx` | Main dashboard wrapper. Combines sidebar navigation, header, and content area. Handles responsive layout for mobile/desktop. |
| `components/app-sidebar.tsx` | Navigation sidebar component. Links to Dashboard, History, Achievements, Leaderboard, Settings, Help. Shows user avatar and logout button. Uses shadcn Sidebar. |
| `components/app-header.tsx` | Top header bar. Shows page title, user greeting, and mobile menu toggle. Includes theme switcher button. |
| `components/theme-provider.tsx` | Next-themes provider wrapper. Manages dark/light/system theme state. Provides theme context to entire app. |

### Components - UI Primitives (shadcn/ui)
| File | Purpose |
|------|---------|
| `components/ui/button.tsx` | Button component with variants (default, destructive, outline, ghost, link) and sizes. Built on Radix UI primitives. |
| `components/ui/card.tsx` | Card container with Header, Title, Description, Content, Footer subcomponents. Used for all dashboard cards. |
| `components/ui/input.tsx` | Styled text input component. Used in forms for email entry and search. |
| `components/ui/label.tsx` | Form label component. Pairs with inputs for accessibility. Uses Radix Label primitive. |
| `components/ui/badge.tsx` | Small badge/tag component with color variants. Used for greenScore display and achievement rarity. |
| `components/ui/avatar.tsx` | User avatar component with image and fallback initials. Uses Radix Avatar primitive. |
| `components/ui/progress.tsx` | Progress bar component for achievement progress and loading states. |
| `components/ui/skeleton.tsx` | Loading placeholder component. Shows animated gray boxes while content loads. |
| `components/ui/tabs.tsx` | Tab navigation component. Used for switching between views. Uses Radix Tabs primitive. |
| `components/ui/tooltip.tsx` | Hover tooltip component for additional info. Uses Radix Tooltip primitive. |
| `components/ui/separator.tsx` | Horizontal/vertical line divider. Used between sections. |
| `components/ui/scroll-area.tsx` | Custom scrollable container with styled scrollbar. Uses Radix ScrollArea. |
| `components/ui/sheet.tsx` | Slide-out panel component for mobile navigation. Uses Radix Dialog primitive. |
| `components/ui/sidebar.tsx` | Complex sidebar navigation system. Collapsible, supports icons and nested items. Core dashboard navigation. |
| `components/ui/chart.tsx` | Recharts wrapper components. Provides ChartContainer, ChartTooltip, ChartLegend for data visualization. |

### Lib (Utilities)
| File | Purpose |
|------|---------|
| `lib/api.ts` | API client functions. Defines fetcher for SWR, base URL config, and typed API call functions for users, scans, achievements endpoints. |
| `lib/hooks.ts` | Custom React hooks. useUser, useScans, useAchievements, useLeaderboard - SWR hooks for data fetching with caching and revalidation. |
| `lib/utils.ts` | Utility functions. cn() for className merging (clsx + tailwind-merge), formatDate, formatScore helpers. |
| `lib/mock-data.ts` | Mock data for development/testing. Sample users, scans, achievements for UI development before API integration. |
| `lib/user-context.tsx` | React Context for user authentication. Provides userId, login/logout functions, loading state. Persists to localStorage. |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/use-mobile.ts` | Custom hook for responsive design. Returns boolean isMobile based on screen width. Used for conditional mobile/desktop rendering. |

---

## 🧩 Extension (`/extension/`)

| File | Purpose |
|------|---------|
| `popup.tsx` | Main extension popup UI. Shows login form or analysis interface. Displays product info, greenScore, positives/negatives, alternatives. Buttons for analyze, settings, and dashboard link. Manages all popup state. |
| `background.ts` | Service worker (background script). Handles user registration/login API calls, stores userId in chrome.storage, communicates with content scripts. Manages extension lifecycle and API communication. |
| `contents/amazon-scraper.ts` | Content script for Amazon pages. Extracts product data (title, brand, price, imageUrl, URL) from DOM. Sends data to popup via chrome.runtime messaging when user clicks analyze. |

---

## 📦 Shared (`/shared/`)

| File | Purpose |
|------|---------|
| `types/index.ts` | Shared TypeScript interfaces. Defines Product, User, Scan, Achievement, Analysis types used across backend, dashboard, and extension. Single source of truth for data shapes. |

---

## 🔗 File Relationships

```
Extension                    Backend                     Dashboard
─────────                    ───────                     ─────────
popup.tsx ──────────────────► server.ts                  page.tsx
    │                            │                           │
    │  (analyze request)         │                           │
    ▼                            ▼                           ▼
background.ts                routes/*.ts ◄─────────── *-connected.tsx
    │                            │                           │
    │  (user auth)               │                           │
    ▼                            ▼                           ▼
amazon-scraper.ts            models/*.ts                 lib/api.ts
    │                            │                           │
    │  (product data)            │                           │
    └────────────────────────────┼───────────────────────────┘
                                 │
                                 ▼
                            MongoDB
```

---

## 📊 Data Flow Example: Analyzing a Product

1. **amazon-scraper.ts** extracts product data from Amazon page
2. **popup.tsx** receives data via messaging, displays in UI
3. User clicks "Analyze" → **popup.tsx** calls backend API
4. **server.ts** receives request at `/api/analyze-product`
5. **novita.ts** sends product to AI for sustainability analysis
6. **server.ts** returns greenScore, reasons, alternatives
7. **popup.tsx** displays results, user can save scan
8. **scans.ts** route saves scan to MongoDB via **Scan.ts** model
9. **User.ts** model updates user stats (totalScans, averageScore)
10. **Achievement.ts** checks if any new achievements earned
11. **dashboard** pages show updated stats via **\*-connected.tsx** components
