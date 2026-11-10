import { sendNotification } from 'web-push-neo';

interface Env {
  ASSETS: { fetch: typeof fetch };
  DB?: any;
  GEMINI_API_KEY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

const DEFAULT_VAPID_PUBLIC_KEY = 'BAnt2tVWWUkA7QY60f66yQhu_jOZrgY5xYaRXS0PZ3GlBL7MxAO9kXV-wZKa1RoZORzjfYCNJoDVxKRHO3EOXKc';
const DEFAULT_VAPID_PRIVATE_KEY = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPKbI_KWy2loYfyv0ehXHwo-7dBwdP-wBsBa8HAf9r9ihRANCAAQJ7drVVllJAO0GOtH-uskIbv4zma4GOcWGkV0tD2dxpQS-zMQDvZF1fsGSmtUaGTkc432AjSaA1cSkRztxDlyn';
const DEFAULT_VAPID_SUBJECT = 'mailto:mturkey11@gmail.com';

function getVapidDetails(env: Env) {
  return {
    subject: env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY
  };
}

async function computeUserAlerts(env: Env, userEmail: string, trNow: Date) {
  if (!env.DB) return [];
  const cleanEmail = userEmail.trim().toLowerCase();
  const isMainFamily =
    cleanEmail === 'mturkey11@gmail.com' ||
    cleanEmail === 'meryemmehmetturhan@gmail.com' ||
    cleanEmail === 'meryemmehmetturkey@gmail.com';

  const userSlug = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const expenseTarget = isMainFamily ? 'lorem_workspace' : `lorem_${userSlug}`;
  const birthdayTarget = isMainFamily ? 'birthdays_workspace' : `birthdays_${userSlug}`;

  const alerts: Array<{ title: string; message: string; module: 'expenses' | 'birthdays'; tag: string }> = [];

  const todayYear = trNow.getUTCFullYear();
  const todayMonth = trNow.getUTCMonth();
  const todayDate = trNow.getUTCDate();
  const todayMidnight = new Date(Date.UTC(todayYear, todayMonth, todayDate));

  // 1. Faturalar (Giderler)
  try {
    const row = await env.DB.prepare('SELECT content FROM workspace_data WHERE id = ?1').bind(expenseTarget).first();
    if (row && (row as any).content) {
      const state = JSON.parse((row as any).content);
      if (state && Array.isArray(state.items)) {
        const periods = [
          {
            year: todayMonth === 0 ? todayYear - 1 : todayYear,
            month: todayMonth === 0 ? 11 : todayMonth - 1
          },
          { year: todayYear, month: todayMonth }
        ];

        for (const period of periods) {
          const maxDaysInMonth = new Date(Date.UTC(period.year, period.month + 1, 0)).getUTCDate();
          for (const item of state.items) {
            const yd = (item.years && item.years[period.year]) || {
              amounts: item.amounts || [],
              paid: item.paid || []
            };
            const isPaid = !!(yd.paid && yd.paid[period.month]);
            if (isPaid) continue; // Kişi ödendi yaptıysa bildirim atma

            const safeDueDay = Math.min(31, Math.max(1, item.dueDay || 15));
            const clampedDay = Math.min(safeDueDay, maxDaysInMonth);
            const targetDate = new Date(Date.UTC(period.year, period.month, clampedDay));

            const diffTime = targetDate.getTime() - todayMidnight.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 3 && diffDays >= -60) {
              const amountVal = yd.amounts ? yd.amounts[period.month] : 0;
              const amountStr = amountVal > 0 ? ` (${amountVal.toLocaleString('tr-TR')} ₺)` : '';
              let title = '';
              let message = '';

              if (diffDays === 3) {
                title = `⏳ ${item.name} faturasına 3 gün kaldı`;
                message = `${item.name} faturası${amountStr} için son 3 gün.`;
              } else if (diffDays === 2) {
                title = `⏳ ${item.name} faturasına 2 gün kaldı`;
                message = `${item.name} faturası${amountStr} için son 2 gün kaldı.`;
              } else if (diffDays === 1) {
                title = `⚠️ ${item.name} faturasına 1 gün kaldı (Yarın)!`;
                message = `${item.name} faturası${amountStr} için yarın son gün!`;
              } else if (diffDays === 0) {
                title = `🚨 ${item.name} — BUGÜN SON GÜN!`;
                message = `${item.name} faturası${amountStr} için bugün son ödeme günü! Ödediyseniz lütfen 'Ödendi' işaretleyin.`;
              } else if (diffDays === -1) {
                title = `❗ ${item.name} faturası 1 gün geçti!`;
                message = `${item.name} faturası${amountStr} son ödeme gününü 1 gün geçti ve henüz 'Ödendi' yapılmadı.`;
              } else if (diffDays === -2) {
                title = `❗ ${item.name} faturası 2 gün geçti!`;
                message = `${item.name} faturası${amountStr} son ödeme gününü 2 gün geçti ve henüz 'Ödendi' yapılmadı.`;
              } else {
                const lateDays = Math.abs(diffDays);
                title = `🚨 ${item.name} faturası ${lateDays} gün geçti!`;
                message = `${item.name} faturası${amountStr} son ödeme gününü ${lateDays} gün geçti ve bekliyor. Ödediyseniz 'Ödendi' işaretleyin.`;
              }

              alerts.push({
                title,
                message,
                module: 'expenses',
                tag: `exp_${item.id}_${period.year}_${period.month}`
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Compute expense alerts error:', e);
  }

  // 2. Doğum Günleri
  try {
    const row = await env.DB.prepare('SELECT content FROM workspace_data WHERE id = ?1').bind(birthdayTarget).first();
    if (row && (row as any).content) {
      const people = JSON.parse((row as any).content);
      if (Array.isArray(people)) {
        for (const person of people) {
          let nextDate = new Date(Date.UTC(todayYear, person.birthMonth - 1, person.birthDay));
          if (nextDate.getTime() < todayMidnight.getTime()) {
            nextDate = new Date(Date.UTC(todayYear + 1, person.birthMonth - 1, person.birthDay));
          }

          const targetYear = nextDate.getUTCFullYear();
          if (person.acknowledgedYear === targetYear) continue; // Kutlandı / Tamam dediyse bildirim verme

          const diffTime = nextDate.getTime() - todayMidnight.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 3) {
            const agePart = person.birthYear && person.birthYear > 1900
              ? ` (${targetYear - person.birthYear}. yaş)`
              : '';
            let title = '';
            let message = '';

            if (diffDays === 3) {
              title = `🎂 ${person.fullName} doğum gününe 3 gün var!`;
              message = `${person.fullName}${agePart} doğum gününe 3 gün kaldı.`;
            } else if (diffDays === 2) {
              title = `🎂 ${person.fullName} doğum gününe 2 gün var!`;
              message = `${person.fullName}${agePart} doğum gününe 2 gün kaldı.`;
            } else if (diffDays === 1) {
              title = `🎉 ${person.fullName} doğum gününe 1 gün var (Yarın)!`;
              message = `Yarın ${person.fullName}${agePart} doğum günü! Kutlamayı unutmayın.`;
            } else if (diffDays === 0) {
              title = `🥳 BUGÜN ${person.fullName} Doğum Günü!`;
              message = `Bugün ${person.fullName}${agePart} doğum günü! Kutlamayı unutmayın.`;
            }

            alerts.push({
              title,
              message,
              module: 'birthdays',
              tag: `bd_${person.id}_${targetYear}`
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Compute birthday alerts error:', e);
  }

  return alerts;
}

async function sendDailyMorningPush(env: Env, targetEmail?: string): Promise<{ sent: number; failed: number }> {
  if (!env.DB) return { sent: 0, failed: 0 };

  const now = new Date();
  const trNow = new Date(now.getTime() + 3 * 3600 * 1000); // UTC+3 Türkiye
  const todayDateStr = trNow.toISOString().slice(0, 10);

  const query = targetEmail
    ? env.DB.prepare('SELECT * FROM push_subscriptions WHERE user_email = ?1').bind(targetEmail.trim().toLowerCase())
    : env.DB.prepare('SELECT * FROM push_subscriptions');

  const { results } = await query.all();
  if (!results || results.length === 0) return { sent: 0, failed: 0 };

  const vapidDetails = getVapidDetails(env);
  let sentCount = 0;
  let failedCount = 0;

  for (const record of results as any[]) {
    try {
      const sub = JSON.parse(record.subscription_json);
      const userEmail = record.user_email;
      const alerts = await computeUserAlerts(env, userEmail, trNow);

      if (alerts.length === 0) continue;

      let pushTitle = '';
      let pushBody = '';
      let targetModule: 'expenses' | 'birthdays' = 'expenses';

      if (alerts.length === 1) {
        pushTitle = alerts[0].title;
        pushBody = alerts[0].message;
        targetModule = alerts[0].module;
      } else {
        pushTitle = `🔔 Best Home Sabah Özeti (${alerts.length} Bildirim)`;
        pushBody = alerts.slice(0, 3).map(a => a.title.replace(/^[^\w\s]*\s*/, '')).join(' • ');
      }

      const payload = JSON.stringify({
        title: pushTitle,
        body: pushBody,
        tag: `besthome-${todayDateStr}`,
        url: '/',
        module: targetModule
      });

      await sendNotification(sub, payload, {
        vapidDetails,
        urgency: 'high',
        TTL: 86400
      });

      sentCount++;
      await env.DB.prepare(
        'UPDATE push_subscriptions SET last_notified_date = ?1, updated_at = CURRENT_TIMESTAMP WHERE endpoint_key = ?2'
      ).bind(todayDateStr, record.endpoint_key).run();

    } catch (pushErr: any) {
      failedCount++;
      if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint_key = ?1').bind(record.endpoint_key).run();
      }
    }
  }

  return { sent: sentCount, failed: failedCount };
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

    // Web Push API: VAPID Public Key sorgulama
    if (url.pathname === '/api/push/public-key' && request.method === 'GET') {
      const details = getVapidDetails(env);
      return new Response(JSON.stringify({ success: true, publicKey: details.publicKey }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Web Push API: Cihaz Aboneliği Kaydetme (D1)
    if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { subscription, userEmail } = body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
          return new Response(JSON.stringify({ success: false, error: 'Eksik abonelik bilgisi' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const endpointKey = btoa(subscription.endpoint).slice(-40);
        const subJson = JSON.stringify(subscription);
        const email = (userEmail || 'guest@besthome.local').trim().toLowerCase();

        if (env.DB) {
          await env.DB.prepare(`
            INSERT INTO push_subscriptions (endpoint_key, user_email, subscription_json, updated_at)
            VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
            ON CONFLICT(endpoint_key) DO UPDATE SET
              user_email = ?2,
              subscription_json = ?3,
              updated_at = CURRENT_TIMESTAMP
          `).bind(endpointKey, email, subJson).run();
        }

        return new Response(JSON.stringify({ success: true, message: 'Abonelik D1 veritabanına kaydedildi' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Web Push API: Anlık Test Bildirimi Gönderme
    if (url.pathname === '/api/push/test' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const sub = body.subscription;
        if (!sub || !sub.endpoint) {
          return new Response(JSON.stringify({ success: false, error: 'Abonelik bilgisi yok' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const vapidDetails = getVapidDetails(env);
        const payload = JSON.stringify({
          title: '🔔 Best Home • Telefon Bildirim Testi',
          body: 'Tebrikler! Uygulama kapalıyken bile sabah bildirimleriniz telefonunuza başarıyla ulaşacak.',
          tag: 'besthome-test-' + Date.now(),
          url: '/',
          module: 'expenses'
        });

        await sendNotification(sub, payload, {
          vapidDetails,
          urgency: 'high',
          TTL: 86400
        });

        return new Response(JSON.stringify({ success: true, message: 'Test bildirimi telefonunuza gönderildi!' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Web Push API: Sabah Bildirimlerini Manuel veya Test Olarak Tetikleme
    if (url.pathname === '/api/push/trigger-daily') {
      try {
        const userParam = url.searchParams.get('user');
        const result = await sendDailyMorningPush(env, userParam || undefined);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static assets (HTML, JS, CSS, fonts, etc.)
    return env.ASSETS.fetch(request);
  },

  // Cloudflare Cron Trigger: Her sabah saat 09:00'da (UTC 06:00) otomatik çalışır
  async scheduled(event: any, env: Env, ctx: any) {
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(sendDailyMorningPush(env));
    } else {
      await sendDailyMorningPush(env);
    }
  }
};
