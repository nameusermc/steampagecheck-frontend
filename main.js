// =====================
// PADDLE BILLING CONFIG
// =====================
const PADDLE_CLIENT_TOKEN = 'test_86bf96ddbab105199d721ee81ae';
const PADDLE_PRICE_ID = 'pri_01kft4eh4rcjcx5pq2tvhwsw27';

// Unlock state
let hasPaid = localStorage.getItem('unlocked') === 'true';

function setUnlocked(state) {
    hasPaid = state;
    if (state) localStorage.setItem('unlocked', 'true');
    else localStorage.removeItem('unlocked');
}

// =====================
// UNLOCK BUTTON HANDLER
// =====================
function setupUnlockButton() {
    const unlockBtn = document.getElementById('unlockBtn');
    if (!unlockBtn) return;

    // Set Paddle environment before any checkout call
    if (typeof Paddle === 'undefined') {
        console.error('Paddle SDK not loaded');
        return;
    }
    try {
        Paddle.Environment.set('sandbox');
        console.log('Paddle sandbox environment set');

        unlockBtn.addEventListener('click', () => {
            Paddle.Checkout.open({
                items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
                successCallback: function(data) {
                    console.log('Checkout success callback:', data);
                    setUnlocked(true);
                    updateUnlockUI();
                }
            });
        });
    } catch (err) {
        console.error('Paddle setup failed:', err);
    }
}

// =====================
// UPDATE UI BASED ON UNLOCK STATE
// =====================
function updateUnlockUI() {
    const unlockBtn = document.getElementById('unlockBtn');
    if (hasPaid) unlockBtn.style.display = 'none';
    else unlockBtn.style.display = 'inline-block';

    const lockedElements = document.querySelectorAll('.locked-feature');
    lockedElements.forEach(el => {
        el.disabled = !hasPaid;
    });
}

// =====================
// APP LOGIC (Checks)
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
    document.getElementById('steamText').value = `Sample game description here.`;
    runCheck();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// =====================
// DOM READY INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    setupUnlockButton();
    updateUnlockUI();

    document.getElementById('steamUrl').addEventListener('input', runCheck);
    document.getElementById('steamText').addEventListener('input', runCheck);
});
