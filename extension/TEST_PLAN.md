# Extension Phase 1 Tests

## Setup

1. Install dependencies:
   ```bash
   cd extension && pnpm install
   ```

2. Start development build:
   ```bash
   pnpm dev
   ```

3. Load extension in Chrome:
   - Open Chrome and navigate to: `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the folder: `extension/build/chrome-mv3-dev`

## Test Cases

### Basic Extension Loading
- [ ] Extension appears in Chrome toolbar with 🌿 icon
- [ ] No errors in `chrome://extensions/` page

### Amazon Product Detection
1. Navigate to: https://www.amazon.com/dp/B08N5WRWNW (Echo Dot)
2. Open Chrome DevTools Console (F12 or Cmd+Option+I)
3. Verify console shows: `GreenLane: Content script loaded on https://www.amazon.com/...`
4. Verify console shows: `GreenLane: Scraped product data: {...}`

### Popup - Product Page
1. While on Amazon product page, click the GreenLane extension icon
2. Popup should display:
   - [ ] Product title (verify it matches the page)
   - [ ] Product price (verify it matches)
   - [ ] Brand name
   - [ ] Product image thumbnail
   - [ ] "Analyzing..." loading spinner (if backend not running)
   - [ ] Error message: "Failed to analyze. Is backend running?" (expected without backend)

### Popup - Non-Product Page
1. Navigate to https://www.google.com
2. Click extension icon
3. Popup should show:
   - [ ] "No Product Detected" message
   - [ ] Shopping cart emoji (🛒)
   - [ ] Helpful text about visiting Amazon

### Popup - Amazon Non-Product Page
1. Navigate to https://www.amazon.com (homepage)
2. Click extension icon  
3. Should show "No Product Detected" (no specific product on homepage)

### Console Errors
- [ ] Check DevTools Console - should have NO red errors
- [ ] Extension errors page (`chrome://extensions/` → Details → Errors) should be empty

## Success Criteria

✅ All checkboxes above pass
✅ Console shows expected GreenLane logs
✅ No red errors in any console
✅ Extension UI renders properly

## Notes

- The "Failed to analyze" error is EXPECTED at this phase since backend isn't running yet
- Phase 2 will add the backend API
- Phase 3 will connect them together

## Troubleshooting

### Extension not appearing
- Make sure you selected the `build/chrome-mv3-dev` folder, not just `build/`
- Try clicking the puzzle icon in Chrome toolbar to pin the extension

### Content script not loading
- Refresh the Amazon page after loading extension
- Check that the URL matches `*.amazon.com/*`

### Popup blank or errors
- Check popup console: Right-click extension icon → Inspect Popup
- Look for React or network errors
