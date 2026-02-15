#!/bin/bash
# GreenLane Local LLM - ExecuTorch Setup Script
# Downloads and sets up Llama 3.2 1B model for on-device inference

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL_DIR="$SCRIPT_DIR/models"
EXECUTORCH_DIR="$HOME/executorch"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     GreenLane ExecuTorch Setup                            ║"
echo "║     Meta ExecuTorch Sponsor Track - SFHacks 2026          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Create models directory
mkdir -p "$MODEL_DIR"

# Check if model already exists
if [ -f "$MODEL_DIR/llama3_2_1b.pte" ]; then
    echo "✓ Model already downloaded: $MODEL_DIR/llama3_2_1b.pte"
else
    echo "Downloading Llama 3.2 1B model (.pte format)..."
    echo "This may take several minutes (~2.5GB)..."
    
    # Download from HuggingFace (ExecuTorch exported model)
    # Using the official Meta/ExecuTorch compatible format
    cd "$MODEL_DIR"
    
    # Option 1: Use HuggingFace CLI if available
    if command -v huggingface-cli &> /dev/null; then
        echo "Using HuggingFace CLI..."
        huggingface-cli download executorch/llama-3.2-1b-pte llama3_2_1b.pte --local-dir .
    else
        # Option 2: Direct download via curl
        echo "Downloading via curl..."
        curl -L -o llama3_2_1b.pte \
            "https://huggingface.co/executorch/llama-3.2-1b-pte/resolve/main/llama3_2_1b.pte" \
            --progress-bar
    fi
    
    echo "✓ Model downloaded successfully"
fi

# Download tokenizer
if [ -f "$MODEL_DIR/tokenizer.model" ]; then
    echo "✓ Tokenizer already downloaded"
else
    echo "Downloading tokenizer..."
    cd "$MODEL_DIR"
    curl -L -o tokenizer.model \
        "https://huggingface.co/meta-llama/Llama-3.2-1B/resolve/main/tokenizer.model" \
        --progress-bar 2>/dev/null || echo "Note: Tokenizer download may require HF login"
fi

# Check for ExecuTorch installation
if [ -d "$EXECUTORCH_DIR" ]; then
    echo "✓ ExecuTorch found at $EXECUTORCH_DIR"
else
    echo ""
    echo "Installing ExecuTorch Python package..."
    pip3 install executorch 2>/dev/null || pip install executorch
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Setup Complete!                                       ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Model:      $MODEL_DIR/llama3_2_1b.pte"
echo "║  Tokenizer:  $MODEL_DIR/tokenizer.model"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next: Rebuild with ExecuTorch enabled:"
echo "  cd build && cmake .. -DUSE_EXECUTORCH=ON && make -j4"
