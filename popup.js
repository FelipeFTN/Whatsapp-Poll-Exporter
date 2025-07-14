document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const formatRadios = document.querySelectorAll('input[name="export-format"]');
  const languageSelect = document.getElementById('language-select');
  const saveButton = document.getElementById('save-settings');
  const statusMessage = document.getElementById('status-message');
  const headerTitle = document.getElementById('header-title');
  const formatLabel = document.getElementById('format-label');
  const languageLabel = document.getElementById('language-label');
  const htmlExcelLabel = document.getElementById('html-excel-label');
  const csvLabel = document.getElementById('csv-label');
  const creditText = document.getElementById('credit-text');
  
  // Define all UI text translations
  const translations = {
    'he': {
      headerTitle: 'הגדרות ייצוא סקרי וואטסאפ',
      formatLabel: 'פורמט ייצוא:',
      languageLabel: 'שפה:',
      htmlExcelLabel: 'Excel (HTML) - תואם לכל גרסה',
      csvLabel: 'CSV - נתונים ללא עיצוב',
      saveButton: 'שמור הגדרות',
      successMessage: 'נשמר בהצלחה!',
      errorMessage: 'שגיאה בשמירה',
      creditText: 'פותח ע״י תחום ניהו"ג'
    },
    'en': {
      headerTitle: 'WhatsApp Poll Export Settings',
      formatLabel: 'Export Format:',
      languageLabel: 'Language:',
      htmlExcelLabel: 'Excel (HTML) - Compatible with all versions',
      csvLabel: 'CSV - Unformatted data',
      saveButton: 'Save Settings',
      successMessage: 'Saved successfully!',
      errorMessage: 'Error saving settings',
      creditText: 'Developed by Nihug Department'
    },
    'es': {
      headerTitle: 'Configuración de Exportación de Encuestas',
      formatLabel: 'Formato de Exportación:',
      languageLabel: 'Idioma:',
      htmlExcelLabel: 'Excel (HTML) - Compatible con todas las versiones',
      csvLabel: 'CSV - Datos sin formato',
      saveButton: 'Guardar Configuración',
      successMessage: '¡Guardado con éxito!',
      errorMessage: 'Error al guardar',
      creditText: 'Desarrollado por Nihug Departamento'
    },
    'fr': {
      headerTitle: 'Paramètres d\'Exportation des Sondages',
      formatLabel: 'Format d\'Exportation:',
      languageLabel: 'Langue:',
      htmlExcelLabel: 'Excel (HTML) - Compatible avec toutes les versions',
      csvLabel: 'CSV - Données non formatées',
      saveButton: 'Enregistrer les Paramètres',
      successMessage: 'Enregistré avec succès!',
      errorMessage: 'Erreur d\'enregistrement',
      creditText: 'Développé par Nihug Département'
    }
  };
  
  // Function to update all UI texts based on selected language
  function updateUITexts(language) {
    // Default to Hebrew if translation not found
    const texts = translations[language] || translations['he'];
    
    // Update all text elements
    if (headerTitle) headerTitle.textContent = texts.headerTitle;
    if (formatLabel) formatLabel.textContent = texts.formatLabel;
    if (languageLabel) languageLabel.textContent = texts.languageLabel;
    if (htmlExcelLabel) htmlExcelLabel.textContent = texts.htmlExcelLabel;
    if (csvLabel) csvLabel.textContent = texts.csvLabel;
    if (saveButton) saveButton.textContent = texts.saveButton;
    if (creditText) creditText.textContent = texts.creditText;
    
    // Update page direction based on language
    if (language === 'he') {
      document.body.style.direction = 'rtl';
    } else {
      document.body.style.direction = 'ltr';
    }
  }
  
  // Listen for language changes
  if (languageSelect) {
    languageSelect.addEventListener('change', function() {
      const selectedLanguage = languageSelect.value;
      updateUITexts(selectedLanguage);
    });
  }
  
  // Load saved settings from storage
  loadSettings();
  
  // Save options when button is clicked
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      saveSettings();
    });
  }
});

