/* ==============================================
   FREE vs PAID CHECKS CONFIG
   ============================================== */
const FREE_LIMIT = 3;
let hasPaid = false;

/* ==============================================
   PADDLE CONFIGURATION
   ============================================== */
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

if (typeof Paddle !== 'undefined') {
    try {
        Paddle.Environment.set('sandbox');
        Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: function(data) {
                if (data.name === 'checkout.completed') {
                    setUnlocked(true);
                    setTimeout(() => {
                        Paddle.Checkout.close();
                        renderChecks();
                    }, 500);
                }
            }
        });
    } catch (err) {
        console.error('Paddle initialization error:', err);
    }
}

/* ==============================================
   TRACK PAYMENT STATUS
   ============================================== */
function setUnlocked(state) {
    hasPaid = state;
}

/* ==============================================
   RENDER CHECK CARDS
   ============================================== */
function renderChecks() {
    const container = document.getElementById("results-container");
    if (!container) return;

    container.innerHTML = "";

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

    checks.forEach((check, index) => {
        const isLocked = !hasPaid && index >= FREE_LIMIT;
        if (isLocked) return; // hide locked checks

        const card = document.createElement("div");
        card.className = "check-card";

        const title = document.createElement("h3");
        title.textContent = check;
        card.appendChild(title);

        container.appendChild(card);
    });

    document.getElementById("unlockButton").style.display = hasPaid ? "none" : "inline-block";
}

/* ==============================================
   PADDLE CHECKOUT
   ============================================== */
function buyFullAccess() {
    if (typeof Paddle !== 'undefined') {
        Paddle.Checkout.open({
            product: PADDLE_PRICE_ID,
            title: "Steam Page Compliance Checker - Full Access",
            allowQuantity: false
        });
    } else {
        console.error('Paddle SDK not loaded');
    }
}

/* ==============================================
   CORE CHECK FUNCTION
   ============================================== */
async function runCheck() {
    const url = document.getElementById("steamUrl").value.trim();
    const text = document.getElementById("steamText").value.trim();
    const container = document.getElementById("results-container");
    const summaryBar = document.getElementById("summaryBar");

    container.innerHTML = "Checking…";
    summaryBar.innerHTML = "";

    let payload;
    if (text) payload = { input_data: text, input_type: "text" };
    else if (url) payload = { input_data: url, input_type: "url" };
    else { container.innerHTML = "Please enter a URL or paste text."; return; }

    try {
        const res = await fetch("https://steampagecheck-backend.onrender.com/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        container.innerHTML = "";

        const counts = data.severity_counts;
        if (counts.pass) summaryBar.innerHTML += `<span class="summary-pass">✅ Pass: ${counts.pass}</span>`;
        if (counts.warning) summaryBar.innerHTML += `<span class="summary-warning">⚠️ Warning: ${counts.warning}</span>`;
        if (counts.fail) summaryBar.innerHTML += `<span class="summary-fail">❌ Fail: ${counts.fail}</span>`;

        data.results.forEach((r, index) => {
            if (!hasPaid && index >= FREE_LIMIT) return; // hide locked checks

            const div = document.createElement("div");
            div.className = `result ${r.severity}`;
            let suggested = r.suggested_fix ? `<div class="suggested-fix">${r.suggested_fix}</div>` : "";
            let toggle = r.suggested_fix ? `<span class="toggle-fix" onclick="this.nextElementSibling.style.display=(this.nextElementSibling.style.display==='none'?'block':'none')">Show Fix</span>` : "";
            div.innerHTML = `
                <strong>${r.severity.toUpperCase()} — ${r.title}</strong>
                ${r.details || "No issues detected."}
                ${toggle}
                ${suggested}
            `;
            container.appendChild(div);
        });

    } catch {
        container.innerHTML = "Server error. Make sure the API is running.";
    }
}

/* ==============================================
   UTILITY FUNCTIONS
   ============================================== */
function copyResults() {
    navigator.clipboard.writeText(document.getElementById("results-container").innerText);
    alert("Results copied to clipboard.");
}

function loadSample() {
    document.getElementById("steamText").value = `
Early Access multiplayer game.
Online features included.
Premium currency available.
Screenshots may be updated later.
    `;
    document.getElementById("steamUrl").value = "";
}

function toggleDarkMode() {
    document.body.classList.toggle("light");
}

/* ==============================================
   INITIALIZE
   ============================================== */
document.addEventListener("DOMContentLoaded", renderChecks);
