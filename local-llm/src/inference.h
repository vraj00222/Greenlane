#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>

namespace greenlane {

struct SustainabilityAnalysis {
    int greenScore;
    std::vector<std::string> positives;
    std::vector<std::string> negatives;
    std::string recommendation;
};

struct ProductData {
    std::string productTitle;
    std::string brand;
    std::string price;
    std::string materials;
};

class InferenceEngine {
public:
    InferenceEngine();
    ~InferenceEngine();
    
    // Initialize the model
    bool loadModel(const std::string& modelPath);
    
    // Check if model is loaded
    bool isModelLoaded() const;
    
    // Run inference on product data
    std::optional<SustainabilityAnalysis> analyze(const ProductData& product);
    
    // Get model info
    std::string getModelName() const;
    size_t getMemoryUsageMB() const;
    double getAvgInferenceTimeMs() const;

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
};

} // namespace greenlane
