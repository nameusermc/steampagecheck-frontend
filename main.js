// =====================
// APP LOGIC
// =====================

function runCheck() {
  const url = document.getElementById('steamUrl').value.trim();
  const text = document.getElementById('steamText').value.trim();
  const output = document.getElementById('output');
  const summaryBar = document.getElementById('summaryBar');

  if (!url && !text) {
    output.innerHTML = 'Please enter a Steam URL or paste your store page text.';
    return;
  }

  const results = [];

  if (text.toLowerCase().includes('early access')) {
    results.push({ severity: 'FAIL', message: 'Early Access disclaimer detected' });
  } else {
    results.push({ severity: 'PASS', message: 'No Early Access issues found' });
  }

  output.innerHTML = results.map(r => `<p><strong>${r.severity}:</strong> ${r.message}</p>`).join('');
  summaryBar.textContent = `Total checks: ${results.length}`;
}

function copyResults() {
  const output = document.getElementById('output');
  if (!output.textContent) return;

  navigator.clipboard.writeText(output.textContent).then(() => {
    alert('Results copied to clipboard!');
  });
}

function loadSample() {
  document.getElementById('steamText').value = 'Sample game description with no Early Access.';
  runCheck();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('steamUrl').addEventListener('input', runCheck);
  document.getElementById('steamText').addEventListener('input', runCheck);
});
