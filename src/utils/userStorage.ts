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
 * Ana aile (Mehmet TURHAN & Meryem TURHAN) için gerçek 20 kişilik doğum günü listesi
 */
export const MAIN_FAMILY_BIRTHDAYS: BirthdayPerson[] = [
  { id: 'bd-1792656874257', fullName: 'Mehmet TURHAN', birthDay: 12, birthMonth: 12, birthYear: 1987, category: 'Aile', phone: '05069407576', notes: '', createdAt: '2026-10-22T08:14:34.257Z' },
  { id: 'bd-1792656932833', fullName: 'Meryem TURHAN', birthDay: 21, birthMonth: 2, birthYear: 1989, category: 'Aile', phone: '05368252107', notes: '', createdAt: '2026-10-22T08:15:32.833Z' },
  { id: 'bd-1792656989952', fullName: 'Müberra ÇELİK', birthDay: 27, birthMonth: 7, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:16:29.952Z' },
  { id: 'bd-1792657032448', fullName: 'Hümeyra TURHAN', birthDay: 22, birthMonth: 7, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:17:12.448Z' },
  { id: 'bd-1792657116224', fullName: 'Saliha ÇİÇEK', birthDay: 8, birthMonth: 7, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:18:36.224Z' },
  { id: 'bd-1792657140007', fullName: 'Yusuf Zeki TURHAN', birthDay: 2, birthMonth: 7, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:19:00.007Z' },
  { id: 'bd-1792657162856', fullName: 'Cengiz CELAP', birthDay: 21, birthMonth: 3, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:19:22.856Z' },
  { id: 'bd-1792657193816', fullName: 'Azra TURHAN', birthDay: 20, birthMonth: 3, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:19:53.816Z' },
  { id: 'bd-1792657218880', fullName: 'Zehra TURHAN', birthDay: 26, birthMonth: 2, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:20:18.880Z' },
  { id: 'bd-1792657255136', fullName: 'Mustafa ÇELİK', birthDay: 29, birthMonth: 1, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:20:55.136Z' },
  { id: 'bd-1792657319543', fullName: 'Yiğithan ÇİÇEK', birthDay: 26, birthMonth: 1, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:21:59.543Z' },
  { id: 'bd-1792657333503', fullName: 'Halit ÇİÇEK', birthDay: 17, birthMonth: 1, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:22:13.503Z' },
  { id: 'bd-1792657356399', fullName: 'Zeki CELAP', birthDay: 15, birthMonth: 11, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:22:36.399Z' },
  { id: 'bd-1792657369655', fullName: 'Halide CELAP', birthDay: 29, birthMonth: 10, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:22:49.655Z' },
  { id: 'bd-1792657433918', fullName: 'Metehan ÇELİK', birthDay: 13, birthMonth: 4, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:23:53.918Z' },
  { id: 'bd-1792657452542', fullName: 'Yusuf TURHAN', birthDay: 5, birthMonth: 4, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:24:12.542Z' },
  { id: 'bd-1792657526926', fullName: 'Aysu CELAP', birthDay: 11, birthMonth: 9, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:25:26.926Z' },
  { id: 'bd-1792657936029', fullName: 'Bilgehan ÇİÇEK', birthDay: 4, birthMonth: 1, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T08:32:16.029Z' },
  { id: 'bd-1792662321211', fullName: 'Beyza CELAP', birthDay: 9, birthMonth: 7, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T09:45:21.211Z' },
  { id: 'bd-1792662343906', fullName: 'Yeşim CELAP', birthDay: 1, birthMonth: 1, birthYear: null, category: 'Aile', phone: '', notes: '', createdAt: '2026-10-22T09:45:43.906Z' }
];

/**
 * Ana aile için 12 adet gerçek fatura ve gider şablonu (Kira, Elektrik, Su, Doğalgaz, Telefonlar...)
 */
export function getMainFamilyInitialExpenses(): LoremState {
  const seedYear = 2026;
  const defaultAmounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const defaultPaid = [true, true, true, true, true, true, true, true, true, true, false, false];

  const rawFamilyItems: Array<{
    id: string;
    name: string;
    category: string;
    dueDay: number;
    notes: Record<number, string>;
    paidOverride?: boolean[];
  }> = [
    { id: 'item-1', name: 'Kira', category: 'Sabit', dueDay: 15, notes: {} },
    { id: 'item-2', name: 'Elektrik', category: 'Fatura', dueDay: 13, notes: {} },
    { id: 'item-3', name: 'Su', category: 'Fatura', dueDay: 13, notes: {} },
    { id: 'item-4', name: 'Doğalgaz', category: 'Fatura', dueDay: 20, notes: {} },
    { id: 'item-6', name: 'Tel Mehmet', category: 'İletişim', dueDay: 25, notes: {} },
    { id: 'item-7', name: 'Tel Meryem', category: 'İletişim', dueDay: 1, notes: { 10: '592' }, paidOverride: [true, true, true, true, true, true, true, true, true, true, true, false] },
    { id: 'item-8', name: 'Tel Azra', category: 'İletişim', dueDay: 1, notes: { 10: '177' }, paidOverride: [true, true, true, true, true, true, true, true, true, true, true, false] },
    { id: 'item-9', name: 'TV İnternet', category: 'İletişim', dueDay: 16, notes: {} },
    { id: 'item-10', name: 'Kredi Kartı Mehmet', category: 'Finans', dueDay: 15, notes: {} },
    { id: 'item-11', name: 'Kredi Kartı Meryem', category: 'Finans', dueDay: 15, notes: {} },
    { id: 'item-12', name: 'Bakıcı', category: 'Sabit', dueDay: 15, notes: {} },
    { id: 'item-13', name: 'Site Aidatı', category: 'Sabit', dueDay: 17, notes: {} }
  ];

  const items: LoremItem[] = rawFamilyItems.map(raw => {
    const paid = raw.paidOverride ? [...raw.paidOverride] : [...defaultPaid];
    return {
      id: raw.id,
      name: raw.name,
      category: raw.category,
      dueDay: raw.dueDay,
      years: {
        [seedYear]: {
          amounts: [...defaultAmounts],
          paid: [...paid],
          notes: { ...raw.notes }
        }
      },
      amounts: [...defaultAmounts],
      paid: [...paid],
      notes: { ...raw.notes }
    };
  });

  return {
    version: 3,
    workspaceTitle: 'Best Home',
    selectedYear: seedYear,
    selectedMonth: 10, // Kasım 2026
    viewMode: 'monthly',
    activeCategoryFilter: 'Tümü',
    quickAddCategory: 'Sabit',
    categories: [
      { id: 'Sabit', label: 'Sabit', color: '#8b5cf6', badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25 hover:bg-violet-500/20' },
      { id: 'Fatura', label: 'Fatura', color: '#0ea5e9', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/20' },
      { id: 'Ulaşım', label: 'Ulaşım', color: '#f59e0b', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20' },
      { id: 'İletişim', label: 'İletişim', color: '#10b981', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20' },
      { id: 'Finans', label: 'Finans', color: '#f43f5e', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 hover:bg-rose-500/20' },
      { id: 'Diğer', label: 'Diğer', color: '#64748b', badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/25 hover:bg-slate-500/20' }
    ],
    items
  };
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
