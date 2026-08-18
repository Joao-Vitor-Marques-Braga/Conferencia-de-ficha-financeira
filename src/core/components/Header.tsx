import React from 'react';
import { Calculator, ShieldCheck, FileText, Sparkles, Building2 } from 'lucide-react';

interface HeaderProps {
  onLoadMockData?: () => void;
  onReset?: () => void;
  hasData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoadMockData, onReset, hasData }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Conferência de Ficha Financeira
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center">
              <Building2 className="w-3 h-3 mr-1 text-slate-500" />
              Município de Rio Verde / Sistema Centi • Progressão Salarial (Letra 1 → Letra 2)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {onLoadMockData && (
            <button
              onClick={onLoadMockData}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              title="Carregar exemplo de Ficha Financeira do Centi Rio Verde para teste imediato"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
              Carregar PDF de Exemplo (Centi)
            </button>
          )}

          {hasData && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Novo Arquivo
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
