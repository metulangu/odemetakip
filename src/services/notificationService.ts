import { LoremState, LoremItem, getItemYearData } from '../components/LoremHomeView.tsx';
import { BirthdayPerson } from '../components/BirthdayView.tsx';

export interface AppNotificationItem {
  id: string;
  type: 'expense' | 'birthday';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  diffDays: number; // Expenses: +3..0..-3, Birthdays: 3..0
  // Expense payload
  expenseItemId?: string;
  expenseYear?: number;
  expenseMonth?: number;
  // Birthday payload
  birthdayPersonId?: string;
  birthdayTargetYear?: number;
}

const EXPENSE_STORAGE_KEY = 'lorem_home_expense_matrix_v3';
const BIRTHDAY_STORAGE_KEY = 'best_home_birthdays_v1';
const NOTIFIED_LOG_KEY = 'best_home_notified_log_v1';

/**
 * Registers the Service Worker for mobile & desktop push/local notifications
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Checks if browser/phone supports Web Notifications and returns current permission
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests permission to show native phone/browser notifications
 */
export async function requestPhoneNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerNotificationServiceWorker();
    }
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Sends a native notification to the phone/OS notification tray
 */
export async function sendNativePhoneNotification(
  title: string,
  body: string,
  tag: string,
  module: 'expenses' | 'birthdays' = 'expenses'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/apple-touch-icon.png',
          badge: '/favicon-32x32.png',
          tag,
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: '/', module }
        } as any);
        return true;
      }
    }

    // Fallback to standard Notification constructor
    new Notification(title, {
      body,
      icon: '/apple-touch-icon.png',
      tag
    });
    return true;
  } catch (err) {
    console.warn('Native notification error:', err);
    return false;
  }
}

/**
 * Computes active Expense notifications:
 * Starts 3 days before dueDay (3 gün kaldı, 2 gün kaldı, 1 gün kaldı, Bugün son!)
 * Continues 3 days after dueDay (-1, -2, -3 gün gecikti) until marked Ödendi (paid = true).
 */
