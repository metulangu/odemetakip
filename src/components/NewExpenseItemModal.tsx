import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import type { ExpenseCategory } from '../types/finance.ts';
import { CategoryManagerModal } from './CategoryManagerModal.tsx';
import { X, Plus, Tag } from 'lucide-react';

interface NewExpenseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewExpenseItemModal: React.FC<NewExpenseItemModalProps> = ({ isOpen, onClose }) => {
  const { addExpenseItem, categories } = useFinance();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(categories[0]?.id || 'FATURA');
  const [dueDay, setDueDay] = useState<number>(15);
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const amountNum = parseFloat(initialAmount.replace(/[^\d.-]/g, '')) || 0;
    addExpenseItem(name.trim(), category, dueDay, amountNum);
    setName('');
    setCategory(categories[0]?.id || 'FATURA');
    setDueDay(15);
    setInitialAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Yeni Gider / Fatura Kalemi</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Matris tablonuza yeni bir harcama satırı ekleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kalem Adı
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: Ofis İnterneti / Vodafone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setCatManagerOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Tag className="w-3 h-3" />
                <span>Kategorileri Yönet</span>
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vade Günü (Her ayın kaçıncı günü?)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={31}
                required
                value={dueDay}
                onChange={(e) => setDueDay(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white text-center focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                (Renk ve geri sayım sayacı bu güne göre çalışır)
              </span>
            </div>
          </div>

          {/* Prepopulated Initial Amount (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Varsayılan Aylık Tutar (Opsiyonel)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">TL</span>
              <input
                type="text"
                placeholder="Örn: 2500"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tutar girerseniz tablonun tüm aylarına otomatik doldurulur; daha sonra hücre içine tıklayarak dilediğiniz ayı değiştirebilirsiniz.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Matrise Ekle
            </button>
          </div>
        </form>

      </div>

      <CategoryManagerModal
        isOpen={catManagerOpen}
        onClose={() => setCatManagerOpen(false)}
      />
    </div>
  );
};
