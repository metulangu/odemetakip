import { ShoppingCategory, ShoppingItem } from '../types/shopping.ts';

const CATEGORY_KEYWORDS: Record<ShoppingCategory, string[]> = {
  'Meyve & Sebze': [
    'elma', 'armut', 'muz', 'portakal', 'mandalina', 'limon', 'çilek', 'üzüm', 'karpuz', 'kavun',
    'şeftali', 'kayısı', 'kiraz', 'vişne', 'erik', 'nar', 'avokado', 'kivi', 'ananas', 'incir',
    'domates', 'salatalık', 'hıyar', 'biber', 'çarliston', 'kapya', 'patlıcan', 'kabak', 'patates',
    'soğan', 'sarımsak', 'havuç', 'marul', 'kıvırcık', 'maydanoz', 'dereotu', 'nane', 'roka',
    'ıspanak', 'pırasa', 'lahana', 'karnabahar', 'brokoli', 'kereviz', 'enginar', 'bezelye',
    'bamya', 'mantar', 'turp', 'semizotu', 'yeşillik', 'narenciye', 'yeşil soğan', 'taze soğan'
  ],
  'Süt & Kahvaltılık': [
    'süt', 'yoğurt', 'peynir', 'kaşar', 'beyaz peynir', 'lor', 'tulum', 'krem peynir', 'labne',
    'süzme peynir', 'tereyağı', 'margarin', 'kaymak', 'zeytin', 'siyah zeytin', 'yeşil zeytin',
    'yumurta', 'bal', 'reçel', 'pekmez', 'tahin', 'helva', 'fındık ezmesi', 'fıstık ezmesi',
    'sucuk', 'sosis', 'salam', 'pastırma', 'gevrek', 'müsli', 'yulaf', 'mısır gevreği'
  ],
  'Temel Gıda & Bakliyat': [
    'un', 'şeker', 'esmer şeker', 'tuz', 'pirinç', 'bulgur', 'mercimek', 'nohut', 'fasulye',
    'kuru fasulye', 'barbunya', 'makarna', 'spagetti', 'şehriye', 'salça', 'domates salçası',
    'biber salçası', 'sıvı yağ', 'ayçiçek yağı', 'zeytinyağı', 'mısırözü', 'sirke', 'nar ekşisi',
    'baharat', 'karabiber', 'pul biber', 'kekik', 'kimyon', 'tarçın', 'maya', 'kabartma tozu',
    'vanilya', 'vanilin', 'nişasta', 'irmik', 'konserve', 'ton balığı', 'hazır çorba', 'bulyon',
    'ketçap', 'mayonez', 'hardal', 'sos', 'soya sosu'
  ],
  'Et, Tavuk & Balık': [
    'kıyma', 'kuşbaşı', 'dana eti', 'kuzu eti', 'biftek', 'antrikot', 'pirzola', 'bonfile',
    'köfte', 'tavuk', 'but', 'tavuk göğsü', 'kanat', 'baget', 'hindi', 'balık', 'somon',
    'hamsi', 'levrek', 'çipura', 'palamut', 'mezgit', 'karides'
  ],
  'Fırın & Unlu Mamul': [
    'ekmek', 'tam buğday', 'kepekli ekmek', 'somun', 'baget', 'pide', 'lavaş', 'bazlama',
    'yufka', 'simit', 'poğaça', 'açma', 'börek', 'tost ekmeği', 'hamburger ekmeği',
    'kurabiye', 'galeta', 'kruvasan'
  ],
  'İçecekler': [
    'su', 'damacana', 'maden suyu', 'soda', 'çay', 'dökme çay', 'demlik çay', 'poşet çay',
    'kahve', 'türk kahvesi', 'filtre kahve', 'nescafe', 'espresso', 'kola', 'coca cola',
    'fanta', 'sprite', 'gazoz', 'meyve suyu', 'limonata', 'ayran', 'şalgam', 'buzlu çay',
    'fuse tea', 'lipton', 'kefir', 'enerji içeceği', 'sütlü kahve'
  ],
  'Atıştırmalık & Tatlı': [
    'çikolata', 'gofret', 'bisküvi', 'cips', 'kraker', 'kuruyemiş', 'fındık', 'fıstık',
    'ceviz', 'badem', 'kaju', 'çekirdek', 'ayçekirdeği', 'kabak çekirdeği', 'kek',
    'dondurma', 'puding', 'jelibon', 'sakız', 'lokum', 'bar', 'popcorn', 'patlamış mısır'
  ],
  'Temizlik & Ev': [
    'deterjan', 'çamaşır deterjanı', 'toz deterjan', 'sıvı deterjan', 'yumuşatıcı',
    'bulaşık tableti', 'fairy', 'finish', 'bulaşık deterjanı', 'çamaşır suyu', 'domestos',
    'ace', 'yüzey temizleyici', 'camsil', 'cif', 'porçöz', 'kireç sökücü', 'sabun',
    'sıvı sabun', 'çöp poşeti', 'sünger', 'bulaşık süngeri', 'mikrofiber', 'bez',
    'peçete', 'havlu kağıt', 'kağıt havlu', 'tuvalet kağıdı', 'streç film', 'alüminyum folyo',
    'pişirme kağıdı', 'oda spreyi', 'vileda', 'mop'
  ],
  'Kişisel Bakım': [
    'şampuan', 'saç kremi', 'duş jeli', 'saç maskesi', 'diş macunu', 'diş fırçası',
    'gargara', 'deodorant', 'roll-on', 'parfüm', 'pamuk', 'makyaj pamuğu', 'kulak pamuğu',
    'kolonya', 'ıslak mendil', 'tıraş bıçağı', 'tıraş köpüğü', 'jilet', 'el kremi',
    'vücut kremi', 'vazelin', 'güneş kremi', 'ağda', 'ped'
  ],
  'Diğer': []
};

