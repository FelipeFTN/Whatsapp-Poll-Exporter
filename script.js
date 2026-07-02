// Cross-browser API shim (Chrome / Firefox / Edge)
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

let userSettings = { exportFormat: 'csv', language: 'en' };

const DOWNLOAD_BTN_CLASS = 'wa-poll-download-btn';

const BUTTON_LABELS = {
  en: 'Export',
  he: 'ייצוא',
  ar: 'تصدير',
  es: 'Exportar',
  fr: 'Exporter',
  pt: 'Exportar',
};

function getButtonLabel(language) {
  return BUTTON_LABELS[language] || BUTTON_LABELS['en'];
}

function loadUserSettings() {
  return new Promise((resolve) => {
    if (browserAPI.storage && browserAPI.storage.sync) {
      browserAPI.storage.sync.get({ exportFormat: 'csv', language: 'en' }, (items) => {
        if (browserAPI.runtime.lastError) {
          resolve(userSettings);
        } else {
          userSettings = items;
          resolve(items);
        }
      });
    } else {
      resolve(userSettings);
    }
  });
}

function saveUserSettings(settings) {
  return new Promise((resolve, reject) => {
    const updated = { ...userSettings, ...settings };
    if (browserAPI.storage && browserAPI.storage.sync) {
      browserAPI.storage.sync.set(updated, () => {
        if (browserAPI.runtime.lastError) {
          reject(browserAPI.runtime.lastError);
        } else {
          userSettings = updated;
          resolve(updated);
        }
      });
    } else {
      Object.assign(userSettings, settings);
      resolve(userSettings);
    }
  });
}

function updateAllButtonLabels() {
  const label = getButtonLabel(userSettings.language);
  document.querySelectorAll(`.${DOWNLOAD_BTN_CLASS}`).forEach((btn) => {
    if (btn.textContent !== '...') btn.textContent = label;
  });
}

browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'updateSettings') {
    const incoming = message.settings || {};
    saveUserSettings(incoming)
      .then(() => { updateAllButtonLabels(); sendResponse({ success: true }); })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

window.addEventListener('message', (event) => {
  if (event.data?.source === 'WAVoteExporterPopup' && event.data.updateSettings) {
    saveUserSettings(event.data.settings || {}).then(updateAllButtonLabels);
  }
});

// ─── Script injection helpers ────────────────────────────────────────────────

function injectScript(src, tag) {
  return new Promise((resolve) => {
    const el = document.createElement('script');
    el.type = 'text/javascript';
    el.src = src;
    el.onload = () => resolve(true);
    el.onerror = () => resolve(false);
    document.getElementsByTagName(tag)[0].appendChild(el);
  });
}

function makeXLSXGlobal() {
  return new Promise((resolve) => {
    if (typeof window.XLSX !== 'undefined') { resolve(true); return; }

    const script = document.createElement('script');
    script.src = browserAPI.runtime.getURL('xlsx.full.min.js');
    document.head.appendChild(script);

    script.onload = () => {
      const globalizer = document.createElement('script');
      globalizer.src = browserAPI.runtime.getURL('make_xlsx_global.js');
      document.head.appendChild(globalizer);
      globalizer.onload  = () => resolve(true);
      globalizer.onerror = () => resolve(false);
    };
    script.onerror = () => resolve(false);
  });
}

// ─── Initialization ──────────────────────────────────────────────────────────

let initAttempts = 0;

async function initializeExtension() {
  if (++initAttempts > 3) {
    console.warn('[PollExporter] Max init attempts reached');
    return;
  }

  const delay = 2000 + (initAttempts - 1) * 1000;

  setTimeout(async () => {
    try {
      await makeXLSXGlobal();

      // Expose extension base URL to page context so moduleraid.js can load
      // sub-scripts without calling chrome.runtime (unavailable in page world on Firefox)
      const urlBridge = document.createElement('script');
      urlBridge.textContent = `window.__WA_EXT_URL = ${JSON.stringify(browserAPI.runtime.getURL(''))};`;
      (document.head || document.documentElement).appendChild(urlBridge);
      urlBridge.remove();

      let loaded = false;
      for (let i = 0; i < 3; i++) {
        loaded = await injectScript(browserAPI.runtime.getURL('moduleraid.js'), 'body');
        if (loaded) break;
        await new Promise(r => setTimeout(r, 1000));
      }

      if (loaded) {
        await loadUserSettings();
        setupPollButtonObserver();
      } else {
        initializeExtension();
      }
    } catch (err) {
      console.error('[PollExporter] Init error:', err);
      initializeExtension();
    }
  }, delay);
}

initializeExtension();

// ─── Download handler (single shared implementation) ─────────────────────────

function attachDownloadHandler(button, getPollContainer) {
  button.addEventListener('click', async (e) => {
    e.stopPropagation();

    const pollElement = typeof getPollContainer === 'function' ? getPollContainer() : getPollContainer;
    const msgContainer = findPollMessageContainer(pollElement);
    const msgId = msgContainer?.getAttribute('data-id');
    console.log('%c[PollExporter] DOM container element:', 'color:#25d366;font-weight:bold', msgContainer);
    console.log('%c[PollExporter] data-id sent to Store lookup:', 'color:#25d366;font-weight:bold', msgId);
    if (!msgId) { console.error('[PollExporter] Could not find poll message ID'); return; }

    await loadUserSettings();

    const originalText = button.textContent;
    button.textContent = '...';
    button.style.opacity = '0.6';

    window.postMessage({
      source: 'WAVoteExporter',
      export: msgId,
      preferredFormat: userSettings.exportFormat,
      language: userSettings.language,
    }, '*');

    let handled = false;

    const onComplete = (event) => {
      if (!event.data?.source === 'WAVoteExporter' || !event.data.exportComplete) return;
      if (handled) return;
      handled = true;

      window.removeEventListener('message', onComplete);
      button.style.opacity = '1';

      if (event.data.success) {
        const method = event.data.method || userSettings.exportFormat;
        button.textContent = `✓ ${method}`;
        button.style.color = '#4CAF50';
        setTimeout(() => { button.textContent = originalText; button.style.color = ''; }, 1800);
      } else if (event.data.error) {
        button.textContent = '✗';
        button.style.color = '#e53e3e';
        setTimeout(() => { button.textContent = originalText; button.style.color = ''; }, 2000);
      } else {
        button.textContent = originalText;
      }
    };

    window.addEventListener('message', onComplete);

    setTimeout(() => {
      if (!handled) {
        handled = true;
        window.removeEventListener('message', onComplete);
        button.textContent = originalText;
        button.style.opacity = '1';
      }
    }, 8000);
  });
}

// ─── Button creation ──────────────────────────────────────────────────────────

function createDownloadButton() {
  const btn = document.createElement('div');
  btn.textContent = getButtonLabel(userSettings.language);
  btn.className = DOWNLOAD_BTN_CLASS;
  btn.setAttribute('data-injected', 'true');
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.style.cssText = 'color:#53bdeb;background:transparent;padding:8px 12px;font-size:15px;font-family:inherit;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:1;user-select:none;';
  return btn;
}

function injectButtonIntoContainer(container, pollElement) {
  if (container.querySelector(`.${DOWNLOAD_BTN_CLASS}`)) return false;

  const btn = createDownloadButton();
  container.appendChild(btn);
  attachDownloadHandler(btn, pollElement);
  return true;
}

// ─── Poll detection helpers ───────────────────────────────────────────────────

function findPollMessageContainer(element) {
  // First pass: look for WhatsApp's per-message focusable-list-item that has a data-id.
  // This is the most specific match and avoids chat-level data-id attributes.
  let el = element;
  while (el && el !== document.body) {
    if (el.classList?.contains('focusable-list-item') && el.hasAttribute('data-id')) {
      return el;
    }
    el = el.parentElement;
  }
  // Second pass: any ancestor with data-id (catches WhatsApp DOM variations)
  el = element;
  while (el && el !== document.body) {
    if (el.hasAttribute('data-id')) return el;
    el = el.parentElement;
  }
  return null;
}

function findParentWithClass(element, className) {
  let el = element;
  while (el) {
    if (el.classList?.contains(className)) return el;
    el = el.parentElement;
  }
  return null;
}

function tryInjectButton(container, viewVotesButton) {
  if (container.querySelector(`.${DOWNLOAD_BTN_CLASS}`)) return false;

  // The direct parent of the innermost "View votes" element is the button row.
  // Walk up from it until we find a flex container — that's where we inject.
  let target = viewVotesButton?.parentElement || null;
  while (target && target !== document.body) {
    const style = window.getComputedStyle(target);
    if (style.display === 'flex') break;
    target = target.parentElement;
  }

  if (!target || target === document.body) return false;
  if (target.querySelector(`.${DOWNLOAD_BTN_CLASS}`)) return false;

  return injectButtonIntoContainer(target, container);
}

// ─── Poll observer ────────────────────────────────────────────────────────────

function setupPollButtonObserver() {
  const processedElements = new WeakSet();

  let scanScheduled = false;
  let lastScanTime  = 0;

  function scheduleScan(delay = 300) {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      if (Date.now() - lastScanTime < 200) return;
      lastScanTime = Date.now();
      scanForPolls();
    }, delay);
  }

  function scanForPolls() {
    // Find the innermost "View votes" elements only.
    // Many ancestor divs share the same textContent — we only want the leaf.
    const candidates = Array.from(document.querySelectorAll('[role="button"], div')).filter((el) => {
      if (processedElements.has(el)) return false;
      if (el.textContent?.trim() !== 'View votes') return false;
      // Skip if any direct child element also contains exactly "View votes" —
      // that child is more specific and will be (or was) selected instead.
      return !Array.from(el.children).some(ch => ch.textContent?.trim() === 'View votes');
    });

    candidates.forEach((el) => {
      processedElements.add(el);
      let parent = el;
      for (let depth = 0; depth < 6; depth++) {
        if (!parent) break;
        if (tryInjectButton(parent, el)) break;
        parent = parent.parentElement;
      }
    });
  }

  // Initial scan after a short settling period
  setTimeout(scanForPolls, 1500);

  // DOM mutation observer — only trigger on potentially relevant changes
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'childList' || m.addedNodes.length === 0) continue;
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.textContent?.includes('View votes')) {
          scheduleScan(200);
          return;
        }
        if (node.querySelector?.('[role="button"]')) {
          scheduleScan(500);
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Trigger scan on chat navigation
  window.addEventListener('popstate', () => scheduleScan(600));

  // Trigger scan when clicking on chat list items
  document.addEventListener('click', (e) => {
    if (findParentWithClass(e.target, 'chat')) scheduleScan(600);
  }, true);

  // Trigger scan after scroll (messages may be loaded)
  let scrollTimer;
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(scanForPolls, 800);
  }, true);
}