// Load settings from Chrome storage
function loadSettings() {
  try {
    chrome.storage.sync.get({
      exportFormat: 'csv',  // Default format - changed to CSV as default
      language: 'he'        // Default language (Hebrew)
    }, function(items) {
      // Set the export format radio button
      const formatRadio = document.querySelector(`input[name="export-format"][value="${items.exportFormat}"]`);
      if (formatRadio) {
        formatRadio.checked = true;
      } else {
        // If the format doesn't exist, default to CSV
        const defaultRadio = document.querySelector('input[name="export-format"][value="csv"]');
        if (defaultRadio) defaultRadio.checked = true;
      }
      
      // Set the language dropdown
      const languageSelect = document.getElementById('language-select');
      if (languageSelect) {
        // Check if the language option exists in the dropdown
        const exists = Array.from(languageSelect.options).some(opt => opt.value === items.language);
        const selectedLanguage = exists ? items.language : 'he';
        languageSelect.value = selectedLanguage;
        
        // Update UI texts based on selected language
        updateUITexts(selectedLanguage);
      }
    });
  } catch (err) {
    console.error("Error loading settings:", err);
    // Set defaults manually if loading fails
    const csvRadio = document.querySelector('input[name="export-format"][value="csv"]');
    if (csvRadio) csvRadio.checked = true;
    
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) languageSelect.value = 'he';
    
    // Set default UI texts
    updateUITexts('he');
  }
}

// Update all UI texts based on selected language
function updateUITexts(language) {
  // Define all UI text translations
  const translations = {
    'he': {
      headerTitle: 'הגדרות ייצוא סקרי וואטסאפ',
      formatLabel: 'פורמט ייצוא:',
      languageLabel: 'שפה:',
      htmlExcelLabel: 'Excel (HTML) - תואם לכל גרסה',
      csvLabel: 'CSV - נתונים ללא עיצוב',
      saveButton: 'שמור הגדרות',
      successMessage: 'נשמר בהצלחה!',
      errorMessage: 'שגיאה בשמירה',
      creditText: 'פותח ע״י תחום ניהו"ג'
    },
    'en': {
      headerTitle: 'WhatsApp Poll Export Settings',
      formatLabel: 'Export Format:',
      languageLabel: 'Language:',
      htmlExcelLabel: 'Excel (HTML) - Compatible with all versions',
      csvLabel: 'CSV - Unformatted data',
      saveButton: 'Save Settings',
      successMessage: 'Saved successfully!',
      errorMessage: 'Error saving settings',
      creditText: 'Developed by Nihug Department'
    },
    'es': {
      headerTitle: 'Configuración de Exportación de Encuestas',
      formatLabel: 'Formato de Exportación:',
      languageLabel: 'Idioma:',
      htmlExcelLabel: 'Excel (HTML) - Compatible con todas las versiones',
      csvLabel: 'CSV - Datos sin formato',
      saveButton: 'Guardar Configuración',
      successMessage: '¡Guardado con éxito!',
      errorMessage: 'Error al guardar',
      creditText: 'Desarrollado por Nihug Departamento'
    },
    'fr': {
      headerTitle: 'Paramètres d\'Exportation des Sondages',
      formatLabel: 'Format d\'Exportation:',
      languageLabel: 'Langue:',
      htmlExcelLabel: 'Excel (HTML) - Compatible avec toutes les versions',
      csvLabel: 'CSV - Données non formatées',
      saveButton: 'Enregistrer les Paramètres',
      successMessage: 'Enregistré avec succès!',
      errorMessage: 'Erreur d\'enregistrement',
      creditText: 'Développé par Nihug Département'
    }
  };
  
  // Default to Hebrew if translation not found
  const texts = translations[language] || translations['he'];
  
  // Update all text elements
  const headerTitle = document.getElementById('header-title');
  const formatLabel = document.getElementById('format-label');
  const languageLabel = document.getElementById('language-label');
  const htmlExcelLabel = document.getElementById('html-excel-label');
  const csvLabel = document.getElementById('csv-label');
  const saveButton = document.getElementById('save-settings');
  const creditText = document.getElementById('credit-text');
  
  if (headerTitle) headerTitle.textContent = texts.headerTitle;
  if (formatLabel) formatLabel.textContent = texts.formatLabel;
  if (languageLabel) languageLabel.textContent = texts.languageLabel;
  if (htmlExcelLabel) htmlExcelLabel.textContent = texts.htmlExcelLabel;
  if (csvLabel) csvLabel.textContent = texts.csvLabel;
  if (saveButton) saveButton.textContent = texts.saveButton;
  if (creditText) creditText.textContent = texts.creditText;
  
  // Update page direction based on language
  if (language === 'he') {
    document.body.style.direction = 'rtl';
  } else {
    document.body.style.direction = 'ltr';
  }
}

