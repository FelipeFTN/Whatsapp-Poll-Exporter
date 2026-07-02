const moduleRaid = function () {
  moduleRaid.mID  = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};

  moduleRaid.isComet = typeof window.Debug === 'object' &&
    window.Debug?.VERSION &&
    parseInt((window.Debug.VERSION || '').split('.')[1] || '0') >= 3000;

  fillModuleArray = function () {
    try {
      if (typeof window.Debug === 'object' && window.Debug?.VERSION && parseFloat(window.Debug.VERSION) < 2.3) {
        const webpackChunk = window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client;
        if (webpackChunk && Array.isArray(webpackChunk)) {
          webpackChunk.push([[moduleRaid.mID], {}, function (e) {
            try {
              if (e && typeof e === 'function' && typeof e.m === 'object') {
                Object.keys(e.m).forEach(function (mod) {
                  try { moduleRaid.mObj[mod] = e(mod); } catch {}
                });
              }
            } catch {}
          }]);
        }
      } else {
        try {
          if (typeof self !== 'undefined' && typeof self.require === 'function') {
            let debugModule;
            try { debugModule = self.require('__debug'); } catch { return; }
            if (!debugModule?.modulesMap) return;

            Object.keys(debugModule.modulesMap)
              .filter(k => k.includes('WA') && !k.includes('CallStore') && !k.includes('callOutcome'))
              .forEach(mod => {
                try {
                  const m = debugModule.modulesMap[mod];
                  if (!m) return;
                  moduleRaid.mObj[mod] = { default: m.defaultExport || {}, factory: m.factory, ...m };
                  if (
                    Object.keys(moduleRaid.mObj[mod].default).length === 0 &&
                    typeof self.ErrorGuard?.skipGuardGlobal === 'function' &&
                    typeof self.importNamespace === 'function'
                  ) {
                    try {
                      self.ErrorGuard.skipGuardGlobal(true);
                      Object.assign(moduleRaid.mObj[mod], self.importNamespace(mod));
                    } catch {}
                  }
                } catch {}
              });
          }
        } catch {}
      }
    } catch { moduleRaid.mObj = {}; }
  };

  try { fillModuleArray(); } catch { moduleRaid.mObj = {}; }

  get = function get(id) { return moduleRaid.mObj[id] || null; };

  findModule = function findModule(query) {
    results = [];
    Object.keys(moduleRaid.mObj).forEach(function (mKey) {
      try {
        const mod = moduleRaid.mObj[mKey];
        if (typeof mod === 'undefined') return;
        if (typeof query === 'string') {
          if (typeof mod.default === 'object') {
            for (const key in mod.default) { if (key === query) results.push(mod); }
          }
          for (const key in mod) { if (key === query) results.push(mod); }
        } else if (typeof query === 'function') {
          if (query(mod)) results.push(mod);
        }
      } catch {}
    });
    return results;
  };

  return { modules: moduleRaid.mObj, constructors: moduleRaid.cArr, findModule, get };
};

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}

let watchedGroup = null, lastSortVote;

const initInterval = setInterval(() => {
  try {
    if (!(window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client)) return;

    try {
      const momentMod = window.mR.findModule(m =>
        m?.default && typeof m.default.defineLocale === 'function' && m.default.locale
      )[0];
      if (momentMod?.default) {
        momentMod.default.locale(navigator.language || 'en');
        const orig = momentMod.default.defineLocale;
        momentMod.default.defineLocale = function (locale, config) {
          if (locale === 'pt-br') return;
          return orig.call(this, locale, config);
        };
      }
    } catch {}

    try { window.mR = moduleRaid(); } catch {}

    window.Store = {};

    try {
      let mods = window.mR.findModule(m => m && m.Call && m.Chat);
      if (!mods.length) mods = window.mR.findModule(m => m?.default?.Chat);
      if (mods.length) {
        const first = mods[0];
        window.Store = Object.assign({}, first.Chat ? first : first.default);
      }

      if (!window.Store.Msg) {
        const mm = window.mR.findModule(m => m?.Msg || m?.default?.Msg);
        if (mm.length) window.Store.Msg = mm[0].Msg || mm[0].default?.Msg;
      }

      if (!window.Store.PollVote) {
        const pm = window.mR.findModule(m => m?.PollVote || m?.default?.PollVote);
        if (pm.length) window.Store.PollVote = pm[0].PollVote || pm[0].default?.PollVote;
      }
    } catch {}

    clearInterval(initInterval);
  } catch {
    if (!window._initAttempts) window._initAttempts = 0;
    if (++window._initAttempts > 5) clearInterval(initInterval);
  }
}, 1000);
