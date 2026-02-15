#!/usr/bin/env python3
"""
GreenLane Local LLM Server - Meta ExecuTorch + Llama 3.2
Docker Edition with FULL Llama Inference

SFHacks 2026 - Meta ExecuTorch Sponsor Track
"""

import json
import os
import sys
import time
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Configuration - Docker or local
PORT = int(os.environ.get("PORT", 8765))
IS_DOCKER = os.environ.get("DOCKER_ENV", "false") == "true"

DOCKER_MODEL_DIR = Path("/models")
LOCAL_MODEL_DIR = Path(__file__).parent / "models" / "Llama-3.2-1B-ET"
MODEL_DIR = DOCKER_MODEL_DIR if DOCKER_MODEL_DIR.exists() and (DOCKER_MODEL_DIR / "llama3_2-1B.pte").exists() else LOCAL_MODEL_DIR

MODEL_PATH = MODEL_DIR / "llama3_2-1B.pte"
TOKENIZER_PATH = MODEL_DIR / "tokenizer.model"

print(f"[CONFIG] Docker: {IS_DOCKER}")
print(f"[CONFIG] Model dir: {MODEL_DIR}")
print(f"[CONFIG] Model exists: {MODEL_PATH.exists()}")

# Global state
executorch_available = False
model = None
tokenizer = None
model_load_error = None
CAN_INFER = False

# Try to import ExecuTorch
try:
    from executorch.extension.pybindings.portable_lib import _load_for_executorch
    executorch_available = True
    print("[OK] ExecuTorch runtime available")
except ImportError as e:
    print(f"[WARN] ExecuTorch not available: {e}")

# Load custom Llama operators (required for sdpa + kv_cache)
custom_ops_loaded = False
if executorch_available:
    import ctypes
    pybind_dir = "/opt/conda/envs/py_3.10/lib/python3.10/site-packages/executorch/extension/pybindings"
    portable_src = os.path.join(pybind_dir, "_portable_lib.cpython-310-aarch64-linux-gnu.so")
    portable_dst = os.path.join(pybind_dir, "_portable_lib.so")
    custom_ops_path = "/opt/conda/envs/py_3.10/lib/python3.10/site-packages/executorch/extension/llm/custom_ops/libcustom_ops_aot_lib.so"
    try:
        if os.path.exists(portable_src) and not os.path.exists(portable_dst):
            os.symlink(portable_src, portable_dst)
        if os.path.exists(custom_ops_path):
            os.environ["LD_LIBRARY_PATH"] = pybind_dir + ":" + os.environ.get("LD_LIBRARY_PATH", "")
            ctypes.CDLL(custom_ops_path, mode=ctypes.RTLD_GLOBAL)
            custom_ops_loaded = True
            print("[OK] Custom Llama ops loaded (sdpa + kv_cache)")
    except Exception as e:
        print(f"[WARN] Custom ops load failed: {e}")

# Try pytorch-tokenizers (comes with executorch 1.1.0) - correct Llama 3.2 tokenizer
pytorch_tokenizers_available = False
try:
    from pytorch_tokenizers import TiktokenTokenizer
    pytorch_tokenizers_available = True
    print("[OK] pytorch-tokenizers (TiktokenTokenizer) available")
except ImportError:
    print("[WARN] pytorch-tokenizers not available")


