import { useEffect, useState } from "react"

// Types
interface ProductData {
  productTitle: string
  price: string
  brand: string
  imageUrl: string
  url: string
  materials?: string
}

interface Alternative {
  id: string
  name: string
  brand: string
  price: string
  ecoScore: number
  url: string
  certifications: string[]
  description: string
  similarity?: number
}

interface AnalysisResult {
  greenScore: number
  reasons: string[]
  positives: string[]
  negatives: string[]
  recommendation: string
  alternatives: Alternative[]
}

interface UserData {
  userId: string | null
  email: string | null
  displayName: string | null
}

// Views
type View = "main" | "settings" | "login"

// Get score color based on value
function getScoreColor(score: number): string {
  if (score < 40) return "#ef4444"
  if (score < 70) return "#eab308"
  return "#22c55e"
}

function getScoreLabel(score: number): string {
  if (score < 40) return "Poor"
  if (score < 70) return "Fair"
  return "Good"
}

// Shared styles
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
  justifyContent: "space-between"
}

const contentStyle: React.CSSProperties = {
  padding: 20
}

const buttonStyle: React.CSSProperties = {
  background: "#059669",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  width: "100%"
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  marginBottom: 12,
  boxSizing: "border-box"
}

// Settings icon button
function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.2)",
        border: "none",
        borderRadius: 6,
        padding: "6px 8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}

// Login View
function LoginView({ onLogin, onBack }: { onLogin: (email: string, name: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim()) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    setError("")
    try {
      await onLogin(email.trim(), name.trim())
    } catch (e) {
      setError("Login failed. Is the backend running?")
    }
    setLoading(false)
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}>×</button>
      </div>
      <div style={contentStyle}>
        <h3 style={{ margin: "0 0 8px", color: "#1f2937" }}>Welcome to GreenLane!</h3>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>
          Sign in to track your eco-friendly choices and earn achievements.
        </p>
        
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#374151", fontWeight: 500 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={inputStyle}
        />
        
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#374151", fontWeight: 500 }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={inputStyle}
        />
        
        {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        
        <button onClick={handleSubmit} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
          Your data syncs with the GreenLane dashboard
        </p>
      </div>
    </div>
  )
}

// Settings View
function SettingsView({ user, onLogout, onBack }: { user: UserData; onLogout: () => void; onBack: () => void }) {
  const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || "http://localhost:3002"
  
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚙️</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Settings</span>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}>×</button>
      </div>
      <div style={contentStyle}>
        {user.userId ? (
          <>
            <div style={{ background: "white", borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 18
                }}>
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#1f2937" }}>{user.displayName}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{user.email}</p>
                </div>
              </div>
            </div>
            
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "white",
                borderRadius: 8,
                padding: "14px 16px",
                marginBottom: 12,
                textDecoration: "none",
                color: "#1f2937",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span>📊</span>
                  <span style={{ fontWeight: 500 }}>Open Dashboard</span>
                </div>
                <span style={{ color: "#9ca3af" }}>→</span>
              </div>
            </a>
            
            <button
              onClick={onLogout}
              style={{
                ...buttonStyle,
                background: "#ef4444",
                marginTop: 20
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>Not signed in</p>
            <button onClick={onBack} style={buttonStyle}>Sign In</button>
          </div>
        )}
        
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }}>
            GreenLane v1.0.0 • Made with 💚 for SFHacks 2026
          </p>
        </div>
      </div>
    </div>
  )
}

