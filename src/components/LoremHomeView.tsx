import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, 
  Sun, 
  Moon, 
  ListChecks, 
  Table2, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  TrendingUp, 
  Copy, 
  Sparkles, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ArrowRightToLine, 
  PieChart as PieIcon, 
  LogOut, 
  Tag, 
  Calendar, 
  AlertTriangle, 
  X, 
  Palette, 
  Plus, 
  Bell, 
  Cloud, 
  CloudCheck, 
  Download, 
  Upload, 
  Database,
  ArrowRight
} from 'lucide-react';

export interface LoremYearData {
  amounts: number[];
  paid: boolean[];
  notes: Record<number, string>;
}

export interface LoremItem {
  id: string;
  name: string;
  category: string;
  dueDay: number; // Ayın son ödeme günü (1-31)
  icon?: string;
  years?: Record<number, LoremYearData>;
  // Geriye dönük uyumluluk alanları:
  amounts?: number[];
  paid?: boolean[];
  notes?: Record<number, string>;
}

export interface LoremCategory {
  id: string;
  label: string;
  icon?: string;
  badgeClass: string;
  color: string;
}

const STORAGE_KEY = 'lorem_home_expense_matrix_v1';

const MONTHS_TR = [
  { index: 0, short: 'Oca', full: 'Ocak' },
  { index: 1, short: 'Şub', full: 'Şubat' },
  { index: 2, short: 'Mar', full: 'Mart' },
  { index: 3, short: 'Nis', full: 'Nisan' },
  { index: 4, short: 'May', full: 'Mayıs' },
  { index: 5, short: 'Haz', full: 'Haziran' },
  { index: 6, short: 'Tem', full: 'Temmuz' },
  { index: 7, short: 'Ağu', full: 'Ağustos' },
  { index: 8, short: 'Eyl', full: 'Eylül' },
  { index: 9, short: 'Eki', full: 'Ekim' },
  { index: 10, short: 'Kas', full: 'Kasım' },
  { index: 11, short: 'Ara', full: 'Aralık' }
];

const DEFAULT_CATEGORIES: LoremCategory[] = [
  {
    id: 'Sabit',
    label: 'Sabit',
    icon: 'home',
    color: '#8b5cf6',
    badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25 hover:bg-violet-500/20'
  },
  {
    id: 'Fatura',
    label: 'Fatura',
    icon: 'zap',
    color: '#0ea5e9',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/20'
  },
  {
    id: 'Ulaşım',
    label: 'Ulaşım',
    icon: 'fuel',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
  },
  {
    id: 'İletişim',
    label: 'İletişim',
    icon: 'smartphone',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
  },
  {
    id: 'Finans',
    label: 'Finans',
    icon: 'credit-card',
    color: '#f43f5e',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 hover:bg-rose-500/20'
  },
  {
    id: 'Diğer',
    label: 'Diğer',
    icon: 'tag',
    color: '#64748b',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/25 hover:bg-slate-500/20'
  }
];

