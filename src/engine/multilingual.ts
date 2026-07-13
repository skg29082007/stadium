/**
 * Multilingual Engine — Translation System
 *
 * Provides translations for key UI strings and AI assistant responses
 * in 5 official FIFA languages: English, Spanish, French, Portuguese, Arabic.
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'pt' | 'ar';

interface TranslationMap {
  [key: string]: Record<SupportedLocale, string>;
}

const translations: TranslationMap = {
  // Navigation & Wayfinding
  'find_seat': {
    en: 'Find My Seat', es: 'Encontrar mi Asiento', fr: 'Trouver ma Place',
    pt: 'Encontrar meu Assento', ar: 'ابحث عن مقعدي',
  },
  'restroom': {
    en: 'Restroom', es: 'Baños', fr: 'Toilettes',
    pt: 'Banheiro', ar: 'دورة المياه',
  },
  'food': {
    en: 'Food & Drinks', es: 'Comida y Bebidas', fr: 'Nourriture et Boissons',
    pt: 'Comida e Bebidas', ar: 'طعام ومشروبات',
  },
  'emergency': {
    en: 'Emergency', es: 'Emergencia', fr: 'Urgence',
    pt: 'Emergência', ar: 'طوارئ',
  },
  'exit': {
    en: 'Exit', es: 'Salida', fr: 'Sortie',
    pt: 'Saída', ar: 'مخرج',
  },
  'transit': {
    en: 'Transit', es: 'Transporte', fr: 'Transport',
    pt: 'Transporte', ar: 'مواصلات',
  },

  // AI Assistant
  'welcome': {
    en: 'Welcome to the FIFA World Cup 2026!',
    es: '¡Bienvenido a la Copa Mundial FIFA 2026!',
    fr: 'Bienvenue à la Coupe du Monde FIFA 2026 !',
    pt: 'Bem-vindo à Copa do Mundo FIFA 2026!',
    ar: '!مرحباً بكم في كأس العالم FIFA 2026',
  },
  'ask_anything': {
    en: 'Ask me anything... 🏟️',
    es: 'Pregúntame lo que sea... 🏟️',
    fr: 'Demandez-moi n\'importe quoi... 🏟️',
    pt: 'Pergunte-me qualquer coisa... 🏟️',
    ar: '🏟️ ...اسألني أي شيء',
  },
  'how_can_help': {
    en: 'How can I help you today?',
    es: '¿Cómo puedo ayudarte hoy?',
    fr: 'Comment puis-je vous aider aujourd\'hui ?',
    pt: 'Como posso ajudá-lo hoje?',
    ar: 'كيف يمكنني مساعدتك اليوم؟',
  },
  'nearest_restroom': {
    en: 'Nearest restroom', es: 'Baño más cercano', fr: 'Toilettes les plus proches',
    pt: 'Banheiro mais próximo', ar: 'أقرب دورة مياه',
  },
  'find_food': {
    en: 'Find food', es: 'Buscar comida', fr: 'Trouver à manger',
    pt: 'Encontrar comida', ar: 'ابحث عن طعام',
  },
  'whats_score': {
    en: "What's the score?", es: '¿Cuál es el marcador?', fr: 'Quel est le score ?',
    pt: 'Qual é o placar?', ar: 'ما هي النتيجة؟',
  },
  'medical_help': {
    en: 'Medical help', es: 'Ayuda médica', fr: 'Aide médicale',
    pt: 'Ajuda médica', ar: 'مساعدة طبية',
  },

  // Sustainability
  'sustainability': {
    en: 'Sustainability', es: 'Sostenibilidad', fr: 'Durabilité',
    pt: 'Sustentabilidade', ar: 'الاستدامة',
  },
  'recycling_station': {
    en: 'Where is the nearest recycling station?',
    es: '¿Dónde está la estación de reciclaje más cercana?',
    fr: 'Où se trouve la station de recyclage la plus proche ?',
    pt: 'Onde fica a estação de reciclagem mais próxima?',
    ar: 'أين أقرب محطة إعادة تدوير؟',
  },
  'water_fountain': {
    en: 'Where can I refill my water bottle?',
    es: '¿Dónde puedo rellenar mi botella de agua?',
    fr: 'Où puis-je remplir ma bouteille d\'eau ?',
    pt: 'Onde posso reabastecer minha garrafa de água?',
    ar: 'أين يمكنني إعادة ملء زجاجة المياه الخاصة بي؟',
  },

  // Staff Operations
  'incident_report': {
    en: 'Incident Report', es: 'Informe de Incidente', fr: 'Rapport d\'Incident',
    pt: 'Relatório de Incidente', ar: 'تقرير الحادث',
  },
  'quick_report': {
    en: 'Quick Report', es: 'Informe Rápido', fr: 'Rapport Rapide',
    pt: 'Relatório Rápido', ar: 'تقرير سريع',
  },
};

/**
 * Get a translated string by key and locale.
 * Falls back to English if translation is missing.
 */
export function t(key: string, locale: string = 'en'): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale as SupportedLocale] || entry['en'] || key;
}

/**
 * Get the text direction for a locale (RTL for Arabic).
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Get all available translation keys.
 */
export function getTranslationKeys(): string[] {
  return Object.keys(translations);
}
