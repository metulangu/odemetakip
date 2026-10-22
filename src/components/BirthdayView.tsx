import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Cake, 
  Gift, 
  Calendar as CalendarIcon, 
  Heart, 
  PartyPopper, 
  Phone, 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  ArrowLeftRight, 
  LayoutGrid, 
  Cloud, 
  MessageCircle, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Filter
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';

export interface BirthdayPerson {
  id: string;
  fullName: string;
  birthDay: number; // 1-31
  birthMonth: number; // 1-12
  birthYear?: number | null; // e.g. 1995
  category: 'Aile' | 'Akraba' | 'Arkadaş' | 'İş' | 'Diğer';
  phone?: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = 'best_home_birthdays_v1';

const MONTHS_TR = [
  { index: 1, short: 'Oca', full: 'Ocak', days: 31 },
  { index: 2, short: 'Şub', full: 'Şubat', days: 29 },
  { index: 3, short: 'Mar', full: 'Mart', days: 31 },
  { index: 4, short: 'Nis', full: 'Nisan', days: 30 },
  { index: 5, short: 'May', full: 'Mayıs', days: 31 },
  { index: 6, short: 'Haz', full: 'Haziran', days: 30 },
  { index: 7, short: 'Tem', full: 'Temmuz', days: 31 },
  { index: 8, short: 'Ağu', full: 'Ağustos', days: 31 },
  { index: 9, short: 'Eyl', full: 'Eylül', days: 30 },
  { index: 10, short: 'Eki', full: 'Ekim', days: 31 },
  { index: 11, short: 'Kas', full: 'Kasım', days: 30 },
  { index: 12, short: 'Ara', full: 'Aralık', days: 31 }
];

const CATEGORIES = [
  { id: 'Aile', label: 'Aile', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25' },
  { id: 'Akraba', label: 'Akraba', badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25' },
  { id: 'Arkadaş', label: 'Arkadaş', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  { id: 'İş', label: 'İş', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25' },
  { id: 'Diğer', label: 'Diğer', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25' }
];

// Doğum gününe göre Burç hesaplama
function getZodiacSign(day: number, month: number): { name: string; symbol: string } {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'Koç', symbol: '♈' };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'Boğa', symbol: '♉' };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'İkizler', symbol: '♊' };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'Yengeç', symbol: '♋' };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'Aslan', symbol: '♌' };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'Başak', symbol: '♍' };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'Terazi', symbol: '♎' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'Akrep', symbol: '♏' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'Yay', symbol: '♐' };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: 'Oğlak', symbol: '♑' };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'Kova', symbol: '♒' };
  return { name: 'Balık', symbol: '♓' };
}

// Kalan gün ve yaş hesaplama
function calculateBirthdayDetails(person: BirthdayPerson, refDate = new Date()) {
  const currentYear = refDate.getFullYear();
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  
  // Bu yılki doğum günü
  let nextDate = new Date(currentYear, person.birthMonth - 1, person.birthDay);
  
  // Eğer bu yılki geçtiyse sonraki yıl
  if (nextDate.getTime() < today.getTime()) {
    nextDate = new Date(currentYear + 1, person.birthMonth - 1, person.birthDay);
  }

  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Yaş hesaplama
  let turningAge: number | null = null;
  let currentAge: number | null = null;
  if (person.birthYear && person.birthYear > 1900) {
    turningAge = nextDate.getFullYear() - person.birthYear;
    currentAge = diffDays === 0 ? turningAge : turningAge - 1;
  }

  const zodiac = getZodiacSign(person.birthDay, person.birthMonth);

  return {
    diffDays,
    nextDate,
    turningAge,
    currentAge,
    zodiac,
    isToday: diffDays === 0,
    isThisWeek: diffDays > 0 && diffDays <= 7,
    isThisMonth: diffDays > 7 && diffDays <= 30
  };
}

