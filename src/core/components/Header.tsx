import React from 'react';
import { FileText, Award, Users, History, TrendingUp, Sun, Moon } from 'lucide-react';
import { RioVerdeLogo } from './RioVerdeLogo';
import { useTheme } from '../context/ThemeContext';

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
              title="Ver histórico de apurações salvas (IndexedDB/LocalStorage)"
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
        </div>

      </div>
    </header>
  );
};
