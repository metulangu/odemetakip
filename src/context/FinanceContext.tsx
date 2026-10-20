import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ExpenseItem, MonthlyEntry, User, ViewMode, ExpenseCategory, Category } from '../types/finance.ts';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'FATURA', name: 'Faturalar', color: '#6366f1' },
  { id: 'KIRA', name: 'Kira & Ofis', color: '#ec4899' },
  { id: 'MAAS', name: 'Maaş & Bordro', color: '#10b981' },
  { id: 'YAZILIM', name: 'Yazılım & SaaS', color: '#06b6d4' },
  { id: 'VERGI', name: 'Vergi & SGK', color: '#f59e0b' },
  { id: 'OPERASYON', name: 'Operasyon', color: '#8b5cf6' },
  { id: 'DIGER', name: 'Diğer Giderler', color: '#64748b' },
];

interface FinanceContextType {
  currentUser: User;
  allUsers: User[];
  items: ExpenseItem[];
  categories: Category[];
  entries: Record<string, MonthlyEntry>;
  viewMode: ViewMode;
  selectedYear: number;
  focusedMonth: number;
  searchQuery: string;
  selectedCategory: string | null;
  activeCell: { itemId: string; month: number; year: number } | null;
  theme: 'light' | 'dark';
  availableYears: number[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedYear: (year: number) => void;
  setFocusedMonth: (month: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string | null) => void;
  setActiveCell: (cell: { itemId: string; month: number; year: number } | null) => void;
  
  // Category management
  addCategory: (name: string, color?: string) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => { reassignedCount: number };

  // Matrix data modifications
  updateEntryAmount: (itemId: string, year: number, month: number, amount: number) => void;
  toggleEntryPaid: (itemId: string, year: number, month: number) => void;
  addExpenseItem: (name: string, category: ExpenseCategory, defaultDueDay: number, initialAmount?: number) => void;
  updateExpenseItem: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpenseItem: (id: string) => void;
  reorderExpenseItems: (newItems: ExpenseItem[]) => void;
  
  // Admin user management
  approveUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  changeUserRole: (userId: string, role: 'ADMIN' | 'MEMBER') => void;
  switchUser: (user: User) => void;
  addNewMockUser: (email: string, name: string) => void;
  resetAllData: () => void;
}

const STORAGE_KEY_ITEMS = 'argon_finance_items_v2';
const STORAGE_KEY_CATEGORIES = 'argon_finance_categories_v2';
const STORAGE_KEY_ENTRIES = 'argon_finance_entries_v2';
const STORAGE_KEY_USERS = 'argon_finance_users_v2';
const STORAGE_KEY_ACTIVE_USER = 'argon_finance_active_user_v2';
const STORAGE_KEY_THEME = 'argon_finance_theme_v2';

const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@argon.local',
    name: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    role: 'ADMIN',
    status: 'APPROVED',
    createdAt: '2025-01-01',
  },
];

const INITIAL_ITEMS: ExpenseItem[] = [
  { id: 'exp-1', name: 'Ofis Kirası (Merkez)', category: 'KIRA', defaultDueDay: 1, isActive: true, order: 1, notes: 'Ataşehir Finans Merkezi Ofis Kirası' },
  { id: 'exp-2', name: 'Elektrik Faturası (Enerjisa)', category: 'FATURA', defaultDueDay: 15, isActive: true, order: 2, notes: 'Ticarethane tarifesi' },
  { id: 'exp-3', name: 'Doğalgaz Faturası (İGDAŞ)', category: 'FATURA', defaultDueDay: 18, isActive: true, order: 3, notes: 'Merkezi ısıtma payı' },
  { id: 'exp-4', name: 'Su Faturası (İSKİ)', category: 'FATURA', defaultDueDay: 20, isActive: true, order: 4 },
  { id: 'exp-5', name: 'Fiber İnternet & Metro Ethernet', category: 'FATURA', defaultDueDay: 12, isActive: true, order: 5, notes: 'Sabit IP & 1 Gbps hat' },
  { id: 'exp-6', name: 'Personel Maaş Ödemeleri', category: 'MAAS', defaultDueDay: 1, isActive: true, order: 6, notes: 'Çalışan net hakedişleri' },
  { id: 'exp-7', name: 'SGK ve Muhtasar Primleri', category: 'VERGI', defaultDueDay: 26, isActive: true, order: 7, notes: 'Yasal bildirge' },
  { id: 'exp-8', name: 'Cloudflare D1 & Workers Pro', category: 'YAZILIM', defaultDueDay: 5, isActive: true, order: 8, notes: 'Edge veritabanı ve API' },
  { id: 'exp-9', name: 'Google Workspace & Gemini Suite', category: 'YAZILIM', defaultDueDay: 8, isActive: true, order: 9, notes: 'Kurumsal e-posta ve depolama' },
  { id: 'exp-10', name: 'Yemek Kartı / Multinet Yüklemeleri', category: 'OPERASYON', defaultDueDay: 10, isActive: true, order: 10 },
  { id: 'exp-11', name: 'Mali Müşavir & Denetim Hizmeti', category: 'OPERASYON', defaultDueDay: 22, isActive: true, order: 11 },
  { id: 'exp-12', name: 'KDV-1 Beyanname Ödemesi', category: 'VERGI', defaultDueDay: 28, isActive: true, order: 12 },
];

