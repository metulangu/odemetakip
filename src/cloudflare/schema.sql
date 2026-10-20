-- ============================================================================
-- Argon Finance - Cloudflare D1 (SQLite) Production Schema
-- Designed for ultra-fast, zero-friction edge database operations
-- ============================================================================

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
    id TEXT PRIMARY KEY, -- Composite key: `${expense_item_id}:${year}:${month}`
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
CREATE INDEX IF NOT EXISTS idx_monthly_entries_paid ON monthly_entries(is_paid);

-- 4. Audit & Activity Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    payload TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 5. Seed Super Admin (Auto-approved)
INSERT OR IGNORE INTO users (id, email, name, role, status, created_at)
VALUES ('admin-root', 'mturkey11@gmail.com', 'Sistem Yöneticisi', 'ADMIN', 'APPROVED', CURRENT_TIMESTAMP);
