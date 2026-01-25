/* ==============================================
   FREE vs PAID CHECKS CONFIG
   ============================================== */
const FREE_LIMIT = 3; // number of checks free users can run
let hasPaid = false;

/* ==============================================
   PADDLE CONFIGURATION (EXACT COPY)
   ============================================== */
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

// Initialize Paddle Billing - SET ENVIRONMENT FIRST!
if (typeof Paddle !== 'undefined') {
    try {
        Paddle.Environment.set('sandbox');
        console.log('Environment set to sandbox');
        
        Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: function(data) {
                console.log('PADDLE EVENT:', data.name, data);
                
                if (data.name === 'checkout.completed') {
                    console.log('Payment completed! Unlocking...');
                    setUnlocked(true);
                    
                    setTimeout(function() {
                        Paddle.Checkout.close();
                        renderChecks(); // refresh UI to show unlocked checks
                    }, 1000);
                }
            }
        });
        
        console.log('Paddle initialized successfully');
    } catch (error) {
        console.error('Paddle initialization failed:', error);
    }
} else {
    console.error('Paddle SDK not loaded');
}

/* ==============================================
   FUNCTION TO TRACK PAYMENT STATUS
   ============================================== */
function setUnlocked(state) {
    hasPaid = state;
}

/* ==============================================
   RENDER ALL 10 CHECKS
   ============================================== */
function renderChecks() {
    const resultsContainer = document.getElementById("results-container");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = ""; // clear old cards

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

        // Badge
        const badge = document.createElement("span");
        badge.className = "check-badge";
        badge.textContent = isLocked ? "LOCKED" : "AVAILABLE";
        card.appendChild(badge);

        // Title
        const title = document.createElement("h3");
        title.textContent = check;
        card.appendChild(title);

        // Hint for locked checks
        if (isLocked) {
            const hint = document.createElement("p");
            hint.className = "check-hint";
            hint.textContent = "Unlock full access via one-time purchase";
            card.appendChild(hint);
        }

        resultsContainer.appendChild(card);
    });
}

/* ==============================================
   BUTTON FUNCTION TO OPEN PADDLE CHECKOUT
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
   INITIALIZE ON PAGE LOAD
   ============================================== */
document.addEventListener("DOMContentLoaded", function() {
    renderChecks();
});
