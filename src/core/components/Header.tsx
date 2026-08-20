import React from 'react';
import { ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { RioVerdeLogo } from './RioVerdeLogo';

interface HeaderProps {
  onLoadMockData?: () => void;
  onReset?: () => void;
  hasData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoadMockData, onReset, hasData }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c1521] border-b border-[#324f72]/40 shadow-md">
      {/* Official 4-color solid stripe */}
      <div className="h-1 w-full grid grid-cols-4">
        <div className="bg-[#008d50]"></div>
        <div className="bg-[#324f72]"></div>
        <div className="bg-[#f88543]"></div>
        <div className="bg-[#ead04d]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-4 cursor-pointer" onClick={onReset}>
          <RioVerdeLogo size="md" />

          <div className="hidden sm:block h-8 w-[1px] bg-[#324f72]/50" />

          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Conferência de Ficha Financeira
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#008d50]/15 text-[#008d50] border border-[#008d50]/30">
                <ShieldCheck className="w-3 h-3 mr-1 text-[#008d50]" /> Client-Side
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Apuração de Diferenças por Progressão Funcional (Letra 1 → Letra 2)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          {onLoadMockData && (
            <button
              onClick={onLoadMockData}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f88543] hover:bg-[#df6824] text-slate-950 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Carregar exemplo de Ficha Financeira Centi Rio Verde para teste imediato"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-slate-950 fill-current" />
              Carregar PDF de Exemplo (Centi)
            </button>
          )}

          {hasData && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-slate-200 border border-[#324f72] transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[#ead04d]" />
              Novo Arquivo
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
