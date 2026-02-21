# Homework Browser Extension

Save links to Homework from any browser.

## Features

- **Toolbar button** - Click icon → popup to save current tab
- **Right-click menu** - "Save to Homework" on any page or link
- **Keyboard shortcut** - `Alt+Shift+H` saves current tab instantly

## Development Setup

### Chrome
1. Run `./build.sh chrome`
2. Go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select this `extension` folder

### Firefox
1. Run `./build.sh firefox`
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json`

## Requirements

- Homework must be running on `http://localhost:3000`
- No token setup required in local-first mode

## Icons

Current icons are placeholders. Replace with proper icons:
- `icons/icon16.png` - 16x16px
- `icons/icon48.png` - 48x48px
- `icons/icon128.png` - 128x128px
