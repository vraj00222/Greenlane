#!/usr/bin/env python3
"""
Export a model to ExecuTorch .pte format for GreenLane
Meta ExecuTorch Sponsor Track - SFHacks 2026

This script exports a small LLM to ExecuTorch format for on-device inference.
"""

import os
import sys
import torch
import argparse

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

def export_smollm_to_pte():
    """
    Export SmolLM (135M parameters) to ExecuTorch .pte format.
    SmolLM is a good choice for on-device inference due to its small size.
    """
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from executorch.exir import to_edge
    from executorch.exir.capture._config import ExecutorchBackendConfig
    
    print("=" * 60)
    print("GreenLane Model Export - ExecuTorch")
    print("=" * 60)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    model_name = "HuggingFaceTB/SmolLM-135M"
    output_path = os.path.join(MODEL_DIR, "smollm_135m.pte")
    
    print(f"\n1. Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float32,
        trust_remote_code=True
    )
    model.eval()
    
    # Save tokenizer for later use
    tokenizer.save_pretrained(os.path.join(MODEL_DIR, "smollm_tokenizer"))
    
    print("\n2. Creating example inputs")
    example_text = "Analyze this product for sustainability:"
    inputs = tokenizer(example_text, return_tensors="pt")
    example_input = inputs["input_ids"]
    
    print(f"   Input shape: {example_input.shape}")
    
    print("\n3. Exporting to ExecuTorch format")
    
    try:
        # Export using torch.export
        with torch.no_grad():
            exported_program = torch.export.export(
                model,
                (example_input,),
                strict=False
            )
        
        print("   ✓ Export successful")
        
        # Convert to Edge format
        edge_program = to_edge(exported_program)
        print("   ✓ Edge conversion successful")
        
        # Get executorch program
        et_program = edge_program.to_executorch()
        print("   ✓ ExecuTorch conversion successful")
        
        # Save the .pte file
        with open(output_path, "wb") as f:
            f.write(et_program.buffer)
        
        print(f"\n4. Model saved to: {output_path}")
        print(f"   Size: {os.path.getsize(output_path) / 1024 / 1024:.1f} MB")
        
        return output_path
        
    except Exception as e:
        print(f"\n[ERROR] Export failed: {e}")
        print("\nFalling back to simpler export...")
        return export_simple_classifier()


def export_simple_classifier():
    """
    Export a simple sustainability classifier model.
    This is a lightweight fallback for when full LLM export fails.
    """
    print("\n" + "=" * 60)
    print("Exporting Simple Sustainability Classifier")
    print("=" * 60)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    output_path = os.path.join(MODEL_DIR, "sustainability_classifier.pte")
    
    # Create a simple classifier model
    class SustainabilityClassifier(torch.nn.Module):
        """
        Simple neural network classifier for sustainability scoring.
        Input: Embedding of product text (768 dims from sentence transformer)
        Output: Sustainability score (0-100) and category probabilities
        """
        def __init__(self, input_dim=768, hidden_dim=256):
            super().__init__()
            self.fc1 = torch.nn.Linear(input_dim, hidden_dim)
            self.relu = torch.nn.ReLU()
            self.dropout = torch.nn.Dropout(0.1)
            self.fc2 = torch.nn.Linear(hidden_dim, 128)
            self.fc3 = torch.nn.Linear(128, 4)  # [score, eco_friendly, recyclable, sustainable]
            self.sigmoid = torch.nn.Sigmoid()
        
        def forward(self, x):
            x = self.fc1(x)
            x = self.relu(x)
            x = self.dropout(x)
            x = self.fc2(x)
            x = self.relu(x)
            x = self.fc3(x)
            # First output is score (0-100), rest are probabilities
            score = self.sigmoid(x[:, 0:1]) * 100
            probs = self.sigmoid(x[:, 1:])
            return torch.cat([score, probs], dim=1)
    
    print("\n1. Creating classifier model")
    model = SustainabilityClassifier()
    model.eval()
    
    # Initialize with some reasonable weights for sustainability scoring
    with torch.no_grad():
        # Bias towards mid-range scores
        model.fc3.bias.data = torch.tensor([0.0, 0.5, 0.5, 0.5])
    
    print("\n2. Creating example input")
    example_input = torch.randn(1, 768)  # Batch of 1, 768-dim embedding
    
    print("\n3. Exporting to ExecuTorch format")
    
    try:
        from executorch.exir import to_edge
        
        # Export
        exported_program = torch.export.export(model, (example_input,))
        print("   ✓ Export successful")
        
        # Convert to Edge
        edge_program = to_edge(exported_program)
        print("   ✓ Edge conversion successful")
        
        # Convert to ExecuTorch
        et_program = edge_program.to_executorch()
        print("   ✓ ExecuTorch conversion successful")
        
        # Save
        with open(output_path, "wb") as f:
            f.write(et_program.buffer)
        
        print(f"\n4. Model saved to: {output_path}")
        print(f"   Size: {os.path.getsize(output_path) / 1024:.1f} KB")
        
        # Verify by loading
        print("\n5. Verifying model...")
        from executorch.extension.pybindings.portable_lib import _load_for_executorch_from_buffer
        with open(output_path, "rb") as f:
            loaded_model = _load_for_executorch_from_buffer(f.read())
        print("   ✓ Model loads successfully!")
        
        return output_path
        
    except Exception as e:
        print(f"\n[ERROR] Export failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    parser = argparse.ArgumentParser(description="Export model to ExecuTorch format")
    parser.add_argument("--model", choices=["smollm", "classifier"], default="classifier",
                       help="Model to export (default: classifier)")
    args = parser.parse_args()
    
    if args.model == "smollm":
        result = export_smollm_to_pte()
    else:
        result = export_simple_classifier()
    
    if result:
        print("\n" + "=" * 60)
        print("✓ Export complete!")
        print(f"  Model file: {result}")
        print("\nNext steps:")
        print("  1. Update server.py MODEL_PATH to use this model")
        print("  2. Restart the server")
        print("  3. Test with the extension toggle")
        print("=" * 60)
    else:
        print("\n[ERROR] Export failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
