import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import { 
  Database, 
  BarChart3, 
  Table as TableIcon, 
  ChevronDown, 
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  ArrowLeftRight
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'table' | 'analytics' | 'd1';
  onSelectTab: (tab: 'table' | 'analytics' | 'd1') => void;
  onLogout?: () => void;
  onSwitchWorkspace?: (workspace: 'lorem') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onLogout, onSwitchWorkspace }) => {
  const { currentUser, theme, setTheme } = useFinance();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-sm sm:text-base tracking-wider shrink-0">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              Argon Finance
            </span>
            <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 tracking-wide">
              Cloudflare D1 · Matris Gider Takip
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-950/60 p-0.5 sm:p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab('table')}
            title="Matris Tablo"
            aria-label="Matris Tablo"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Matris Tablo</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            title="Analiz & Grafikler"
            aria-label="Analiz & Grafikler"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Analiz & Grafikler</span>
          </button>

          <button
            onClick={() => onSelectTab('d1')}
            title="Cloudflare D1"
            aria-label="Cloudflare D1"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'd1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Cloudflare D1</span>
          </button>
        </nav>

        {/* Zone 3: Theme Switcher & Account Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Theme Switcher Segmented Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Açık Tema"
              aria-label="Açık Tema"
            >
              <Sun className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px]">Açık</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-indigo-200 shadow-xs border border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Koyu Tema"
              aria-label="Koyu Tema"
            >
              <Moon className={`w-3.5 h-3.5 shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px]">Koyu</span>
            </button>
          </div>

          {/* Switch to Lorem Home Workspace Button */}
          {onSwitchWorkspace && (
            <button
              type="button"
              onClick={() => onSwitchWorkspace('lorem')}
              title="Best Home"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Best Home</span>
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition-all shrink-0 cursor-pointer"
              aria-expanded={userDropdownOpen}
              title="Hesap Menüsü"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                A
              </div>
              <div className="hidden lg:flex flex-col max-w-[120px]">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  admin
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Yönetici
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Aktif Oturum</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    admin
                  </p>
                  <span className="mt-1 inline-block text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded font-semibold border border-indigo-200 dark:border-indigo-500/20">
                    Sistem Yöneticisi
                  </span>
                </div>

                {/* Appearance Theme Selector */}
                <div className="px-4 py-2.5">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Görünüm Teması:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Açık</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 ring-1 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Koyu</span>
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <div className="px-2 pt-2">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200/80 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
