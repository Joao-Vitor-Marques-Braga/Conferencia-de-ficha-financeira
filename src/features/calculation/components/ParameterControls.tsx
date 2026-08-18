import React from 'react';
import type { ProgressionParams } from '../../../core/types';
import { Settings, Percent, Calendar, Clock, RefreshCw } from 'lucide-react';
import { formatCompetenciaLabel } from '../../../core/utils/formatters';

interface ParameterControlsProps {
  params: ProgressionParams;
  onParamsChange: (newParams: ProgressionParams) => void;
  competencias: string[];
  selectedCompetencias: string[];
  onCompetenciasChange: (comps: string[]) => void;
  onResetParams?: () => void;
}

// Helpers for <input type="month"> (Format: "YYYY-MM") <-> "MM/YYYY"
const competenciaToMonthInput = (comp: string): string => {
  if (!comp || !comp.includes('/')) return '';
  const [m, y] = comp.split('/');
  return `${y}-${m.padStart(2, '0')}`;
};

const monthInputToCompetencia = (val: string): string => {
  if (!val || !val.includes('-')) return '';
  const [y, m] = val.split('-');
  return `${m}/${y}`;
};

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onParamsChange,
  competencias,
  onCompetenciasChange,
  onResetParams
}) => {

  const minMonth = competencias.length > 0 ? competenciaToMonthInput(competencias[0]) : undefined;
  const maxMonth = competencias.length > 0 ? competenciaToMonthInput(competencias[competencias.length - 1]) : undefined;

  const handleMonthInputStartChange = (val: string) => {
    if (!val) return;
    const newMesInicial = monthInputToCompetencia(val);
    
    // Check if newMesInicial is after current mesFinal
    let newMesFinal = params.mesFinal;
    const startIdx = competencias.indexOf(newMesInicial);
    const endIdx = competencias.indexOf(newMesFinal);

    if (startIdx !== -1 && (endIdx < startIdx || endIdx === -1)) {
      newMesFinal = newMesInicial;
    }

    const finalStartIdx = competencias.indexOf(newMesInicial);
    const finalEndIdx = competencias.indexOf(newMesFinal);

    let newSelected: string[] = [];
    if (finalStartIdx !== -1 && finalEndIdx !== -1) {
      newSelected = competencias.slice(finalStartIdx, finalEndIdx + 1);
    } else {
      newSelected = competencias.filter(c => c === newMesInicial || c === newMesFinal);
      if (newSelected.length === 0) newSelected = [newMesInicial];
    }

    onParamsChange({ ...params, mesInicial: newMesInicial, mesFinal: newMesFinal });
    onCompetenciasChange(newSelected);
  };

  const handleMonthInputEndChange = (val: string) => {
    if (!val) return;
    const newMesFinal = monthInputToCompetencia(val);
    
    const startIdx = competencias.indexOf(params.mesInicial);
    const endIdx = competencias.indexOf(newMesFinal);

    let newSelected: string[] = [];
    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      newSelected = competencias.slice(startIdx, endIdx + 1);
    } else {
      newSelected = [params.mesInicial, newMesFinal];
    }

    onParamsChange({ ...params, mesFinal: newMesFinal });
    onCompetenciasChange(newSelected);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Parâmetros de Cálculo & Período</h3>
            <p className="text-xs text-slate-400">Ajuste os percentuais legais e o intervalo de meses para apuração</p>
          </div>
        </div>

        {onResetParams && (
          <button
            onClick={onResetParams}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 transition-all"
            title="Restaurar parâmetros padrão"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Padrão
          </button>
        )}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Progression % */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-emerald-400" /> % Progressão Salarial
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={params.percentualProgressao}
              onChange={(e) => onParamsChange({ ...params, percentualProgressao: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-500">Reajuste de nível/letra (ex: Letra 1 → Letra 2)</p>
        </div>

        {/* ATS % */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-blue-400" /> % ATS (Anuênio/Triênio)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={params.percentualATS}
              onChange={(e) => onParamsChange({ ...params, percentualATS: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-500">Adicional de Tempo de Serviço (Verba 149)</p>
        </div>

        {/* Titulacao / Incentivo % */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-indigo-400" /> % Titulação / Incentivo
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={params.percentualTitulacao}
              onChange={(e) => onParamsChange({ ...params, percentualTitulacao: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-500">Incentivo Funcional (Verba 104)</p>
        </div>

        {/* Divisor de Jornada */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" /> Divisor de Carga Horária
          </label>
          <select
            value={params.divisorJornada}
            onChange={(e) => onParamsChange({ ...params, divisorJornada: parseInt(e.target.value, 10) as 150 | 200 | 220 })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm"
          >
            <option value={150}>150 Horas (30h/semana)</option>
            <option value={200}>200 Horas (40h/semana)</option>
            <option value={220}>220 Horas (44h/semana)</option>
          </select>
          <p className="text-[10px] text-slate-500">Base para Horas Extras e Adicional Noturno</p>
        </div>

      </div>

      {/* Row 2: Competencias Period Selection & Reflex Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-800/80">
        
        {/* Mes Inicial - Calendar Month Picker */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center justify-between">
            <span className="flex items-center text-blue-400">
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" /> Mês/Ano Inicial
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatCompetenciaLabel(params.mesInicial)}
            </span>
          </label>
          <input
            type="month"
            min={minMonth}
            max={maxMonth}
            value={competenciaToMonthInput(params.mesInicial)}
            onChange={(e) => handleMonthInputStartChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm color-scheme-dark"
          />
        </div>

        {/* Mes Final - Calendar Month Picker */}
        <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="text-slate-300 font-semibold flex items-center justify-between">
            <span className="flex items-center text-blue-400">
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" /> Mês/Ano Final
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatCompetenciaLabel(params.mesFinal)}
            </span>
          </label>
          <input
            type="month"
            min={competenciaToMonthInput(params.mesInicial) || minMonth}
            max={maxMonth}
            value={competenciaToMonthInput(params.mesFinal)}
            onChange={(e) => handleMonthInputEndChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-blue-500 text-sm color-scheme-dark"
          />
        </div>

        {/* Reflexes Checkboxes */}
        <div className="flex flex-col justify-center space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-200 font-medium">
            <input
              type="checkbox"
              checked={params.aplicarReflexo13}
              onChange={(e) => onParamsChange({ ...params, aplicarReflexo13: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
            />
            <span>Reflexo em 13º Salário (1/12 por mês)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-200 font-medium">
            <input
              type="checkbox"
              checked={params.aplicarReflexoFerias}
              onChange={(e) => onParamsChange({ ...params, aplicarReflexoFerias: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0"
            />
            <span>Reflexo em Férias + 1/3 (Constitucional)</span>
          </label>
        </div>

      </div>

    </div>
  );
};
