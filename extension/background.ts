// GreenLane Background Service Worker
// Handles extension lifecycle, user auth, and API communication

const API_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3001"

console.log("GreenLane: Background service worker started")

// Generate unique extension ID on first install
function generateExtensionId(): string {
  return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create extension ID
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

// Get current user data
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

// Register or login user with backend
async function registerUser(email: string, displayName: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const extensionId = await getExtensionId()
    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, extensionId })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Registration failed")
    }

    const data = await response.json()
    
    // Store user info locally - API returns { success, data: { id, email, displayName } }
    const user = data.data
    await chrome.storage.local.set({
      userId: user.id,
      userEmail: user.email,
      userDisplayName: user.displayName
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("GreenLane: Registration error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record a scan to the backend
async function recordScan(productData: object, analysis: object): Promise<{ success: boolean; scan?: object; error?: string }> {
  try {
    const userData = await getUserData()
    if (!userData.userId) {
      return { success: false, error: "Not logged in" }
    }

    const response = await fetch(`${API_URL}/api/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userData.userId,
        productData,
        analysis
      })
    })

    if (!response.ok) throw new Error("Failed to record scan")
    
    const data = await response.json()
    return { success: true, scan: data.scan }
  } catch (error) {
    console.error("GreenLane: Record scan error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("GreenLane: Extension installed/updated", details.reason)
  
  const extensionId = await getExtensionId()
  console.log("GreenLane: Extension ID:", extensionId)
  
  if (details.reason === "install") {
    console.log("GreenLane: First time install - welcome!")
    // Open welcome/settings page on first install
    chrome.tabs.create({ url: "http://localhost:3002?setup=extension" })
  } else if (details.reason === "update") {
    console.log("GreenLane: Updated to version", chrome.runtime.getManifest().version)
  }
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("GreenLane Background: Received message:", message.type)
  
  // Handle different message types
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
      chrome.storage.local.remove(["userId", "userEmail", "userDisplayName"], () => {
        sendResponse({ success: true })
      })
      return true

    case "RECORD_SCAN":
      recordScan(message.productData, message.analysis).then(sendResponse)
      return true

    case "LOG_EVENT":
      console.log("GreenLane Event:", message.event, message.data)
      sendResponse({ success: true })
      break
      
    default:
      console.log("GreenLane Background: Unknown message type:", message.type)
  }
  
  return true
})

export {}
