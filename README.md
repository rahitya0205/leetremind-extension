# LeetRemind — Chrome Extension

A daily LeetCode reminder extension with streak tracking, weekly goals, and problem of the day.

## Features
- 🔥 Streak tracker — consecutive days solved
- 📊 Stats — Easy / Medium / Hard counts
- 📅 Problem of the day — rotates daily
- 🎯 Weekly goal with progress bar
- 🔔 Daily notification at your chosen time
- ⚙️  Settings — change reminder time, weekly goal, default difficulty

## How to load in Chrome

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select this folder (`leetremind-extension`)
5. Done! The extension icon appears in your toolbar

> Click the puzzle icon 🧩 in Chrome toolbar → pin LeetRemind to keep it visible

## Files
- `manifest.json` — extension config and permissions
- `background.js` — alarm scheduling and notifications
- `popup.html`    — extension popup UI
- `popup.js`      — all popup logic and storage


