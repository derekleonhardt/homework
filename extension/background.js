if (typeof importScripts === 'function') {
  importScripts('config.js')
}

// Refresh any open Homework tabs
function refreshHomeworkTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs.filter((t) => t.url?.startsWith(CONFIG.APP_URL))) {
      chrome.tabs.reload(tab.id)
    }
  })
}

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-homework',
    title: 'Save to Homework',
    contexts: ['page', 'link'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-homework') {
    const url = info.linkUrl || info.pageUrl
    saveToHomework(url)
  }
})

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-current-tab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab?.url) {
        saveToHomework(tab.url)
      }
    })
  }
})

// Save URL to Homework API
async function saveToHomework(url) {
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: url }),
    })

    if (response.ok) {
      showBadge('\u2713', '#22c55e')
      refreshHomeworkTabs()
    } else {
      showBadge('\u2717', '#ef4444')
    }
  } catch (error) {
    showBadge('\u2717', '#ef4444')
  }
}

// Show temporary badge on extension icon
function showBadge(text, color) {
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color })
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' })
  }, 2000)
}
