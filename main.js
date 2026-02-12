// =========================================
// STEAM PAGE CHECK - MAIN LOGIC
// 10 Checks (3 Free, 7 Premium)
// Based on actual Steam store page rejection reasons
// =========================================

// Check definitions - ordered by importance
var CHECKS = [

  // =====================
  // FREE CHECKS (3)
  // =====================

  {
    id: 'early_access',
    name: 'Early Access Compliance',
    premium: false,
    check: function(text) {
      var lower = text.toLowerCase();
      
      // Check if this is an Early Access title
      var isEarlyAccess = lower.indexOf('early access') !== -1 || 
                          lower.indexOf('in development') !== -1 ||
                          lower.indexOf('work in progress') !== -1;
      
      if (!isEarlyAccess) {
        return { 
          severity: 'pass', 
          message: 'No Early Access indicators detected. If this IS an Early Access title, make sure to clearly label it.' 
        };
      }
      
      // Steam requires answers to these 6 questions for EA titles:
      // 1. Why Early Access?
      // 2. How long in EA?
      // 3. Current state?
      // 4. Planned features?
      // 5. Pricing strategy?
      // 6. How community helps?
      
      var hasWhyEA = lower.indexOf('why') !== -1 && lower.indexOf('early access') !== -1;
      var hasTimeline = /\d+\s*(month|year|week)/i.test(text) || 
                        lower.indexOf('roadmap') !== -1 ||
                        lower.indexOf('planned') !== -1 ||
                        lower.indexOf('timeline') !== -1;
      var hasCurrentState = lower.indexOf('current') !== -1 || 
                            lower.indexOf('currently') !== -1 ||
                            lower.indexOf('right now') !== -1 ||
                            lower.indexOf('at this time') !== -1;
      var hasPlannedFeatures = lower.indexOf('planned') !== -1 || 
                               lower.indexOf('upcoming') !== -1 ||
                               lower.indexOf('will include') !== -1 ||
                               lower.indexOf('future') !== -1;
      var hasPricingInfo = lower.indexOf('price') !== -1 || 
                           lower.indexOf('pricing') !== -1 ||
                           /\$[\d,.]+|€[\d,.]+|£[\d,.]+/.test(text);
      var hasCommunityMention = lower.indexOf('feedback') !== -1 || 
                                lower.indexOf('community') !== -1 ||
                                lower.indexOf('discord') !== -1 ||
                                lower.indexOf('suggestions') !== -1;
      
      var score = 0;
      if (hasTimeline) score++;
      if (hasCurrentState) score++;
      if (hasPlannedFeatures) score++;
      if (hasPricingInfo) score++;
      if (hasCommunityMention) score++;
      
      if (score >= 4) {
        return { 
          severity: 'pass', 
          message: 'Early Access title with good disclosure. Found timeline, current state, and community info.' 
        };
      }
      
      if (score >= 2) {
        return { 
          severity: 'warning', 
          message: 'Early Access detected but missing some required info. Steam requires: development timeline, current state description, planned features, pricing strategy, and how players can help.' 
        };
      }
      
      return { 
        severity: 'fail', 
        message: 'Early Access detected WITHOUT proper disclosures. Steam REQUIRES you to answer: Why Early Access? How long? Current state? Planned features? Pricing? How can community help? Missing these commonly causes rejection.' 
      };
    }
  },

  {
    id: 'description_quality',
    name: 'Description Quality',
    premium: false,
    check: function(text) {
      var wordCount = text.trim().split(/\s+/).length;
      var lower = text.toLowerCase();
      
      // Check for key elements of a good description
      var hasFeatures = lower.indexOf('feature') !== -1 || 
                        /[-•]\s*.+/m.test(text); // bullet points
      var hasGameplayDesc = lower.indexOf('play') !== -1 || 
                            lower.indexOf('gameplay') !== -1 ||
                            lower.indexOf('experience') !== -1;
      
      if (wordCount < 50) {
        return { 
          severity: 'fail', 
          message: 'Description critically short (' + wordCount + ' words). Steam reviewers flag thin descriptions. Aim for 150-300 words minimum with clear feature lists.' 
        };
      }
      
      if (wordCount < 100) {
        return { 
          severity: 'warning', 
          message: 'Description too brief (' + wordCount + ' words). Add more detail about gameplay, features, and what makes your game unique.' 
        };
      }
      
      if (wordCount < 150) {
        return { 
          severity: 'warning', 
          message: 'Description is adequate (' + wordCount + ' words) but could be stronger. Consider adding feature highlights and gameplay details.' 
        };
      }
      
      if (!hasFeatures && !hasGameplayDesc) {
        return { 
          severity: 'warning', 
          message: 'Good length (' + wordCount + ' words) but may lack clear feature descriptions. Make sure to highlight key gameplay features.' 
        };
      }
      
      return { 
        severity: 'pass', 
        message: 'Good description length (' + wordCount + ' words) with apparent feature coverage.' 
      };
    }
  },

  {
    id: 'pricing_transparency',
    name: 'Pricing Transparency',
    premium: false,
    check: function(text) {
      var lower = text.toLowerCase();
      
      // Check for various pricing models
      var hasFreeToPlay = lower.indexOf('free to play') !== -1 || 
                          lower.indexOf('free-to-play') !== -1 ||
                          lower.indexOf('f2p') !== -1;
      var hasPrice = /\$[\d,.]+|€[\d,.]+|£[\d,.]+/.test(text);
      var hasMicrotransactions = lower.indexOf('microtransaction') !== -1 ||
                                 lower.indexOf('in-app purchase') !== -1 ||
                                 lower.indexOf('in-game purchase') !== -1 ||
                                 lower.indexOf('premium currency') !== -1 ||
                                 lower.indexOf('loot box') !== -1 ||
                                 lower.indexOf('battle pass') !== -1;
      var hasDLC = lower.indexOf('dlc') !== -1 || 
                   lower.indexOf('expansion') !== -1 ||
                   lower.indexOf('season pass') !== -1;
      var hasSubscription = lower.indexOf('subscription') !== -1 ||
                            lower.indexOf('monthly') !== -1;
      
      // F2P with microtransactions needs clear disclosure
      if (hasFreeToPlay && hasMicrotransactions) {
        return { 
          severity: 'pass', 
          message: 'Free-to-play with microtransactions disclosed. Good transparency.' 
        };
      }
      
      if (hasFreeToPlay && !hasMicrotransactions) {
        return { 
          severity: 'warning', 
          message: 'Free-to-play detected. If there are ANY in-game purchases, they MUST be disclosed. Steam flags undisclosed monetization.' 
        };
      }
      
      // Check for potentially confusing language
      var confusingTerms = lower.indexOf('pay to win') !== -1 ||
                           lower.indexOf('pay-to-win') !== -1 ||
                           (lower.indexOf('free') !== -1 && hasPrice);
      
      if (confusingTerms) {
        return { 
          severity: 'warning', 
          message: 'Potentially confusing pricing language detected. Ensure monetization model is crystal clear to avoid reviewer friction.' 
        };
      }
      
      if (hasPrice || hasFreeToPlay) {
        var extras = [];
        if (hasDLC) extras.push('DLC');
        if (hasMicrotransactions) extras.push('in-game purchases');
        if (hasSubscription) extras.push('subscription');
        
        var extraMsg = extras.length > 0 ? ' Additional monetization mentioned: ' + extras.join(', ') + '.' : '';
        return { 
          severity: 'pass', 
          message: 'Pricing information detected.' + extraMsg 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'No clear pricing information found. Ensure your pricing model is visible and unambiguous.' 
      };
    }
  },

  // =====================
  // PREMIUM CHECKS (7)
  // =====================

  {
    id: 'system_requirements',
    name: 'System Requirements',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      
      var hasMinimum = lower.indexOf('minimum') !== -1;
      var hasRecommended = lower.indexOf('recommended') !== -1;
      var hasOS = /windows|macos|mac os|linux|ubuntu|steamos/i.test(text);
      var hasProcessor = /processor|cpu|intel|amd|core i|ryzen/i.test(text);
      var hasMemory = /memory|ram|\d+\s*gb/i.test(text);
      var hasStorage = /storage|disk|space|\d+\s*(gb|mb)\s*(available|required|free)/i.test(text);
      var hasGraphics = /graphics|gpu|video|nvidia|radeon|geforce|gtx|rtx/i.test(text);
      
      var specCount = 0;
      if (hasOS) specCount++;
      if (hasProcessor) specCount++;
      if (hasMemory) specCount++;
      if (hasStorage) specCount++;
      if (hasGraphics) specCount++;
      
      if (hasMinimum && hasRecommended && specCount >= 4) {
        return { 
          severity: 'pass', 
          message: 'Complete system requirements with Minimum and Recommended specs. All major categories covered.' 
        };
      }
      
      if (hasMinimum && specCount >= 3) {
        return { 
          severity: 'warning', 
          message: 'Minimum specs present but may be incomplete. Steam expects: OS, Processor, Memory, Graphics, and Storage for both Minimum AND Recommended.' 
        };
      }
      
      if (specCount >= 2) {
        return { 
          severity: 'warning', 
          message: 'Some system specs detected but missing Minimum/Recommended structure. Steam requires clearly labeled Minimum AND Recommended specifications.' 
        };
      }
      
      return { 
        severity: 'fail', 
        message: 'No system requirements detected. Steam REQUIRES Minimum and Recommended specs including OS, Processor, Memory, Graphics, and Storage.' 
      };
    }
  },

  {
    id: 'mature_content',
    name: 'Mature Content Disclosure',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      
      // Mature content keywords that require disclosure
      var matureKeywords = [
        'violence', 'violent', 'blood', 'gore', 'gory',
        'nudity', 'nude', 'sexual', 'sex',
        'drug', 'drugs', 'alcohol', 'drinking',
        'gambling', 'horror', 'disturbing',
        'profanity', 'language', 'mature'
      ];
      
      // Disclosure keywords
      var disclosureKeywords = [
        'content warning', 'content descriptor', 'mature content',
        'contains', 'includes', 'features',
        'rated', 'esrb', 'pegi', 'advisory',
        'parental', 'adult', 'viewer discretion',
        'not suitable', 'not appropriate'
      ];
      
      var foundMature = [];
      for (var i = 0; i < matureKeywords.length; i++) {
        if (lower.indexOf(matureKeywords[i]) !== -1) {
          foundMature.push(matureKeywords[i]);
        }
      }
      
      var hasDisclosure = false;
      for (var j = 0; j < disclosureKeywords.length; j++) {
        if (lower.indexOf(disclosureKeywords[j]) !== -1) {
          hasDisclosure = true;
          break;
        }
      }
      
      if (foundMature.length === 0) {
        return { 
          severity: 'pass', 
          message: 'No obvious mature content keywords detected. If your game has ANY mature themes, ensure they are disclosed in the Mature Content Survey.' 
        };
      }
      
      if (foundMature.length > 0 && hasDisclosure) {
        return { 
          severity: 'pass', 
          message: 'Mature content (' + foundMature.slice(0, 3).join(', ') + ') with apparent disclosure. Ensure Mature Content Survey is completed accurately.' 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'Mature content detected (' + foundMature.slice(0, 3).join(', ') + ') without clear disclosure language. Steam requires accurate Mature Content Survey completion. Undisclosed content causes rejections.' 
      };
    }
  },

  {
    id: 'multiplayer_network',
    name: 'Multiplayer/Network Requirements',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      
      // Multiplayer indicators
      var hasMultiplayer = lower.indexOf('multiplayer') !== -1 ||
                           lower.indexOf('multi-player') !== -1 ||
                           lower.indexOf('co-op') !== -1 ||
                           lower.indexOf('coop') !== -1 ||
                           lower.indexOf('cooperative') !== -1 ||
                           lower.indexOf('pvp') !== -1 ||
                           lower.indexOf('online') !== -1 ||
                           lower.indexOf('matchmaking') !== -1 ||
                           lower.indexOf('versus') !== -1;
      
      var hasPlayerCount = /\d+\s*(-|to)\s*\d+\s*players?|\d+\s*players?/i.test(text);
      
      // Network requirement disclosures
      var hasNetworkReq = lower.indexOf('internet') !== -1 ||
                          lower.indexOf('connection required') !== -1 ||
                          lower.indexOf('online required') !== -1 ||
                          lower.indexOf('requires connection') !== -1 ||
                          lower.indexOf('broadband') !== -1 ||
                          lower.indexOf('network') !== -1;
      
      var hasServerInfo = lower.indexOf('server') !== -1 ||
                          lower.indexOf('dedicated') !== -1 ||
                          lower.indexOf('peer-to-peer') !== -1 ||
                          lower.indexOf('p2p') !== -1;
      
      if (!hasMultiplayer) {
        return { 
          severity: 'pass', 
          message: 'Single-player focus detected (no multiplayer keywords). If your game has ANY online features, they must be disclosed.' 
        };
      }
      
      // Has multiplayer - check for required disclosures
      var issues = [];
      if (!hasPlayerCount) issues.push('player count');
      if (!hasNetworkReq) issues.push('internet requirements');
      
      if (issues.length === 0) {
        return { 
          severity: 'pass', 
          message: 'Multiplayer features with proper disclosures. Player count and network requirements documented.' 
        };
      }
      
      if (issues.length === 1) {
        return { 
          severity: 'warning', 
          message: 'Multiplayer detected but missing: ' + issues[0] + '. Steam flags incomplete multiplayer disclosures.' 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'Multiplayer detected but missing: ' + issues.join(' and ') + '. Add "Requires internet connection" and specify player count (e.g., "2-4 players").' 
      };
    }
  },

  {
    id: 'external_links',
    name: 'External Links Check',
    premium: true,
    check: function(text) {
      // Steam explicitly forbids URLs in description - must use designated link fields
      var urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|gg|tv|co|me|info|biz)[^\s]*/gi;
      var matches = text.match(urlPattern);
      
      // Also check for implied URLs
      var hasImpliedUrl = /visit\s+[a-zA-Z0-9]+\s*\.\s*(com|net|org)/i.test(text) ||
                          /check out [a-zA-Z0-9-]+\.(com|net|org)/i.test(text);
      
      // Check for QR code mentions (also forbidden)
      var hasQRCode = /qr\s*code/i.test(text);
      
      if (matches && matches.length > 0) {
        return { 
          severity: 'fail', 
          message: 'External URLs found in description (' + matches.length + ' detected). Steam FORBIDS links in descriptions. Use the designated Social Media and Website fields in Steamworks instead.' 
        };
      }
      
      if (hasQRCode) {
        return { 
          severity: 'fail', 
          message: 'QR code mentioned in description. Steam forbids QR codes as they function as hidden links. Remove and use designated link fields.' 
        };
      }
      
      if (hasImpliedUrl) {
        return { 
          severity: 'warning', 
          message: 'Possible implied URL detected. Avoid text like "visit example.com" - use designated Steamworks link fields instead.' 
        };
      }
      
      return { 
        severity: 'pass', 
        message: 'No external links detected in description. Good! Use Steamworks link fields for website/social media.' 
      };
    }
  },

  {
    id: 'support_contact',
    name: 'Support/Contact Information',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      
      // Support indicators
      var hasSupport = lower.indexOf('support') !== -1 ||
                       lower.indexOf('help') !== -1 ||
                       lower.indexOf('contact') !== -1 ||
                       lower.indexOf('customer service') !== -1;
      
      var hasEmail = /@[a-zA-Z0-9-]+\.[a-zA-Z]+/.test(text);
      
      var hasDiscord = lower.indexOf('discord') !== -1;
      var hasForums = lower.indexOf('forum') !== -1 || lower.indexOf('community') !== -1;
      var hasSocial = lower.indexOf('twitter') !== -1 || 
                      lower.indexOf('facebook') !== -1 ||
                      lower.indexOf('reddit') !== -1 ||
                      lower.indexOf('@') !== -1;
      
      var hasBugReport = lower.indexOf('bug') !== -1 ||
                         lower.indexOf('report') !== -1 ||
                         lower.indexOf('feedback') !== -1 ||
                         lower.indexOf('issue') !== -1;
      
      var contactMethods = 0;
      if (hasEmail) contactMethods++;
      if (hasDiscord) contactMethods++;
      if (hasForums) contactMethods++;
      if (hasSocial) contactMethods++;
      
      if (hasSupport && contactMethods >= 1) {
        return { 
          severity: 'pass', 
          message: 'Support/contact information present. Players can reach you for help.' 
        };
      }
      
      if (hasBugReport || hasDiscord) {
        return { 
          severity: 'pass', 
          message: 'Community/feedback channel mentioned. Good for player communication.' 
        };
      }
      
      if (contactMethods >= 1) {
        return { 
          severity: 'warning', 
          message: 'Contact method found but no explicit support mention. Consider adding "For support:" or "Bug reports:" for clarity.' 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'No support or contact information detected. Consider adding Discord, email, or forum info so players can report issues and get help.' 
      };
    }
  },

  {
    id: 'language_support',
    name: 'Language Support',
    premium: true,
    check: function(text) {
      var lower = text.toLowerCase();
      
      var languages = [
        'english', 'spanish', 'french', 'german', 'italian',
        'portuguese', 'russian', 'chinese', 'japanese', 'korean',
        'polish', 'turkish', 'dutch', 'swedish', 'norwegian',
        'danish', 'finnish', 'czech', 'hungarian', 'thai',
        'vietnamese', 'indonesian', 'arabic', 'hindi'
      ];
      
      var foundLanguages = [];
      for (var i = 0; i < languages.length; i++) {
        if (lower.indexOf(languages[i]) !== -1) {
          foundLanguages.push(languages[i]);
        }
      }
      
      // Check for localization terms
      var hasLocalization = lower.indexOf('localization') !== -1 ||
                            lower.indexOf('localisation') !== -1 ||
                            lower.indexOf('translated') !== -1 ||
                            lower.indexOf('subtitles') !== -1 ||
                            lower.indexOf('language') !== -1;
      
      if (foundLanguages.length >= 5) {
        return { 
          severity: 'pass', 
          message: 'Excellent language support (' + foundLanguages.length + ' languages listed). Good international reach.' 
        };
      }
      
      if (foundLanguages.length >= 3) {
        return { 
          severity: 'pass', 
          message: 'Multiple languages listed (' + foundLanguages.join(', ') + '). Ensure these match your Steamworks language settings.' 
        };
      }
      
      if (foundLanguages.length > 0 || hasLocalization) {
        return { 
          severity: 'warning', 
          message: 'Limited language info detected. List ALL supported languages clearly. Steam shows language support prominently to international customers.' 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'No language support information found. Even if English-only, consider stating "Language: English" for clarity. Multi-language support expands your market.' 
      };
    }
  },

  {
    id: 'legal_copyright',
    name: 'Legal & Copyright',
    premium: true,
    check: function(text) {
      var hasCopyright = /©|\(c\)|copyright/i.test(text);
      var hasTrademark = /™|®|trademark/i.test(text);
      var hasAllRights = /all rights reserved/i.test(text);
      var hasYear = /20[0-9]{2}/.test(text);
      var hasCompanyName = /studios?|games?|entertainment|interactive|software/i.test(text);
      
      // Check for third-party content acknowledgment
      var hasThirdParty = /third.?party|licensed|trademark of|property of|respective owners/i.test(text);
      
      // Check for engine/middleware credits (often required)
      var hasEngineCredit = /unreal|unity|godot|gamemaker|rpg maker|middleware/i.test(text);
      
      var legalScore = 0;
      if (hasCopyright) legalScore += 2;
      if (hasTrademark) legalScore++;
      if (hasAllRights) legalScore++;
      if (hasYear) legalScore++;
      if (hasCompanyName) legalScore++;
      
      if (legalScore >= 4) {
        return { 
          severity: 'pass', 
          message: 'Good legal disclaimers present. Copyright notice with year and company detected.' 
        };
      }
      
      if (hasCopyright || hasTrademark) {
        return { 
          severity: 'pass', 
          message: 'Basic legal notices present. Consider adding full copyright: "© [Year] [Company]. All rights reserved."' 
        };
      }
      
      if (hasThirdParty || hasEngineCredit) {
        return { 
          severity: 'warning', 
          message: 'Third-party/engine content detected but missing your own copyright. Add: "© [Year] [Your Company]. All rights reserved."' 
        };
      }
      
      return { 
        severity: 'warning', 
        message: 'No copyright or legal notices detected. Recommend adding: "© 2025 [Your Studio Name]. All rights reserved." Protects your IP and looks professional.' 
      };
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
    output.innerHTML = '<div class="result warning"><strong>⚠ Input Required</strong><br>Paste your Steam store page text (About This Game, System Requirements, etc.) into the text area above, then click Run Check.</div>';
    summaryBar.innerHTML = '';
    return;
  }

  // If only URL provided, show helpful message
  if (url && !text) {
    output.innerHTML = '<div class="result warning"><strong>⚠ Paste Your Content</strong><br>This tool analyzes text you paste from Steamworks. Copy your About This Game section, System Requirements, and other store page text, then paste it in the text area above.<br><br><em>Tip: Your Steam page isn\'t public until after approval, so paste the text directly from Steamworks.</em></div>';
    summaryBar.innerHTML = '';
    return;
  }

  var content = text;
  var unlocked = isUnlocked();
  
  var passCount = 0, warnCount = 0, failCount = 0, lockCount = 0;
  var html = '';

  for (var i = 0; i < CHECKS.length; i++) {
    var c = CHECKS[i];
    
    if (c.premium && !unlocked) {
      lockCount++;
      html += '<div class="result locked">';
      html += '<strong>🔒 ' + c.name + '</strong>';
      html += '<span class="locked-message">Unlock premium to run this check.</span>';
      html += '</div>';
    } else {
      var r = c.check(content);
      if (r.severity === 'pass') passCount++;
      else if (r.severity === 'warning') warnCount++;
      else if (r.severity === 'fail') failCount++;
      
      var icon = r.severity === 'pass' ? '✓' : (r.severity === 'warning' ? '⚠' : '✗');
      html += '<div class="result ' + r.severity + '">';
      html += '<strong>' + icon + ' ' + c.name + '</strong>';
      html += '<p>' + r.message + '</p>';
      html += '</div>';
    }
  }

  output.innerHTML = html;

  // Build summary bar
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
  
  if (!text || text.indexOf('No checks run yet') !== -1 || text.indexOf('Input Required') !== -1) {
    alert('Run a check first before copying results.');
    return;
  }

  var header = 'Steam Page Check Results\n';
  header += '========================\n\n';
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(header + text).then(function() {
      alert('Results copied to clipboard!');
    }).catch(function() {
      alert('Could not copy to clipboard.');
    });
  } else {
    alert('Clipboard not available in this browser.');
  }
}

