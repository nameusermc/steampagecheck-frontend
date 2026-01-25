// =========================================
// STEAM PAGE CHECK - MAIN LOGIC
// =========================================

// Check definitions
var CHECKS = [
  {
    id: 'early_access',
    name: 'Early Access Disclaimer',
    premium: false,
    check: function(text) {
      if (text.toLowerCase().indexOf('early access') !== -1) {
        return { severity: 'warning', message: 'Early Access disclaimer detected. Ensure you have completed the Early Access questionnaire.' };
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
      var hasFree = lower.indexOf('free to play') !== -1 || lower.indexOf('free-to-play') !== -1;
      var hasPrice = /\$[\d,.]+|€[\d,.]+|£[\d,.]+/.test(text);
      if (hasFree || hasPrice) {
        return { severity: 'pass', message: 'Pricing information detected.' };
      }
      return { severity: 'warning', message: 'No clear pricing information found. Ensure your pricing is visible.' };
    }
  },
  {
    id: 'description_length',
    name: 'Description Length',
    premium: false,
    check: function(text) {
      var wordCount = text.trim().split(/\s+/).length;
      if (wordCount < 100) {
        return { severity: 'fail', message: 'Description too short (' + wordCount + ' words). Aim for at least 150-300 words.' };
      }
      if (wordCount < 150) {
        return { severity: 'warning', message: 'Description is brief (' + wordCount + ' words). Consider adding more detail.' };
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
      var hasMin = lower.indexOf('minimum') !== -1;
      var hasRec = lower.indexOf('recommended') !== -1;
      var hasOS = /windows|macos|linux/i.test(text);
      if (hasMin && hasRec && hasOS) {
        return { severity: 'pass', message: 'System requirements appear complete with minimum and recommended specs.' };
      }
      if (hasMin || hasOS) {
        return { severity: 'warning', message: 'Partial system requirements detected. Consider adding both minimum and recommended specs.' };
      }
      return { severity: 'fail', message: 'No system requirements detected. Steam requires these for all games.' };
    }
  },
  {
    id: 'mature_content',
    name: 'Mature Content Disclosure',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      var mature = ['violence', 'blood', 'gore', 'nudity', 'sexual', 'drug', 'alcohol', 'mature'];
      var disclosure = ['content warning', 'mature content', 'contains', 'includes'];
      var hasMature = mature.some(function(k) { return lower.indexOf(k) !== -1; });
      var hasDisc = disclosure.some(function(k) { return lower.indexOf(k) !== -1; });
      if (hasMature && !hasDisc) {
        return { severity: 'warning', message: 'Potentially mature content detected without explicit disclosure.' };
      }
      if (hasMature && hasDisc) {
        return { severity: 'pass', message: 'Mature content appears to be properly disclosed.' };
      }
      return { severity: 'pass', message: 'No obvious mature content flags detected.' };
    }
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer Details',
    premium: true,
    check: function(text) {
      var hasMP = /multiplayer|co-op|coop|online/i.test(text);
      var hasCount = /\d+\s*(-|to)\s*\d+\s*players?|\d+\s*players?/i.test(text);
      if (hasMP && !hasCount) {
        return { severity: 'warning', message: 'Multiplayer mentioned but player count not specified.' };
      }
      if (hasMP && hasCount) {
        return { severity: 'pass', message: 'Multiplayer features and player count documented.' };
      }
      return { severity: 'pass', message: 'Single-player focus detected.' };
    }
  },
  {
    id: 'language',
    name: 'Language Support',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      var langs = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'russian'];
      var count = langs.filter(function(l) { return lower.indexOf(l) !== -1; }).length;
      if (count >= 3) {
        return { severity: 'pass', message: 'Multiple languages detected (' + count + '). Good localization.' };
      }
      if (count > 0) {
        return { severity: 'warning', message: 'Limited language info. Consider listing all supported languages.' };
      }
      return { severity: 'warning', message: 'No language support info found.' };
    }
  },
  {
    id: 'legal',
    name: 'Legal & Copyright',
    premium: true,
    check: function(text) {
      var hasCopy = /©|copyright|all rights reserved/i.test(text);
      var hasTM = /™|®|trademark/i.test(text);
      if (hasCopy || hasTM) {
        return { severity: 'pass', message: 'Legal disclaimers detected.' };
      }
      return { severity: 'warning', message: 'No copyright notices found. Consider adding legal disclaimers.' };
    }
  }
];

