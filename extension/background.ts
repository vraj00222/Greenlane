// GreenLane Background Service Worker
// Handles extension lifecycle, user auth, and API communication

const API_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:8080"

interface CachedAnalysis {
  analysis: object
  timestamp: number
}

const analysisCache = new Map<string, CachedAnalysis>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

console.log("GreenLane: Background service worker started")

function generateExtensionId(): string {
  return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function extractAsin(url: string | undefined | null): string | null {
  if (!url) return null
  const patterns = [/\/dp\/([A-Z0-9]{10})/i, /\/gp\/product\/([A-Z0-9]{10})/i, /[?&]asin=([A-Z0-9]{10})/i]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1].toUpperCase()
  }
  return null
}

async function getExtensionId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extensionId"], (result) => {
      if (result.extensionId) {
        resolve(result.extensionId)
      } else {
        const newId = generateExtensionId()
        chrome.storage.local.set({ extensionId: newId })
        resolve(newId)
      }
    })
  })
}

async function getUserData(): Promise<{ userId: string | null; email: string | null; displayName: string | null }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userId", "userEmail", "userDisplayName"], (result) => {
      resolve({
        userId: result.userId || null,
        email: result.userEmail || null,
        displayName: result.userDisplayName || null
      })
    })
  })
}

async function ensureBackendSession(): Promise<void> {
  const userData = await getUserData()
  if (!userData.email) return

  try {
    await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userData.email })
    })
  } catch {
    // Best effort only
  }
}

async function registerUser(email: string, displayName: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    await getExtensionId()

    const registerRes = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username: displayName })
    })

    if (!registerRes.ok && registerRes.status !== 409) {
      const errorData = await registerRes.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.reason || "Registration failed")
    }

    const loginRes = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })

    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.reason || "Login failed")
    }

    const user = await loginRes.json()
    await chrome.storage.local.set({
      userId: String(user.id),
      userEmail: user.email,
      userDisplayName: user.username || displayName
    })

    return { success: true, userId: String(user.id) }
  } catch (error) {
    console.error("GreenLane: Registration error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function recordScan(productData: any, _analysis: object): Promise<{ success: boolean; scan?: object; error?: string }> {
  try {
    const userData = await getUserData()
    if (!userData.userId) {
      return { success: false, error: "Not logged in" }
    }

    const asin = extractAsin(productData?.url)
    if (!asin) {
      return { success: false, error: "Could not extract ASIN from product URL" }
    }

    await ensureBackendSession()

    const response = await fetch(`${API_URL}/api/products/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([asin])
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.reason || "Failed to record scan")
    }

    return { success: true, scan: { asin, userId: userData.userId } }
  } catch (error) {
    console.error("GreenLane: Record scan error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("GreenLane: Extension installed/updated", details.reason)

  const extensionId = await getExtensionId()
  console.log("GreenLane: Extension ID:", extensionId)

  if (details.reason === "install") {
    console.log("GreenLane: First time install - welcome!")
    chrome.tabs.create({ url: "http://localhost:3000?setup=extension" })
  } else if (details.reason === "update") {
    console.log("GreenLane: Updated to version", chrome.runtime.getManifest().version)
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("GreenLane Background: Received message:", message.type)

  switch (message.type) {
    case "GET_USER_DATA":
      getUserData().then(sendResponse)
      return true

    case "GET_EXTENSION_ID":
      getExtensionId().then((extensionId) => sendResponse({ extensionId }))
      return true

    case "REGISTER_USER":
      registerUser(message.email, message.displayName).then(sendResponse)
      return true

    case "LOGOUT":
      fetch(`${API_URL}/api/users/logout`, { method: "POST" }).catch(() => undefined)
      chrome.storage.local.remove(["userId", "userEmail", "userDisplayName"], () => {
        sendResponse({ success: true })
      })
      return true

    case "RECORD_SCAN":
      recordScan(message.productData, message.analysis).then(sendResponse)
      return true

    case "GET_CACHED_ANALYSIS": {
      const cacheKey = message.productUrl
      const cached = analysisCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("GreenLane: Cache HIT for", cacheKey.substring(0, 50))
        sendResponse({ cached: true, analysis: cached.analysis })
      } else {
        console.log("GreenLane: Cache MISS for", cacheKey.substring(0, 50))
        sendResponse({ cached: false })
      }
      return true
    }

    case "SET_CACHED_ANALYSIS":
      analysisCache.set(message.productUrl, {
        analysis: message.analysis,
        timestamp: Date.now()
      })
      console.log("GreenLane: Cached analysis for", message.productUrl.substring(0, 50))
      sendResponse({ success: true })
      return true

    case "LOG_EVENT":
      console.log("GreenLane Event:", message.event, message.data)
      sendResponse({ success: true })
      return true

    default:
      console.log("GreenLane Background: Unknown message type:", message.type)
      return true
  }
})

export {}
