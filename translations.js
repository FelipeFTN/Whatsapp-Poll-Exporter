const translations = {
  en: {
    pollName:        'Poll Name',
    pollCreatedDate: 'Poll Created Date',
    pollCreatedTime: 'Poll Created Time',
    total:           'Total',
    name:            'Name',
    phone:           'Phone',
    responseDate:    'Response Date',
    responseTime:    'Response Time',
    ui: {
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
    }
  },
  he: {
    pollName:        'שם הסקר',
    pollCreatedDate: 'תאריך יצירת הסקר',
    pollCreatedTime: 'שעת יצירת הסקר',
    total:           'סה"כ',
    name:            'שם',
    phone:           'טלפון',
    responseDate:    'תאריך תגובה',
    responseTime:    'שעת תגובה',
    ui: {
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
    }
  },
  es: {
    pollName:        'Nombre de la encuesta',
    pollCreatedDate: 'Fecha de creación',
    pollCreatedTime: 'Hora de creación',
    total:           'Total',
    name:            'Nombre',
    phone:           'Teléfono',
    responseDate:    'Fecha de respuesta',
    responseTime:    'Hora de respuesta',
    ui: {
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
    }
  },
  fr: {
    pollName:        'Nom du sondage',
    pollCreatedDate: 'Date de création',
    pollCreatedTime: 'Heure de création',
    total:           'Total',
    name:            'Nom',
    phone:           'Téléphone',
    responseDate:    'Date de réponse',
    responseTime:    'Heure de réponse',
    ui: {
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
    }
  },
  pt: {
    pollName:        'Nome da enquete',
    pollCreatedDate: 'Data de criação',
    pollCreatedTime: 'Hora de criação',
    total:           'Total',
    name:            'Nome',
    phone:           'Telefone',
    responseDate:    'Data da resposta',
    responseTime:    'Hora da resposta',
    ui: {
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
  },
  ar: {
    pollName:        'اسم الاستطلاع',
    pollCreatedDate: 'تاريخ الإنشاء',
    pollCreatedTime: 'وقت الإنشاء',
    total:           'المجموع',
    name:            'الاسم',
    phone:           'الهاتف',
    responseDate:    'تاريخ الإجابة',
    responseTime:    'وقت الإجابة',
    ui: {
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
    }
  }
};

const RTL_LANGUAGES = new Set(['he', 'ar']);

function getTranslation(key, language) {
  const lang = translations[language] ? language : 'en';
  return translations[lang][key] || translations['en'][key] || key;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, getTranslation, RTL_LANGUAGES };
}
