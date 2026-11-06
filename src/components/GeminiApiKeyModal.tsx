import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Check, AlertCircle, ExternalLink, Trash2, X, ShieldCheck, Loader2 } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey } from '../services/geminiShopping.ts';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = getGeminiApiKey();
      setApiKey(existing);
      setStatusMessage(
        existing
          ? { type: 'info', text: 'Kayıtlı Gemini API anahtarınız mevcut. İsterseniz değiştirebilir veya test edebilirsiniz.' }
          : null
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setStatusMessage({ type: 'error', text: 'Lütfen bir API anahtarı girin veya mevcut anahtarı silin.' });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    const result = await testGeminiApiKey(cleanKey);
    setTesting(false);

    if (result.success) {
      setGeminiApiKey(cleanKey);
      onKeySaved(cleanKey);
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleRemoveKey = () => {
    setGeminiApiKey('');
    setApiKey('');
    onKeySaved('');
    setStatusMessage({ type: 'info', text: 'API anahtarı kaldırıldı. Yerel kural ayrıştırıcısına dönüldü.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Gemini AI Bağlantısı</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Ücretsiz
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Alışveriş ses ve metinlerini sıfır hatayla ayrıştırın
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="mb-5 p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 text-xs text-slate-700 dark:text-zinc-300 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Google AI Studio, <strong>günde 1.500 isteğe kadar tamamen ücretsiz</strong> kullanım sunar. Kişisel kullanımda kotanın aşılması fiilen imkansızdır.
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 pl-6">
            Anahtarınız tarayıcınızın yerel hafızasında (localStorage) saklanır ve doğrudan güvenli Google API uç noktasına bağlanır.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Ücretsiz Anahtar Al</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-purple-600" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {apiKey ? (
              <button
                type="button"
                onClick={handleRemoveKey}
                disabled={testing}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kaldır</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={testing || !apiKey.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Test Et &amp; Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
