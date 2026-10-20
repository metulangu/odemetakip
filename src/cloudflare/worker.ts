/**
 * Argon Finance - Cloudflare Workers API Handler with Cloudflare D1
 * Deploy via Wrangler: wrangler deploy
 */

// Cloudflare D1 Database types
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    try {
      // 1. Auth & Current User
      if (url.pathname === '/api/auth/me' && method === 'GET') {
        const email = request.headers.get('x-user-email');
        if (!email) {
          return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers });
        }
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        return new Response(JSON.stringify({ success: true, data: user }), { headers });
      }

      // 2. Fetch All Expense Items & Monthly Entries
      if (url.pathname === '/api/matrix' && method === 'GET') {
        const year = url.searchParams.get('year');
        const items = await env.DB.prepare('SELECT * FROM expense_items WHERE is_active = 1 ORDER BY display_order ASC').all();
        
        let query = 'SELECT * FROM monthly_entries';
        const params: unknown[] = [];
        if (year) {
          query += ' WHERE year = ?';
          params.push(parseInt(year, 10));
        }

        const entries = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
          success: true,
          data: {
            items: items.results,
            entries: entries.results,
          }
        }), { headers });
      }

      // 3. Fast Zero-Friction Cell Update (Upsert Entry)
      if (url.pathname === '/api/entries/upsert' && method === 'POST') {
        const body = await request.json() as {
          expenseItemId: string;
          year: number;
          month: number;
          amount?: number;
          isPaid?: boolean;
        };

        const id = `${body.expenseItemId}:${body.year}:${body.month}`;
        
        await env.DB.prepare(`
          INSERT INTO monthly_entries (id, expense_item_id, year, month, amount, is_paid, updated_at)
          VALUES (?, ?, ?, ?, COALESCE(?, 0), COALESCE(?, 0), CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            amount = COALESCE(excluded.amount, monthly_entries.amount),
            is_paid = COALESCE(excluded.is_paid, monthly_entries.is_paid),
            paid_at = CASE WHEN excluded.is_paid = 1 THEN CURRENT_TIMESTAMP ELSE monthly_entries.paid_at END,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          id,
          body.expenseItemId,
          body.year,
          body.month,
          body.amount !== undefined ? body.amount : null,
          body.isPaid !== undefined ? (body.isPaid ? 1 : 0) : null
        ).run();

        return new Response(JSON.stringify({ success: true, id }), { headers });
      }

      // 4. Admin Users Management (Approve / Block / Change Role)
      if (url.pathname.startsWith('/api/admin/users') && method === 'PATCH') {
        const body = await request.json() as { userId: string; status?: string; role?: string };
        
        if (body.status) {
          await env.DB.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(body.status, body.userId)
            .run();
        }
        if (body.role) {
          await env.DB.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(body.role, body.userId)
            .run();
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // 404
      return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), {
        status: 404,
        headers,
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 500,
        headers,
      });
    }
  },
};
