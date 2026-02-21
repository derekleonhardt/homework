const saveBtn = document.getElementById('save-btn')
const status = document.getElementById('status')
const urlPreview = document.getElementById('url-preview')

let currentTab = null

// Get current tab info
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTab = tabs[0]
  if (currentTab?.url) {
    urlPreview.textContent = currentTab.url
  }
})

// Handle save button click
saveBtn.addEventListener('click', async () => {
  if (!currentTab?.url) return

  saveBtn.disabled = true
  saveBtn.textContent = 'Saving...'
  status.textContent = ''
  status.className = 'status'

  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: currentTab.url }),
    })

    if (response.ok) {
      status.textContent = 'Saved!'
      status.className = 'status success'
      saveBtn.textContent = 'Saved'
      setTimeout(() => window.close(), 800)
    } else {
      throw new Error('Failed')
    }
  } catch (error) {
    status.textContent = 'Failed to save — check your connection'
    status.className = 'status error'
    saveBtn.disabled = false
    saveBtn.textContent = 'Save to Homework'
  }
})