const DEFAULT_DEMO_PEOPLE: BirthdayPerson[] = [
  { id: 'bd-1', fullName: 'Meryem Yılmaz', birthDay: 18, birthMonth: 3, birthYear: 1993, category: 'Aile', phone: '05551234567', notes: 'Özel pasta ve hediye', createdAt: '2026-01-01' },
  { id: 'bd-2', fullName: 'Azra Yılmaz', birthDay: 12, birthMonth: 7, birthYear: 2018, category: 'Aile', phone: '', notes: 'Oyuncak ve kutlama', createdAt: '2026-01-01' },
  { id: 'bd-3', fullName: 'Mehmet Demir', birthDay: 24, birthMonth: 10, birthYear: 1990, category: 'Aile', phone: '05559876543', notes: 'Akşam yemeği', createdAt: '2026-01-01' },
  { id: 'bd-4', fullName: 'Ahmet Kaya', birthDay: 5, birthMonth: 11, birthYear: 1988, category: 'Arkadaş', phone: '05441112233', notes: 'Grup kutlaması', createdAt: '2026-01-01' },
  { id: 'bd-5', fullName: 'Fatma Teyze', birthDay: 15, birthMonth: 12, birthYear: 1965, category: 'Akraba', phone: '05324445566', notes: 'Telefonla ara', createdAt: '2026-01-01' }
];

interface BirthdayViewProps {
  onNavigate: (module: 'hub' | 'expenses') => void;
  onLogout: () => void;
}