// Main Analysis View
function AnalysisView({
  product,
  analysis,
  loading,
  error,
  user,
  onSettings,
  onRetry,
  onLogin
}: {
  product: ProductData | null
  analysis: AnalysisResult | null
  loading: boolean
  error: string | null
  user: UserData
  onSettings: () => void
  onRetry: () => void
  onLogin: () => void
}) {
  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌿</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
          </div>
          <SettingsButton onClick={onSettings} />
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌿</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
          </div>
          <SettingsButton onClick={onSettings} />
        </div>
        <div style={{ ...contentStyle, textAlign: "center", paddingTop: 30 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🛒</span>
          <h3 style={{ margin: "0 0 8px", color: "#374151" }}>No Product Detected</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Visit an Amazon product page to analyze its sustainability.
          </p>
          {!user.userId && (
            <button onClick={onLogin} style={{ ...buttonStyle, marginTop: 24 }}>
              Sign In to Track Progress
            </button>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌿</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
          </div>
          <SettingsButton onClick={onSettings} />
        </div>
        <div style={{ ...contentStyle, textAlign: "center", paddingTop: 30 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>⚠️</span>
          <h3 style={{ margin: "0 0 8px", color: "#374151" }}>Analysis Error</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
          <button onClick={onRetry} style={buttonStyle}>Retry</button>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>GreenLane</span>
        </div>
        <SettingsButton onClick={onSettings} />
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
              {!user.userId && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                  <button 
                    onClick={onLogin}
                    style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Sign in
                  </button>
                  {" "}to save this scan
                </p>
              )}
            </div>

            {/* Positives & Negatives */}
            <div style={{
              background: "white",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {analysis.positives && analysis.positives.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                    ✅ Positives
                  </h4>
                  <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 13, color: "#4b5563" }}>
                    {analysis.positives.slice(0, 3).map((item, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.negatives && analysis.negatives.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                    ⚠️ Concerns
                  </h4>
                  <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 13, color: "#4b5563" }}>
                    {analysis.negatives.slice(0, 3).map((item, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {analysis.recommendation && (
              <div style={{
                background: "#fef3c7",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                border: "1px solid #fcd34d"
              }}>
                <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
                  💡 {analysis.recommendation}
                </p>
              </div>
            )}

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
                {analysis.alternatives.slice(0, 2).map((alt, i) => (
                  <div key={alt.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: i === 0 ? 12 : 0,
                    paddingBottom: i === 0 ? 12 : 0,
                    borderBottom: i === 0 ? "1px solid #d1fae5" : "none"
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1f2937" }}>
                        {alt.name}
                      </p>
                      <p style={{ margin: "2px 0", fontSize: 11, color: "#059669", fontWeight: 500 }}>
                        {alt.brand} • {alt.price}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#6b7280" }}>
                        {alt.certifications.slice(0, 2).join(" • ")}
                      </p>
                    </div>
                    <a
                      href={alt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#22c55e",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: "none",
                        marginLeft: 8
                      }}
                    >
                      {alt.ecoScore}% eco
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Main Popup Component
function IndexPopup() {
  const [view, setView] = useState<View>("main")
  const [product, setProduct] = useState<ProductData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData>({ userId: null, email: null, displayName: null })
  const [isAnalyzing, setIsAnalyzing] = useState(false) // Prevent duplicate clicks

  // Load user data on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_USER_DATA" }, (response) => {
      if (response) setUser(response)
    })
  }, [])

  // Analyze product
  const analyzeProduct = async () => {
    // Prevent duplicate clicks while analyzing
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setLoading(true)
    setError(null)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (!activeTab?.id) {
        setLoading(false)
        setIsAnalyzing(false)
        setError("No active tab found")
        return
      }

      if (!activeTab.url?.includes("amazon.com")) {
        setLoading(false)
        setIsAnalyzing(false)
        setError(null)
        setProduct(null)
        return
      }

      chrome.tabs.sendMessage(activeTab.id, { type: "GET_PRODUCT_DATA" }, async (response) => {
        if (chrome.runtime.lastError) {
          setLoading(false)
          setIsAnalyzing(false)
          setError("Could not read page. Try refreshing.")
          return
        }

        if (response?.product) {
          setProduct(response.product)
          
          // Use product URL as cache key
          const productUrl = activeTab.url || ""
          
          // Check cache first for faster response
          chrome.runtime.sendMessage(
            { type: "GET_CACHED_ANALYSIS", productUrl },
            async (cacheResponse) => {
              try {
                let analysisData
                
                if (cacheResponse?.cached) {
                  // Use cached analysis - instant!
                  console.log("Using cached analysis")
                  analysisData = cacheResponse.analysis
                } else {
                  // Fetch from API
                  const apiUrl = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3001"
                  const res = await fetch(`${apiUrl}/api/analyze-product`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(response.product)
                  })
                  
                  if (!res.ok) throw new Error("API error")
                  
                  const data = await res.json()
                  analysisData = data.analysis
                  
                  // Cache for future requests
                  chrome.runtime.sendMessage({
                    type: "SET_CACHED_ANALYSIS",
                    productUrl,
                    analysis: analysisData
                  })
                }
                
                setAnalysis(analysisData)

                // Record scan if user is logged in
                if (user.userId) {
                  chrome.runtime.sendMessage({
                    type: "RECORD_SCAN",
                    productData: response.product,
                    analysis: analysisData
                  })
                }
              } catch (err) {
                console.error("API Error:", err)
                setError("Failed to analyze. Is backend running?")
              } finally {
                setLoading(false)
                setIsAnalyzing(false)
              }
            }
          )
          return // Loading state handled in cache callback
        } else {
          setError(null)
          setProduct(null)
        }
        setLoading(false)
        setIsAnalyzing(false)
      })
    })
  }

  // Initial load
  useEffect(() => {
    analyzeProduct()
  }, [])

  // Handle login
  const handleLogin = async (email: string, displayName: string) => {
    return new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "REGISTER_USER", email, displayName }, (response) => {
        if (response?.success) {
          setUser({ userId: response.userId, email, displayName })
          setView("main")
          resolve()
        } else {
          reject(new Error(response?.error || "Login failed"))
        }
      })
    })
  }

  // Handle logout
  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
      setUser({ userId: null, email: null, displayName: null })
      setView("main")
    })
  }

  // Render current view
  if (view === "login") {
    return <LoginView onLogin={handleLogin} onBack={() => setView("main")} />
  }

  if (view === "settings") {
    return <SettingsView user={user} onLogout={handleLogout} onBack={() => setView("main")} />
  }

  return (
    <AnalysisView
      product={product}
      analysis={analysis}
      loading={loading}
      error={error}
      user={user}
      onSettings={() => setView("settings")}
      onRetry={analyzeProduct}
      onLogin={() => setView("login")}
    />
  )
}

export default IndexPopup
