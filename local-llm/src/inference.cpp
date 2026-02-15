#include "inference.h"
#include "tokenizer.h"
#include <iostream>
#include <chrono>
#include <numeric>
#include <sstream>
#include <fstream>
#include <regex>

#ifdef USE_EXECUTORCH
#include <executorch/runtime/executor/program.h>
#include <executorch/runtime/executor/method.h>
#include <executorch/runtime/executor/method_meta.h>
#include <executorch/runtime/platform/runtime.h>
#endif

namespace greenlane {

class InferenceEngine::Impl {
public:
    bool modelLoaded = false;
    std::string modelName = "mock-llm";
    std::vector<double> inferenceTimes;
    std::unique_ptr<Tokenizer> tokenizer;
    
#ifdef USE_EXECUTORCH
    std::unique_ptr<torch::executor::Program> program;
    std::unique_ptr<torch::executor::Method> method;
#endif

    std::string buildPrompt(const ProductData& product) {
        std::ostringstream prompt;
        prompt << "You are a sustainability expert. Analyze this product and return JSON only.\n\n";
        prompt << "Product: " << product.productTitle << "\n";
        prompt << "Brand: " << product.brand << "\n";
        if (!product.price.empty()) {
            prompt << "Price: " << product.price << "\n";
        }
        if (!product.materials.empty()) {
            prompt << "Materials: " << product.materials << "\n";
        }
        prompt << "\nScore based on: recycled content, natural materials, durability, ";
        prompt << "certifications, packaging, manufacturing impact, shipping, end-of-life.\n\n";
        prompt << "Return this exact JSON structure:\n";
        prompt << "{\n";
        prompt << "  \"greenScore\": <0-100>,\n";
        prompt << "  \"positives\": [\"<aspect1>\", \"<aspect2>\", \"<aspect3>\"],\n";
        prompt << "  \"negatives\": [\"<aspect1>\", \"<aspect2>\", \"<aspect3>\"],\n";
        prompt << "  \"recommendation\": \"<one sentence>\"\n";
        prompt << "}\n";
        return prompt.str();
    }
    
