import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import type { Category } from '../types/finance.ts';
import { X, Plus, Trash2, Edit2, Check, Tag, AlertTriangle } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, items, addCategory, updateCategory, deleteCategory } = useFinance();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setNewCatColor(COLOR_PALETTE[(COLOR_PALETTE.indexOf(newCatColor) + 1) % COLOR_PALETTE.length]);
  };

  const startEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory(id, { name: editName.trim(), color: editColor });
    setEditingCatId(null);
  };

  const confirmDelete = () => {
    if (!deletingCat) return;
    deleteCategory(deletingCat.id);
    setDeletingCat(null);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kategori Yönetimi</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gider kategorileri ekleyin, düzenleyin veya kaldırın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories List (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {categories.map((cat) => {
            const itemCount = items.filter(i => i.category === cat.id && i.isActive).length;
            const isEditing = editingCatId === cat.id;

            if (isEditing) {
              return (
                <div key={cat.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-indigo-300 dark:border-indigo-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(cat.id)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                      title="Kaydet"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg text-xs"
                      title="İptal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform ${editColor === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                      KOD: {cat.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                    {itemCount} Kalem
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                    title="Kategoriyi Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCat(cat)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Kategoriyi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Category Section */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleAdd} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              + Yeni Kategori Ekle
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Örn: Pazarlama & Reklam, Lojistik..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            {/* Color picker presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Renk Seçimi:</span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${newCatColor === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>
        </div>

        {/* Delete Confirmation Warning Modal */}
        {deletingCat && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kategoriyi Sil: {deletingCat.name}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Bu kategoriyi sildiğinizde, bağlı olan gider kalemleri silinmez; otomatik olarak <strong>Diğer Giderler (DIGER)</strong> kategorisine aktarılır. Devam etmek istiyor musunuz?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  Evet, Sil ve Aktar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
