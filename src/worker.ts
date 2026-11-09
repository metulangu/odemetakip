interface Env {
  ASSETS: { fetch: typeof fetch };
  DB?: any;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Endpoint for AI Shopping Parser: /api/ai/parse-shopping
    if (url.pathname === '/api/ai/parse-shopping' && request.method === 'POST') {
      try {
        const { input, userEmail, customApiKey } = await request.json() as { input?: string; userEmail?: string; customApiKey?: string };
        const normalizedEmail = (userEmail || '').trim().toLowerCase();
        const isPrivileged = normalizedEmail === 'mturkey11@gmail.com' || normalizedEmail === 'meryemmehmetturhan@gmail.com';

        const obfKey = 'QVEuQWI4Uk42SnZYeTY3VlE5eHpMQXVPcVVQYWpLVEQ0MzYyRTJOTlhwQUJJZHhUV21PNFE=';
        const defaultKey = typeof atob !== 'undefined' ? atob(obfKey) : '';
        const serverKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || defaultKey;

        const apiKey = customApiKey?.trim() || (isPrivileged ? serverKey : '');
        if (!apiKey) {
          return new Response(JSON.stringify({ success: false, error: 'Bu hesap için kendi Gemini API anahtarınızı girmeniz gerekmektedir.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (!input || !input.trim()) {
          return new Response(JSON.stringify({ success: true, items: [] }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const validCategories = [
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

        const prompt = `Sen Türkçe alışveriş listesi asistanısın. Kullanıcının söylediği veya yazdığı serbest metinden alışveriş ürünlerini ayıkla.
Girdi: "${input.trim()}"

Her ürün için name, quantity ve category içeren JSON dizisi döndür.`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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
                    category: { type: 'STRING', enum: validCategories }
                  },
                  required: ['name', 'quantity', 'category']
                }
              }
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          return new Response(JSON.stringify({ success: false, error: errText }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const geminiData = await geminiRes.json();
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        const items = text ? JSON.parse(text) : [];

        return new Response(JSON.stringify({ success: true, items }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message || 'Server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // API Endpoint for Database Sync: /api/data
    if (url.pathname === '/api/data') {
      const key = url.searchParams.get("key");
      const userParam = (url.searchParams.get("user") || "").trim().toLowerCase();

      // Ana aile hesapları (mturkey11 ve meryemmehmetturhan) ana veritabanını paylaşır
      const isMainFamily =
        !userParam ||
        userParam === 'mturkey11@gmail.com' ||
        userParam === 'meryemmehmetturhan@gmail.com' ||
        userParam === 'meryemmehmetturkey@gmail.com';

      const userSlug = userParam ? userParam.replace(/[^a-z0-9]/g, '_') : 'guest';

      let targetId = isMainFamily ? "lorem_workspace" : `lorem_${userSlug}`;
      if (key === "users") {
        targetId = "users_workspace"; // Tüm kullanıcı yönetimi ortak kalır
      } else if (key === "birthdays") {
        targetId = isMainFamily ? "birthdays_workspace" : `birthdays_${userSlug}`;
      } else if (key === "shopping") {
        targetId = isMainFamily ? "shopping_workspace" : `shopping_${userSlug}`;
      }

      if (request.method === 'GET') {
        if (env.DB) {
          try {
            const row = await env.DB.prepare(
              "SELECT content FROM workspace_data WHERE id = ?1"
            ).bind(targetId).first();

            if (row && (row as any).content) {
              return new Response((row as any).content, {
                headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
              });
            }
          } catch (err: any) {
            console.error("D1 Read Error:", err);
          }
        }
        return new Response(JSON.stringify({ status: "not_found", message: "Veri henüz yok" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const contentStr = JSON.stringify(body);

          if (env.DB) {
            await env.DB.prepare(
              `INSERT INTO workspace_data (id, content, updated_at)
               VALUES (?1, ?2, CURRENT_TIMESTAMP)
               ON CONFLICT(id) DO UPDATE SET content = ?2, updated_at = CURRENT_TIMESTAMP`
            ).bind(targetId, contentStr).run();

            return new Response(JSON.stringify({ success: true, storage: "D1", target: targetId }), {
              headers: { "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({ warning: "D1 bağlı değil, yerel hafızada saklandı" }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || "Bilinmeyen hata" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // Serve static assets (HTML, JS, CSS, fonts, etc.)
    return env.ASSETS.fetch(request);
  }
};
