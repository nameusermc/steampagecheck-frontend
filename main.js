// =======================
// STEAM PAGE CHECK - MAIN LOGIC
// =======================

// Check definitions - free and premium
var CHECKS = [
  {
    id: 'early_access',
    name: 'Early Access Disclaimer',
    premium: false,
    check: function(text) {
      var lower = text.toLowerCase();
      if (lower.indexOf('early access') !== -1) {
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
    check: function(text) {
      var lower = text.toLowerCase();
      var hasFreeToPlay = lower.indexOf('free to play') !== -1 || lower.indexOf('free-to-play') !== -1;
      var hasPriceTag = /\$[\d,.]+|€[\d,.]+|£[\d,.]+/.test(text);
      
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
    check: function(text) {
      var words = text.trim().split(/\s+/);
      var wordCount = words.length;
      
      if (wordCount < 100) {
        return {
          severity: 'fail',
          message: 'Description too short (' + wordCount + ' words). Aim for at least 150-300 words.'
        };
      }
      if (wordCount < 150) {
        return {
          severity: 'warning',
          message: 'Description is brief (' + wordCount + ' words). Consider adding more detail.'
        };
      }
      return { severity: 'pass', message: 'Good description length (' + wordCount + ' words).' };
    }
  },
  {
    id: 'system_requirements',
    name: 'System Requirements',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      var hasMinimum = lower.indexOf('minimum') !== -1;
      var hasRecommended = lower.indexOf('recommended') !== -1;
      var hasOS = /windows|macos|linux/i.test(text);
      
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
    check: function(text) {
      var lower = text.toLowerCase();
      var matureKeywords = ['violence', 'blood', 'gore', 'nudity', 'sexual', 'drug', 'alcohol', 'mature'];
      var disclosureKeywords = ['content warning', 'mature content', 'contains', 'includes'];
      
      var hasMatureContent = matureKeywords.some(function(kw) { return lower.indexOf(kw) !== -1; });
      var hasDisclosure = disclosureKeywords.some(function(kw) { return lower.indexOf(kw) !== -1; });
      
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
    check: function(text) {
      var hasMultiplayer = /multiplayer|co-op|coop|online/i.test(text);
      var hasPlayerCount = /\d+\s*(-|to)\s*\d+\s*players?|\d+\s*players?/i.test(text);
      
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
    check: function(text) {
      var lower = text.toLowerCase();
      var languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'russian'];
      var detectedCount = languages.filter(function(lang) { return lower.indexOf(lang) !== -1; }).length;
      
      if (detectedCount >= 3) {
        return {
          severity: 'pass',
          message: 'Multiple languages detected (' + detectedCount + '). Good localization coverage.'
        };
      }
      if (detectedCount > 0) {
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
    check: function(text) {
      var hasCopyright = /©|copyright|all rights reserved/i.test(text);
      var hasTrademark = /™|®|trademark/i.test(text);
      
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
// HELPER FUNCTIONS
// =========================================

function isUnlocked() {
  if (window.SteamCheck && window.SteamCheck.isUnlocked) {
    return window.SteamCheck.isUnlocked();
  }
  return localStorage.getItem('steamcheck_unlocked') === 'true';
}

function updateLockedFeatures() {
  var unlocked = isUnlocked();
  var elements = document.querySelectorAll('.locked-feature');
  
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if (unlocked) {
      el.classList.remove('disabled');
      el.removeAttribute('disabled');
    } else {
      el.classList.add('disabled');
      el.setAttribute('disabled', 'true');
    }
  }
}

// =========================================
// MAIN FUNCTIONS
// =========================================

function runCheck() {
  console.log('[Main] runCheck() called');
  
  var urlInput = document.getElementById('steamUrl');
  var textInput = document.getElementById('steamText');
  var output = document.getElementById('output');
  var summaryBar = document.getElementById('summaryBar');

  var url = urlInput ? urlInput.value.trim() : '';
  var text = textInput ? textInput.value.trim() : '';

  if (!url && !text) {
    output.innerHTML = '<div class="result warning"><strong>⚠ Input Required</strong>Please enter a Steam URL or paste your store page text.</div>';
    summaryBar.innerHTML = '';
    return;
  }

  var contentToCheck = text || '[URL provided: ' + url + '] — For full analysis, paste your store page text.';
  var unlocked = isUnlocked();
  
  console.log('[Main] Running checks - unlocked: ' + unlocked);

  var passCount = 0;
  var warningCount = 0;
  var failCount = 0;
  var lockedCount = 0;
  var results = [];

  for (var i = 0; i < CHECKS.length; i++) {
    var checkDef = CHECKS[i];
    
    if (checkDef.premium && !unlocked) {
      lockedCount++;
      results.push({
        name: checkDef.name,
        locked: true,
        severity: 'locked',
        message: 'Unlock premium checks to see this result.'
      });
    } else {
      var result = checkDef.check(contentToCheck);
      if (result.severity === 'pass') passCount++;
      else if (result.severity === 'warning') warningCount++;
      else if (result.severity === 'fail') failCount++;
      
      results.push({
        name: checkDef.name,
        locked: false,
        severity: result.severity,
        message: result.message
      });
    }
  }

  console.log('[Main] Results - pass: ' + passCount + ', warning: ' + warningCount + ', fail: ' + failCount + ', locked: ' + lockedCount);

  // Render results
  var html = '';
  for (var j = 0; j < results.length; j++) {
    var r = results[j];
    if (r.locked) {
      html += '<div class="result locked"><strong>🔒 ' + r.name + '</strong><span class="locked-message">' + r.message + '</span></div>';
    } else {
      var icon = r.severity === 'pass' ? '✓' : (r.severity === 'warning' ? '⚠' : '✗');
      html += '<div class="result ' + r.severity + '"><strong>' + icon + ' ' + r.name + '</strong>' + r.message + '</div>';
    }
  }
  output.innerHTML = html;

  // Render summary
  var summaryHTML = '';
  if (passCount > 0) summaryHTML += '<span class="summary-pass">' + passCount + ' Passed</span>';
  if (warningCount > 0) summaryHTML += '<span class="summary-warning">' + warningCount + ' Warnings</span>';
  if (failCount > 0) summaryHTML += '<span class="summary-fail">' + failCount + ' Failed</span>';
  if (lockedCount > 0) summaryHTML += '<span class="summary-locked">' + lockedCount + ' Locked</span>';
  summaryBar.innerHTML = summaryHTML;
}

function copyResults() {
  console.log('[Main] copyResults() called');
  
  var output = document.getElementById('output');
  var outputText = output ? output.textContent.trim() : '';
  
  if (!outputText || outputText === 'No checks run yet.') {
    alert('Run a check first before copying results.');
    return;
  }

  var results = output.querySelectorAll('.result');
  var lines = ['Steam Page Check Results', '========================', ''];
  
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    var title = result.querySelector('strong');
    var titleText = title ? title.textContent : '';
    var message = result.textContent.replace(titleText, '').trim();
    lines.push(titleText);
    lines.push(message);
    lines.push('');
  }

  var textContent = lines.join('\n');

  navigator.clipboard.writeText(textContent).then(function() {
    console.log('[Main] Results copied');
    alert('Results copied to clipboard!');
  }).catch(function(err) {
    console.error('[Main] Copy failed:', err);
    alert('Failed to copy results.');
  });
}

function loadSample() {
  console.log('[Main] loadSample() called');
  
  var sampleText = 'About This Game\n\nWelcome to Pixel Quest Adventures - an epic retro-style platformer that combines classic gameplay with modern design!\n\nExplore vast worlds filled with challenging puzzles, dangerous enemies, and hidden secrets. Master unique abilities as you journey through forests, caves, deserts, and ancient temples.\n\nFeatures:\n- 50+ handcrafted levels across 5 unique worlds\n- Tight, responsive controls perfected for speedrunning\n- Original chiptune soundtrack with 20 tracks\n- Local co-op multiplayer for 2-4 players\n- Steam achievements and leaderboards\n\nSystem Requirements\n\nMinimum:\n- OS: Windows 10\n- Processor: Intel Core i3 or equivalent\n- Memory: 4 GB RAM\n- Graphics: Integrated graphics\n- Storage: 500 MB available space\n\nRecommended:\n- OS: Windows 10/11\n- Processor: Intel Core i5 or equivalent\n- Memory: 8 GB RAM\n- Graphics: Dedicated GPU with 2GB VRAM\n- Storage: 500 MB available space\n\nLanguages Supported: English, Spanish, French, German, Japanese, Chinese (Simplified)\n\n© 2024 Pixel Quest Studios. All rights reserved. Pixel Quest Adventures is a trademark of Pixel Quest Studios.';

  var urlInput = document.getElementById('steamUrl');
  var textInput = document.getElementById('steamText');
  
  if (textInput) textInput.value = sampleText;
  if (urlInput) urlInput.value = '';
  
  runCheck();
}

function toggleTheme() {
  console.log('[Main] toggleTheme() called');
  
  document.body.classList.toggle('light');
  
  var isLight = document.body.classList.contains('light');
  localStorage.setItem('steamcheck_theme', isLight ? 'light' : 'dark');
  
  console.log('[Main] Theme: ' + (isLight ? 'light' : 'dark'));
}

function loadThemePreference() {
  var saved = localStorage.getItem('steamcheck_theme');
  if (saved === 'light') {
    document.body.classList.add('light');
  }
}

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('[Main] DOM ready');
  
  loadThemePreference();
  updateLockedFeatures();

  var runCheckBtn = document.getElementById('runCheckBtn');
  var copyResultsBtn = document.getElementById('copyResultsBtn');
  var loadSampleBtn = document.getElementById('loadSampleBtn');
  var toggleThemeBtn = document.getElementById('toggleThemeBtn');

  if (runCheckBtn) {
    runCheckBtn.addEventListener('click', runCheck);
    console.log('[Main] Run Check button ready');
  }
  
  if (copyResultsBtn) {
    copyResultsBtn.addEventListener('click', copyResults);
    console.log('[Main] Copy Results button ready');
  }
  
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', loadSample);
    console.log('[Main] Load Sample button ready');
  }
  
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', toggleTheme);
    console.log('[Main] Toggle Theme button ready');
  }

  window.addEventListener('unlockStateChanged', function(event) {
    console.log('[Main] Unlock state changed');
    updateLockedFeatures();
    
    var output = document.getElementById('output');
    if (output && output.textContent !== 'No checks run yet.') {
      runCheck();
    }
  });

  console.log('[Main] Init complete');
});
