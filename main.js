// =======================
// STEAM PAGE CHECK - MAIN LOGIC
// =======================

// Define all checks - some free, some premium
const CHECKS = [
  {
    id: 'early_access',
    name: 'Early Access Disclaimer',
    premium: false,
    check: (text) => {
      if (text.toLowerCase().includes('early access')) {
        return { severity: 'warning', message: 'Early Access disclaimer detected. Ensure you have completed the Early Access questionnaire.' };
      }
      return { severity: 'pass', message: 'No Early Access issues found.' };
    }
  },
  {
    id: 'pricing',
    name: 'Pricing Information',
    premium: false,
    check: (text) => {
      const hasFree = text.toLowerCase().includes('free to play') || text.toLowerCase().includes('free-to-play');
      const hasPricing = /\$[\d,.]+/.test(text) || /€[\d,.]+/.test(text) || /£[\d,.]+/.test(text);
      if (hasFree || hasPricing) {
        return { severity: 'pass', message: 'Pricing information detected.' };
      }
      return { severity: 'warning', message: 'No clear pricing information found. Ensure your pricing is visible.' };
    }
  },
  {
    id: 'description_length',
    name: 'Description Length',
    premium: false,
    check: (text) => {
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount < 100) {
        return { severity: 'fail', message: `Description too short (${wordCount} words). Aim for at least 150-300 words.` };
      }
      if (wordCount < 150) {
        return { severity: 'warning', message: `Description is brief (${wordCount} words). Consider adding more detail.` };
      }
      return { severity: 'pass', message: `Good description length (${wordCount} words).` };
    }
  },
  {
    id: 'system_requirements',
    name: 'System Requirements',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const hasMinimum = lower.includes('minimum') || lower.includes('min requirements');
      const hasRecommended = lower.includes('recommended');
      const hasOS = lower.includes('windows') || lower.includes('macos') || lower.includes('linux');
      
      if (hasMinimum && hasRecommended && hasOS) {
        return { severity: 'pass', message: 'System requirements appear complete with minimum and recommended specs.' };
      }
      if (hasMinimum || hasOS) {
        return { severity: 'warning', message: 'Partial system requirements detected. Consider adding both minimum and recommended specs.' };
      }
      return { severity: 'fail', message: 'No system requirements detected. Steam requires these for all games.' };
    }
  },
  {
    id: 'mature_content',
    name: 'Mature Content Disclosure',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const matureKeywords = ['violence', 'blood', 'gore', 'nudity', 'sexual', 'drug', 'alcohol', 'mature'];
      const disclosureKeywords = ['content warning', 'mature content', 'contains', 'includes'];
      
      const hasMatureContent = matureKeywords.some(kw => lower.includes(kw));
      const hasDisclosure = disclosureKeywords.some(kw => lower.includes(kw));
      
      if (hasMatureContent && !hasDisclosure) {
        return { severity: 'warning', message: 'Potentially mature content detected without explicit disclosure. Consider adding content warnings.' };
      }
      if (hasMatureContent && hasDisclosure) {
        return { severity: 'pass', message: 'Mature content appears to be properly disclosed.' };
      }
      return { severity: 'pass', message: 'No obvious mature content flags detected.' };
    }
  },
  {
    id: 'multiplayer_info',
    name: 'Multiplayer Details',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const hasMultiplayer = lower.includes('multiplayer') || lower.includes('co-op') || lower.includes('coop') || lower.includes('online');
      const hasPlayerCount = /\d+\s*(-|to)\s*\d+\s*players?/i.test(text) || /\d+\s*players?/i.test(text);
      
      if (hasMultiplayer && !hasPlayerCount) {
        return { severity: 'warning', message: 'Multiplayer mentioned but player count not specified. Add supported player counts.' };
      }
      if (hasMultiplayer && hasPlayerCount) {
        return { severity: 'pass', message: 'Multiplayer features and player count documented.' };
      }
      return { severity: 'pass', message: 'Single-player focus detected (no multiplayer review needed).' };
    }
  },
  {
    id: 'language_support',
    name: 'Language Support',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const hasLanguages = lower.includes('language') || lower.includes('subtitles') || lower.includes('localization');
      const specificLangs = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'russian'];
      const langCount = specificLangs.filter(lang => lower.includes(lang)).length;
      
      if (langCount >= 3) {
        return { severity: 'pass', message: `Multiple languages detected (${langCount}). Good localization coverage.` };
      }
      if (hasLanguages || langCount > 0) {
        return { severity: 'warning', message: 'Limited language information. Consider listing all supported languages.' };
      }
      return { severity: 'warning', message: 'No language support information found. Steam recommends listing supported languages.' };
    }
  },
  {
    id: 'legal_disclaimers',
    name: 'Legal & Copyright',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const hasCopyright = lower.includes('©') || lower.includes('copyright') || lower.includes('all rights reserved');
      const hasTrademark = lower.includes('™') || lower.includes('®') || lower.includes('trademark');
      
      if (hasCopyright || hasTrademark) {
        return { severity: 'pass', message: 'Legal disclaimers detected.' };
      }
      return { severity: 'warning', message: 'No copyright or trademark notices found. Consider adding legal disclaimers.' };
    }
  }
];

