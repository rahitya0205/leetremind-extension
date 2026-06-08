// background.js — runs silently, handles alarms and notifications

chrome.runtime.onInstalled.addListener(() => {
  // Set default storage values on first install
  chrome.storage.local.get("settings", (data) => {
    if (!data.settings) {
      chrome.storage.local.set({
        settings: {
          reminderEnabled: true,
          reminderHour: 21,      // 9 PM default
          reminderMinute: 0,
          weeklyGoal: 5,
          difficulty: "Medium"
        },
        stats: {
          streak: 0,
          lastSolvedDate: null,
          totalSolved: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          weekSolved: 0,
          weekStart: getWeekStart()
        }
      });
    }
  });

  scheduleAlarm();
});

// Re-schedule alarm when browser restarts
chrome.runtime.onStartup.addListener(() => {
  scheduleAlarm();
});

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function scheduleAlarm() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    if (!settings || !settings.reminderEnabled) return;

    chrome.alarms.clear("leetcode-reminder", () => {
      const now = new Date();
      const alarmTime = new Date();
      alarmTime.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);

      // If today's time has passed, schedule for tomorrow
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      chrome.alarms.create("leetcode-reminder", {
        when: alarmTime.getTime(),
        periodInMinutes: 24 * 60  // repeat every 24 hours
      });
    });
  });
}

// Fire notification when alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "leetcode-reminder") return;

  chrome.storage.local.get(["settings", "stats"], (data) => {
    if (!data.settings?.reminderEnabled) return;

    const stats = data.stats;
    const messages = [
      `🔥 ${stats.streak} day streak! Keep it going — solve one problem today.`,
      `💪 You've solved ${stats.totalSolved} problems. Add one more today!`,
      `⚡ Daily reminder: your LeetCode problem is waiting for you.`,
      `🎯 Weekly goal: ${stats.weekSolved} / ${data.settings.weeklyGoal} done. Push forward!`
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "LeetRemind — Time to Code!",
      message: msg,
      priority: 2,
      buttons: [{ title: "Open LeetCode" }]
    });
  });
});

// Handle notification button click
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) {
    chrome.tabs.create({ url: "https://leetcode.com/problemset/" });
  }
});

// Listen for messages from popup (e.g. settings changed)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "RESCHEDULE_ALARM") {
    scheduleAlarm();
  }
});
