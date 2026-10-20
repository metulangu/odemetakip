/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext.tsx';
import { Header } from './components/Header.tsx';
import { MatrixTable } from './components/MatrixTable.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { CloudflareD1View } from './components/CloudflareD1Modal.tsx';
import { PendingApprovalView, BlockedUserView } from './components/PendingApprovalView.tsx';
import { AdminUsersModal } from './components/AdminUsersModal.tsx';
import { NewExpenseItemModal } from './components/NewExpenseItemModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { canUserAccessFinancials } from './utils/finance.ts';
import { RotateCcw } from 'lucide-react';

function AppContent() {
  const { currentUser, resetAllData } = useFinance();
  const [currentTab, setCurrentTab] = useState<'table' | 'analytics' | 'd1'>('table');
  const [adminUsersModalOpen, setAdminUsersModalOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);

  const hasAccess = canUserAccessFinancials(currentUser);

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAdminUsers={() => setAdminUsersModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {!hasAccess ? (
          currentUser.status === 'BLOCKED' ? (
            <BlockedUserView />
          ) : (
            <PendingApprovalView />
          )
        ) : (
          <>
            {currentTab === 'table' && (
              <MatrixTable onOpenNewItemModal={() => setNewItemModalOpen(true)} />
            )}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'd1' && <CloudflareD1View />}
          </>
        )}
      </main>

      {/* Zero-Slop Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-4 px-4 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Argon Finance &copy; 2026</span>
            <span>·</span>
            <span>Cloudflare D1 & Workers SQLite Mimari</span>
          </div>

          <div className="flex items-center gap-3">
            {confirmReset ? (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900">
                <span className="font-medium">Demo verileri sıfırlansın mı?</span>
                <button
                  onClick={() => {
                    resetAllData();
                    setConfirmReset(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition-colors"
                >
                  Evet
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-0.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                title="Varsayılan demo verilerini geri yükle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Verileri Sıfırla</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminUsersModal
        isOpen={adminUsersModalOpen}
        onClose={() => setAdminUsersModalOpen(false)}
      />

      <NewExpenseItemModal
        isOpen={newItemModalOpen}
        onClose={() => setNewItemModalOpen(false)}
      />
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
