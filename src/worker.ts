interface Env {
  ASSETS: { fetch: typeof fetch };
  DB?: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Endpoint for Database Sync: /api/data
    if (url.pathname === '/api/data') {
      const targetId = url.searchParams.get("key") === "birthdays" ? "birthdays_workspace" : "lorem_workspace";

      if (request.method === 'GET') {
        if (env.DB) {
          try {
            await env.DB.prepare(
              `CREATE TABLE IF NOT EXISTS workspace_data (
                id TEXT PRIMARY KEY,
                content TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )`
            ).run();

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
              `CREATE TABLE IF NOT EXISTS workspace_data (
                id TEXT PRIMARY KEY,
                content TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )`
            ).run();

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