// Turkish lowercase helper
function toTrLower(str: string): string {
  return str.toLocaleLowerCase('tr-TR');
}

/**
 * Removes repeated words and duplicate consecutive phrases caused by mobile speech engines
 * Using Turkish-safe whitespace boundaries instead of ASCII \b
 */
export function removeRepeatedPhrases(text: string): string {
  let prev = '';
  let curr = text.trim();
  let maxLoop = 4;
  while (prev !== curr && maxLoop-- > 0) {
    prev = curr;
    // Remove immediate duplicate single words using whitespace boundary (safe for Turkish letters)
    curr = curr.replace(/(^|\s+)([a-zA-ZçğıöşüÇĞİÖŞÜ0-9]{2,})\s+\2(?=\s+|$|[.,;])/gi, '$1$2');
  }
  return curr;
}

/**
 * Converts Turkish spoken number words to numeric digits ONLY when clearly followed by a unit
 * (e.g. "iki kilo", "üç paket") to prevent turning normal words into numbers.
 */
export function normalizeTurkishSpokenNumbers(text: string): string {
  let res = text;

  const unitPattern = '(?:kilo|kg|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|bağ)';

  // Multi-word numbers before units
  const multiWords: Record<string, number> = {
    'iki yüz elli': 250, 'beş yüz': 500, 'on beş': 15, 'on iki': 12, 'on bir': 11, 'yirmi beş': 25
  };
  for (const [mw, val] of Object.entries(multiWords)) {
    const reg = new RegExp(`(^|[\\s,.;])${mw}\\s+(?=${unitPattern}(?:$|[\\s,.;]))`, 'gi');
    res = res.replace(reg, `$1${val} `);
  }

  // Single word numbers ONLY when followed by an explicit unit
  const singleNumbers: Record<string, number> = {
    'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5,
    'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9, 'on': 10
  };

  for (const [sw, val] of Object.entries(singleNumbers)) {
    const reg = new RegExp(`(^|[\\s,.;])${sw}\\s+(?=${unitPattern}(?:$|[\\s,.;]))`, 'gi');
    res = res.replace(reg, `$1${val} `);
  }

  return res;
}

/**
 * Automatically determine the shopping category based on Turkish item name
 */
export function detectCategory(name: string): ShoppingCategory {
  const lower = toTrLower(name);
  const words = lower.split(/[\s,.-]+/).filter(Boolean);

  const categoryOrder: ShoppingCategory[] = [
    'Kişisel Bakım',
    'Temizlik & Ev',
    'Atıştırmalık & Tatlı',
    'İçecekler',
    'Fırın & Unlu Mamul',
    'Et, Tavuk & Balık',
    'Süt & Kahvaltılık',
    'Meyve & Sebze',
    'Temel Gıda & Bakliyat',
    'Diğer'
  ];

  for (const category of categoryOrder) {
    if (category === 'Diğer') continue;
    const keywords = CATEGORY_KEYWORDS[category];
    for (const kw of keywords) {
      const lowerKw = toTrLower(kw);
      if (lowerKw.includes(' ')) {
        if (lower.includes(lowerKw)) return category;
      } else if (lowerKw.length <= 3) {
        if (words.includes(lowerKw)) return category;
      } else {
        if (words.some(w => w.startsWith(lowerKw) || w === lowerKw) || lower.includes(lowerKw)) {
          return category;
        }
      }
    }
  }

  return 'Diğer';
}

/**
 * Extracts quantity string and cleans up the item name
 */
