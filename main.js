/* ==============================================
   FREE vs PAID CHECKS CONFIG
   ============================================== */
const FREE_LIMIT = 3; // number of checks free users can run
let hasPaid = false;

/* ==============================================
   PADDLE CONFIGURATION
   ============================================== */
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

// Initialize Paddle Sandbox
if (typeof Paddle !== 'undefined') {
    try {
        Paddle.Environment.set('sandbox');
        Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: function(data) {
                console.log('PADDLE EVENT:', data.name, data);
                if (data.name === 'checkout.completed') {
                    setUnlocked(true);
                    renderChecks();
                    setTimeout(() => Paddle.Checkout.close(), 1000);
                }
            }
        });
        console.log('Paddle initialized (sandbox)');
    } catch (e) {
        console.error('Paddle init failed:', e);
    }
} else {
    console.error('Paddle SDK not loaded');
}

/* ==============================================
   TRACK PAYMENT STATUS
   ============================================== */
function setUnlocked(state) {
    hasPaid = state;
}

/* ==============================================
   RENDER ALL CHECK CARDS
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
        const card = document.createElement("div");
        card.className = "check-card" + (isLocked ? " locked" : "");
        const badge = document.createElement("span");
        badge.className = "check-badge";
        badge.textContent = isLocked ? "LOCKED" : "AVAILABLE";
        card.appendChild(badge);
        const title = document.createElement("h3");
        title.textContent = check;
        card.appendChild(title);

        if (isLocked) {
            const hint = document.createElement("p");
            hint.className = "check-hint";
            hint.textContent = "Unlock full access via one-time purchase";
            card.appendChild(hint);
        }

        container.appendChild(card);
    });
}

/* ==============================================
   RUN CHECKS (API)
   ============================================== */
async function runCheck() {
    const url = document.getElementById("steamUrl").value.trim();
    const text = document.getElementById("steamText").value.trim();
    const output = document.getElementById("output");
    const summaryBar = document.getElementById("summaryBar");

    output.innerHTML = "Checking…";
    summaryBar.innerHTML = "";

    let payload;
    if (text) payload = { input_data: text, input_type: "text" };
    else if (url) payload = { input_data: url, input_type: "url" };
    else { output.innerHTML = "Please enter a URL or paste text."; return; }

    try {
        const res = await fetch("https://steampagecheck-backend.onrender.com/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        output.innerHTML = "";

        const counts = data.severity_counts;
        if (counts.pass) summaryBar.innerHTML += `<span class="summary-pass">✅ Pass: ${counts.pass}</span>`;
        if (counts.warning) summaryBar.innerHTML += `<span class="summary-warning">⚠️ Warning: ${counts.warning}</span>`;
        if (counts.fail) summaryBar.innerHTML += `<span class="summary-fail">❌ Fail: ${counts.fail}</span>`;

        const checks = document.querySelectorAll("#results-container .check-card");
        data.results.forEach((r, i) => {
            const isLocked = !hasPaid && i >= FREE_LIMIT;
            if (isLocked) return; // skip locked checks

            const div = document.createElement("div");
            div.className = `result ${r.severity}`;
            let suggested = r.suggested_fix ? `<div class="suggested-fix">${r.suggested_fix}</div>` : "";
            let toggle = r.suggested_fix ? `<span class="toggle-fix" onclick="this.nextElementSibling.style.display=(this.nextElementSibling.style.display==='none'?'block':'none')">Show Fix</span>` : "";
            div.innerHTML = `<strong>${r.severity.toUpperCase()} — ${r.title}</strong>${r.details || "No issues detected."}${toggle}${suggested}`;
            output.appendChild(div);
        });
    } catch {
        output.innerHTML = "Server error. Make sure the API is running.";
    }
}

/* ==============================================
   COPY RESULTS
   ============================================== */
function copyResults() {
    navigator.clipboard.writeText(document.getElementById("output").innerText);
    alert("Results copied to clipboard.");
}

/* ==============================================
   LOAD SAMPLE TEXT
   ============================================== */
function loadSample() {
    document.getElementById("steamText").value = `
Early Access multiplayer game.
Online features included.
Premium currency available.
Screenshots may be updated later.
    `;
    document.getElementById("steamUrl").value = "";
}

/* ==============================================
   TOGGLE DARK MODE
   ============================================== */
let darkMode = true;
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle("light", !darkMode);
}

/* ==============================================
   BUY FULL ACCESS
   ============================================== */
function unlockAllChecks() {
    if (typeof Paddle !== "undefined") {
        Paddle.Checkout.open({
            product: PADDLE_PRICE_ID,
            title: "Steam Page Compliance Checker - Full Access",
            allowQuantity: false
        });
    } else {
        alert("Paddle SDK not loaded");
    }
}

/* ==============================================
   INITIALIZE PAGE
   ============================================== */
document.addEventListener("DOMContentLoaded", () => {
    renderChecks();
});
