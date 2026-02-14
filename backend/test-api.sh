#!/bin/bash

# GreenLane Backend API Tests
# Run from backend directory: ./test-api.sh

API_URL="http://localhost:3001"

echo "🌿 GreenLane API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if server is running
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "$API_URL/health")
if [ -z "$HEALTH" ]; then
    echo "   ❌ Server not running! Start with: pnpm dev"
    exit 1
fi
echo "   $HEALTH" | python3 -m json.tool 2>/dev/null || echo "   $HEALTH"
echo ""

# Test analyze product (eco-friendly)
echo "2️⃣  Analyze Eco-Friendly Product..."
curl -s -X POST "$API_URL/api/analyze-product" \
  -H "Content-Type: application/json" \
  -d '{
    "productTitle": "Organic Cotton T-Shirt - 100% Recycled Materials",
    "price": "$29.99",
    "brand": "EcoWear",
    "materials": "100% organic cotton, recycled packaging"
  }' | python3 -m json.tool 2>/dev/null || echo "   Response received"
echo ""

# Test analyze product (less eco-friendly)
echo "3️⃣  Analyze Regular Product..."
curl -s -X POST "$API_URL/api/analyze-product" \
  -H "Content-Type: application/json" \
  -d '{
    "productTitle": "Synthetic Leather Jacket - PVC Material",
    "price": "$89.99",
    "brand": "FastFashion",
    "materials": "PVC, synthetic leather, polyester lining"
  }' | python3 -m json.tool 2>/dev/null || echo "   Response received"
echo ""

# Test log choice
echo "4️⃣  Log User Choice..."
curl -s -X POST "$API_URL/api/log-choice" \
  -H "Content-Type: application/json" \
  -d '{
    "productUrl": "https://amazon.com/dp/test123",
    "action": "alternative",
    "greenScore": 45
  }' | python3 -m json.tool 2>/dev/null || echo "   Response received"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests complete!"
echo ""
echo "Expected results:"
echo "  • Health check: status 'ok' with AI model info"
echo "  • Eco product: greenScore 60-85 (high)"
echo "  • Regular product: greenScore 25-45 (low)"
echo "  • Log choice: success true"