export const AVAILABLE_YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];

function generateSeedEntries(): Record<string, MonthlyEntry> {
  const entries: Record<string, MonthlyEntry> = {};
  const years = AVAILABLE_YEARS;

  // Base amounts per item
  const baseAmounts: Record<string, number> = {
    'exp-1': 35000,
    'exp-2': 4200,
    'exp-3': 2800,
    'exp-4': 950,
    'exp-5': 1850,
    'exp-6': 180000,
    'exp-7': 54000,
    'exp-8': 2400,
    'exp-9': 3600,
    'exp-10': 16500,
    'exp-11': 8000,
    'exp-12': 21000,
  };

  const yearMultipliers: Record<number, number> = {
    2022: 0.55,
    2023: 0.68,
    2024: 0.78,
    2025: 0.88,
    2026: 1.0,
    2027: 1.15,
    2028: 1.28,
  };

  for (const year of years) {
    const yearMultiplier = yearMultipliers[year] ?? 1.0;

    for (let m = 1; m <= 12; m++) {
      for (const item of INITIAL_ITEMS) {
        const id = `${item.id}-${year}-${m}`;
        const base = baseAmounts[item.id] || 2500;
        
        // Slight monthly variation (seasonality for gas/electricity)
        let seasonal = 1.0;
        if (item.id === 'exp-3') {
          // Gas higher in winter
          seasonal = (m <= 3 || m >= 11) ? 1.8 : 0.4;
        } else if (item.id === 'exp-2') {
          // Electricity higher in summer AC and winter
          seasonal = (m >= 6 && m <= 8) ? 1.4 : 1.0;
        }

        const amount = Math.round(base * yearMultiplier * seasonal);

        // Determine paid status based on current time (October 2026)
        let isPaid = false;
        let paidAt: string | undefined = undefined;

        if (year < 2026 || (year === 2026 && m < 10)) {
          // Past months are paid
          isPaid = true;
          paidAt = `${year}-${String(m).padStart(2, '0')}-${String(item.defaultDueDay).padStart(2, '0')}`;
        } else if (year === 2026 && m === 10) {
          // Current month: October 2026
          if (item.defaultDueDay <= 12) {
            isPaid = true;
            paidAt = `2026-10-${String(item.defaultDueDay).padStart(2, '0')}`;
          } else {
            isPaid = false;
          }
        } else {
          // Future months
          isPaid = false;
        }

        entries[id] = {
          id,
          expenseItemId: item.id,
          year,
          month: m,
          amount,
          isPaid,
          paidAt,
        };
      }
    }
  }

  return entries;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed loading users from storage', e);
    }
    return INITIAL_USERS;
  });

  // Current active user
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        const match = INITIAL_USERS.find(u => u.id === parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.warn('Failed loading active user', e);
    }
    return INITIAL_USERS[0]; // Admin by default
  });

  // Load items
  const [items, setItems] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed loading items', e);
    }
    return INITIAL_ITEMS;
  });

  // Load categories (Dynamic with add/edit/delete capability)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed loading categories', e);
    }
    return INITIAL_CATEGORIES;
  });

  // Load entries (merges seed with storage so newly added years like 2022, 2023, 2028 are automatically included)
  const [entries, setEntries] = useState<Record<string, MonthlyEntry>>(() => {
    const seed = generateSeedEntries();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...seed, ...parsed };
      }
    } catch (e) {
      console.warn('Failed loading entries', e);
    }
    return seed;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [focusedMonth, setFocusedMonth] = useState<number>(10); // October 2026
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<{ itemId: string; month: number; year: number } | null>(null);

  // Theme state: defaults to 'light' per user request, switchable to 'dark'
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      console.warn('Failed loading theme', e);
    }
    return 'light'; // Default: Açık tema
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('Failed saving theme', e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving items', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('Error saving categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.warn('Error saving entries', e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('Error saving users', e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Error saving active user', e);
    }
  }, [currentUser]);

  // Zero-friction update entry amount
  const updateEntryAmount = useCallback((itemId: string, year: number, month: number, amount: number) => {
    const id = `${itemId}-${year}-${month}`;
    setEntries(prev => {
      const current = prev[id];
      return {
        ...prev,
        [id]: {
          id,
          expenseItemId: itemId,
          year,
          month,
          amount: Math.max(0, isNaN(amount) ? 0 : amount),
          isPaid: current ? current.isPaid : false,
          paidAt: current?.paidAt,
        }
      };
    });
  }, []);

  // Zero-friction toggle entry paid
  const toggleEntryPaid = useCallback((itemId: string, year: number, month: number) => {
    const id = `${itemId}-${year}-${month}`;
    setEntries(prev => {
      const current = prev[id];
      const newPaid = current ? !current.isPaid : true;
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        [id]: {
          id,
          expenseItemId: itemId,
          year,
          month,
          amount: current ? current.amount : 0,
          isPaid: newPaid,
          paidAt: newPaid ? todayStr : undefined,
        }
      };
    });
  }, []);

  // Add new expense item
  const addExpenseItem = useCallback((name: string, category: ExpenseCategory, defaultDueDay: number, initialAmount: number = 0) => {
    const newId = `exp-${Date.now()}`;
    const newItem: ExpenseItem = {
      id: newId,
      name,
      category,
      defaultDueDay: Math.min(31, Math.max(1, defaultDueDay)),
      isActive: true,
      order: items.length + 1,
    };

    setItems(prev => [...prev, newItem]);

    if (initialAmount > 0) {
      setEntries(prev => {
        const nextEntries = { ...prev };
        for (let m = 1; m <= 12; m++) {
          const entryId = `${newId}-${selectedYear}-${m}`;
          nextEntries[entryId] = {
            id: entryId,
            expenseItemId: newId,
            year: selectedYear,
            month: m,
            amount: initialAmount,
            isPaid: false,
          };
        }
        return nextEntries;
      });
    }
  }, [items.length, selectedYear]);

  // Update existing expense item
  const updateExpenseItem = useCallback((id: string, updates: Partial<ExpenseItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  // Delete expense item
  const deleteExpenseItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Reorder items
  const reorderExpenseItems = useCallback((newItems: ExpenseItem[]) => {
    setItems(newItems);
  }, []);

  // Category management (Add, Update, Delete with item reassignment)
  const addCategory = useCallback((name: string, color?: string): Category => {
    const trimmed = name.trim();
    const id = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 16) || `CAT_${Date.now()}`;
    const defaultColors = ['#6366f1', '#ec4899', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e', '#3b82f6'];
    const chosenColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    let uniqueId = id;
    let counter = 1;
    while (categories.some(c => c.id === uniqueId)) {
      uniqueId = `${id}_${counter++}`;
    }

    const newCat: Category = {
      id: uniqueId,
      name: trimmed,
      color: chosenColor,
    };

    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, [categories]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const fallbackCategory = categories.find(c => c.id !== id)?.id || 'DIGER';
    let reassignedCount = 0;

    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.category === id) {
          reassignedCount++;
          return { ...item, category: fallbackCategory };
        }
        return item;
      });
    });

    setCategories(prev => prev.filter(c => c.id !== id));
    setSelectedCategory(current => (current === id ? null : current));

    return { reassignedCount };
  }, [categories]);

  // Admin user approvals
  const approveUser = useCallback((userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'APPROVED' } : u));
    setCurrentUser(curr => curr.id === userId ? { ...curr, status: 'APPROVED' } : curr);
  }, []);

  const blockUser = useCallback((userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'BLOCKED' } : u));
    setCurrentUser(curr => curr.id === userId ? { ...curr, status: 'BLOCKED' } : curr);
  }, []);

  const changeUserRole = useCallback((userId: string, role: 'ADMIN' | 'MEMBER') => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    setCurrentUser(curr => curr.id === userId ? { ...curr, role } : curr);
  }, []);

  const switchUser = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const addNewMockUser = useCallback((email: string, name: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'MEMBER',
      status: 'PENDING', // New users always pending admin approval
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    setItems(INITIAL_ITEMS);
    setCategories(INITIAL_CATEGORIES);
    setEntries(generateSeedEntries());
    setAllUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
  }, []);

  const value = useMemo(() => ({
    currentUser,
    allUsers,
    items,
    categories,
    entries,
    viewMode,
    selectedYear,
    focusedMonth,
    searchQuery,
    selectedCategory,
    activeCell,
    theme,
    availableYears: AVAILABLE_YEARS,
    setTheme,
    toggleTheme,
    setViewMode,
    setSelectedYear,
    setFocusedMonth,
    setSearchQuery,
    setSelectedCategory,
    setActiveCell,
    addCategory,
    updateCategory,
    deleteCategory,
    updateEntryAmount,
    toggleEntryPaid,
    addExpenseItem,
    updateExpenseItem,
    deleteExpenseItem,
    reorderExpenseItems,
    approveUser,
    blockUser,
    changeUserRole,
    switchUser,
    addNewMockUser,
    resetAllData,
  }), [
    currentUser,
    allUsers,
    items,
    categories,
    entries,
    viewMode,
    selectedYear,
    focusedMonth,
    searchQuery,
    selectedCategory,
    activeCell,
    theme,
    setTheme,
    toggleTheme,
    addCategory,
    updateCategory,
    deleteCategory,
    updateEntryAmount,
    toggleEntryPaid,
    addExpenseItem,
    updateExpenseItem,
    deleteExpenseItem,
    reorderExpenseItems,
    approveUser,
    blockUser,
    changeUserRole,
    switchUser,
    addNewMockUser,
    resetAllData,
  ]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
