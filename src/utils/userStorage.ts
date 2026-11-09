import type { LoremState, LoremItem } from '../components/LoremHomeView.tsx';
import type { BirthdayPerson } from '../components/BirthdayView.tsx';
import type { ShoppingList } from '../types/shopping.ts';

/**
 * Ana aile hesapları: mturkey11@gmail.com ve meryemmehmetturhan@gmail.com (veya meryemmehmetturkey@gmail.com)
 * Bu hesaplar ana veritabanını (lorem_workspace, birthdays_workspace, shopping_workspace) paylaşır.
 */
export function isMainFamilyAccount(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'mturkey11@gmail.com' ||
    clean === 'meryemmehmetturhan@gmail.com' ||
    clean === 'meryemmehmetturkey@gmail.com'
  );
}

/**
 * Kullanıcı e-postasından güvenli slug üretir (D1 ve LocalStorage anahtarları için)
 */
export function getUserSlug(email?: string | null): string {
  if (!email) return 'guest';
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Kullanıcıya özel Gider/Fatura LocalStorage anahtarı
 */
export function getExpenseStorageKey(userEmail?: string | null): string {
  if (!userEmail || isMainFamilyAccount(userEmail)) {
    return 'lorem_home_expense_matrix_v3';
  }
  return `lorem_home_expense_matrix_v3_${getUserSlug(userEmail)}`;
}

/**
 * Kullanıcıya özel Doğum Günü LocalStorage anahtarı
 */
export function getBirthdayStorageKey(userEmail?: string | null): string {
  if (!userEmail || isMainFamilyAccount(userEmail)) {
    return 'best_home_birthdays_v1';
  }
  return `best_home_birthdays_v1_${getUserSlug(userEmail)}`;
}

/**
 * Kullanıcıya özel Alışveriş Listesi LocalStorage anahtarı
 */
export function getShoppingStorageKey(userEmail?: string | null): string {
  if (!userEmail || isMainFamilyAccount(userEmail)) {
    return 'argon_shopping_lists_v1';
  }
  return `argon_shopping_lists_v1_${getUserSlug(userEmail)}`;
}

/**
 * Cloudflare D1 için kullanıcı parametreli API URL'si üretir
 */
export function getApiDataUrl(key?: 'birthdays' | 'shopping' | 'users' | null, userEmail?: string | null): string {
  const params = new URLSearchParams();
  if (key) params.set('key', key);
  if (userEmail) params.set('user', userEmail.trim().toLowerCase());
  const queryString = params.toString();
  return `/api/data${queryString ? `?${queryString}` : ''}`;
}

/**
 * Yeni onaylanan yabancı kullanıcılar için temiz / bağımsız başlangıç gider şablonu
 * (Mehmet & Meryem'in özel faturaları, telefonları, kredileri burada yer almaz!)
 */
export function createNewUserStarterExpenses(userName?: string): LoremState {
  const seedYear = 2026;
  const defaultAmounts = Array(12).fill(0);
  const defaultPaid = Array(12).fill(false);

  const starterItems = [
    { id: 'user-item-1', name: 'Elektrik Faturası', category: 'Fatura', dueDay: 15 },
    { id: 'user-item-2', name: 'Su Faturası', category: 'Fatura', dueDay: 20 },
    { id: 'user-item-3', name: 'İnternet Faturası', category: 'İletişim', dueDay: 10 },
    { id: 'user-item-4', name: 'Ev Kirası / Aidat', category: 'Sabit', dueDay: 1 },
  ];

  const items: LoremItem[] = starterItems.map(raw => ({
    id: raw.id,
    name: raw.name,
    category: raw.category,
    dueDay: raw.dueDay,
    years: {
      [seedYear]: {
        amounts: [...defaultAmounts],
        paid: [...defaultPaid],
        notes: {}
      }
    },
    amounts: [...defaultAmounts],
    paid: [...defaultPaid],
    notes: {}
  }));

  return {
    version: 3,
    workspaceTitle: userName ? `${userName} - Gider Takibi` : 'Gider Takibim',
    selectedYear: seedYear,
    selectedMonth: new Date().getMonth(),
    viewMode: 'monthly',
    activeCategoryFilter: 'Tümü',
    quickAddCategory: 'Fatura',
    categories: [
      { id: 'Sabit', label: 'Sabit', color: '#8b5cf6', badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25' },
      { id: 'Fatura', label: 'Fatura', color: '#0ea5e9', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25' },
      { id: 'İletişim', label: 'İletişim', color: '#10b981', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
      { id: 'Ulaşım', label: 'Ulaşım', color: '#f59e0b', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25' },
      { id: 'Finans', label: 'Finans', color: '#f43f5e', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25' },
      { id: 'Diğer', label: 'Diğer', color: '#64748b', badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/25' }
    ],
    items
  };
}

/**
 * Yeni kullanıcılar için temiz / bağımsız doğum günü listesi
 */
export function createNewUserStarterBirthdays(): BirthdayPerson[] {
  return [];
}

/**
 * Yeni kullanıcılar için temiz / bağımsız alışveriş listesi
 */
export function createNewUserStarterShopping(): ShoppingList[] {
  return [
    {
      id: 'list_' + Date.now(),
      title: 'Alışveriş Listem',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
