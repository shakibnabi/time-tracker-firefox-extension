const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const buttonText = document.getElementById('buttonText');
const buttonIcon = document.getElementById('buttonIcon');
const recordsBody = document.getElementById('recordsBody');

let timerInterval = null;

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

function updateDisplay(elapsed) {
  currentTimeDisplay.textContent = formatTime(elapsed);
  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  totalTimeDisplay.textContent = `Total: ${hrs}h ${mins}m ${secs}s`;
}

function toggleButton(isRunning) {
  if (isRunning) {
    buttonText.textContent = 'Stop';
    buttonIcon.className = 'ri-stop-fill button-icon';
    startStopBtn.classList.add('is-running');
  } else {
    buttonText.textContent = 'Start';
    buttonIcon.className = 'ri-play-fill button-icon';
    startStopBtn.classList.remove('is-running');
  }
}

function loadRecords() {
  chrome.runtime.sendMessage({ action: 'getRecords' }, ({ records }) => {
    recordsBody.innerHTML = '';
    if (records.length === 0) {
      recordsBody.innerHTML = `<tr><td colspan="3" class="empty-state">No records yet</td></tr>`;
      return;
    }
    records.forEach((record, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="record-date">${record.date}</td>
        <td class="record-duration">${formatTime(record.duration)}</td>
        <td><button class="delete-btn" data-index="${index}"><i class="ri-delete-bin-line"></i></button></td>
      `;
      recordsBody.appendChild(tr);
    });
  });
}

function init() {
  chrome.runtime.sendMessage({ action: 'getTime' }, ({ elapsedSeconds, isRunning }) => {
    updateDisplay(elapsedSeconds);
    toggleButton(isRunning);

    if (isRunning) {
      timerInterval = setInterval(() => {
        elapsedSeconds += 1;
        updateDisplay(elapsedSeconds);
      }, 1000);
    }
  });

  loadRecords();
}

startStopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: buttonText.textContent.toLowerCase() }, (response) => {
    if (buttonText.textContent === 'Start') {
      init();
    } else {
      clearInterval(timerInterval);
      updateDisplay(response.elapsed);
      toggleButton(false);
      loadRecords();
    }
  });
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  chrome.runtime.sendMessage({ action: 'reset' }, () => {
    updateDisplay(0);
    toggleButton(false);
  });
});

recordsBody.addEventListener('click', (e) => {
  if (e.target.closest('.delete-btn')) {
    const index = parseInt(e.target.closest('.delete-btn').dataset.index);
    chrome.runtime.sendMessage({ action: 'deleteRecord', index }, () => {
      loadRecords();
    });
  }
});

document.addEventListener('DOMContentLoaded', init);