const COLOR_PRESETS = [
  { name: 'Mor', hex: '#8b5cf6', badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25 hover:bg-violet-500/20' },
  { name: 'Mavi', hex: '#0ea5e9', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/20' },
  { name: 'Yeşil', hex: '#10b981', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20' },
  { name: 'Sarı', hex: '#f59e0b', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20' },
  { name: 'Kırmızı', hex: '#f43f5e', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 hover:bg-rose-500/20' },
  { name: 'İndigo', hex: '#6366f1', badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 hover:bg-indigo-500/20' },
  { name: 'Turuncu', hex: '#f97316', badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25 hover:bg-orange-500/20' },
  { name: 'Teal', hex: '#14b8a6', badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25 hover:bg-teal-500/20' },
  { name: 'Gri', hex: '#64748b', badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-zinc-300 border-slate-500/25 hover:bg-slate-500/20' }
];

export interface LoremState {
  workspaceTitle: string;
  selectedYear: number;
  selectedMonth: number;
  viewMode: 'monthly' | 'matrix' | 'analytics';
  activeCategoryFilter: string;
  quickAddCategory: string;
  categories: LoremCategory[];
  items: LoremItem[];
}

export interface DueStatus {
  dueDay: number;
  diffDays: number;
  status: 'paid' | 'green' | 'yellow' | 'red';
  text: string;
  shortText: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Belirli bir yıla ait verileri döndürür. Yoksa oluşturur.
 */
export function getItemYearData(item: LoremItem, year: number): LoremYearData {
  if (item.years && item.years[year]) {
    return item.years[year];
  }
  // Geriye dönük uyumluluk: 2026 yılı için root amounts kontrolü
  if (year === 2026 && Array.isArray(item.amounts) && item.amounts.length === 12) {
    return {
      amounts: [...item.amounts],
      paid: [...(item.paid || Array(12).fill(false))],
      notes: { ...(item.notes || {}) }
    };
  }
  return {
    amounts: Array(12).fill(0),
    paid: Array(12).fill(false),
    notes: {}
  };
}

export function getDueStatus(dueDay: number = 15, monthIndex: number, year: number = 2026, isPaid: boolean): DueStatus {
  const safeDueDay = Math.min(31, Math.max(1, dueDay || 15));
  
  if (isPaid) {
    return {
      dueDay: safeDueDay,
      diffDays: 0,
      status: 'paid',
      text: 'Ödendi',
      shortText: 'Ödendi',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
      dotClass: 'bg-emerald-500'
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const clampedDay = Math.min(safeDueDay, maxDaysInMonth);
  const targetDate = new Date(year, monthIndex, clampedDay);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return {
      dueDay: safeDueDay,
      diffDays,
      status: 'green',
      text: `${diffDays} gün kaldı`,
      shortText: `${diffDays} gün`,
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-500'
    };
  } else if (diffDays >= 3 && diffDays <= 7) {
    return {
      dueDay: safeDueDay,
      diffDays,
      status: 'yellow',
      text: `${diffDays} gün kaldı`,
      shortText: `${diffDays} gün`,
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium',
      dotClass: 'bg-amber-500'
    };
  } else {
    let text = `${diffDays} gün kaldı!`;
    let shortText = `${diffDays} gün!`;
    if (diffDays === 0) {
      text = 'Bugün son gün!';
      shortText = 'Bugün!';
    } else if (diffDays < 0) {
      text = `${Math.abs(diffDays)} gün gecikti!`;
      shortText = `${Math.abs(diffDays)}g gecikti`;
    }

    return {
      dueDay: safeDueDay,
      diffDays,
      status: 'red',
      text,
      shortText,
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 font-semibold',
      dotClass: 'bg-rose-500 animate-pulse'
    };
  }
}

function createInitialDemoState(): LoremState {
  const seedYear = 2026;
  const rawItems = [
    {
      id: 'item-1',
      name: 'Kira',
      category: 'Sabit',
      dueDay: 1,
      amounts: [24000, 24000, 24000, 24000, 24000, 24000, 28000, 28000, 28000, 28000, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 6: 'Temmuz kira artışı', 8: 'Eylül ödendi', 9: 'Havale ile ödendi' }
    },
    {
      id: 'item-2',
      name: 'Elektrik',
      category: 'Fatura',
      dueDay: 15,
      amounts: [890, 860, 820, 780, 750, 920, 1340, 1480, 1120, 980, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 7: 'Klima kullanımı', 9: 'Otomatik ödeme' }
    },
    {
      id: 'item-3',
      name: 'Su',
      category: 'Fatura',
      dueDay: 20,
      amounts: [410, 390, 420, 440, 460, 520, 610, 640, 530, 490, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: 'Otomatik ödeme' }
    },
    {
      id: 'item-4',
      name: 'Doğalgaz',
      category: 'Fatura',
      dueDay: 24,
      amounts: [3400, 3650, 2800, 1450, 420, 280, 260, 260, 340, 1250, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, false, false, false],
      notes: { 9: 'Kombi açıldı · Son ödeme 24 Ekim' }
    },
    {
      id: 'item-5',
      name: 'Yakıt',
      category: 'Ulaşım',
      dueDay: 10,
      amounts: [4200, 4100, 4500, 4800, 5100, 5600, 6400, 6200, 5400, 5800, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: '2 depo motorin' }
    },
    {
      id: 'item-6',
      name: 'Tel Mehmet',
      category: 'İletişim',
      dueDay: 18,
      amounts: [540, 540, 540, 540, 540, 680, 680, 680, 680, 680, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: 'Kurumsal tarife' }
    },
    {
      id: 'item-7',
      name: 'Tel Meryem',
      category: 'İletişim',
      dueDay: 18,
      amounts: [480, 480, 480, 480, 480, 590, 590, 590, 590, 590, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: 'Faturalı hat' }
    },
    {
      id: 'item-8',
      name: 'Tel Azra',
      category: 'İletişim',
      dueDay: 18,
      amounts: [290, 290, 290, 290, 290, 350, 350, 350, 350, 350, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, false, false, false],
      notes: { 9: 'Genç paketi' }
    },
    {
      id: 'item-9',
      name: 'TV İnternet',
      category: 'İletişim',
      dueDay: 12,
      amounts: [750, 750, 750, 750, 750, 750, 890, 890, 890, 890, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: '1000 Mbps Fiber + TV' }
    },
    {
      id: 'item-10',
      name: 'Kredi Kartı Mehmet',
      category: 'Finans',
      dueDay: 22,
      amounts: [18400, 16900, 19200, 21500, 19800, 22400, 26800, 24500, 21900, 23400, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, false, false, false],
      notes: { 9: 'Son ödeme 22 Ekim' }
    },
    {
      id: 'item-11',
      name: 'Kredi Kartı Meryem',
      category: 'Finans',
      dueDay: 25,
      amounts: [11200, 10800, 12400, 13100, 12600, 14200, 15900, 14800, 13600, 14250, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, false, false, false],
      notes: { 9: 'Market + giyim taksitleri' }
    },
    {
      id: 'item-12',
      name: 'Bakıcı',
      category: 'Sabit',
      dueDay: 5,
      amounts: [19500, 19500, 19500, 19500, 19500, 19500, 22000, 22000, 22000, 22000, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, true, false, false],
      notes: { 9: 'Ayın 5\'inde ödendi' }
    },
    {
      id: 'item-13',
      name: 'Site Aidatı',
      category: 'Sabit',
      dueDay: 30,
      amounts: [1500, 1500, 1500, 1500, 1500, 1500, 1800, 1800, 1800, 1800, 0, 0],
      paid: [true, true, true, true, true, true, true, true, true, false, false, false],
      notes: { 9: 'Bina yönetimi aidatı' }
    }
  ];

  const items: LoremItem[] = rawItems.map(raw => ({
    id: raw.id,
    name: raw.name,
    category: raw.category,
    dueDay: raw.dueDay,
    years: {
      [seedYear]: {
        amounts: raw.amounts,
        paid: raw.paid,
        notes: raw.notes
      }
    },
    amounts: raw.amounts,
    paid: raw.paid,
    notes: raw.notes
  }));

  return {
    workspaceTitle: 'LOREM HOME // Gider Matrisi',
    selectedYear: seedYear,
    selectedMonth: 9, // Ekim (0-indexed)
    viewMode: 'monthly',
    activeCategoryFilter: 'Tümü',
    quickAddCategory: 'Sabit',
    categories: DEFAULT_CATEGORIES,
    items
  };
}

function parseFlexibleAmount(rawStr: any): number {
  if (typeof rawStr === 'number') return Math.max(0, Math.round(rawStr));
  if (!rawStr) return 0;
  let str = String(rawStr).trim();
  if (!str) return 0;

  str = str.replace(/[₺TL\s]/gi, '');

  if (/^[0-9.,+\-*()]+$/.test(str) && /[+\-*]/.test(str)) {
    try {
      const normalized = str.replace(/\./g, '').replace(/,/g, '.');
      const tokens = normalized.match(/(\d+(\.\d+)?|[+\-*])/g);
      if (tokens && tokens.length >= 3) {
        let acc = parseFloat(tokens[0]) || 0;
        for (let i = 1; i < tokens.length; i += 2) {
          const op = tokens[i];
          const nextVal = parseFloat(tokens[i + 1]) || 0;
          if (op === '+') acc += nextVal;
          else if (op === '-') acc -= nextVal;
          else if (op === '*') acc *= nextVal;
        }
        return Math.max(0, Math.round(acc));
      }
    } catch {
      // fallback
    }
  }

  const digitsOnly = str.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(digitsOnly);
  return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed));
}

function formatTL(val: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(val || 0);
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0
  }).format(val || 0);
}

interface LoremHomeViewProps {
  onSwitchWorkspace?: (workspace: 'argon') => void;
  onLogout: () => void;
}

export const LoremHomeView: React.FC<LoremHomeViewProps> = ({ onSwitchWorkspace, onLogout }) => {
  const [data, setData] = useState<LoremState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          const categories = Array.isArray(parsed.categories) && parsed.categories.length > 0 
            ? parsed.categories 
            : DEFAULT_CATEGORIES;
          
          const selYear = parsed.selectedYear || 2026;

          const items: LoremItem[] = parsed.items.map((it: any) => {
            const itemYears: Record<number, LoremYearData> = it.years || {};
            // Eğer years[selYear] yoksa, root amounts'tan taşı
            if (!itemYears[selYear] && Array.isArray(it.amounts)) {
              itemYears[selYear] = {
                amounts: it.amounts,
                paid: it.paid || Array(12).fill(false),
                notes: it.notes || {}
              };
            }

            return {
              id: it.id || 'item-' + Math.random(),
              name: it.name || 'Gider',
              category: it.category || 'Sabit',
              dueDay: typeof it.dueDay === 'number' ? it.dueDay : 15,
              years: itemYears,
              amounts: itemYears[selYear]?.amounts || Array(12).fill(0),
              paid: itemYears[selYear]?.paid || Array(12).fill(false),
              notes: itemYears[selYear]?.notes || {}
            };
          });

          return {
            ...createInitialDemoState(),
            ...parsed,
            selectedYear: selYear,
            categories,
            items
          };
        }
      }
    } catch {
      // fallback
    }
    return createInitialDemoState();
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ item: LoremItem; index: number } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Cloud Sync Status (Cloudflare D1 / KV / API)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  const syncTimeoutRef = useRef<any>(null);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColorPreset, setSelectedColorPreset] = useState(COLOR_PRESETS[0]);

  // Settings / Backup Modal State
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Quick Add State
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState<string>('Sabit');
  const [quickAddDueDay, setQuickAddDueDay] = useState<number>(15);
  const [matrixQuickAddName, setMatrixQuickAddName] = useState('');

  // Fetch initial data from Cloudflare D1 / KV API if online
  useEffect(() => {
    let active = true;
    fetch('/api/data')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Bulut verisi yok');
      })
      .then(remoteData => {
        if (!active || !remoteData || !Array.isArray(remoteData.items)) return;
        setData(prev => ({
          ...prev,
          ...remoteData,
          selectedYear: remoteData.selectedYear || prev.selectedYear || 2026
        }));
        setCloudSyncStatus('synced');
      })
      .catch(() => {
        setCloudSyncStatus('offline');
      });

    return () => { active = false; };
  }, []);

  // Persist state & debounce sync to Cloudflare D1
  const saveData = (nextData: typeof data) => {
    setData(nextData);
    
    // 1. Yerel Hafızaya Anında Kaydet (Offline-first)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // 2. Cloudflare D1 / KV Sunucusuna Eşitle (Debounce 1.2s)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setCloudSyncStatus('syncing');

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextData)
        });
        if (res.ok) {
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('offline');
        }
      } catch {
        setCloudSyncStatus('offline');
      }
    }, 1200);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Yıl Değiştirme
  const handleSelectYear = (targetYear: number) => {
    saveData({
      ...data,
      selectedYear: targetYear
    });
    showToast(`${targetYear} yılına geçildi. Geçmiş verileriniz korunmaktadır.`);
  };

  // Önceki yıldan sabit giderleri yeni yıla devretme (2026 -> 2027)
  const handleCarryOverFromPrevYear = () => {
    const fromYear = data.selectedYear - 1;
    const toYear = data.selectedYear;

    let count = 0;
    const updated = data.items.map(it => {
      const fromData = getItemYearData(it, fromYear);
      const toData = getItemYearData(it, toYear);

      // Son bilinen tutar (Aralık veya en son dolu ay)
      let lastAmt = 0;
      for (let m = 11; m >= 0; m--) {
        if (fromData.amounts[m] > 0) {
          lastAmt = fromData.amounts[m];
          break;
        }
      }

      if (lastAmt > 0 && it.category === 'Sabit') {
        count++;
        const nextAmounts = toData.amounts.map(a => a > 0 ? a : lastAmt);
        const nextYears = { ...(it.years || {}) };
        nextYears[toYear] = {
          ...toData,
          amounts: nextAmounts
        };
        return {
          ...it,
          years: nextYears
        };
      }
      return it;
    });

    saveData({ ...data, items: updated });
    showToast(`${count} sabit gider kalemi ${fromYear} yılından ${toYear} yılına başarıyla devredildi.`);
  };

  // Month stats for currently selected year and month
  const currentMonthStats = useMemo(() => {
    const mIdx = data.selectedMonth;
    const y = data.selectedYear;
    let total = 0;
    let paid = 0;
    let paidCount = 0;
    const activeCount = data.items.length;

    data.items.forEach(item => {
      const yearData = getItemYearData(item, y);
      const amt = Number(yearData.amounts[mIdx]) || 0;
      const isPaid = Boolean(yearData.paid[mIdx]);
      total += amt;
      if (isPaid) {
        paid += amt;
        paidCount++;
      }
    });

    const remaining = Math.max(0, total - paid);
    const pendingCount = Math.max(0, activeCount - paidCount);
    const paidPercent = total > 0 ? Math.round((paid / total) * 100) : (paidCount === activeCount && activeCount > 0 ? 100 : 0);

    const prevIdx = mIdx > 0 ? mIdx - 1 : null;
    let prevTotal = 0;
    if (prevIdx !== null) {
      data.items.forEach(item => {
        const yearData = getItemYearData(item, y);
        prevTotal += Number(yearData.amounts[prevIdx]) || 0;
      });
    }

    const diffAbs = prevIdx !== null ? total - prevTotal : 0;
    const diffPct = (prevIdx !== null && prevTotal > 0) ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return {
      total,
      paid,
      remaining,
      paidCount,
      pendingCount,
      activeCount,
      paidPercent,
      prevIdx,
      prevTotal,
      diffAbs,
      diffPct
    };
  }, [data.selectedYear, data.selectedMonth, data.items]);

  // Due alerts summary count for active month & year
  const monthDueAlertSummary = useMemo(() => {
    const mIdx = data.selectedMonth;
    const y = data.selectedYear;
    let red = 0;
    let yellow = 0;
    let green = 0;

    data.items.forEach(item => {
      const yearData = getItemYearData(item, y);
      const isPaid = Boolean(yearData.paid[mIdx]);
      if (!isPaid) {
        const status = getDueStatus(item.dueDay || 15, mIdx, y, false);
        if (status.status === 'red') red++;
        else if (status.status === 'yellow') yellow++;
        else if (status.status === 'green') green++;
      }
    });

    return { red, yellow, green };
  }, [data.selectedYear, data.selectedMonth, data.items]);

  // Filtered items in monthly view
  const filteredItems = useMemo(() => {
    const mIdx = data.selectedMonth;
    const y = data.selectedYear;
    return data.items.filter(item => {
      const yearData = getItemYearData(item, y);
      if (data.activeCategoryFilter === 'Tümü') return true;
      if (data.activeCategoryFilter === 'Bekleyenler') return !yearData.paid[mIdx];
      return item.category === data.activeCategoryFilter;
    });
  }, [data.items, data.selectedYear, data.selectedMonth, data.activeCategoryFilter]);

  // Item Update Actions (Year-aware)
  const handleAmountChange = (itemId: string, monthIdx: number, val: number) => {
    const y = data.selectedYear;
    const updated = data.items.map(it => {
      if (it.id === itemId) {
        const yearData = getItemYearData(it, y);
        const nextAmounts = [...yearData.amounts];
        nextAmounts[monthIdx] = val;

        const nextYears = { ...(it.years || {}) };
        nextYears[y] = {
          ...yearData,
          amounts: nextAmounts
        };

        return {
          ...it,
          years: nextYears,
          amounts: nextAmounts
        };
      }
      return it;
    });
    saveData({ ...data, items: updated });
  };

  const handleDueDayChange = (itemId: string, newDay: number) => {
    const clamped = Math.min(31, Math.max(1, newDay || 1));
    const updated = data.items.map(it => {
      if (it.id === itemId) {
        return { ...it, dueDay: clamped };
      }
      return it;
    });
    saveData({ ...data, items: updated });
  };

  const handleTogglePaid = (itemId: string, monthIdx: number) => {
    const y = data.selectedYear;
    const updated = data.items.map(it => {
      if (it.id === itemId) {
        const yearData = getItemYearData(it, y);
        const nextPaid = [...yearData.paid];
        nextPaid[monthIdx] = !nextPaid[monthIdx];

        const nextYears = { ...(it.years || {}) };
        nextYears[y] = {
          ...yearData,
          paid: nextPaid
        };

        return {
          ...it,
          years: nextYears,
          paid: nextPaid
        };
      }
      return it;
    });
    saveData({ ...data, items: updated });
  };

  const handleNoteChange = (itemId: string, monthIdx: number, note: string) => {
    const y = data.selectedYear;
    const updated = data.items.map(it => {
      if (it.id === itemId) {
        const yearData = getItemYearData(it, y);
        const nextNotes = { ...yearData.notes, [monthIdx]: note };

        const nextYears = { ...(it.years || {}) };
        nextYears[y] = {
          ...yearData,
          notes: nextNotes
        };

        return {
          ...it,
          years: nextYears,
          notes: nextNotes
        };
      }
      return it;
    });
    saveData({ ...data, items: updated });
  };

  const handleCycleCategory = (itemId: string) => {
    const cats = data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES;
    const updated = data.items.map(it => {
      if (it.id === itemId) {
        const currIdx = cats.findIndex(c => c.id === it.category);
        const next = cats[(currIdx + 1) % cats.length];
        return { ...it, category: next.id };
      }
      return it;
    });
    saveData({ ...data, items: updated });
  };

  const handleDeleteItem = (item: LoremItem) => {
    const idx = data.items.findIndex(i => i.id === item.id);
    const updated = data.items.filter(i => i.id !== item.id);
    setLastDeleted({ item, index: idx });
    saveData({ ...data, items: updated });
    showToast(`"${item.name}" gider kalemi silindi.`);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const updated = [...data.items];
    updated.splice(lastDeleted.index, 0, lastDeleted.item);
    setLastDeleted(null);
    saveData({ ...data, items: updated });
    showToast('Silinen kalem geri yüklendi.');
  };

  const handleCopyPrev = (mode: 'fixed' | 'all') => {
    const mIdx = data.selectedMonth;
    const y = data.selectedYear;
    if (mIdx === 0) {
      showToast('Ocak yılın ilk ayı olduğu için önceki ay verisi yok.');
      return;
    }
    const prevIdx = mIdx - 1;
    let count = 0;
    const updated = data.items.map(it => {
      const yearData = getItemYearData(it, y);
      const prevAmt = Number(yearData.amounts[prevIdx]) || 0;
      const currAmt = Number(yearData.amounts[mIdx]) || 0;
      if (prevAmt <= 0) return it;
      if (mode === 'all' || (mode === 'fixed' && (it.category === 'Sabit' || currAmt === 0))) {
        const nextAmounts = [...yearData.amounts];
        nextAmounts[mIdx] = prevAmt;
        count++;
        const nextYears = { ...(it.years || {}) };
        nextYears[y] = {
          ...yearData,
          amounts: nextAmounts
        };
        return { ...it, years: nextYears, amounts: nextAmounts };
      }
      return it;
    });
    saveData({ ...data, items: updated });
    showToast(`${count} adet kalem ${MONTHS_TR[prevIdx].full} ayından kopyalandı.`);
  };

  const handleQuickAdd = (source: 'monthly' | 'matrix') => {
    const name = source === 'monthly' ? quickAddName.trim() : matrixQuickAddName.trim();
    if (!name) return;

    const y = data.selectedYear;
    const newItem: LoremItem = {
      id: 'item-' + Date.now(),
      name,
      category: source === 'monthly' ? quickAddCategory : (data.categories[0]?.id || 'Sabit'),
      dueDay: source === 'monthly' ? (quickAddDueDay || 15) : 15,
      years: {
        [y]: {
          amounts: Array(12).fill(0),
          paid: Array(12).fill(false),
          notes: {}
        }
      },
      amounts: Array(12).fill(0),
      paid: Array(12).fill(false),
      notes: {}
    };

    const updated = [...data.items, newItem];
    if (source === 'monthly') setQuickAddName('');
    else setMatrixQuickAddName('');
    saveData({ ...data, items: updated });
    showToast(`"${newItem.name}" eklendi.`);
  };

  // Category Manager Handlers
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (data.categories.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`"${trimmed}" kategorisi zaten mevcut.`);
      return;
    }
    const newCat: LoremCategory = {
      id: trimmed,
      label: trimmed,
      icon: 'tag',
      color: selectedColorPreset.hex,
      badgeClass: selectedColorPreset.badgeClass
    };
    const updatedCats = [...data.categories, newCat];
    saveData({ ...data, categories: updatedCats });
    setNewCategoryName('');
    showToast(`"${trimmed}" kategorisi başarıyla eklendi.`);
  };

  const handleDeleteCategory = (catId: string) => {
    if (data.categories.length <= 1) {
      showToast('En az bir kategori bulunmalıdır.');
      return;
    }
    const fallbackCat = data.categories.find(c => c.id !== catId) || data.categories[0];
    const updatedCats = data.categories.filter(c => c.id !== catId);
    
    const updatedItems = data.items.map(it => {
      if (it.category === catId) {
        return { ...it, category: fallbackCat.id };
      }
      return it;
    });

    saveData({
      ...data,
      categories: updatedCats,
      items: updatedItems,
      activeCategoryFilter: data.activeCategoryFilter === catId ? 'Tümü' : data.activeCategoryFilter,
      quickAddCategory: data.quickAddCategory === catId ? fallbackCat.id : data.quickAddCategory
    });
    showToast(`"${catId}" kategorisi silindi.`);
  };

  // JSON Export / Import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `odemetakip_yedek_${data.selectedYear}_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showToast('Yedek JSON dosyası indirildi.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.items)) {
            saveData(parsed);
            showToast('Yedek başarıyla geri yüklendi.');
            setBackupModalOpen(false);
          } else {
            showToast('Geçersiz yedek dosyası formatı!');
          }
        } catch {
          showToast('Dosya okunurken hata oluştu!');
        }
      };
    }
  };

  const isCurrentYearEmpty = useMemo(() => {
    const y = data.selectedYear;
    let sum = 0;
    data.items.forEach(it => {
      const yd = getItemYearData(it, y);
      sum += yd.amounts.reduce((a, b) => a + (Number(b) || 0), 0);
    });
    return sum === 0;
  }, [data.selectedYear, data.items]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-150 flex flex-col">
      
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={data.workspaceTitle}
                  onChange={(e) => saveData({ ...data, workspaceTitle: e.target.value })}
                  className="font-bold text-xs sm:text-base tracking-tight bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 rounded-md px-1 sm:px-1.5 py-0.5 -ml-1 outline-none transition-all truncate w-28 xs:w-36 sm:w-56 md:w-64"
                />

                {/* Cloudflare D1 Sync Badge */}
                <span
                  title={
                    cloudSyncStatus === 'synced'
                      ? 'Cloudflare D1 Veri Tabanı ile eşitlendi'
                      : cloudSyncStatus === 'syncing'
                      ? 'Buluta kaydediliyor...'
                      : 'Yerel mod (İnternet veya API bağlantısı yok)'
                  }
                  className={`hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                    cloudSyncStatus === 'synced'
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                      : cloudSyncStatus === 'syncing'
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20 animate-pulse'
                      : 'text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {cloudSyncStatus === 'synced' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Bulut Eşitlendi (D1)</span>
                    </>
                  ) : cloudSyncStatus === 'syncing' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Eşitleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Yerel Hafıza</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block truncate">
                Çok Yıllı Veri Tabanı · Vade Uyarı Sistemi · Otomatik Eşitleme
              </p>
            </div>
          </div>

          {/* View Switchers & Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* View Mode Segmented Control: Monthly, Matrix, and Analytics */}
            <div className="inline-flex p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => saveData({ ...data, viewMode: 'monthly' })}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  data.viewMode === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Aylık Hızlı Giriş"
              >
                <ListChecks className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Aylık Hızlı Giriş</span>
                <span className="sm:hidden">Aylık</span>
              </button>

              <button
                type="button"
                onClick={() => saveData({ ...data, viewMode: 'matrix' })}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  data.viewMode === 'matrix'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Yıllık Matris"
              >
                <Table2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Yıllık Matris</span>
                <span className="sm:hidden">Matris</span>
              </button>

              <button
                type="button"
                onClick={() => saveData({ ...data, viewMode: 'analytics' })}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  data.viewMode === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grafik & Analiz"
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Grafik & Analiz</span>
                <span className="sm:hidden">Grafik</span>
              </button>
            </div>

            {/* Veri Tabanı / Yedekleme Butonu */}
            <button
              type="button"
              onClick={() => setBackupModalOpen(true)}
              title="Veri Tabanı & Yedekleme"
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Database className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-500" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Tema Değiştir"
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-700" />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              title="Çıkış Yap"
              className="p-1.5 sm:p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        
        {/* YEAR & MONTH SELECTOR BAR */}
        <section className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-2 sm:p-3 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            
            {/* Year Selector & Month Controls */}
            <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0 flex-wrap">
              
              {/* YIL SEÇİCİ (< 2026 >) - 2026 Asla Silinmez, 2027+ Ayrı Tutulur */}
              <div className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-1 border border-indigo-200/80 dark:border-indigo-800/50">
                <button
                  type="button"
                  onClick={() => handleSelectYear(data.selectedYear - 1)}
                  title={`${data.selectedYear - 1} Yılına Git`}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 text-xs sm:text-sm font-extrabold tracking-tight text-indigo-900 dark:text-indigo-200 tabular-nums">
                  {data.selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectYear(data.selectedYear + 1)}
                  title={`${data.selectedYear + 1} Yılına Git`}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ay Seçici (< Ekim >) */}
              <div className="inline-flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-zinc-700/50">
                <button
                  type="button"
                  onClick={() => saveData({ ...data, selectedMonth: (data.selectedMonth + 11) % 12 })}
                  title="Önceki Ay"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs sm:text-sm font-bold tracking-tight min-w-[100px] text-center tabular-nums">
                  {MONTHS_TR[data.selectedMonth].full}
                </span>
                <button
                  type="button"
                  onClick={() => saveData({ ...data, selectedMonth: (data.selectedMonth + 1) % 12 })}
                  title="Sonraki Ay"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 12 Month Pills (Seçili Yıl İçin) */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 w-full">
              {MONTHS_TR.map(m => {
                let mTotal = 0;
                let mPaid = true;
                data.items.forEach(it => {
                  const yd = getItemYearData(it, data.selectedYear);
                  const amt = Number(yd.amounts[m.index]) || 0;
                  mTotal += amt;
                  if (amt > 0 && !yd.paid[m.index]) mPaid = false;
                });
                const isSelected = m.index === data.selectedMonth;
                const hasData = mTotal > 0;
                const compactTotal = hasData
                  ? (mTotal >= 1000 ? `₺${Math.round(mTotal / 1000)}b` : `₺${mTotal}`)
                  : '—';

                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => saveData({ ...data, selectedMonth: m.index })}
                    className={`group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : hasData
                          ? 'bg-slate-50/70 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200/80 dark:border-zinc-700/60'
                          : 'bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold tracking-tight">{m.short}</span>
                      {hasData && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : mPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      )}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-mono tabular-nums ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {compactTotal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Yeni Yıla Geçildiğinde Devretme Bildirimi */}
        {isCurrentYearEmpty && data.selectedYear > 2026 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/60 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <strong className="text-indigo-950 dark:text-indigo-200">{data.selectedYear} Yılı Henüz Boş:</strong>
                <span className="text-slate-600 dark:text-zinc-400 ml-1">
                  Önceki ({data.selectedYear - 1}) yılındaki sabit giderleri (kira, faturalar vs.) bu yıla tek tıkla aktarabilirsiniz.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCarryOverFromPrevYear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <span>{data.selectedYear - 1} Sabitlerini Aktar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI SUMMARY STRIP */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* KPI 1: Toplam Gider */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">{MONTHS_TR[data.selectedMonth].full} {data.selectedYear} Toplam</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
                {formatTL(currentMonthStats.total)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
                {currentMonthStats.activeCount} gider kalemi aktif
              </div>
            </div>
          </div>

          {/* KPI 2: Ödenen Tutar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">Ödenen Tutar</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                {formatTL(currentMonthStats.paid)}
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                <span>{currentMonthStats.paidCount}/{currentMonthStats.activeCount} ödendi</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">%{currentMonthStats.paidPercent}</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Kalan / Bekleyen */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">Kalan / Bekleyen</span>
              <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${
                currentMonthStats.remaining > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 text-slate-400'
              }`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className={`text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight truncate ${
                currentMonthStats.remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              }`}>
                {formatTL(currentMonthStats.remaining)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
                {currentMonthStats.pendingCount} kalem bekliyor
              </div>
            </div>
          </div>

          {/* KPI 4: Vade Uyarı Durumu */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">Vade Uyarıları</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {monthDueAlertSummary.red > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse">
                    🔴 {monthDueAlertSummary.red} Acil
                  </span>
                ) : null}
                {monthDueAlertSummary.yellow > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                    🟡 {monthDueAlertSummary.yellow} Yaklaşan
                  </span>
                ) : null}
                {monthDueAlertSummary.green > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    🟢 {monthDueAlertSummary.green} Rahat
                  </span>
                ) : null}
                {monthDueAlertSummary.red === 0 && monthDueAlertSummary.yellow === 0 && monthDueAlertSummary.green === 0 && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Tüm ödemeler tamamlandı!
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
                🟢 &gt;7g · 🟡 3-7g · 🔴 ≤3g
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* VIEW 1: AYLIK HIZLI GİRİŞ                                      */}
        {/* ============================================================== */}
        {data.viewMode === 'monthly' && (
          <section className="space-y-3">
            
            {/* Category Filter & Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-2.5 sm:px-4 shadow-xs">
              
              {/* Category Filter Pills & Mini Category Manager Button */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['Tümü', 'Bekleyenler', ...data.categories.map(c => c.id)].map(f => {
                  const active = data.activeCategoryFilter === f;
                  const count = f === 'Tümü'
                    ? data.items.length
                    : f === 'Bekleyenler'
                    ? data.items.filter(i => {
                        const yd = getItemYearData(i, data.selectedYear);
                        return !yd.paid[data.selectedMonth];
                      }).length
                    : data.items.filter(i => i.category === f).length;

                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => saveData({ ...data, activeCategoryFilter: f })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{f}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-white/20 dark:bg-zinc-900/20' : 'bg-slate-200/80 dark:bg-zinc-700/70'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Kategori Yönetimi Açma Butonu */}
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/25 transition-all cursor-pointer shrink-0 ml-1"
                  title="Kategori Yönetimi"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Kategoriler</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyPrev('fixed')}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200/80 dark:border-indigo-500/25 transition-all cursor-pointer"
                  title="Sabit giderleri ve henüz girilmemiş (0 ₺) kalemleri geçen aydan kopyalar"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Sabitleri Geçen Aydan Kopyala</span>
                  <span className="sm:hidden">Sabitleri Kopyala</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyPrev('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  title="Geçen ayın tüm tutarlarını bu aya kopyalar"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">Tüm Geçen Ayı Kopyala</span>
                  <span className="sm:hidden">Tümünü Kopyala</span>
                </button>
              </div>
            </div>

            {/* Expense Table Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl shadow-xs overflow-hidden">
              
              {/* Table Header (Desktop Only) */}
              <div className="hidden md:grid md:grid-cols-12 items-center px-4 py-2.5 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
                <div className="col-span-5 flex items-center gap-2 pl-2">
                  <span>Gider Kalemi · Kategori · Vade Durumu · Son Gün</span>
                </div>
                <div className="col-span-2 text-right pr-3">
                  <span>{currentMonthStats.prevIdx !== null ? `${MONTHS_TR[currentMonthStats.prevIdx].full} (Geçen Ay)` : 'Önceki Ay'}</span>
                </div>
                <div className="col-span-2 pl-2">
                  <span>Kısa Not / Açıklama</span>
                </div>
                <div className="col-span-2 text-right pr-2">
                  <span>{MONTHS_TR[data.selectedMonth].full} {data.selectedYear} Tutarı (₺)</span>
                </div>
                <div className="col-span-1 text-right pr-2">
                  <span>Durum</span>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                {filteredItems.map((item, idx) => {
                  const mIdx = data.selectedMonth;
                  const y = data.selectedYear;
                  const prevIdx = mIdx > 0 ? mIdx - 1 : null;
                  
                  const yearData = getItemYearData(item, y);
                  const currAmt = Number(yearData.amounts[mIdx]) || 0;
                  const prevAmt = prevIdx !== null ? (Number(yearData.amounts[prevIdx]) || 0) : 0;
                  const isPaid = Boolean(yearData.paid[mIdx]);
                  const noteText = (yearData.notes && yearData.notes[mIdx]) ? yearData.notes[mIdx] : '';
                  const catMeta = data.categories.find(c => c.id === item.category) || DEFAULT_CATEGORIES[0];
                  const dueStatus = getDueStatus(item.dueDay || 15, mIdx, y, isPaid);

                  return (
                    <div
                      key={item.id}
                      className={`group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2.5 md:gap-0 px-3 sm:px-4 py-3 md:py-2.5 transition-colors ${
                        isPaid
                          ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          : 'hover:bg-slate-50/90 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Line 1: Index + Name + Category + Due Warning Badge (Desktop Col 1-5) */}
                      <div className="md:col-span-5 flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-1.5 sm:gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums shrink-0 select-none">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = data.items.map(it => it.id === item.id ? { ...it, name: val } : it);
                              saveData({ ...data, items: updated });
                            }}
                            className="font-semibold text-sm text-slate-800 dark:text-zinc-100 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 rounded-lg px-2 py-1 min-w-0 flex-1 outline-none transition-all truncate"
                          />
                        </div>

                        {/* Badges: Category & Due Day / Alert */}
                        <div className="flex items-center gap-1.5 shrink-0 pl-7 sm:pl-0 flex-wrap">
                          {/* Kategori Rozeti */}
                          <button
                            type="button"
                            onClick={() => handleCycleCategory(item.id)}
                            className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer select-none ${catMeta.badgeClass}`}
                            title="Kategoriyi değiştir (tıklayın)"
                          >
                            {catMeta.label}
                          </button>

                          {/* Vade Uyarı Rozeti */}
                          <div
                            className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] select-none transition-all ${dueStatus.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dueStatus.dotClass}`} />
                            <span className="font-semibold">{dueStatus.text}</span>
                          </div>

                          {/* Son Gün (Vade) Kutusu */}
                          <div
                            title="Son ödeme gününü değiştirmek için tıklayın (1-31)"
                            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200/90 dark:border-zinc-700 text-[11px] text-slate-600 dark:text-zinc-300 transition-colors shadow-2xs group/vade"
                          >
                            <Calendar className="w-3 h-3 text-slate-400 group-hover/vade:text-indigo-500 dark:text-zinc-500 transition-colors shrink-0" />
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 select-none">Ayın</span>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={item.dueDay || 15}
                              onChange={(e) => handleDueDayChange(item.id, parseInt(e.target.value) || 15)}
                              className="w-5 text-center font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded px-0.5 py-0.2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-[11px] tabular-nums"
                            />
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 select-none">'i</span>
                          </div>
                        </div>
                      </div>

                      {/* Line 2 on mobile: Note and Prev Month together (Desktop Col 6-7, 8-9) */}
                      <div className="flex items-center justify-between gap-2 md:contents">
                        <div className="md:col-span-2 flex items-center justify-end md:justify-end gap-1.5 text-xs pr-0 md:pr-3">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500">Geçen:</span>
                          <span className="font-mono tabular-nums text-slate-500 dark:text-zinc-400 font-medium">
                            {prevIdx !== null ? formatTL(prevAmt) : '—'}
                          </span>
                          {prevIdx !== null && prevAmt > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAmountChange(item.id, mIdx, prevAmt)}
                              title={`Geçen ayın tutarını (${formatTL(prevAmt)}) bu aya kopyala`}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            >
                              <ArrowRightToLine className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="md:col-span-2 flex-1 md:flex-initial px-0 md:px-2">
                          <input
                            type="text"
                            value={noteText}
                            placeholder="kısa not..."
                            onChange={(e) => handleNoteChange(item.id, mIdx, e.target.value)}
                            className="w-full text-xs text-slate-600 dark:text-zinc-300 placeholder-slate-300 dark:placeholder-zinc-600 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 rounded-lg px-2.5 py-1 outline-none transition-all text-right md:text-left"
                          />
                        </div>
                      </div>

                      {/* Line 3 on mobile: Amount + Paid Toggle + Delete (Desktop Col 10-12) */}
                      <div className="flex items-center justify-between gap-2 md:contents">
                        <div className="md:col-span-2 flex-1 md:flex-initial flex items-center justify-end pr-0 md:pr-2">
                          <div className="relative flex items-center w-full md:w-36">
                            <span className="absolute left-3 text-xs font-mono text-slate-400 dark:text-zinc-500 pointer-events-none select-none">₺</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              defaultValue={currAmt > 0 ? formatNumber(currAmt) : ''}
                              key={`${item.id}-${y}-${mIdx}-${currAmt}`}
                              onBlur={(e) => {
                                const parsed = parseFlexibleAmount(e.target.value);
                                handleAmountChange(item.id, mIdx, parsed);
                                e.target.value = parsed > 0 ? formatNumber(parsed) : '';
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              placeholder="0"
                              className="w-full text-right font-mono font-bold text-sm sm:text-base tabular-nums pl-7 pr-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-zinc-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end gap-1 shrink-0 pl-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePaid(item.id, mIdx)}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none min-w-[75px] ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{isPaid ? 'Ödendi' : 'Bekliyor'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            title="Gider kalemini sil"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-80 md:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Add Row */}
              <div className="p-2.5 sm:px-4 sm:py-3 bg-slate-50/90 dark:bg-zinc-900/70 border-t border-slate-200/90 dark:border-zinc-800/90">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700/80 focus-within:border-indigo-500 rounded-xl px-3 py-2 shadow-2xs transition-all flex-wrap">
                    <PlusCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    <input
                      type="text"
                      placeholder={`+ ${data.selectedYear} yılına yeni gider kalemi ekle...`}
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd('monthly');
                      }}
                      className="min-w-[120px] flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        const curr = data.categories.findIndex(c => c.id === quickAddCategory);
                        const next = data.categories[(curr + 1) % data.categories.length];
                        setQuickAddCategory(next.id);
                      }}
                      className="shrink-0 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all cursor-pointer select-none bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      title="Kategori değiştir"
                    >
                      {quickAddCategory}
                    </button>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400">Son gün: Ayın</span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={quickAddDueDay}
                        onChange={(e) => setQuickAddDueDay(parseInt(e.target.value) || 15)}
                        className="w-6 text-center font-bold font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded px-0.5 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        title="Son ödeme günü (1-31)"
                      />
                      <span className="text-[10px] text-slate-400">'i</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd('monthly')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    Kalem Ekle
                  </button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: YILLIK MATRİS (12 AY)                                 */}
        {/* ============================================================== */}
        {data.viewMode === 'matrix' && (
          <section className="space-y-3">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-3 sm:px-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-xs sm:text-sm font-bold tracking-tight">{data.selectedYear} Yıllık Gider Matrisi (12 Ay Hücre İçi Düzenleme)</h2>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Ödendi
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1" /> Bekliyor
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/95 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 select-none">
                      <th className="sticky left-0 z-20 bg-slate-50 dark:bg-zinc-900 px-2 sm:px-3 py-2.5 min-w-[140px] sm:min-w-[210px] border-r border-slate-200 dark:border-zinc-800">
                        Gider Kalemi & Vade
                      </th>
                      {MONTHS_TR.map(m => (
                        <th
                          key={m.index}
                          onClick={() => saveData({ ...data, selectedMonth: m.index })}
                          className={`px-1.5 sm:px-2 py-2.5 text-right min-w-[80px] sm:min-w-[92px] cursor-pointer transition-colors ${
                            m.index === data.selectedMonth
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          {m.short}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-right min-w-[110px] bg-slate-100/70 dark:bg-zinc-800/50 border-l border-slate-200 dark:border-zinc-800">
                        Yıllık Toplam
                      </th>
                      <th className="px-3 py-2.5 text-right min-w-[95px] bg-slate-100/70 dark:bg-zinc-800/50">
                        Aylık Ort.
                      </th>
                      <th className="px-2 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/60 text-xs">
                    {data.items.map((item) => {
                      const catMeta = data.categories.find(c => c.id === item.category) || DEFAULT_CATEGORIES[0];
                      const yearData = getItemYearData(item, data.selectedYear);
                      const yearlySum = yearData.amounts.reduce((a, b) => a + (Number(b) || 0), 0);
                      const nonZeroMonths = yearData.amounts.filter(a => Number(a) > 0).length || 1;
                      const monthlyAvg = Math.round(yearlySum / nonZeroMonths);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 group">
                          {/* Sticky Item Name + Category + Due Day */}
                          <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-slate-50 dark:group-hover:bg-zinc-850 px-2 sm:px-3 py-2 border-r border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 dark:text-zinc-200 block truncate">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded border ${catMeta.badgeClass}`}>
                                    {catMeta.label}
                                  </span>
                                  <span className="font-mono">Vade: {item.dueDay || 15}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 12 Months Cells */}
                          {MONTHS_TR.map(m => {
                            const val = Number(yearData.amounts[m.index]) || 0;
                            const isPaid = Boolean(yearData.paid[m.index]);
                            const isCurrent = m.index === data.selectedMonth;

                            return (
                              <td
                                key={m.index}
                                className={`px-1 py-1 text-right tabular-nums transition-colors relative ${
                                  isCurrent ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                }`}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    defaultValue={val > 0 ? formatNumber(val) : ''}
                                    key={`${item.id}-${data.selectedYear}-${m.index}-${val}`}
                                    onBlur={(e) => {
                                      const parsed = parseFlexibleAmount(e.target.value);
                                      handleAmountChange(item.id, m.index, parsed);
                                      e.target.value = parsed > 0 ? formatNumber(parsed) : '';
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    }}
                                    placeholder="—"
                                    className={`w-full text-right font-mono text-[11px] sm:text-xs py-1 px-1.5 rounded-lg border outline-none transition-all ${
                                      val > 0
                                        ? isPaid
                                          ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-semibold'
                                          : 'border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 font-semibold'
                                        : 'border-transparent hover:border-slate-300 dark:hover:border-zinc-700 text-slate-400 bg-transparent'
                                    }`}
                                  />
                                </div>
                              </td>
                            );
                          })}

                          {/* Yearly Total */}
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 dark:text-zinc-200 border-l border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850/40">
                            {formatTL(yearlySum)}
                          </td>

                          {/* Monthly Average */}
                          <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-850/40">
                            {formatTL(monthlyAvg)}
                          </td>

                          {/* Delete Item */}
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              title="Sil"
                              className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 dark:border-zinc-700 bg-slate-100/90 dark:bg-zinc-900 font-mono font-bold text-xs">
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-100 dark:bg-zinc-900 px-3 py-2.5 border-r border-slate-300 dark:border-zinc-700">
                        AYLIK TOPLAM
                      </td>
                      {MONTHS_TR.map(m => {
                        const mTotal = data.items.reduce((acc, it) => {
                          const yd = getItemYearData(it, data.selectedYear);
                          return acc + (Number(yd.amounts[m.index]) || 0);
                        }, 0);
                        const isCurrent = m.index === data.selectedMonth;
                        return (
                          <td
                            key={m.index}
                            className={`px-1.5 sm:px-2 py-2.5 text-right tabular-nums ${
                              isCurrent ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40' : 'text-slate-800 dark:text-zinc-200'
                            }`}
                          >
                            {mTotal > 0 ? formatTL(mTotal) : '—'}
                          </td>
                        );
                      })}
                      {(() => {
                        let grand = 0;
                        data.items.forEach(it => {
                          const yd = getItemYearData(it, data.selectedYear);
                          grand += yd.amounts.reduce((a, b) => a + (Number(b) || 0), 0);
                        });
                        return (
                          <>
                            <td className="px-3 py-2.5 text-right tabular-nums text-indigo-600 dark:text-indigo-400 border-l border-slate-300 dark:border-zinc-700">
                              {formatTL(grand)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 dark:text-zinc-400">
                              {formatTL(Math.round(grand / 12))}
                            </td>
                            <td />
                          </>
                        );
                      })()}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Matrix Quick Add Row */}
              <div className="p-2.5 sm:px-4 sm:py-3 bg-slate-50/90 dark:bg-zinc-900/70 border-t border-slate-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700/80 focus-within:border-indigo-500 rounded-xl px-3 py-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <input
                    type="text"
                    placeholder={`+ ${data.selectedYear} matrisine yeni gider satırı eklemek için isim yazıp Enter'a basın...`}
                    value={matrixQuickAddName}
                    onChange={(e) => setMatrixQuickAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd('matrix');
                    }}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdd('matrix')}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                >
                  Satır Ekle
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: GRAFİK & ANALİZ                                        */}
        {/* ============================================================== */}
        {data.viewMode === 'analytics' && (
          <section className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* 12-Month Bar Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      {data.selectedYear} Aylık Gider Dağılımı ve Ödeme Durumu
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      12 aylık harcama trendi (Ödenen vs Bekleyen)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className="text-slate-600 dark:text-zinc-300">Ödenen</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span className="text-slate-600 dark:text-zinc-300">Bekleyen</span>
                    </span>
                  </div>
                </div>

                {/* Stacked HTML Bar Chart */}
                {(() => {
                  const y = data.selectedYear;
                  const monthlyData = MONTHS_TR.map(m => {
                    let total = 0;
                    let paid = 0;
                    data.items.forEach(it => {
                      const yd = getItemYearData(it, y);
                      const amt = Number(yd.amounts[m.index]) || 0;
                      total += amt;
                      if (yd.paid[m.index]) paid += amt;
                    });
                    return { month: m, total, paid, remaining: Math.max(0, total - paid) };
                  });

                  const maxVal = Math.max(1, ...monthlyData.map(d => d.total));

                  return (
                    <div className="pt-4 pb-2">
                      <div className="h-48 flex items-end gap-1 sm:gap-3 px-0.5 sm:px-1 border-b border-slate-200 dark:border-zinc-800">
                        {monthlyData.map(d => {
                          const heightPct = Math.round((d.total / maxVal) * 100);
                          const paidPct = d.total > 0 ? (d.paid / d.total) * 100 : 0;
                          const isSelected = d.month.index === data.selectedMonth;

                          return (
                            <div
                              key={d.month.index}
                              onClick={() => saveData({ ...data, selectedMonth: d.month.index })}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg font-mono whitespace-nowrap shadow-lg">
                                <div>{d.month.full} {y}: {formatTL(d.total)}</div>
                                <div className="text-emerald-400">Ödenen: {formatTL(d.paid)}</div>
                              </div>

                              <div
                                className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${
                                  isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''
                                }`}
                                style={{ height: `${Math.max(4, heightPct)}%` }}
                              >
                                <div
                                  className="w-full bg-amber-500/80 hover:bg-amber-500 transition-colors"
                                  style={{ height: `${100 - paidPct}%` }}
                                />
                                <div
                                  className="w-full bg-emerald-500/90 hover:bg-emerald-500 transition-colors"
                                  style={{ height: `${paidPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1 sm:gap-3 px-0.5 sm:px-1 mt-2">
                        {monthlyData.map(d => (
                          <div
                            key={d.month.index}
                            onClick={() => saveData({ ...data, selectedMonth: d.month.index })}
                            className={`flex-1 text-center text-[9px] sm:text-[10px] font-bold cursor-pointer transition-colors ${
                              d.month.index === data.selectedMonth
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'
                            }`}
                          >
                            {d.month.short}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-violet-500" />
                    {MONTHS_TR[data.selectedMonth].full} {data.selectedYear} Kategori Dağılımı
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Harcamaların kategorilere göre dağılımı
                  </p>
                </div>

                {(() => {
                  const mIdx = data.selectedMonth;
                  const y = data.selectedYear;
                  const categorySums: Record<string, number> = {};
                  let mTotal = 0;

                  data.items.forEach(it => {
                    const yd = getItemYearData(it, y);
                    const amt = Number(yd.amounts[mIdx]) || 0;
                    if (amt > 0) {
                      categorySums[it.category] = (categorySums[it.category] || 0) + amt;
                      mTotal += amt;
                    }
                  });

                  const sortedCats = Object.entries(categorySums)
                    .map(([catId, amount]) => {
                      const meta = data.categories.find(c => c.id === catId) || DEFAULT_CATEGORIES[0];
                      const pct = mTotal > 0 ? Math.round((amount / mTotal) * 100) : 0;
                      return { catId, meta, amount, pct };
                    })
                    .sort((a, b) => b.amount - a.amount);

                  return (
                    <div className="space-y-3 my-auto py-3">
                      {sortedCats.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Bu ay için henüz harcama girilmedi.</p>
                      ) : (
                        sortedCats.map(c => (
                          <div key={c.catId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.meta.color }} />
                                {c.meta.label}
                              </span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-slate-500 text-[11px]">{c.pct}%</span>
                                <span className="font-bold text-slate-900 dark:text-white">{formatTL(c.amount)}</span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${c.pct}%`, backgroundColor: c.meta.color }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-right font-mono text-xs text-slate-500">
                  Ay Toplamı: <span className="font-bold text-slate-900 dark:text-white">{formatTL(currentMonthStats.total)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Top Items Ranking Table */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                {MONTHS_TR[data.selectedMonth].full} {data.selectedYear} Ayı Harcama Sıralaması
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Bütçenizdeki en büyük kalemlerin oransal ağırlığı ve son ödeme durumları
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Sıra</th>
                      <th className="py-2.5 px-3">Kalem</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                      <th className="py-2.5 px-3 text-right">Bütçe Payı</th>
                      <th className="py-2.5 px-3 text-center">Vade / Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono">
                    {data.items
                      .map(it => {
                        const yd = getItemYearData(it, data.selectedYear);
                        return {
                          item: it,
                          amt: Number(yd.amounts[data.selectedMonth]) || 0,
                          isPaid: Boolean(yd.paid[data.selectedMonth])
                        };
                      })
                      .sort((a, b) => b.amt - a.amt)
                      .map((row, idx) => {
                        const pct = currentMonthStats.total > 0 ? ((row.amt / currentMonthStats.total) * 100).toFixed(1) : '0';
                        const catMeta = data.categories.find(c => c.id === row.item.category) || DEFAULT_CATEGORIES[0];
                        const dueStatus = getDueStatus(row.item.dueDay || 15, data.selectedMonth, data.selectedYear, row.isPaid);

                        return (
                          <tr key={row.item.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-zinc-200">{row.item.name}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${catMeta.badgeClass}`}>
                                {catMeta.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatTL(row.amt)}</td>
                            <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">%{pct}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${dueStatus.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dueStatus.dotClass}`} />
                                {dueStatus.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

      </main>

      {/* MINI KATEGORİ GİRME / YÖNETİM MODAL EKRANI */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kategori Yönetimi</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Giderleri gruplandırmak için kategoriler</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Yeni Kategori Ekle
                </h4>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Market, Eğitim, Sağlık, Aidat..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    className="w-full bg-white dark:bg-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Renk Seçin
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = selectedColorPreset.hex === preset.hex;
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setSelectedColorPreset(preset)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kategoriyi Ekle</span>
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                  Mevcut Kategoriler ({data.categories.length})
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {data.categories.map((cat) => {
                    const itemCount = data.items.filter(i => i.category === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{cat.label}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">({itemCount} kalem)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${cat.badgeClass}`}>
                            Örnek
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="Kategoriyi Sil"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-850/80 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VERİ TABANI & YEDEKLEME MODAL EKRANI */}
      {backupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Veri Tabanı & Yedek</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Bulut eşitleme ve veri dışa/içe aktarma</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBackupModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Cloud Status Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-indigo-500" />
                    Cloudflare D1 Senkronizasyonu
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cloudSyncStatus === 'synced'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}>
                    {cloudSyncStatus === 'synced' ? 'Bağlı (Eşitlendi)' : 'Yerel Hafıza Aktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Siteniz Cloudflare Pages üzerinden açıldığında telefon ve bilgisayarınız otomatik olarak aynı D1 veri tabanından senkronize edilir.
                </p>
              </div>

              {/* JSON Backup Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tüm Verileri Bilgisayara İndir (JSON Yedek)</span>
                </button>

                <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Yedekten Geri Yükle (JSON Dosyası Seç)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-850/80 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setBackupModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-xl border border-slate-700/50 dark:border-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          {lastDeleted && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="ml-1 px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors cursor-pointer"
            >
              Geri Al
            </button>
          )}
        </div>
      )}

    </div>
  );
};