// =========================================
// HELPER: Check if unlocked
// =========================================
function isUnlocked() {
  return localStorage.getItem('steamcheck_unlocked') === 'true';
}

// =========================================
// RUN CHECK - called by onclick
// =========================================
function runCheck() {
  var url = document.getElementById('steamUrl').value.trim();
  var text = document.getElementById('steamText').value.trim();
  var output = document.getElementById('output');
  var summaryBar = document.getElementById('summaryBar');

  if (!url && !text) {
    output.innerHTML = '<div class="result warning"><strong>⚠ Input Required</strong> Please enter a Steam URL or paste your store page text.</div>';
    summaryBar.innerHTML = '';
    return;
  }

  var content = text || '[URL provided: ' + url + ']';
  var unlocked = isUnlocked();
  
  var passCount = 0, warnCount = 0, failCount = 0, lockCount = 0;
  var html = '';

  for (var i = 0; i < CHECKS.length; i++) {
    var c = CHECKS[i];
    
    if (c.premium && !unlocked) {
      lockCount++;
      html += '<div class="result locked"><strong>🔒 ' + c.name + '</strong><span class="locked-message">Unlock premium to see this result.</span></div>';
    } else {
      var r = c.check(content);
      if (r.severity === 'pass') passCount++;
      else if (r.severity === 'warning') warnCount++;
      else if (r.severity === 'fail') failCount++;
      
      var icon = r.severity === 'pass' ? '✓' : (r.severity === 'warning' ? '⚠' : '✗');
      html += '<div class="result ' + r.severity + '"><strong>' + icon + ' ' + c.name + '</strong> ' + r.message + '</div>';
    }
  }

  output.innerHTML = html;

  var summary = '';
  if (passCount > 0) summary += '<span class="summary-pass">' + passCount + ' Passed</span>';
  if (warnCount > 0) summary += '<span class="summary-warning">' + warnCount + ' Warnings</span>';
  if (failCount > 0) summary += '<span class="summary-fail">' + failCount + ' Failed</span>';
  if (lockCount > 0) summary += '<span class="summary-locked">' + lockCount + ' Locked</span>';
  summaryBar.innerHTML = summary;
}

// =========================================
// COPY RESULTS - called by onclick
// =========================================
function copyResults() {
  var output = document.getElementById('output');
  var text = output ? output.innerText : '';
  
  if (!text || text === 'No checks run yet.') {
    alert('Run a check first before copying results.');
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText('Steam Page Check Results\n\n' + text).then(function() {
      alert('Results copied to clipboard!');
    });
  } else {
    alert('Clipboard not available.');
  }
}

// =========================================
// LOAD SAMPLE - called by onclick
// =========================================
function loadSample() {
  var sample = 'About This Game\n\nWelcome to Pixel Quest Adventures - an epic retro-style platformer!\n\nExplore vast worlds filled with challenging puzzles, dangerous enemies, and hidden secrets.\n\nFeatures:\n- 50+ handcrafted levels across 5 unique worlds\n- Tight, responsive controls\n- Original chiptune soundtrack\n- Local co-op multiplayer for 2-4 players\n- Steam achievements and leaderboards\n\nSystem Requirements\n\nMinimum:\n- OS: Windows 10\n- Processor: Intel Core i3\n- Memory: 4 GB RAM\n- Storage: 500 MB\n\nRecommended:\n- OS: Windows 10/11\n- Processor: Intel Core i5\n- Memory: 8 GB RAM\n- Graphics: Dedicated GPU\n\nLanguages: English, Spanish, French, German, Japanese, Chinese\n\n© 2024 Pixel Quest Studios. All rights reserved.';
  
  document.getElementById('steamText').value = sample;
  document.getElementById('steamUrl').value = '';
  runCheck();
}

// =========================================
// TOGGLE THEME - called by onclick
// =========================================
function toggleTheme() {
  document.body.classList.toggle('light');
  var isLight = document.body.classList.contains('light');
  localStorage.setItem('steamcheck_theme', isLight ? 'light' : 'dark');
}

// =========================================
// LOAD THEME ON STARTUP
// =========================================
(function() {
  if (localStorage.getItem('steamcheck_theme') === 'light') {
    document.body.classList.add('light');
  }
})();
