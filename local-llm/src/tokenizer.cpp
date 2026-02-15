#include "tokenizer.h"
#include <iostream>
#include <sstream>
#include <unordered_map>
#include <algorithm>

namespace greenlane {

class Tokenizer::Impl {
public:
    bool loaded = false;
    std::unordered_map<std::string, int> vocab;
    std::unordered_map<int, std::string> reverseVocab;
    
    // Simple whitespace tokenizer for mock mode
    std::vector<std::string> simpleTokenize(const std::string& text) {
        std::vector<std::string> tokens;
        std::istringstream iss(text);
        std::string word;
        while (iss >> word) {
            tokens.push_back(word);
        }
        return tokens;
    }
};

Tokenizer::Tokenizer() : pImpl(std::make_unique<Impl>()) {
    // Initialize with a mock vocabulary
    pImpl->loaded = true;
    std::cout << "[Tokenizer] Initialized in mock mode" << std::endl;
}

Tokenizer::~Tokenizer() = default;

bool Tokenizer::load(const std::string& modelPath) {
    std::cout << "[Tokenizer] Loading model from: " << modelPath << std::endl;
    // TODO: Load actual sentencepiece model when ExecuTorch is enabled
    pImpl->loaded = true;
    return true;
}

std::vector<int> Tokenizer::encode(const std::string& text) {
    std::vector<int> tokens;
    auto words = pImpl->simpleTokenize(text);
    
    for (size_t i = 0; i < words.size(); i++) {
        // Simple hash-based token ID for mock mode
        tokens.push_back(static_cast<int>(std::hash<std::string>{}(words[i]) % 32000));
    }
    
    return tokens;
}

std::string Tokenizer::decode(const std::vector<int>& tokens) {
    std::ostringstream oss;
    for (size_t i = 0; i < tokens.size(); i++) {
        if (i > 0) oss << " ";
        auto it = pImpl->reverseVocab.find(tokens[i]);
        if (it != pImpl->reverseVocab.end()) {
            oss << it->second;
        } else {
            oss << "[" << tokens[i] << "]";
        }
    }
    return oss.str();
}

size_t Tokenizer::vocabSize() const {
    return pImpl->vocab.empty() ? 32000 : pImpl->vocab.size();
}

} // namespace greenlane