// =========================================
// LOAD SAMPLE - called by onclick
// =========================================
function loadSample() {
  var sample = 'About This Game\n\n';
  sample += 'Welcome to Pixel Quest Adventures - an epic retro-style platformer that brings back the golden age of gaming!\n\n';
  sample += 'EARLY ACCESS NOTE: This game is currently in Early Access. We expect to be in Early Access for approximately 6-12 months as we add more content and polish based on your feedback.\n\n';
  sample += 'Current State: The game currently includes 3 complete worlds with 30 levels, full controller support, and the core gameplay loop.\n\n';
  sample += 'Planned Features:\n';
  sample += '- 2 additional worlds (50 total levels)\n';
  sample += '- Boss battles\n';
  sample += '- Level editor\n';
  sample += '- Online leaderboards\n\n';
  sample += 'Your feedback shapes development! Join our Discord community to suggest features and report bugs.\n\n';
  sample += 'Features:\n';
  sample += '- 50+ handcrafted levels across 5 unique worlds\n';
  sample += '- Tight, responsive controls\n';
  sample += '- Original chiptune soundtrack\n';
  sample += '- Local co-op multiplayer for 2-4 players\n';
  sample += '- Steam achievements and cloud saves\n\n';
  sample += 'Price: $14.99 (price may increase after Early Access)\n\n';
  sample += 'Content Warning: Contains cartoon violence and mild fantasy themes. Rated E10+ by ESRB.\n\n';
  sample += 'Multiplayer: 2-4 players local co-op. Online multiplayer requires internet connection (coming in future update).\n\n';
  sample += 'System Requirements\n\n';
  sample += 'Minimum:\n';
  sample += '- OS: Windows 10\n';
  sample += '- Processor: Intel Core i3 or equivalent\n';
  sample += '- Memory: 4 GB RAM\n';
  sample += '- Graphics: Intel HD 4000 or better\n';
  sample += '- Storage: 500 MB available space\n\n';
  sample += 'Recommended:\n';
  sample += '- OS: Windows 10/11\n';
  sample += '- Processor: Intel Core i5 or equivalent\n';
  sample += '- Memory: 8 GB RAM\n';
  sample += '- Graphics: Dedicated GPU with 2GB VRAM\n';
  sample += '- Storage: 1 GB available space\n\n';
  sample += 'Languages: English, Spanish, French, German, Japanese, Chinese (Simplified), Portuguese, Russian\n\n';
  sample += 'For support and bug reports, join our Discord or email support@pixelqueststudios.com\n\n';
  sample += '© 2025 Pixel Quest Studios. All rights reserved.';
  
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
