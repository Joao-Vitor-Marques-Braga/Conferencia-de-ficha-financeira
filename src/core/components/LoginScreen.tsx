import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sun,
  Moon,
  Building2
} from 'lucide-react';
import { useAuth, INSTITUTIONAL_DOMAIN, isAllowedInstitutionalEmail } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginScreen: React.FC = () => {
  const { isConfigured, loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const switchTab = (newTab: 'login' | 'register' | 'forgot') => {
    setTab(newTab);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      setError('O Firebase ainda não foi configurado. Preencha as chaves VITE_FIREBASE_* no arquivo .env.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail institucional.');
      return;
    }

    if (!isAllowedInstitutionalEmail(cleanEmail)) {
      setError(`Apenas e-mails com domínio institucional oficial são permitidos.`);
      return;
    }

    if (tab === 'forgot') {
      try {
        setLoading(true);
        await sendPasswordReset(cleanEmail);
        setSuccessMsg(`Instruções de recuperação enviadas para ${cleanEmail}! Verifique sua caixa de entrada.`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (tab === 'register') {
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        setError('A confirmação de senha não confere com a senha digitada.');
        return;
      }
    }

    try {
      setLoading(true);
      if (tab === 'login') {
        await loginWithEmail(cleanEmail, password);
      } else if (tab === 'register') {
        await registerWithEmail(cleanEmail, password, name);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-[#070e17] text-slate-900 dark:text-slate-100 transition-colors relative selection:bg-emerald-500 selection:text-white">
      {/* Top Stripe with Official Rio Verde Colors */}
      <div className="h-1.5 w-full grid grid-cols-4 shadow-sm z-10">
        <div className="bg-[#008d50]" />
        <div className="bg-[#324f72]" />
        <div className="bg-[#ea580c]" />
        <div className="bg-[#ead04d]" />
      </div>

      {/* Top Navigation / Theme Switcher */}
      <div className="w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>PORTAL DE CONFERÊNCIA FINANCEIRA</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs hover:shadow transition-all cursor-pointer"
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#ead04d]" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#1e3a5f]" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-xl transition-all">

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/rio_verde_brasao_clean.png"
              alt="Brasão de Armas da Prefeitura de Rio Verde"
              className="w-20 h-20 object-contain drop-shadow-md mb-3"
            />
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
              Prefeitura de Rio Verde
            </h1>
            <p className="text-xs font-semibold text-[#008d50] dark:text-emerald-400 mt-0.5">
              Conferência de Ficha Financeira & Progressões
            </p>
          </div>

          {/* Missing Firebase Credentials Banner */}
          {!isConfigured && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Configuração do Firebase Pendente</p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  Para permitir o login dos servidores, insira as credenciais <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]">VITE_FIREBASE_*</code> no arquivo <code className="font-mono font-bold">.env</code> da aplicação.
                </p>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 mb-5 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'login'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === 'register'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Cadastrar
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Rodrigues"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  E-mail Institucional
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  @rioverde.go.gov.br
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="servidor@rioverde.go.gov.br"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {tab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 dígitos"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-[#008d50] hover:bg-[#007240] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              ) : tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Concluir Cadastro</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar E-mail de Recuperação</span>
                </>
              )}
            </button>

            {tab === 'forgot' && (
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="w-full py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold cursor-pointer"
              >
                Voltar para a tela de login
              </button>
            )}
          </form>

          {/* Security Badge Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ambiente seguro protegido por criptografia</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 dark:text-slate-500 z-10">
        © {new Date().getFullYear()} Prefeitura Municipal de Rio Verde — Goiás. Todos os direitos reservados.
      </footer>
    </div>
  );
};
