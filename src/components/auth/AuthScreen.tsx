import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';

type Mode = 'login' | 'register';

/**
 * Full-screen authentication gate (backend stage 1 — closed).
 *
 * The access token is kept in memory, the refresh token persisted; see
 * src/services/tokenStorage.ts. Errors surface verbatim from the API
 * (401/409/429 with Retry-After).
 */
export function AuthScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login({email: email.trim(), password});
    } else {
      await register({email: email.trim(), password, full_name: fullName.trim()});
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.2}}
        className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900"
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.authWelcomeTitle}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t.authWelcomeSub}
          </p>
        </div>

        {/* Mode switch */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['login', 'register'] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === value
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {value === 'login' ? t.authSignIn : t.authSignUp}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.authFullName}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={150}
                  autoComplete="name"
                  className="pl-9"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.authEmail}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.authPassword}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-slate-400">{t.authPasswordHint}</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {isSubmitting
                ? t.authSubmitting
                : mode === 'login'
                  ? t.authSubmitLogin
                  : t.authSubmitRegister}
            </span>
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
