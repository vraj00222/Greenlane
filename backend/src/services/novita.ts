import OpenAI from 'openai';

// Initialize OpenAI client with Novita AI base URL
// Novita uses a different endpoint format
const novita = new OpenAI({
  apiKey: process.env.NOVITA_API_KEY || '',
  baseURL: 'https://api.novita.ai/v3/openai'
});

const MODEL = process.env.NOVITA_MODEL || 'deepseek/deepseek-r1-0528';

// Log API key status (not the actual key!)
console.log(`🔑 Novita API Key configured: ${process.env.NOVITA_API_KEY ? 'Yes (' + process.env.NOVITA_API_KEY.substring(0, 8) + '...)' : 'No'}`);
console.log(`🤖 Using model: ${MODEL}`);

interface ProductData {
  productTitle: string;
  price: string;
  brand: string;
  materials?: string;
}

interface AnalysisResult {
  greenScore: number;
  rawScore: number;
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
}

/**
 * Analyze product sustainability using Novita AI (DeepSeek R1)
 */
export async function analyzeProductWithAI(product: ProductData): Promise<AnalysisResult> {
  const prompt = `You are a sustainability analyst. Analyze this product and provide a sustainability score.

Product Information:
- Title: ${product.productTitle}
- Brand: ${product.brand || 'Unknown'}
- Price: ${product.price}
- Materials: ${product.materials || 'Not specified'}

Provide your analysis as JSON with this exact structure:
{
  "rawScore": <number 0-100>,
  "reasons": [<3-4 short bullet points explaining the score>],
  "positives": [<2-3 positive sustainability aspects>],
  "negatives": [<2-3 negative sustainability aspects>],
  "recommendation": "<one sentence advice>"
}

Scoring Guidelines:
- Base score: 50 (average product)
- Recycled/organic materials: +15-20
- Fast fashion/synthetic materials: -10-15
- Brand with known sustainability initiatives: +10
- Certifications (B-Corp, Fair Trade, GOTS): +15-20
- Excessive packaging concerns: -5-10
- Durability/longevity indicators: +5-10

Be realistic and balanced. Most products score 35-65.
Return ONLY valid JSON, no markdown formatting or explanation.`;

  try {
    console.log(`🤖 Calling Novita AI (${MODEL})...`);
    
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
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || '';
    console.log(`📝 AI Response received (${content.length} chars)`);

    // Parse the JSON response
    // Handle potential markdown code blocks
    let jsonStr = content.trim();
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

    const analysis = JSON.parse(jsonStr);

    // Validate and normalize the response
    return {
      greenScore: Math.max(0, Math.min(100, analysis.rawScore || 50)),
      rawScore: analysis.rawScore || 50,
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 4) : ['Analysis completed'],
      positives: Array.isArray(analysis.positives) ? analysis.positives.slice(0, 3) : ['Product analyzed'],
      negatives: Array.isArray(analysis.negatives) ? analysis.negatives.slice(0, 3) : ['Limited data available'],
      recommendation: analysis.recommendation || 'Consider the sustainability factors when making your decision.'
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
