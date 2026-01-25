// =======================
// STEAM PAGE CHECK - MAIN LOGIC
// =======================

'use strict';

// =========================================
// CHECK DEFINITIONS
// Free checks (premium: false) run for all users
// Premium checks (premium: true) require unlock
// =========================================

const CHECKS = [
  {
    id: 'early_access',
    name: 'Early Access Disclaimer',
    premium: false,
    check: (text) => {
      const lower = text.toLowerCase();
      if (lower.includes('early access')) {
        return {
          severity: 'warning',
          message: 'Early Access disclaimer detected. Ensure you have completed the Early Access questionnaire.'
        };
      }
      return { severity: 'pass', message: 'No Early Access issues found.' };
    }
  },
  {
    id: 'pricing',
    name: 'Pricing Information',
    premium: false,
    check: (text) => {
      const lower = text.toLowerCase();
      const hasFreeToPlay = lower.includes('free to play') || lower.includes('free-to-play');
      const hasPriceTag = /[\$€£][\d,.]+/.test(text);
      
      if (hasFreeToPlay || hasPriceTag) {
        return { severity: 'pass', message: 'Pricing information detected.' };
      }
      return {
        severity: 'warning',
        message: 'No clear pricing information found. Ensure your pricing is visible.'
      };
    }
  },
  {
    id: 'description_length',
    name: 'Description Length',
    premium: false,
    check: (text) => {
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      
      if (wordCount < 100) {
        return {
          severity: 'fail',
          message: `Description too short (${wordCount} words). Aim for at least 150-300 words.`
        };
      }
      if (wordCount < 150) {
        return {
          severity: 'warning',
          message: `Description is brief (${wordCount} words). Consider adding more detail.`
        };
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
      const hasOS = /windows|macos|linux|steamos/i.test(text);
      
      if (hasMinimum && hasRecommended && hasOS) {
        return {
          severity: 'pass',
          message: 'System requirements appear complete with minimum and recommended specs.'
        };
      }
      if (hasMinimum || hasOS) {
        return {
          severity: 'warning',
          message: 'Partial system requirements detected. Consider adding both minimum and recommended specs.'
        };
      }
      return {
        severity: 'fail',
        message: 'No system requirements detected. Steam requires these for all games.'
      };
    }
  },
  {
    id: 'mature_content',
    name: 'Mature Content Disclosure',
    premium: true,
    check: (text) => {
      const lower = text.toLowerCase();
      const matureKeywords = ['violence', 'blood', 'gore', 'nudity', 'sexual', 'drug', 'alcohol', 'mature'];
      const disclosureKeywords = ['content warning', 'mature content', 'contains', 'includes', 'features'];
      
      const hasMatureContent = matureKeywords.some(kw => lower.includes(kw));
      const hasDisclosure = disclosureKeywords.some(kw => lower.includes(kw));
      
      if (hasMatureContent && !hasDisclosure) {
        return {
          severity: 'warning',
          message: 'Potentially mature content detected without explicit disclosure. Consider adding content warnings.'
        };
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
      const hasMultiplayer = /multiplayer|co-op|coop|online|pvp|pve/i.test(text);
      const hasPlayerCount = /\d+\s*(-|to)\s*\d+\s*players?|\d+\s*players?/i.test(text);
      
      if (hasMultiplayer && !hasPlayerCount) {
        return {
          severity: 'warning',
          message: 'Multiplayer mentioned but player count not specified. Add supported player counts.'
        };
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
      const hasLanguageSection = lower.includes('language') || lower.includes('subtitles') || lower.includes('localization');
      const languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'russian', 'italian', 'polish'];
      const detectedLangs = languages.filter(lang => lower.includes(lang));
      
      if (detectedLangs.length >= 3) {
        return {
          severity: 'pass',
          message: `Multiple languages detected (${detectedLangs.length}). Good localization coverage.`
        };
      }
      if (hasLanguageSection || detectedLangs.length > 0) {
        return {
          severity: 'warning',
          message: 'Limited language information. Consider listing all supported languages.'
        };
      }
      return {
        severity: 'warning',
        message: 'No language support information found. Steam recommends listing supported languages.'
      };
    }
  },
  {
    id: 'legal_disclaimers',
    name: 'Legal & Copyright',
    premium: true,
    check: (text) => {
      const hasCopyright = /©|copyright|\(c\)|all rights reserved/i.test(text);
      const hasTrademark = /™|®|trademark/i.test(text);
      
      if (hasCopyright || hasTrademark) {
        return { severity: 'pass', message: 'Legal disclaimers detected.' };
      }
      return {
        severity: 'warning',
        message: 'No copyright or trademark notices found. Consider adding legal disclaimers.'
      };
    }
  }
];


// =========================================
// UNLOCK STATE HELPER
// Reads from localStorage via window.SteamCheck API
// =========================================

function isUnlocked() {
  // Use the global API exposed by index.html, fallback to direct localStorage check
  if (window.SteamCheck?.isUnlocked) {
    return window.SteamCheck.isUnlocked();
  }
  return localStorage.getItem('steamcheck_unlocked') === 'true';
}


// =========================================
// UPDATE LOCKED FEATURE ELEMENTS
// Elements with .locked-feature class are disabled when locked
// =========================================

function updateLockedFeatures() {
  const unlocked = isUnlocked();
  const lockedElements = document.querySelectorAll('.locked-feature');
  
  console.log(`[Main] updateLockedFeatures() - unlocked: ${unlocked}, elements: ${lockedElements.length}`);
  
  lockedElements.forEach(el => {
    if (unlocked) {
      el.classList.remove('disabled');
      el.removeAttribute('disabled');
      el.setAttribute('aria-disabled', 'false');
    } else {
      el.classList.add('disabled');
      el.setAttribute('disabled', 'true');
      el.setAttribute('aria-disabled', 'true');
    }
  });
}


// =========================================
// RUN CHECKS
// =========================================

function runCheck() {
  console.log('[Main] runCheck() called');
  
  const urlInput = document.getElementById('steamUrl');
  const textInput = document.getElementById('steamText');
  const output = document.getElementById('output');
  const summaryBar = document.getElementById('summaryBar');

  const url = urlInput?.value.trim() || '';
  const text = textInput?.value.trim() || '';

  // Validate input
  if (!url && !text) {
    console.log('[Main] No input provided');
    output.innerHTML = `
      <div class="result warning">
        <strong>⚠ Input Required</strong>
        Please enter a Steam URL or paste your store page text.
      </div>
    `;
    summaryBar.innerHTML = '';
    return;
  }

  // Determine content to analyze
  const contentToCheck = text || `[URL provided: ${url}] — For full analysis, paste your store page text.`;
  const unlocked = isUnlocked();
  
  console.log(`[Main] Running checks - unlocked: ${unlocked}, content length: ${contentToCheck.length}`);

  // Initialize counters
  const counts = { pass: 0, warning: 0, fail: 0, locked: 0 };
  const results = [];

  // Execute each check
  CHECKS.forEach(({ id, name, premium, check }) => {
    if (premium && !unlocked) {
      counts.locked++;
      results.push({
        id,
        name,
        locked: true,
        severity: 'locked',
        message: 'Unlock premium checks to see this result.'
      });
    } else {
      const result = check(contentToCheck);
      counts[result.severity]++;
      results.push({
        id,
        name,
        locked: false,
        ...result
      });
    }
  });

  console.log('[Main] Check results:', counts);

  // Render results
  output.innerHTML = results.map(({ name, locked, severity, message }) => {
    if (locked) {
      return `
        <div class="result locked">
          <strong>🔒 ${name}</strong>
          <span class="locked-message">${message}</span>
        </div>
      `;
    }
    
    const icons = { pass: '✓', warning: '⚠', fail: '✗' };
    const icon = icons[severity] || '•';
    
    return `
      <div class="result ${severity}">
        <strong>${icon} ${name}</strong>
        ${message}
      </div>
    `;
  }).join('');

  // Render summary bar
  const summaryParts = [];
  if (counts.pass > 0) summaryParts.push(`<span class="summary-pass">${counts.pass} Passed</span>`);
  if (counts.warning > 0) summaryParts.push(`<span class="summary-warning">${counts.warning} Warnings</span>`);
  if (counts.fail > 0) summaryParts.push(`<span class="summary-fail">${counts.fail} Failed</span>`);
  if (counts.locked > 0) summaryParts.push(`<span class="summary-locked">${counts.locked} Locked</span>`);
  
  summaryBar.innerHTML = summaryParts.join('');
}


// =========================================
// COPY RESULTS TO CLIPBOARD
// =========================================

function copyResults() {
  console.log('[Main] copyResults() called');
  
  const output = document.getElementById('output');
  const outputText = output?.textContent?.trim() || '';
  
  if (!outputText || outputText === 'No checks run yet.') {
    alert('Run a check first before copying results.');
    return;
  }

  // Build formatted plain text
  const results = output.querySelectorAll('.result');
  const lines = ['Steam Page Check Results', '========================', ''];
  
  results.forEach(result => {
    const title = result.querySelector('strong')?.textContent || '';
    const message = result.textContent.replace(title, '').trim();
    lines.push(title, message, '');
  });

  const textContent = lines.join('\n');

  navigator.clipboard.writeText(textContent)
    .then(() => {
      console.log('[Main] Results copied to clipboard');
      alert('Results copied to clipboard!');
    })
    .catch(err => {
      console.error('[Main] Copy failed:', err);
      alert('Failed to copy results. Please try selecting and copying manually.');
    });
}


// =========================================
// LOAD SAMPLE DATA
// =========================================

function loadSample() {
  console.log('[Main] loadSample() called');
  
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

  const urlInput = document.getElementById('steamUrl');
  const textInput = document.getElementById('steamText');
  
  if (textInput) textInput.value = sampleText;
  if (urlInput) urlInput.value = '';
  
  runCheck();
}


// =========================================
// TOGGLE LIGHT/DARK THEME
// =========================================

function toggleTheme() {
  console.log('[Main] toggleTheme() called');
  
  document.body.classList.toggle('light');
  
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('steamcheck_theme', isLight ? 'light' : 'dark');
  
  console.log(`[Main] Theme set to: ${isLight ? 'light' : 'dark'}`);
}

function loadThemePreference() {
  const saved = localStorage.getItem('steamcheck_theme');
  console.log(`[Main] Loading theme preference: ${saved || 'default (dark)'}`);
  
  if (saved === 'light') {
    document.body.classList.add('light');
  }
}


// =========================================
// DOM READY - INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Main] DOM ready, initializing...');
  
  // Load saved theme preference
  loadThemePreference();
  
  // Update any locked feature elements
  updateLockedFeatures();

  // Get button references
  const buttons = {
    runCheck: document.getElementById('runCheckBtn'),
    copyResults: document.getElementById('copyResultsBtn'),
    loadSample: document.getElementById('loadSampleBtn'),
    toggleTheme: document.getElementById('toggleThemeBtn')
  };

  // Wire up event listeners
  if (buttons.runCheck) {
    buttons.runCheck.addEventListener('click', runCheck);
    console.log('[Main] Run Check button wired');
  }
  
  if (buttons.copyResults) {
    buttons.copyResults.addEventListener('click', copyResults);
    console.log('[Main] Copy Results button wired');
  }
  
  if (buttons.loadSample) {
    buttons.loadSample.addEventListener('click', loadSample);
    console.log('[Main] Load Sample button wired');
  }
  
  if (buttons.toggleTheme) {
    buttons.toggleTheme.addEventListener('click', toggleTheme);
    console.log('[Main] Toggle Theme button wired');
  }

  // Listen for unlock state changes from index.html
  window.addEventListener('unlockStateChanged', (event) => {
    console.log('[Main] unlockStateChanged event received:', event.detail);
    
    // Update any .locked-feature elements
    updateLockedFeatures();
    
    // Re-run checks if results are currently displayed
    const output = document.getElementById('output');
    if (output && output.textContent !== 'No checks run yet.') {
      console.log('[Main] Re-running checks after unlock');
      runCheck();
    }
  });

  console.log('[Main] ✓ Initialization complete');
});
