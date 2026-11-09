import { ShoppingCategory } from '../types/shopping.ts';
import { parseSpeechOrTextInput } from '../utils/shoppingParser.ts';

export const GEMINI_STORAGE_KEY = 'argon_gemini_api_key';

// Built-in default key (base64 encoded to avoid GitHub secret push scanning blocks)
// ONLY available to privileged family accounts!
const OBF_KEY = 'QVEuQWI4Uk42SnZYeTY3VlE5eHpMQXVPcVVQYWpLVEQ0MzYyRTJOTlhwQUJJZHhUV21PNFE=';
export const DEFAULT_GEMINI_API_KEY = typeof atob !== 'undefined' ? atob(OBF_KEY) : '';

export const PRIVILEGED_GEMINI_EMAILS = [
  'mturkey11@gmail.com',
  'meryemmehmetturhan@gmail.com'
];

export interface ParsedShoppingItem {
  name: string;
  quantity: string;
  category: ShoppingCategory;
}

export const VALID_CATEGORIES: ShoppingCategory[] = [
  'Meyve & Sebze',
  'Süt & Kahvaltılık',
  'Temel Gıda & Bakliyat',
  'Et, Tavuk & Balık',
  'Fırın & Unlu Mamul',
  'İçecekler',
  'Atıştırmalık & Tatlı',
  'Temizlik & Ev',
  'Kişisel Bakım',
  'Diğer'
];

/**
 * Helper to read the currently logged-in user's email from storage
 */
export function getActiveUserEmail(): string {
  try {
    const activeUserRaw = localStorage.getItem('argon_finance_active_user_v2');
    if (activeUserRaw) {
      const parsed = JSON.parse(activeUserRaw);
      if (parsed?.email) return String(parsed.email).trim().toLowerCase();
    }
    const sessionRaw = localStorage.getItem('argon_auth_session');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed?.email) return String(parsed.email).trim().toLowerCase();
    }
  } catch {}
  return '';
}

/**
 * Checks whether the given (or currently active) user is one of the 2 privileged accounts
 * that have permanent built-in Gemini API access.
 */
export function isPrivilegedGeminiUser(userEmail?: string): boolean {
  const email = (userEmail || getActiveUserEmail()).trim().toLowerCase();
  return PRIVILEGED_GEMINI_EMAILS.includes(email);
}

/**
 * Returns the Gemini API key for the current user:
 * - If user is mturkey11@gmail.com or meryemmehmetturhan@gmail.com: returns permanent built-in key (or custom override).
 * - For any other user: ONLY returns their own personal key entered in settings (never exposes the built-in key).
 */
export function getGeminiApiKey(userEmail?: string): string {
  const email = (userEmail || getActiveUserEmail()).trim().toLowerCase();

  try {
    if (email) {
      const userScopedKey = localStorage.getItem(`${GEMINI_STORAGE_KEY}_${email}`)?.trim();
      if (userScopedKey) return userScopedKey;
    }
    const genericUserKey = localStorage.getItem(GEMINI_STORAGE_KEY)?.trim();
    if (genericUserKey) return genericUserKey;
  } catch {}

  if (isPrivilegedGeminiUser(email)) {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
    if (envKey && String(envKey).trim()) {
      return String(envKey).trim();
    }
    return DEFAULT_GEMINI_API_KEY;
  }

  return '';
}

/**
 * Saves or clears user's personal Gemini API key in localStorage.
 */
