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

  // Split into words for strict matching on short words
  const words = lower.split(/[\s,.-]+/).filter(Boolean);

  // Check categories in priority order (Personal Care & Cleaning before basic staples)
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
      // For multi-word keywords (e.g. "diş macunu", "ayçiçek yağı"), use substring check
      if (lowerKw.includes(' ')) {
        if (lower.includes(lowerKw)) return category;
      } else if (lowerKw.length <= 3) {
        // For short keywords (e.g. "un", "et", "su", "çay", "bal", "yağ", "tuz"), require exact whole-word match
        if (words.includes(lowerKw)) return category;
      } else {
        // For longer single words (>= 4 chars like "deterjan", "elma", "peynir"), check if any word starts with it or contains it
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
 * Examples:
 * "1 kg muz" -> { quantity: "1 kg", name: "Muz" }
 * "2 ekmek" -> { quantity: "2 adet", name: "Ekmek" }
 * "yarım kilo kıyma" -> { quantity: "yarım kilo", name: "Kıyma" }
 * "500 gr fıstık" -> { quantity: "500 gr", name: "Fıstık" }
 * "domates" -> { quantity: "1 kg", name: "Domates" } (or undefined)
 */
export function extractQuantityAndName(raw: string): { name: string; quantity: string } {
  let text = raw.trim();
  let quantity = '';

  // Patterns for Turkish quantities:
  // e.g. "1.5 kg", "2 kilo", "500 gr", "250 gram", "3 paket", "2 adet", "1 tane", "1 demet", "1 litre", "yarım kilo", "1 şişe", "1 kutu", "1 koli"
  const qtyPatterns = [
    /^(yarım|çeyrek|bir buçuk)\s*(kilo|kg|litre|lt|ekmek|demet|paket)?/i,
    /^(\d+(?:[.,]\d+)?)\s*(kg|kilo|gr|gram|adet|tane|paket|pkt|litre|lt|demet|şişe|kutu|koli|dilim|poşet|bağ)\b/i,
    /^(\d+(?:[.,]\d+)?)\s+/i // e.g. "2 ekmek" -> "2 adet"
  ];

  for (const pattern of qtyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchedStr = match[0].trim();
      quantity = matchedStr;
      
      // If it's just a raw number like "2", append "adet"
      if (/^\d+(?:[.,]\d+)?$/.test(quantity)) {
        quantity = `${quantity} adet`;
      }

      text = text.substring(match[0].length).trim();
      break;
    }
  }

  // Also check suffix quantity e.g. "muz 1 kg" or "ekmek 2 adet"
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

  // Capitalize first letter of item name
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
 * Example: "kahve, 1 kg muz ve 2 paket makarna bir de tuvalet kağıdı"
 */
export function parseSpeechOrTextInput(input: string): Array<{ name: string; quantity: string; category: ShoppingCategory }> {
  if (!input || !input.trim()) return [];

  // Replace common Turkish speech conjunctions with commas
  let normalized = input
    .replace(/\b(ve|ile|bir de|ayrıca|dahil|sonra)\b/gi, ',')
    .replace(/[;\n\r]+/g, ',');

  // Split by comma
  const parts = normalized
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const results: Array<{ name: string; quantity: string; category: ShoppingCategory }> = [];

  for (const part of parts) {
    // If the part is long and contains multiple numbers, handle further sub-splitting
    const { name, quantity } = extractQuantityAndName(part);
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