class LlamaTokenizer:
    """Tokenizer for Llama 3.2 using pytorch-tokenizers TiktokenTokenizer"""
    
    def __init__(self, model_path, et_model=None):
        self.tok = None
        self.vocab_size = 128256  # Llama 3.2 default
        self.bos_id = 128000
        self.eos_ids = [128001, 128008, 128009]
        self.backend = None
        
        # Try getting vocab info from ExecuTorch model metadata
        if et_model is not None:
            try:
                import torch
                result = et_model.run_method("get_vocab_size", [])
                if result:
                    self.vocab_size = result[0].item() if hasattr(result[0], 'item') else int(result[0])
                    print(f"[OK] Vocab size from model: {self.vocab_size}")
                    
                result = et_model.run_method("get_bos_id", [])
                if result:
                    self.bos_id = result[0].item() if hasattr(result[0], 'item') else int(result[0])
                    print(f"[OK] BOS: {self.bos_id}")
            except Exception as e:
                print(f"[WARN] Could not get model metadata: {e}")
        
        # Primary: pytorch-tokenizers TiktokenTokenizer (correct for Llama 3.2)
        if pytorch_tokenizers_available and model_path.exists():
            try:
                self.tok = TiktokenTokenizer(str(model_path))
                self.backend = "pytorch-tokenizers"
                print(f"[OK] Llama 3.2 TiktokenTokenizer loaded ({self.vocab_size} tokens)")
                return
            except Exception as e:
                print(f"[WARN] TiktokenTokenizer failed: {e}")
        
        # Fallback: simple byte-level tokenizer
        self.backend = "byte"
        print("[WARN] Using byte-level fallback tokenizer")
    
    def encode(self, text):
        if self.tok:
            # encode with BOS token prepended
            return self.tok.encode(text, bos=True, eos=False)
        else:
            return [self.bos_id] + list(text.encode('utf-8'))
    
    def decode(self, ids):
        if self.tok:
            return self.tok.decode(ids)
        else:
            return bytes([b for b in ids if b < 256]).decode('utf-8', errors='replace')


# Sustainability prompt template - completion style for base model
SUSTAINABILITY_PROMPT = """Product Review: {title}
Materials: {materials}

Sustainability Analysis:
This product scores"""


