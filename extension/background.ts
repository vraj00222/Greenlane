// GreenLane Background Service Worker
// Handles extension lifecycle events and can be used for caching, alarms, etc.

console.log("GreenLane: Background service worker started")

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("GreenLane: Extension installed/updated", details.reason)
  
  if (details.reason === "install") {
    console.log("GreenLane: First time install - welcome!")
    // Could open welcome page here
  } else if (details.reason === "update") {
    console.log("GreenLane: Updated to version", chrome.runtime.getManifest().version)
  }
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("GreenLane Background: Received message:", message, "from:", sender.tab?.url)
  
  // Handle different message types
  switch (message.type) {
    case "LOG_EVENT":
      console.log("GreenLane Event:", message.event, message.data)
      sendResponse({ success: true })
      break
      
    case "GET_USER_ID":
      // For now, return a dummy user ID
      // In production, this would be from auth
      chrome.storage.local.get(["userId"], (result) => {
        if (result.userId) {
          sendResponse({ userId: result.userId })
        } else {
          // Generate a simple user ID
          const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          chrome.storage.local.set({ userId: newUserId })
          sendResponse({ userId: newUserId })
        }
      })
      return true // Will respond asynchronously
      
    default:
      console.log("GreenLane Background: Unknown message type:", message.type)
  }
  
  return true
})

// Keep service worker alive periodically (optional, for long-running tasks)
// chrome.alarms.create("keepAlive", { periodInMinutes: 1 })
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === "keepAlive") {
//     console.log("GreenLane: Keep alive ping")
//   }
// })

export {}
