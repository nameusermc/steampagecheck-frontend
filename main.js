/* ==============================================
   FREE vs PAID CHECKS CONFIG
   ============================================== */
const FREE_LIMIT = 3;
let hasPaid = localStorage.getItem('unlocked') === 'true';

/* ==============================================
   PADDLE CONFIGURATION
   ============================================== */
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

/* ==============================================
   INITIALIZE PADDLE
   ============================================== */
function initPaddle() {
  if (typeof Paddle === 'undefined') {
    console.error('Paddle SDK not loaded');
    return;
  }

  try {
    Paddle.Environment.set('sandbox');
    Paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: function(data) {
        console.log('PADDLE EVENT:', data.name, data);
        if (data.name === 'checkout.completed') {
          console.log('Payment completed! Unlocking...');
          setUnlocked(true);
          setTimeout(() => {
            Paddle.Checkout.close();
            renderChecks();
          }, 1000);
        }
      }
    });
    console.log('Paddle initialized successfully');
  } catch (error) {
    console.error('Paddle initialization failed:', error);
  }
}

/* ==============================================
   UNLOCK STATE
   ============================================== */
function setUnlocked(state) {
  hasPaid = state;
  if (state) localStorage.setItem('unlocked', 'true');
  else localStorage.removeItem('unlocked');
}

/* ==============================================
   RENDER CHECKS
   ============================================== */
function renderChecks() {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = ''; // clear old cards

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

  const visibleChecks = hasPaid ? checks : checks.slice(0, FREE_LIMIT);

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

    if (!document.getElementById('unlockBtn')) {
      const unlockBtn = document.createElement('button');
      unlockBtn.id = 'unlockBtn';
      unlockBtn.className = 'secondary';
      unlockBtn.textContent = 'Unlock All Checks';
      unlockBtn.addEventListener('click', () => {
        Paddle.Checkout.open({ items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }] });
      });
      resultsContainer.appendChild(unlockBtn);
    }
  }
}

/* ==============================================
   PAGE LOAD INITIALIZATION
   ============================================== */
document.addEventListener("DOMContentLoaded", function() {
  initPaddle();
  renderChecks();
});
