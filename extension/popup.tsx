import { useEffect, useState } from "react"

// Types
interface ProductData {
  productTitle: string
  price: string
  brand: string
  imageUrl: string
  url: string
}

interface Alternative {
  id: string
  title: string
  brand: string
  price: number
  greenScore: number
  url: string
}

interface AnalysisResult {
  greenScore: number
  reasons: string[]
  positives: string[]
  negatives: string[]
  recommendation: string
  alternatives: Alternative[]
}

// Get score color based on value
function getScoreColor(score: number): string {
  if (score < 40) return "#ef4444" // red
  if (score < 70) return "#eab308" // yellow
  return "#22c55e" // green
}

// Get score label
function getScoreLabel(score: number): string {
  if (score < 40) return "Poor"
  if (score < 70) return "Fair"
  return "Good"
}

function IndexPopup() {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Request product data from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (!activeTab?.id) {
        setLoading(false)
        setError("No active tab found")
        return
      }

      // Check if we're on Amazon
      if (!activeTab.url?.includes("amazon.com")) {
        setLoading(false)
        setError(null)
        setProduct(null)
        return
      }

      // Send message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: "GET_PRODUCT_DATA" },
        async (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError)
            setLoading(false)
            setError("Could not read page. Try refreshing.")
            return
          }

          if (response?.product) {
            setProduct(response.product)
            // Call backend for analysis
            try {
              const apiUrl = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3001"
              const res = await fetch(`${apiUrl}/api/analyze-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response.product)
              })
              
              if (!res.ok) throw new Error("API error")
              
              const data = await res.json()
              setAnalysis(data.analysis)
            } catch (err) {
              console.error("API Error:", err)
              setError("Failed to analyze. Is backend running?")
            }
          } else {
            setError(null)
            setProduct(null)
          }
          setLoading(false)
        }
      )
    })
  }, [])

  // Styles
  const containerStyle: React.CSSProperties = {
    width: 380,
    minHeight: 200,
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)",
    padding: 0
  }

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
    color: "white",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 10
  }

  const contentStyle: React.CSSProperties = {
    padding: 20
  }

  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
        </div>
        <div style={{ ...contentStyle, textAlign: "center", paddingTop: 40 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: "4px solid #e5e7eb",
            borderTopColor: "#059669",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#6b7280" }}>Analyzing product...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // No product detected
  if (!product) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
        </div>
        <div style={{ ...contentStyle, textAlign: "center", paddingTop: 30 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🛒</span>
          <h3 style={{ margin: "0 0 8px", color: "#374151" }}>No Product Detected</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Visit an Amazon product page to analyze its sustainability.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
        </div>
        <div style={{ ...contentStyle, textAlign: "center", paddingTop: 30 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>⚠️</span>
          <h3 style={{ margin: "0 0 8px", color: "#374151" }}>Analysis Error</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#059669",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Main analysis view
  const scoreColor = analysis ? getScoreColor(analysis.greenScore) : "#6b7280"
  const scoreLabel = analysis ? getScoreLabel(analysis.greenScore) : ""

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 24 }}>🌿</span>
        <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
      </div>
      
      <div style={contentStyle}>
        {/* Product Info */}
        <div style={{ 
          display: "flex", 
          gap: 12, 
          marginBottom: 16,
          padding: 12,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          {product.imageUrl && (
            <img 
              src={product.imageUrl} 
              alt="" 
              style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 4 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 14, 
              fontWeight: 600,
              color: "#1f2937",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical"
            }}>
              {product.productTitle}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              {product.brand} • {product.price}
            </p>
          </div>
        </div>

        {/* Green Score */}
        {analysis && (
          <>
            <div style={{
              textAlign: "center",
              padding: 20,
              background: "white",
              borderRadius: 8,
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `6px solid ${scoreColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                background: `${scoreColor}15`
              }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>
                  {analysis.greenScore}
                </span>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: scoreColor }}>
                {scoreLabel} Sustainability
              </p>
            </div>

            {/* Reasons */}
            <div style={{
              background: "white",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#374151" }}>
                Analysis
              </h4>
              <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 13, color: "#4b5563" }}>
                {analysis.reasons.map((reason, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{reason}</li>
                ))}
              </ul>
            </div>

            {/* Alternative */}
            {analysis.alternatives && analysis.alternatives.length > 0 && (
              <div style={{
                background: "#ecfdf5",
                borderRadius: 8,
                padding: 16,
                border: "1px solid #a7f3d0"
              }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#065f46" }}>
                  🌱 Greener Alternative
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1f2937" }}>
                      {analysis.alternatives[0].title}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                      ${analysis.alternatives[0].price} • Score: {analysis.alternatives[0].greenScore}
                    </p>
                  </div>
                  <span style={{
                    background: "#22c55e",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    +{analysis.alternatives[0].greenScore - analysis.greenScore}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
