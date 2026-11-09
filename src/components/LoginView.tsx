import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  useEffect(() => {
    document.title = 'Best Home';
  }, []);

  const { theme, toggleTheme, loginWithGoogle, allUsers } = useFinance();
  const [loginMode, setLoginMode] = useState<'google' | 'classic'>('google');

  // Google Sign-In state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePin, setGooglePin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Classic Sign-In state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanEmail = googleEmail.trim().toLowerCase();
  const isPrivilegedEmail =
    cleanEmail === 'mturkey11@gmail.com' ||
    cleanEmail === 'meryemmehmetturhan@gmail.com';

  // Classic login handler (maps 'admin' to mturkey11@gmail.com)
  const handleClassicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();

    if (
      (trimmedUser === 'admin' ||
        trimmedUser === 'mturkey11@gmail.com' ||
        trimmedUser === 'meryemmehmetturhan@gmail.com') &&
      password === '1453145361'
    ) {
      setIsLoading(true);
      const targetEmail =
        trimmedUser === 'meryemmehmetturhan@gmail.com'
          ? 'meryemmehmetturhan@gmail.com'
          : 'mturkey11@gmail.com';
      const targetName =
        targetEmail === 'meryemmehmetturhan@gmail.com'
          ? 'Meryem Turhan'
          : 'Mehmet Turhan (Admin)';

      setTimeout(() => {
        loginWithGoogle(targetEmail, targetName);
        onLoginSuccess();
      }, 250);
    } else {
      setError('Kullanıcı adı veya şifre hatalı.');
    }
  };

  // Google login handler
  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Lütfen geçerli bir Google (Gmail) e-posta adresi giriniz.');
      return;
    }

    // Security check for the 2 privileged family accounts so strangers cannot impersonate them
    if (isPrivilegedEmail) {
      if (googlePin !== '1453145361') {
        setError('Yetkili aile hesabı (Admin / VIP) için güvenlik şifresini doğru giriniz.');
        return;
      }
    }

    setIsLoading(true);
    const defaultName =
      cleanEmail === 'mturkey11@gmail.com'
        ? 'Mehmet Turhan (Admin)'
        : cleanEmail === 'meryemmehmetturhan@gmail.com'
        ? 'Meryem Turhan'
        : googleName.trim() || cleanEmail.split('@')[0];

    setTimeout(() => {
      loginWithGoogle(cleanEmail, defaultName);
      onLoginSuccess();
    }, 300);
  };

  const existingUserMatch = allUsers.find(
    u => u.email.toLowerCase().trim() === cleanEmail
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-xs transition-colors cursor-pointer"
        >
          {theme === 'dark' ? '☀️ Açık Tema' : '🌙 Koyu Tema'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/favicon.svg"
            alt="Best Home"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-indigo-500/25 mb-3 inline-block"
          />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Best Home
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aile &amp; Ev Yönetim Sistemi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
          
          {/* Login Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-6 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setLoginMode('google');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginMode === 'google'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google ile Giriş</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('classic');
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginMode === 'classic'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Şifre ile Giriş</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {loginMode === 'google' ? (
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
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
                    autoFocus
                    autoComplete="email"
                    value={googleEmail}
                    onChange={e => {
                      setGoogleEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="ornek@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* If privileged email, ask for security password */}
              {isPrivilegedEmail ? (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {cleanEmail === 'mturkey11@gmail.com'
                        ? 'Yönetici (Admin) Hesabı Algılandı'
                        : 'Yetkili Aile Hesabı (Gemini AI VIP) Algılandı'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      value={googlePin}
                      onChange={e => {
                        setGooglePin(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Güvenlik şifrenizi giriniz"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                cleanEmail.includes('@') && (
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
                        value={googleName}
                        onChange={e => setGoogleName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                      />
                    </div>
                    {existingUserMatch?.status === 'APPROVED' ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Bu hesap yönetici tarafından onaylanmış. Doğrudan giriş yapabilirsiniz.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        İlk girişte yönetici (<strong>mturkey11@gmail.com</strong>) onayı gerekir. Onaylandıktan sonra kalıcı olarak giriş yapabilirsiniz.
                      </p>
                    )}
                  </div>
                )
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google Hesabı ile Devam Et</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleClassicSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="admin veya e-posta"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Giriş Yap</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          Best Home · Yönetici Onaylı Güvenli Giriş
        </p>
      </div>
    </div>
  );
};