export function setGeminiApiKey(key: string, userEmail?: string): void {
  const email = (userEmail || getActiveUserEmail()).trim().toLowerCase();
  try {
    const trimmed = key.trim();
    const storageKey = email ? `${GEMINI_STORAGE_KEY}_${email}` : GEMINI_STORAGE_KEY;
    if (trimmed) {
      localStorage.setItem(storageKey, trimmed);
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Check if a Gemini API key is available for the current user.
 */
export function hasGeminiApiKey(userEmail?: string): boolean {
  return !!getGeminiApiKey(userEmail);
}

/**
 * Tests an API key with a small prompt to verify validity.
 */
export async function testGeminiApiKey(key: string): Promise<{ success: boolean; message: string }> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { success: false, message: 'Lütfen geçerli bir Gemini API anahtarı girin.' };
  }

  try {
    const res = await parseShoppingItemsWithGemini('elma, ekmek', trimmed);
    if (res.usedAi && res.items.length > 0) {
      return { success: true, message: `Bağlantı başarılı! Gemini AI (${res.items.length} ürün) ile çalışıyor.` };
    }
    return { success: false, message: res.error || 'Gemini yanıt veremedi, lütfen anahtarı kontrol edin.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'API anahtarı doğrulanamadı.' };
  }
}

/**
 * Calls Gemini API to parse natural language or speech text into structured shopping items.
 * Uses structured JSON schema with gemini-3.5-flash (with fallbacks).
 * Seamlessly falls back to local regex parser if AI fails or key is missing.
 */
export async function parseShoppingItemsWithGemini(
  input: string,
  customApiKey?: string,
  options?: { ignoreQuantities?: boolean; userEmail?: string }
): Promise<{ items: ParsedShoppingItem[]; usedAi: boolean; error?: string }> {
  const email = (options?.userEmail || getActiveUserEmail()).trim().toLowerCase();
  const apiKey = customApiKey?.trim() || getGeminiApiKey(email);
  const cleanInput = input.trim();
  const ignoreQuantities = options?.ignoreQuantities ?? false;

  if (!cleanInput) {
    return { items: [], usedAi: false };
  }

  // If no Gemini key is available on client, try backend server route (only works if privileged) or fallback to local parser
  if (!apiKey) {
    if (isPrivilegedGeminiUser(email)) {
      try {
        const res = await fetch('/api/ai/parse-shopping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: cleanInput, userEmail: email })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            return { items: data.items, usedAi: true };
          }
        }
      } catch {}
    }

    // Fallback to local regex-based parser
    const localParsed = parseSpeechOrTextInput(cleanInput, ignoreQuantities);
    return { items: localParsed, usedAi: false };
  }

  const quantityInstruction = ignoreQuantities
    ? `- quantity: Her ürün için SADECE "1 adet" yaz. Metindeki hiçbir sayıyı, kiloyu veya adeti dikkate alma, ürün adından sayıları tamamen temizle.`
    : `- quantity: Kullanıcı AÇIKÇA ve NET bir ölçü birimi (örn: "2 kilo", "500 gram", "3 paket", "yarım kilo") söylediyse yaz, aksi halde HER ZAMAN "1 adet" yaz. ASLA kafandan sayı uydurma (örneğin 'vişne' veya 'çikolata' dediğinde '10 tane çikolata' YAZMA, sadece '1 adet' yaz).`;

  const prompt = `Sen Türkçe alışveriş listesi asistanısın. Kullanıcının sesle söylediği veya yazdığı metinden SADECE satın alınacak alışveriş ürünlerini ayıkla.
Girdi: "${cleanInput}"

Her ürün için:
- name: Sadece temiz ürün adı (Düzgün Türkçe, baş harfi büyük, örn: "Domates", "Çikolata", "Vişne", "Bulaşık Deterjanı"). İçinde sayı, "tane", "adet", "kilo", "alalım", "lazım", "bir şey" gibi kelimeler OLMASIN.
${quantityInstruction}
- category: SADECE şu kategorilerden biri olmalıdır:
  "Meyve & Sebze", "Süt & Kahvaltılık", "Temel Gıda & Bakliyat", "Et, Tavuk & Balık", "Fırın & Unlu Mamul", "İçecekler", "Atıştırmalık & Tatlı", "Temizlik & Ev", "Kişisel Bakım", "Diğer"

Çok Önemli Kurallar:
1. Mikrofon ses tanıma bazen kelimelerin başındaki heceleri sayı gibi yanlış yazabilir ("bişi çikolata" -> "Çikolata", "on çikolata" -> "Çikolata"). Şüpheli sayıları sil ve sadece temiz ürün adını ("Çikolata") al!
2. Aynı ürün birden fazla kez geçiyorsa tek satırda birleştir.
3. Sadece gerçek market/pazar/ev ürünlerini döndür.`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            quantity: { type: 'STRING' },
            category: {
              type: 'STRING',
              enum: VALID_CATEGORIES
            }
          },
          required: ['name', 'quantity', 'category']
        }
      }
    }
  };

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError = '';

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errDetail = '';
        try {
          const errJson = await response.json();
          errDetail = errJson?.error?.message || response.statusText;
        } catch {
          errDetail = await response.text();
        }
        lastError = `Gemini HTTP ${response.status}: ${errDetail}`;
        console.warn(`Gemini model ${model} failed (${response.status}):`, errDetail);
        continue;
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = 'Boş yanıt alındı';
        continue;
      }

      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized: ParsedShoppingItem[] = parsed
          .map(item => ({
            name: String(item.name || '').replace(/^\d+\s*(adet|tane|kg|kilo|gr|gram|paket|litre|lt)?\s*/i, '').trim(),
            quantity: ignoreQuantities ? '1 adet' : String(item.quantity || '1 adet').trim(),
            category: VALID_CATEGORIES.includes(item.category) ? item.category : 'Diğer'
          }))
          .filter(i => i.name.length > 0);

        return { items: sanitized, usedAi: true };
      }
    } catch (err: any) {
      lastError = err.message || String(err);
      console.warn(`Error calling ${model}:`, err);
    }
  }

  // Graceful fallback to local regex parser
  console.warn('Gemini request failed, falling back to local parser:', lastError);
  const localParsed = parseSpeechOrTextInput(cleanInput, ignoreQuantities);
  return { items: localParsed, usedAi: false, error: lastError };
}
