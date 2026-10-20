import type { DueBadgeStatus, DueCalculation, ExpenseItem, MonthlyEntry, User } from '../types/finance.ts';

export const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const MONTH_NAMES_SHORT_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

/**
 * Formats a number to Turkish Lira currency format (e.g. ₺14.500)
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₺0';
  }
  
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M TL`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k TL`;
  }

  const formatted = new Intl.NumberFormat('tr-TR').format(Math.round(amount));
  return `${formatted} TL`;
}

/**
 * Calculates due date status and remaining days
 * Comfortable: > 7 days (green)
 * Approaching: 4-7 days (yellow)
 * Critical: 0-3 days (red)
 * Overdue: < 0 days (red)
 */
export function getDaysUntilDue(
  dueDay: number,
  targetMonth: number,
  targetYear: number,
  isPaid: boolean = false,
  customReferenceDate?: Date
): DueCalculation {
  if (isPaid) {
    return {
      daysLeft: 0,
      status: 'paid',
      label: 'Ödendi',
      dueDateStr: `${dueDay} ${MONTH_NAMES_TR[targetMonth - 1]} ${targetYear}`
    };
  }

  const now = customReferenceDate ? new Date(customReferenceDate) : new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Clamp day to valid day in that target month
  const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
  const validDueDay = Math.min(Math.max(1, dueDay), lastDayOfMonth);
  
  const dueMidnight = new Date(targetYear, targetMonth - 1, validDueDay).getTime();
  
  // Calculate day difference
  const diffTime = dueMidnight - todayMidnight;
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let status: DueBadgeStatus = 'comfortable';
  let label = `${daysLeft} gün kaldı`;

  if (daysLeft < 0) {
    status = 'overdue';
    const overdueDays = Math.abs(daysLeft);
    label = `${overdueDays} gün gecikti`;
  } else if (daysLeft === 0) {
    status = 'critical';
    label = 'Bugün son gün';
  } else if (daysLeft <= 3) {
    status = 'critical';
    label = `${daysLeft} gün kaldı`;
  } else if (daysLeft <= 7) {
    status = 'approaching';
    label = `${daysLeft} gün kaldı`;
  } else {
    status = 'comfortable';
    label = `${daysLeft} gün kaldı`;
  }

  return {
    daysLeft,
    status,
    label,
    dueDateStr: `${validDueDay} ${MONTH_NAMES_TR[targetMonth - 1]} ${targetYear}`
  };
}

/**
 * Calculates month total, paid total, and remaining for a set of items and entries
 */
export function calculateMonthTotals(
  items: ExpenseItem[],
  entries: Record<string, MonthlyEntry>,
  year: number,
  month: number
): { total: number; paid: number; remaining: number; count: number; paidCount: number } {
  let total = 0;
  let paid = 0;
  let count = 0;
  let paidCount = 0;

  for (const item of items) {
    if (!item.isActive) continue;
    count++;
    const key = `${item.id}-${year}-${month}`;
    const entry = entries[key];
    const amount = entry?.amount || 0;
    total += amount;

    if (entry?.isPaid) {
      paid += amount;
      paidCount++;
    }
  }

  return {
    total,
    paid,
    remaining: Math.max(0, total - paid),
    count,
    paidCount
  };
}

/**
 * Calculates yearly total for an individual expense item across 12 months
 */
export function calculateItemYearTotal(
  itemId: string,
  entries: Record<string, MonthlyEntry>,
  year: number
): { total: number; paid: number; remaining: number; paidRatio: number } {
  let total = 0;
  let paid = 0;

  for (let m = 1; m <= 12; m++) {
    const key = `${itemId}-${year}-${m}`;
    const entry = entries[key];
    if (entry) {
      total += entry.amount || 0;
      if (entry.isPaid) {
        paid += entry.amount || 0;
      }
    }
  }

  const paidRatio = total > 0 ? (paid / total) * 100 : 0;

  return {
    total,
    paid,
    remaining: Math.max(0, total - paid),
    paidRatio: Math.round(paidRatio)
  };
}

/**
 * Calculates Month-over-Month (MoM) change percentage
 */
export function calculateMoM(currentMonth: number, prevMonth: number): { diff: number; percentage: number } {
  const diff = currentMonth - prevMonth;
  if (prevMonth === 0) {
    return {
      diff,
      percentage: currentMonth > 0 ? 100 : 0
    };
  }
  const percentage = Number(((diff / prevMonth) * 100).toFixed(1));
  return { diff, percentage };
}

/**
 * Calculates Year-over-Year (YoY) change percentage
 */
export function calculateYoY(currentYearTotal: number, prevYearTotal: number): { diff: number; percentage: number } {
  const diff = currentYearTotal - prevYearTotal;
  if (prevYearTotal === 0) {
    return {
      diff,
      percentage: currentYearTotal > 0 ? 100 : 0
    };
  }
  const percentage = Number(((diff / prevYearTotal) * 100).toFixed(1));
  return { diff, percentage };
}

/**
 * User access control: Admin approval lock check
 */
export function canUserAccessFinancials(user: User | null): boolean {
  if (!user) return false;
  if (user.status === 'APPROVED') return true;
  return false;
}
