import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client with Novita AI base URL
// Docs: https://novita.ai/docs/guides/llm-api#api-integration
const novita = new OpenAI({
  apiKey: process.env.NOVITA_API_KEY || '',
  baseURL: 'https://api.novita.ai/openai'  // Correct Novita endpoint
});

// DeepSeek V3 is much faster than R1 (no chain-of-thought reasoning overhead)
const MODEL = process.env.NOVITA_MODEL || 'deepseek/deepseek_v3';

// Log API key status (not the actual key!)
console.log(`🔑 Novita API Key configured: ${process.env.NOVITA_API_KEY ? 'Yes (' + process.env.NOVITA_API_KEY.substring(0, 8) + '...)' : 'No'}`);
console.log(`🤖 Using model: ${MODEL}`);

interface ProductData {
  productTitle: string;
  price: string;
  brand: string;
  materials?: string;
}

// Detailed scoring breakdown for transparency
interface MetricScore {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
}

interface AnalysisResult {
  greenScore: number;
  rawScore: number;
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
  metrics?: MetricScore[];
}

/**
 * Sustainability Metrics System (15 metrics, 100 points total)
 * Each metric evaluates a specific aspect of product sustainability
 */
const SUSTAINABILITY_METRICS = `
SCORING METRICS (evaluate each, total = 100 points max):

1. RECYCLED CONTENT (0-10 pts)
   - 10: Made primarily from recycled materials (>75%)
   - 7: Contains significant recycled content (50-75%)
   - 4: Some recycled materials (25-50%)
   - 0: No recycled content or unknown

2. NATURAL/ORGANIC MATERIALS (0-8 pts)
   - 8: Certified organic/natural materials (organic cotton, bamboo, hemp)
   - 5: Some natural materials, not certified
   - 2: Mix of natural and synthetic
   - 0: Primarily synthetic/plastic-based

3. PRODUCT DURABILITY (0-12 pts) - KEY METRIC
   - 12: Built to last 10+ years, excellent construction
   - 8: Above average lifespan (5-10 years)
   - 4: Average durability for category
   - 0: Poor quality, likely to break/wear quickly

4. REPAIRABILITY (0-6 pts)
   - 6: Easily repairable, parts available
   - 4: Can be repaired with some effort
   - 2: Difficult to repair
   - 0: Designed to be replaced, not repaired

5. END-OF-LIFE DISPOSAL (0-8 pts)
   - 8: Fully recyclable or compostable
   - 5: Partially recyclable (some components)
   - 2: Difficult to recycle but possible
   - 0: Ends up in landfill, non-recyclable

6. ENERGY EFFICIENCY (0-8 pts)
   - 8: Very energy efficient or requires no energy
   - 5: Above average efficiency
   - 2: Standard energy usage
   - 0: High energy consumer

7. CERTIFICATIONS (0-10 pts)
   - 10: Multiple certifications (B-Corp, Fair Trade, GOTS, FSC, Energy Star)
   - 7: One major certification
   - 3: Minor eco-label or brand claim
   - 0: No certifications

8. PACKAGING (-5 to +5 pts)
   - +5: Minimal, plastic-free, recyclable packaging
   - +2: Reasonable packaging, some recyclable
   - 0: Standard packaging
   - -3: Excessive packaging
   - -5: Excessive single-use plastic packaging

9. MANUFACTURING IMPACT (0-8 pts)
   - 8: Clean production, renewable energy, low emissions
   - 5: Some sustainable practices
   - 2: Standard manufacturing
   - 0: Known polluting processes

10. WATER FOOTPRINT (0-5 pts)
    - 5: Low water usage in production
    - 3: Moderate water usage
    - 0: High water consumption (textiles, agriculture)

11. ETHICAL SOURCING (0-8 pts)
    - 8: Verified ethical supply chain, fair wages
    - 5: Some ethical commitments
    - 2: Unknown supply chain
    - 0: Known labor issues

12. BIODEGRADABILITY (0-7 pts)
    - 7: Fully biodegradable materials
    - 4: Partially biodegradable
    - 0: Non-biodegradable (plastics, synthetics)

13. TOXICITY (-10 to 0 pts) - PENALTY METRIC
    - 0: Non-toxic, safe materials
    - -3: Minor concerns (some chemicals)
    - -7: Contains concerning chemicals
    - -10: Known toxic materials (lead, BPA, formaldehyde)

14. BRAND SUSTAINABILITY RECORD (0-8 pts)
    - 8: Industry leader in sustainability
    - 5: Active sustainability initiatives
    - 2: Some efforts, room for improvement
    - 0: No known sustainability efforts or greenwashing

15. CARBON FOOTPRINT (-5 to +5 pts)
    - +5: Carbon neutral or negative
    - +2: Low carbon footprint
    - 0: Average carbon footprint
    - -3: Above average emissions
    - -5: High carbon footprint (air shipping, etc.)
`;

/**
 * Analyze product sustainability using Novita AI (DeepSeek V3)
 */