    // Mock inference for testing without model
    SustainabilityAnalysis mockInference(const ProductData& product) {
        SustainabilityAnalysis result;
        
        // Simple heuristic scoring for demo
        int score = 50;
        
        std::string titleLower = product.productTitle;
        std::transform(titleLower.begin(), titleLower.end(), titleLower.begin(), ::tolower);
        std::string brandLower = product.brand;
        std::transform(brandLower.begin(), brandLower.end(), brandLower.begin(), ::tolower);
        
        // Positive keywords
        if (titleLower.find("bamboo") != std::string::npos) score += 15;
        if (titleLower.find("organic") != std::string::npos) score += 10;
        if (titleLower.find("recycled") != std::string::npos) score += 15;
        if (titleLower.find("sustainable") != std::string::npos) score += 10;
        if (titleLower.find("eco") != std::string::npos) score += 8;
        if (titleLower.find("biodegradable") != std::string::npos) score += 12;
        if (titleLower.find("reusable") != std::string::npos) score += 10;
        
        // Negative keywords
        if (titleLower.find("plastic") != std::string::npos) score -= 15;
        if (titleLower.find("disposable") != std::string::npos) score -= 12;
        if (titleLower.find("single-use") != std::string::npos) score -= 15;
        if (titleLower.find("vinyl") != std::string::npos) score -= 10;
        
        result.greenScore = std::max(0, std::min(100, score));
        
        // Generate positives based on keywords found
        if (titleLower.find("bamboo") != std::string::npos) 
            result.positives.push_back("Made from sustainable bamboo");
        if (titleLower.find("recycled") != std::string::npos) 
            result.positives.push_back("Uses recycled materials");
        if (titleLower.find("organic") != std::string::npos) 
            result.positives.push_back("Organic materials reduce chemical impact");
        if (result.positives.empty())
            result.positives.push_back("Product category has room for improvement");
        
        // Generate negatives
        if (titleLower.find("plastic") != std::string::npos) 
            result.negatives.push_back("Contains plastic components");
        if (titleLower.find("disposable") != std::string::npos) 
            result.negatives.push_back("Single-use design creates waste");
        if (result.negatives.empty())
            result.negatives.push_back("Limited sustainability certifications visible");
        
        // Generate recommendation
        if (result.greenScore >= 70) {
            result.recommendation = "Good eco-friendly choice. Consider the product's full lifecycle.";
        } else if (result.greenScore >= 40) {
            result.recommendation = "Average sustainability. Look for certified eco-alternatives.";
        } else {
            result.recommendation = "Consider more sustainable alternatives for this product category.";
        }
        
        return result;
    }
};

InferenceEngine::InferenceEngine() : pImpl(std::make_unique<Impl>()) {
    pImpl->tokenizer = std::make_unique<Tokenizer>();
}

InferenceEngine::~InferenceEngine() = default;

bool InferenceEngine::loadModel(const std::string& modelPath) {
    std::cout << "[InferenceEngine] Loading model from: " << modelPath << std::endl;
    
#ifdef USE_EXECUTORCH
    // Read .pte file
    std::ifstream file(modelPath, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "[InferenceEngine] Failed to open model file: " << modelPath << std::endl;
        return false;
    }
    
    size_t fileSize = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<char> buffer(fileSize);
    if (!file.read(buffer.data(), fileSize)) {
        std::cerr << "[InferenceEngine] Failed to read model file" << std::endl;
        return false;
    }
    
    // Load ExecuTorch program
    auto program = torch::executor::Program::load(buffer.data(), fileSize);
    if (!program.ok()) {
        std::cerr << "[InferenceEngine] Failed to load ExecuTorch program" << std::endl;
        return false;
    }
    
    pImpl->program = std::make_unique<torch::executor::Program>(std::move(program.get()));
    pImpl->modelName = "llama-3.2-1b";
    pImpl->modelLoaded = true;
    
    std::cout << "[InferenceEngine] Model loaded successfully via ExecuTorch" << std::endl;
#else
    // Mock mode - pretend model is loaded for testing
    std::cout << "[InferenceEngine] Running in MOCK mode (ExecuTorch disabled)" << std::endl;
    pImpl->modelName = "mock-sustainability-analyzer";
    pImpl->modelLoaded = true;
#endif
    
    return true;
}

bool InferenceEngine::isModelLoaded() const {
    return pImpl->modelLoaded;
}

std::optional<SustainabilityAnalysis> InferenceEngine::analyze(const ProductData& product) {
    if (!pImpl->modelLoaded) {
        std::cerr << "[InferenceEngine] Model not loaded" << std::endl;
        return std::nullopt;
    }
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    std::string prompt = pImpl->buildPrompt(product);
    std::cout << "[InferenceEngine] Analyzing: " << product.productTitle << std::endl;
    
    SustainabilityAnalysis result;
    
#ifdef USE_EXECUTORCH
    // Real ExecuTorch inference
    // TODO: Implement actual inference with tokenization
    // For now, fall back to mock
    result = pImpl->mockInference(product);
#else
    // Mock inference
    result = pImpl->mockInference(product);
#endif
    
    auto endTime = std::chrono::high_resolution_clock::now();
    double inferenceTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    pImpl->inferenceTimes.push_back(inferenceTime);
    
    // Keep only last 100 times
    if (pImpl->inferenceTimes.size() > 100) {
        pImpl->inferenceTimes.erase(pImpl->inferenceTimes.begin());
    }
    
    std::cout << "[InferenceEngine] Analysis complete in " << inferenceTime << "ms" << std::endl;
    
    return result;
}

std::string InferenceEngine::getModelName() const {
    return pImpl->modelName;
}

size_t InferenceEngine::getMemoryUsageMB() const {
#ifdef USE_EXECUTORCH
    return 1200; // ~1.2GB for Llama 3.2 1B
#else
    return 50; // Mock mode uses minimal memory
#endif
}

double InferenceEngine::getAvgInferenceTimeMs() const {
    if (pImpl->inferenceTimes.empty()) return 0.0;
    return std::accumulate(pImpl->inferenceTimes.begin(), pImpl->inferenceTimes.end(), 0.0) 
           / pImpl->inferenceTimes.size();
}

} // namespace greenlane
