import { ShoppingCategory } from '../types/shopping.ts';
import { parseSpeechOrTextInput } from '../utils/shoppingParser.ts';

export const GEMINI_STORAGE_KEY = 'argon_gemini_api_key';

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
 * Returns the currently active Gemini API key (localStorage or environment).
 */
export function getGeminiApiKey(): string {
  try {
    const userKey = localStorage.getItem(GEMINI_STORAGE_KEY)?.trim();
    if (userKey) return userKey;
  } catch {}

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
  return String(envKey).trim();
}

/**
 * Saves or clears user's Gemini API key in localStorage.
 */
export function setGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Check if a Gemini API key is configured.
 */
export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
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
    const res = await parseShoppingItemsWithGemini('1 kg elma, 2 ekmek', trimmed);
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
 * Uses structured JSON schema with gemini-2.5-flash (with fallbacks).
 * Seamlessly falls back to local regex parser if AI fails or key is missing.
 */
export async function parseShoppingItemsWithGemini(
  input: string,
  customApiKey?: string
): Promise<{ items: ParsedShoppingItem[]; usedAi: boolean; error?: string }> {
  const apiKey = customApiKey?.trim() || getGeminiApiKey();
  const cleanInput = input.trim();

  if (!cleanInput) {
    return { items: [], usedAi: false };
  }

  // If no Gemini key is provided, try backend server route or fallback to local parser
  if (!apiKey) {
    try {
      const res = await fetch('/api/ai/parse-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cleanInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          return { items: data.items, usedAi: true };
        }
      }
    } catch {}

    // Fallback to local regex-based parser
    const localParsed = parseSpeechOrTextInput(cleanInput);
    return { items: localParsed, usedAi: false };
  }

  const prompt = `Sen Türkçe alışveriş listesi asistanısın. Kullanıcının söylediği veya yazdığı serbest metinden alışveriş ürünlerini ayıkla.
Girdi: "${cleanInput}"

Her ürün için:
- name: Ürün adı (Düzgün Türkçe, baş harfi büyük, örn: "Domates", "Kıvırcık Marul", "Bulaşık Deterjanı"). Dolgu kelimeleri veya konuşma parçalarını ("alalım", "lazım", "eve", "bize", "akşama") ÇIKAR.
- quantity: Miktar (örn: "1 kg", "500 gr", "2 adet", "1 paket", "1 demet", "yarım kilo", "1 şişe"). Belirtilmemişse "1 adet" yaz.
- category: SADECE şu kategorilerden biri olmalıdır:
  "Meyve & Sebze", "Süt & Kahvaltılık", "Temel Gıda & Bakliyat", "Et, Tavuk & Balık", "Fırın & Unlu Mamul", "İçecekler", "Atıştırmalık & Tatlı", "Temizlik & Ev", "Kişisel Bakım", "Diğer"

Kurallar:
- Aynı ürün birden fazla kez söylenmişse miktarlarını mantıklı şekilde birleştir.
- Konuşma ses tanıma hatalarını ("bşr kilo kiyma" -> "Kıyma", "1 kg") düzelt.
- Alışverişle ilgisi olmayan selamlaşma/konuşmaları atla, sadece satın alınacak somut ürünleri döndür.`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
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

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
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
            name: String(item.name || '').trim(),
            quantity: String(item.quantity || '1 adet').trim(),
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
  const localParsed = parseSpeechOrTextInput(cleanInput);
  return { items: localParsed, usedAi: false, error: lastError };
}
