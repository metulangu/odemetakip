import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

const SCHEMA_SQL = `-- Argon Finance - Cloudflare D1 (SQLite) Production Schema
PRAGMA foreign_keys = ON;

-- 1. Users Table (Google OAuth & Admin Approval Lock)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('APPROVED', 'PENDING', 'BLOCKED')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Expense Items Table (First sticky column items)
CREATE TABLE IF NOT EXISTS expense_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FATURA', 'KIRA', 'MAAS', 'YAZILIM', 'VERGI', 'OPERASYON', 'DIGER')),
    default_due_day INTEGER NOT NULL DEFAULT 15 CHECK (default_due_day BETWEEN 1 AND 31),
    icon_name TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_items_active_order ON expense_items(is_active, display_order);

-- 3. Monthly Entries Table (Cell data for each month and year)
CREATE TABLE IF NOT EXISTS monthly_entries (
    id TEXT PRIMARY KEY, -- Composite key: \`\${expense_item_id}:\${year}:\${month}\`
    expense_item_id TEXT NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount REAL NOT NULL DEFAULT 0.0,
    is_paid INTEGER NOT NULL DEFAULT 0,
    paid_at DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expense_item_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_entries_period ON monthly_entries(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_entries_item ON monthly_entries(expense_item_id);
CREATE INDEX IF NOT EXISTS idx_monthly_entries_paid ON monthly_entries(is_paid);`;

const WORKER_TS = `/**
 * Argon Finance - Cloudflare Workers API Handler with Cloudflare D1
 * Deploy via Wrangler: wrangler deploy
 */

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // Fetch matrix items & entries
    if (url.pathname === '/api/matrix') {
      const items = await env.DB.prepare('SELECT * FROM expense_items WHERE is_active = 1 ORDER BY display_order').all();
      const entries = await env.DB.prepare('SELECT * FROM monthly_entries').all();
      return new Response(JSON.stringify({ success: true, data: { items: items.results, entries: entries.results } }), { headers });
    }

    // Upsert entry cell
    if (url.pathname === '/api/entries/upsert' && request.method === 'POST') {
      const b = await request.json();
      const id = \`\${b.expenseItemId}:\${b.year}:\${b.month}\`;
      await env.DB.prepare(\`
        INSERT INTO monthly_entries (id, expense_item_id, year, month, amount, is_paid, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          amount = excluded.amount,
          is_paid = excluded.is_paid,
          updated_at = CURRENT_TIMESTAMP
      \`).bind(id, b.expenseItemId, b.year, b.month, b.amount, b.isPaid ? 1 : 0).run();
      return new Response(JSON.stringify({ success: true, id }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  }
};`;

export const CloudflareD1View: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'schema' | 'worker'>('schema');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      
      {/* Introduction Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Cloudflare D1 (SQLite) & Workers Entegrasyonu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sıfır Sürtünmeli (Zero-Friction) kenar mimarisi: SQLite D1 veritabanı şeması ve Cloudflare Workers uç noktaları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>&lt; 15ms Ultra Hızlı Edge Tepki Süresi</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Admin Onay Kilidi & SQLite İndeksleri</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Terminal className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Wrangler CLI ile Tek Komutla Dağıtım</span>
          </div>
        </div>
      </div>

      {/* Deployment Quick Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Cloudflare D1 Canlıya Alma Adımları (Wrangler CLI)</span>
        </h3>
        
        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400"># 1. Cloudflare D1 veritabanını oluşturun:</span>
              <p className="text-emerald-400 mt-0.5">npx wrangler d1 create argon-finance-db</p>
            </div>
            <button
              onClick={() => handleCopy('npx wrangler d1 create argon-finance-db', 'cmd1')}
              className="text-slate-400 hover:text-white p-1"
            >
              {copied === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400"># 2. Şemayı ve tabloları çalıştırın:</span>
              <p className="text-emerald-400 mt-0.5">npx wrangler d1 execute argon-finance-db --file=./schema.sql</p>
            </div>
            <button
              onClick={() => handleCopy('npx wrangler d1 execute argon-finance-db --file=./schema.sql', 'cmd2')}
              className="text-slate-400 hover:text-white p-1"
            >
              {copied === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400"># 3. Cloudflare Worker API'yi yayınlayın:</span>
              <p className="text-emerald-400 mt-0.5">npx wrangler deploy</p>
            </div>
            <button
              onClick={() => handleCopy('npx wrangler deploy', 'cmd3')}
              className="text-slate-400 hover:text-white p-1"
            >
              {copied === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer: schema.sql & worker.ts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="px-3 sm:px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveCodeTab('schema')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeCodeTab === 'schema' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              schema.sql (D1 SQLite)
            </button>
            <button
              onClick={() => setActiveCodeTab('worker')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeCodeTab === 'worker' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              worker.ts (Workers API)
            </button>
          </div>

          <button
            onClick={() => handleCopy(activeCodeTab === 'schema' ? SCHEMA_SQL : WORKER_TS, 'code')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'code' ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200 overflow-x-auto max-h-[500px] text-xs font-mono leading-relaxed">
          <pre>{activeCodeTab === 'schema' ? SCHEMA_SQL : WORKER_TS}</pre>
        </div>
      </div>

    </div>
  );
};
