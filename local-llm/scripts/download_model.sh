#!/bin/bash
# Download pre-exported Llama model for ExecuTorch

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODELS_DIR="$SCRIPT_DIR/../models"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     GreenLane Model Downloader                            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# For hackathon: use a smaller model or mock
# Real ExecuTorch models would be downloaded from Meta's releases
MODEL_URL="https://huggingface.co/models/placeholder"  # Placeholder
MODEL_FILE="$MODELS_DIR/llama-1b.pte"

echo "Note: For the hackathon demo, we're using mock mode."
echo "To use a real ExecuTorch model:"
echo ""
echo "1. Install ExecuTorch: pip install executorch"
echo "2. Export the model:"
echo "   python -m executorch.examples.models.llama.export_llama \\"
echo "     --model meta-llama/Llama-3.2-1B-Instruct \\"
echo "     --output $MODEL_FILE"
echo ""
echo "For now, the server will run in mock mode which simulates"
echo "sustainability analysis without a real LLM."
echo ""

# Create a placeholder file to indicate mock mode
touch "$MODELS_DIR/MOCK_MODE"

echo "✓ Ready to run in mock mode"
echo "  Start server: ./build/greenlane-local --port 8765"
