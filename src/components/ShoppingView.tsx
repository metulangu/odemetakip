import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Home,
  Cake,
  Cloud,
  CheckCheck,
  X,
  Share2,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CopyX,
  Loader2,
  Key
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { ShoppingCategory, ShoppingItem, ShoppingList } from '../types/shopping.ts';
import { parseSpeechOrTextInput, createShoppingItem, removeRepeatedPhrases } from '../utils/shoppingParser.ts';
import { parseShoppingItemsWithGemini, hasGeminiApiKey } from '../services/geminiShopping.ts';
import { GeminiApiKeyModal } from './GeminiApiKeyModal.tsx';

interface ShoppingViewProps {
  onNavigate: (module: 'hub' | 'expenses' | 'birthdays') => void;
  onLogout: () => void;
}

const STORAGE_KEY = 'argon_shopping_lists_v1';

// Category metadata: colors, icons, badge styles
const CATEGORY_META: Record<ShoppingCategory, { color: string; badgeBg: string; border: string; icon: string }> = {
  'Meyve & Sebze': {
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    icon: '🍏'
  },
  'Süt & Kahvaltılık': {
    color: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    icon: '🧀'
  },
  'Temel Gıda & Bakliyat': {
    color: 'text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/60',
    icon: '🌾'
  },
  'Et, Tavuk & Balık': {
    color: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    icon: '🥩'
  },
  'Fırın & Unlu Mamul': {
    color: 'text-yellow-700 dark:text-yellow-400',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800/60',
    icon: '🥖'
  },
  'İçecekler': {
    color: 'text-sky-700 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/60',
    icon: '☕'
  },
  'Atıştırmalık & Tatlı': {
    color: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
    icon: '🍫'
  },
  'Temizlik & Ev': {
    color: 'text-cyan-700 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    icon: '🧼'
  },
  'Kişisel Bakım': {
    color: 'text-pink-700 dark:text-pink-400',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800/60',
    icon: '🧴'
  },
  'Diğer': {
    color: 'text-slate-700 dark:text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: '📦'
  }
};

const CATEGORIES_LIST: ShoppingCategory[] = [
  'Meyve & Sebze',
  'Süt & Kahvaltılık',
  'Temel Gıda & Bakliyat',
  'Et, Tavuk & Balık',
  'Fırın & Unlu Mamul',
  'İçecekler',
  'Atıştırmalık & Tatlı',
  'Temizlik & Ev',
  'Kişisel Bakım',
  'Diğer'
];

