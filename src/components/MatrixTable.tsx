import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import { 
  formatCurrency, 
  getDaysUntilDue, 
  MONTH_NAMES_TR, 
  calculateMonthTotals, 
  calculateItemYearTotal 
} from '../utils/finance.ts';
import type { ExpenseCategory } from '../types/finance.ts';
import { CategoryManagerModal } from './CategoryManagerModal.tsx';
import { 
  Search, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Tag
} from 'lucide-react';

interface MatrixTableProps {
  onOpenNewItemModal: () => void;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ onOpenNewItemModal }) => {
  const {
    items,
    categories,
    entries,
    viewMode,
    selectedYear,
    focusedMonth,
    searchQuery,
    selectedCategory,
    setViewMode,
    setSelectedYear,
    setFocusedMonth,
    setSearchQuery,
    setSelectedCategory,
    updateEntryAmount,
    toggleEntryPaid,
    deleteExpenseItem,
  } = useFinance();

  // Active inline editing cell state
  const [editingCell, setEditingCell] = useState<{ itemId: string; year: number; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.isActive) return false;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // Compute active month columns based on ViewMode
  const columns = useMemo(() => {
    if (viewMode === 'monthly') {
      // Monthly Focus: shows focused month and adjacent 2 months
      const prevM = focusedMonth === 1 ? 12 : focusedMonth - 1;
      const prevY = focusedMonth === 1 ? selectedYear - 1 : selectedYear;
      const nextM = focusedMonth === 12 ? 1 : focusedMonth + 1;
      const nextY = focusedMonth === 12 ? selectedYear + 1 : selectedYear;
      return [
        { year: prevY, month: prevM, isFocused: false },
        { year: selectedYear, month: focusedMonth, isFocused: true },
        { year: nextY, month: nextM, isFocused: false },
      ];
    } else if (viewMode === 'yearly') {
      // 12 months of selectedYear
      return Array.from({ length: 12 }, (_, i) => ({
        year: selectedYear,
        month: i + 1,
        isFocused: selectedYear === 2026 && i + 1 === 10, // October 2026 is current
      }));
    } else {
      // Multi-year continuous stream (2024 to 2027)
      const stream: { year: number; month: number; isFocused: boolean }[] = [];
      const years = [2024, 2025, 2026, 2027];
      for (const y of years) {
        for (let m = 1; m <= 12; m++) {
          stream.push({
            year: y,
            month: m,
            isFocused: y === 2026 && m === 10,
          });
        }
      }
      return stream;
    }
  }, [viewMode, selectedYear, focusedMonth]);

  // Save inline edit
  const commitEdit = (nextAction?: 'down' | 'right' | 'none') => {
    if (!editingCell) return;
    const num = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0;
    updateEntryAmount(editingCell.itemId, editingCell.year, editingCell.month, num);

    if (nextAction === 'down') {
      // Move to next item row
      const currentIndex = filteredItems.findIndex(i => i.id === editingCell.itemId);
      if (currentIndex >= 0 && currentIndex < filteredItems.length - 1) {
        const nextItem = filteredItems[currentIndex + 1];
        const nextKey = `${nextItem.id}-${editingCell.year}-${editingCell.month}`;
        setEditingCell({
          itemId: nextItem.id,
          year: editingCell.year,
          month: editingCell.month,
        });
        setEditValue(String(entries[nextKey]?.amount || ''));
        return;
      }
    } else if (nextAction === 'right') {
      // Move to next column
      const colIndex = columns.findIndex(c => c.year === editingCell.year && c.month === editingCell.month);
      if (colIndex >= 0 && colIndex < columns.length - 1) {
        const nextCol = columns[colIndex + 1];
        const nextKey = `${editingCell.itemId}-${nextCol.year}-${nextCol.month}`;
        setEditingCell({
          itemId: editingCell.itemId,
          year: nextCol.year,
          month: nextCol.month,
        });
        setEditValue(String(entries[nextKey]?.amount || ''));
        return;
      }
    }

    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit('right');
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const startEdit = (itemId: string, year: number, month: number, currentAmount: number) => {
    setEditingCell({ itemId, year, month });
    setEditValue(currentAmount > 0 ? String(currentAmount) : '');
  };

  // Scroll to current month in multi-year mode
  const scrollToCurrentMonth = () => {
    if (tableContainerRef.current) {
      const activeEl = tableContainerRef.current.querySelector('[data-current-month="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* Matrix Controls & View Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs transition-colors">
        
        {/* Left: View Mode Switcher + Year Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Aylık Odak
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'yearly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Yıllık Görünüm (12 Ay)
            </button>
            <button
              onClick={() => {
                setViewMode('multiyear');
                setTimeout(scrollToCurrentMonth, 150);
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                viewMode === 'multiyear'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Çok Yıllı Akış
            </button>
          </div>

          {/* Year selector (for yearly and monthly focus) */}
          {viewMode !== 'multiyear' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                title="Önceki Yıl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-white px-2 font-mono">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                title="Sonraki Yıl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Monthly focus specific month selector */}
          {viewMode === 'monthly' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setFocusedMonth(focusedMonth === 1 ? 12 : focusedMonth - 1)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 px-2">
                {MONTH_NAMES_TR[focusedMonth - 1]}
              </span>
              <button
                onClick={() => setFocusedMonth(focusedMonth === 12 ? 1 : focusedMonth + 1)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {viewMode === 'multiyear' && (
            <button
              onClick={scrollToCurrentMonth}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
            >
              Bugüne Git (Ekim 2026)
            </button>
          )}
        </div>

        {/* Right: Search, Category Filter & Add Item */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none min-w-[130px] sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Gider kalemi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="flex-1 sm:flex-none min-w-[120px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Manage Categories Button */}
          <button
            onClick={() => setCategoryManagerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs whitespace-nowrap"
            title="Kategori Ekle, Düzenle veya Sil"
          >
            <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">Kategoriler</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={onOpenNewItemModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Yeni Kalem Ekle</span>
          </button>
        </div>

      </div>

      {/* Zero Friction Notice / Keyboard Shortcut Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 gap-2 flex-wrap">
        {/* Desktop Keyboard Hints */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">Tıkla</kbd>
            Hücre içi düzenle
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">Enter</kbd>
            Kaydet & Alt Satıra Geç
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">Tab</kbd>
            Sağ Aya Geç
          </span>
        </div>

        {/* Mobile Swipe Notice */}
        <div className="sm:hidden flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
          <span>👈 12 ayı görmek için tabloyu kaydırın 👉</span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Rahat (&gt;7 gün)</span>
            <span className="sm:hidden">Ödendi</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="hidden sm:inline">Yaklaşan (4-7 gün)</span>
            <span className="sm:hidden">Yaklaşan</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="hidden sm:inline">Kritik (≤3 gün)</span>
            <span className="sm:hidden">Kritik</span>
          </span>
        </div>
      </div>

      {/* Main Sticky Column Matrix Table Container */}
      <div 
        ref={tableContainerRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm relative max-h-[72vh] overflow-y-auto"
      >
        <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
          
          {/* Table Header */}
          <thead className="sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <tr>
              
              {/* Sticky Left Column Header: Expense Items */}
              <th className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-950 px-2.5 sm:px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider w-44 sm:w-80 min-w-[170px] sm:min-w-[280px] max-w-[185px] sm:max-w-none shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="truncate">GİDER KALEMLERİ</span>
                  <span className="text-[10px] sm:text-[11px] font-normal text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                    {filteredItems.length} Kalem
                  </span>
                </div>
              </th>

              {/* Month Columns */}
              {columns.map((col) => {
                const isCurrentMonth = col.year === 2026 && col.month === 10;
                return (
                  <th
                    key={`${col.year}-${col.month}`}
                    data-current-month={isCurrentMonth ? "true" : "false"}
                    className={`px-2.5 sm:px-3 py-3 text-xs font-bold text-center border-r border-slate-200 dark:border-slate-800/80 min-w-[105px] sm:min-w-[130px] whitespace-nowrap ${
                      isCurrentMonth
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {MONTH_NAMES_TR[col.month - 1]}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {col.year}
                      </span>
                      {isCurrentMonth && (
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded mt-0.5 uppercase tracking-wider">
                          Bu Ay
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* End Summary Column: Yıllık Toplam (sticky on md+ to avoid blocking mobile view) */}
              {viewMode === 'yearly' && (
                <th className="md:sticky md:right-0 z-30 bg-slate-100 dark:bg-slate-950 px-3 sm:px-4 py-3 text-xs font-bold text-right text-indigo-600 dark:text-indigo-300 min-w-[130px] sm:w-40 border-l border-slate-200 dark:border-slate-800 md:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] md:dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)]">
                  YILLIK TOPLAM
                </th>
              )}

            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-slate-500">
                  Aramanıza uygun harcama kalemi bulunamadı.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                // Compute countdown for active/current month (October 2026)
                const currentMonthKey = `${item.id}-2026-10`;
                const isCurrentPaid = entries[currentMonthKey]?.isPaid || false;
                const dueCalc = getDaysUntilDue(item.defaultDueDay, 10, 2026, isCurrentPaid);
                const yearTotal = calculateItemYearTotal(item.id, entries, selectedYear);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    
                    {/* Sticky Column: Item Name, Category, Due Day, and Countdown Badge */}
                    <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 px-2.5 sm:px-4 py-2.5 sm:py-3 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] border-r border-slate-200 dark:border-slate-800 w-44 sm:w-80 min-w-[170px] sm:min-w-[280px] max-w-[185px] sm:max-w-none">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight truncate font-sans block" title={item.name}>
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px] font-sans truncate text-slate-500 dark:text-slate-400">
                            <span className="truncate">{item.category}</span>
                            <span>·</span>
                            <span className="shrink-0">Vade: {item.defaultDueDay}</span>
                          </div>

                          {/* Countdown Indicator Badge */}
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded font-sans tracking-wide ${
                                dueCalc.status === 'paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                  : dueCalc.status === 'critical' || dueCalc.status === 'overdue'
                                  ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                                  : dueCalc.status === 'approaching'
                                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              }`}
                            >
                              {dueCalc.status === 'paid' ? (
                                <>
                                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Ödendi</span>
                                </>
                              ) : dueCalc.status === 'critical' || dueCalc.status === 'overdue' ? (
                                <>
                                  <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 dark:text-red-400 shrink-0" />
                                  <span className="truncate">{dueCalc.label}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 dark:text-amber-300 shrink-0" />
                                  <span className="truncate">{dueCalc.label}</span>
                                </>
                              )}
                            </span>
                          </div>

                        </div>

                        {/* Quick Delete Item (visible on hover for desktop, accessible on mobile) */}
                        <button
                          onClick={() => deleteExpenseItem(item.id)}
                          className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity shrink-0"
                          title="Gider Kalemini Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Monthly Cells */}
                    {columns.map(col => {
                      const entryKey = `${item.id}-${col.year}-${col.month}`;
                      const entry = entries[entryKey];
                      const amount = entry?.amount || 0;
                      const isPaid = entry?.isPaid || false;
                      const isEditing = editingCell?.itemId === item.id &&
                                        editingCell?.year === col.year &&
                                        editingCell?.month === col.month;
                      const isCurrentMonth = col.year === 2026 && col.month === 10;

                      return (
                        <td
                          key={entryKey}
                          className={`px-2.5 sm:px-3 py-2 text-right border-r border-slate-100 dark:border-slate-800/80 transition-colors ${
                            isEditing ? 'relative z-10' : ''
                          } ${
                            isCurrentMonth ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                          } ${isPaid ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''}`}
                        >
                          {isEditing ? (
                            <div className="relative">
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => commitEdit('none')}
                                className="w-full bg-white dark:bg-indigo-950 text-slate-900 dark:text-white font-mono text-xs font-semibold px-2 py-1 rounded border-2 border-indigo-500 focus:outline-none text-right shadow-lg"
                                placeholder="0"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1 group/cell">
                              {/* Paid Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEntryPaid(item.id, col.year, col.month);
                                }}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  isPaid
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                }`}
                                title={isPaid ? 'Ödendi olarak işaretlendi (Tıkla ve Bekliyor yap)' : 'Ödendi olarak işaretle'}
                              >
                                <Check className={`w-3 h-3 ${isPaid ? 'opacity-100' : 'opacity-30 group-hover/cell:opacity-80'}`} />
                              </button>

                              {/* Amount Display (Click to Inline Edit) */}
                              <div
                                onClick={() => startEdit(item.id, col.year, col.month, amount)}
                                className={`flex-1 cursor-text py-1 px-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                                  amount === 0 
                                    ? 'text-slate-400 dark:text-slate-600' 
                                    : isPaid 
                                    ? 'text-emerald-700 dark:text-emerald-300 font-semibold' 
                                    : 'text-slate-800 dark:text-slate-200 font-semibold'
                                } tabular-nums`}
                              >
                                {amount > 0 ? formatCurrency(amount) : '—'}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* End Summary Column: Yıllık Toplam */}
                    {viewMode === 'yearly' && (
                      <td className="md:sticky md:right-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 px-3 sm:px-4 py-3 text-right border-l border-slate-200 dark:border-slate-800 md:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] md:dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[130px] sm:w-40">
                        <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(yearTotal.total)}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{yearTotal.paidRatio}% ödendi</span>
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${Math.min(100, yearTotal.paidRatio)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    )}

                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Bottom Row: Monthly Totals */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-mono text-xs shadow-[0_-4px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_8px_-2px_rgba(0,0,0,0.5)]">
            <tr>
              
              {/* Sticky Left Corner Header for Totals */}
              <td className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-950 px-2.5 sm:px-4 py-3 font-bold text-slate-900 dark:text-white shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] border-r border-slate-200 dark:border-slate-800 w-44 sm:w-80 min-w-[170px] sm:min-w-[280px] max-w-[185px] sm:max-w-none">
                <div className="flex flex-col font-sans">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Aylık Genel Toplam
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    (Ödenen + Kalan Bakiye)
                  </span>
                </div>
              </td>

              {/* Monthly Calculated Totals */}
              {columns.map(col => {
                const monthTotals = calculateMonthTotals(filteredItems, entries, col.year, col.month);
                const isCurrentMonth = col.year === 2026 && col.month === 10;

                return (
                  <td
                    key={`foot-${col.year}-${col.month}`}
                    className={`px-2.5 sm:px-3 py-3 text-right border-r border-slate-200 dark:border-slate-800/80 min-w-[105px] sm:min-w-[130px] ${
                      isCurrentMonth ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(monthTotals.total)}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 tabular-nums font-semibold">
                      Ödenen: {formatCurrency(monthTotals.paid, true)}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 tabular-nums font-semibold">
                      Kalan: {formatCurrency(monthTotals.remaining, true)}
                    </div>
                  </td>
                );
              })}

              {/* End Grand Total for Selected Year */}
              {viewMode === 'yearly' && (
                <td className="md:sticky md:right-0 z-40 bg-slate-100 dark:bg-slate-950 px-3 sm:px-4 py-3 text-right border-l border-slate-200 dark:border-slate-800 md:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] md:dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)] font-bold text-indigo-700 dark:text-indigo-300 min-w-[130px] sm:w-40">
                  {(() => {
                    let grandTotal = 0;
                    for (let m = 1; m <= 12; m++) {
                      grandTotal += calculateMonthTotals(filteredItems, entries, selectedYear, m).total;
                    }
                    return (
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(grandTotal)}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal">
                          {selectedYear} Genel Toplam
                        </span>
                      </div>
                    );
                  })()}
                </td>
              )}

            </tr>
          </tfoot>

        </table>
      </div>

      <CategoryManagerModal
        isOpen={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </div>
  );
};