// Save settings to Chrome storage
function saveSettings() {
  try {
    // Get selected export format
    const formatRadio = document.querySelector('input[name="export-format"]:checked');
    const exportFormat = formatRadio ? formatRadio.value : 'csv';
    
    // Get selected language
    const languageSelect = document.getElementById('language-select');
    const language = languageSelect ? languageSelect.value : 'he';
    
    console.log("Saving settings - Format:", exportFormat, "Language:", language);
    
    // Define all UI text translations
    const translations = {
      'he': {
        headerTitle: 'הגדרות ייצוא סקרי וואטסאפ',
        formatLabel: 'פורמט ייצוא:',
        languageLabel: 'שפה:',
        htmlExcelLabel: 'Excel (HTML) - תואם לכל גרסה',
        csvLabel: 'CSV - נתונים ללא עיצוב',
        saveButton: 'שמור הגדרות',
        successMessage: 'נשמר בהצלחה!',
        errorMessage: 'שגיאה בשמירה',
        creditText: 'פותח ע״י תחום ניהו"ג'
      },
      'en': {
        headerTitle: 'WhatsApp Poll Export Settings',
        formatLabel: 'Export Format:',
        languageLabel: 'Language:',
        htmlExcelLabel: 'Excel (HTML) - Compatible with all versions',
        csvLabel: 'CSV - Unformatted data',
        saveButton: 'Save Settings',
        successMessage: 'Saved successfully!',
        errorMessage: 'Error saving settings',
        creditText: 'Developed by Nihug Department'
      },
      'es': {
        headerTitle: 'Configuración de Exportación de Encuestas',
        formatLabel: 'Formato de Exportación:',
        languageLabel: 'Idioma:',
        htmlExcelLabel: 'Excel (HTML) - Compatible con todas las versiones',
        csvLabel: 'CSV - Datos sin formato',
        saveButton: 'Guardar Configuración',
        successMessage: '¡Guardado con éxito!',
        errorMessage: 'Error al guardar',
        creditText: 'Desarrollado por Nihug Departamento'
      },
      'fr': {
        headerTitle: 'Paramètres d\'Exportation des Sondages',
        formatLabel: 'Format d\'Exportation:',
        languageLabel: 'Langue:',
        htmlExcelLabel: 'Excel (HTML) - Compatible avec toutes les versions',
        csvLabel: 'CSV - Données non formatées',
        saveButton: 'Enregistrer les Paramètres',
        successMessage: 'Enregistré avec succès!',
        errorMessage: 'Erreur d\'enregistrement',
        creditText: 'Développé par Nihug Département'
      }
    };
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      exportFormat: exportFormat,
      language: language
    }, function() {
      // Show success message
      const statusMessage = document.getElementById('status-message');
      if (statusMessage) {
        const texts = translations[language] || translations['he'];
        statusMessage.textContent = texts.successMessage;
        
        // Clear message after 2 seconds
        setTimeout(function() {
          statusMessage.textContent = '';
        }, 2000);
      }
      
      // Notify active WhatsApp tabs
      notifyActiveWhatsAppTabs();
    });
  } catch (err) {
    console.error("Error saving settings:", err);
    // Show error message
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      const language = document.getElementById('language-select')?.value || 'he';
      const translations = {
        'he': { errorMessage: 'שגיאה בשמירה' },
        'en': { errorMessage: 'Error saving settings' },
        'es': { errorMessage: 'Error al guardar' },
        'fr': { errorMessage: 'Erreur d\'enregistrement' }
      };
      const texts = translations[language] || translations['he'];
      statusMessage.textContent = texts.errorMessage;
      statusMessage.style.color = 'red';
      
      // Clear error after 3 seconds
      setTimeout(function() {
        statusMessage.textContent = '';
        statusMessage.style.color = '';
      }, 3000);
    }
  }
}

