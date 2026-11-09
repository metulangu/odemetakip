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
