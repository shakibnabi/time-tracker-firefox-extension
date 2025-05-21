let timer = {
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0,

  start() {
    if (!this.isRunning) {
      this.startTime = Date.now();
      this.isRunning = true;
      this.updateBadge();
    }
  },

  stop() {
    if (this.isRunning) {
      const sessionDuration = Math.floor((Date.now() - this.startTime) / 1000);
      this.elapsedSeconds += sessionDuration;
      this.isRunning = false;
      browser.browserAction.setBadgeText({ text: '' });

      const now = new Date();
      const record = {
        date: now.toLocaleString(),
        duration: sessionDuration
      };

      browser.storage.local.get('records').then((res) => {
        const existing = res.records || [];
        const updated = [record, ...existing].slice(0, 10);
        browser.storage.local.set({ records: updated });
      });

      return this.elapsedSeconds;
    }
    return 0;
  },

  reset() {
    this.isRunning = false;
    this.startTime = null;
    this.elapsedSeconds = 0;
    browser.browserAction.setBadgeText({ text: '' });
  },

  getCurrentTime() {
    if (!this.isRunning) return this.elapsedSeconds;
    return this.elapsedSeconds + Math.floor((Date.now() - this.startTime) / 1000);
  },

  updateBadge() {
    if (!this.isRunning) return;

    const totalSeconds = this.getCurrentTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let badgeText = '';
    if (hours > 0) badgeText = `${hours}h`;
    else if (minutes > 0) badgeText = `${minutes}m`;
    else badgeText = `${seconds}s`;

    browser.browserAction.setBadgeText({ text: badgeText });
    browser.browserAction.setBadgeBackgroundColor({ color: '#4361ee' });

    setTimeout(() => this.updateBadge(), 1000);
  }
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'start':
      timer.start();
      break;
    case 'stop':
      const elapsed = timer.stop();
      sendResponse({ elapsed });
      break;
    case 'reset':
      timer.reset();
      break;
    case 'getTime':
      sendResponse({
        elapsedSeconds: timer.getCurrentTime(),
        isRunning: timer.isRunning
      });
      break;
    case 'getRecords':
      browser.storage.local.get('records').then((res) => {
        sendResponse({ records: res.records || [] });
      });
      return true;
    case 'deleteRecord':
      browser.storage.local.get('records').then((res) => {
        const updated = (res.records || []).filter((_, i) => i !== request.index);
        browser.storage.local.set({ records: updated }).then(() => {
          sendResponse({ success: true });
        });
      });
      return true;
  }
});
