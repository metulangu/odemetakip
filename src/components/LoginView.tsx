import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, ShieldCheck, AlertCircle, Mail, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

// Google Cloud Project (gen-lang-client-0450655254) Client IDs
const PRIMARY_GOOGLE_CLIENT_ID = '974717557300-tnhesvs33f016dg0m9eimjr0p6q1b5vi.apps.googleusercontent.com';
const FALLBACK_GOOGLE_CLIENT_ID = '974717557300-vnb5erodboeulaekj1i7tb3e7srr5av8.apps.googleusercontent.com';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  useEffect(() => {
    document.title = 'Best Home';
  }, []);

  const { theme, toggleTheme, loginWithGoogle, allUsers } = useFinance();

  // Active Client ID (can be customized via localStorage if desired)
  const [activeClientId] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_google_client_id') || PRIMARY_GOOGLE_CLIENT_ID;
    } catch {
      return PRIMARY_GOOGLE_CLIENT_ID;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSdkReady, setGoogleSdkReady] = useState(false);

  // Manual fallback entry state
  const [showManual, setShowManual] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

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
      setError('Google ile giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.');
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

          setGoogleSdkReady(true);

          // Render official Google button if container is present
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            g.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              width: 320,
              locale: 'tr'
            });
          }

          // Optional: Google One-Tap prompt
          try {
            g.accounts.id.prompt();
          } catch {}

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
              // If popup was cancelled or blocked, don't show scary error
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google giriş hatası: ${tokenResponse.error}`);
              }
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

    // Fallback: try prompt()
    if (g && g.accounts && g.accounts.id) {
      g.accounts.id.prompt();
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setShowManual(true);
    setError('Google oturum penceresi açılamadı. Aşağıdaki kutudan e-posta adresinizle doğrudan giriş yapabilirsiniz.');
  };

  // Manual submission handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      setError('Lütfen geçerli bir Google (Gmail) e-posta adresi giriniz.');
      return;
    }
    processGoogleUser(manualEmail, manualName);
  };

  const cleanManualEmail = manualEmail.trim().toLowerCase();
  const existingUserMatch = allUsers.find(
    (u) => u.email.toLowerCase().trim() === cleanManualEmail
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 transition-colors relative selection:bg-indigo-500/30 selection:text-indigo-900">
      
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google OAuth Girişi</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Hesabınızı Seçin ve Başlayın
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Google hesabınızla tek tıkla şifresiz ve güvenli giriş yapın
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Official Google One-Click OAuth Button */}
          <div className="space-y-4 flex flex-col items-center">
            
            {/* Custom Styled Large Google OAuth Button */}
            <button
              type="button"
              onClick={handleTriggerGoogleOAuthPopup}
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span>Google ile Bağlanıyor...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google ile Otomatik Giriş Yap</span>
                </>
              )}
            </button>

            {/* Rendered Google Identity Services Button container (if SDK is ready) */}
            <div
              ref={googleBtnContainerRef}
              id="google-signin-btn-container"
              className="flex justify-center min-h-[44px]"
            />

            {/* Quick privileges hint */}
            <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Yetkili Hesaplar:</span>
              </div>
              <p>
                <strong>mturkey11@gmail.com</strong> (Yönetici) ve <strong>meryemmehmetturhan@gmail.com</strong> hesaplarına kalıcı Gemini API otomatik olarak tanımlıdır.
              </p>
            </div>

            {/* Divider / Collapsible for manual entry */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors py-1"
              >
                <span>{showManual ? 'Manuel Girişi Gizle' : 'Veya E-posta ile Giriş Yap'}</span>
                {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Manual Form */}
            {showManual && (
              <form onSubmit={handleManualSubmit} className="w-full space-y-3.5 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Google (Gmail) Hesabınız
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={manualEmail}
                      onChange={(e) => {
                        setManualEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="ornek@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {cleanManualEmail.includes('@') && cleanManualEmail !== 'mturkey11@gmail.com' && cleanManualEmail !== 'meryemmehmetturhan@gmail.com' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Adınız Soyadınız (Yönetici Onayı İçin)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                      />
                    </div>
                    {existingUserMatch?.status === 'APPROVED' ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Bu hesap yönetici tarafından onaylanmış.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Yeni hesaplar ilk girişte <strong>mturkey11@gmail.com</strong> onayına sunulur.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isLoading ? 'Giriş Yapılıyor...' : 'Bu E-posta ile Giriş Yap'}
                </button>
              </form>
            )}

          </div>

          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Google Cloud OAuth 2.0 Kimlik Doğrulaması</span>
          </div>

        </div>
      </div>
    </div>
  );
};
