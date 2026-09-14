import React, { useState } from 'react';
import { 
  MailCheck, 
  Send, 
  RotateCw, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Building2,
  Sun,
  Moon,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const EmailVerificationScreen: React.FC = () => {
  const { user, resendVerificationEmail, checkEmailVerification, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleCheckVerification = async () => {
    setError(null);
    setSuccessMsg(null);
    setChecking(true);

    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setSuccessMsg('E-mail verificado com sucesso! Carregando sistema...');
      } else {
        setError('Seu e-mail ainda não consta como verificado. Por favor, abra sua caixa postal institucional, clique no link de ativação e tente novamente.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar status de verificação.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      await resendVerificationEmail();
      setSuccessMsg(`Um novo link de verificação foi enviado para ${user?.email || 'seu e-mail'}.`);
      
      // Cooldown 60s
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar e-mail de verificação.');
    } finally {
      setResending(false);
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

      {/* Top Bar */}
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-xl transition-all text-center">
          
          {/* Brand Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <img 
                src="/rio_verde_brasao_clean.png" 
                alt="Brasão de Armas da Prefeitura de Rio Verde"
                className="w-20 h-20 object-contain drop-shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                <MailCheck className="w-4 h-4" />
              </div>
            </div>

            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Confirmação de E-mail Obrigatória
            </h1>
            <p className="text-xs font-semibold text-[#008d50] dark:text-emerald-400 mt-1">
              Validação de Acesso Institucional
            </p>
          </div>

          {/* Institutional Warning Box */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-300">
                <p className="font-bold">Por que é necessário confirmar?</p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  Para garantir que somente servidores legítimos tenham acesso aos demonstrativos e fichas financeiras da Prefeitura, o sistema exige a comprovação da titularidade da conta institucional.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">E-mail cadastrado:</span>
              <strong className="font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                {user?.email || 'servidor@rioverde.go.gov.br'}
              </strong>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 text-left border border-slate-200/60 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Passo a passo para ativação:
            </h2>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed text-[11px]">
              <li>Acesse seu webmail institucional (<code className="text-emerald-700 dark:text-emerald-400 font-bold">@rioverde.go.gov.br</code>).</li>
              <li>Localize o e-mail de verificação (verifique também a pasta de <em>Spam / Lixo Eletrônico</em>).</li>
              <li>Clique no link seguro para confirmar a sua conta.</li>
              <li>Retorne a esta tela e clique em <strong>"Já Confirmei Meu E-mail"</strong>.</li>
            </ol>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 text-left animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full py-3 px-4 bg-[#008d50] hover:bg-[#007240] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando ativação...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Já Confirmei Meu E-mail</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reenviando mensagem...</span>
                </>
              ) : resendCooldown > 0 ? (
                <span>Aguarde {resendCooldown}s para reenviar</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Reenviar E-mail de Confirmação</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair / Entrar com outra conta</span>
            </button>
          </div>

          {/* Security Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Validação de identidade por protocolo seguro</span>
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
