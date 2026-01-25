/* ==============================================
   FREE vs PAID CHECKS CONFIG
   ============================================== */
const FREE_LIMIT = 3;

/* ==============================================
   UNLOCK STATE
   ============================================== */
let hasPaid = localStorage.getItem('unlocked') === 'true';

function setUnlocked(state) {
  hasPaid = state;
  if (state) localStorage.setItem('unlocked', 'true');
  else localStorage.removeItem('unlocked');
}

/* ==============================================
   CHECK LIST
   ============================================== */
const checks = [
  "Refund Policy Reference",
  "Clear Pricing Language",
  "Early Access Disclaimer",
  "Multiplayer / Network Disclaimer",
  "Controller Support Consistency",
  "VR Support Consistency",
  "Age-Sensitive Content Disclosure",
  "Screenshot Count",
  "Screenshot Aspect Ratio",
  "External Support Links"
];

/* ==============================================
   RENDER CHECKS
   ============================================== */
function renderChecks() {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = ''; // clear old cards

  const visibleChecks = hasPaid ? checks : checks.slice(0, FREE_LIMIT);

  // Render available checks
  visibleChecks.forEach((check) => {
    const card = document.createElement("div");
    card.className = "check-card";

    const badge = document.createElement("span");
    badge.className = "check-badge";
    badge.textContent = "AVAILABLE";
    card.appendChild(badge);

    const title = document.createElement("h3");
    title.textContent = check;
    card.appendChild(title);

    resultsContainer.appendChild(card);
  });

  // Render locked checks
  if (!hasPaid) {
    for (let i = FREE_LIMIT; i < checks.length; i++) {
      const card = document.createElement("div");
      card.className = "check-card locked";

      const badge = document.createElement("span");
      badge.className = "check-badge";
      badge.textContent = "LOCKED";
      card.appendChild(badge);

      const title = document.createElement("h3");
      title.textContent = checks[i];
      card.appendChild(title);

      const hint = document.createElement("p");
      hint.className = "check-hint";
      hint.textContent = "Unlock full access via one-time purchase";
      card.appendChild(hint);

      resultsContainer.appendChild(card);
    }
  }
}

/* ==============================================
   APP BUTTONS
   ============================================== */
function unlockAllChecks() {
  if (typeof Paddle === 'undefined') {
    console.error('Paddle not initialized');
    return;
  }

  Paddle.Checkout.open({
    items: [{ priceId: 'pri_01kfc8wsrhhqezk6htxdy7eppe', quantity: 1 }]
  });
}

function runCheck() {
  const output = document.getElementById('output');
  const url = document.getElementById('steamUrl').value.trim();
  const text = document.getElementById('steamText').value.trim();

  if (!url && !text) {
    output.textContent = "Please enter a Steam URL or paste store text.";
    return;
  }

  // Dummy check logic for now
  output.innerHTML = `<p>✅ Checks completed for ${url || "pasted text"}.</p>`;
}

/* ==============================================
   COPY RESULTS
   ============================================== */
function copyResults() {
  const output = document.getElementById('output');
  if (!output.textContent) return;

  navigator.clipboard.writeText(output.textContent)
    .then(() => alert('Results copied to clipboard'))
    .catch(() => alert('Failed to copy results'));
}

/* ==============================================
   SAMPLE DATA / UI
   ============================================== */
function loadSample() {
  document.getElementById('steamText').value = `
  About This Game: Test description...
  Early Access: Yes
  Pricing: $19.99
  `;
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

/* ==============================================
   INITIALIZE
   ============================================== */
document.addEventListener("DOMContentLoaded", function() {
  renderChecks();

  // Hook the unlock button in case index.html changed it
  const unlockBtn = document.getElementById('unlockBtn');
  if (unlockBtn) {
    unlockBtn.addEventListener('click', unlockAllChecks);
  }
});
