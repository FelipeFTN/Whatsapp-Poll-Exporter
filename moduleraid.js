/*
* moduleRaid v6
 * https://github.com/wwebjs/moduleRaid
 *
 * Copyright pixeldesu, pedroslopez, purpshell and other contributors
 * Licensed under the MIT License
 * https://github.com/wwebjs/moduleRaid/blob/master/LICENSE
 */

// Resolve an extension resource URL regardless of browser context.
// moduleraid.js runs in page context where chrome.runtime is unavailable on Firefox.
// script.js sets window.__WA_EXT_URL before injecting this file as a bridge.
function extURL(filename) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(filename);
  }
  return (window.__WA_EXT_URL || '') + filename;
}

// Load libphonenumber-js library for phone number formatting
let libphonenumber = null;
let libphonenumberReady = false;

// Function to load libphonenumber-js library
function loadLibphonenumber() {
  try {
    const script = document.createElement('script');
    script.src = extURL('libphonenumber-js.min.js');
    script.id = 'libphonenumber-script';
    
    script.onload = () => {
      console.log('libphonenumber-js loaded successfully');
      if (window.libphonenumber) {
        libphonenumber = window.libphonenumber;
        libphonenumberReady = true;
        console.log('libphonenumber object available:', !!libphonenumber.parsePhoneNumber);
      }
    };
    
    script.onerror = (error) => {
      console.error('Error loading libphonenumber-js:', error);
    };
    
    document.head.appendChild(script);
  } catch (err) {
    console.error('Failed to load libphonenumber-js:', err);
  }
}

// Enhanced phone formatting function using libphonenumber-js
function formatPhoneWithLib(phoneNumber, forXLSX = false) {
  if (!phoneNumber) {
    return "'Unknown";
  }
  
  // Convert to string if it's a number to prevent scientific notation
  let phoneStr = String(phoneNumber);
  
  // Enhanced phone number cleaning and validation
  let cleanedNumber = cleanPhoneNumber(phoneStr);
  
  // Debug logging
  console.log(`Processing phone number: ${phoneStr} -> cleaned: ${cleanedNumber}`);
  
  // If libphonenumber is available, use it for formatting
  if (libphonenumberReady && libphonenumber && libphonenumber.parsePhoneNumber) {
    try {
      const parsed = libphonenumber.parsePhoneNumber(cleanedNumber);
      if (parsed && parsed.isValid()) {
        const country = parsed.country;
        console.log(`Formatting phone ${cleanedNumber} for country: ${country}`);
        
        return formatPhoneByCountry(parsed, country, forXLSX);
      }
    } catch (err) {
      console.error('Error formatting phone with libphonenumber:', err);
      // Try alternative parsing methods
      const alternativeResult = tryAlternativePhoneParsing(cleanedNumber, forXLSX);
      if (alternativeResult) return alternativeResult;
    }
  } else {
    console.warn('libphonenumber not ready, using fallback for:', cleanedNumber);
  }
  
  // Try Israeli number detection first
  const israeliResult = detectAndFormatIsraeliNumber(cleanedNumber, forXLSX);
  if (israeliResult) {
    return israeliResult;
  }
  
  // Enhanced fallback formatting with better Israeli number handling
  return formatPhoneFallbackEnhanced(cleanedNumber, forXLSX);
}

// Enhanced phone number cleaning function with better Israeli support
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return null;
  }
  
  // Convert to string if it's a number to prevent scientific notation
  let phoneStr = String(phoneNumber);
  let cleaned = phoneStr.trim();
  
  // Remove WhatsApp-specific suffixes
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  
  // Remove various prefixes and formatting
  cleaned = cleaned.replace(/^['"`]/, ''); // Remove quote prefixes
  cleaned = cleaned.replace(/[\s\-().]/g, ''); // Remove spaces, dashes, dots, parentheses
  
  console.log(`Cleaning phone: ${phoneStr} -> initial clean: ${cleaned}`);
  
  // Enhanced Israeli number detection and cleaning
  if (cleaned.startsWith('00972')) {
    cleaned = '+972' + cleaned.substring(5);
  } else if (cleaned.startsWith('0972')) {
    cleaned = '+972' + cleaned.substring(4);
  } else if (cleaned.startsWith('972')) {
    cleaned = '+972' + cleaned.substring(3);
  } else if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    // Likely international format without +
    cleaned = '+' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+') && cleaned.length > 7) {
    // Enhanced Israeli number detection
    if (/^5\d{8}$/.test(cleaned)) {
      // Israeli mobile number
      cleaned = '+972' + cleaned;
    } else if (/^[2-489]\d{7,8}$/.test(cleaned)) {
      // Israeli landline or other numbers
      cleaned = '+972' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  console.log(`Phone after special case handling: ${cleaned}`);
  
  // Validate the cleaned number
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    console.warn('Invalid phone number format:', phoneStr, '-> cleaned:', cleaned);
    return phoneStr; // Return original as string if cleaning failed
  }
  
  return cleaned;
}

// Enhanced country-specific formatting
function formatPhoneByCountry(parsed, country, forXLSX = false) {
  try {
    let formatted = '';
    
    switch (country) {
      case 'IL': // Israel
        formatted = formatIsraeliPhone(parsed);
        break;
      case 'US': // United States
        formatted = formatUSPhone(parsed);
        break;
      case 'GB': // United Kingdom
        formatted = formatUKPhone(parsed);
        break;
      case 'FR': // France
        formatted = formatFrenchPhone(parsed);
        break;
      case 'DE': // Germany
        formatted = formatGermanPhone(parsed);
        break;
      case 'ES': // Spain
        formatted = formatSpanishPhone(parsed);
        break;
      case 'IT': // Italy
        formatted = formatItalianPhone(parsed);
        break;
      case 'CA': // Canada
        formatted = formatCanadianPhone(parsed);
        break;
      case 'AU': // Australia
        formatted = formatAustralianPhone(parsed);
        break;
      case 'IN': // India
        formatted = formatIndianPhone(parsed);
        break;
      case 'BR': // Brazil
        formatted = formatBrazilianPhone(parsed);
        break;
      case 'AR': // Argentina
        formatted = formatArgentinianPhone(parsed);
        break;
      case 'MX': // Mexico
        formatted = formatMexicanPhone(parsed);
        break;
      case 'JP': // Japan
        formatted = formatJapanesePhone(parsed);
        break;
      case 'KR': // South Korea
        formatted = formatKoreanPhone(parsed);
        break;
      case 'CN': // China
        formatted = formatChinesePhone(parsed);
        break;
      case 'RU': // Russia
        formatted = formatRussianPhone(parsed);
        break;
      case 'TR': // Turkey
        formatted = formatTurkishPhone(parsed);
        break;
      case 'EG': // Egypt
        formatted = formatEgyptianPhone(parsed);
        break;
      case 'SA': // Saudi Arabia
        formatted = formatSaudiPhone(parsed);
        break;
      case 'AE': // UAE
        formatted = formatUAEPhone(parsed);
        break;
      case 'ZA': // South Africa
        formatted = formatSouthAfricanPhone(parsed);
        break;
      case 'NG': // Nigeria
        formatted = formatNigerianPhone(parsed);
        break;
      case 'KE': // Kenya
        formatted = formatKenyanPhone(parsed);
        break;
      case 'GH': // Ghana
        formatted = formatGhanianPhone(parsed);
        break;
      case 'TH': // Thailand
        formatted = formatThaiPhone(parsed);
        break;
      case 'VN': // Vietnam
        formatted = formatVietnamesePhone(parsed);
        break;
      case 'PH': // Philippines
        formatted = formatPhilippinePhone(parsed);
        break;
      case 'ID': // Indonesia
        formatted = formatIndonesianPhone(parsed);
        break;
      case 'MY': // Malaysia
        formatted = formatMalaysianPhone(parsed);
        break;
      case 'SG': // Singapore
        formatted = formatSingaporeanPhone(parsed);
        break;
      case 'NZ': // New Zealand
        formatted = formatNewZealandPhone(parsed);
        break;
      case 'CH': // Switzerland
        formatted = formatSwissPhone(parsed);
        break;
      case 'AT': // Austria
        formatted = formatAustrianPhone(parsed);
        break;
      case 'BE': // Belgium
        formatted = formatBelgianPhone(parsed);
        break;
      case 'NL': // Netherlands
        formatted = formatDutchPhone(parsed);
        break;
      case 'SE': // Sweden
        formatted = formatSwedishPhone(parsed);
        break;
      case 'NO': // Norway
        formatted = formatNorwegianPhone(parsed);
        break;
      case 'DK': // Denmark
        formatted = formatDanishPhone(parsed);
        break;
      case 'FI': // Finland
        formatted = formatFinnishPhone(parsed);
        break;
      case 'PL': // Poland
        formatted = formatPolishPhone(parsed);
        break;
      case 'CZ': // Czech Republic
        formatted = formatCzechPhone(parsed);
        break;
      case 'HU': // Hungary
        formatted = formatHungarianPhone(parsed);
        break;
      case 'RO': // Romania
        formatted = formatRomanianPhone(parsed);
        break;
      case 'GR': // Greece
        formatted = formatGreekPhone(parsed);
        break;
      case 'PT': // Portugal
        formatted = formatPortuguesePhone(parsed);
        break;
      case 'IE': // Ireland
        formatted = formatIrishPhone(parsed);
        break;
      case 'IS': // Iceland
        formatted = formatIcelandicPhone(parsed);
        break;
      case 'LU': // Luxembourg
        formatted = formatLuxembourgPhone(parsed);
        break;
      case 'MT': // Malta
        formatted = formatMaltesePhone(parsed);
        break;
      case 'CY': // Cyprus
        formatted = formatCypriotPhone(parsed);
        break;
      case 'EE': // Estonia
        formatted = formatEstonianPhone(parsed);
        break;
      case 'LV': // Latvia
        formatted = formatLatvianPhone(parsed);
        break;
      case 'LT': // Lithuania
        formatted = formatLithuanianPhone(parsed);
        break;
      case 'SK': // Slovakia
        formatted = formatSlovakPhone(parsed);
        break;
      case 'SI': // Slovenia
        formatted = formatSlovenianPhone(parsed);
        break;
      case 'HR': // Croatia
        formatted = formatCroatianPhone(parsed);
        break;
      case 'BA': // Bosnia and Herzegovina
        formatted = formatBosnianPhone(parsed);
        break;
      case 'RS': // Serbia
        formatted = formatSerbianPhone(parsed);
        break;
      case 'ME': // Montenegro
        formatted = formatMontenegrinPhone(parsed);
        break;
      case 'MK': // North Macedonia
        formatted = formatMacedonianPhone(parsed);
        break;
      case 'AL': // Albania
        formatted = formatAlbanianPhone(parsed);
        break;
      case 'BG': // Bulgaria
        formatted = formatBulgarianPhone(parsed);
        break;
      case 'MD': // Moldova
        formatted = formatMoldovanPhone(parsed);
        break;
      case 'UA': // Ukraine
        formatted = formatUkrainianPhone(parsed);
        break;
      case 'BY': // Belarus
        formatted = formatBelarusianPhone(parsed);
        break;
      case 'GE': // Georgia
        formatted = formatGeorgianPhone(parsed);
        break;
      case 'AM': // Armenia
        formatted = formatArmenianPhone(parsed);
        break;
      case 'AZ': // Azerbaijan
        formatted = formatAzerbaijaniPhone(parsed);
        break;
      case 'KZ': // Kazakhstan
        formatted = formatKazakhPhone(parsed);
        break;
      case 'UZ': // Uzbekistan
        formatted = formatUzbekPhone(parsed);
        break;
      case 'TM': // Turkmenistan
        formatted = formatTurkmenPhone(parsed);
        break;
      case 'KG': // Kyrgyzstan
        formatted = formatKyrgyzPhone(parsed);
        break;
      case 'TJ': // Tajikistan
        formatted = formatTajikPhone(parsed);
        break;
      case 'AF': // Afghanistan
        formatted = formatAfghanPhone(parsed);
        break;
      case 'PK': // Pakistan
        formatted = formatPakistaniPhone(parsed);
        break;
      case 'BD': // Bangladesh
        formatted = formatBangladeshiPhone(parsed);
        break;
      case 'LK': // Sri Lanka
        formatted = formatSriLankanPhone(parsed);
        break;
      case 'NP': // Nepal
        formatted = formatNepalesePhone(parsed);
        break;
      case 'MM': // Myanmar
        formatted = formatMyanmarPhone(parsed);
        break;
      case 'KH': // Cambodia
        formatted = formatCambodianPhone(parsed);
        break;
      case 'LA': // Laos
        formatted = formatLaotianPhone(parsed);
        break;
      case 'MN': // Mongolia
        formatted = formatMongolianPhone(parsed);
        break;
      case 'KP': // North Korea
        formatted = formatNorthKoreanPhone(parsed);
        break;
      case 'MO': // Macau
        formatted = formatMacauPhone(parsed);
        break;
      case 'HK': // Hong Kong
        formatted = formatHongKongPhone(parsed);
        break;
      case 'TW': // Taiwan
        formatted = formatTaiwanesePhone(parsed);
        break;
      case 'JO': // Jordan
        formatted = formatJordanianPhone(parsed);
        break;
      case 'LB': // Lebanon
        formatted = formatLebanesePhone(parsed);
        break;
      case 'SY': // Syria
        formatted = formatSyrianPhone(parsed);
        break;
      case 'IQ': // Iraq
        formatted = formatIraqiPhone(parsed);
        break;
      case 'IR': // Iran
        formatted = formatIranianPhone(parsed);
        break;
      case 'KW': // Kuwait
        formatted = formatKuwaitiPhone(parsed);
        break;
      case 'BH': // Bahrain
        formatted = formatBahrainiPhone(parsed);
        break;
      case 'QA': // Qatar
        formatted = formatQatariPhone(parsed);
        break;
      case 'OM': // Oman
        formatted = formatOmaniPhone(parsed);
        break;
      case 'YE': // Yemen
        formatted = formatYemeniPhone(parsed);
        break;
      case 'PS': // Palestine
        formatted = formatPalestinianPhone(parsed);
        break;
      case 'ET': // Ethiopia
        formatted = formatEthiopianPhone(parsed);
        break;
      case 'SO': // Somalia
        formatted = formatSomaliPhone(parsed);
        break;
      case 'DJ': // Djibouti
        formatted = formatDjiboutiPhone(parsed);
        break;
      case 'ER': // Eritrea
        formatted = formatEritreanPhone(parsed);
        break;
      case 'SD': // Sudan
        formatted = formatSudanesePhone(parsed);
        break;
      case 'SS': // South Sudan
        formatted = formatSouthSudanesePhone(parsed);
        break;
      case 'TD': // Chad
        formatted = formatChadianPhone(parsed);
        break;
      case 'CF': // Central African Republic
        formatted = formatCentralAfricanPhone(parsed);
        break;
      case 'CM': // Cameroon
        formatted = formatCameroonianPhone(parsed);
        break;
      case 'GQ': // Equatorial Guinea
        formatted = formatEquatorialGuineanPhone(parsed);
        break;
      case 'GA': // Gabon
        formatted = formatGabonesePhone(parsed);
        break;
      case 'CG': // Republic of the Congo
        formatted = formatCongoPhone(parsed);
        break;
      case 'CD': // Democratic Republic of the Congo
        formatted = formatDRCongoPhone(parsed);
        break;
      case 'AO': // Angola
        formatted = formatAngolanPhone(parsed);
        break;
      case 'ZM': // Zambia
        formatted = formatZambianPhone(parsed);
        break;
      case 'ZW': // Zimbabwe
        formatted = formatZimbabweanPhone(parsed);
        break;
      case 'BW': // Botswana
        formatted = formatBotswanianPhone(parsed);
        break;
      case 'NA': // Namibia
        formatted = formatNamibianPhone(parsed);
        break;
      case 'LS': // Lesotho
        formatted = formatLesothoPhone(parsed);
        break;
      case 'SZ': // Eswatini
        formatted = formatSwatiPhone(parsed);
        break;
      case 'MZ': // Mozambique
        formatted = formatMozambicanPhone(parsed);
        break;
      case 'MW': // Malawi
        formatted = formatMalawianPhone(parsed);
        break;
      case 'TZ': // Tanzania
        formatted = formatTanzanianPhone(parsed);
        break;
      case 'UG': // Uganda
        formatted = formatUgandanPhone(parsed);
        break;
      case 'RW': // Rwanda
        formatted = formatRwandanPhone(parsed);
        break;
      case 'BI': // Burundi
        formatted = formatBurundianPhone(parsed);
        break;
      case 'MG': // Madagascar
        formatted = formatMalagasyPhone(parsed);
        break;
      case 'MU': // Mauritius
        formatted = formatMauritianPhone(parsed);
        break;
      case 'SC': // Seychelles
        formatted = formatSeychelloisPhone(parsed);
        break;
      case 'KM': // Comoros
        formatted = formatComorianPhone(parsed);
        break;
      case 'YT': // Mayotte
        formatted = formatMayottePhone(parsed);
        break;
      case 'RE': // Réunion
        formatted = formatReunionPhone(parsed);
        break;
      case 'MR': // Mauritania
        formatted = formatMauritanianPhone(parsed);
        break;
      case 'ML': // Mali
        formatted = formatMalianPhone(parsed);
        break;
      case 'BF': // Burkina Faso
        formatted = formatBurkinabePhone(parsed);
        break;
      case 'NE': // Niger
        formatted = formatNigerienPhone(parsed);
        break;
      case 'CI': // Côte d'Ivoire
        formatted = formatIvorianPhone(parsed);
        break;
      case 'GN': // Guinea
        formatted = formatGuineanPhone(parsed);
        break;
      case 'GW': // Guinea-Bissau
        formatted = formatGuineaBissauPhone(parsed);
        break;
      case 'LR': // Liberia
        formatted = formatLiberianPhone(parsed);
        break;
      case 'SL': // Sierra Leone
        formatted = formatSierraLeoneanPhone(parsed);
        break;
      case 'SN': // Senegal
        formatted = formatSenegalesePhone(parsed);
        break;
      case 'GM': // Gambia
        formatted = formatGambianPhone(parsed);
        break;
      case 'CV': // Cape Verde
        formatted = formatCapeVerdeanPhone(parsed);
        break;
      case 'ST': // São Tomé and Príncipe
        formatted = formatSaoTomeanPhone(parsed);
        break;
      case 'TG': // Togo
        formatted = formatTogolesePhone(parsed);
        break;
      case 'BJ': // Benin
        formatted = formatBeninPhone(parsed);
        break;
      case 'DZ': // Algeria
        formatted = formatAlgerianPhone(parsed);
        break;
      case 'TN': // Tunisia
        formatted = formatTunisianPhone(parsed);
        break;
      case 'LY': // Libya
        formatted = formatLibyanPhone(parsed);
        break;
      case 'MA': // Morocco
        formatted = formatMoroccanPhone(parsed);
        break;
      case 'EH': // Western Sahara
        formatted = formatWesternSaharanPhone(parsed);
        break;
      default:
        // For other countries, use national format
        formatted = formatGenericPhone(parsed);
        break;
    }
    
    console.log(`${country} number formatted: ${formatted}`);
    
    if (forXLSX) {
      return `=TEXT("${formatted}", "@")`;
    }
    return "'" + formatted;
  } catch (err) {
    console.error(`Error formatting ${country} phone:`, err);
    // Fallback to national format
    try {
      const nationalFormat = parsed.formatNational();
      if (forXLSX) {
        return `=TEXT("${nationalFormat}", "@")`;
      }
      return "'" + nationalFormat;
    } catch (fallbackErr) {
      console.error('Fallback formatting also failed:', fallbackErr);
      return formatPhoneFallback(parsed.number || '', forXLSX);
    }
  }
}

// Israeli phone formatting function
function formatIsraeliPhone(parsed) {
  try {
    const nationalNumber = parsed.nationalNumber;
    let formatted;
    
    // Israeli mobile numbers that start with 5 should be formatted as 05X-XXXXXXX
    if (nationalNumber.startsWith('5') && nationalNumber.length === 9) {
      // Format: 05X-XXXXXXX (like 053-6210104)
      formatted = '0' + nationalNumber.substring(0, 2) + '-' + nationalNumber.substring(2);
    }
    // For other Israeli numbers, use standard formatting
    else {
      const nationalFormat = parsed.formatNational();
      formatted = nationalFormat.replace(/^\+?972\s*/, '').trim();
      
      // Ensure it starts with 0 if it's a national number
      if (!formatted.startsWith('0') && /^\d/.test(formatted)) {
        formatted = '0' + formatted;
      }
      
      // Clean up any existing formatting and apply Israeli standard
      formatted = formatted.replace(/[\s\-().]/g, '');
      if (formatted.length >= 9) {
        formatted = formatted.substring(0, 3) + '-' + formatted.substring(3);
      }
    }
    
    return formatted;
  } catch (err) {
    console.error('Error formatting Israeli phone:', err);
    return parsed.formatNational();
  }
}

// US phone formatting function
function formatUSPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?1\s*/, '');
  } catch (err) {
    console.error('Error formatting US phone:', err);
    return parsed.formatNational();
  }
}

