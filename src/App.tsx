/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext.tsx';
import { LoginView } from './components/LoginView.tsx';
import { LoremHomeView } from './components/LoremHomeView.tsx';
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

  const handleLogout = () => {
    try {
      localStorage.removeItem('argon_auth_session');
    } catch (e) {
      console.warn('Failed clearing session', e);
    }
    setIsAuthenticated(false);
  };

  // If user is not authenticated, display login screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Primary Site: Lorem Home (Sade, 12 Kalem, Aylık Hızlı Giriş, Yıllık Matris ve Grafik)
  return (
    <LoremHomeView
      onLogout={handleLogout}
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