export const BirthdayView: React.FC<BirthdayViewProps> = ({ onNavigate, onLogout }) => {
  const { theme, toggleTheme } = useFinance();

  // State
  const [people, setPeople] = useState<BirthdayPerson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DEMO_PEOPLE;
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<number | null>(null);

  // Cloud sync status
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  const syncTimeoutRef = useRef<any>(null);

  // Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<BirthdayPerson | null>(null);
  const [formName, setFormName] = useState('');
  const [formDay, setFormDay] = useState<number>(new Date().getDate());
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'Aile' | 'Akraba' | 'Arkadaş' | 'İş' | 'Diğer'>('Aile');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cloud Sync
  useEffect(() => {
    let active = true;
    fetch('/api/data?key=birthdays')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Veri yok');
      })
      .then(data => {
        if (!active || !Array.isArray(data)) return;
        setPeople(data);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
        setCloudStatus('synced');
      })
      .catch(() => {
        setCloudStatus('offline');
      });

    return () => { active = false; };
  }, []);

  const savePeople = (newList: BirthdayPerson[]) => {
    setPeople(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setCloudStatus('syncing');

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/data?key=birthdays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newList)
        });
        if (res.ok) setCloudStatus('synced');
        else setCloudStatus('offline');
      } catch {
        setCloudStatus('offline');
      }
    }, 1200);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPerson(null);
    setFormName('');
    setFormDay(new Date().getDate());
    setFormMonth(new Date().getMonth() + 1);
    setFormYear('');
    setFormCategory('Aile');
    setFormPhone('');
    setFormNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: BirthdayPerson) => {
    setEditingPerson(p);
    setFormName(p.fullName);
    setFormDay(p.birthDay);
    setFormMonth(p.birthMonth);
    setFormYear(p.birthYear ? String(p.birthYear) : '');
    setFormCategory(p.category);
    setFormPhone(p.phone || '');
    setFormNotes(p.notes || '');
    setFormError(null);
    setModalOpen(true);
  };

  // Submit Modal
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Lütfen ad ve soyad giriniz.');
      return;
    }

    const yr = formYear.trim() ? parseInt(formYear.replace(/\D/g, '')) : null;

    if (editingPerson) {
      // Update
      const updated = people.map(it => it.id === editingPerson.id ? {
        ...it,
        fullName: formName.trim(),
        birthDay: Number(formDay),
        birthMonth: Number(formMonth),
        birthYear: yr,
        category: formCategory,
        phone: formPhone.trim(),
        notes: formNotes.trim()
      } : it);
      savePeople(updated);
      showToast(`${formName} bilgileri güncellendi.`);
    } else {
      // Add
      const newPerson: BirthdayPerson = {
        id: 'bd-' + Date.now(),
        fullName: formName.trim(),
        birthDay: Number(formDay),
        birthMonth: Number(formMonth),
        birthYear: yr,
        category: formCategory,
        phone: formPhone.trim(),
        notes: formNotes.trim(),
        createdAt: new Date().toISOString()
      };
      savePeople([...people, newPerson]);
      showToast(`${formName} listeye eklendi! 🎉`);
    }

    setModalOpen(false);
  };

  // Delete
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${name} kişisini silmek istediğinizden emin misiniz?`)) {
      const filtered = people.filter(p => p.id !== id);
      savePeople(filtered);
      showToast(`${name} silindi.`);
    }
  };

  // Computed data with countdown stats
  const processedPeople = useMemo(() => {
    const today = new Date();
    return people.map(p => {
      const stats = calculateBirthdayDetails(p, today);
      return {
        ...p,
        stats
      };
    });
  }, [people]);

  // Filtered & Sorted People
  const filteredPeople = useMemo(() => {
    return processedPeople
      .filter(p => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.fullName.toLowerCase().includes(q);
          const matchNotes = (p.notes || '').toLowerCase().includes(q);
          if (!matchName && !matchNotes) return false;
        }
        // Category
        if (selectedCategory !== 'Tümü' && p.category !== selectedCategory) {
          return false;
        }
        // Calendar Month Filter if selected
        if (selectedCalendarMonth !== null && p.birthMonth !== selectedCalendarMonth) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.stats.diffDays - b.stats.diffDays);
  }, [processedPeople, searchQuery, selectedCategory, selectedCalendarMonth]);

  // Statistics
  const todayBirthdays = processedPeople.filter(p => p.stats.isToday);
  const thisWeekBirthdays = processedPeople.filter(p => p.stats.diffDays > 0 && p.stats.diffDays <= 7);
  const thisMonthBirthdays = processedPeople.filter(p => p.birthMonth === (new Date().getMonth() + 1));
  const nextClosestPerson = filteredPeople[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-pink-500/30 selection:text-pink-900 dark:selection:text-pink-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0">
              <Cake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
                  Doğum Günü Takip
                </span>
                {/* Cloud Status */}
                <span 
                  title={cloudStatus === 'synced' ? 'Bulut ile eşitlendi' : cloudStatus === 'syncing' ? 'Kaydediliyor...' : 'Yerel hafıza'}
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'synced' ? 'bg-emerald-500' : cloudStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                  {cloudStatus === 'synced' ? 'Bulut Aktif' : cloudStatus === 'syncing' ? 'Eşitleniyor...' : 'Çevrimdışı'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Canlı Geri Sayım &bull; Yıllık Takvim &bull; Yaş &amp; Burç
              </p>
            </div>
          </div>

          {/* Right Header Navigation Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Return to Hub */}
            <button
              type="button"
              onClick={() => onNavigate('hub')}
              title="Ana Modül Kartlarına Dön"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Modüller</span>
            </button>

            {/* Quick Switch to Best Home Expenses */}
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              title="Best Home Gider & Fatura Takibine Geç"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gider Takibi</span>
            </button>

            {/* Add Person Primary Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-md shadow-pink-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kişi Ekle</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Tema Değiştir"
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-700" />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              title="Çıkış Yap"
              className="p-1.5 sm:p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7 space-y-6">
        
        {/* TODAY BANNER (If anyone has a birthday today!) */}
        {todayBirthdays.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white p-4 sm:p-6 shadow-xl shadow-pink-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <PartyPopper className="w-6 h-6 text-amber-300 animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-wider mb-1">
                    <span>🎉 BUGÜN DOĞUM GÜNÜ!</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black">
                    {todayBirthdays.map(p => p.fullName).join(', ')}
                  </h3>
                  <p className="text-xs sm:text-sm text-pink-100 mt-0.5">
                    {todayBirthdays.map(p => p.stats.turningAge ? `${p.fullName} bugün ${p.stats.turningAge} yaşına basıyor!` : p.fullName).join(' • ')} Mutlu yıllar! 🎂
                  </p>
                </div>
              </div>

              {/* Quick WhatsApp greeting for today's celebrants */}
              <div className="flex items-center gap-2 flex-wrap">
                {todayBirthdays.filter(p => p.phone).map(p => (
                  <a
                    key={p.id}
                    href={`https://wa.me/${p.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Doğum günün kutlu olsun ${p.fullName}! 🎉🎂 Sevdiklerinle birlikte nice mutlu ve sağlıklı yaşlara!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-pink-600 hover:bg-pink-50 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>{p.fullName.split(' ')[0]}'i Kutla</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY STATS & QUICK HIGHLIGHT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Kayıtlı Kişi</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono">{people.length}</span>
              <User className="w-4 h-4 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Bu Ay Kutlayanlar</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-pink-600 dark:text-pink-400">{thisMonthBirthdays.length}</span>
              <Cake className="w-4 h-4 text-pink-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Bu Hafta</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{thisWeekBirthdays.length}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Sıradaki Doğum Günü</span>
            <div className="flex items-center justify-between mt-1 truncate">
              {nextClosestPerson ? (
                <div className="truncate">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {nextClosestPerson.fullName}
                  </span>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold font-mono">
                    {nextClosestPerson.stats.isToday ? '🎉 Bugün!' : `${nextClosestPerson.stats.diffDays} gün kaldı`}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            </div>
          </div>

        </div>

        {/* CONTROLS: TABS, SEARCH, CATEGORIES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* View Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('upcoming'); setSelectedCalendarMonth(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Yaklaşanlar</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('calendar'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Yıllık Takvim</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('all'); setSelectedCalendarMonth(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Tüm Kişiler ({people.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İsim veya notlarda ara..."
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-pink-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtre:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('Tümü')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                selectedCategory === 'Tümü'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              Tümü ({people.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = people.filter(p => p.category === cat.id).length;
              const isSel = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                    isSel
                      ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}

            {/* Clear Month filter badge if any */}
            {selectedCalendarMonth !== null && (
              <button
                type="button"
                onClick={() => setSelectedCalendarMonth(null)}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-300 shrink-0 cursor-pointer"
              >
                <span>Filtre: {MONTHS_TR[selectedCalendarMonth - 1].full}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

        {/* 1. UPCOMING & ALL PERSON CARDS LIST */}
        {(activeTab === 'upcoming' || activeTab === 'all') && (
          <div className="space-y-3">
            
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500" />
                <span>
                  {activeTab === 'upcoming' ? 'Yaklaşan Doğum Günleri (Sıralı)' : 'Tüm Kişiler'}
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                {filteredPeople.length} kişi bulundu
              </span>
            </div>

            {filteredPeople.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Cake className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? 'Aramanıza uygun kişi bulunamadı.' : 'Henüz doğum günü eklenmemiş.'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Yeni bir aile ferdi, arkadaş veya akraba eklemek için yukarıdaki "Kişi Ekle" butonunu kullanabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>İlk Kişiyi Ekle</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredPeople.map(p => {
                  const mInfo = MONTHS_TR[p.birthMonth - 1];
                  const catMeta = CATEGORIES.find(c => c.id === p.category) || CATEGORIES[0];
                  const { diffDays, isToday, isThisWeek, isThisMonth, turningAge, currentAge, zodiac } = p.stats;

                  return (
                    <div
                      key={p.id}
                      className={`group rounded-2xl border transition-all p-4 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                        isToday
                          ? 'border-pink-500/80 bg-pink-500/[0.04] dark:bg-pink-500/[0.06]'
                          : isThisWeek
                          ? 'border-amber-400/80 bg-amber-500/[0.02]'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Top Row: Date Badge + Name + Category + Zodiac */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          
                          {/* Big Calendar Badge */}
                          <div className={`w-12 h-13 rounded-xl border flex flex-col items-center justify-center shrink-0 shadow-2xs ${
                            isToday
                              ? 'bg-pink-600 border-pink-700 text-white animate-pulse'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}>
                            <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isToday ? 'text-pink-100' : 'text-pink-600 dark:text-pink-400'}`}>
                              {mInfo.short}
                            </span>
                            <span className="text-base font-black font-mono leading-none mt-0.5">
                              {p.birthDay}
                            </span>
                          </div>

                          {/* Full Name & Details */}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{p.fullName}</span>
                              {isToday && <PartyPopper className="w-4 h-4 text-pink-500 shrink-0" />}
                            </h4>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                              {/* Turning Age */}
                              {turningAge !== null ? (
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {isToday ? `${turningAge} yaşına girdi! 🎂` : `${turningAge}. yaşına girecek`}
                                </span>
                              ) : (
                                <span>Doğum Günü</span>
                              )}

                              {/* Zodiac */}
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                <span>{zodiac.symbol}</span>
                                <span>{zodiac.name}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category Pill */}
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${catMeta.badgeClass}`}>
                          {catMeta.label}
                        </span>
                      </div>

                      {/* Middle Notes if any */}
                      {p.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-2.5 py-1.5 mt-3 border border-slate-100 dark:border-slate-800 italic">
                          "{p.notes}"
                        </p>
                      )}

                      {/* Bottom Row: Countdown Tag + Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        
                        {/* Countdown Badge */}
                        <div className="flex items-center gap-1.5">
                          {isToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-pink-600 text-white shadow-xs">
                              <PartyPopper className="w-3.5 h-3.5" />
                              <span>BUGÜN KUTLANIYOR!</span>
                            </span>
                          ) : isThisWeek ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{diffDays === 1 ? 'Yarın!' : `${diffDays} gün kaldı`}</span>
                            </span>
                          ) : isThisMonth ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{diffDays} gün kaldı</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                              <span>{diffDays} gün kaldı</span>
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: WhatsApp / Call / Edit / Delete */}
                        <div className="flex items-center gap-1 ml-auto">
                          {p.phone && (
                            <>
                              <a
                                href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Doğum günün kutlu olsun ${p.fullName}! 🎉🎂 Sevdiklerinle birlikte nice mutlu yaşlara!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp ile Doğum Günü Mesajı Gönder"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`tel:${p.phone.replace(/\D/g, '')}`}
                                title="Telefonla Ara"
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Düzenle"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.fullName)}
                            title="Sil"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* 2. ANNUAL 12-MONTH VISUAL CALENDAR GRID (PC & Mobile Responsive) */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-pink-500" />
                  <span>12 Aylık Yıllık Takvim</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her ayın doğum günlerini görsel takvimde inceleyin. Bir aya tıklayarak o ayki kişileri listeleyebilirsiniz.
                </p>
              </div>

              {selectedCalendarMonth !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedCalendarMonth(null)}
                  className="text-xs font-semibold text-pink-600 hover:underline"
                >
                  Tüm Ayları Göster
                </button>
              )}
            </div>

            {/* 12 Months Responsive Grid: 1 col on mobile, 2 col on tablet, 3 or 4 col on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {MONTHS_TR.map(m => {
                const monthCelebrants = people.filter(p => p.birthMonth === m.index).sort((a, b) => a.birthDay - b.birthDay);
                const isCurrentMonth = (new Date().getMonth() + 1) === m.index;
                const isSelected = selectedCalendarMonth === m.index;

                return (
                  <div
                    key={m.index}
                    onClick={() => setSelectedCalendarMonth(isSelected ? null : m.index)}
                    className={`rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-500/[0.04] dark:bg-pink-500/[0.08]'
                        : isCurrentMonth
                        ? 'border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Month Header */}
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCurrentMonth ? 'bg-pink-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {m.full}
                          </h4>
                          {isCurrentMonth && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                              Bu Ay
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {monthCelebrants.length} kişi
                        </span>
                      </div>

                      {/* People list in this month */}
                      {monthCelebrants.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400 italic">
                          Bu ayda kayıtlı doğum günü yok
                        </div>
                      ) : (
                        <div className="space-y-1.5 my-1">
                          {monthCelebrants.map(p => {
                            const isToday = (new Date().getDate() === p.birthDay) && isCurrentMonth;
                            return (
                              <div
                                key={p.id}
                                className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                                  isToday
                                    ? 'bg-pink-600 text-white font-bold shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-6 text-center font-mono font-extrabold text-xs shrink-0 ${isToday ? 'text-white' : 'text-pink-600 dark:text-pink-400'}`}>
                                    {p.birthDay}
                                  </span>
                                  <span className="truncate font-medium">{p.fullName}</span>
                                </div>
                                <span className="text-[10px] opacity-75 shrink-0">
                                  {p.birthYear ? `${new Date().getFullYear() - p.birthYear} yaş` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="mt-3 pt-2 text-[11px] text-slate-400 text-right">
                      {isSelected ? '✓ Seçildi' : 'Filtrelemek için tıkla'}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center">
                  <Cake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingPerson ? 'Kişiyi Düzenle' : 'Yeni Doğum Günü Ekle'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kişi bilgilerini ve doğum tarihini giriniz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: Ayşe Yılmaz"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs"
                />
              </div>

              {/* Date Selectors (Day, Month, Year) */}
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* Gün */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gün *
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Ay */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ay *
                  </label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs"
                  >
                    {MONTHS_TR.map(m => (
                      <option key={m.index} value={m.index}>{m.full}</option>
                    ))}
                  </select>
                </div>

                {/* Doğum Yılı (İsteğe bağlı) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Doğum Yılı
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Örn: 1995"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs font-mono"
                  />
                </div>

              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yakınlık / Kategori
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Aile', 'Akraba', 'Arkadaş', 'İş', 'Diğer'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        formCategory === cat
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon Numarası (WhatsApp için)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="Örn: 0555 123 45 67"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Özel Not / Hediye Fikri
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: Kitap seviyor, kutlama haftasonu yapılacak..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-pink-500 shadow-2xs resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-md shadow-pink-600/25 transition-all cursor-pointer"
                >
                  {editingPerson ? 'Kaydet' : 'Kişiyi Ekle'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
