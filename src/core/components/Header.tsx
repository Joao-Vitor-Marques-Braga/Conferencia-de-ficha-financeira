import React from 'react';
import { ShieldCheck, FileText, Award, Users, History, TrendingUp } from 'lucide-react';
import { RioVerdeLogo } from './RioVerdeLogo';

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
  return (
    <header className="sticky top-0 z-40 bg-[#0c1521] border-b border-[#324f72]/40 shadow-md">
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

          <div className="hidden sm:block h-7 w-[1px] bg-[#324f72]/50" />

          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black tracking-tight text-white">
                Conferência de Ficha Financeira
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#008d50]/15 text-[#008d50] border border-[#008d50]/30">
                <ShieldCheck className="w-2.5 h-2.5 mr-1 text-[#008d50]" /> Client-Side
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Prefeitura Municipal de Rio Verde — GO
            </p>
          </div>
        </div>

        {/* Center Module Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 p-1 rounded-2xl bg-[#080e16] border border-[#324f72]/50 self-center md:self-auto text-xs">
          <button
            type="button"
            onClick={() => onTabChange('PROGRESSAO')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'PROGRESSAO'
                ? 'bg-[#008d50] text-white shadow-xs font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#132030]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Progressão Funcional
          </button>

          <button
            type="button"
            onClick={() => onTabChange('INCENTIVO')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'INCENTIVO'
                ? 'bg-[#008d50] text-white shadow-xs font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#132030]'
            }`}
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Incentivo Funcional
          </button>

          <button
            type="button"
            onClick={() => onTabChange('MASSA')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'MASSA'
                ? 'bg-[#f88543] text-slate-950 shadow-xs font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#132030]'
            }`}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Cálculo em Massa
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-slate-200 border border-[#324f72] transition-all cursor-pointer relative"
              title="Ver histórico de apurações salvas (IndexedDB/LocalStorage)"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-[#ead04d]" />
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
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-slate-200 border border-[#324f72] transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-[#ead04d]" />
              Novo
            </button>
          )}
        </div>

      </div>
    </header>
  );
};