export const ShoppingView: React.FC<ShoppingViewProps> = ({ onNavigate, onLogout }) => {
  const { theme, toggleTheme } = useFinance();

  // State: Multiple Shopping Lists
  const [lists, setLists] = useState<ShoppingList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return '';
  });

  // UI States
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showArchived, setShowArchived] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gemini AI States
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [hasAiKey, setHasAiKey] = useState<boolean>(() => hasGeminiApiKey());
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Synchronization and recognition refs
  const recognitionRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const listsRef = useRef<ShoppingList[]>(lists);
  const activeListIdRef = useRef<string>(activeListId);

  // Keep state refs updated to prevent stale closures
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    activeListIdRef.current = activeListId;
  }, [activeListId]);

  // Active Shopping List
  const activeList = useMemo(() => {
    return lists.find(l => l.id === activeListId) || lists[0] || null;
  }, [lists, activeListId]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load from Cloud D1 on initial mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/data?key=shopping')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Veri yok');
      })
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return;
        setLists(data);
        if (data.length > 0 && !activeListIdRef.current) {
          setActiveListId(data[0].id);
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
        setCloudStatus('synced');
      })
      .catch(() => {
        setCloudStatus('offline');
      });

    return () => { isMounted = false; };
  }, []);

  // Save to LocalStorage & Sync to D1
  const saveLists = (newLists: ShoppingList[]) => {
    setLists(newLists);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLists));
    } catch {}

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setCloudStatus('syncing');

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/data?key=shopping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLists)
        });
        if (res.ok) setCloudStatus('synced');
        else setCloudStatus('offline');
      } catch {
        setCloudStatus('offline');
      }
    }, 1200);
  };

  // Process text or speech into structured items with anti-duplication & Gemini AI
  const handleProcessInput = async (rawText: string) => {
    const textToProcess = rawText.trim();
    if (!textToProcess || isAiProcessing) return;

    setIsAiProcessing(true);
    let parsedItems: Array<{ name: string; quantity: string; category: ShoppingCategory }> = [];
    let usedAi = false;

    try {
      const result = await parseShoppingItemsWithGemini(textToProcess);
      parsedItems = result.items;
      usedAi = result.usedAi;
    } catch (e) {
      console.warn('AI parsing error, falling back to local parser:', e);
      parsedItems = parseSpeechOrTextInput(textToProcess);
      usedAi = false;
    } finally {
      setIsAiProcessing(false);
    }

    if (parsedItems.length === 0) {
      showToast('⚠️ Ürün anlaşılamadı. Lütfen tekrar deneyin.');
      return;
    }

    const currentLists = listsRef.current;
    const currentActiveId = activeListIdRef.current;
    let targetList = currentLists.find(l => l.id === currentActiveId) || currentLists[0];

    // If no list exists yet, automatically create one!
    if (!targetList) {
      const initialList: ShoppingList = {
        id: 'list_' + Date.now(),
        title: 'Alışveriş Listem',
        items: parsedItems.map(p => createShoppingItem(p.name, p.quantity, p.category)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [initialList, ...currentLists];
      saveLists(updated);
      setActiveListId(initialList.id);
      setTextInput('');
      setTranscript('');
      transcriptRef.current = '';
      const summary = initialList.items.map(i => `${i.name}${i.quantity !== '1 adet' ? ` (${i.quantity})` : ''}`).join(', ');
      const prefix = usedAi ? '✨ Gemini AI: ' : '✅ ';
      showToast(`${prefix}"${initialList.title}" oluşturuldu ve ${initialList.items.length} ürün eklendi: ${summary}`);
      return;
    }

    // Check existing uncompleted items in targetList to prevent any duplicate additions!
    const existingActiveMap = new Map<string, ShoppingItem>();
    for (const item of targetList.items) {
      if (!item.completed) {
        existingActiveMap.set(item.name.toLocaleLowerCase('tr-TR'), item);
      }
    }

    const itemsToAdd: ShoppingItem[] = [];
    let updatedExistingItems = [...targetList.items];
    let updatedCount = 0;

    for (const p of parsedItems) {
      const lower = p.name.toLocaleLowerCase('tr-TR');
      if (existingActiveMap.has(lower)) {
        // If it already exists in the active list, update its quantity if new quantity was specified!
        const existingItem = existingActiveMap.get(lower)!;
        if (p.quantity && p.quantity !== '1 adet' && existingItem.quantity !== p.quantity) {
          updatedExistingItems = updatedExistingItems.map(i =>
            i.id === existingItem.id ? { ...i, quantity: p.quantity } : i
          );
          updatedCount++;
        }
      } else {
        // Brand new item
        const newItem = createShoppingItem(p.name, p.quantity, p.category);
        itemsToAdd.push(newItem);
        existingActiveMap.set(lower, newItem);
      }
    }

    if (itemsToAdd.length === 0 && updatedCount === 0) {
      showToast('ℹ️ Söylenen ürünler zaten listenizde mevcut.');
      setTextInput('');
      setTranscript('');
      transcriptRef.current = '';
      return;
    }

    // Add new items to targetList
    const updatedLists = currentLists.map(l => {
      if (l.id === targetList.id) {
        return {
          ...l,
          items: [...itemsToAdd, ...updatedExistingItems],
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    saveLists(updatedLists);
    setTextInput('');
    setTranscript('');
    transcriptRef.current = '';

    const summary = (itemsToAdd.length > 0 ? itemsToAdd : parsedItems)
      .map(i => `${i.name}${i.quantity !== '1 adet' ? ` (${i.quantity})` : ''}`)
      .join(', ');
    const prefix = usedAi ? '✨ Gemini AI: ' : '✅ ';
    showToast(`${prefix}${itemsToAdd.length > 0 ? `${itemsToAdd.length} yeni ürün eklendi` : 'Miktarlar güncellendi'}: ${summary}`);
  };

  // Clean duplicate items in the active list (e.g. from previous voice glitches)
  const handleCleanDuplicates = () => {
    if (!activeList || activeList.items.length === 0) return;

    const seenActive = new Set<string>();
    const seenCompleted = new Set<string>();
    const cleanedItems: ShoppingItem[] = [];
    let removedCount = 0;

    for (const item of activeList.items) {
      const lowerName = item.name.toLocaleLowerCase('tr-TR').trim();
      if (item.completed) {
        if (!seenCompleted.has(lowerName)) {
          seenCompleted.add(lowerName);
          cleanedItems.push(item);
        } else {
          removedCount++;
        }
      } else {
        if (!seenActive.has(lowerName)) {
          seenActive.add(lowerName);
          cleanedItems.push(item);
        } else {
          removedCount++;
        }
      }
    }

    if (removedCount === 0) {
      showToast('ℹ️ Listede yinelenen ürün bulunmuyor.');
      return;
    }

    const updatedLists = lists.map(l => {
      if (l.id === activeList.id) {
        return {
          ...l,
          items: cleanedItems,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    saveLists(updatedLists);
    showToast(`🧹 ${removedCount} adet yinelenen ürün temizlendi!`);
  };

  // Clear all items in active list
  const handleClearAllItems = () => {
    if (!activeList || activeList.items.length === 0) return;
    if (!window.confirm(`"${activeList.title}" listesindeki tüm ürünleri silmek istediğinize emin misiniz?`)) return;

    const updatedLists = lists.map(l => {
      if (l.id === activeList.id) {
        return {
          ...l,
          items: [],
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    saveLists(updatedLists);
    showToast('🗑️ Liste tamamen boşaltıldı.');
  };

  // Setup Web Speech API (stable mobile setup)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = removeRepeatedPhrases(fullTranscript.trim());
        transcriptRef.current = fullTranscript;
        setTranscript(fullTranscript);
        setTextInput(fullTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError('Tarayıcı mikrofon izni verilmedi. Lütfen adres çubuğundaki kilit simgesinden mikrofon iznini açın.');
        } else if (event.error === 'no-speech') {
          // Silence timeout, ignore
        } else {
          setMicError(`Ses uyarısı: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Do NOT automatically submit on speech pauses (prevents multi-add glitches)
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition', e);
    }
  }, []);

  // Toggle Voice Recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınızda ses tanıma özelliği desteklenmiyor veya mikrofon izni verilmedi. Metin kutusunu kullanarak hızla ekleyebilirsiniz.');
      return;
    }

    setMicError(null);

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      const spoken = transcriptRef.current.trim() || textInput.trim();
      if (spoken) {
        handleProcessInput(spoken);
        transcriptRef.current = '';
        setTranscript('');
        setTextInput('');
      }
    } else {
      setTranscript('');
      setTextInput('');
      transcriptRef.current = '';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('Mic start error:', err);
        if (err.name !== 'InvalidStateError') {
          setMicError('Mikrofon başlatılamadı. Lütfen mikrofon iznini kontrol edin.');
        }
      }
    }
  };

  // Toggle Completed Status (Moves item to bottom)
  const handleToggleItem = (itemId: string) => {
    if (!activeList) return;

    const updatedLists = lists.map(list => {
      if (list.id === activeList.id) {
        const updatedItems = list.items.map(item => {
          if (item.id === itemId) {
            const isNowCompleted = !item.completed;
            return {
              ...item,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date().toISOString() : undefined
            };
          }
          return item;
        });

        return {
          ...list,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        };
      }
      return list;
    });

    saveLists(updatedLists);
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    if (!activeList) return;
    const updatedLists = lists.map(list => {
      if (list.id === activeList.id) {
        return {
          ...list,
          items: list.items.filter(i => i.id !== itemId),
          updatedAt: new Date().toISOString()
        };
      }
      return list;
    });
    saveLists(updatedLists);
  };

  // Create New Shopping List
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newListName.trim() || 'Yeni Alışveriş Listesi';
    const newList: ShoppingList = {
      id: 'list_' + Date.now(),
      title,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newList, ...lists];
    saveLists(updated);
    setActiveListId(newList.id);
    setNewListName('');
    setShowNewListModal(false);
    showToast(`✅ "${title}" listesi oluşturuldu!`);
  };

  // Delete Current List
  const handleDeleteCurrentList = () => {
    if (!activeList) return;
    if (!window.confirm(`"${activeList.title}" listesini tamamen silmek istediğinize emin misiniz?`)) return;

    const remaining = lists.filter(l => l.id !== activeList.id);
    saveLists(remaining);
    setActiveListId(remaining.length > 0 ? remaining[0].id : '');
    showToast('🗑️ Liste silindi.');
  };

  // Clear completed items
  const handleClearCompleted = () => {
    if (!activeList) return;
    const updatedLists = lists.map(l => {
      if (l.id === activeList.id) {
        return {
          ...l,
          items: l.items.filter(i => !i.completed),
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });
    saveLists(updatedLists);
  };

  // Restore all completed items
  const handleRestoreAllCompleted = () => {
    if (!activeList) return;
    const updatedLists = lists.map(l => {
      if (l.id === activeList.id) {
        return {
          ...l,
          items: l.items.map(i => ({ ...i, completed: false, completedAt: undefined })),
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });
    saveLists(updatedLists);
  };

  // Split Active List items into Pending (grouped by category) and Completed (at bottom)
  const { pendingByCategory, completedItems, totalCount, completedCount, isAllCompleted } = useMemo(() => {
    if (!activeList || activeList.items.length === 0) {
      return {
        pendingByCategory: {} as Record<ShoppingCategory, ShoppingItem[]>,
        completedItems: [] as ShoppingItem[],
        totalCount: 0,
        completedCount: 0,
        isAllCompleted: false
      };
    }

    const pending = activeList.items.filter(i => !i.completed);
    const completed = activeList.items.filter(i => i.completed);

    const grouped: Partial<Record<ShoppingCategory, ShoppingItem[]>> = {};
    for (const cat of CATEGORIES_LIST) {
      const itemsInCat = pending.filter(i => i.category === cat);
      if (itemsInCat.length > 0) {
        grouped[cat] = itemsInCat;
      }
    }

    return {
      pendingByCategory: grouped as Record<ShoppingCategory, ShoppingItem[]>,
      completedItems: completed,
      totalCount: activeList.items.length,
      completedCount: completed.length,
      isAllCompleted: activeList.items.length > 0 && pending.length === 0
    };
  }, [activeList]);

  // Share list via Web Share API or Clipboard
  const handleShareList = () => {
    if (!activeList) return;
    const textLines = [
      `🛒 ${activeList.title}:`,
      ...activeList.items.map(i => `${i.completed ? '✅' : '⬜'} ${i.quantity ? `[${i.quantity}] ` : ''}${i.name} (${i.category})`)
    ].join('\n');

    if (navigator.share) {
      navigator.share({
        title: activeList.title,
        text: textLines
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(textLines);
      showToast('📋 Alışveriş listesi panoya kopyalandı!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-purple-500/20 selection:text-purple-900">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-purple-400 dark:text-purple-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Hub Back */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('hub')}
              className="p-1.5 sm:p-2 -ml-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 group"
              title="Modül Seçimine Dön"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-semibold hidden md:inline">Modüller</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Alışveriş</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Sparkles className="w-3 h-3" /> Sesle Ekleme
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-[140px] sm:max-w-none">
                  Sürtünmesiz &amp; Akıllı Gruplama
                </p>
              </div>
            </div>
          </div>

          {/* Quick Module Switchers & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Switch to Expenses */}
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              title="Gider & Fatura Tablosuna Git"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Giderler</span>
            </button>

            {/* Switch to Birthdays */}
            <button
              type="button"
              onClick={() => onNavigate('birthdays')}
              title="Doğum Günü Takibine Git"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Cake className="w-4 h-4" />
              <span className="hidden sm:inline">Doğum Günü</span>
            </button>

            {/* Cloud Status Pill */}
            <div 
              title={cloudStatus === 'synced' ? 'Bulut Senkronize (D1)' : cloudStatus === 'syncing' ? 'Kaydediliyor...' : 'Çevrimdışı'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60"
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudStatus === 'synced' ? 'text-emerald-500' : cloudStatus === 'syncing' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-[11px] text-slate-600 dark:text-zinc-300">
                {cloudStatus === 'synced' ? 'D1 Bulut' : cloudStatus === 'syncing' ? 'Eşitleniyor' : 'Yerel'}
              </span>
            </div>

            {/* Gemini AI Status & Settings Pill */}
            <button
              type="button"
              onClick={() => setShowGeminiModal(true)}
              title={hasAiKey ? 'Gemini AI Aktif (Ayarları Aç / Değiştir)' : 'Gemini AI Bağla (Google AI Studio ile Ücretsiz)'}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                hasAiKey
                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25 ring-2 ring-purple-400/40'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${hasAiKey ? 'text-purple-600 dark:text-purple-400' : 'text-purple-100 animate-spin'}`} />
              <span>
                {hasAiKey ? 'Gemini AI' : 'Gemini Ekle'}
              </span>
              {hasAiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Tema Değiştir"
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              title="Çıkış Yap"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">

        {/* 1. Lists Selector Bar & Action Toolbar */}
        {lists.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
            
            {/* Lists Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
              {lists.map(list => {
                const isActive = list.id === activeList?.id;
                const uncompletedCount = list.items.filter(i => !i.completed).length;
                return (
                  <button
                    key={list.id}
                    onClick={() => setActiveListId(list.id)}
                    className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-purple-600/20'
                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{list.title}</span>
                    {uncompletedCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-purple-800/80 text-purple-100' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}>
                        {uncompletedCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Create New List Button */}
              <button
                onClick={() => {
                  setNewListName('');
                  setShowNewListModal(true);
                }}
                className="px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-dashed border-purple-300 dark:border-purple-800 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Liste</span>
              </button>
            </div>

            {/* List Action Buttons (Share, Clean Duplicates, Clear All, Delete) */}
            {activeList && (
              <div className="flex items-center gap-1.5">
                {/* Clean Duplicates Button */}
                <button
                  onClick={handleCleanDuplicates}
                  title="Yinelenen Ürünleri Temizle"
                  className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl border border-purple-200 dark:border-purple-800/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <CopyX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yinelenenleri Temizle</span>
                </button>

                {/* Clear All Items in list */}
                {activeList.items.length > 0 && (
                  <button
                    onClick={handleClearAllItems}
                    title="Bu Listenin İçini Tamamen Boşalt"
                    className="p-2 text-slate-500 hover:text-amber-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {/* Share List */}
                <button
                  onClick={handleShareList}
                  title="Listeyi Paylaş / Kopyala"
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Delete Entire List */}
                <button
                  onClick={handleDeleteCurrentList}
                  title="Bu Listeyi Sil"
                  className="p-2 text-rose-500 hover:text-rose-700 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Interactive Voice & Quick Input Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden">
          
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ürün Ekle (Sesle veya Yazarak)
              </h2>
            </div>
            
            {/* Direct Gemini Settings Button */}
            <button
              type="button"
              onClick={() => setShowGeminiModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                hasAiKey
                  ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-600/30 ring-2 ring-purple-400/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hasAiKey ? '✨ Gemini AI: Aktif' : '✨ Gemini AI Anahtarı Ekle'}</span>
            </button>
          </div>

          {/* Prominent Gemini AI Onboarding Banner if not yet connected */}
          {!hasAiKey && (
            <div className="mb-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Gemini AI Henüz Bağlanmadı
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate">
                    Google AI Studio ile günde 1.500 istek tamamen ücretsizdir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeminiModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
              >
                Ücretsiz Bağla
              </button>
            </div>
          )}

          {/* Voice Pulse Animation Banner if recording */}
          {isListening && (
            <div className="mb-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/20 to-purple-500/15 border-2 border-purple-500/40 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <span>Sizi dinliyor...</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 hidden sm:inline">(Konuşmanız bitince Bitir &amp; Ekle'ye basın)</span>
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate mt-0.5">
                    {transcript || 'Konuşmaya başlayın (Örn: "1 kg muz 2 kg kiraz 3 ekmek")...'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bitir &amp; Ekle</span>
              </button>
            </div>
          )}

          {/* Microphone Permission Warning if any */}
          {micError && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{micError}</span>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Kaydı Durdur ve Ekle' : 'Mikrofonla Sesli Söyle'}
              className={`p-3 sm:px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/30'
                  : 'bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/70 hover:scale-102'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 text-white animate-bounce" />
                  <span className="hidden sm:inline text-xs font-bold">Bitir &amp; Ekle</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline text-xs font-semibold">Sesle Söyle</span>
                </>
              )}
            </button>

            {/* Text Input with Enter submission */}
            <div className="relative flex-1">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleProcessInput(textInput);
                  }
                }}
                placeholder={isListening ? 'Konuşulanlar buraya yazılıyor...' : 'Örn: 1 kg muz 2 kg kiraz 3 ekmek...'}
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              />
              {textInput && (
                <button
                  type="button"
                  onClick={() => setTextInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={() => handleProcessInput(textInput)}
              disabled={!textInput.trim() || isAiProcessing}
              className="p-3 sm:px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 disabled:cursor-not-allowed"
            >
              {isAiProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">İşleniyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ekle</span>
                </>
              )}
            </button>
          </div>

          {/* AI Processing status banner */}
          {isAiProcessing && (
            <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-800 dark:text-purple-300 animate-pulse">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-purple-600 dark:text-purple-400" />
              <span className="font-medium">✨ Gemini AI metni çözümlüyor ve ürünleri kategorilerine yerleştiriyor...</span>
            </div>
          )}

          {/* Quick tips & Gemini AI link */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-purple-500" />
              <span>Mikrofona basıp söyleyin veya yazın (Örn: <em>"1 kg muz 2 kg kiraz 3 ekmek"</em>).</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGeminiModal(true)}
              className="font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{hasAiKey ? 'Gemini AI Aktif' : 'Gemini AI Bağla (Ücretsiz)'}</span>
            </button>
          </div>
        </div>

        {/* 3. Empty State or Active List Details */}
        {lists.length === 0 ? (
          /* FIRST TIME ONBOARDING CARD */
          <div className="rounded-3xl border-2 border-purple-500/30 bg-white dark:bg-zinc-900 p-6 sm:p-10 text-center max-w-lg mx-auto shadow-xl shadow-purple-500/5">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Alışverişe Başlayın
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6">
              İlk alışveriş listenizin adını girin veya aşağıdaki hazır şablonlardan birini seçin:
            </p>
            <form onSubmit={handleCreateList} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Liste Adı
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: Haftalık Market, Pazar Listesi..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-2">
                {['🛒 Haftalık Market', '🍏 Pazar Alışverişi', '🏠 Ev İhtiyaçları', '🍫 Atıştırmalıklar'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewListName(preset.replace(/^[^\s]+\s+/, ''))}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>Listeyi Oluştur ve Başla</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : !activeList || activeList.items.length === 0 ? (
          /* ACTIVE LIST IS EMPTY CARD */
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                "{activeList?.title || 'Liste'}" Henüz Boş
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Yukarıdaki mikrofona basıp <em>"1 kg muz 2 kg kiraz 3 ekmek"</em> diyerek söyleyin. Bitince Bitir &amp; Ekle'ye basarak tek seferde ekleyebilirsiniz.
              </p>
            </div>
            
            {/* Quick preset suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleProcessInput('1 kg muz, 2 ekmek, süt, çay, peynir, deterjan')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer"
              >
                + Temel Ev İhtiyaçları Örneği Ekle
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Completion Banner (when all items are completed) */}
            {isAllCompleted && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 text-center flex flex-col items-center justify-center gap-3 shadow-md animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                    🎉 Harika! Liste Tamamlandı!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    "{activeList.title}" listesindeki tüm ({totalCount}) ürün sepete eklendi.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleRestoreAllCompleted}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Listeyi Başa Al</span>
                  </button>
                  <button
                    onClick={handleClearCompleted}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Alınanları Temizle</span>
                  </button>
                </div>
              </div>
            )}

            {/* Progress Counter Bar */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <span>Alınan: <strong className="text-slate-900 dark:text-white">{completedCount}</strong> / {totalCount}</span>
                <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
                <span>Kalan: <strong className="text-purple-600 dark:text-purple-400">{totalCount - completedCount}</strong></span>
              </div>
              <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* 4. ACTIVE / PENDING ITEMS GROUPED BY CATEGORY */}
            <div className="space-y-5">
              {Object.entries(pendingByCategory).map(([categoryName, items]) => {
                const meta = CATEGORY_META[categoryName as ShoppingCategory] || CATEGORY_META['Diğer'];
                return (
                  <div 
                    key={categoryName}
                    className="rounded-3xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
                  >
                    {/* Category Header */}
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-zinc-800/50 border-b border-slate-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {categoryName}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeBg}`}>
                        {items.length} ürün
                      </span>
                    </div>

                    {/* Items List in Category */}
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="px-4 py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          {/* Checkbox & Item details */}
                          <div 
                            onClick={() => handleToggleItem(item.id)}
                            className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                          >
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-zinc-600 group-hover:border-purple-500 dark:group-hover:border-purple-400 flex items-center justify-center transition-all bg-white dark:bg-zinc-800">
                              <Check className="w-3.5 h-3.5 text-transparent group-hover:text-purple-400/50 transition-colors" />
                            </div>

                            <div className="flex-1">
                              <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {item.name}
                              </span>
                              {item.quantity && (
                                <span className="ml-2 inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/70 dark:border-zinc-700/60">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions (Delete) */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Sil"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. COMPLETED ITEMS (SEPETE EKLENENLER - EN ALTA GİDENLER) */}
            {completedItems.length > 0 && (
              <div className="mt-4 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/40 overflow-hidden">
                
                {/* Accordion Toggle Header */}
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
                      Alınanlar / Sepetteki Ürünler ({completedItems.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {showArchived ? 'Gizle' : 'Göster'}
                    </span>
                    {showArchived ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Completed Items List */}
                {showArchived && (
                  <div className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 border-t border-slate-200/60 dark:border-zinc-800/60">
                    {completedItems.map(item => (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-3 bg-slate-50/40 dark:bg-zinc-900/20 group hover:bg-slate-100/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Checked state with line-through */}
                        <div
                          onClick={() => handleToggleItem(item.id)}
                          className="flex items-center gap-3 flex-1 cursor-pointer select-none opacity-60 group-hover:opacity-90 transition-opacity"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3 h-3" />
                          </div>

                          <div className="flex-1">
                            <span className="text-xs sm:text-sm font-medium line-through text-slate-500 dark:text-zinc-400">
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="ml-2 inline-block px-1.5 py-0.2 rounded text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Uncheck / Delete action */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleItem(item.id)}
                            title="Geri Al (Listeye Döndür)"
                            className="p-1 text-slate-400 hover:text-purple-600 rounded"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="Tamamen Sil"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Bottom bulk clear actions */}
                    <div className="p-3 bg-white/40 dark:bg-zinc-900/40 flex items-center justify-end gap-3 text-xs">
                      <button
                        onClick={handleClearCompleted}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Alınanları Listeden Temizle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* MODAL: Yeni Liste Oluştur */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Yeni Alışveriş Listesi
                </h3>
              </div>
              <button
                onClick={() => setShowNewListModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Liste Adı
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: Haftalık Pazar, Süpermarket, Ev İhtiyaçları"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {['Haftalık Market', 'Pazar Alışverişi', 'Kişisel Bakım', 'Parti & İçecekler', 'Nalbur & Ev'].map(sugg => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setNewListName(sugg)}
                    className="px-2.5 py-1 rounded-xl text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-zinc-700/60 cursor-pointer"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Listeyi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini API Key Settings & Test Modal */}
      <GeminiApiKeyModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        onKeySaved={(k) => {
          setHasAiKey(!!k);
          showToast(k ? '✨ Gemini AI aktifleştirildi!' : 'ℹ️ Gemini AI kaldırıldı, yerel ayrıştırıcı aktif.');
        }}
      />

    </div>
  );
};
