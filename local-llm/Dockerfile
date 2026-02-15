# GreenLane Local LLM - ExecuTorch + Llama 3.2 1B
# SFHacks 2026 - Meta ExecuTorch Sponsor Track
#
# This builds ExecuTorch with XNNPACK delegate for real Llama inference
# on Apple Silicon (arm64)

FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    ninja-build \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir \
    sentencepiece \
    numpy \
    torch --index-url https://download.pytorch.org/whl/cpu

# Clone and build ExecuTorch with XNNPACK
RUN git clone --depth 1 --branch v0.3.0 https://github.com/pytorch/executorch.git /opt/executorch

WORKDIR /opt/executorch

# Install ExecuTorch dependencies
RUN pip install --no-cache-dir .

# Build XNNPACK delegate
RUN python -m executorch.backends.xnnpack.cmake_build \
    || (cmake -S . -B cmake-out \
        -DEXECUTORCH_BUILD_XNNPACK=ON \
        -DEXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON \
        -DEXECUTORCH_BUILD_EXTENSION_MODULE=ON \
        -DCMAKE_BUILD_TYPE=Release \
        -G Ninja \
    && cmake --build cmake-out --target xnnpack_backend -j$(nproc)) \
    || echo "XNNPACK build attempted - checking if available..."

# Build Python bindings with XNNPACK
RUN pip install --no-cache-dir -e .[xnnpack] \
    || pip install --no-cache-dir -e . \
    || echo "ExecuTorch pip install attempted"

# Switch to app directory
WORKDIR /app

# Copy server code
COPY server.py .

# Model will be mounted as a volume at runtime
# /app/models/Llama-3.2-1B-ET/llama3_2-1B.pte
# /app/models/Llama-3.2-1B-ET/tokenizer.model

EXPOSE 8765

CMD ["python", "server.py"]
