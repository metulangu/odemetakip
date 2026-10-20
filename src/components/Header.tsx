import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import { 
  Users, 
  Database, 
  BarChart3, 
  Table as TableIcon, 
  ChevronDown, 
  UserCheck, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'table' | 'analytics' | 'd1';
  onSelectTab: (tab: 'table' | 'analytics' | 'd1') => void;
  onOpenAdminUsers: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenAdminUsers }) => {
  const { currentUser, allUsers, switchUser, addNewMockUser, theme, setTheme } = useFinance();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const pendingUsersCount = allUsers.filter(u => u.status === 'PENDING').length;
  const isAdmin = currentUser.role === 'ADMIN';

  const handleCreateMockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    addNewMockUser(newUserEmail.trim(), newUserName.trim() || newUserEmail.split('@')[0]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
    setUserDropdownOpen(false);
  };

  return (
    <>
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

          {/* Zone 2: Navigation Links (Clean Responsive Tabs) */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-950/60 p-0.5 sm:p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => onSelectTab('table')}
              title="Matris Tablo"
              aria-label="Matris Tablo"
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentTab === 'd1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Cloudflare D1</span>
            </button>
          </nav>

          {/* Zone 3: Actions, Theme Switcher & Account Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Theme Switcher Segmented Control (Açık Tema Varsayılan + Seçenek) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Açık Tema (Varsayılan)"
                aria-label="Açık Tema"
              >
                <Sun className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px]">Açık</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-indigo-200 shadow-xs border border-slate-600'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Koyu Tema (Gece Modu)"
                aria-label="Koyu Tema"
              >
                <Moon className={`w-3.5 h-3.5 shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px]">Koyu</span>
              </button>
            </div>

            {/* Admin Pending Approvals Badge */}
            {isAdmin && (
              <button
                onClick={onOpenAdminUsers}
                className={`flex items-center gap-1 px-1.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                  pendingUsersCount > 0
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Kullanıcı ve Onay Yönetimi"
                aria-label="Kullanıcı ve Onay Yönetimi"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Onaylar</span>
                {pendingUsersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Switcher */}
            <div className="relative shrink-0">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition-all shrink-0"
                aria-expanded={userDropdownOpen}
                title={currentUser.name}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 object-cover"
                />
                <div className="hidden lg:flex flex-col max-w-[120px]">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role === 'ADMIN' ? 'Yönetici' : 'Üye'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Giriş Yapılan Hesap</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.email}</p>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                        currentUser.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : currentUser.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                        {currentUser.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {currentUser.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {currentUser.status === 'BLOCKED' && <AlertCircle className="w-3 h-3" />}
                        {currentUser.status === 'APPROVED' ? 'Onaylı' : currentUser.status === 'PENDING' ? 'Onay Bekliyor' : 'Engelli'}
                      </span>

                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded font-semibold border border-indigo-200 dark:border-indigo-500/20">
                        {currentUser.role === 'ADMIN' ? 'Admin Yetkisi' : 'Standart Üye'}
                      </span>
                    </div>
                  </div>

                  {/* Switch to Other Profiles */}
                  <div className="py-2">
                    <p className="px-4 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Kullanıcı Değiştir (Test İçin):
                    </p>
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          user.id === currentUser.id 
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img src={user.avatar} className="w-5 h-5 rounded-full" alt="" />
                          <div className="truncate">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{user.email}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                          user.status === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                            : user.status === 'PENDING'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                            : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                        }`}>
                          {user.status === 'APPROVED' ? 'Onaylı' : user.status === 'PENDING' ? 'Bekliyor' : 'Engelli'}
                        </span>
                      </button>
                    ))}
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
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          theme === 'light'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Açık Tema</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          theme === 'dark'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 ring-1 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Koyu Tema</span>
                      </button>
                    </div>
                  </div>

                  {/* Add New Mock User */}
                  <div className="px-2 pt-2">
                    <button
                      onClick={() => {
                        setShowAddUserModal(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Yeni Google Hesabı Simüle Et</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* New Mock User Dialog */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Google Hesabı ile Giriş Simülasyonu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Yeni bir Google hesabı açtığınızda Admin Onay Kilidi mekanizmasının nasıl devreye girdiğini test edin.
            </p>
            <form onSubmit={handleCreateMockUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Melis Ertekin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Google E-Posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="melis@sirket.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Giriş Yap ve Onaya Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
