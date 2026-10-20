import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  getDaysUntilDue,
  calculateMonthTotals,
  calculateItemYearTotal,
  calculateMoM,
  calculateYoY,
  canUserAccessFinancials
} from './finance.ts';
import type { ExpenseItem, MonthlyEntry, User } from '../types/finance.ts';

test('formatCurrency formats zero and values accurately', () => {
  assert.equal(formatCurrency(0), '0 TL');
  const formatted = formatCurrency(15000);
  assert.match(formatted, /15\.000 TL/);
});

test('getDaysUntilDue correctly classifies paid state', () => {
  const result = getDaysUntilDue(15, 10, 2026, true);
  assert.equal(result.status, 'paid');
  assert.equal(result.label, 'Ödendi');
});

test('getDaysUntilDue classifies overdue, critical, approaching, and comfortable', () => {
  const refDate = new Date(2026, 9, 10, 12, 0, 0); // Oct 10, 2026
  
  // Overdue: Due day was Oct 5 (5 days ago)
  const overdue = getDaysUntilDue(5, 10, 2026, false, refDate);
  assert.equal(overdue.status, 'overdue');
  assert.equal(overdue.daysLeft < 0, true);

  // Critical: Due day is Oct 12 (2 days left)
  const critical = getDaysUntilDue(12, 10, 2026, false, refDate);
  assert.equal(critical.status, 'critical');
  assert.equal(critical.daysLeft, 2);

  // Approaching: Due day is Oct 15 (5 days left)
  const approaching = getDaysUntilDue(15, 10, 2026, false, refDate);
  assert.equal(approaching.status, 'approaching');
  assert.equal(approaching.daysLeft, 5);

  // Comfortable: Due day is Oct 25 (15 days left)
  const comfortable = getDaysUntilDue(25, 10, 2026, false, refDate);
  assert.equal(comfortable.status, 'comfortable');
  assert.equal(comfortable.daysLeft, 15);
});

test('calculateMonthTotals computes correct totals and paid amounts', () => {
  const items: ExpenseItem[] = [
    { id: 'item-1', name: 'Kira', category: 'KIRA', defaultDueDay: 1, isActive: true, order: 1 },
    { id: 'item-2', name: 'Elektrik', category: 'FATURA', defaultDueDay: 15, isActive: true, order: 2 },
    { id: 'item-3', name: 'Eski Gider', category: 'DIGER', defaultDueDay: 20, isActive: false, order: 3 },
  ];

  const entries: Record<string, MonthlyEntry> = {
    'item-1-2026-10': { id: 'item-1-2026-10', expenseItemId: 'item-1', year: 2026, month: 10, amount: 20000, isPaid: true },
    'item-2-2026-10': { id: 'item-2-2026-10', expenseItemId: 'item-2', year: 2026, month: 10, amount: 3500, isPaid: false },
    'item-3-2026-10': { id: 'item-3-2026-10', expenseItemId: 'item-3', year: 2026, month: 10, amount: 9999, isPaid: false },
  };

  const totals = calculateMonthTotals(items, entries, 2026, 10);
  assert.equal(totals.total, 23500);
  assert.equal(totals.paid, 20000);
  assert.equal(totals.remaining, 3500);
  assert.equal(totals.count, 2); // only active items
  assert.equal(totals.paidCount, 1);
});

test('calculateItemYearTotal aggregates across 12 months', () => {
  const entries: Record<string, MonthlyEntry> = {
    'item-1-2026-1': { id: 'item-1-2026-1', expenseItemId: 'item-1', year: 2026, month: 1, amount: 1000, isPaid: true },
    'item-1-2026-2': { id: 'item-1-2026-2', expenseItemId: 'item-1', year: 2026, month: 2, amount: 1500, isPaid: true },
    'item-1-2026-3': { id: 'item-1-2026-3', expenseItemId: 'item-1', year: 2026, month: 3, amount: 2000, isPaid: false },
  };

  const res = calculateItemYearTotal('item-1', entries, 2026);
  assert.equal(res.total, 4500);
  assert.equal(res.paid, 2500);
  assert.equal(res.remaining, 2000);
  assert.equal(res.paidRatio, 56); // 2500/4500 rounded
});

test('calculateMoM and calculateYoY calculate percentage changes', () => {
  const momGrowth = calculateMoM(12000, 10000);
  assert.equal(momGrowth.percentage, 20);

  const momDrop = calculateMoM(8000, 10000);
  assert.equal(momDrop.percentage, -20);

  const yoyGrowth = calculateYoY(150000, 100000);
  assert.equal(yoyGrowth.percentage, 50);
});

test('canUserAccessFinancials enforces admin approval lock', () => {
  const approvedUser: User = {
    id: 'u1',
    email: 'admin@argon.com',
    name: 'Admin',
    avatar: '',
    role: 'ADMIN',
    status: 'APPROVED',
    createdAt: '2026-01-01'
  };

  const pendingUser: User = {
    id: 'u2',
    email: 'newbie@argon.com',
    name: 'Newbie',
    avatar: '',
    role: 'MEMBER',
    status: 'PENDING',
    createdAt: '2026-01-01'
  };

  const blockedUser: User = {
    id: 'u3',
    email: 'blocked@argon.com',
    name: 'Blocked User',
    avatar: '',
    role: 'MEMBER',
    status: 'BLOCKED',
    createdAt: '2026-01-01'
  };

  assert.equal(canUserAccessFinancials(approvedUser), true);
  assert.equal(canUserAccessFinancials(pendingUser), false);
  assert.equal(canUserAccessFinancials(blockedUser), false);
  assert.equal(canUserAccessFinancials(null), false);
});