// =======================
// RUN CHECKS
// =======================
function runCheck() {
  const url = document.getElementById('steamUrl').value.trim();
  const text = document.getElementById('steamText').value.trim();
  const output = document.getElementById('output');
  const summaryBar = document.getElementById('summaryBar');

  if (!url && !text) {
    output.innerHTML = '<div class="result warning"><strong>Input Required</strong>Please enter a Steam URL or paste your store page text.</div>';
    summaryBar.innerHTML = '';
    return;
  }

  // Use URL placeholder text if URL provided but no text
  const contentToCheck = text || `[URL provided: ${url}] — For full analysis, paste your store page text.`;
  
  const unlocked = window.SteamCheck?.isUnlocked() || false;
  const results = [];
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  let lockedCount = 0;

  // Run each check
  CHECKS.forEach(check => {
    if (check.premium && !unlocked) {
      lockedCount++;
      results.push({
        id: check.id,
        name: check.name,
        locked: true,
        severity: 'locked',
        message: 'Unlock premium checks to see this result.'
      });
    } else {
      const result = check.check(contentToCheck);
      results.push({
        id: check.id,
        name: check.name,
        locked: false,
        ...result
      });

      if (result.severity === 'pass') passCount++;
      else if (result.severity === 'warning') warningCount++;
      else if (result.severity === 'fail') failCount++;
    }
  });

  // Render results
  output.innerHTML = results.map(r => {
    if (r.locked) {
      return `
        <div class="result locked">
          <strong>🔒 ${r.name}</strong>
          <span class="locked-message">${r.message}</span>
        </div>
      `;
    }
    
    const severityClass = r.severity;
    const icon = r.severity === 'pass' ? '✓' : r.severity === 'warning' ? '⚠' : '✗';
    return `
      <div class="result ${severityClass}">
        <strong>${icon} ${r.name}</strong>
        ${r.message}
      </div>
    `;
  }).join('');

  // Render summary bar
  let summaryHTML = '';
  if (passCount > 0) summaryHTML += `<span class="summary-pass">${passCount} Passed</span>`;
  if (warningCount > 0) summaryHTML += `<span class="summary-warning">${warningCount} Warnings</span>`;
  if (failCount > 0) summaryHTML += `<span class="summary-fail">${failCount} Failed</span>`;
  if (lockedCount > 0) summaryHTML += `<span class="summary-locked">${lockedCount} Locked</span>`;
  
  summaryBar.innerHTML = summaryHTML;
}

// =======================
// COPY RESULTS
// =======================
function copyResults() {
  const output = document.getElementById('output');
  if (!output.textContent || output.textContent === 'No checks run yet.') {
    alert('Run a check first before copying results.');
    return;
  }

  // Build plain text version
  const results = output.querySelectorAll('.result');
  let textContent = 'Steam Page Check Results\n========================\n\n';
  
  results.forEach(result => {
    const title = result.querySelector('strong')?.textContent || '';
    const message = result.textContent.replace(title, '').trim();
    textContent += `${title}\n${message}\n\n`;
  });

  navigator.clipboard.writeText(textContent).then(() => {
    alert('Results copied to clipboard!');
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Failed to copy results. Please try selecting and copying manually.');
  });
}

// =======================
// LOAD SAMPLE
// =======================
function loadSample() {
  const sampleText = `About This Game

Welcome to Pixel Quest Adventures - an epic retro-style platformer that combines classic gameplay with modern design! 

Explore vast worlds filled with challenging puzzles, dangerous enemies, and hidden secrets. Master unique abilities as you journey through forests, caves, deserts, and ancient temples.

Features:
- 50+ handcrafted levels across 5 unique worlds
- Tight, responsive controls perfected for speedrunning
- Original chiptune soundtrack with 20 tracks
- Local co-op multiplayer for 2-4 players
- Steam achievements and leaderboards

System Requirements

Minimum:
- OS: Windows 10
- Processor: Intel Core i3 or equivalent
- Memory: 4 GB RAM
- Graphics: Integrated graphics
- Storage: 500 MB available space

Recommended:
- OS: Windows 10/11
- Processor: Intel Core i5 or equivalent  
- Memory: 8 GB RAM
- Graphics: Dedicated GPU with 2GB VRAM
- Storage: 500 MB available space

Languages Supported: English, Spanish, French, German, Japanese, Chinese (Simplified)

© 2024 Pixel Quest Studios. All rights reserved. Pixel Quest Adventures is a trademark of Pixel Quest Studios.`;

  document.getElementById('steamText').value = sampleText;
  document.getElementById('steamUrl').value = '';
  runCheck();
}

// =======================
// TOGGLE THEME (LIGHT/DARK)
// =======================
function toggleTheme() {
  document.body.classList.toggle('light');
  
  // Persist preference
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('steamcheck_theme', isLight ? 'light' : 'dark');
}

function loadThemePreference() {
  const saved = localStorage.getItem('steamcheck_theme');
  if (saved === 'light') {
    document.body.classList.add('light');
  }
}

// =======================
// DOM READY - WIRE UP BUTTONS
// =======================
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme preference
  loadThemePreference();

  // Wire up button event listeners
  const runCheckBtn = document.getElementById('runCheckBtn');
  const copyResultsBtn = document.getElementById('copyResultsBtn');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');

  if (runCheckBtn) runCheckBtn.addEventListener('click', runCheck);
  if (copyResultsBtn) copyResultsBtn.addEventListener('click', copyResults);
  if (loadSampleBtn) loadSampleBtn.addEventListener('click', loadSample);
  if (toggleThemeBtn) toggleThemeBtn.addEventListener('click', toggleTheme);

  // Listen for unlock state changes to re-run checks if results are showing
  window.addEventListener('unlockStateChanged', (e) => {
    const output = document.getElementById('output');
    if (output && output.textContent !== 'No checks run yet.') {
      runCheck(); // Re-run to show unlocked results
    }
  });
});