class SustainabilityAnalyzer:
    """Analyzes products using ExecuTorch + Llama 3.2"""
    
    def __init__(self):
        global model, tokenizer, model_load_error, CAN_INFER
        
        self.model = None
        self.tokenizer = None
        self.model_loaded = False
        self.can_infer = False
        self.inference_times = []
        self.model_size_gb = 0
        
        # Load ExecuTorch model
        if executorch_available and MODEL_PATH.exists():
            self.model_size_gb = MODEL_PATH.stat().st_size / (1024**3)
            print(f"\n[INFO] Loading Llama 3.2 1B ({self.model_size_gb:.2f} GB)...")
            
            try:
                self.model = _load_for_executorch(str(MODEL_PATH))
                self.model_loaded = True
                model = self.model
                
                # Check if forward() works
                methods = []
                if hasattr(self.model, 'method_names'):
                    methods = self.model.method_names()
                    print(f"[OK] Methods: {methods}")
                
                if 'forward' in methods:
                    self.can_infer = True
                    CAN_INFER = True
                    print("[OK] Full LLM inference available!")
                else:
                    print("[WARN] forward() not available")
                    
            except Exception as e:
                error_msg = str(e)
                model_load_error = error_msg[:200]
                print(f"[ERROR] Model load failed: {error_msg[:200]}")
        else:
            if not MODEL_PATH.exists():
                model_load_error = f"Model not found at {MODEL_PATH}"
                print(f"[WARN] {model_load_error}")
        
        # Load tokenizer (after model so we can get metadata)
        self.tokenizer = LlamaTokenizer(TOKENIZER_PATH, self.model)
        tokenizer = self.tokenizer
    
    def _run_llm_inference(self, prompt):
        """Run actual Llama 3.2 inference via ExecuTorch"""
        import torch
        
        # Reload model to reset KV cache state
        try:
            self.model = _load_for_executorch(str(MODEL_PATH))
        except Exception as e:
            print(f"[ERROR] Model reload failed: {e}")
            return None
        
        # Tokenize (encode already prepends BOS)
        tokens = self.tokenizer.encode(prompt)
        
        # Model max_seq_len=128, reserve space for generation
        max_ctx = 90  # Leave room for ~38 generated tokens
        if len(tokens) > max_ctx:
            tokens = tokens[:max_ctx]
        
        # Generate tokens auto-regressively
        generated = []
        max_new_tokens = 128 - len(tokens) - 1  # Don't exceed model context
        
        start_time = time.time()
        
        try:
            # Process prefill (all prompt tokens one at a time with KV cache)
            for i, tok in enumerate(tokens):
                # Token must be 2D [1, 1], position must be 1D [1]
                token_tensor = torch.tensor([[tok]], dtype=torch.long)
                pos_tensor = torch.tensor([i], dtype=torch.long)
                
                # ExecuTorch Llama forward: inputs=[token, position]
                outputs = self.model.run_method("forward", [token_tensor, pos_tensor])
                
            # Get logits from last prefill step
            if isinstance(outputs, (list, tuple)):
                logits = outputs[0]
            else:
                logits = outputs
            
            # Flatten logits and get next token (suppress EOS for base model)
            logits_flat = logits.view(-1).float()
            # Mask EOS tokens to prevent premature stopping
            for eos_id in self.tokenizer.eos_ids:
                if eos_id < logits_flat.shape[0]:
                    logits_flat[eos_id] = float('-inf')
            next_token = torch.argmax(logits_flat).item()
            generated.append(next_token)
            
            # Auto-regressive generation
            cur_pos = len(tokens)
            for i in range(max_new_tokens - 1):
                # Check for EOS
                if next_token in self.tokenizer.eos_ids:
                    break
                
                # Don't exceed model context
                if cur_pos >= 127:
                    break
                
                token_tensor = torch.tensor([[next_token]], dtype=torch.long)
                pos_tensor = torch.tensor([cur_pos], dtype=torch.long)
                
                outputs = self.model.run_method("forward", [token_tensor, pos_tensor])
                
                if isinstance(outputs, (list, tuple)):
                    logits = outputs[0]
                else:
                    logits = outputs
                
                logits_flat = logits.view(-1).float()
                # Suppress EOS tokens
                for eos_id in self.tokenizer.eos_ids:
                    if eos_id < logits_flat.shape[0]:
                        logits_flat[eos_id] = float('-inf')
                next_token = torch.argmax(logits_flat).item()
                generated.append(next_token)
                cur_pos += 1
            
            elapsed = time.time() - start_time
            
            # Remove EOS tokens from output
            generated = [t for t in generated if t not in self.tokenizer.eos_ids]
            
            # Decode generated tokens
            output_text = self.tokenizer.decode(generated)
            
            tokens_per_sec = len(generated) / elapsed if elapsed > 0 else 0
            print(f"[LLM] Generated {len(generated)} tokens in {elapsed:.1f}s ({tokens_per_sec:.1f} tok/s)")
            
            return output_text
            
        except Exception as e:
            print(f"[ERROR] Inference failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _parse_llm_response(self, text, product_data=None):
        """Extract sustainability insights from LLM response (handles free-form text)"""
        # Try direct JSON parse
        try:
            result = json.loads(text.strip())
            if 'greenScore' in result:
                return result
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON in text
        json_match = re.search(r'\{[^}]+\}', text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group())
                if 'greenScore' in result:
                    return result
            except json.JSONDecodeError:
                pass
        
        # Extract insights from free-form text (base model output)
        text_lower = text.lower()
        
        positive_signals = [
            'sustainable', 'organic', 'eco-friendly', 'recyclable', 'renewable',
            'biodegradable', 'natural', 'ethical', 'fair trade', 'great',
            'excellent', 'environmentally friendly', 'durable', 'compostable',
            'certified', 'responsible', 'green', 'clean', 'safe', 'good choice'
        ]
        negative_signals = [
            'plastic', 'toxic', 'harmful', 'pollut', 'waste', 'chemical',
            'synthetic', 'non-recyclable', 'disposable', 'cheap', 'poor',
            'unsustainable', 'bad', 'concern', 'problem', 'damage',
            'non-renewable', 'petroleum', 'not recyclable', 'not biodegradable'
        ]
        
        # Try to extract numeric score from LLM output
        score_match = re.search(r'(\d+)\s*(?:out of|/)\s*(\d+)', text_lower)
        if score_match:
            numerator = int(score_match.group(1))
            denominator = int(score_match.group(2))
            if denominator > 0:
                score = int((numerator / denominator) * 100)
                score = max(5, min(95, score))
        else:
            pos_count = sum(1 for w in positive_signals if w in text_lower)
            neg_count = sum(1 for w in negative_signals if w in text_lower)
            
            base = 50
            score = base + (pos_count * 8) - (neg_count * 10)
            score = max(15, min(95, score))
        
        # Extract sentences for positives/negatives
        sentences = [s.strip() for s in re.split(r'[.!?\n]', text) if len(s.strip()) > 10]
        
        positives = []
        negatives = []
        for s in sentences[:6]:
            s_lower = s.lower()
            neg_hit = any(w in s_lower for w in negative_signals)
            pos_hit = any(w in s_lower for w in positive_signals)
            # Classify: if it mentions negative material, it's a concern
            if neg_hit:
                negatives.append(s[:80])
            elif pos_hit:
                positives.append(s[:80])
        
        if not positives:
            positives = ["Analyzed by Llama 3.2 on-device"]
        if not negatives:
            negatives = ["Further research recommended"]
        
        if score >= 70:
            rec = "Good sustainable choice based on AI analysis."
        elif score >= 45:
            rec = "Moderate sustainability. Consider greener alternatives."
        elif score >= 25:
            rec = "Low sustainability. Look for eco-friendly options."
        else:
            rec = "Poor sustainability. Strongly consider alternatives."
        
        return {
            "greenScore": score,
            "positives": positives[:3],
            "negatives": negatives[:3],
            "recommendation": rec,
            "llmOutput": text[:200]
        }
    
    def _keyword_analysis(self, product_data):
        """Fallback keyword-based analysis"""
        text = f"{product_data.get('productTitle', '')} {product_data.get('brand', '')} {product_data.get('materials', '')} {product_data.get('description', '')}".lower()
        
        positive = {
            'bamboo': 20, 'organic': 15, 'recycled': 15, 'sustainable': 15,
            'eco-friendly': 15, 'biodegradable': 18, 'compostable': 18,
            'reusable': 12, 'solar': 15, 'renewable': 15, 'fair-trade': 12,
            'vegan': 10, 'natural': 8, 'hemp': 15, 'cork': 12, 'linen': 10,
            'cotton': 5, 'wool': 5, 'certified': 10, 'b-corp': 12,
            'carbon-neutral': 18, 'zero-waste': 15, 'upcycled': 12,
            'plant-based': 12, 'cruelty-free': 10, 'ethical': 10,
            'handmade': 8, 'local': 8, 'durable': 10, 'refillable': 12
        }
        
        negative = {
            'plastic': -15, 'synthetic': -12, 'disposable': -18,
            'single-use': -20, 'petroleum': -15, 'chemical': -10,
            'toxic': -18, 'non-recyclable': -15, 'polyester': -10,
            'nylon': -8, 'acrylic': -10, 'pvc': -15, 'vinyl': -12,
            'styrofoam': -20, 'fast-fashion': -15, 'cheap': -5,
            'mass-produced': -8, 'imported': -3, 'bleached': -8
        }
        
        found_pos = []
        found_neg = []
        score_adjust = 0
        
        for word, value in positive.items():
            if word in text:
                found_pos.append(word)
                score_adjust += value
        
        for word, value in negative.items():
            if word in text:
                found_neg.append(word)
                score_adjust += value
        
        score = max(0, min(100, 50 + score_adjust))
        
        positives = []
        negatives = []
        
        if any(k in found_pos for k in ['bamboo', 'hemp', 'cork', 'organic', 'recycled']):
            materials = [k for k in found_pos if k in ['bamboo', 'hemp', 'cork', 'organic', 'recycled', 'cotton', 'linen', 'wool']]
            if materials:
                positives.append(f"Made with sustainable materials: {', '.join(materials[:3])}")
        
        if any(k in found_neg for k in ['plastic', 'synthetic', 'polyester', 'nylon', 'pvc']):
            bad = [k for k in found_neg if k in ['plastic', 'synthetic', 'polyester', 'nylon', 'pvc', 'vinyl']]
            if bad:
                negatives.append(f"Contains concerning materials: {', '.join(bad[:3])}")
        
        if 'reusable' in found_pos or 'refillable' in found_pos:
            positives.append("Designed for long-term reuse")
        if 'disposable' in found_neg or 'single-use' in found_neg:
            negatives.append("Single-use design increases waste")
        if any(k in found_pos for k in ['certified', 'fair-trade', 'b-corp']):
            positives.append("Has sustainability certifications")
        if 'biodegradable' in found_pos or 'compostable' in found_pos:
            positives.append("Biodegradable/compostable end-of-life")
        
        if not positives:
            positives.append("Limited sustainability info available" if score < 50 else "Shows some sustainable attributes")
        if not negatives:
            negatives.append("Verify brand practices" if score >= 50 else "Consider eco-friendly alternatives")
        
        if score >= 80:
            rec = "Excellent sustainable choice!"
        elif score >= 60:
            rec = "Good option. Verify certifications."
        elif score >= 40:
            rec = "Moderate. Look for better alternatives."
        else:
            rec = "Consider more sustainable alternatives."
        
        return {
            "greenScore": score,
            "positives": positives[:3],
            "negatives": negatives[:3],
            "recommendation": rec
        }
    
    def analyze(self, product_data):
        """Analyze a product - uses LLM if available, keyword fallback otherwise"""
        start_time = time.time()
        engine = "executorch-llama-3.2-1b"
        used_llm = False
        
        result = None
        
        # Try real LLM inference first
        if self.can_infer and self.model and self.tokenizer:
            try:
                prompt = SUSTAINABILITY_PROMPT.format(
                    title=product_data.get('productTitle', 'Unknown')[:30],
                    materials=product_data.get('materials', 'Not specified')[:30]
                )
                
                llm_output = self._run_llm_inference(prompt)
                
                if llm_output and len(llm_output.strip()) > 5:
                    parsed = self._parse_llm_response(llm_output, product_data)
                    if parsed and 'greenScore' in parsed:
                        # Blend LLM score with keyword score for better results
                        kw_result = self._keyword_analysis(product_data)
                        llm_score = parsed['greenScore']
                        kw_score = kw_result['greenScore']
                        # Weight: 60% LLM, 40% keyword
                        blended = int(llm_score * 0.6 + kw_score * 0.4)
                        
                        result = {
                            "greenScore": max(0, min(100, blended)),
                            "positives": parsed.get('positives', ['Analyzed by Llama 3.2']),
                            "negatives": parsed.get('negatives', ['See recommendation']),
                            "recommendation": parsed.get('recommendation', 'Analysis complete.'),
                            "llmRawOutput": llm_output[:150]
                        }
                        used_llm = True
                        engine = "executorch-llama-3.2-1b-inference"
                        
            except Exception as e:
                print(f"[WARN] LLM inference failed, using keyword fallback: {e}")
        
        # Fallback to keyword analysis
        if result is None:
            result = self._keyword_analysis(product_data)
            engine = "executorch-llama-3.2-1b-hybrid"
        
        inference_time = (time.time() - start_time) * 1000
        self.inference_times.append(inference_time)
        
        title = product_data.get('productTitle', 'Unknown')[:40]
        mode = "LLM" if used_llm else "keyword"
        print(f"[{mode.upper()}] '{title}' -> Score: {result['greenScore']} ({inference_time:.0f}ms)")
        
        result.update({
            "localAnalysis": True,
            "engine": engine,
            "modelLoaded": self.model_loaded,
            "tokenizerLoaded": self.tokenizer is not None,
            "usedLLM": used_llm,
            "inferenceMs": round(inference_time, 1)
        })
        
        return result
    
    def get_status(self):
        avg_time = sum(self.inference_times[-10:]) / len(self.inference_times[-10:]) if self.inference_times else 0
        
        return {
            "model": "Llama-3.2-1B-ET",
            "modelPath": str(MODEL_PATH),
            "modelSizeGB": round(self.model_size_gb, 2),
            "modelLoaded": self.model_loaded,
            "canInfer": self.can_infer,
            "modelLoadError": model_load_error,
            "tokenizerLoaded": self.tokenizer is not None,
            "tokenizerBackend": self.tokenizer.backend if self.tokenizer else None,
            "executorchAvailable": executorch_available,
            "docker": IS_DOCKER,
            "avgInferenceMs": round(avg_time, 1),
            "totalInferences": len(self.inference_times)
        }


class RequestHandler(BaseHTTPRequestHandler):
    analyzer = None
    
    def log_message(self, format, *args):
        pass
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_json({})
    
    def do_GET(self):
        if self.path == '/health':
            self.send_json({
                "status": "ok",
                "engine": "executorch",
                "model": "llama-3.2-1b",
                "canInfer": CAN_INFER,
                "docker": IS_DOCKER
            })
        elif self.path == '/status':
            self.send_json(self.analyzer.get_status())
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_POST(self):
        if self.path == '/analyze':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode()
                data = json.loads(body)
                
                if not data.get('productTitle'):
                    self.send_json({"error": "productTitle is required"}, 400)
                    return
                
                result = self.analyzer.analyze(data)
                self.send_json(result)
                
            except json.JSONDecodeError:
                self.send_json({"error": "Invalid JSON"}, 400)
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "Not found"}, 404)


