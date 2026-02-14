/**
 * Actian VectorAI DB Service
 * Semantic search for sustainable product alternatives
 * 
 * Uses: docker pull williamimoh/actian-vectorai-db:1.0b
 * Docs: https://www.actian.com/vectorai
 */

import dotenv from 'dotenv';
dotenv.config();

const VECTORAI_URL = process.env.VECTORAI_URL || 'http://localhost:8080';

interface EcoProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  ecoScore: number;
  certifications: string[];
  description: string;
  price: string;
  url: string;
  imageUrl?: string;
}

interface SearchResult {
  product: EcoProduct;
  similarity: number;
}

interface SustainabilityTip {
  title: string;
  description: string;
  icon: string;
}

interface AlternativesResponse {
  alternatives: SearchResult[];
  tips: SustainabilityTip[];
  hasEcoAlternatives: boolean;
}

// Categories where sustainable alternatives are limited
const LIMITED_ALTERNATIVES_CATEGORIES = ['electronics', 'gaming', 'computers', 'gpu', 'tech'];

/**
 * Get sustainability tips for products without eco alternatives
 */
function getSustainabilityTips(category: string, productName: string): SustainabilityTip[] {
  const title = productName.toLowerCase();
  
  // GPU/Graphics card specific tips
  if (title.includes('gpu') || title.includes('graphics') || title.includes('rtx') || title.includes('nvidia') || title.includes('amd radeon')) {
    return [
      { icon: '⚡', title: 'Optimize Power Settings', description: 'Use power-saving mode when not gaming to reduce energy consumption by up to 40%' },
      { icon: '♻️', title: 'Recycle Old Hardware', description: 'When upgrading, recycle your old GPU through Best Buy or manufacturer take-back programs' },
      { icon: '🔄', title: 'Extend Lifespan', description: 'Regular cleaning and good airflow can extend GPU life by 2-3 years, reducing e-waste' },
      { icon: '💡', title: 'Buy Used/Refurbished', description: 'Consider certified refurbished GPUs to reduce manufacturing impact' }
    ];
  }
  
  // General electronics tips
  if (LIMITED_ALTERNATIVES_CATEGORIES.includes(category)) {
    return [
      { icon: '🔌', title: 'Energy Efficiency', description: 'Look for ENERGY STAR certified products that use 10-50% less energy' },
      { icon: '🔧', title: 'Choose Repairable', description: 'Check iFixit repairability scores - choose devices you can repair and upgrade' },
      { icon: '📦', title: 'Proper Disposal', description: 'Use e-waste recycling programs - many contain hazardous materials' },
      { icon: '⏳', title: 'Maximize Lifespan', description: 'Keep devices longer by maintaining them well and avoiding unnecessary upgrades' }
    ];
  }
  
  // Default tips for any category
  return [
    { icon: '🌱', title: 'Consider Impact', description: 'Research the brand\'s sustainability practices before purchasing' },
    { icon: '📊', title: 'Quality Over Quantity', description: 'Invest in durable products that last longer and reduce waste' }
  ];
}

/**
 * Search for eco-friendly alternatives using vector similarity
 */
