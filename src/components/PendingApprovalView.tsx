import React from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import { Clock, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, allUsers, switchUser } = useFinance();
  const adminUser = allUsers.find(u => u.role === 'ADMIN');

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl relative overflow-hidden transition-colors">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-xs">
          <Clock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          Hesabınız Yönetici Onayı Bekliyor
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Google hesabınızla (<span className="text-slate-800 dark:text-slate-200 font-medium font-mono text-xs">{currentUser.email}</span>) başarıyla giriş yapıldı. Ancak şirket finansal verilerinin gizliliği gereği, sistem yöneticisi onay verene kadar panellere erişim kilitlidir.
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-left mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Kullanıcı Durumu</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Onay Bekleniyor
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Yetkili Yönetici</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium font-mono">{adminUser?.email || 'mturkey11@gmail.com'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Veri Güvenliği</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sıfır Sızıntı Korumalı</span>
          </div>
        </div>

        {/* Quick action for test/demo mode to switch to Admin account */}
        {adminUser && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Yönetici hesabına geçip bu kullanıcıyı hemen onaylayabilirsiniz:
            </p>
            <button
              onClick={() => switchUser(adminUser)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Yönetici Hesabına Geç ({adminUser.name.split(' ')[0]})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const BlockedUserView: React.FC = () => {
  const { currentUser, allUsers, switchUser } = useFinance();
  const adminUser = allUsers.find(u => u.role === 'ADMIN');

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-2xl p-8 text-center shadow-xl relative transition-colors">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          Hesap Erişimi Engellendi
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Google hesabınız (<span className="text-slate-800 dark:text-slate-200 font-mono text-xs">{currentUser.email}</span>) yönetici tarafından pasife alınmış veya engellenmiştir.
        </p>

        {adminUser && (
          <button
            onClick={() => switchUser(adminUser)}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition-all border border-slate-200 dark:border-slate-700"
          >
            Yönetici Hesabına Geri Dön
          </button>
        )}
      </div>
    </div>
  );
};