export function computeExpenseNotifications(state: LoremState | null, now = new Date()): AppNotificationItem[] {
  if (!state || !Array.isArray(state.items)) return [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Check current month and adjacent months (for month boundaries, e.g. 1st of month checking late days of previous month)
  const periods: Array<{ year: number; month: number }> = [
    {
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      month: currentMonth === 0 ? 11 : currentMonth - 1
    },
    { year: currentYear, month: currentMonth },
    {
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      month: currentMonth === 11 ? 0 : currentMonth + 1
    }
  ];

  const notifications: AppNotificationItem[] = [];

  for (const period of periods) {
    const maxDaysInMonth = new Date(period.year, period.month + 1, 0).getDate();

    for (const item of state.items) {
      const yearData = getItemYearData(item, period.year);
      const isPaid = !!(yearData.paid && yearData.paid[period.month]);
      if (isPaid) continue; // Kişi ödendi yaptıysa bildirim atma!

      const safeDueDay = Math.min(31, Math.max(1, item.dueDay || 15));
      const clampedDay = Math.min(safeDueDay, maxDaysInMonth);
      const targetDate = new Date(period.year, period.month, clampedDay);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // 3 gün önceden başlayarak (3, 2, 1, 0) ve geçince de 3 gün boyunca (-1, -2, -3)
      if (diffDays >= -3 && diffDays <= 3) {
        let title = '';
        let message = '';
        let severity: 'urgent' | 'warning' | 'info' = 'warning';

        const amountVal = yearData.amounts ? yearData.amounts[period.month] : 0;
        const amountStr = amountVal > 0 ? ` (${amountVal.toLocaleString('tr-TR')} ₺)` : '';

        if (diffDays === 3) {
          title = `⏳ ${item.name} ödemesine 3 gün kaldı`;
          message = `${item.name} faturası/ödemesi${amountStr} için son 3 gün. Ödediyseniz 'Ödendi' işaretleyebilirsiniz.`;
          severity = 'info';
        } else if (diffDays === 2) {
          title = `⏳ ${item.name} ödemesine 2 gün kaldı`;
          message = `${item.name} faturası/ödemesi${amountStr} için son 2 gün kaldı.`;
          severity = 'warning';
        } else if (diffDays === 1) {
          title = `⚠️ ${item.name} ödemesine 1 gün kaldı!`;
          message = `${item.name} ödemesi${amountStr} için yarın son gün!`;
          severity = 'warning';
        } else if (diffDays === 0) {
          title = `🚨 ${item.name} — BUGÜN SON GÜN!`;
          message = `${item.name} ödemesi${amountStr} için bugün son ödeme günü! Ödeme yaptıysanız 'Ödendi' işaretleyin.`;
          severity = 'urgent';
        } else if (diffDays < 0) {
          const lateDays = Math.abs(diffDays);
          title = `❗ ${item.name} ödemesi ${lateDays} gün gecikti!`;
          message = `${item.name} ödemesi${amountStr} son ödeme tarihini ${lateDays} gün geçti ve henüz 'Ödendi' işaretlenmedi.`;
          severity = 'urgent';
        }

        notifications.push({
          id: `exp_${item.id}_${period.year}_${period.month}_${diffDays}`,
          type: 'expense',
          severity,
          title,
          message,
          diffDays,
          expenseItemId: item.id,
          expenseYear: period.year,
          expenseMonth: period.month
        });
      }
    }
  }

  // En acil olanlar en üstte (gecikenler -> bugün -> kalan gün)
  return notifications.sort((a, b) => a.diffDays - b.diffDays);
}

/**
 * Computes active Birthday notifications:
 * Starts 3 days before (3 gün var, 2 gün var, 1 gün var, Bugün)
 * Stops as soon as user clicks "Tamam, Haberim Var" (acknowledgedYear === targetYear).
 */
export function computeBirthdayNotifications(people: BirthdayPerson[] | null, now = new Date()): AppNotificationItem[] {
  if (!people || !Array.isArray(people)) return [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = today.getFullYear();

  const notifications: AppNotificationItem[] = [];

  for (const person of people) {
    let nextDate = new Date(currentYear, person.birthMonth - 1, person.birthDay);
    if (nextDate.getTime() < today.getTime()) {
      nextDate = new Date(currentYear + 1, person.birthMonth - 1, person.birthDay);
    }

    const targetYear = nextDate.getFullYear();

    // Kişi "Tamam, Haberim Var" işaretlediyse bu yıl için bildirim gösterme!
    if ((person as any).acknowledgedYear === targetYear) {
      continue;
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      let title = '';
      let message = '';
      let severity: 'urgent' | 'warning' | 'info' = 'info';

      const agePart = person.birthYear && person.birthYear > 1900
        ? ` (${targetYear - person.birthYear}. yaşına giriyor)`
        : '';

      if (diffDays === 3) {
        title = `🎂 ${person.fullName} doğum gününe 3 gün var!`;
        message = `${person.fullName}${agePart} doğum gününe 3 gün kaldı. Bildirimi durdurmak için 'Tamam, Haberim Var' butonuna basabilirsiniz.`;
        severity = 'info';
      } else if (diffDays === 2) {
        title = `🎂 ${person.fullName} doğum gününe 2 gün var!`;
        message = `${person.fullName}${agePart} doğum gününe 2 gün kaldı.`;
        severity = 'warning';
      } else if (diffDays === 1) {
        title = `🎉 ${person.fullName} doğum gününe 1 gün var (Yarın)!`;
        message = `Yarın ${person.fullName}${agePart} doğum günü! Hazırlıklarınızı unutmayın.`;
        severity = 'warning';
      } else if (diffDays === 0) {
        title = `🥳 BUGÜN ${person.fullName} Doğum Günü!`;
        message = `Bugün ${person.fullName}${agePart} doğum günü! Kutlamayı unutmayın.`;
        severity = 'urgent';
      }

      notifications.push({
        id: `bd_${person.id}_${targetYear}_${diffDays}`,
        type: 'birthday',
        severity,
        title,
        message,
        diffDays,
        birthdayPersonId: person.id,
        birthdayTargetYear: targetYear
      });
    }
  }

  return notifications.sort((a, b) => a.diffDays - b.diffDays);
}

/**
 * Dispatches native phone notifications for any active alert that hasn't been pushed today yet
 */
export async function triggerDailyPhoneNotifications(items: AppNotificationItem[]): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted' || items.length === 0) return;

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let log: Record<string, string> = {};
  try {
    const saved = localStorage.getItem(NOTIFIED_LOG_KEY);
    if (saved) log = JSON.parse(saved);
  } catch {}

  let changed = false;
  for (const item of items) {
    const logId = `${item.id}_${todayKey}`;
    if (!log[logId]) {
      const sent = await sendNativePhoneNotification(
        item.title,
        item.message,
        item.id,
        item.type === 'expense' ? 'expenses' : 'birthdays'
      );
      if (sent) {
        log[logId] = todayKey;
        changed = true;
      }
    }
  }

  if (changed) {
    try {
      localStorage.setItem(NOTIFIED_LOG_KEY, JSON.stringify(log));
    } catch {}
  }
}

/**
 * Marks an expense item as PAID (Ödendi) directly from a notification and syncs to D1
 */
export async function markExpensePaidFromNotification(
  itemId: string,
  year: number,
  monthIndex: number
): Promise<boolean> {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    if (!raw) return false;
    const state: LoremState = JSON.parse(raw);
    if (!state || !Array.isArray(state.items)) return false;

    const updatedItems: LoremItem[] = state.items.map((item) => {
      if (item.id !== itemId) return item;
      const yd = getItemYearData(item, year);
      const nextPaid = [...yd.paid];
      nextPaid[monthIndex] = true;

      const nextYears = {
        ...(item.years || {}),
        [year]: {
          ...yd,
          paid: nextPaid
        }
      };

      return {
        ...item,
        years: nextYears,
        ...(year === 2026 ? { paid: nextPaid } : {})
      };
    });

    const nextState: LoremState = {
      ...state,
      items: updatedItems
    };

    localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(nextState));
    window.dispatchEvent(new Event('besthome-data-updated'));

    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextState)
    });
    return true;
  } catch (err) {
    console.warn('markExpensePaidFromNotification failed:', err);
    return false;
  }
}

/**
 * Marks a birthday person as "Tamam, Haberim Var" (acknowledgedYear) directly from a notification and syncs to D1
 */
export async function acknowledgeBirthdayFromNotification(
  personId: string,
  targetYear: number
): Promise<boolean> {
  try {
    const raw = localStorage.getItem(BIRTHDAY_STORAGE_KEY);
    if (!raw) return false;
    const people: BirthdayPerson[] = JSON.parse(raw);
    if (!Array.isArray(people)) return false;

    const updated = people.map((p) =>
      p.id === personId ? { ...p, acknowledgedYear: targetYear } : p
    );

    localStorage.setItem(BIRTHDAY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('besthome-data-updated'));

    await fetch('/api/data?key=birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    return true;
  } catch (err) {
    console.warn('acknowledgeBirthdayFromNotification failed:', err);
    return false;
  }
}
