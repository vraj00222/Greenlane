# Phase 3 Integration Test Plan

## Prerequisites
1. Backend running: `cd backend && npx tsx ./src/server.ts`
2. Extension built: `cd extension && npx plasmo dev`
3. Extension loaded in Chrome: `chrome://extensions/` → Load unpacked → `extension/build/chrome-mv3-dev`

## Test Cases

### 1. Backend Health Check
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","ai":{"provider":"Novita AI","model":"deepseek/deepseek-r1"}}`

### 2. API Product Analysis
```bash
curl -X POST http://localhost:3001/api/analyze-product \
  -H "Content-Type: application/json" \
  -d '{"productTitle":"Test Product","price":"$50","brand":"TestBrand"}'
```
Expected: JSON with `greenScore`, `reasons`, `alternatives`

### 3. Extension → Backend Flow
1. Navigate to Amazon product: https://www.amazon.com/dp/B08N5WRWNW
2. Click GreenLane extension icon
3. Observe:
   - [ ] Loading spinner appears
   - [ ] Product info displays (title, price, brand, image)
   - [ ] Green score displays with color (red/yellow/green)
   - [ ] Reasons list appears
   - [ ] Alternative suggestion shows (if score < 80)

### 4. Error Handling
1. Stop the backend server
2. Click extension on Amazon product
3. Should show: "Failed to analyze. Is backend running?"
4. Restart backend, click Retry → Should work

### 5. Non-Amazon Site
1. Navigate to google.com
2. Click extension
3. Should show: "No Product Detected"

## Success Criteria
- ✅ Extension communicates with backend
- ✅ Real product data is scraped and analyzed
- ✅ Scores display correctly
- ✅ Error handling works gracefully