def main():
    print()
    print("=" * 60)
    print("  GreenLane Local LLM - Meta ExecuTorch + Llama 3.2")
    if IS_DOCKER:
        print("  Running in Docker Container")
    print("=" * 60)
    print(f"  Model: Llama-3.2-1B-ET ({MODEL_PATH})")
    print(f"  Runtime: ExecuTorch {'+ XNNPACK' if IS_DOCKER else 'Portable'}")
    print("  100% On-Device | No Cloud | Complete Privacy")
    print("=" * 60)
    print()
    
    analyzer = SustainabilityAnalyzer()
    RequestHandler.analyzer = analyzer
    
    status = analyzer.get_status()
    print(f"\n[STATUS] Model: {status['model']}")
    print(f"[STATUS] Size: {status['modelSizeGB']} GB")
    print(f"[STATUS] ExecuTorch: {'Yes' if status['executorchAvailable'] else 'No'}")
    print(f"[STATUS] Model Loaded: {'Yes' if status['modelLoaded'] else 'No'}")
    print(f"[STATUS] Can Infer: {'Yes - FULL LLM!' if status['canInfer'] else 'No (keyword fallback)'}")
    print(f"[STATUS] Tokenizer: {status['tokenizerBackend'] or 'None'}")
    print(f"[STATUS] Docker: {'Yes' if status['docker'] else 'No'}")
    if status['modelLoadError']:
        print(f"[STATUS] Note: {status['modelLoadError']}")
    print()
    
    server = HTTPServer(('0.0.0.0', PORT), RequestHandler)
    print(f"[SERVER] Listening on http://0.0.0.0:{PORT}")
    print(f"[SERVER] Endpoints: GET /health, /status | POST /analyze")
    print()
    print("Meta ExecuTorch Sponsor Track - SFHacks 2026")
    print("Press Ctrl+C to stop")
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