// UK phone formatting function
function formatUKPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?44\s*/, '').replace(/^0/, '0');
  } catch (err) {
    console.error('Error formatting UK phone:', err);
    return parsed.formatNational();
  }
}

// Add more country-specific formatting functions
function formatFrenchPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?33\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGermanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?49\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSpanishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?34\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatItalianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?39\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCanadianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?1\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAustralianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?61\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIndianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?91\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBrazilianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?55\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatArgentinianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?54\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMexicanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?52\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatJapanesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?81\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatKoreanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?82\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatChinesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?86\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatRussianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?7\s*/, '').replace(/^8/, '8');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTurkishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?90\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatEgyptianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?20\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSaudiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?966\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatUAEPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?971\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSouthAfricanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?27\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNigerianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?234\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatKenyanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?254\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGhanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?233\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatThaiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?66\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatVietnamesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?84\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatPhilippinePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?63\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIndonesianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?62\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMalaysianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?60\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSingaporeanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?65\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNewZealandPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?64\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSwissPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?41\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAustrianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?43\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBelgianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?32\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatDutchPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?31\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSwedishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?46\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNorwegianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?47\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatDanishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?45\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatFinnishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?358\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatPolishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?48\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCzechPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?420\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatHungarianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?36\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatRomanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?40\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGreekPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?30\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatPortuguesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?351\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIrishPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?353\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIcelandicPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?354\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLuxembourgPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?352\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMaltesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?356\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCypriotPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?357\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatEstonianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?372\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLatvianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?371\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLithuanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?370\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSlovakPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?421\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSlovenianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?386\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCroatianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?385\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBosnianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?387\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSerbianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?381\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMontenegrinPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?382\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMacedonianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?389\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAlbanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?355\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBulgarianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?359\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMoldovanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?373\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatUkrainianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?380\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBelarusianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?375\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGeorgianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?995\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatArmenianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?374\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAzerbaijaniPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?994\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatKazakhPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?7\s*/, '').replace(/^8/, '8');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatUzbekPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?998\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTurkmenPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?993\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatKyrgyzPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?996\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTajikPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?992\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAfghanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?93\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatPakistaniPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?92\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBangladeshiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?880\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSriLankanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?94\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNepalesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?977\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMyanmarPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?95\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCambodianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?855\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLaotianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?856\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMongolianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?976\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNorthKoreanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?850\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMacauPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?853\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatHongKongPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?852\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTaiwanesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?886\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatJordanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?962\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLebanesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?961\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSyrianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?963\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIraqiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?964\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIranianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?98\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatKuwaitiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?965\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBahrainiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?973\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatQatariPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?974\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatOmaniPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?968\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatYemeniPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?967\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatPalestinianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?970\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatEthiopianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?251\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSomaliPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?252\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatDjiboutiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?253\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatEritreanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?291\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSudanesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?249\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSouthSudanesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?211\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatChadianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?235\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCentralAfricanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?236\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCameroonianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?237\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatEquatorialGuineanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?240\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGabonesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?241\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCongoPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?242\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatDRCongoPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?243\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAngolanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?244\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatZambianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?260\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatZimbabweanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?263\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBotswanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?267\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNamibianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?264\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLesothoPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?266\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSwatiPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?268\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMozambicanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?258\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMalawianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?265\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTanzanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?255\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatUgandanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?256\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatRwandanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?250\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBurundianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?257\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMalagasyPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?261\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMauritianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?230\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSeychelloisPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?248\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatComorianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?269\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMayottePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?262\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatReunionPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?262\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMauritanianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?222\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMalianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?223\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBurkinabePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?226\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatNigerienPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?227\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatIvorianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?225\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGuineanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?224\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGuineaBissauPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?245\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLiberianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?231\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSierraLeoneanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?232\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSenegalesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?221\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatGambianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?220\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatCapeVerdeanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?238\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatSaoTomeanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?239\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTogolesePhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?228\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatBeninPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?229\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatAlgerianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?213\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatTunisianPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?216\s*/, '');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatLibyanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?218\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatMoroccanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?212\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

function formatWesternSaharanPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat.replace(/^\+?212\s*/, '').replace(/^0/, '0');
  } catch (err) {
    return parsed.formatNational();
  }
}

// Generic phone formatting function for countries not explicitly handled
function formatGenericPhone(parsed) {
  try {
    const nationalFormat = parsed.formatNational();
    return nationalFormat;
  } catch (err) {
    console.error('Error formatting generic phone:', err);
    return parsed.number || parsed.toString();
  }
}