export async function analyzeProductWithAI(product: ProductData): Promise<AnalysisResult> {
  const prompt = `You are a sustainability analyst. Evaluate this product using the detailed metrics below.

Product Information:
- Title: ${product.productTitle}
- Brand: ${product.brand || 'Unknown'}
- Price: ${product.price}
- Materials: ${product.materials || 'Not specified'}

${SUSTAINABILITY_METRICS}

INSTRUCTIONS:
1. Score each of the 15 metrics based on available information
2. Sum all scores for the total greenScore (can range from -20 to 100)
3. Normalize to 0-100 range
4. Be realistic - most products score 30-60

Respond with this exact JSON structure:
{
  "metrics": [
    {"name": "Recycled Content", "score": <0-10>, "reason": "<brief explanation>"},
    {"name": "Natural Materials", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Durability", "score": <0-12>, "reason": "<brief explanation>"},
    {"name": "Repairability", "score": <0-6>, "reason": "<brief explanation>"},
    {"name": "End-of-Life", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Energy Efficiency", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Certifications", "score": <0-10>, "reason": "<brief explanation>"},
    {"name": "Packaging", "score": <-5 to 5>, "reason": "<brief explanation>"},
    {"name": "Manufacturing", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Water Footprint", "score": <0-5>, "reason": "<brief explanation>"},
    {"name": "Ethical Sourcing", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Biodegradability", "score": <0-7>, "reason": "<brief explanation>"},
    {"name": "Toxicity", "score": <-10 to 0>, "reason": "<brief explanation>"},
    {"name": "Brand Record", "score": <0-8>, "reason": "<brief explanation>"},
    {"name": "Carbon Footprint", "score": <-5 to 5>, "reason": "<brief explanation>"}
  ],
  "rawScore": <sum of all metric scores>,
  "greenScore": <normalized 0-100>,
  "positives": ["<top 3 sustainability strengths>"],
  "negatives": ["<top 3 sustainability concerns>"],
  "recommendation": "<one actionable sentence>"
}

Return ONLY valid JSON, no markdown.`;

  try {
    console.log(`🤖 Calling Novita AI (${MODEL}) with 15-metric analysis...`);
    
    const response = await novita.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert. Always respond with valid JSON only, no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200  // More tokens for detailed metrics
    });

    const content = response.choices[0]?.message?.content || '';
    console.log(`📝 AI Response received (${content.length} chars)`);

    // Parse the JSON response
    let jsonStr = content.trim();
    
    // Remove DeepSeek thinking tags
    if (jsonStr.includes('</think>')) {
      jsonStr = jsonStr.split('</think>').pop() || jsonStr;
    }
    
    // Handle markdown code blocks
    jsonStr = jsonStr.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to find JSON in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    console.log(`🔍 Parsing JSON: ${jsonStr.substring(0, 100)}...`);

    const analysis = JSON.parse(jsonStr);

    // Calculate score from metrics if available
    let calculatedScore = analysis.rawScore || 50;
    if (analysis.metrics && Array.isArray(analysis.metrics)) {
      calculatedScore = analysis.metrics.reduce((sum: number, m: MetricScore) => sum + (m.score || 0), 0);
    }

    // Normalize score to 0-100 (raw can be -20 to 100, so shift and scale)
    const normalizedScore = Math.round(Math.max(0, Math.min(100, (calculatedScore + 20) * (100 / 120))));

    return {
      greenScore: normalizedScore,
      rawScore: calculatedScore,
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 4) : 
               analysis.metrics?.slice(0, 4).map((m: MetricScore) => `${m.name}: ${m.reason}`) || ['Analysis completed'],
      positives: Array.isArray(analysis.positives) ? analysis.positives.slice(0, 3) : ['Product analyzed'],
      negatives: Array.isArray(analysis.negatives) ? analysis.negatives.slice(0, 3) : ['Limited data available'],
      recommendation: analysis.recommendation || 'Consider the sustainability factors when making your decision.',
      metrics: analysis.metrics
    };

  } catch (error) {
    console.error('❌ Novita AI Error:', error);
    throw error;
  }
}

/**
 * Test the Novita AI connection
 */
export async function testNovitaConnection(): Promise<boolean> {
  try {
    const response = await novita.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Say "ok" if you can hear me.' }],
      max_tokens: 10
    });
    console.log('✅ Novita AI connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Novita AI connection test failed:', error);
    return false;
  }
}

interface AlternativeProduct {
  name: string;
  searchQuery: string;
  reason: string;
  ecoScore: number;
  category: string;
}

interface AlternativesResult {
  originalProduct: string;
  originalIssues: string[];
  alternatives: AlternativeProduct[];
  noAlternatives?: boolean;
  noAlternativesReason?: string;
}

/**
 * Use AI to DYNAMICALLY find genuinely sustainable alternatives
 * AI determines if alternatives exist - no hardcoded product lists
 * e.g., plastic bags → canvas bags, but GPUs → no alternatives
 */
