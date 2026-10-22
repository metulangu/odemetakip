/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext.tsx';
import { LoginView } from './components/LoginView.tsx';
import { LoremHomeView } from './components/LoremHomeView.tsx';
import { BirthdayView } from './components/BirthdayView.tsx';
import { HubView } from './components/HubView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('argon_auth_session');
      return !!session;
    } catch {
      return false;
    }
  });

  const [currentModule, setCurrentModule] = useState<'hub' | 'expenses' | 'birthdays'>('hub');

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
  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentModule('hub');
        }} 
      />
    );
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

  // 3. Best Home Expenses & Bills
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