// Enhanced alternative phone parsing methods for edge cases
function tryAlternativePhoneParsing(phoneNumber, forXLSX = false) {
  try {
    // CRITICAL: Convert to string immediately to prevent scientific notation
    let phoneStr = String(phoneNumber);
    console.log(`tryAlternativePhoneParsing: Converting ${phoneNumber} (${typeof phoneNumber}) to string: ${phoneStr}`);
    
    // Enhanced alternatives with special focus on Israeli numbers
    const alternatives = [
      phoneStr,
      phoneStr.replace(/^00/, '+'),
      phoneStr.replace(/^0/, '+'),
      '+' + phoneStr.replace(/^\+/, ''),
      phoneStr.replace(/[\s\-().]/g, ''),
      // Special Israeli alternatives
      '+972' + phoneStr.replace(/^0+/, ''),
      '+972' + phoneStr.replace(/^972/, '').replace(/^0+/, ''),
      phoneStr.replace(/^972/, '+972'),
      phoneStr.replace(/^00972/, '+972')
    ];
    
    console.log(`Trying alternative parsing for: ${phoneStr}`);
    
    for (const alt of alternatives) {
      try {
        if (libphonenumber && libphonenumber.parsePhoneNumber) {
          const parsed = libphonenumber.parsePhoneNumber(alt);
          if (parsed && parsed.isValid()) {
            console.log(`Alternative parsing success: ${phoneStr} -> ${alt} -> ${parsed.country}`);
            return formatPhoneByCountry(parsed, parsed.country, forXLSX);
          }
        }
      } catch (err) {
        // Continue to next alternative
      }
    }
    
    // If libphonenumber failed, try direct Israeli formatting
    if (phoneStr.includes('972') || phoneStr.startsWith('05') || /^5\d{8}$/.test(phoneStr.replace(/[^\d]/g, ''))) {
      console.log(`Forcing Israeli formatting for: ${phoneStr}`);
      return formatPhoneFallbackEnhanced(phoneStr, forXLSX);
    }
    
    return null;
  } catch (err) {
    console.error('Error in alternative phone parsing:', err);
    return null;
  }
}

