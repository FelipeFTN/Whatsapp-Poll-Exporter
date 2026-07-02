const UI_TRANSLATIONS = {
  en: {
    headerTitle:  'Poll Exporter',
    languageLabel:'Language',
    formatLabel:  'Export Format',
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'Full formatting & styles',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'Compatible with all versions',
    csvLabel:     'CSV',
    csvDesc:      'Plain data, any spreadsheet',
    saveButton:   'Save Settings',
    savedMessage: 'Saved successfully',
    errorMessage: 'Error saving settings',
  },
  he: {
    headerTitle:  'ייצוא סקרים',
    languageLabel:'שפה',
    formatLabel:  'פורמט ייצוא',
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'עם עיצוב מלא',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'תואם לכל גרסה',
    csvLabel:     'CSV',
    csvDesc:      'נתונים ללא עיצוב',
    saveButton:   'שמור הגדרות',
    savedMessage: 'נשמר בהצלחה',
    errorMessage: 'שגיאה בשמירה',
  },
  ar: {
    headerTitle:  'تصدير الاستطلاعات',
    languageLabel:'اللغة',
    formatLabel:  'تنسيق التصدير',
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'تنسيق كامل',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'متوافق مع جميع الإصدارات',
    csvLabel:     'CSV',
    csvDesc:      'بيانات بسيطة',
    saveButton:   'حفظ الإعدادات',
    savedMessage: 'تم الحفظ بنجاح',
    errorMessage: 'خطأ في الحفظ',
  },
  es: {
    headerTitle:  'Exportar encuestas',
    languageLabel:'Idioma',
    formatLabel:  'Formato de exportación',
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'Con formato completo',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'Compatible con todas las versiones',
    csvLabel:     'CSV',
    csvDesc:      'Datos sin formato',
    saveButton:   'Guardar configuración',
    savedMessage: 'Guardado correctamente',
    errorMessage: 'Error al guardar',
  },
  fr: {
    headerTitle:  'Exporter les sondages',
    languageLabel:'Langue',
    formatLabel:  "Format d'exportation",
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'Mise en forme complète',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'Compatible avec toutes les versions',
    csvLabel:     'CSV',
    csvDesc:      'Données brutes',
    saveButton:   'Enregistrer',
    savedMessage: 'Enregistré avec succès',
    errorMessage: "Erreur d'enregistrement",
  },
  pt: {
    headerTitle:  'Exportar enquetes',
    languageLabel:'Idioma',
    formatLabel:  'Formato de exportação',
    xlsxLabel:    'Excel (XLSX)',
    xlsxDesc:     'Com formatação completa',
    htmlLabel:    'Excel (HTML)',
    htmlDesc:     'Compatível com todas as versões',
    csvLabel:     'CSV',
    csvDesc:      'Dados simples',
    saveButton:   'Salvar configurações',
    savedMessage: 'Salvo com sucesso',
    errorMessage: 'Erro ao salvar',
  }
};

const RTL_LANGUAGES = new Set(['he', 'ar']);
const DEFAULT_SETTINGS = { exportFormat: 'csv', language: 'en' };

function t(key, language) {
  const lang = UI_TRANSLATIONS[language] ? language : 'en';
  return UI_TRANSLATIONS[lang][key] || UI_TRANSLATIONS['en'][key] || key;
}

function applyUITranslation(language) {
  document.body.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
  document.getElementById('header-title').textContent  = t('headerTitle', language);
  document.getElementById('language-label').textContent = t('languageLabel', language);
  document.getElementById('format-label').textContent   = t('formatLabel', language);
  document.getElementById('label-xlsx').textContent     = t('xlsxLabel', language);
  document.getElementById('desc-xlsx').textContent      = t('xlsxDesc', language);
  document.getElementById('label-html').textContent     = t('htmlLabel', language);
  document.getElementById('desc-html').textContent      = t('htmlDesc', language);
  document.getElementById('label-csv').textContent      = t('csvLabel', language);
  document.getElementById('desc-csv').textContent       = t('csvDesc', language);
  document.getElementById('save-btn').textContent       = t('saveButton', language);
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    const lang = UI_TRANSLATIONS[items.language] ? items.language : 'en';

    const formatRadio = document.querySelector(`input[name="export-format"][value="${items.exportFormat}"]`);
    if (formatRadio) {
      formatRadio.checked = true;
    } else {
      document.getElementById('format-csv').checked = true;
    }

    document.getElementById('language-select').value = lang;
    applyUITranslation(lang);
  });
}

function saveSettings() {
  const formatRadio = document.querySelector('input[name="export-format"]:checked');
  const exportFormat = formatRadio ? formatRadio.value : DEFAULT_SETTINGS.exportFormat;
  const language = document.getElementById('language-select').value || DEFAULT_SETTINGS.language;
  const statusEl = document.getElementById('status');

  chrome.storage.sync.set({ exportFormat, language }, () => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = t('errorMessage', language);
      statusEl.className = 'status error';
    } else {
      statusEl.textContent = t('savedMessage', language);
      statusEl.className = 'status';
      notifyWhatsAppTabs({ exportFormat, language });
    }
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 2000);
  });
}

function notifyWhatsAppTabs(settings) {
  chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
    if (!tabs || tabs.length === 0) return;

    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings }, () => {
        if (chrome.runtime.lastError) {
          // Tab may not have content script loaded yet — inject via scripting API
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (s) => window.postMessage({ source: 'WAVoteExporterPopup', updateSettings: true, settings: s }, '*'),
            args: [settings]
          }).catch(() => {});
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  document.getElementById('language-select').addEventListener('change', (e) => {
    applyUITranslation(e.target.value);
  });

  document.getElementById('save-btn').addEventListener('click', saveSettings);
});

chrome.tabs.onActivated.addListener((info) => {
  chrome.tabs.get(info.tabId, (tab) => {
    if (tab.url && tab.url.includes('web.whatsapp.com')) {
      chrome.tabs.sendMessage(info.tabId, { action: 'updateSettings' }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    }
  });
});