export function extractQuantityAndName(raw: string, ignoreQuantities = false): { name: string; quantity: string } {
  let text = raw.trim();
  let quantity = '';

  if (ignoreQuantities) {
    // Strip any leading/trailing numbers or unit words so only pure product name remains
    text = text
      .replace(/^(\d+(?:[.,]\d+)?|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım|çeyrek)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|dilim|poşet|bağ)?\s*/gi, '')
      .replace(/\s+(\d+(?:[.,]\d+)?)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli)?$/gi, '')
      .trim();

    let cleanName = text || raw.trim();
    if (cleanName.length > 0) {
      cleanName = cleanName.charAt(0).toLocaleUpperCase('tr-TR') + cleanName.slice(1);
    }
    return { name: cleanName, quantity: '1 adet' };
  }

  const qtyPatterns = [
    /^(yarım|çeyrek|bir buçuk)\s*(kilo|kg|litre|lt|ekmek|demet|paket)?(?=\s+|$)/i,
    /^(\d+(?:[.,]\d+)?)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|dilim|poşet|bağ)(?=\s+|$)/i,
    /^(bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|dilim|bağ)(?=\s+|$)/i,
    /^(\d+(?:[.,]\d+)?)\s+/i
  ];

  for (const pattern of qtyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let matchedStr = match[0].trim();
      if (/^\d+(?:[.,]\d+)?$/.test(matchedStr)) {
        matchedStr = `${matchedStr} adet`;
      }
      quantity = matchedStr;
      text = text.substring(match[0].length).trim();
      break;
    }
  }

  if (!quantity) {
    const suffixMatch = text.match(/\s+(\d+(?:[.,]\d+)?\s*(?:kg|kilo|gr|gram|adet|tane|paket|litre|lt|demet|şişe|kutu|koli)|(?:yarım|çeyrek)\s*(?:kilo|kg|litre))$/i);
    if (suffixMatch) {
      let matchedSuffix = suffixMatch[1].trim();
      if (/^\d+(?:[.,]\d+)?$/.test(matchedSuffix)) {
        matchedSuffix = `${matchedSuffix} adet`;
      }
      quantity = matchedSuffix;
      text = text.substring(0, suffixMatch.index).trim();
    }
  }

  text = text.replace(/^(bir|1)\s*(kilo|kg|adet|tane)\s*/i, '');

  let cleanName = text;
  if (cleanName.length > 0) {
    cleanName = cleanName.charAt(0).toLocaleUpperCase('tr-TR') + cleanName.slice(1);
  } else {
    cleanName = raw.trim();
  }

  return {
    name: cleanName,
    quantity: quantity || '1 adet'
  };
}

/**
 * Splits continuous voice transcript or comma/line separated input into discrete shopping items.
 */
export function parseSpeechOrTextInput(
  input: string,
  ignoreQuantities = false
): Array<{ name: string; quantity: string; category: ShoppingCategory }> {
  if (!input || !input.trim()) return [];

  // Step 1: Remove repeated word sequences from mobile speech glitches
  let text = removeRepeatedPhrases(input);

  // Step 2: Normalize spoken Turkish numbers only when followed by explicit units
  if (!ignoreQuantities) {
    text = normalizeTurkishSpokenNumbers(text);
  }

  // Step 3: Replace spoken connectors ("ve", "ile", "bir de", "ayrıca", "dahil", "sonra") with commas (Turkish-safe boundary)
  text = text
    .replace(/(^|\s+)(ve|ile|bir de|ayrıca|dahil|sonra)(?=\s+|$)/gi, ',')
    .replace(/[;\n\r]+/g, ',');

  if (!ignoreQuantities) {
    // Step 4: Insert comma before quantity keywords that start mid-sentence
    text = text.replace(/([^\s,]+)\s+((?:yarım|çeyrek|bir buçuk)\s*(?:kilo|kg|litre|ekmek|demet|paket)?)/gi, '$1, $2');
    text = text.replace(/([^\s,]+)\s+(\d+(?:[.,]\d+)?\s*(?:kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|bağ)(?=\s+|$))/gi, '$1, $2');
  }

  // Split by comma
  let parts = text
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Step 5: For any remaining part that might still contain multiple space-separated known items (e.g. "elma armut muz")
  const expandedParts: string[] = [];
  
  const allKnownKeywords = new Set<string>();
  for (const list of Object.values(CATEGORY_KEYWORDS)) {
    for (const kw of list) {
      if (!kw.includes(' ') && kw.length >= 3) {
        allKnownKeywords.add(toTrLower(kw));
      }
    }
  }

  for (const part of parts) {
    const words = part.split(/\s+/).filter(Boolean);
    const hasNumber = /\d|yarım|çeyrek|kilo|kg|paket|adet/i.test(part);
    if ((ignoreQuantities || !hasNumber) && words.length >= 2 && words.every(w => allKnownKeywords.has(toTrLower(w)))) {
      expandedParts.push(...words);
    } else {
      expandedParts.push(part);
    }
  }

  const results: Array<{ name: string; quantity: string; category: ShoppingCategory }> = [];
  const seenNames = new Set<string>();

  for (const p of expandedParts) {
    const { name, quantity } = extractQuantityAndName(p, ignoreQuantities);
    if (!name) continue;

    const lowerName = toTrLower(name);
    if (seenNames.has(lowerName)) {
      continue;
    }
    seenNames.add(lowerName);

    const category = detectCategory(name);
    results.push({
      name,
      quantity,
      category
    });
  }

  return results;
}

/**
 * Factory helper to create a ready ShoppingItem
 */
export function createShoppingItem(name: string, quantity?: string, category?: ShoppingCategory): ShoppingItem {
  const cat = category || detectCategory(name);
  return {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim(),
    quantity: quantity || '1 adet',
    category: cat,
    completed: false,
    createdAt: new Date().toISOString()
  };
}
