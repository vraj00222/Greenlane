# GreenLane v0.2 Implementation Plan

**Created:** February 14, 2026  
**Status:** In Progress  
**GitHub:** https://github.com/vraj00222/Greenlane

---

## 📊 Database Architecture

| Database | Purpose | Port |
|----------|---------|------|
| **MongoDB** | Users, Scans, Achievements, Notifications | 27017 |
| **Actian VectorAI DB** | Product embeddings for eco-alternative search | 8080 |

---

## 🔧 Fixes

### Fix 0: Remove Next.js Logo ⏳
**Status:** Pending verification  
**Issue:** User reported Next.js logo in bottom-left of dashboard  
**Finding:** No Next.js logo found in rendered UI - sidebar uses custom Leaf icon  
**Action:** Check if user means favicon or other element  

**Files:** `dashboard/src/app/favicon.ico` (if favicon)

---

### Fix 1: Speed Up Extension Analysis 🔴
**Status:** Not Started  
**Issue:** Analysis takes 5-10 seconds, blocks UI, allows duplicate clicks  

**Solution:**
- [ ] Add loading state lock to prevent duplicate clicks
- [ ] Show immediate "Analyzing..." with progress animation
- [ ] Add analysis caching by product URL (localStorage)
- [ ] Switch to faster GPU model (DeepSeek-V3 or Qwen2.5-72B)
- [ ] Add `stream: true` for real-time response chunks

**Files:**
- `extension/popup.tsx` - Loading state, duplicate prevention
- `extension/background.ts` - Caching layer
- `backend/src/services/novita.ts` - Faster model, streaming
- `backend/src/server.ts` - Response optimization

---

### Fix 2: Remove Dummy Data - Make Everything Dynamic 🔴
**Status:** Not Started  
**Issue:** Dashboard shows static mock data instead of real user scans  

**Solution:**
- [ ] Switch Recent Activity to connected component (`useUserScans()`)
- [ ] Switch Activity Chart to connected component (`useWeeklyActivity()`)
- [ ] Create `useMonthlyTrend()` hook
- [ ] Add `GET /api/users/:userId/stats/monthly` endpoint
- [ ] Update dashboard page to use connected components

**Files:**
- `dashboard/src/app/dashboard/page.tsx` - Import connected components
- `dashboard/src/lib/hooks.ts` - Add new hooks
- `dashboard/src/lib/api.ts` - Add API calls
- `backend/src/server.ts` - Add monthly stats endpoint

---

### Fix 3: Fix Dashboard Achievements 🔴
**Status:** Not Started  
**Issue:** Progress bars don't reflect actual scan counts  

**Solution:**
- [ ] Add `checkAndUnlockAchievements(userId)` function
- [ ] Call achievement check after each scan recorded
- [ ] Add `GET /api/users/:userId/achievements/progress` endpoint
- [ ] Update `useUserAchievements()` to fetch progress data
- [ ] Display real progress (e.g., "3/10 scans")

**Files:**
- `backend/src/models/Achievement.ts` - Achievement check function
- `backend/src/server.ts` - Progress endpoint
- `dashboard/src/lib/hooks.ts` - Update hook
- `dashboard/src/app/achievements/page.tsx` - Display progress

---

### Fix 4: Notifications & Profile Page 🔴
**Status:** Not Started  

**4a. Notifications:**
- [ ] Create Notification model
- [ ] Add `GET/POST/PATCH /api/users/:userId/notifications` endpoints
- [ ] Add dropdown in header with real notifications
- [ ] Auto-generate notifications on: achievement unlock, streak milestone

**4b. Profile:**
- [ ] Add `xp` and `level` fields to User model (calculated)
- [ ] Create profile page
- [ ] Replace hardcoded "Level 8 • 1,540 XP" with real data
- [ ] Use dicebear avatar with user ID seed

**XP Calculation:**
- Each scan: +10 XP
- Achievement unlock: +XP reward from achievement
- Level = floor(totalXP / 100) + 1

**Files:**
- `backend/src/models/Notification.ts` - New model
- `backend/src/models/User.ts` - Add XP/level
- `backend/src/server.ts` - Notification endpoints
- `dashboard/src/components/app-header.tsx` - Notification dropdown, real XP
- `dashboard/src/app/profile/page.tsx` - New profile page

---

## ✨ Features

### Feature 1: Better Alternative Recommendations (Actian VectorAI DB) 🔴
**Status:** Not Started  
**Sponsor:** Actian Challenge  

**Architecture:**
```
User scans product → Embedding generated → Vector search in Actian DB 
                                          → Returns similar eco-products
                                          → Show "Better Alternative" card
```

**Implementation:**
- [ ] Set up Actian VectorAI DB Docker container
- [ ] Create `actian.ts` service client
- [ ] Add `POST /api/products/alternatives` endpoint
- [ ] Create eco-products seed database with embeddings
- [ ] Enhance alternatives UI with scrollable list
- [ ] Add "Shop Better Alternative" button with real links

**Docker Setup:**
```bash
docker pull williamimoh/actian-vectorai-db:1.0b
docker run -d -p 8080:8080 williamimoh/actian-vectorai-db:1.0b
```

**Files:**
- `backend/src/services/actian.ts` - New service
- `backend/src/seed/products-seed.ts` - Eco product database
- `backend/src/server.ts` - Alternatives endpoint
- `extension/popup.tsx` - Enhanced alternatives UI

---

### Feature 2: Handle Edge Cases (No Alternative Available) 🔴
**Status:** Not Started  

**Category Rules:**
| Category | Has Alternative? | Action |
|----------|------------------|--------|
| Clothing/Fashion | Yes | Show eco-brands |
| Electronics (GPU, CPU) | No | Show tips to extend product life |
| Appliances | Sometimes | Show Energy Star alternatives |
| Food/Grocery | Yes | Show organic/local alternatives |

**Implementation:**
- [ ] Add product category detection in AI analysis
- [ ] Add `noAlternativeReason` field to response
- [ ] Show "Tips for sustainable use" instead of alternatives

**Files:**
- `backend/src/services/novita.ts` - Category detection
- `backend/src/server.ts` - Response field
- `extension/popup.tsx` - Tips UI

---

## 📈 Progress Tracking

| Task | Status | Commit |
|------|--------|--------|
| Plan created | ✅ | - |
| Fix 0: Next.js logo | ⏳ | - |
| Fix 2: Dynamic data | 🔴 | - |
| Fix 3: Achievements | 🔴 | - |
| Fix 4: Notifications | 🔴 | - |
| Fix 1: Speed optimization | 🔴 | - |
| Feature 1: Actian DB | 🔴 | - |
| Feature 2: Edge cases | 🔴 | - |

**Legend:** ✅ Done | ⏳ In Progress | 🔴 Not Started

---

## 🧪 Testing Commands

**Start all services:**
```bash
# Terminal 1 - MongoDB
brew services start mongodb-community

# Terminal 2 - Backend (port 3001)
cd backend && pnpm dev

# Terminal 3 - Dashboard (port 3002)
cd dashboard && pnpm dev

# Terminal 4 - Extension
cd extension && pnpm dev
```

**Verify services:**
```bash
curl http://localhost:3001/health
curl http://localhost:3002
```

**Test user login:**
- Email: `demo@greenlane.app`
- Name: `Vraj`

---

## 📝 Commit Convention

Each fix/feature gets its own commit with format:
```
fix: [description] (Fix #N)
feat: [description] (Feature #N)
```

Push after each working change to save progress.
