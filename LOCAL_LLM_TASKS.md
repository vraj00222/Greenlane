# GreenLane Local LLM (C++ ExecuTorch) - Task Tracker

**Branch**: `feature/local-llm-cpp`  
**Goal**: "Go Private" toggle using C++ ExecuTorch companion app for on-device LLM inference  
**Meta Sponsor Track**: On-device AI with ExecuTorch

---

## Architecture Overview

```
┌─────────────────┐     localhost:8765     ┌──────────────────────┐
│ Chrome Extension│ ◄──────────────────────► C++ ExecuTorch Server │
│   (popup.tsx)   │      JSON API          │  (llama model .pte)  │
└─────────────────┘                        └──────────────────────┘
```

---

## Tasks

### Phase 1: C++ Server Setup
- [x] **1.1** Create `local-llm/` directory structure
- [x] **1.2** Set up CMakeLists.txt with ExecuTorch dependencies
- [x] **1.3** Download/export Llama 3.2 1B model to .pte format (mock mode for demo)
- [x] **1.4** Implement basic HTTP server (cpp-httplib)
- [x] **1.5** Test: Server starts and responds to health check

### Phase 2: ExecuTorch Integration
- [ ] **2.1** Initialize ExecuTorch runtime in C++
- [ ] **2.2** Load .pte model file
- [ ] **2.3** Implement tokenizer (sentencepiece or tiktoken)
- [ ] **2.4** Create inference function with prompt template
- [ ] **2.5** Test: Run sample sustainability prompt, get JSON output

### Phase 3: API Endpoints
- [ ] **3.1** Implement POST `/analyze` endpoint (receives product data)
- [ ] **3.2** Implement GET `/health` endpoint
- [ ] **3.3** Implement GET `/status` endpoint (model loaded, memory usage)
- [ ] **3.4** Add CORS headers for extension access
- [ ] **3.5** Test: curl POST to /analyze returns valid JSON

### Phase 4: Extension UI
- [ ] **4.1** Add "Go Private" toggle in SettingsView (popup.tsx)
- [ ] **4.2** Store preference in chrome.storage.local
- [ ] **4.3** Add lock icon animation on toggle
- [ ] **4.4** Add server status indicator (green dot = connected)
- [ ] **4.5** Test: Toggle persists across popup close/open

### Phase 5: Extension Integration
- [ ] **5.1** Add `checkLocalServer()` function in popup.tsx
- [ ] **5.2** Modify `fetchAnalysis()` to branch based on toggle
- [ ] **5.3** Call localhost:8765/analyze when private mode enabled
- [ ] **5.4** Handle server-down gracefully (show "Start local AI" message)
- [ ] **5.5** Test: Full flow - toggle on, analyze product locally

### Phase 6: Build & Distribution
- [ ] **6.1** Create build script for macOS (CMake)
- [ ] **6.2** Create simple installer/launcher script
- [ ] **6.3** Add model download script (fetches .pte from GitHub releases)
- [ ] **6.4** Write README with setup instructions
- [ ] **6.5** Test: Fresh clone → build → run → works

### Phase 7: Final Testing & Merge
- [ ] **7.1** Test on Amazon product page
- [ ] **7.2** Test toggle on/off transitions
- [ ] **7.3** Test server restart while extension open
- [ ] **7.4** Performance check (inference time < 10s)
- [ ] **7.5** Merge to main: `git checkout main && git merge feature/local-llm-cpp`

---

## Current Task

**Working on**: 4.1 - Add "Go Private" toggle in extension UI  
**Status**: Starting  
**Notes**: Phase 1 complete. Moving to extension integration.

---

## File Structure (Target)

```
sfhacks/
├── local-llm/                    # NEW - C++ ExecuTorch server
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── main.cpp              # HTTP server + entry point
│   │   ├── inference.cpp         # ExecuTorch model runner
│   │   ├── inference.h
│   │   ├── tokenizer.cpp         # Token encode/decode
│   │   └── tokenizer.h
│   ├── include/
│   │   ├── httplib.h             # cpp-httplib (header-only)
│   │   └── json.hpp              # nlohmann/json (header-only)
│   ├── models/                   # .pte model files (gitignored)
│   │   └── .gitkeep
│   ├── scripts/
│   │   ├── download_model.sh     # Downloads pre-exported .pte
│   │   └── export_model.py       # Export from HuggingFace (optional)
│   └── README.md
├── extension/
│   └── popup.tsx                 # Modified - adds Go Private toggle
├── backend/                      # Unchanged
└── dashboard/                    # Unchanged
```

---

## Commands Reference

```bash
# Build C++ server
cd local-llm && mkdir build && cd build
cmake .. && make -j4

# Run server
./greenlane-local --model ../models/llama-1b.pte --port 8765

# Test endpoint
curl -X POST http://localhost:8765/analyze \
  -H "Content-Type: application/json" \
  -d '{"productTitle":"Bamboo Toothbrush","brand":"EcoSmile"}'

# Export model (if needed)
python scripts/export_model.py --model meta-llama/Llama-3.2-1B-Instruct --output models/llama-1b.pte
```

---

## Dependencies

**C++ Server:**
- ExecuTorch 1.1+ (PyTorch edge runtime)
- cpp-httplib (header-only HTTP server)
- nlohmann/json (JSON parsing)
- sentencepiece (tokenization)

**Model:**
- Llama 3.2 1B Instruct (.pte format, ~1GB)
- Pre-exported from Meta's ExecuTorch examples

---

## Progress Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-02-14 | Branch created | ✅ | `feature/local-llm-cpp` |
| 2026-02-14 | 1.1 Directory structure | ✅ | local-llm/ with src/, include/, models/, scripts/ |
| 2026-02-14 | 1.2 CMakeLists.txt | ✅ | C++17, header-only libs |
| 2026-02-14 | 1.3 Model setup | ✅ | Mock mode for demo |
| 2026-02-14 | 1.4 HTTP server | ✅ | cpp-httplib, /health, /analyze, /status |
| 2026-02-14 | 1.5 Server test | ✅ | Returns correct greenScore (73 for bamboo, 23 for plastic) |
| | | | |
