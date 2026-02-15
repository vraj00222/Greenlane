#pragma once

#include <string>
#include <vector>
#include <memory>

namespace greenlane {

class Tokenizer {
public:
    Tokenizer();
    ~Tokenizer();
    
    // Load tokenizer model (sentencepiece .model file)
    bool load(const std::string& modelPath);
    
    // Encode text to token IDs
    std::vector<int> encode(const std::string& text);
    
    // Decode token IDs to text
    std::string decode(const std::vector<int>& tokens);
    
    // Get vocabulary size
    size_t vocabSize() const;

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
};

} // namespace greenlane
