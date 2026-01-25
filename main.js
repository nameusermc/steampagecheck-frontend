const FREE_LIMIT = 3;
const PADDLE_CLIENT_TOKEN = 'test_c2deb3cb9b85f4b2afcd596c107';
const PADDLE_PRICE_ID = 'pri_01kfc8wsrhhqezk6htxdy7eppe';

if (typeof Paddle !== 'undefined') {
    try {
        Paddle.Environment.set('sandbox');
        console.log('Paddle environment set to sandbox');

        Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: function(data) {
                console.log('Paddle event:', data.name, data);
                if (data.name === 'checkout.completed') {
                    console.log('Payment completed! Unlocking all checks.');
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
} else {
    console.error('Paddle SDK not loaded');
}

function isUnlocked() {
    return localStorage.getItem('unlocked') === 'true';
}

function setUnlocked(value) {
    if (value) localStorage.setItem('unlocked', 'true');
    else localStorage.removeItem('unlocked');
}

function renderChecks() {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

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

    const visibleChecks = isUnlocked() ? checks : checks.slice(0, FREE_LIMIT);

    visibleChecks.forEach((check) => {
        const card = document.createElement('div');
        card.className = 'check-card';
        const badge = document.createElement('span');
        badge.className = 'check-badge';
        badge.textContent = 'AVAILABLE';
        card.appendChild(badge);
        const title = document.createElement('h3');
        title.textContent = check;
        card.appendChild(title);
        resultsContainer.appendChild(card);
    });

    if (!isUnlocked()) {
        for (let i = FREE_LIMIT; i < checks.length; i++) {
            const card = document.createElement('div');
            card.className = 'check-card locked';
            const badge = document.createElement('span');
            badge.className = 'check-badge';
            badge.textContent = 'LOCKED';
            card.appendChild(badge);
            const title = document.createElement('h3');
            title.textContent = checks[i];
            card.appendChild(title);
            const hint = document.createElement('p');
            hint.textContent = 'Unlock full access via one-time purchase';
            card.appendChild(hint);
            resultsContainer.appendChild(card);
        }

        if (!document.getElementById('unlockBtn')) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'unlockBtn';
            unlockBtn.textContent = 'Unlock All Checks';
            unlockBtn.className = 'secondary';
            unlockBtn.addEventListener('click', handleUnlock);
            resultsContainer.appendChild(unlockBtn);
        }
    }
}

function handleUnlock() {
    Paddle.Checkout.open({
        items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }]
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderChecks();
});
