import React, { useState, useRef, useEffect } from 'react';
import { FileText, Award, Users, History, TrendingUp, Sun, Moon, LogIn, LogOut, Cloud } from 'lucide-react';
import { RioVerdeLogo } from './RioVerdeLogo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onReset?: () => void;
  hasData?: boolean;
  activeTab: 'PROGRESSAO' | 'INCENTIVO' | 'MASSA';
  onTabChange: (tab: 'PROGRESSAO' | 'INCENTIVO' | 'MASSA') => void;
  onOpenHistory?: () => void;
  savedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasData,
  activeTab,
  onTabChange,
  onOpenHistory,
  savedCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0c1521] border-b border-slate-200 dark:border-[#324f72]/40 shadow-xs transition-colors">
      {/* Official 4-color solid stripe */}
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-[#008d50]"></div>
        <div className="bg-[#324f72]"></div>
        <div className="bg-[#f88543]"></div>
        <div className="bg-[#ead04d]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Left Branding */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <RioVerdeLogo size="md" />

          <div className="hidden sm:block h-7 w-[1px] bg-slate-200 dark:bg-[#324f72]/50" />

          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                Calculadora de Progressão
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium transition-colors">
              Prefeitura Municipal de Rio Verde — GO
            </p>
          </div>
        </div>

        {/* Center Module Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#080e16] border border-slate-200 dark:border-[#324f72]/50 self-center md:self-auto text-xs transition-colors">
          <button
            type="button"
            onClick={() => onTabChange('PROGRESSAO')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'PROGRESSAO'
              ? 'bg-[#008d50] text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132030]'
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Progressão Funcional
          </button>

          <button
            type="button"
            onClick={() => onTabChange('INCENTIVO')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'INCENTIVO'
              ? 'bg-[#008d50] text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132030]'
              }`}
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Incentivo Funcional
          </button>

          <button
            type="button"
            onClick={() => onTabChange('MASSA')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'MASSA'
              ? 'bg-[#ea580c] dark:bg-[#f88543] text-white dark:text-slate-950 shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132030]'
              }`}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Cálculo em Massa
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#132030] dark:hover:bg-[#1b2a3f] dark:text-slate-200 dark:border-[#324f72] transition-all cursor-pointer"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label="Alternar tema de cores"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#ead04d]" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#1e3a5f]" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            )}
          </button>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#132030] dark:hover:bg-[#1b2a3f] dark:text-slate-200 dark:border-[#324f72] transition-all cursor-pointer relative"
              title="Ver histórico de apurações salvas (Cloud Firestore / LocalStorage)"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-[#ead04d]" />
              Histórico
              {savedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#008d50] text-white text-[9px] font-black">
                  {savedCount}
                </span>
              )}
            </button>
          )}

          {hasData && onReset && activeTab === 'PROGRESSAO' && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#132030] dark:hover:bg-[#1b2a3f] dark:text-slate-200 dark:border-[#324f72] transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-[#ead04d]" />
              Novo
            </button>
          )}

          {/* User Auth Section */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/60 transition-all cursor-pointer shadow-xs"
                title="Perfil e Sessão na Nuvem"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-5 h-5 rounded-full object-cover border border-emerald-300 dark:border-emerald-600" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate hidden sm:inline text-left">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Sincronizado na Nuvem" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName || 'Servidor Municipal'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="py-2.5 px-1 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Nuvem Firebase ativa</span>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#008d50] hover:bg-[#007240] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="Entrar ou criar conta para salvar cálculos na nuvem Firebase"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};
