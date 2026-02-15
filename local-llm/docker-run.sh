#!/bin/bash
# GreenLane ExecuTorch Docker Build & Run
# SFHacks 2026 - Meta Sponsor Track

set -e

echo "============================================"
echo "  GreenLane ExecuTorch Docker Setup"
echo "  Model: Llama 3.2 1B (2.3GB)"
echo "============================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

# Check model exists
MODEL_PATH="./models/Llama-3.2-1B-ET/llama3_2-1B.pte"
if [ ! -f "$MODEL_PATH" ]; then
    echo "ERROR: Model not found at $MODEL_PATH"
    echo "Make sure the Llama 3.2 1B .pte model is in local-llm/models/Llama-3.2-1B-ET/"
    exit 1
fi

echo "Model found: $(du -h $MODEL_PATH | cut -f1)"
echo ""

# Option 1: Try the pre-built hackathon image first (faster)
echo "=== Option 1: Pull pre-built ExecuTorch hackathon image ==="
echo "Attempting to pull psiddh/executorch-hackathon:basic-arm64..."
if docker pull psiddh/executorch-hackathon:basic-arm64 2>/dev/null; then
    echo "Pre-built image available! Running with it..."
    docker run -d \
        --name greenlane-executorch \
        -p 8765:8765 \
        -v "$(pwd)/models/Llama-3.2-1B-ET:/app/models/Llama-3.2-1B-ET:ro" \
        -v "$(pwd)/server.py:/app/server.py:ro" \
        -e PORT=8765 \
        -e DOCKER_ENV=true \
        psiddh/executorch-hackathon:basic-arm64 \
        python /app/server.py
    echo ""
    echo "Server running at http://localhost:8765"
    echo "Check: curl http://localhost:8765/status"
    exit 0
fi

echo ""
echo "Pre-built image not available. Building from Dockerfile..."
echo ""

# Option 2: Build from Dockerfile
echo "=== Option 2: Building ExecuTorch from source ==="
echo "This may take 15-30 minutes on first build..."
echo ""
docker compose up --build -d

echo ""
echo "============================================"
echo "  ExecuTorch server starting..."
echo "  URL: http://localhost:8765"
echo "  Check: curl http://localhost:8765/status"
echo "  Logs: docker logs greenlane-executorch -f"
echo "============================================"
