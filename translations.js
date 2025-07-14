// Language translations file
// You can manually edit the translations in this file

const translations = {
  // Hebrew translations
  'he': {
    'pollName': 'שם הסקר',
    'pollCreatedDate': 'תאריך יצירת הסקר',
    'pollCreatedTime': 'שעת יצירת הסקר',
    'total': 'סה"כ',
    'name': 'שם',
    'phone': 'טלפון',
    'responseDate': 'תאריך תגובה',
    'responseTime': 'שעת תגובה',
    // Add any new translations below
  },
  
  // English translations
  'en': {
    'pollName': 'Poll Name',
    'pollCreatedDate': 'Poll created date',
    'pollCreatedTime': 'Poll created time',
    'total': 'Total',
    'name': 'Name',
    'phone': 'Phone',
    'responseDate': 'Response Date',
    'responseTime': 'Response Time',
    // Add any new translations below
  },
  
  // Spanish translations
  'es': {
    'pollName': 'Nombre de la encuesta',
    'pollCreatedDate': 'Fecha de creación',
    'pollCreatedTime': 'Hora de creación',
    'total': 'Total',
    'name': 'Nombre',
    'phone': 'Teléfono',
    'responseDate': 'Fecha de respuesta',
    'responseTime': 'Hora de respuesta'
  },

  // French translations
  'fr': {
    'pollName': 'Nom du sondage',
    'pollCreatedDate': 'Date de création',
    'pollCreatedTime': 'Heure de création', 
    'total': 'Total',
    'name': 'Nom',
    'phone': 'Téléphone',
    'responseDate': 'Date de réponse',
    'responseTime': 'Heure de réponse'
  },
  // You can add additional languages here
  // Example:
  // 'fr': {
  //   'pollName': 'Nom du sondage',
  //   'pollCreatedDate': 'Date de création',
  //   ...and so on
  // }
};

// Helper function to get translation
function getTranslation(key, language) {
  // Default to Hebrew if language not supported
  const lang = translations[language] ? language : 'he';
  return translations[lang][key] || key;
}

// Make translations available for import
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, getTranslation };
} 