export async function findSustainableAlternatives(
  productName: string, 
  brand?: string,
  category?: string
): Promise<AlternativesResult> {
  const prompt = `You are a sustainability expert. Analyze this product and determine if GENUINELY sustainable alternatives exist.

Original Product: ${productName}
Brand: ${brand || 'Unknown'}
Category: ${category || 'General'}

YOUR TASK:
1. First, determine if this product category CAN have sustainable alternatives
2. If YES: suggest 5-6 DIFFERENT product types (not just eco-labeled versions of the same thing)
3. If NO: explain why and return empty alternatives array

PRODUCTS THAT TYPICALLY HAVE ALTERNATIVES (suggest different products):
- Single-use plastics → Reusable alternatives (bags, cups, bottles, straws)
- Fast fashion → Sustainable clothing brands, second-hand, organic materials
- Disposable items → Durable reusable versions
- Chemical cleaners → Natural/biodegradable cleaners
- Conventional textiles → Organic, recycled, or sustainable fabrics

PRODUCTS THAT DO NOT HAVE ALTERNATIVES (return hasAlternatives: false):
- Computer hardware (GPUs, CPUs, RAM, motherboards, SSDs) - no eco alternative exists
- Automotive parts and fluids (motor oil, brake pads, spark plugs) - safety critical
- Medical devices and medications - health critical, no substitutes
- Specialized industrial equipment - specific technical requirements
- Firearms, ammunition, weapons - regulated products
- Collectibles, antiques, rare items - unique items
- Pet food, baby formula - specific nutritional needs
- Prescription glasses, contacts - medical necessity
- Safety equipment (fire extinguishers, smoke detectors)
- Musical instruments, sports equipment - specific performance needs

CRITICAL: Do NOT suggest "eco-friendly version" of tech products or adding sustainability labels.
For example:
- WRONG: "Eco-friendly GPU" or "Sustainable motherboard" ❌
- WRONG: "Green motor oil" or "Eco brake pads" ❌
- RIGHT: For plastic bags → Canvas bags, Mesh bags, Paper bags ✓

Respond with this exact JSON:
{
  "originalProduct": "${productName}",
  "originalIssues": ["<2-3 specific issues OR why no alternatives exist>"],
  "hasAlternatives": <true or false>,
  "noAlternativesReason": "<if hasAlternatives is false: explain why this product type has no sustainable alternative and give eco-tips instead>",
  "alternatives": [
    {
      "name": "<Specific product name>",
      "searchQuery": "<Amazon search query>",
      "reason": "<Why more sustainable - one sentence>",
      "ecoScore": <65-95>,
      "category": "<category>"
    }
  ]
}

Return ONLY valid JSON. No markdown.`;

  try {
    console.log(`🔍 AI analyzing alternatives for: ${productName}`);
    
    const response = await novita.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert. Your job is to determine if a product has genuinely different sustainable alternatives. For tech hardware, automotive parts, medical items, and other specialized products - acknowledge that no sustainable alternatives exist. For everyday consumer goods with disposable/wasteful versions - suggest reusable or sustainable alternatives. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,  // Slightly lower for more consistent decisions
      max_tokens: 1200
    });

    const content = response.choices[0]?.message?.content || '';
    console.log(`📝 Alternatives response received (${content.length} chars)`);

    // Parse JSON response
    let jsonStr = content.trim();
    
    if (jsonStr.includes('</think>')) {
      jsonStr = jsonStr.split('</think>').pop() || jsonStr;
    }
    
    jsonStr = jsonStr.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const result = JSON.parse(jsonStr);

    // Check if AI says no alternatives
    if (result.hasAlternatives === false || (result.alternatives && result.alternatives.length === 0)) {
      return {
        originalProduct: productName,
        originalIssues: result.originalIssues || ['Limited sustainability options for this product type'],
        alternatives: [],
        noAlternatives: true,
        noAlternativesReason: result.noAlternativesReason || 'This product category has limited sustainable alternatives.'
      };
    }

    // Generate Amazon search URLs for each alternative
    const alternatives = (result.alternatives || []).slice(0, 6).map((alt: AlternativeProduct, index: number) => ({
      id: `alt-${index}`,
      name: alt.name,
      searchQuery: alt.searchQuery,
      url: `https://www.amazon.com/s?k=${encodeURIComponent(alt.searchQuery)}`,
      reason: alt.reason,
      ecoScore: Math.min(95, Math.max(60, alt.ecoScore || 75)),
      category: alt.category || 'General'
    }));

    return {
      originalProduct: productName,
      originalIssues: result.originalIssues || ['Sustainability concerns identified'],
      alternatives,
      noAlternatives: alternatives.length === 0
    };

  } catch (error) {
    console.error('❌ Error finding alternatives:', error);
    // Fallback - try to give generic suggestions
    return {
      originalProduct: productName,
      originalIssues: ['Unable to analyze specific issues'],
      alternatives: [],
      noAlternatives: true,
      noAlternativesReason: 'Unable to find alternatives at this time. Please try again.'
    };
  }
}
