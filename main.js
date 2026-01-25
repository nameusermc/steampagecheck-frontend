// =====================
// PADDLE BILLING CONFIG
// =====================
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

// Unlock state
let hasPaid = localStorage.getItem('unlocked') === 'true';

function setUnlocked(state) {
    hasPaid = state;
    if (state) localStorage.setItem('unlocked', 'true');
    else localStorage.removeItem('unlocked');
}

// Initialize Paddle - MUST BE FIRST
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

                    // Close checkout and refresh UI
                    setTimeout(() => {
                        Paddle.Checkout.close();
                        updateUnlockUI();
                    }, 1000);
                }
            }
        });
        console.log('Paddle initialized successfully');
    } catch (err) {
        console.error('Paddle initialization failed:', err);
    }
}

// =====================
// UNLOCK BUTTON HANDLER
// =====================
function setupUnlockButton() {
    const unlockBtn = document.getElementById('unlockBtn');
    if (!unlockBtn) return;

    unlockBtn.addEventListener('click', () => {
        Paddle.Checkout.open({
            items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }]
        });
    });
}

// =====================
// UPDATE UI BASED ON UNLOCK STATE
// =====================
function updateUnlockUI() {
    const unlockBtn = document.getElementById('unlockBtn');
    if (hasPaid) {
        unlockBtn.style.display = 'none';
    } else {
        unlockBtn.style.display = 'inline-block';
    }

    // Example: if you have check cards or buttons limited by unlock
    const lockedElements = document.querySelectorAll('.locked-feature');
    lockedElements.forEach(el => {
        el.disabled = !hasPaid;
    });
}

// =====================
// APP LOGIC (Checks)
// =====================

// Run your Steam page checks
function runCheck() {
    const url = document.getElementById('steamUrl').value.trim();
    const text = document.getElementById('steamText').value.trim();
    const output = document.getElementById('output');
    const summaryBar = document.getElementById('summaryBar');

    // Basic validation
    if (!url && !text) {
        output.innerHTML = 'Please enter a Steam URL or paste your store page text.';
        return;
    }

    // Simulated checks (replace with real logic)
    const results = [];

    if (text.toLowerCase().includes('early access')) {
        results.push({ severity: 'FAIL', message: 'Early Access disclaimer detected' });
    } else {
        results.push({ severity: 'PASS', message: 'No Early Access issues found' });
    }

    // More checks can go here…

    // Render results
    output.innerHTML = results.map(r => `<p><strong>${r.severity}:</strong> ${r.message}</p>`).join('');
    summaryBar.textContent = `Total checks: ${results.length}`;
}

// Copy results to clipboard
function copyResults() {
    const output = document.getElementById('output');
    if (!output.textContent) return;

    navigator.clipboard.writeText(output.textContent).then(() => {
        alert('Results copied to clipboard!');
    });
}

// Load sample test data
function loadSample() {
    document.getElementById('steamText').value = `Sample game description here.`;
    runCheck();
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// =====================
// DOM READY INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initPaddle();
    setupUnlockButton();
    updateUnlockUI();

    document.getElementById('steamUrl').addEventListener('input', runCheck);
    document.getElementById('steamText').addEventListener('input', runCheck);
});