export async function findEcoAlternatives(
  productName: string,
  category: string,
  limit: number = 3
): Promise<AlternativesResponse> {
  // Check if this category has limited alternatives
  const hasLimitedAlternatives = LIMITED_ALTERNATIVES_CATEGORIES.includes(category) ||
    productName.toLowerCase().match(/gpu|graphics|rtx|gtx|radeon|nvidia|amd|processor|cpu|ram|ssd/);
  
  const tips = getSustainabilityTips(category, productName);
  
  if (hasLimitedAlternatives) {
    console.log(`ℹ️ Category "${category}" has limited eco alternatives, providing tips instead`);
    return {
      alternatives: [],
      tips,
      hasEcoAlternatives: false
    };
  }

  try {
    console.log(`🔍 VectorAI: Searching for eco alternatives to "${productName}" in ${category}`);
    
    const response = await fetch(`${VECTORAI_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `sustainable eco-friendly ${category} ${productName}`,
        collection: 'eco_products',
        limit,
        filter: { category }
      })
    });

    if (!response.ok) {
      console.warn('⚠️ VectorAI search failed, using fallback');
      const fallbackAlternatives = getFallbackAlternatives(category, limit);
      return {
        alternatives: fallbackAlternatives,
        tips: tips.slice(0, 2), // Include a couple tips as bonus
        hasEcoAlternatives: fallbackAlternatives.length > 0
      };
    }

    const data = await response.json();
    const alternatives = data.results || [];
    return {
      alternatives,
      tips: alternatives.length === 0 ? tips : tips.slice(0, 1),
      hasEcoAlternatives: alternatives.length > 0
    };
  } catch (error) {
    console.warn('⚠️ VectorAI not available, using fallback alternatives');
    const fallbackAlternatives = getFallbackAlternatives(category, limit);
    return {
      alternatives: fallbackAlternatives,
      tips: tips.slice(0, 2),
      hasEcoAlternatives: fallbackAlternatives.length > 0
    };
  }
}

/**
 * Add a product to the vector database
 */
export async function addEcoProduct(product: EcoProduct): Promise<boolean> {
  try {
    const response = await fetch(`${VECTORAI_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: 'eco_products',
        document: product,
        // Text to embed for semantic search
        text: `${product.name} ${product.brand} ${product.category} ${product.description} ${product.certifications.join(' ')}`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Failed to add product to VectorAI:', error);
    return false;
  }
}

/**
 * Check if VectorAI is available
 */
export async function checkVectorAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${VECTORAI_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fallback alternatives when VectorAI is unavailable
 * Curated list of real sustainable products by category
 */
function getFallbackAlternatives(category: string, limit: number): SearchResult[] {
  const fallbackProducts: Record<string, EcoProduct[]> = {
    clothing: [
      {
        id: 'patagonia-recycled-tee',
        name: 'Regenerative Organic Cotton Tee',
        brand: 'Patagonia',
        category: 'clothing',
        ecoScore: 92,
        certifications: ['Fair Trade', 'Organic', 'B-Corp'],
        description: 'Made from 100% regenerative organic cotton',
        price: '$45',
        url: 'https://www.patagonia.com/product/mens-regenerative-organic-certified-cotton-crewneck-t-shirt/51736.html'
      },
      {
        id: 'pact-organic-basics',
        name: 'Organic Cotton Essentials',
        brand: 'PACT',
        category: 'clothing',
        ecoScore: 88,
        certifications: ['GOTS Certified', 'Fair Trade'],
        description: 'Super soft organic cotton basics',
        price: '$25',
        url: 'https://wearpact.com'
      },
      {
        id: 'eileen-fisher-recycled',
        name: 'Recycled Cashmere Sweater',
        brand: 'Eileen Fisher',
        category: 'clothing',
        ecoScore: 85,
        certifications: ['B-Corp', 'Recycled Materials'],
        description: 'Made from recycled cashmere fibers',
        price: '$298',
        url: 'https://www.eileenfisher.com'
      }
    ],
    electronics: [
      {
        id: 'fairphone-5',
        name: 'Fairphone 5',
        brand: 'Fairphone',
        category: 'electronics',
        ecoScore: 90,
        certifications: ['Fair Trade', 'B-Corp', 'Modular Design'],
        description: 'Modular, repairable smartphone with ethical materials',
        price: '$699',
        url: 'https://www.fairphone.com/en/fairphone-5/'
      },
      {
        id: 'framework-laptop',
        name: 'Framework Laptop 16',
        brand: 'Framework',
        category: 'electronics',
        ecoScore: 88,
        certifications: ['Repairable', 'Modular', 'Upgradeable'],
        description: 'Fully upgradeable and repairable laptop',
        price: '$1,399',
        url: 'https://frame.work'
      }
    ],
    home: [
      {
        id: 'grove-cleaning',
        name: 'Plastic-Free Cleaning Kit',
        brand: 'Grove Collaborative',
        category: 'home',
        ecoScore: 91,
        certifications: ['B-Corp', 'Plastic-Free', 'Plant-Based'],
        description: 'Complete home cleaning with zero plastic',
        price: '$35',
        url: 'https://www.grove.co'
      },
      {
        id: 'blueland-starter',
        name: 'Clean Essentials Kit',
        brand: 'Blueland',
        category: 'home',
        ecoScore: 93,
        certifications: ['B-Corp', 'Plastic-Free', 'Refillable'],
        description: 'Refillable cleaning tablets - no single-use plastic',
        price: '$39',
        url: 'https://www.blueland.com'
      }
    ],
    beauty: [
      {
        id: 'ethique-shampoo',
        name: 'Solid Shampoo Bar',
        brand: 'Ethique',
        category: 'beauty',
        ecoScore: 94,
        certifications: ['B-Corp', 'Plastic-Free', 'Vegan', 'Palm Oil Free'],
        description: 'Zero-waste solid shampoo bars',
        price: '$16',
        url: 'https://ethique.com'
      },
      {
        id: 'plaine-products',
        name: 'Refillable Shampoo System',
        brand: 'Plaine Products',
        category: 'beauty',
        ecoScore: 90,
        certifications: ['B-Corp', 'Refillable', 'Aluminum Bottles'],
        description: 'Send back bottles for refills',
        price: '$32',
        url: 'https://www.plaineproducts.com'
      }
    ],
    food: [
      {
        id: 'imperfect-foods',
        name: 'Imperfect Foods Box',
        brand: 'Imperfect Foods',
        category: 'food',
        ecoScore: 87,
        certifications: ['Reduces Food Waste', 'B-Corp'],
        description: 'Rescued groceries delivered to your door',
        price: '$30+',
        url: 'https://www.imperfectfoods.com'
      },
      {
        id: 'package-free-shop',
        name: 'Zero Waste Grocery Essentials',
        brand: 'Package Free Shop',
        category: 'food',
        ecoScore: 92,
        certifications: ['Zero Waste', 'Plastic-Free'],
        description: 'Bulk food and zero-waste groceries',
        price: 'Varies',
        url: 'https://packagefreeshop.com'
      }
    ],
    sports: [
      {
        id: 'allbirds-runners',
        name: 'Tree Dasher 2 Running Shoes',
        brand: 'Allbirds',
        category: 'sports',
        ecoScore: 92,
        certifications: ['B-Corp', 'Carbon Neutral', 'FSC-Certified'],
        description: 'Made from eucalyptus tree fiber and natural materials',
        price: '$135',
        url: 'https://www.allbirds.com/products/mens-tree-dashers'
      },
      {
        id: 'vivobarefoot-shoes',
        name: 'Primus Lite III Running Shoes',
        brand: 'Vivobarefoot',
        category: 'sports',
        ecoScore: 88,
        certifications: ['B-Corp', 'Recycled Materials', 'Repairable'],
        description: 'Minimalist shoes with recycled materials and repair program',
        price: '$160',
        url: 'https://www.vivobarefoot.com/us/primus-lite-iii-mens'
      },
      {
        id: 'cotopaxi-gear',
        name: 'Sustainable Outdoor Gear',
        brand: 'Cotopaxi',
        category: 'sports',
        ecoScore: 90,
        certifications: ['B-Corp', 'Repurposed Materials', 'Fair Trade'],
        description: 'Outdoor gear made from repurposed and remnant fabrics',
        price: 'Varies',
        url: 'https://www.cotopaxi.com'
      }
    ]
  };

  // Default products for unknown categories
  const defaultProducts: EcoProduct[] = [
    {
      id: 'earthhero-general',
      name: 'Sustainable Alternatives',
      brand: 'EarthHero',
      category: 'general',
      ecoScore: 85,
      certifications: ['B-Corp', 'Curated Sustainable'],
      description: 'Curated sustainable products marketplace',
      price: 'Varies',
      url: 'https://earthhero.com'
    },
    {
      id: 'thrive-market',
      name: 'Eco-Friendly Products',
      brand: 'Thrive Market',
      category: 'general',
      ecoScore: 82,
      certifications: ['B-Corp', 'Carbon Neutral'],
      description: 'Healthy and sustainable products at wholesale prices',
      price: 'Varies',
      url: 'https://thrivemarket.com'
    }
  ];

  // Normalize category for matching
  const normalizedCategory = category.toLowerCase();
  const categoryProducts = fallbackProducts[normalizedCategory] || defaultProducts;
  
  return categoryProducts.slice(0, limit).map((product, index) => ({
    product,
    similarity: 0.95 - (index * 0.05) // Decreasing similarity score
  }));
}

/**
 * Detect product category from title and description
 */
export function detectCategory(productTitle: string): string {
  const title = productTitle.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    clothing: ['shirt', 'pants', 'dress', 'jacket', 'sweater', 'jeans', 'hoodie', 'shorts', 'skirt', 'coat', 'blouse', 'top', 'tee', 't-shirt', 'socks', 'underwear', 'apparel', 'wear'],
    electronics: ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'television', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'watch', 'earbuds', 'airpods', 'gpu', 'graphics card'],
    home: ['furniture', 'chair', 'table', 'desk', 'lamp', 'rug', 'pillow', 'blanket', 'towel', 'sheet', 'mattress', 'cleaning', 'storage', 'kitchen', 'cookware', 'dinnerware'],
    beauty: ['shampoo', 'conditioner', 'lotion', 'cream', 'serum', 'makeup', 'lipstick', 'mascara', 'skincare', 'soap', 'body wash', 'deodorant', 'perfume', 'cologne', 'moisturizer'],
    food: ['snack', 'coffee', 'tea', 'chocolate', 'protein', 'vitamin', 'supplement', 'organic', 'grocery', 'food', 'drink', 'beverage'],
    toys: ['toy', 'game', 'puzzle', 'lego', 'doll', 'action figure', 'board game', 'stuffed'],
    sports: ['fitness', 'yoga', 'exercise', 'gym', 'running', 'cycling', 'hiking', 'camping', 'outdoor', 'sports', 'athletic']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

export type { EcoProduct, SearchResult };
