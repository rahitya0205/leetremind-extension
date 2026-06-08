// popup.js — all logic for the extension popup

const QUOTES = [
  '"Consistency beats intensity — one problem a day keeps regret away."',
  '"First solve the problem. Then write the code." — John Johnson',
  '"Every expert was once a beginner. Keep grinding."',
  '"The best time to start was yesterday. The next best time is now."',
  '"An investment in knowledge pays the best interest."',
  '"Code. Fail. Learn. Repeat. That is the process."'
];

// Sample problems (in a real extension you can fetch LeetCode's daily challenge API)
const SAMPLE_PROBLEMS = [
  { title: "Two Sum", difficulty: "Easy", tags: ["Array", "Hash Map"], slug: "two-sum" },
  { title: "Roman To Integer", difficulty: "Easy", tags: ["Hash", "String"], slug: "roman-to-integer" },
  { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", tags: ["Sliding Window", "Hash Map"], slug: "longest-substring-without-repeating-characters" },
  { title: "Merge k Sorted Lists", difficulty: "Hard", tags: ["Heap", "Linked List"], slug: "merge-k-sorted-lists" },
  { title: "Best Time to Buy and Sell Stock", difficulty: "Easy", tags: ["Array", "Greedy"], slug: "best-time-to-buy-and-sell-stock" },
  { title: "Coin Change", difficulty: "Medium", tags: ["DP", "BFS"], slug: "coin-change" },
  { title: "Word Ladder", difficulty: "Hard", tags: ["BFS", "Graph"], slug: "word-ladder" },
  { title: "Valid Parentheses", difficulty: "Easy", tags: ["Stack", "String"], slug: "valid-parentheses" },
  { title: "Binary Tree Level Order Traversal", difficulty: "Medium", tags: ["BFS", "Tree"], slug: "binary-tree-level-order-traversal" }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function formatTime(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDailyProblem() {
  // Rotate deterministically by day-of-year so it's consistent all day
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff  = new Date() - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return SAMPLE_PROBLEMS[dayOfYear % SAMPLE_PROBLEMS.length];
}

// ── Render UI ─────────────────────────────────────────────────────────────────

function renderStats(stats, settings) {
  document.getElementById("streak-num").textContent  = stats.streak;
  document.getElementById("easy-count").textContent  = stats.easy;
  document.getElementById("med-count").textContent   = stats.medium;
  document.getElementById("hard-count").textContent  = stats.hard;

  // Reset week if new week started
  const currentWeekStart = getWeekStart();
  let weekSolved = stats.weekSolved;
  if (stats.weekStart !== currentWeekStart) {
    weekSolved = 0;
  }

  const goal = settings.weeklyGoal || 5;
  const pct  = Math.min(Math.round((weekSolved / goal) * 100), 100);
  document.getElementById("goal-txt").textContent  = `${weekSolved} / ${goal} solved`;
  document.getElementById("progress-fill").style.width = pct + "%";
}

function renderProblem() {
  const p = getDailyProblem();
  document.getElementById("potd-title").textContent = p.title;

  const badge = document.getElementById("potd-badge");
  badge.textContent = p.difficulty;
  badge.className = "badge badge-" + p.difficulty.toLowerCase();

  const tagsEl = document.getElementById("potd-tags");
  tagsEl.innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join("");

  document.getElementById("potd-link").href =
    `https://leetcode.com/problems/${p.slug}/`;
}

function renderReminder(settings) {
  const label = formatTime(settings.reminderHour, settings.reminderMinute);
  document.getElementById("reminder-time-label").textContent = `${label} every day`;

  const toggle = document.getElementById("toggle-btn");
  toggle.classList.toggle("off", !settings.reminderEnabled);
}

function renderSettings(settings) {
  const h = String(settings.reminderHour).padStart(2, "0");
  const m = String(settings.reminderMinute).padStart(2, "0");
  document.getElementById("time-input").value  = `${h}:${m}`;
  document.getElementById("goal-input").value  = settings.weeklyGoal;
  document.getElementById("diff-input").value  = settings.difficulty;
}

function renderSolvedState(stats) {
  const solvedBtn = document.getElementById("solved-btn");
  if (stats.lastSolvedDate === getTodayStr()) {
    solvedBtn.textContent = "✓ Already solved today!";
    solvedBtn.style.background = "#00b8a3";
    solvedBtn.disabled = true;
  } else {
    solvedBtn.textContent = "✓ Mark solved today";
    solvedBtn.style.background = "#ffa116";
    solvedBtn.disabled = false;
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

function setupToggle(settings) {
  const toggle = document.getElementById("toggle-btn");
  toggle.addEventListener("click", () => {
    chrome.storage.local.get("settings", (data) => {
      const s = data.settings;
      s.reminderEnabled = !s.reminderEnabled;
      chrome.storage.local.set({ settings: s }, () => {
        toggle.classList.toggle("off", !s.reminderEnabled);
        chrome.runtime.sendMessage({ type: "RESCHEDULE_ALARM" });
      });
    });
  });
}

function setupSolvedBtn() {
  document.getElementById("solved-btn").addEventListener("click", () => {
    chrome.storage.local.get(["stats", "settings"], (data) => {
      const stats    = data.stats;
      const settings = data.settings;
      const today    = getTodayStr();

      if (stats.lastSolvedDate === today) return;

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      stats.streak = (stats.lastSolvedDate === yStr) ? stats.streak + 1 : 1;
      stats.lastSolvedDate = today;
      stats.totalSolved++;

      // Update difficulty count
      const diff = settings.difficulty.toLowerCase();
      if (diff === "easy")   stats.easy++;
      else if (diff === "medium") stats.medium++;
      else stats.hard++;

      // Update weekly count
      const currentWeekStart = getWeekStart();
      if (stats.weekStart !== currentWeekStart) {
        stats.weekSolved = 1;
        stats.weekStart  = currentWeekStart;
      } else {
        stats.weekSolved++;
      }

      chrome.storage.local.set({ stats }, () => {
        renderStats(stats, settings);
        renderSolvedState(stats);
      });
    });
  });
}

function setupOpenBtn() {
  document.getElementById("open-btn").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://leetcode.com/problemset/" });
  });
}

function setupSettings() {
  const panel   = document.getElementById("settings-panel");
  const toggleS = document.getElementById("settings-toggle");
  toggleS.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  document.getElementById("save-btn").addEventListener("click", () => {
    const timeVal = document.getElementById("time-input").value; // "HH:MM"
    const [hour, minute] = timeVal.split(":").map(Number);
    const weeklyGoal = parseInt(document.getElementById("goal-input").value) || 5;
    const difficulty = document.getElementById("diff-input").value;

    chrome.storage.local.get("settings", (data) => {
      const s = {
        ...data.settings,
        reminderHour: hour,
        reminderMinute: minute,
        weeklyGoal,
        difficulty
      };
      chrome.storage.local.set({ settings: s }, () => {
        renderReminder(s);
        chrome.runtime.sendMessage({ type: "RESCHEDULE_ALARM" });
        panel.classList.remove("open");
      });
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Random quote
  document.getElementById("quote").textContent =
    QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // Load problem of the day
  renderProblem();

  // Load everything from storage
  chrome.storage.local.get(["stats", "settings"], (data) => {
    const stats    = data.stats    || { streak: 0, lastSolvedDate: null, totalSolved: 0, easy: 0, medium: 0, hard: 0, weekSolved: 0, weekStart: getWeekStart() };
    const settings = data.settings || { reminderEnabled: true, reminderHour: 21, reminderMinute: 0, weeklyGoal: 5, difficulty: "Medium" };

    renderStats(stats, settings);
    renderReminder(settings);
    renderSettings(settings);
    renderSolvedState(stats);

    setupToggle(settings);
    setupSolvedBtn();
    setupOpenBtn();
    setupSettings();
  });
});