// Function to notify all active WhatsApp tabs about settings changes
function notifyActiveWhatsAppTabs() {
  try {
    chrome.tabs.query({url: "*://web.whatsapp.com/*"}, function(tabs) {
      if (tabs && tabs.length > 0) {
        console.log("Notifying", tabs.length, "WhatsApp tabs about settings change");
        
        // Get current settings
        const formatRadio = document.querySelector('input[name="export-format"]:checked');
        const exportFormat = formatRadio ? formatRadio.value : 'csv';
        
        const languageSelect = document.getElementById('language-select');
        const language = languageSelect ? languageSelect.value : 'he';
        
        // Send message to each tab with the actual settings
        tabs.forEach(function(tab) {
          try {
            chrome.tabs.sendMessage(tab.id, {
              action: 'updateSettings',
              settings: {
                exportFormat: exportFormat,
                language: language
              }
            }, function(response) {
              // Handle possible errors in sendMessage response
              if (chrome.runtime.lastError) {
                console.log("Tab notification error:", chrome.runtime.lastError);
              } else {
                console.log("Tab notification response:", response);
              }
            });
            
            // Also try to send a direct message to the page using executeScript
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: (settings) => {
                // Send message directly to the page
                window.postMessage({
                  source: 'WAVoteExporterPopup',
                  updateSettings: true,
                  settings: settings
                }, "*");
              },
              args: [{ exportFormat, language }]
            }).catch(err => {
              console.log("Script execution fallback error:", err);
            });
          } catch (err) {
            console.error("Error sending message to tab:", err);
            
            // Fallback: Try injecting a script if messaging fails
            try {
              chrome.tabs.executeScript(tab.id, {
                code: `
                  window.postMessage({
                    source: 'WAVoteExporterPopup',
                    updateSettings: true,
                    settings: {
                      exportFormat: '${exportFormat}',
                      language: '${language}'
                    }
                  }, "*");
                `
              });
            } catch (execErr) {
              console.error("Execute script fallback error:", execErr);
            }
          }
        });
      }
    });
  } catch (err) {
    console.error("Error notifying tabs:", err);
  }
}

// Send message to content script when a tab is activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url && tab.url.includes('web.whatsapp.com')) {
      chrome.tabs.sendMessage(activeInfo.tabId, {
        action: 'updateSettings'
      });
    }
  });
});

// Function to save user preferences
function saveOptions() {
  const exportFormat = document.getElementById('export-format').value;
  const language = document.getElementById('language').value;
  
  // Log what we're saving for debugging
  console.log(`Saving options: Format=${exportFormat}, Language=${language}`);
  
  // Ensure format is valid
  const validFormats = ['xlsx', 'html-excel', 'csv'];
  const validLanguages = ['he', 'en', 'es', 'fr'];
  
  if (!validFormats.includes(exportFormat)) {
    console.error(`Invalid format: ${exportFormat}, defaulting to xlsx`);
    exportFormat = 'xlsx';
  }
  
  if (!validLanguages.includes(language)) {
    console.error(`Invalid language: ${language}, defaulting to he`);
    language = 'he';
  }
  
  chrome.storage.sync.set({
    exportFormat: exportFormat,
    language: language
  }, function() {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    
    // Send message to content script to update settings
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings'
        }, function(response) {
          console.log('Settings update message sent to content script', response);
        });
      }
    });
    
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
} 