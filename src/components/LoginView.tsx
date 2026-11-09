import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, ShieldCheck, AlertCircle, Mail, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Loader2, HelpCircle, ExternalLink } from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

// Yeni Oluşturulan Google Cloud Web Application Client ID
const DEFAULT_GOOGLE_CLIENT_ID = '974717557300-nq61v6595dqt3uascl24d1lr548oa232.apps.googleusercontent.com';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  useEffect(() => {
    document.title = 'Best Home';
  }, []);

  const { theme, toggleTheme, loginWithGoogle, allUsers } = useFinance();

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('custom_google_client_id');
      // Eski geçersiz ID kayıtlıysa yeni ID ile güncelle
      if (!stored || stored.includes('p6q1b5vi') || stored.includes('5av8')) {
        localStorage.setItem('custom_google_client_id', DEFAULT_GOOGLE_CLIENT_ID);
        return DEFAULT_GOOGLE_CLIENT_ID;
      }
      return stored;
    } catch {
      return DEFAULT_GOOGLE_CLIENT_ID;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Email input state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Fast direct sign-in for accounts
  const handleQuickLogin = (email: string, name: string, avatar?: string) => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      loginWithGoogle(email, name, avatar);
      onLoginSuccess();
    }, 200);
  };

  // Process decoded Google User
  const processGoogleUser = (email: string, name?: string, picture?: string) => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const finalName = name?.trim() || cleanEmail.split('@')[0];

    setTimeout(() => {
      loginWithGoogle(cleanEmail, finalName, picture);
      onLoginSuccess();
    }, 200);
  };

  // Google JWT Credential Response Handler (GIS SDK)
  const handleGoogleCredentialResponse = (response: any) => {
    try {
      const token = response.credential;
      if (!token) throw new Error('Google token alınamadı');

      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(decodedJson);

      const email = decoded.email;
      const name = decoded.name || decoded.given_name;
      const picture = decoded.picture;

      if (!email) {
        throw new Error('Google profilinden e-posta bilgisi alınamadı.');
      }

      processGoogleUser(email, name, picture);
    } catch (err: any) {
      console.error('Google credential parse error:', err);
      setError('Google ile giriş yapılırken bir sorun oluştu.');
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    let checkInterval: any = null;

    const setupGoogleGsi = () => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        try {
          g.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            g.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              width: 300,
              locale: 'tr'
            });
          }

          if (checkInterval) clearInterval(checkInterval);
          return true;
        } catch (e) {
          console.warn('Google GSI init failed:', e);
        }
      }
      return false;
    };

    if (!setupGoogleGsi()) {
      checkInterval = setInterval(() => {
        if (setupGoogleGsi()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [activeClientId, theme]);

  // Direct Popup Flow via Google OAuth2 Token Client
  const handleTriggerGoogleOAuthPopup = () => {
    setIsLoading(true);
    setError(null);

    const g = (window as any).google;
    if (g && g.accounts && g.accounts.oauth2) {
      try {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn('OAuth error:', tokenResponse.error);
              setIsLoading(false);
              if (tokenResponse.error === 'popup_closed_by_user') return;

              setError(
                'Google Yetkilendirme Hatası: Google Cloud Console\'da bu İstemci Kimliğinin (Client ID) "Yetkili JavaScript kaynakları" bölümüne "https://odemetakip.metulangu.workers.dev" eklendiğinden emin olunuz.'
              );
              setShowConfigHelp(true);
              return;
            }

            if (tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const googleUser = await res.json();
                if (googleUser && googleUser.email) {
                  processGoogleUser(
                    googleUser.email,
                    googleUser.name || googleUser.given_name,
                    googleUser.picture
                  );
                  return;
                }
              } catch (e) {
                console.warn('Userinfo fetch failed:', e);
              }
            }
            setIsLoading(false);
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('oauth2 initTokenClient error:', err);
      }
    }

    setIsLoading(false);
    setError('Google oturum penceresi açılamadı. Aşağıdaki giriş butonlarını kullanabilirsiniz.');
  };

  // Manual submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setError('Lütfen geçerli bir Google (Gmail) e-posta adresi giriniz.');
      return;
    }
    processGoogleUser(emailInput, nameInput);
  };

  const cleanEmail = emailInput.trim().toLowerCase();
  const existingUserMatch = allUsers.find(
    (u) => u.email.toLowerCase().trim() === cleanEmail
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-10 transition-colors relative selection:bg-indigo-500/30 selection:text-indigo-900">
      
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs transition-colors cursor-pointer"
        >
          {theme === 'dark' ? '☀️ Açık Tema' : '🌙 Koyu Tema'}
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 p-0.5 shadow-xl shadow-indigo-600/20 inline-flex items-center justify-center mb-3">
            <img
              src="/favicon.svg"
              alt="Best Home"
              className="w-15 h-15 rounded-3xl select-none"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Best Home
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gider, Doğum Günü ve Sesli Alışveriş Takibi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors space-y-5">
          
          {/* 1. Official Google OAuth Button Section */}
          <div className="space-y-3">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google OAuth Girişi</span>
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google ile Giriş Yapın
              </h2>
            </div>

            {/* Custom Google OAuth Button */}
            <button
              type="button"
              onClick={handleTriggerGoogleOAuthPopup}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-800 dark:text-white border-2 border-indigo-500/30 hover:border-indigo-600 text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span>Google Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google Hesabını Seç &amp; Giriş Yap</span>
                </>
              )}
            </button>

            {/* Rendered Google Identity Services Button container (if SDK is ready) */}
            <div
              ref={googleBtnContainerRef}
              id="google-signin-btn-container"
              className="flex justify-center"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs leading-relaxed animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Veya Tek Tıkla Hızlı Giriş
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
          </div>

          {/* Quick 1-Click Access Cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Account 1: mturkey11@gmail.com */}
            <button
              type="button"
              onClick={() => handleQuickLogin('mturkey11@gmail.com', 'Mehmet Turhan (Admin)')}
              disabled={isLoading}
              className="w-full p-2.5 rounded-2xl border border-indigo-500/30 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs active:scale-99"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  👑
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Mehmet Turhan
                    </span>
                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.2 rounded-md">
                      Admin
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono block truncate">
                    mturkey11@gmail.com
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                Giriş →
              </span>
            </button>

            {/* Account 2: meryemmehmetturhan@gmail.com */}
            <button
              type="button"
              onClick={() => handleQuickLogin('meryemmehmetturhan@gmail.com', 'Meryem Turhan')}
              disabled={isLoading}
              className="w-full p-2.5 rounded-2xl border border-purple-500/30 hover:border-purple-600 bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/30 dark:hover:bg-purple-950/60 transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs active:scale-99"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  ⭐
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Meryem Turhan
                    </span>
                    <span className="text-[10px] font-extrabold bg-purple-600 text-white px-1.5 py-0.2 rounded-md">
                      VIP
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono block truncate">
                    meryemmehmetturhan@gmail.com
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                Giriş →
              </span>
            </button>
          </div>

          {/* Direct Email Entry Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2.5 pt-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Farklı Gmail yazarak giriş..."
                className="w-full pl-9 pr-20 py-2 text-xs rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !emailInput.trim()}
                className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Giriş
              </button>
            </div>
          </form>

          {/* Google Cloud Console Setup Help Accordion */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="w-full flex items-center justify-between text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Google İstemci Bilgileri &amp; İzinler</span>
              </span>
              {showConfigHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showConfigHelp && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2 text-slate-600 dark:text-zinc-400 leading-relaxed animate-in fade-in">
                <p>
                  <strong>Aktif İstemci Kimliği (Client ID):</strong>
                  <code className="block mt-0.5 p-1 bg-white dark:bg-zinc-900 rounded border font-mono text-[10px] text-slate-900 dark:text-white select-all break-all">
                    {activeClientId}
                  </code>
                </p>
                <p>
                  Google Cloud Console'da bu Client ID için şu adresin <strong>"Yetkili JavaScript kaynakları"</strong> kısmında ekli olduğundan emin olun:
                  <code className="block mt-0.5 p-1 bg-white dark:bg-zinc-900 rounded border font-mono text-[10px] text-emerald-600 dark:text-emerald-400 select-all">
                    https://odemetakip.metulangu.workers.dev
                  </code>
                </p>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Best Home &bull; Çok Yıllı Bulut Senkronizasyonu</span>
          </div>

        </div>
      </div>
    </div>
  );
};
