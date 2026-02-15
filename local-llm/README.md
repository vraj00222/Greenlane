# GreenLane Local LLM Server

C++ ExecuTorch-based local inference server for privacy-focused product sustainability analysis.

## Prerequisites

- macOS 12+ or Linux
- CMake 3.18+
- C++17 compiler (clang++ or g++)
- ExecuTorch 1.1+

## Quick Start

```bash
# 1. Download the model
./scripts/download_model.sh

# 2. Build the server
mkdir build && cd build
cmake .. && make -j4

# 3. Run
./greenlane-local --port 8765
```

## API Endpoints

### GET /health
Health check endpoint.

```bash
curl http://localhost:8765/health
# {"status": "ok", "model_loaded": true}
```

### POST /analyze
Analyze a product for sustainability.

```bash
curl -X POST http://localhost:8765/analyze \
  -H "Content-Type: application/json" \
  -d '{"productTitle": "Bamboo Toothbrush", "brand": "EcoSmile"}'
```

Response:
```json
{
  "greenScore": 85,
  "positives": ["Biodegradable material", "Plastic-free packaging"],
  "negatives": ["Shipping distance"],
  "recommendation": "Great eco-friendly choice for daily hygiene."
}
```

### GET /status
Server and model status.

```bash
curl http://localhost:8765/status
# {"model": "llama-3.2-1b", "memory_mb": 1200, "inference_time_avg_ms": 850}
```

## Integration with GreenLane Extension

1. Start this server: `./greenlane-local --port 8765`
2. In the Chrome extension, enable "Go Private" in Settings
3. Product analysis will now run locally on your machine

## Model

Uses Llama 3.2 1B Instruct exported to ExecuTorch .pte format (~1GB).

## Meta Sponsor Track

This component enables GreenLane to participate in the Meta ExecuTorch sponsor track at SFHacks 2026 by demonstrating on-device AI inference for privacy-preserving sustainability analysis.