// Enhanced fallback formatting with better Israeli number handling
function formatPhoneFallbackEnhanced(phoneNumber, forXLSX = false) {
  try {
    // CRITICAL: Convert to string immediately to prevent scientific notation
    let phoneStr = String(phoneNumber);
    console.log(`formatPhoneFallbackEnhanced: Converting ${phoneNumber} (${typeof phoneNumber}) to string: ${phoneStr}`);
    let formatted = phoneStr;
    
    console.log(`Using enhanced fallback for: ${phoneStr}`);
    
    // Enhanced Israeli number patterns - comprehensive detection
    if (formatted.startsWith('+972') || 
        formatted.startsWith('972') || 
        formatted.startsWith('00972') ||
        (formatted.startsWith('05') && formatted.length >= 9) ||
        (formatted.startsWith('02') && formatted.length >= 9) ||
        (formatted.startsWith('03') && formatted.length >= 9) ||
        (formatted.startsWith('04') && formatted.length >= 9) ||
        (formatted.startsWith('07') && formatted.length >= 9) ||
        (formatted.startsWith('08') && formatted.length >= 9) ||
        (formatted.startsWith('09') && formatted.length >= 9)) {
      
      // Clean the number first - multiple cleaning stages
      let israelNumber = formatted
        .replace(/^\+?972/, '')   // Remove country code
        .replace(/^00972/, '')    // Remove 00972 prefix
        .replace(/^0+/, '');      // Remove leading zeros
      
              console.log(`Israeli number processing: ${phoneStr} -> base: ${israelNumber}`);
        
        // If it's a 9-digit number starting with 5 (mobile)
        if (/^5\d{8}$/.test(israelNumber)) {
          formatted = '0' + israelNumber.substring(0, 2) + '-' + israelNumber.substring(2);
          console.log(`Israeli mobile formatted: ${phoneStr} -> ${formatted}`);
        }
        // If it's a 8-digit number starting with 2,3,4,7,8,9 (landline) 
        else if (/^[2-4789]\d{7}$/.test(israelNumber)) {
          formatted = '0' + israelNumber.substring(0, 2) + '-' + israelNumber.substring(2);
          console.log(`Israeli landline formatted: ${phoneStr} -> ${formatted}`);
        }
        // If it's already in national format (starts with 05, 02, etc.)
        else if (/^0[2-9]\d{7,8}$/.test('0' + israelNumber)) {
          const fullNumber = '0' + israelNumber;
          if (fullNumber.length === 10) { // Mobile
            formatted = fullNumber.substring(0, 3) + '-' + fullNumber.substring(3);
            console.log(`Israeli national mobile formatted: ${phoneStr} -> ${formatted}`);
          } else if (fullNumber.length === 9) { // Landline
            formatted = fullNumber.substring(0, 3) + '-' + fullNumber.substring(3);
            console.log(`Israeli national landline formatted: ${phoneStr} -> ${formatted}`);
          } else {
            formatted = fullNumber;
          }
        }
        // If it's in some other Israeli format
        else if (/^\d{7,9}$/.test(israelNumber)) {
          const fullNumber = '0' + israelNumber;
          if (fullNumber.length >= 9) {
            // Determine if it's mobile (10 digits) or landline (9 digits)
            if (fullNumber.length === 10 && fullNumber.startsWith('05')) {
              formatted = fullNumber.substring(0, 3) + '-' + fullNumber.substring(3);
            } else {
              formatted = fullNumber.substring(0, 3) + '-' + fullNumber.substring(3);
            }
            console.log(`Israeli general formatted: ${phoneStr} -> ${formatted}`);
          } else {
            formatted = fullNumber;
          }
        }
        // If the number already has correct Israeli format, just add dash if missing
        else if (/^0[2-9]\d{6,8}$/.test(formatted)) {
          if (formatted.length >= 9 && !formatted.includes('-')) {
            formatted = formatted.substring(0, 3) + '-' + formatted.substring(3);
            console.log(`Israeli dash added: ${phoneStr} -> ${formatted}`);
          }
        }
        else {
          // Default Israeli formatting - be more aggressive
          if (israelNumber.length >= 7) {
            formatted = '0' + israelNumber;
            if (formatted.length >= 9 && !formatted.includes('-')) {
              formatted = formatted.substring(0, 3) + '-' + formatted.substring(3);
            }
            console.log(`Israeli default formatted: ${phoneStr} -> ${formatted}`);
          } else {
            // Keep original if too short
            formatted = phoneStr;
            console.log(`Israeli number too short, keeping original: ${phoneStr}`);
          }
        }
    } 
    // US/Canada numbers
    else if (formatted.startsWith('+1') || 
             (formatted.length === 11 && formatted.startsWith('1'))) {
      let usNumber = formatted.replace(/^\+?1/, '');
      // Fix: Ensure US number is exactly 10 digits
      if (usNumber.length >= 10) {
        usNumber = usNumber.substring(0, 10); // Take only first 10 digits
        formatted = '(' + usNumber.substring(0, 3) + ') ' + usNumber.substring(3, 6) + '-' + usNumber.substring(6);
        console.log(`US number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        // Keep the +1 prefix for short numbers
        formatted = '+1 ' + usNumber;
        console.log(`US number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    } 
    // UK numbers
    else if (formatted.startsWith('+44')) {
      let ukNumber = formatted.replace(/^\+44/, '');
      if (ukNumber.length >= 10) {
        // Format as standard UK number
        formatted = '0' + ukNumber.substring(0, 2) + ' ' + ukNumber.substring(2, 6) + ' ' + ukNumber.substring(6, 10);
        console.log(`UK number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '0' + ukNumber;
        console.log(`UK number (short) formatted: ${phoneStr} -> ${formatted}`);
      }
    }
    // Indonesia numbers (+62)
    else if (formatted.startsWith('+62')) {
      let idNumber = formatted.replace(/^\+62/, '');
      if (idNumber.length >= 9) {
        // Indonesian mobile format: 08XX-XXXX-XXXX
        if (idNumber.startsWith('8')) {
          formatted = '0' + idNumber.substring(0, 3) + '-' + idNumber.substring(3, 7) + '-' + idNumber.substring(7, 11);
        } else {
          formatted = '0' + idNumber.substring(0, 2) + '-' + idNumber.substring(2, 6) + '-' + idNumber.substring(6, 10);
        }
        console.log(`Indonesia number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '+62 ' + idNumber;
        console.log(`Indonesia number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    }
    // South Africa numbers (+27)
    else if (formatted.startsWith('+27')) {
      let zaNumber = formatted.replace(/^\+27/, '');
      if (zaNumber.length >= 9) {
        // South African format: 0XX XXX XXXX
        formatted = '0' + zaNumber.substring(0, 2) + ' ' + zaNumber.substring(2, 5) + ' ' + zaNumber.substring(5, 9);
        console.log(`South Africa number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '+27 ' + zaNumber;
        console.log(`South Africa number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    }
    // Chile numbers (+56)
    else if (formatted.startsWith('+56')) {
      let clNumber = formatted.replace(/^\+56/, '');
      if (clNumber.length >= 8) {
        // Chilean mobile format: 9 XXXX XXXX
        if (clNumber.startsWith('9')) {
          formatted = clNumber.substring(0, 1) + ' ' + clNumber.substring(1, 5) + ' ' + clNumber.substring(5, 9);
        } else {
          formatted = clNumber.substring(0, 2) + ' ' + clNumber.substring(2, 5) + ' ' + clNumber.substring(5, 9);
        }
        console.log(`Chile number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '+56 ' + clNumber;
        console.log(`Chile number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    }
    // Brazil numbers (+55)
    else if (formatted.startsWith('+55')) {
      let brNumber = formatted.replace(/^\+55/, '');
      if (brNumber.length >= 10) {
        // Brazilian mobile format: (XX) 9XXXX-XXXX
        formatted = '(' + brNumber.substring(0, 2) + ') ' + brNumber.substring(2, 7) + '-' + brNumber.substring(7, 11);
        console.log(`Brazil number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '+55 ' + brNumber;
        console.log(`Brazil number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    }
    // Argentina numbers (+54)
    else if (formatted.startsWith('+54')) {
      let arNumber = formatted.replace(/^\+54/, '');
      if (arNumber.length >= 10) {
        // Argentine format: (XXX) XXX-XXXX
        formatted = '(' + arNumber.substring(0, 3) + ') ' + arNumber.substring(3, 6) + '-' + arNumber.substring(6, 10);
        console.log(`Argentina number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        formatted = '+54 ' + arNumber;
        console.log(`Argentina number (short) kept: ${phoneStr} -> ${formatted}`);
      }
    }
    // Other international numbers - format more nicely
    else if (formatted.startsWith('+')) {
      // Extract country code (1-4 digits) and format nicely
      const match = formatted.match(/^\+(\d{1,4})(.+)$/);
      if (match) {
        const countryCode = match[1];
        let nationalNumber = match[2];
        
        // Limit the number length to reasonable size
        if (nationalNumber.length > 12) {
          nationalNumber = nationalNumber.substring(0, 12);
        }
        
        // Format based on length
        if (nationalNumber.length >= 10) {
          // Format as XXX XXX XXXX
          formatted = '+' + countryCode + ' ' + 
                     nationalNumber.substring(0, 3) + ' ' + 
                     nationalNumber.substring(3, 6) + ' ' + 
                     nationalNumber.substring(6);
        } else if (nationalNumber.length >= 7) {
          // Format as XXX XXXX
          formatted = '+' + countryCode + ' ' + 
                     nationalNumber.substring(0, 3) + ' ' + 
                     nationalNumber.substring(3);
        } else {
          // Keep simple format
          formatted = '+' + countryCode + ' ' + nationalNumber;
        }
        console.log(`International number formatted: ${phoneStr} -> ${formatted}`);
      } else {
        console.log(`International number kept as is: ${formatted}`);
      }
    }
    // Numbers without country code - try to guess
    else if (/^\d{7,15}$/.test(formatted)) {
      // If it looks like an Israeli mobile number
      if (/^5\d{8}$/.test(formatted)) {
        formatted = '0' + formatted.substring(0, 2) + '-' + formatted.substring(2);
        console.log(`Guessed Israeli mobile: ${phoneStr} -> ${formatted}`);
      }
      // Otherwise add + prefix
      else {
        formatted = '+' + formatted;
        console.log(`Added + prefix: ${phoneStr} -> ${formatted}`);
      }
    }
    
    if (forXLSX) {
      return `=TEXT("${formatted}", "@")`;
    }
    
    // Don't add quote prefix for properly formatted numbers
    // Only add it for numbers that might be interpreted as numeric
    if (!formatted.startsWith("'") && /^\d/.test(formatted) && !formatted.includes('-')) {
      formatted = "'" + formatted;
    }
    
    return formatted;
  } catch (err) {
    console.error('Error in enhanced fallback formatting:', err);
    if (forXLSX) {
      return `=TEXT("${phoneStr}", "@")`;
    }
    return "'" + phoneStr;
  }
}

// Enhanced contact name extraction
function extractContactName(voteData, contacts) {
  try {
    if (!voteData || !voteData.__x_sender) {
      return "Unknown";
    }
    
    const sender = voteData.__x_sender;
    const userPhone = String(sender.user);
    
    // Priority order for name extraction
    const nameSources = [
      'pushname',
      'verifiedName',
      'formattedName',
      'displayName',
      'name',
      'shortName',
      'notifyName'
    ];
    
    // Try to get name from sender object
    for (const source of nameSources) {
      if (sender[source] && typeof sender[source] === 'string' && 
          sender[source].trim() !== '' && 
          sender[source] !== userPhone && 
          !sender[source].includes('.') && 
          sender[source].length > 1) {
        return sender[source].trim();
      }
    }
    
    // Try to get name from contact object
    if (contacts && Array.isArray(contacts)) {
      const contact = contacts.find(c => 
        c && c.__x_id && String(c.__x_id.user) === userPhone
      );
      
      if (contact) {
        const contactNameSources = [
          '__x_name',
          '__x_pushname',
          '__x_verifiedName',
          '__x_formattedName',
          '__x_displayName',
          '__x_notifyName'
        ];
        
        for (const source of contactNameSources) {
          if (contact[source] && typeof contact[source] === 'string' && 
              contact[source].trim() !== '' && 
              contact[source] !== userPhone && 
              !contact[source].includes('.') && 
              contact[source].length > 1) {
            return contact[source].trim();
          }
        }
      }
    }
    
    // Try WhatsApp's built-in methods
    if (window.Store && window.Store.Contact && 
        typeof window.Store.Contact.getDisplayName === 'function') {
      try {
        const displayName = window.Store.Contact.getDisplayName(userPhone);
        if (displayName && displayName !== userPhone && 
            displayName.length > 1 && !displayName.includes('.')) {
          return displayName;
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    // Last resort: create a meaningful name from phone number
    if (userPhone) {
      const countryCode = userPhone.substring(0, 3);
      return `Contact (${countryCode}...)`;
    }
    
    return "Unknown";
  } catch (err) {
    console.error('Error extracting contact name:', err);
    return "Unknown";
  }
}

// Enhanced timestamp processing
function processTimestamp(voteData, pollData) {
  try {
    let timestamp = voteData.__x_timestamp || voteData.__x_t || 0;
    
    // If timestamp is 0, try poll creation time
    if (!timestamp && pollData && pollData.__x_t) {
      timestamp = pollData.__x_t;
    }
    
    // WhatsApp typically uses seconds, we need milliseconds for Date
    if (timestamp > 0 && timestamp < 946684800000) { // Jan 1, 2000 in milliseconds
      timestamp = timestamp * 1000; // Convert seconds to milliseconds
    }
    
    // Create valid date object with fallbacks
    let validDate = new Date();
    try {
      const voteDate = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(voteDate.getTime()) || voteDate.getFullYear() <= 1971) {
        // Use the message creation time from poll if available
        if (pollData && pollData.__x_t) {
          validDate = new Date(pollData.__x_t * 1000);
        } else {
          validDate = new Date(); // Current date as last resort
        }
      } else {
        validDate = voteDate;
      }
    } catch (err) {
      console.error("Error creating date object:", err);
      validDate = new Date(); // Current date as fallback
    }
    
    return {
      timestamp: timestamp,
      validDate: validDate
    };
  } catch (err) {
    console.error('Error processing timestamp:', err);
    return {
      timestamp: Date.now(),
      validDate: new Date()
    };
  }
}

// Enhanced data validation
function validateVoteData(voteData) {
  try {
    if (!voteData) return false;
    
    // Check for required fields
    if (!voteData.__x_sender) return false;
    if (!voteData.__x_sender.user) return false;
    if (!voteData.__x_selectedOptionLocalIds) return false;
    if (!Array.isArray(voteData.__x_selectedOptionLocalIds)) return false;
    
    // Validate phone number format
    const phoneNumber = String(voteData.__x_sender.user);
    if (!/^\+?\d{7,15}$/.test(phoneNumber.replace(/[\s\-().]/g, ''))) {
      console.warn('Invalid phone number format:', phoneNumber);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error validating vote data:', err);
    return false;
  }
}

// Load the library when the script loads with multiple attempts
loadLibphonenumber();

// Additional safety loading with retry mechanism
setTimeout(() => {
  if (!libphonenumberReady) {
    console.log('libphonenumber not ready after 2s, retrying...');
    loadLibphonenumber();
  }
}, 2000);

setTimeout(() => {
  if (!libphonenumberReady) {
    console.log('libphonenumber not ready after 5s, final retry...');
    loadLibphonenumber();
  }
}, 5000);

// Force enhanced fallback for all phone numbers if library fails
function ensurePhoneFormatting(phoneNumber, forXLSX = false) {
  // CRITICAL: Convert to string immediately to prevent scientific notation
  let phoneStr = String(phoneNumber);
  console.log(`ensurePhoneFormatting: Converting ${phoneNumber} (${typeof phoneNumber}) to string: ${phoneStr}`);
  // Always use the enhanced fallback for maximum reliability
  return formatPhoneFallbackEnhanced(phoneStr, forXLSX);
}

// Detect and force format Israeli numbers specifically
function detectAndFormatIsraeliNumber(phoneNumber, forXLSX = false) {
  if (!phoneNumber) {
    return null;
  }
  
  // CRITICAL: Convert to string immediately to prevent scientific notation
  let phoneStr = String(phoneNumber);
  console.log(`detectAndFormatIsraeliNumber: Converting ${phoneNumber} (${typeof phoneNumber}) to string: ${phoneStr}`);
  const cleaned = phoneStr.replace(/[^\d+]/g, '');
  
  // Check if it's likely an Israeli number
  if (cleaned.includes('972') || 
      cleaned.startsWith('05') || 
      cleaned.startsWith('02') || 
      cleaned.startsWith('03') || 
      cleaned.startsWith('04') || 
      cleaned.startsWith('07') || 
      cleaned.startsWith('08') || 
      cleaned.startsWith('09') ||
      /^5\d{8}$/.test(cleaned) ||
      /^[2-4789]\d{7,8}$/.test(cleaned)) {
    
    console.log(`Detected Israeli number: ${phoneStr}`);
    return formatPhoneFallbackEnhanced(phoneStr, forXLSX);
  }
  
  return null;
}

const moduleRaid = function () {
  moduleRaid.mID  = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};

  // Check WhatsApp version with safer access pattern
  moduleRaid.isComet = typeof window.Debug === 'object' && 
                      window.Debug && 
                      window.Debug.VERSION && 
                      parseInt((window.Debug.VERSION || '').split('.')[1] || '0') >= 3000;

  fillModuleArray = function() {
    try {
      // Modern WhatsApp version check (using optional chaining for safety)
      if (typeof window.Debug === 'object' && window.Debug?.VERSION && parseFloat(window.Debug.VERSION) < 2.3) {
        // Legacy approach - safely access webpackChunk
        const webpackChunk = window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client;
        
        if (webpackChunk && Array.isArray(webpackChunk)) {
          webpackChunk.push([
      [moduleRaid.mID], {}, function(e) {
              try {
                if (e && typeof e === 'function' && typeof e.m === 'object') {
        Object.keys(e.m).forEach(function(mod) {
                    try {
          moduleRaid.mObj[mod] = e(mod);
                    } catch (modErr) {
                      // Silently skip errors when loading individual modules
                    }
                  });
                }
              } catch (innerErr) {
                console.warn("Module loading error:", innerErr);
              }
            }
          ]);
        }
  } else {
        // Newer WhatsApp approach
        try {
          if (typeof self !== 'undefined' && self.require && typeof self.require === 'function') {
            // Safely try to get debug module
            let debugModule;
            try {
              debugModule = self.require('__debug');
            } catch (err) {
              console.warn("Error requiring __debug module:", err);
              return; // Exit if we can't get the debug module
            }
            
            if (debugModule && debugModule.modulesMap) {
              const modules = debugModule.modulesMap;
              
              // Only process modules with "WA" in the name
              // Avoid accessing modules that might cause schema errors
              const safeKeys = Object.keys(modules)
                .filter(e => e.includes("WA") && 
                          // Skip modules known to cause schema errors
                          !e.includes("CallStore") && 
                          !e.includes("callOutcome"));
                
              safeKeys.forEach(function(mod) {
                try {
                  const modulos = modules[mod];
        if (modulos) {
          moduleRaid.mObj[mod] = {
                      default: modulos.defaultExport || {},
                factory: modulos.factory,
                ...modulos
            };
                    
                    // Only try to import namespace if default is empty
                    if (moduleRaid.mObj[mod].default && 
                        Object.keys(moduleRaid.mObj[mod].default).length === 0 && 
                        typeof self.ErrorGuard === 'object' && 
                        typeof self.ErrorGuard.skipGuardGlobal === 'function' &&
                        typeof self.importNamespace === 'function') {
                try {
                    self.ErrorGuard.skipGuardGlobal(true);
                    Object.assign(moduleRaid.mObj[mod], self.importNamespace(mod));
                } catch (e) {
                        // Silently skip namespace errors
                      }
                    }
                  }
                } catch (modErr) {
                  // Skip individual module errors
                }
              });
            }
          }
        } catch (err) {
          console.warn("Error accessing newer WhatsApp modules:", err);
        }
      }
    } catch (err) {
      console.warn("Module loading failed:", err);
      // Create empty object to prevent further errors
      moduleRaid.mObj = {};
    }
  }

  // Safely try to fill the module array
  try {
  fillModuleArray();
  } catch (e) {
    console.warn("Error in fillModuleArray:", e);
    moduleRaid.mObj = {};
  }

  get = function get (id) {
    return moduleRaid.mObj[id] || null;
  }

  findModule = function findModule (query) {
    results = [];
    modules = Object.keys(moduleRaid.mObj);

    modules.forEach(function(mKey) {
      try {
      mod = moduleRaid.mObj[mKey];

      if (typeof mod !== 'undefined') {
        if (typeof query === 'string') {
          if (typeof mod.default === 'object') {
            for (key in mod.default) {
              if (key == query) results.push(mod);
            }
          }

          for (key in mod) {
            if (key == query) results.push(mod);
          }
        } else if (typeof query === 'function') { 
          if (query(mod)) {
            results.push(mod);
          }
        } else {
          throw new TypeError('findModule can only find via string and function, ' + (typeof query) + ' was passed');
        }
      }
      } catch (err) {
        // Skip errors in individual modules
      }
    });

    return results;
  }

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    get: get
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}


let watchedGroup = null, lastSortVote

// Wrap initialization in try-catch block to prevent unhandled promise rejections
const initInterval = setInterval(() => {
  try {
  if ((window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client)) {
      // Load moment module with error handling
      try {
    const momentModule = window.mR.findModule(m => 
          m && m.default && typeof m.default.defineLocale === 'function' && m.default.locale
    )[0];
    
    if (momentModule && momentModule.default) {
          // Set locale
      const userLocale = navigator.language || 'he';
      momentModule.default.locale(userLocale);
      
          // Override defineLocale safely
      const originalDefineLocale = momentModule.default.defineLocale;
      momentModule.default.defineLocale = function(locale, config) {
        if (locale === 'pt-br') return;
        return originalDefineLocale.call(this, locale, config);
      };
        }
      } catch (momentErr) {
        console.warn("Error configuring moment module:", momentErr);
    }

      // Safely initialize moduleRaid
      try {
    window.mR = moduleRaid();
      } catch (mRErr) {
        console.warn("Error initializing moduleRaid:", mRErr);
      }
      
      // Safely set up Store object with fallbacks
      try {
        window.Store = {};
        
        // Try different module detection approaches with fallbacks
        try {
          // Use a more defensive approach to find modules
          let storeModules = [];
          
          // Attempt to find modules with Call and Chat properties
          try {
            storeModules = window.mR.findModule((m) => (
              m && typeof m === 'object' && m.Call && m.Chat
            ));
          } catch (err) {
            console.warn("Error searching for Call/Chat modules:", err);
          }
          
          // If that fails, try to find modules with Chat in default
          if (!storeModules || storeModules.length === 0) {
            try {
              storeModules = window.mR.findModule((m) => (
                m && typeof m === 'object' && 
                m.default && typeof m.default === 'object' && 
                m.default.Chat
              ));
            } catch (err) {
              console.warn("Error searching for default.Chat modules:", err);
            }
          }
          
          // Apply the found module to Store object if we found anything
          if (storeModules && storeModules.length > 0) {
            // Use the first module found
            const firstModule = storeModules[0];
            
            if (firstModule.Chat) {
              // Direct properties
              window.Store = Object.assign({}, firstModule);
            } else if (firstModule.default && firstModule.default.Chat) {
              // Default property
              window.Store = Object.assign({}, firstModule.default);
            }
          }
          
          // Manually check if we have the critical components
          if (!window.Store.Msg) {
            // Try to find Msg separately
            try {
              const msgModules = window.mR.findModule((m) => (
                m && typeof m === 'object' && 
                (m.Msg || (m.default && m.default.Msg))
              ));
              
              if (msgModules && msgModules.length > 0) {
                const msgModule = msgModules[0];
                if (msgModule.Msg) {
                  window.Store.Msg = msgModule.Msg;
                } else if (msgModule.default && msgModule.default.Msg) {
                  window.Store.Msg = msgModule.default.Msg;
                }
              }
            } catch (err) {
              console.warn("Error finding Msg module:", err);
            }
          }
          
          // Do the same for PollVote if needed
          if (!window.Store.PollVote) {
            try {
              const pollModules = window.mR.findModule((m) => (
                m && typeof m === 'object' && 
                (m.PollVote || (m.default && m.default.PollVote))
              ));
              
              if (pollModules && pollModules.length > 0) {
                const pollModule = pollModules[0];
                if (pollModule.PollVote) {
                  window.Store.PollVote = pollModule.PollVote;
                } else if (pollModule.default && pollModule.default.PollVote) {
                  window.Store.PollVote = pollModule.default.PollVote;
                }
              }
            } catch (err) {
              console.warn("Error finding PollVote module:", err);
            }
          }
        } catch (storeErr) {
          console.warn("Error setting up Store object:", storeErr);
        }
      } catch (err) {
        console.warn("Error in Store setup:", err);
      }

    clearInterval(initInterval);
    }
  } catch (err) {
    console.warn("Error during moduleRaid initialization:", err);
    // Clear interval after too many attempts to prevent infinite errors
    if (window.initAttempts === undefined) {
      window.initAttempts = 1;
    } else {
      window.initAttempts++;
    }
    
    if (window.initAttempts > 5) {
      console.warn("Too many initialization attempts, giving up");
      clearInterval(initInterval);
    }
  }
}, 1000);


window.addEventListener('message', async (e) => {
  
  if (e.data?.source === 'WAVoteExporter' && e.data.export){
    try {
      // Check for preferred format and language
      const preferredFormat = e.data.preferredFormat || 'auto';
      const language = e.data.language || 'en';
      
      // Load translations first
      await loadTranslations();
      
      // Safety check for Store
      if (!window.Store) {
        console.error("WhatsApp Store not available. Module might not be properly loaded.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "WhatsApp API not available"
        }, "*");
        return;
      }
      
      // Debug: Log all available Store properties
      console.log("Available Store properties:");
      for (const key in Store) {
        if (Store.hasOwnProperty(key)) {
          const value = Store[key];
          const type = typeof value;
          const hasFunctions = type === 'object' && value && Object.keys(value).filter(k => typeof value[k] === 'function').length;
          console.log(`- Store.${key}: ${type}${type === 'object' ? ` with ${hasFunctions} functions` : ''}`);
        }
      }
      
      // Check that PollVote exists
      if (!Store.PollVote || !Store.PollVote.getModelsArray) {
        console.error("PollVote module not available in WhatsApp Store.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "Poll functionality not available"
        }, "*");
        return;
      }
      
      // Check that Msg exists
      if (!Store.Msg || !Store.Msg.getModelsArray) {
        console.error("Msg module not available in WhatsApp Store.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "Message functionality not available"
        }, "*");
        return;
      }
      
      // Check for Contact
      if (!Store.Contact || !Store.Contact.getModelsArray) {
        console.error("Contact module not available in WhatsApp Store.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "Contact functionality not available"
        }, "*");
        return;
      }
      
      let votes = [];
      let poll = null;

      // ── ID DEBUG ─────────────────────────────────────────────────────────────
      console.log('%c[PollExporter] Searching for export ID:', 'color:#25d366;font-weight:bold', e.data.export);
      // ─────────────────────────────────────────────────────────────────────────

      // Get votes with error handling
      try {
        const voteModels = Store.PollVote.getModelsArray();
        console.log("[PollExporter] Total vote models:", voteModels.length);

        // Log every unique parentMsgKey._serialized so we can see the format
        const uniqueParentKeys = [...new Set(
          voteModels
            .map(x => x?.__x_parentMsgKey?._serialized)
            .filter(Boolean)
        )];
        console.log('%c[PollExporter] Vote parentMsgKey._serialized values:', 'color:#53bdeb', uniqueParentKeys);

        votes = voteModels.filter(x => {
          try {
            return x && x.__x_parentMsgKey && x.__x_parentMsgKey._serialized &&
                  e.data.export.includes(x.__x_parentMsgKey._serialized);
          } catch (err) {
            return false;
          }
        });
        console.log("[PollExporter] Matched votes:", votes.length);
      } catch (err) {
        console.error("[PollExporter] Error getting vote models:", err);
      }

      // Get poll with error handling
      try {
        const msgModels = Store.Msg.getModelsArray();
        const pollMessages = msgModels.filter(m => m && m.type === "poll_creation");
        console.log("[PollExporter] Poll messages found:", pollMessages.length);

        // Log every poll message __x_id so we can see the exact format
        pollMessages.forEach((m, i) => {
          console.log(`%c[PollExporter] Poll[${i}] __x_id:`, 'color:#53bdeb', {
            id:          m.__x_id?.id,
            _serialized: m.__x_id?._serialized,
            remote:      m.__x_id?.remote?._serialized ?? m.__x_id?.remote,
          });
        });

        poll = pollMessages.find(m => {
          try {
            return m && m.__x_id && m.__x_id.id && e.data.export.includes(m.__x_id.id);
          } catch (err) {
            return false;
          }
        });
        console.log("[PollExporter] Matched poll:", poll ? poll.__x_id?.id : 'none');
      } catch (err) {
        console.error("[PollExporter] Error getting message models:", err);
      }
      
      // NEW: Extract poll creator information
      let pollCreator = null;
      let pollCreatorName = null;
      let pollCreatorPushname = null;
      
            try {
        if (poll && poll.__x_sender) {
          pollCreator = poll.__x_sender;
          console.log("Poll creator found:", String(pollCreator.user));
          
          // Store the creator's pushname if available
          if (pollCreator.pushname) {
            pollCreatorPushname = pollCreator.pushname;
            console.log("Poll creator pushname:", pollCreatorPushname);
          }
            
            // Try to find the creator's contact name
            if (Store.Contact && Store.Contact.getModelsArray) {
              const contacts = Store.Contact.getModelsArray();
              const creatorContact = contacts.find(c => 
                c && c.__x_id && String(c.__x_id.user) === String(pollCreator.user)
              );
              
              if (creatorContact && creatorContact.__x_name && 
                  creatorContact.__x_name !== String(creatorContact.__x_id.user)) {
                pollCreatorName = creatorContact.__x_name;
                console.log("Poll creator contact name:", pollCreatorName);
              }
            }
        }
      } catch (err) {
        console.error("Error extracting poll creator info:", err);
      }
      
      // Check if we found data
      if (!votes.length || !poll) {
        console.error("Could not find poll data for the given ID.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "Poll data not found"
        }, "*");
        return;
      }
      
      if (!poll.__x_pollOptions || !Array.isArray(poll.__x_pollOptions)) {
        console.error("Poll options not found or not an array.");
        window.postMessage({
          source: 'WAVoteExporter',
          exportComplete: true,
          success: false,
          error: "Poll options not found"
        }, "*");
        return;
      }
      
      // Extract poll information
      const pollOptions = poll.__x_pollOptions.map(x => x.name);
      
      // Poll name extraction - try all possible properties where the name might be stored
      let pollName = "Poll";
      if (poll.__x_pollName) {
        pollName = poll.__x_pollName;
      } else if (poll.__x_name) {
        pollName = poll.__x_name;
      } else if (poll.__x_body) {
        pollName = poll.__x_body;
      } else {
        // Try looking through all properties
        for (const key in poll) {
          if (key.startsWith('__x_') && typeof poll[key] === 'string' && poll[key].length > 0 && poll[key].length < 100) {
            pollName = poll[key];
            break;
          }
        }
      }
      
      const pollCreationDate = new Date(poll.__x_t * 1000); // Get poll creation date
      
      // Calculate vote totals with extra safety
      const voteAccumulator = {};
      try {
        votes.forEach(x => {
          try {
            if (x && x.__x_selectedOptionLocalIds && Array.isArray(x.__x_selectedOptionLocalIds)) {
              x.__x_selectedOptionLocalIds.forEach(y => {
                if (y !== undefined && y !== null) {
                  voteAccumulator[y] = (voteAccumulator[y] || 0) + 1;
                }
              });
          }
        } catch (err) {
          console.error("Error accumulating votes:", err);
        }
        });
      } catch (err) {
        console.error("Error processing vote totals:", err);
      }
      
      // Debug: Log all contacts for debugging
      try {
        if (Store.Contact && Store.Contact.getModelsArray) {
          const contacts = Store.Contact.getModelsArray();
          console.log(`Total contacts: ${contacts.length}`);
          
          // Log sample contact structure
          if (contacts.length > 0) {
            const sampleContact = contacts[0];
            console.log("Sample contact structure:", Object.keys(sampleContact));
            // Log the properties with __x_ prefix
            const xProps = Object.keys(sampleContact).filter(k => k.startsWith('__x_'));
            console.log("Contact __x_ properties:", xProps);
          }
        }
      } catch (err) {
        console.error("Error logging contacts:", err);
      }
      
            // Process individual votes with enhanced data handling
      const voteRows = votes.map(x => {
        try {
          // Enhanced data validation
          if (!validateVoteData(x)) {
            console.warn("Invalid vote data, skipping:", x);
            return null;
          }

          let contact = null;
          let contactName = "Unknown";
          let userPhone = null;

          // Store the user's phone number for debugging - FIRST convert to string
          if (x && x.__x_sender && x.__x_sender.user) {
            userPhone = String(x.__x_sender.user);
            console.log("Processing vote from user:", userPhone);
          }
          
          // Enhanced contact retrieval
          let contacts = [];
          if (Store.Contact && Store.Contact.getModelsArray) {
            try {
              contacts = Store.Contact.getModelsArray();
              contact = contacts.find(y => 
                y && y.__x_id && String(y.__x_id.user) === String(x.__x_sender.user)
              );
            } catch (err) {
              console.error("Error retrieving contacts:", err);
            }
          }
          
          // Enhanced contact name extraction using the new function
          contactName = extractContactName(x, contacts);
          
          // Check if this vote is from the poll creator and update name if needed
          let isFromPollCreator = false;
          try {
            if (pollCreator && x.__x_sender && 
                String(pollCreator.user) === String(x.__x_sender.user)) {
              isFromPollCreator = true;
              console.log("This vote is from the poll creator");
              
              // If poll creator has a name or pushname, use it
              if (pollCreatorName) {
                contactName = pollCreatorName;
                console.log("Using poll creator's saved name:", contactName);
              }
              else if (pollCreatorPushname) {
                contactName = pollCreatorPushname;
                console.log("Using poll creator's pushname:", contactName);
              }
            }
          } catch (err) {
            console.error("Error checking if vote is from poll creator:", err);
          }
          
          // Extract pushname for debugging (using enhanced extraction)
          let pushname = null;
          if (x.__x_sender) {
            const nameSources = [
              'pushname', 'verifiedName', 'formattedName', 'displayName', 
              'name', 'shortName', 'notifyName'
            ];
            
            for (const source of nameSources) {
              if (x.__x_sender[source] && typeof x.__x_sender[source] === 'string' && 
                  x.__x_sender[source].trim() !== '' && 
                  x.__x_sender[source] !== x.__x_sender.user) {
                pushname = x.__x_sender[source].trim();
                break;
              }
            }
          }
          
          // CRITICAL: Enhanced phone number processing - convert to string FIRST
          let phoneNumber = null;
          try {
            // Get raw phone number and convert to string immediately
            let rawPhoneNumber = null;
            
            // First try to get from sender.user which contains the actual phone number
            if (x && x.__x_sender && x.__x_sender.user) {
              rawPhoneNumber = x.__x_sender.user;
            }
            // If not available, try sender.id
            else if (x && x.__x_sender && x.__x_sender.id) {
              rawPhoneNumber = x.__x_sender.id.user || x.__x_sender.id;
            }
            // Try using contact id as last resort
            else if (contact && contact.__x_id && contact.__x_id.user) {
              rawPhoneNumber = contact.__x_id.user;
            }
            
            // CRITICAL: Convert to string immediately to prevent scientific notation
            if (rawPhoneNumber !== null && rawPhoneNumber !== undefined) {
              phoneNumber = String(rawPhoneNumber);
              console.log(`RAW phone number: ${rawPhoneNumber} (type: ${typeof rawPhoneNumber}) -> converted to string: ${phoneNumber}`);
              
              // Enhanced phone number formatting - use multiple fallback layers
              try {
                // Try main library function first
                const libResult = formatPhoneWithLib(phoneNumber, false);
                if (libResult && libResult !== "'Unknown") {
                  phoneNumber = libResult;
                  console.log(`Vote processing - library formatted phone: ${phoneNumber}`);
                } else {
                  // Force enhanced fallback
                  phoneNumber = ensurePhoneFormatting(phoneNumber, false);
                  console.log(`Vote processing - fallback formatted phone: ${phoneNumber}`);
                }
              } catch (formatErr) {
                console.error('Phone formatting error:', formatErr);
                // Last resort - clean formatting
                phoneNumber = formatPhoneFallbackEnhanced(phoneNumber, false);
                console.log(`Vote processing - final fallback formatted phone: ${phoneNumber}`);
              }
            } else {
              phoneNumber = "'Unknown";
            }
            
          } catch (err) {
            console.error("Error processing phone number:", err);
            phoneNumber = "'Unknown";
          }
          
          // Enhanced timestamp processing
          const timestampData = processTimestamp(x, poll);
          
          // Enhanced date and time formatting
          let dateFormatted = "", timeFormatted = "";
          try {
            const localeCode = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-BR' : language === 'ar' ? 'ar-SA' : 'he-IL';
            
            // Always use DD.MM.YYYY format regardless of locale
            const day = String(timestampData.validDate.getDate()).padStart(2, '0');
            const month = String(timestampData.validDate.getMonth() + 1).padStart(2, '0');
            const year = timestampData.validDate.getFullYear();
            dateFormatted = `${day}.${month}.${year}`;
            
            // Keep time formatting based on locale
            timeFormatted = timestampData.validDate.toLocaleTimeString(localeCode);
          } catch (err) {
            console.error("Error formatting date/time:", err);
            // Enhanced fallback date formatting
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            dateFormatted = `${day}.${month}.${year}`;
            timeFormatted = now.toTimeString().split(' ')[0];
          }
          
          // Enhanced vote data validation
          const voteOptions = x.__x_selectedOptionLocalIds || [];
          if (!Array.isArray(voteOptions)) {
            console.warn("Invalid vote options for user:", phoneNumber);
            voteOptions = [];
          }
          
          return {
            phone: phoneNumber,
            votes: voteOptions,
            name: contactName,
            date: dateFormatted,
            time: timeFormatted,
            rawDate: timestampData.validDate,
            timestamp: timestampData.timestamp,
            pushname: pushname || "N/A",
            isFromPollCreator: isFromPollCreator
          };
        } catch (err) {
          console.error("Error mapping vote data:", err);
          return null;
        }
      }).filter(x => x !== null);
      
      // Enhanced sorting with better error handling
      try {
        voteRows.sort((a, b) => {
          // Primary sort by timestamp
          const timeDiff = (a.timestamp || 0) - (b.timestamp || 0);
          if (timeDiff !== 0) return timeDiff;
          
          // Secondary sort by name
          return (a.name || '').localeCompare(b.name || '');
        });
      } catch (err) {
        console.error("Error sorting vote rows:", err);
      }
      
      // Enhanced debug output with phone number validation
      console.log("Enhanced poll votes processing:");
      let properlyFormattedCount = 0;
      let israeliNumbersCount = 0;
      
      voteRows.forEach((row, index) => {
        const isIsraeliFormat = row.phone && (
          row.phone.includes('053-') || 
          row.phone.includes('052-') || 
          row.phone.includes('054-') ||
          row.phone.includes('055-') ||
          row.phone.includes('050-') ||
          /^'?05\d-\d+/.test(row.phone)
        );
        
        const hasIsraeliIndicators = row.phone && (
          row.phone.includes('972') || 
          row.phone.includes('05')
        );
        
        if (hasIsraeliIndicators) {
          israeliNumbersCount++;
          if (isIsraeliFormat) {
            properlyFormattedCount++;
          }
        }
        
        console.log(`Vote ${index + 1}:`, {
          name: row.name,
          phone: row.phone,
          isIsraeliFormat: isIsraeliFormat,
          hasIsraeliIndicators: hasIsraeliIndicators,
          pushname: row.pushname,
          voteCount: row.votes.length,
          isFromPollCreator: row.isFromPollCreator,
          timestamp: new Date(row.timestamp).toLocaleString()
        });
      });
      
      console.log(`\n📊 Phone Formatting Summary:`);
      console.log(`Total votes: ${voteRows.length}`);
      console.log(`Israeli numbers detected: ${israeliNumbersCount}`);
      console.log(`Properly formatted Israeli numbers: ${properlyFormattedCount}`);
      console.log(`Success rate: ${israeliNumbersCount > 0 ? Math.round((properlyFormattedCount / israeliNumbersCount) * 100) : 0}%\n`);
      
      // If success rate is low, force re-format all Israeli numbers
      if (israeliNumbersCount > 0 && (properlyFormattedCount / israeliNumbersCount) < 0.8) {
        console.log("⚠️ Low success rate detected, forcing Israeli number formatting...");
        
        voteRows.forEach(row => {
          if (row.phone && (row.phone.includes('972') || row.phone.includes('05'))) {
            const originalPhone = row.phone;
            row.phone = formatPhoneFallbackEnhanced(originalPhone, false); // Don't use XLSX formatting
            console.log(`🔧 Re-formatted: ${originalPhone} -> ${row.phone}`);
          }
        });
      }
      
      // Final phone number cleanup - ensure ALL numbers are properly formatted
      console.log("🔧 Final phone number cleanup - Converting ALL numbers to string and formatting...");
      voteRows.forEach((row, index) => {
        if (row.phone && row.phone !== "'Unknown") {
          // CRITICAL: Convert to string immediately to prevent scientific notation
          let phoneStr = String(row.phone);
          console.log(`🔧 Final cleanup ${index + 1}: Converting ${row.phone} (${typeof row.phone}) to string: ${phoneStr}`);
          
          let cleanPhone = phoneStr;
          
          // Remove any prefixes
          if (cleanPhone.startsWith("'")) {
            cleanPhone = cleanPhone.substring(1);
          }
          
          // Remove @ if present
          if (cleanPhone.includes('@')) {
            cleanPhone = cleanPhone.split('@')[0];
          }
          
          // ALWAYS apply formatting - be more aggressive
          const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
          
          // Apply formatting if:
          // 1. More than 10 digits and no formatting characters
          // 2. Contains Israeli indicators (972, 05, etc.)
          // 3. Starts with + and has more than 12 digits
          // 4. Scientific notation pattern (e+ or contains scientific notation)
          // 5. ALL numbers longer than 8 digits without proper formatting
          
          const needsFormatting = (
            (digitsOnly.length > 10 && !cleanPhone.includes('-') && !cleanPhone.includes(' ') && !cleanPhone.includes('(')) ||
            (cleanPhone.includes('972') || cleanPhone.includes('05') || /^5\d{8}$/.test(cleanPhone.replace(/[^\d]/g, ''))) ||
            (cleanPhone.startsWith('+') && digitsOnly.length > 12 && !cleanPhone.includes('-') && !cleanPhone.includes(' ')) ||
            (cleanPhone.includes('e+') || cleanPhone.includes('E+')) ||
            (digitsOnly.length > 8 && !cleanPhone.includes('-') && !cleanPhone.includes(' ') && !cleanPhone.includes('('))
          );
          
          if (needsFormatting) {
            console.log(`🔧 Force formatting number ${index + 1}: ${cleanPhone} (digits: ${digitsOnly.length})`);
            
            // Try multiple formatting approaches
            let finalFormatted = cleanPhone;
            
            // First try the enhanced fallback
            try {
              finalFormatted = formatPhoneFallbackEnhanced(cleanPhone, false);
            } catch (err) {
              console.error(`Error in formatPhoneFallbackEnhanced for ${cleanPhone}:`, err);
            }
            
            // If that didn't work, try the library function
            if (finalFormatted === cleanPhone) {
              try {
                finalFormatted = formatPhoneWithLib(cleanPhone, false);
              } catch (err) {
                console.error(`Error in formatPhoneWithLib for ${cleanPhone}:`, err);
              }
            }
            
            // If still not formatted, try Israeli detection
            if (finalFormatted === cleanPhone) {
              try {
                const israeliResult = detectAndFormatIsraeliNumber(cleanPhone, false);
                if (israeliResult) {
                  finalFormatted = israeliResult;
                }
              } catch (err) {
                console.error(`Error in detectAndFormatIsraeliNumber for ${cleanPhone}:`, err);
              }
            }
            
            // If we got a different result, use it
            if (finalFormatted !== cleanPhone) {
              console.log(`🔧 Final cleanup ${index + 1}: ${cleanPhone} -> ${finalFormatted}`);
              row.phone = finalFormatted;
            } else {
              console.log(`🔧 Final cleanup ${index + 1}: No change needed for ${cleanPhone}`);
            }
          } else {
            console.log(`🔧 Final cleanup ${index + 1}: Skipping well-formatted number: ${cleanPhone}`);
          }
        }
      });
      
      // Updated function to check XLSX availability with more detail
      function isXLSXLibraryAvailable() {
        try {
          // First check for the global ready flag (set by make_xlsx_global.js)
          if (typeof window.XLSX_READY !== 'undefined' && window.XLSX_READY === false) {
            return false;
          }
          
          // First check if XLSX is defined
          if (typeof window.XLSX === 'undefined' || window.XLSX === null) {
            return false;
          }
          
          // Then check for required methods and properties
          const hasUtils = typeof window.XLSX.utils === 'object';
          const hasBookNew = typeof window.XLSX.utils?.book_new === 'function';
          const hasWrite = typeof window.XLSX.write === 'function';
          
          if (!hasUtils || !hasBookNew || !hasWrite) {
            return false;
          }
          
          // Do a simple test to make sure it actually works
          try {
            const testWb = window.XLSX.utils.book_new();
            const testWs = window.XLSX.utils.aoa_to_sheet([["Test"]]);
            window.XLSX.utils.book_append_sheet(testWb, testWs, "Sheet1");
            const testOutput = window.XLSX.write(testWb, {bookType: 'xlsx', type: 'array'});
            
            // Verify the output is not empty
            if (!testOutput || testOutput.byteLength < 50) {
              window.XLSX_READY = false;
              return false;
            }
            
            // If we got here, the library works
            window.XLSX_READY = true;
            return true;
          } catch (testErr) {
            window.XLSX_READY = false;
            return false;
          }
        } catch (err) {
          window.XLSX_READY = false;
          return false;
        }
      }

      // Check for XLSX library availability once
      const isXLSXAvailable = isXLSXLibraryAvailable();

      // Choose export method based on format
      if (preferredFormat === 'csv') {
        // Force CSV export
        exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
      } else if (preferredFormat === 'xlsx') {
        // Force true XLSX export via XLSX library if available
        if (isXLSXAvailable) {
          exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
        } else {
          exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
        }
      } else if (preferredFormat === 'html-excel') {
        // Use HTML table method directly
        exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
      } else {
        // Auto-select best method (default behavior)
        if (isXLSXAvailable) {
          exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
        } else {
          exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
        }
      }
      
      // Send success message back to content script
      window.postMessage({ source: 'WAVoteExporter', exportComplete: true }, "*");
    } catch (err) {
      console.error("Error exporting poll votes:", err);
      window.postMessage({
        source: 'WAVoteExporter',
        exportComplete: true,
        success: false,
        error: err.message || "Unknown error"
      }, "*");
    }
  }
});

// Load translations from external file
let translations = {};
let translationsLoaded = false;

// Function to load translations
async function loadTranslations() {
  if (translationsLoaded) return;
  
  try {
    // We need to load the translations file
    const script = document.createElement('script');
    script.src = extURL('translations.js');
    script.id = 'wa-translations-script';
    document.head.appendChild(script);
    
    // Wait for script to load
    await new Promise((resolve) => {
      script.onload = () => {
        console.log('Translations loaded successfully');
        // Get translations from global scope
        if (window.translations) {
          translations = window.translations;
          translationsLoaded = true;
        }
        resolve();
      };
      script.onerror = (error) => {
        console.error('Error loading translations:', error);
        resolve();
      };
    });
  } catch (err) {
    console.error('Failed to load translations:', err);
  }
}

// Helper function to get translation, now using the loaded translations
function getTranslation(key, language) {
  // Fall back to English if language not supported or translations not loaded
  if (!translationsLoaded || !translations[language]) {
    // Provide fallback translations
    const fallbackTranslations = {
      'en': {
        'pollName': 'Poll Name',
        'pollCreatedDate': 'Poll created date',
        'pollCreatedTime': 'Poll created time',
        'total': 'Total',
        'name': 'Name',
        'phone': 'Phone',
        'responseDate': 'Response Date',
        'responseTime': 'Response Time'
      },
      'he': {
        'pollName': 'שם הסקר',
        'pollCreatedDate': 'תאריך יצירת הסקר',
        'pollCreatedTime': 'שעת יצירת הסקר',
        'total': 'סה"כ',
        'name': 'שם',
        'phone': 'טלפון',
        'responseDate': 'תאריך תגובה',
        'responseTime': 'שעת תגובה'
      },
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
      'pt': {
        'pollName': 'Nome da enquete',
        'pollCreatedDate': 'Data de criação',
        'pollCreatedTime': 'Hora de criação',
        'total': 'Total',
        'name': 'Nome',
        'phone': 'Telefone',
        'responseDate': 'Data da resposta',
        'responseTime': 'Hora da resposta'
      },
      'ar': {
        'pollName': 'اسم الاستطلاع',
        'pollCreatedDate': 'تاريخ الإنشاء',
        'pollCreatedTime': 'وقت الإنشاء',
        'total': 'المجموع',
        'name': 'الاسم',
        'phone': 'الهاتف',
        'responseDate': 'تاريخ الإجابة',
        'responseTime': 'وقت الإجابة'
      }
    };
    
    // Check if the requested language exists in fallback, otherwise use English
    const lang = fallbackTranslations[language] ? language : 'en';
    return fallbackTranslations[lang][key] || key;
  }
  
  // Use loaded translations
  return translations[language]?.[key] || key;
}

// Function to export Excel via HTML table
function exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language = 'he') {
  try {
    // Get translations
    const t = key => getTranslation(key, language);
    
    // Format dates with proper locale
    const localeCode = language === 'en' ? 'en-US' : 
                      language === 'es' ? 'es-ES' : 
                      language === 'fr' ? 'fr-FR' :
                      language === 'pt' ? 'pt-BR' :
                      language === 'ar' ? 'ar-SA' : 'he-IL';
    
    // FIXED: Format poll creation date as DD.MM.YYYY
    const day = String(pollCreationDate.getDate()).padStart(2, '0');
    const month = String(pollCreationDate.getMonth() + 1).padStart(2, '0');
    const year = pollCreationDate.getFullYear();
    const pollCreatedDate = `${day}.${month}.${year}`;
    const pollCreatedTime = pollCreationDate.toLocaleTimeString(localeCode);
    
    // Set direction based on language (only Hebrew is RTL)
    const direction = language === 'he' ? 'rtl' : 'ltr';
    const textAlign = language === 'he' ? 'right' : 'left';
    
    // Create HTML content with Excel-compatible markup
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Poll Votes</x:Name>
                <x:WorksheetOptions>
                  ${language === 'he' ? '<x:DisplayRightToLeft/>' : '<!-- RTL disabled for non-Hebrew -->'}
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; direction: ${direction}; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: ${textAlign}; }
          .header-row { font-weight: bold; font-size: 14pt; background-color: #F5F5F5; }
          .header-row td { border-bottom: 2px solid #aaa; }
          .data-row { background-color: #FFFFFF; }
          .total-row { font-weight: bold; background-color: #E6E6FA; }
          .total-row td { border-top: 2px solid #aaa; border-bottom: 2px solid #aaa; }
          .column-headers { 
            font-weight: bold; 
            background-color: #F2F2F2; /* Light gray */
            color: black;
          }
          .column-headers th { 
            border: 1px solid #666;
            text-align: center;
          }
          .filter-row td { 
            background-color: #E8E8E8; 
            font-style: italic;
            text-align: center;
            height: 25px;
          }
          .vote-cell { text-align: center; }
          .even-row { background-color: #F8F8FF; }
          @mso-number-format:"\\@";
        </style>
      </head>
      <body>
        <table id="VotesTable">
          <tr class="header-row">
            <td>${t('pollName')}</td>
            <td>${t('pollCreatedDate')}</td>
            <td>${t('pollCreatedTime')}</td>
          </tr>
          <tr class="data-row">
            <td>${sanitizeHTML(pollName || "Poll")}</td>
            <td>${sanitizeHTML(pollCreatedDate)}</td>
            <td>${sanitizeHTML(pollCreatedTime)}</td>
          </tr>
          <tr><td colspan="5">&nbsp;</td></tr>
          <tr><td colspan="5">&nbsp;</td></tr>`;
    
    // First add the total row
    htmlContent += `
          <tr class="total-row">
            <td>${t('total')}</td>
            <td></td>
            <td></td>
            <td></td>
            ${pollOptions.map((_, i) => `<td>${voteAccumulator[i] || 0}</td>`).join('')}
          </tr>`;
          
    // Then add the column headers
    htmlContent += `
          <tr class="column-headers">
            <th>${t('name')}</th>
            <th>${t('phone')}</th>
            <th>${t('responseDate')}</th>
            <th>${t('responseTime')}</th>
            ${pollOptions.map(opt => `<th>${sanitizeHTML(opt)}</th>`).join('')}
          </tr>`;
    
    // Add empty row for real Excel filters (row 7)
    const columnCount = 4 + pollOptions.length;
    htmlContent += `
          <tr class="filter-row">
            ${Array(columnCount).fill('<td></td>').join('')}
          </tr>`;
    
    // Calculate table dimensions
    const tableColumns = 4 + pollOptions.length; // Name, Phone, Date, Time + poll options
    const tableRows = voteRows.length + 1; // +1 for filter row
    const lastColumn = String.fromCharCode(65 + tableColumns - 1); // Convert to column letter (A, B, C, etc.)
    
    // Add vote rows - now starting from row 8
    voteRows.forEach((row, index) => {
      // Use the already formatted phone number - DON'T add '+' prefix
      let phoneStr = row.phone || "";
      if (phoneStr.startsWith("'")) {
        phoneStr = phoneStr.substring(1);
      }
      if (phoneStr.includes('@')) {
        phoneStr = phoneStr.split('@')[0];
      }
      
      // Keep the properly formatted phone number as-is (e.g., 053-6210104)
      // Don't add '+' prefix for already formatted numbers
      
      // Format date and time strings with correct locale
      const dateStr = row.date || (row.rawDate ? row.rawDate.toLocaleDateString(localeCode) : "");
      const timeStr = row.time || (row.rawDate ? row.rawDate.toLocaleTimeString(localeCode) : "");
      
      htmlContent += `
        <tr class="${index % 2 === 0 ? 'even-row' : 'data-row'}">
          <td>${sanitizeHTML(row.name)}</td>
          <td style="mso-number-format:'\\@';">${sanitizeHTML(phoneStr)}</td>
          <td>${sanitizeHTML(dateStr)}</td>
          <td>${sanitizeHTML(timeStr)}</td>
          ${pollOptions.map((_, i) => 
            `<td class="vote-cell">${row.votes && row.votes.includes(i) ? '<b>X</b>' : ''}</td>`
          ).join('')}
        </tr>`;
    });
    
    // Close the table
    htmlContent += `</table>`;
    
    // Add proper Excel filtering using the Excel XML format
    htmlContent += `
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Poll Votes</x:Name>
              <x:WorksheetOptions>
                ${language === 'he' ? '<x:DisplayRightToLeft/>' : '<!-- RTL disabled for non-Hebrew -->'}
                <x:Print>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
              <x:AutoFilter x:Range="A6:${lastColumn}${6 + tableRows}" xmlns="urn:schemas-microsoft-com:office:excel"/>
              <x:Table x:FullRows="1" x:FullColumns="1" x:StyleID="VotesTable"/>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      
      <!-- Excel 2010+ Table Feature (Ctrl+T) -->
      <!--[if gte mso 9]>
      <xml>
        <o:OfficeLists>
          <o:List DisplayName="VotesTable">
            <o:ListColumns>
              <o:ListColumn Name="${t('name')}" />
              <o:ListColumn Name="${t('phone')}" />
              <o:ListColumn Name="${t('responseDate')}" />
              <o:ListColumn Name="${t('responseTime')}" />
              ${pollOptions.map(opt => `<o:ListColumn Name="${sanitizeHTML(opt)}" />`).join('')}
            </o:ListColumns>
          </o:List>
        </o:OfficeLists>
      </xml>
      <![endif]-->
    `;
    
    // Close the HTML
    htmlContent += `
      </body>
      </html>`;
    
    // Create a sanitized filename with the correct extension
    const sanitizedPollName = (pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${sanitizedPollName}_${Date.now()}.xls`; // Use .xls for HTML-based Excel
    
    // Create blob and download with the correct MIME type
    const blob = new Blob([htmlContent], {type: 'application/vnd.ms-excel'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    // Trigger download and clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Send notification that export is complete
    window.postMessage({
      source: 'WAVoteExporter',
      exportComplete: true,
      success: true,
      method: 'html-excel',
      filename: fileName
    }, "*");
    
    return true;
  } catch (err) {
    console.error("HTML Excel export failed, trying CSV format");
    // Try CSV as absolute last resort
    exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    return false;
  }
}

// Helper function to sanitize HTML content
function sanitizeHTML(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Function to export data as CSV (last resort fallback)
function exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language = 'he') {
  try {
    // Get translations for the selected language
    const t = key => getTranslation(key, language);
    
    // Set proper locale for date formatting
    const localeCode = language === 'en' ? 'en-US' : 
                      language === 'es' ? 'es-ES' : 
                      language === 'fr' ? 'fr-FR' :
                      language === 'pt' ? 'pt-BR' :
                      language === 'ar' ? 'ar-SA' : 'he-IL';
    
    // Create CSV content - updated structure to match Excel export
    let csv = "";
    
    // Row 1: Column headers (Poll Name, Poll created date, Poll created time)
    csv += `"${t('pollName')}","${t('pollCreatedDate')}","${t('pollCreatedTime')}"\r\n`;
    
    // Row 2: Values for poll metadata
    // FIXED: Format poll creation date as DD.MM.YYYY
    const day = String(pollCreationDate.getDate()).padStart(2, '0');
    const month = String(pollCreationDate.getMonth() + 1).padStart(2, '0');
    const year = pollCreationDate.getFullYear();
    const pollCreatedDate = `${day}.${month}.${year}`;
    const pollCreatedTime = pollCreationDate.toLocaleTimeString(localeCode);
    csv += `"${(pollName || 'Poll').replace(/"/g, '""')}","${pollCreatedDate}","${pollCreatedTime}"\r\n`;
    
    // Rows 3-4: Empty rows as separator
    csv += `\r\n\r\n`;
    
    // Row 5: Total row
    csv += `"${t('total')}","","","",${pollOptions.map((_, i) => voteAccumulator[i] || 0).join(",")}\r\n`;
    
    // Row 6: Data headers
    csv += `"${t('name')}","${t('phone')}","${t('responseDate')}","${t('responseTime')}",${pollOptions.map(opt => `"${opt.replace(/"/g, '""')}"`).join(",")}\r\n`;
    
    // Row 7: Empty filter row
    csv += `"","","","",${pollOptions.map(() => `""`).join(",")}\r\n`;
    
    // Add individual votes with proper formatting (row 8+)
    voteRows.forEach(x => {
      // Ensure name and phone are properly quoted to handle special characters
      const safeName = x.name.replace(/"/g, '""');
      
      // Use the already formatted phone number - DON'T add '+' prefix
      let phoneStr = x.phone || "";
      
      // Clean up the phone number
      if (phoneStr.startsWith("'")) {
        phoneStr = phoneStr.substring(1);
      }
      if (phoneStr.includes('@')) {
        phoneStr = phoneStr.split('@')[0];
      }
      
      // Keep the properly formatted phone number as-is (e.g., 053-6210104)
      // Force Excel to treat phone as text by using the ="text" format
      const safePhone = `="${phoneStr}"`.replace(/"/g, '""');
      
      // Format date and time for CSV with the proper locale
      const dateFormatted = x.rawDate ? x.rawDate.toLocaleDateString(localeCode) : x.date;
      const timeFormatted = x.rawDate ? x.rawDate.toLocaleTimeString(localeCode) : x.time;
      
      // Add the row data
      csv += `"${safeName}","${safePhone}","${dateFormatted}","${timeFormatted}",`;
      csv += pollOptions.map((_, i) => x.votes && x.votes.includes(i) ? "X" : "").join(",");
      csv += "\r\n";
    });
    
    // Create sanitized filename
    const sanitizedPollName = (pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${sanitizedPollName}_${Date.now()}.csv`;
    
    // Create download link for CSV with UTF-8 BOM for better Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    
    // Append link, trigger download, and clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Send notification that export is complete
    window.postMessage({
      source: 'WAVoteExporter',
      exportComplete: true,
      success: true,
      method: 'csv',
      filename: fileName
    }, "*");
  } catch (err) {
    console.error("CSV export failed, unable to export data");
    // Last resort fallback - just display an alert
    try {
      alert("Failed to export data. Please try again or contact support.");
      
      // Send notification that export failed
      window.postMessage({
        source: 'WAVoteExporter',
        exportComplete: true,
        success: false,
        error: err.message
      }, "*");
    } catch (e) {
      console.error("Could not show error alert");
    }
  }
}

// Function to export data as native XLSX
function exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language = 'he') {
  try {
    // Get translations for the selected language
    const t = key => getTranslation(key, language);
    
    // Set proper locale for date formatting
    const localeCode = language === 'en' ? 'en-US' : 
                      language === 'es' ? 'es-ES' : 
                      language === 'fr' ? 'fr-FR' :
                      language === 'pt' ? 'pt-BR' :
                      language === 'ar' ? 'ar-SA' : 'he-IL';
    
    // Create workbook and worksheet - explicitly creating a new non-macro workbook
    const wb = window.XLSX.utils.book_new();
    
    // Ensure workbook is safe (no macros)
    if (!wb.Workbook) wb.Workbook = {};
    wb.Workbook.WBProps = { ...(wb.Workbook.WBProps || {}), codeName: "ThisWorkbook" };
    wb.Workbook.CalcPr = { ...(wb.Workbook.CalcPr || {}), calcId: 124519, fullCalcOnLoad: true };
    
    // Set RTL mode for the workbook (only for Hebrew)
    if (language === 'he') {
    if (!wb.Workbook.Views) wb.Workbook.Views = [];
    if (!wb.Workbook.Views[0]) wb.Workbook.Views[0] = {};
    wb.Workbook.Views[0].RTL = true;
    }
    
    const ws_data = [];
    
    // Row 1: Column headers (Poll Name, Poll created date, Poll created time)
    ws_data.push([t('pollName'), t('pollCreatedDate'), t('pollCreatedTime')]);
    
    // Row 2: Values for poll metadata
    // FIXED: Format poll creation date as DD.MM.YYYY
    const day = String(pollCreationDate.getDate()).padStart(2, '0');
    const month = String(pollCreationDate.getMonth() + 1).padStart(2, '0');
    const year = pollCreationDate.getFullYear();
    const pollCreatedDate = `${day}.${month}.${year}`;
    const pollCreatedTime = pollCreationDate.toLocaleTimeString(localeCode);
    ws_data.push([
      pollName || "Poll",
      { v: pollCreatedDate, t: 'd', z: window.XLSX.SSF.get_table()[14] }, // Date formatted
      { v: pollCreatedDate, t: 'd', z: window.XLSX.SSF.get_table()[20] }  // Time formatted
    ]);
    
    // Row 3-4: Empty rows as separator
    ws_data.push([]);
    ws_data.push([]);
    
    // Row 5: Total row
    const totalRow = [t('total'), "", "", "", ...pollOptions.map((_, i) => voteAccumulator[i] || 0)];
    ws_data.push(totalRow);
    
    // Row 6: Column headers for data
    const dataHeaders = [t('name'), t('phone'), t('responseDate'), t('responseTime'), ...pollOptions];
    ws_data.push(dataHeaders);
    
    // Row 7: Empty filter row
    ws_data.push(Array(dataHeaders.length).fill(""));
    
    // Add individual votes starting from row 8
    voteRows.forEach(x => {
      // Get the properly formatted phone number from the vote data
      let phoneStr = x.phone || "";
      
      // Clean up the phone number and ensure proper formatting
      if (phoneStr.startsWith("'")) {
        phoneStr = phoneStr.substring(1);
      }
      if (phoneStr.includes('@')) {
        phoneStr = phoneStr.split('@')[0];
      }
      
      // Use the already formatted phone number from the vote processing
      // This should already be in the correct format (e.g., 053-6210104 for Israeli numbers)
      // Don't add '+' prefix if it's already properly formatted
      console.log(`Processing phone for Excel: original="${x.phone}", cleaned="${phoneStr}"`);
      
      // Format date and time with the proper locale
      const dateFormatted = { 
        v: x.rawDate, 
        t: 'd', 
        z: window.XLSX.SSF.get_table()[14]
      };
      
      const timeFormatted = { 
        v: x.rawDate, 
        t: 'd', 
        z: window.XLSX.SSF.get_table()[20] 
      };
      
      const row = [
        x.name,
        // Force string format for phone with explicit text formatting
        // Use the properly formatted phone number as-is
        { v: phoneStr, t: 's', z: '@' },
        dateFormatted,
        timeFormatted,
        ...pollOptions.map((_, i) => x.votes && x.votes.includes(i) ? "X" : "")
      ];
      ws_data.push(row);
    });
    
    // Create worksheet from data
    const ws = window.XLSX.utils.aoa_to_sheet(ws_data);
    
    // Set RIGHT-TO-LEFT for the worksheet (only for Hebrew)
    if (language === 'he') {
    if (!ws["!sheetPr"]) ws["!sheetPr"] = {};
    ws["!sheetPr"].rightToLeft = true;
    
    // Add additional RTL settings
    if (!ws["!sheetView"]) ws["!sheetView"] = {};
    ws["!sheetView"].rightToLeft = true;
    }
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // A: Name/Poll Name
      { wch: 20 }, // B: Poll Created Date/Phone
      { wch: 20 }, // C: Poll Created Time/Response Date
      { wch: 15 }, // D: Response Time
      ...pollOptions.map(() => ({ wch: 15 })) // Poll options
    ];
    ws['!cols'] = colWidths;
    
    // Style all cells with special formatting
    if (window.XLSX.utils.encode_cell) {
      // STRONG Bold style for poll info headers (row 1)
      const titleBoldStyle = { 
        font: { bold: true, sz: 14 },
        alignment: { horizontal: language === 'he' ? "right" : "left" },
        border: { // Add border for emphasis
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        },
        fill: { fgColor: { rgb: "EEEEEE" } } // Light gray background
      };
      
      // Apply bold styling to all headers in row 1
      for (let i = 0; i < 3; i++) {
        const headerCell = window.XLSX.utils.encode_cell({ r: 0, c: i });
        if (ws[headerCell]) {
          ws[headerCell].s = titleBoldStyle;
        }
      }
      
      // Style for poll values (row 2)
      const pollValueStyle = {
        font: { sz: 12 },
        alignment: { horizontal: language === 'he' ? "right" : "left" },
        fill: { fgColor: { rgb: "F5F5F5" } } // Very light gray background
      };
      
      // Apply value styling to row 2
      for (let i = 0; i < 3; i++) {
        const valueCell = window.XLSX.utils.encode_cell({ r: 1, c: i });
        if (ws[valueCell]) {
          ws[valueCell].s = pollValueStyle;
        }
      }
      
      // Bold header styling for data column headers (row 6)
      const headerStyle = {
        font: { bold: true, color: { rgb: "000000" }, sz: 13 },
        fill: { fgColor: { rgb: "F2F2F2" } }, // Light gray background
        alignment: { horizontal: "center" },
        border: { // Add border for emphasis
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
      
      // Apply header styling to row 6 (data column headers)
      for (let i = 0; i < dataHeaders.length; i++) {
        const cellRef = window.XLSX.utils.encode_cell({ r: 5, c: i });
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      }
      
      // Add total row styling
      const totalStyle = {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: "E6E6FA" } }, // Light purple background
        alignment: { horizontal: language === 'he' ? "right" : "left" },
        border: { // Add border
          top: { style: "thin" },
          bottom: { style: "thin" }
        }
      };
      
      // Apply total row styling to row 5
      for (let i = 0; i < totalRow.length; i++) {
        const cellRef = window.XLSX.utils.encode_cell({ r: 4, c: i });
        if (ws[cellRef]) {
          ws[cellRef].s = totalStyle;
        }
      }
      
      // Data row styling - alternate row colors for better readability
      const evenRowStyle = {
        alignment: { horizontal: language === 'he' ? "right" : "left" },
        fill: { fgColor: { rgb: "F8F8FF" } } // Light background for even rows
      };
      
      const oddRowStyle = {
        alignment: { horizontal: language === 'he' ? "right" : "left" }
      };
      
      // Apply data row styling (rows 8+)
      for (let i = 7; i < voteRows.length + 7; i++) {
        const rowStyle = i % 2 === 0 ? evenRowStyle : oddRowStyle;
        
        for (let j = 0; j < dataHeaders.length; j++) {
          const cellRef = window.XLSX.utils.encode_cell({ r: i, c: j });
          
          // Skip if cell doesn't exist
          if (!ws[cellRef]) continue;
          
          // Apply basic style for the row
          if (!ws[cellRef].s) ws[cellRef].s = {};
          Object.assign(ws[cellRef].s, rowStyle);
          
          // Special handling for X marks in vote columns (bold and centered)
          if (j >= 4 && ws[cellRef].v === "X") {
            ws[cellRef].s.font = { bold: true };
            ws[cellRef].s.alignment = { horizontal: "center" };
          }
        }
      }
    }
    
    // CRITICAL FIX: Set number format for all phone cells
    for (let i = 7; i < voteRows.length + 7; i++) {
      // Phone column (column B) - force text format with proper formatting
      const phoneCell = window.XLSX.utils.encode_cell({r: i, c: 1});
      if (ws[phoneCell]) {
        // Triple check to ensure text format
        ws[phoneCell].t = 's';              // Set cell type to string
        ws[phoneCell].z = '@';              // Set number format to text (not general)
        
        // Apply right/left alignment based on language
        if (!ws[phoneCell].s) ws[phoneCell].s = {};
        ws[phoneCell].s.alignment = { horizontal: language === 'he' ? "right" : "left" };
        
        // Ensure the value is a text string but DON'T add '+' prefix
        const phoneValue = ws[phoneCell].v;
        if (typeof phoneValue === 'number') {
          // If somehow still a number, convert to string and format properly
          const numStr = phoneValue.toString();
          // Try to format as Israeli number if it looks like one
          if (numStr.length >= 9 && /^972/.test(numStr)) {
            const cleanNum = numStr.replace(/^972/, '');
            if (cleanNum.length === 9 && cleanNum.startsWith('5')) {
              ws[phoneCell].v = '0' + cleanNum.substring(0, 2) + '-' + cleanNum.substring(2);
            } else {
              ws[phoneCell].v = '0' + cleanNum;
            }
          } else {
            ws[phoneCell].v = numStr;
          }
        } else if (typeof phoneValue === 'string') {
          // Keep the already formatted phone number as-is
          let cleanPhone = phoneValue;
          // Remove any ' prefix
          if (cleanPhone.startsWith("'")) {
            cleanPhone = cleanPhone.substring(1);
          }
          // Remove @ if present
          if (cleanPhone.includes('@')) {
            cleanPhone = cleanPhone.split('@')[0];
          }
          
          // Keep the properly formatted phone number
          ws[phoneCell].v = cleanPhone;
          console.log(`Final phone format in Excel: ${cleanPhone}`);
        }
      }
    }
    
    // ADD FILTER CAPABILITY - Equivalent to Ctrl+Shift+L in Excel
    // Set autofilter for the data area (row 6-end)
    const lastCol = window.XLSX.utils.encode_col(dataHeaders.length - 1);
    const lastRow = voteRows.length + 7;
    ws['!autofilter'] = { ref: `A6:${lastCol}${lastRow}` };
    
    // Add worksheet to workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Votes");
    
    // Create a sanitized filename with the correct extension
    const sanitizedPollName = (pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_');
    let fileName = `${sanitizedPollName}_${Date.now()}`;

    // Ensure the file has the .xlsx extension
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      fileName += '.xlsx';
    }

    console.log(`Generating XLSX file: ${fileName}`);

    // Generate XLSX with proper MIME type and extension
    try {
      console.log("Starting XLSX file generation process");
      
      // IMPORTANT - Double check that XLSX is available before proceeding
      if (typeof window.XLSX === 'undefined' || !window.XLSX.utils || !window.XLSX.write) {
        throw new Error("XLSX library not available at export time");
      }
      
      // Create a blob with the correct XLSX MIME type
        const xlsxOptions = { 
        bookType: 'xlsx',   // Explicitly set format to xlsx
        bookSST: true,      // Generate shared string table
        type: 'array',      // Output as array buffer
        cellStyles: true,   // Include styles
        compression: true   // Enable compression for smaller files
      };
      
      console.log("XLSX options configured:", xlsxOptions);
      
      // Generate XLSX file content
      console.log("Generating XLSX binary content");
        const wbout = window.XLSX.write(wb, xlsxOptions);
      console.log("XLSX binary content generated successfully, size:", wbout.byteLength, "bytes");
      
      if (!wbout || wbout.byteLength < 100) {
        throw new Error("Invalid XLSX output generated - too small");
      }
      
      // Create a blob with the correct MIME type
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      console.log("Created blob with proper MIME type, size:", blob.size, "bytes");
      
      if (!blob || blob.size < 100) {
        throw new Error("Invalid blob created - too small");
      }
      
      // Create download link with forced .xlsx extension
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
      a.download = fileName;  // Already verified to end with .xlsx
      console.log("Download link created with filename:", fileName);
      
      // Add additional attributes to force download as XLSX
      a.setAttribute('data-downloadurl', ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', a.download, a.href].join(':'));
      a.setAttribute('target', '_blank');
        a.style.display = 'none';
        
        // Trigger download and clean up
        document.body.appendChild(a);
      console.log("Triggering download...");
      
      // Use a small delay to ensure the browser processes the download
      setTimeout(() => {
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
          console.log("Download link cleaned up");
        }, 1000);
      }, 100);
        
      console.log("XLSX export completed successfully");
      
      // Send notification that export is complete
      window.postMessage({
        source: 'WAVoteExporter',
        exportComplete: true,
        success: true,
        method: 'xlsx',
        filename: fileName
      }, "*");
      
      return true;
  } catch (err) {
      console.error("XLSX generation failed:", err.message);
      
      // Fallback to HTML-Excel method
      return exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    }
  } catch (err) {
    console.error("XLSX export failed, using fallback method");
    
    // Fallback to HTML-Excel method
    return exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
  }
}
