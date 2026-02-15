/**
 * GreenLane Local LLM Server
 * 
 * C++ HTTP server for on-device sustainability analysis using ExecuTorch.
 * Part of Meta ExecuTorch sponsor track for SFHacks 2026.
 */

#include <iostream>
#include <string>
#include <csignal>
#include <atomic>

#include "httplib.h"
#include "json.hpp"
#include "inference.h"

using json = nlohmann::json;

// Global state
std::atomic<bool> running{true};
greenlane::InferenceEngine* g_engine = nullptr;

void signalHandler(int signum) {
    std::cout << "\n[Server] Shutting down..." << std::endl;
    running = false;
}

void setupCORS(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

int main(int argc, char* argv[]) {
    // Parse arguments
    int port = 8765;
    std::string modelPath = "";
    
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if ((arg == "-p" || arg == "--port") && i + 1 < argc) {
            port = std::stoi(argv[++i]);
        } else if ((arg == "-m" || arg == "--model") && i + 1 < argc) {
            modelPath = argv[++i];
        } else if (arg == "-h" || arg == "--help") {
            std::cout << "GreenLane Local LLM Server\n\n";
            std::cout << "Usage: " << argv[0] << " [options]\n\n";
            std::cout << "Options:\n";
            std::cout << "  -p, --port <port>    Port to listen on (default: 8765)\n";
            std::cout << "  -m, --model <path>   Path to .pte model file\n";
            std::cout << "  -h, --help           Show this help message\n";
            return 0;
        }
    }
    
    // Setup signal handler
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    // Initialize inference engine
    greenlane::InferenceEngine engine;
    g_engine = &engine;
    
    // Load model if provided
    if (!modelPath.empty()) {
        if (!engine.loadModel(modelPath)) {
            std::cerr << "[Server] Warning: Failed to load model, running in mock mode" << std::endl;
        }
    } else {
        // Load mock model for testing
        engine.loadModel("mock");
    }
    
    // Create HTTP server
    httplib::Server svr;
    
    // Health check endpoint
    svr.Get("/health", [&engine](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json response = {
            {"status", "ok"},
            {"model_loaded", engine.isModelLoaded()},
            {"version", "1.0.0"}
        };
        res.set_content(response.dump(), "application/json");
    });
    
    // Status endpoint
    svr.Get("/status", [&engine](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json response = {
            {"model", engine.getModelName()},
            {"model_loaded", engine.isModelLoaded()},
            {"memory_mb", engine.getMemoryUsageMB()},
            {"inference_time_avg_ms", engine.getAvgInferenceTimeMs()}
        };
        res.set_content(response.dump(), "application/json");
    });
    
    // CORS preflight
    svr.Options("/analyze", [](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        res.set_content("", "text/plain");
    });
    
    // Main analysis endpoint
    svr.Post("/analyze", [&engine](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        
        try {
            // Parse request
            json requestBody = json::parse(req.body);
            
            greenlane::ProductData product;
            product.productTitle = requestBody.value("productTitle", "");
            product.brand = requestBody.value("brand", "");
            product.price = requestBody.value("price", "");
            product.materials = requestBody.value("materials", "");
            
            if (product.productTitle.empty()) {
                json error = {{"error", "productTitle is required"}};
                res.status = 400;
                res.set_content(error.dump(), "application/json");
                return;
            }
            
            // Run analysis
            auto result = engine.analyze(product);
            
            if (!result) {
                json error = {{"error", "Analysis failed"}};
                res.status = 500;
                res.set_content(error.dump(), "application/json");
                return;
            }
            
            // Build response
            json response = {
                {"greenScore", result->greenScore},
                {"positives", result->positives},
                {"negatives", result->negatives},
                {"recommendation", result->recommendation},
                {"localAnalysis", true}
            };
            
            res.set_content(response.dump(), "application/json");
            
        } catch (const json::exception& e) {
            json error = {{"error", "Invalid JSON: " + std::string(e.what())}};
            res.status = 400;
            res.set_content(error.dump(), "application/json");
        } catch (const std::exception& e) {
            json error = {{"error", "Server error: " + std::string(e.what())}};
            res.status = 500;
            res.set_content(error.dump(), "application/json");
        }
    });
    
    // Start server
    std::cout << "╔═══════════════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║     GreenLane Local LLM Server (ExecuTorch)               ║" << std::endl;
    std::cout << "╠═══════════════════════════════════════════════════════════╣" << std::endl;
    std::cout << "║  Port:        " << port << "                                        ║" << std::endl;
    std::cout << "║  Model:       " << engine.getModelName();
    for (size_t i = engine.getModelName().length(); i < 41; i++) std::cout << " ";
    std::cout << "║" << std::endl;
    std::cout << "║  Memory:      " << engine.getMemoryUsageMB() << " MB";
    for (size_t i = std::to_string(engine.getMemoryUsageMB()).length(); i < 37; i++) std::cout << " ";
    std::cout << "║" << std::endl;
    std::cout << "╠═══════════════════════════════════════════════════════════╣" << std::endl;
    std::cout << "║  Endpoints:                                               ║" << std::endl;
    std::cout << "║    GET  /health   - Health check                          ║" << std::endl;
    std::cout << "║    GET  /status   - Server status                         ║" << std::endl;
    std::cout << "║    POST /analyze  - Analyze product                       ║" << std::endl;
    std::cout << "╠═══════════════════════════════════════════════════════════╣" << std::endl;
    std::cout << "║  Meta ExecuTorch Sponsor Track - SFHacks 2026             ║" << std::endl;
    std::cout << "╚═══════════════════════════════════════════════════════════╝" << std::endl;
    std::cout << "\nServer listening on http://localhost:" << port << std::endl;
    std::cout << "Press Ctrl+C to stop\n" << std::endl;
    
    svr.listen("0.0.0.0", port);
    
    std::cout << "[Server] Goodbye!" << std::endl;
    return 0;
}
