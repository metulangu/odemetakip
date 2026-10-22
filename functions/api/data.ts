// Cloudflare Pages Function: /api/data
// Handles GET and POST for multi-device sync with Cloudflare D1 or KV

interface Env {
  DB?: any; // Cloudflare D1Database binding
  KV?: any; // Cloudflare KVNamespace binding
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const url = new URL(context.request.url);
  const targetId = url.searchParams.get("key") === "birthdays" ? "birthdays_workspace" : "lorem_workspace";

  // 1. Try Cloudflare D1 Database
  if (context.env.DB) {
    try {
      await context.env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS workspace_data (
          id TEXT PRIMARY KEY,
          content TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      ).run();

      const row = await context.env.DB.prepare(
        "SELECT content FROM workspace_data WHERE id = ?1"
      ).bind(targetId).first();

      if (row && row.content) {
        return new Response(row.content, {
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          }
        });
      }
    } catch (err: any) {
      console.error("D1 Read Error:", err);
    }
  }

  // 2. Try Cloudflare KV fallback
  if (context.env.KV) {
    try {
      const val = await context.env.KV.get(targetId);
      if (val) {
        return new Response(val, {
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          }
        });
      }
    } catch (err: any) {
      console.error("KV Read Error:", err);
    }
  }

  return new Response(JSON.stringify({ status: "not_found", message: "Henüz bulutta veri bulunamadı" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  try {
    const url = new URL(context.request.url);
    const targetId = url.searchParams.get("key") === "birthdays" ? "birthdays_workspace" : "lorem_workspace";
    const body = await context.request.json();
    const contentStr = JSON.stringify(body);

    let savedStorage = "none";

    // 1. Save to D1
    if (context.env.DB) {
      try {
        await context.env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS workspace_data (
            id TEXT PRIMARY KEY,
            content TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`
        ).run();

        await context.env.DB.prepare(
          `INSERT INTO workspace_data (id, content, updated_at) 
           VALUES (?1, ?2, CURRENT_TIMESTAMP) 
           ON CONFLICT(id) DO UPDATE SET content = ?2, updated_at = CURRENT_TIMESTAMP`
        ).bind(targetId, contentStr).run();

        savedStorage = "D1";
      } catch (err: any) {
        console.error("D1 Save Error:", err);
      }
    }

    // 2. Save to KV
    if (context.env.KV) {
      try {
        await context.env.KV.put(targetId, contentStr);
        savedStorage = savedStorage === "none" ? "KV" : `${savedStorage}+KV`;
      } catch (err: any) {
        console.error("KV Save Error:", err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      storage: savedStorage,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Bilinmeyen hata" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
