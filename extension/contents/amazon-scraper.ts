import type { PlasmoCSConfig } from "plasmo"

// Configure which URLs this content script runs on
export const config: PlasmoCSConfig = {
  matches: ["https://*.amazon.com/*", "https://*.amazon.co.uk/*"],
  all_frames: false
}

// Product data interface
interface ProductData {
  productTitle: string
  price: string
  brand: string
  imageUrl: string
  url: string
  materials?: string
}

// Scrape product data from Amazon page
function scrapeAmazonProduct(): ProductData | null {
  try {
    // Product title - try multiple selectors
    const titleEl = document.querySelector("#productTitle") as HTMLElement
    const productTitle = titleEl?.innerText?.trim()
    
    if (!productTitle) {
      console.log("GreenLane: No product title found")
      return null
    }

    // Price - Amazon has various price formats
    let price = ""
    const priceWhole = document.querySelector(".a-price-whole")
    const priceFraction = document.querySelector(".a-price-fraction")
    if (priceWhole) {
      price = `$${priceWhole.textContent?.replace(",", "").trim() || ""}${priceFraction?.textContent?.trim() || "00"}`
    } else {
      // Fallback price selectors
      const altPrice = document.querySelector("#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen")
      price = altPrice?.textContent?.trim() || "Price unavailable"
    }

    // Brand
    const brandEl = document.querySelector("#bylineInfo") as HTMLAnchorElement
    let brand = brandEl?.innerText?.trim() || ""
    // Clean up brand text (remove "Visit the X Store" or "Brand: X")
    brand = brand.replace(/^(Visit the |Brand: )/i, "").replace(/ Store$/i, "")

    // Product image
    const imageEl = document.querySelector("#landingImage, #imgBlkFront, #main-image") as HTMLImageElement
    const imageUrl = imageEl?.src || ""

    // Try to get materials from product details
    let materials = ""
    const detailRows = document.querySelectorAll("#productDetails_techSpec_section_1 tr, #detailBullets_feature_div li")
    detailRows.forEach((row) => {
      const text = row.textContent?.toLowerCase() || ""
      if (text.includes("material") || text.includes("fabric")) {
        materials += row.textContent?.trim() + " "
      }
    })

    // Also check bullet points for material info
    const bulletPoints = document.querySelectorAll("#feature-bullets li")
    bulletPoints.forEach((li) => {
      const text = li.textContent?.toLowerCase() || ""
      if (text.includes("material") || text.includes("cotton") || text.includes("polyester") || 
          text.includes("recycled") || text.includes("organic") || text.includes("leather")) {
        materials += li.textContent?.trim() + " "
      }
    })

    const productData: ProductData = {
      productTitle,
      price,
      brand,
      imageUrl,
      url: window.location.href,
      materials: materials.trim() || undefined
    }

    console.log("GreenLane: Scraped product data:", productData)
    return productData

  } catch (error) {
    console.error("GreenLane: Error scraping product:", error)
    return null
  }
}

// Log that content script is loaded
console.log(`GreenLane: Content script loaded on ${window.location.href}`)

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("GreenLane: Received message:", message)
  
  if (message.type === "GET_PRODUCT_DATA") {
    const product = scrapeAmazonProduct()
    sendResponse({ product })
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true
})

// Also try to scrape when page loads (for caching)
if (document.readyState === "complete") {
  scrapeAmazonProduct()
} else {
  window.addEventListener("load", () => {
    scrapeAmazonProduct()
  })
}
