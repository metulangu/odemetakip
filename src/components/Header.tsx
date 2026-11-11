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
  ArrowLeftRight,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
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

        {/* Zone 2: Navigation Links (Desktop Only: hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab('table')}
            title="Matris Tablo"
            aria-label="Matris Tablo"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Matris Tablo</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            title="Analiz & Grafikler"
            aria-label="Analiz & Grafikler"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Analiz & Grafikler</span>
          </button>

          <button
            onClick={() => onSelectTab('d1')}
            title="Cloudflare D1"
            aria-label="Cloudflare D1"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'd1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Cloudflare D1</span>
          </button>
        </nav>

        {/* Zone 3: Desktop Controls (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="text-[11px]">Açık</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-indigo-200 shadow-xs border border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-[11px]">Koyu</span>
            </button>
          </div>

          {/* Switch to Best Home */}
          {onSwitchWorkspace && (
            <button
              type="button"
              onClick={() => onSwitchWorkspace('lorem')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Best Home</span>
            </button>
          )}

          {/* User Profile */}
          <div className="relative shrink-0">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                A
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50">
                {onLogout && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button (md:hidden) */}
        <div className="flex md:hidden items-center gap-2">
          {onSwitchWorkspace && (
            <button
              type="button"
              onClick={() => onSwitchWorkspace('lorem')}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold"
            >
              Best Home
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menüyü Aç / Kapat"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md px-4 py-3 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
              Sayfalar
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectTab('table');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                currentTab === 'table' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                <span>Matris Tablo</span>
              </div>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('analytics');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                currentTab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analiz &amp; Grafikler</span>
              </div>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('d1');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                currentTab === 'd1' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Cloudflare D1 Veri Tabanı</span>
              </div>
              <span>→</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
