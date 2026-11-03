import React from 'react';
import { 
  Home, 
  Cake, 
  ShoppingCart,
  ArrowRight, 
  LogOut, 
  Sun, 
  Moon, 
  Calendar, 
  Table2, 
  Sparkles,
  Heart,
  CreditCard,
  Clock,
  Mic,
  CheckCircle2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';

interface HubViewProps {
  onSelectModule: (module: 'expenses' | 'birthdays' | 'shopping') => void;
  onLogout: () => void;
}

export const HubView: React.FC<HubViewProps> = ({ onSelectModule, onLogout }) => {
  const { theme, toggleTheme } = useFinance();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.svg" 
              alt="Best Home" 
              className="w-9 h-9 rounded-xl shadow-xs shrink-0 select-none" 
            />
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none text-slate-900 dark:text-white">
                Best Home
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Yönetim &amp; Takip Merkezi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title="Tema Değiştir"
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/70 transition-all cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Çıkış Yap"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hub Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-center">
        
        {/* Welcome Section */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-3 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Home Modül Seçimi</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Neyi yönetmek istersiniz?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Lütfen devam etmek istediğiniz sistemi seçin. Dilediğiniz zaman üst menüden sistemler arasında tek tıkla geçiş yapabilirsiniz.
          </p>
        </div>

        {/* 3 Big Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: BEST HOME (FATURA & GİDER MATRİSİ) */}
          <div 
            onClick={() => onSelectModule('expenses')}
            className="group relative rounded-3xl border-2 border-slate-200/90 hover:border-indigo-500 dark:border-zinc-800 dark:hover:border-indigo-500/80 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer overflow-hidden"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-indigo-500/15 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-start justify-between gap-2 mb-5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Gider &amp; Fatura Takibi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Kira, faturalar ve tüm ev harcamalarının vadeleri, ödeme durumu ve 12 aylık matrisi.
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Son Ödeme Günü (Vade) Sayaçları</span>
                </div>
                <div className="flex items-center gap-2">
                  <Table2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>12 Aylık Yıllık Matris Tablosu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Hızlı Ödendi / Kopyalama</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-3">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 group-hover:shadow-indigo-600/35 transition-all cursor-pointer"
              >
                <span>Giderleri Aç</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: DOĞUM GÜNÜ & ÖZEL GÜN TAKİP */}
          <div 
            onClick={() => onSelectModule('birthdays')}
            className="group relative rounded-3xl border-2 border-slate-200/90 hover:border-pink-500 dark:border-zinc-800 dark:hover:border-pink-500/80 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer overflow-hidden"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-pink-500/15 via-rose-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-start justify-between gap-2 mb-5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/25 group-hover:scale-105 transition-transform">
                  <Cake className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                  <Sparkles className="w-3 h-3 text-pink-500" />
                  Takvimli
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Doğum Günü Takibi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Aile ve arkadaşlarınızın doğum günleri; canlı gün sayacı, yaş hesaplama ve yıllık takvim.
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>Canlı Kalan Gün Sayacı</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>12 Aylık Görsel Yıllık Takvim</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span>Burç &amp; WhatsApp Kutlama</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-3">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-600/20 group-hover:shadow-pink-600/35 transition-all cursor-pointer"
              >
                <span>Doğum Günlerini Aç</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 3: ALIŞVERİŞ (MARKET & İHTİYAÇ LİSTESİ) */}
          <div 
            onClick={() => onSelectModule('shopping')}
            className="group relative rounded-3xl border-2 border-slate-200/90 hover:border-purple-500 dark:border-zinc-800 dark:hover:border-purple-500/80 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer overflow-hidden"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-purple-500/20 via-indigo-500/10 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-start justify-between gap-2 mb-5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/25 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  <Mic className="w-3 h-3 text-purple-500" />
                  Sesli Liste
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Alışveriş Listesi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Sesle veya yazarak hızlı liste; meyve, kahvaltılık, temizlik gibi otomatik reyon gruplaması.
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Sıfır Maliyetli Sesle Ekleme</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Akıllı Otomatik Reyon Gruplaması</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Alınanlar Otomatik En Alta &amp; Çizili</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-3">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 group-hover:shadow-purple-600/35 transition-all cursor-pointer"
              >
                <span>Alışverişe Başla</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-slate-400 dark:text-zinc-600 flex items-center justify-center gap-2">
          <span>Best Home</span>
          <span>&bull;</span>
          <span>Çok Yıllı Bulut Senkronizasyonu (Cloudflare D1)</span>
        </div>
      </main>

    </div>
  );
};
