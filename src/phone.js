// Resolve extension resource URL from page context.
// script.js sets window.__WA_EXT_URL before injecting this file,
// bridging the chrome.runtime gap that exists in page-world scripts.
function extURL(filename) {
  if (window.__WA_EXT_URL) return window.__WA_EXT_URL + filename;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    try { return chrome.runtime.getURL(filename); } catch {}
  }
  return filename;
}

let libphone = null;

function loadLibphonenumber() {
  if (libphone) return;
  const s = document.createElement('script');
  s.src = extURL('libphonenumber-js.min.js');
  s.onload = () => { libphone = window.libphonenumber || null; };
  document.head.appendChild(s);
}

// Strip WhatsApp suffix and normalise to E.164 (+DIGITS).
function cleanPhone(raw) {
  if (!raw) return null;
  let s = String(raw).split('@')[0].replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  else if (!s.startsWith('+')) s = '+' + s;
  return /^\+\d{7,15}$/.test(s) ? s : String(raw).split('@')[0];
}

// Returns phone with a leading ' to force text in spreadsheets.
// Uses libphonenumber's formatNational() when the library is loaded;
// falls back to the cleaned E.164 string otherwise.
function formatPhone(raw) {
  const cleaned = cleanPhone(raw);
  if (!cleaned) return "'Unknown";
  if (libphone && libphone.parsePhoneNumber) {
    try {
      const parsed = libphone.parsePhoneNumber(cleaned);
      if (parsed && parsed.isValid()) return "'" + parsed.formatNational();
    } catch {}
  }
  return "'" + cleaned;
}

loadLibphonenumber();
