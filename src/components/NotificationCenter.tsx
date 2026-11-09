import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Cake,
  Zap,
  X,
  Smartphone,
  AlertTriangle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  AppNotificationItem,
  computeExpenseNotifications,
  computeBirthdayNotifications,
  getNotificationPermissionState,
  requestPhoneNotificationPermission,
  registerNotificationServiceWorker,
  triggerDailyPhoneNotifications,
  sendNativePhoneNotification,
  markExpensePaidFromNotification,
  acknowledgeBirthdayFromNotification
} from '../services/notificationService.ts';
import { sanitize2026Data } from './LoremHomeView.tsx';
import { useFinance } from '../context/FinanceContext.tsx';
import { getExpenseStorageKey, getBirthdayStorageKey, getApiDataUrl } from '../utils/userStorage.ts';

interface NotificationCenterProps {
  onNavigate?: (module: 'expenses' | 'birthdays' | 'shopping') => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { currentUser } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionState()
  );
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const refreshNotifications = useCallback(() => {
    let expenseState = null;
    let birthdayList = null;

    const expenseKey = getExpenseStorageKey(currentUser?.email);
    const birthdayKey = getBirthdayStorageKey(currentUser?.email);

    try {
      const rawExp = localStorage.getItem(expenseKey);
      if (rawExp) expenseState = JSON.parse(rawExp);
    } catch {}

    try {
      const rawBd = localStorage.getItem(birthdayKey);
      if (rawBd) birthdayList = JSON.parse(rawBd);
    } catch {}

    const expItems = computeExpenseNotifications(expenseState);
    const bdItems = computeBirthdayNotifications(birthdayList);
    const combined = [...expItems, ...bdItems];
    setNotifications(combined);

    if (combined.length > 0) {
      triggerDailyPhoneNotifications(combined);
    }
  }, [currentUser?.email]);

  // Initial load & cloud hydration so notifications work immediately on any screen
  useEffect(() => {
    registerNotificationServiceWorker();
    refreshNotifications();

    const expenseKey = getExpenseStorageKey(currentUser?.email);
    const birthdayKey = getBirthdayStorageKey(currentUser?.email);
    const expenseApiUrl = getApiDataUrl(null, currentUser?.email);
    const birthdayApiUrl = getApiDataUrl('birthdays', currentUser?.email);

    // Ensure both Expenses and Birthdays are synced from D1 for accurate background notifications
    fetch(expenseApiUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          const sanitized = sanitize2026Data(data);
          try {
            localStorage.setItem(expenseKey, JSON.stringify(sanitized));
          } catch {}
          refreshNotifications();
        }
      })
      .catch(() => {});

    fetch(birthdayApiUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          try {
            localStorage.setItem(birthdayKey, JSON.stringify(data));
          } catch {}
          refreshNotifications();
        }
      })
      .catch(() => {});

    const handleDataUpdated = () => refreshNotifications();
    window.addEventListener('besthome-data-updated', handleDataUpdated);

    const interval = setInterval(refreshNotifications, 60000);
    return () => {
      window.removeEventListener('besthome-data-updated', handleDataUpdated);
      clearInterval(interval);
    };
  }, [refreshNotifications, currentUser?.email]);

  const handleEnablePhoneNotifications = async () => {
    const res = await requestPhoneNotificationPermission();
    setPermState(res);
    if (res === 'granted') {
      showFeedback('📲 Telefon bildirimleri başarıyla açıldı!');
      await sendNativePhoneNotification(
        '🔔 Best Home Bildirimleri Aktif!',
        'Ödeme ve doğum günü hatırlatmaları artık telefonunuza bildirim olarak gelecek.',
        'besthome_welcome_test'
      );
      refreshNotifications();
    } else if (res === 'denied') {
      showFeedback('⚠️ Tarayıcı bildirim izni reddedildi. Adres çubuğundan izni açabilirsiniz.');
    }
  };

  const handleSendTestNotification = async () => {
    if (permState !== 'granted') {
      await handleEnablePhoneNotifications();
      return;
    }
    const ok = await sendNativePhoneNotification(
      '⚡ Best Home Test Bildirimi',
      'Elektrik faturasına 3 gün kaldı! & Doğum günü hatırlatma sistemi aktif.',
      'besthome_manual_test_' + Date.now()
    );
    if (ok) {
      showFeedback('✅ Test bildirimi telefonunuza gönderildi!');
    } else {
      showFeedback('⚠️ Bildirim gönderilemedi, lütfen izinleri kontrol edin.');
    }
  };

  const handleMarkPaid = async (n: AppNotificationItem) => {
    if (!n.expenseItemId || n.expenseYear === undefined || n.expenseMonth === undefined) return;
    const ok = await markExpensePaidFromNotification(
      n.expenseItemId,
      n.expenseYear,
      n.expenseMonth,
      currentUser?.email
    );
    if (ok) {
      showFeedback('✅ Ödendi olarak işaretlendi, bildirim durduruldu!');
      refreshNotifications();
    }
  };

  const handleAcknowledgeBirthday = async (n: AppNotificationItem) => {
    if (!n.birthdayPersonId || !n.birthdayTargetYear) return;
    const ok = await acknowledgeBirthdayFromNotification(
      n.birthdayPersonId,
      n.birthdayTargetYear,
      currentUser?.email
    );
    if (ok) {
      showFeedback('👍 "Tamam, Haberim Var" işaretlendi, bildirim durduruldu!');
      refreshNotifications();
    }
  };

  const urgentCount = notifications.filter((n) => n.severity === 'urgent').length;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Ödeme ve Doğum Günü Bildirimleri"
        className={`relative p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
          notifications.length > 0
            ? urgentCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80 hover:bg-rose-100'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
        }`}
      >
        {notifications.length > 0 ? (
          <BellRing className={`w-4 h-4 ${urgentCount > 0 ? 'animate-bounce text-rose-600 dark:text-rose-400' : 'text-amber-500'}`} />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span className="hidden md:inline">Bildirimler</span>
        {notifications.length > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold text-white ${
              urgentCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
            }`}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {/* Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Bildirim Merkezi</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {notifications.length} Aktif Uyarı
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ödemeler (±3 gün) ve Doğum Günleri (son 3 gün)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Phone Notification Permission Bar */}
            <div className="px-5 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {permState === 'granted'
                    ? 'Telefon Bildirimleri: Açık ✅'
                    : permState === 'denied'
                    ? 'Telefon Bildirim İzni Kapalı ⚠️'
                    : 'Telefona Bildirim Gelmesi İçin İzni Açın:'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {permState !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleEnablePhoneNotifications}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    📲 Bildirimleri Aç
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    🔔 Test Bildirimi Gönder
                  </button>
                )}
              </div>
            </div>

            {/* Status Feedback Toast inside modal */}
            {statusFeedback && (
              <div className="mx-5 mt-3 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{statusFeedback}</span>
              </div>
            )}

            {/* Notifications List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Harika! Bekleyen Bildirim Yok
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Yaklaşan (3 gün kala) veya geciken ödenmemiş faturanız ya da kutlanmamış doğum günü bildiriminiz bulunmuyor.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isExpense = item.type === 'expense';
                  const isUrgent = item.severity === 'urgent';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                        isUrgent
                          ? 'bg-rose-500/[0.06] border-rose-500/40 dark:bg-rose-500/[0.08]'
                          : item.type === 'birthday'
                          ? 'bg-pink-500/[0.05] border-pink-500/30 dark:bg-pink-500/[0.07]'
                          : 'bg-amber-500/[0.06] border-amber-500/30 dark:bg-amber-500/[0.08]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isExpense
                                ? isUrgent
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'bg-pink-600 text-white'
                            }`}
                          >
                            {isExpense ? (
                              isUrgent ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )
                            ) : (
                              <Cake className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/70">
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate(isExpense ? 'expenses' : 'birthdays');
                            }}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {isExpense ? 'Gider Tablosuna Git →' : 'Doğum Günlerine Git →'}
                          </button>
                        )}

                        {isExpense ? (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(item)}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Ödendi İşaretle (Bildirimi Durdur)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeBirthday(item)}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>🎉 Kutlandı (Tamam)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Info */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                💡 Faturalar <strong>Ödendi</strong> yapılana, doğum günleri <strong>Kutlandı (Tamam)</strong> denilene kadar telefona bildirim verir.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
