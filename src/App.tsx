/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext.tsx';
import { LoginView } from './components/LoginView.tsx';
import { LoremHomeView } from './components/LoremHomeView.tsx';
import { BirthdayView } from './components/BirthdayView.tsx';
import { ShoppingView } from './components/ShoppingView.tsx';
import { HubView } from './components/HubView.tsx';
import { PendingApprovalView, BlockedUserView } from './components/PendingApprovalView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import {
  requestPhoneNotificationPermission,
  sendNativePhoneNotification,
  autoPromptPhoneNotification,
  getNotificationPermissionState,
  registerNotificationServiceWorker
} from './services/notificationService.ts';

function AppContent() {
  const { currentUser } = useFinance();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('argon_auth_session');
      return !!session;
    } catch {
      return false;
    }
  });

  const [currentModule, setCurrentModule] = useState<'hub' | 'expenses' | 'birthdays' | 'shopping'>('hub');
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionState()
  );
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    registerNotificationServiceWorker();
    autoPromptPhoneNotification().then((perm) => {
      setPermState(perm);
    });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.module) {
        setCurrentModule(event.data.module);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const handleEnablePhoneNotifications = async () => {
    const res = await requestPhoneNotificationPermission();
    setPermState(res);
    if (res === 'granted') {
      await sendNativePhoneNotification(
        '🔔 Bildirimler Aktif!',
        'Faturalarınız (3, 2, 1 gün kala ve gecikince) ile doğum günleri telefonunuza bildirim olarak gelecek.',
        'besthome_welcome'
      );
      window.dispatchEvent(new Event('besthome-data-updated'));
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('argon_auth_session');
    } catch (e) {
      console.warn('Failed clearing session', e);
    }
    setIsAuthenticated(false);
    setCurrentModule('hub');
  };

  // If user is not authenticated, display login screen
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginView 
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentModule('hub');
        }} 
      />
    );
  }

  // Google ile giriş yapan yeni kullanıcılar admin (mturkey11@gmail.com) onayına kadar bekler
  if (currentUser.status === 'PENDING') {
    return <PendingApprovalView onLogout={handleLogout} />;
  }

  if (currentUser.status === 'BLOCKED') {
    return <BlockedUserView onLogout={handleLogout} />;
  }

  const renderModule = () => {
    // 1. Hub Screen: Choose between Best Home and Birthday Tracker
    if (currentModule === 'hub') {
      return (
        <HubView
          onSelectModule={(mod) => setCurrentModule(mod)}
          onLogout={handleLogout}
        />
      );
    }

    // 2. Birthday Tracking System
    if (currentModule === 'birthdays') {
      return (
        <BirthdayView
          onNavigate={(mod) => setCurrentModule(mod)}
          onLogout={handleLogout}
        />
      );
    }

    // 3. Shopping List Module
    if (currentModule === 'shopping') {
      return (
        <ShoppingView
          onNavigate={(mod) => setCurrentModule(mod)}
          onLogout={handleLogout}
        />
      );
    }

    // 4. Best Home Expenses & Bills
    return (
      <LoremHomeView
        onLogout={handleLogout}
        onSwitchModule={(mod) => setCurrentModule(mod)}
      />
    );
  };

  const showBanner = permState !== 'granted' && permState !== 'unsupported' && !bannerDismissed;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Duagu tarzı Bildirim Açma Üst Çubuğu */}
      {showBanner && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 text-xs font-semibold shadow-md shrink-0 z-40 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🔔</span>
            <span className="truncate">
              <strong>Telefon Bildirimleri:</strong> Fatura son ödeme günleri ve doğum günlerinde telefonunuza anında bildirim gelsin!
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEnablePhoneNotifications}
              className="px-2.5 sm:px-3 py-1 bg-white text-indigo-700 hover:bg-slate-100 rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              📲 Bildirimleri Aç
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-white/80 hover:text-white"
              title="Kapat"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {renderModule()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ErrorBoundary>
  );
}
