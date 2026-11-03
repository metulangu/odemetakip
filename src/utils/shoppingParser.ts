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
export function extractQuantityAndName(raw: string): { name: string; quantity: string } {
  let text = raw.trim();
  let quantity = '';

  const qtyPatterns = [
    /^(yarım|çeyrek|bir buçuk)\s*(kilo|kg|litre|lt|ekmek|demet|paket)?/i,
    /^(\d+(?:[.,]\d+)?)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|dilim|poşet|bağ)\b/i,
    /^(\d+(?:[.,]\d+)?)\s+/i // e.g. "2 ekmek" -> "2 adet"
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
    const suffixMatch = text.match(/\s+(\d+(?:[.,]\d+)?\s*(?:kg|kilo|gr|gram|adet|tane|paket|litre|lt|demet|şişe|kutu|koli)?|(?:yarım|çeyrek)\s*(?:kilo|kg|litre)?)$/i);
    if (suffixMatch) {
      let matchedSuffix = suffixMatch[1].trim();
      if (/^\d+(?:[.,]\d+)?$/.test(matchedSuffix)) {
        matchedSuffix = `${matchedSuffix} adet`;
      }
      quantity = matchedSuffix;
      text = text.substring(0, suffixMatch.index).trim();
    }
  }

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
 * Handles continuous speech like "kahve 1 kg muz 2 ekmek yarım kilo peynir"
 * as well as "elma armut muz" or "süt peynir yumurta"
 */
export function parseSpeechOrTextInput(input: string): Array<{ name: string; quantity: string; category: ShoppingCategory }> {
  if (!input || !input.trim()) return [];

  let text = input.trim();

  // 1. Replace spoken connectors ("ve", "ile", "bir de", "ayrıca", "dahil", "sonra") with commas
  text = text
    .replace(/\b(ve|ile|bir de|ayrıca|dahil|sonra)\b/gi, ',')
    .replace(/[;\n\r]+/g, ',');

  // 2. Insert comma before quantity keywords that start mid-sentence
  // e.g. "kahve 1 kg muz" -> "kahve, 1 kg muz"
  // e.g. "muz 2 ekmek" -> "muz, 2 ekmek"
  // e.g. "domates yarım kilo peynir" -> "domates, yarım kilo peynir"
  text = text.replace(/([^\s,]+)\s+((?:yarım|çeyrek|bir buçuk)\s*(?:kilo|kg|litre|ekmek|demet|paket)?)/gi, '$1, $2');
  text = text.replace(/([^\s,]+)\s+(\d+(?:[.,]\d+)?\s*(?:kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|bağ)\b)/gi, '$1, $2');
  text = text.replace(/([^\s,]+)\s+(\d+(?:[.,]\d+)?\s+[a-zA-ZçğıöşüÇĞİÖŞÜ]+)/gi, '$1, $2');

  // Split by comma
  let parts = text
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // 3. For any remaining part that might still contain multiple space-separated known items (e.g. "elma armut muz")
  const expandedParts: string[] = [];
  
  // Flatten all known single-word keywords
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
    // If it's 2 or more words, has no quantity, but each word is a known grocery item (e.g. "elma armut muz" or "süt peynir")
    const hasNumber = /\d|yarım|çeyrek|kilo|kg|paket|adet/i.test(part);
    if (!hasNumber && words.length >= 2 && words.every(w => allKnownKeywords.has(toTrLower(w)))) {
      // Split each word into its own item!
      expandedParts.push(...words);
    } else {
      expandedParts.push(part);
    }
  }

  const results: Array<{ name: string; quantity: string; category: ShoppingCategory }> = [];

  for (const p of expandedParts) {
    const { name, quantity } = extractQuantityAndName(p);
    if (!name) continue;

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
