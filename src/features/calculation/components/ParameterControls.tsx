import React from 'react';
import type { ProgressionParams } from '../../../core/types';
import { Settings, Percent, Calendar, Clock, RefreshCw, CalendarDays } from 'lucide-react';
import { formatCompetenciaLabel } from '../../../core/utils/formatters';

interface ParameterControlsProps {
  params: ProgressionParams;
  onParamsChange: (newParams: ProgressionParams) => void;
  competencias: string[];
  selectedCompetencias: string[];
  onCompetenciasChange: (comps: string[]) => void;
  onResetParams?: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onParamsChange,
  competencias,
  selectedCompetencias,
  onCompetenciasChange,
  onResetParams
}) => {

  const handleStartCompChange = (newStart: string) => {
    if (!newStart) return;
    const startIdx = competencias.indexOf(newStart);
    let endIdx = competencias.indexOf(params.mesFinal);

    let newMesFinal = params.mesFinal;
    if (endIdx < startIdx || endIdx === -1) {
      newMesFinal = competencias[competencias.length - 1] || newStart;
      endIdx = competencias.indexOf(newMesFinal);
    }

    const newSelected = (startIdx !== -1 && endIdx !== -1)
      ? competencias.slice(startIdx, endIdx + 1)
      : [newStart];

    onParamsChange({ ...params, mesInicial: newStart, mesFinal: newMesFinal });
    onCompetenciasChange(newSelected);
  };

  const handleEndCompChange = (newEnd: string) => {
    if (!newEnd) return;
    const startIdx = competencias.indexOf(params.mesInicial);
    const endIdx = competencias.indexOf(newEnd);

    const newSelected = (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx)
      ? competencias.slice(startIdx, endIdx + 1)
      : [params.mesInicial, newEnd];

    onParamsChange({ ...params, mesFinal: newEnd });
    onCompetenciasChange(newSelected);
  };

  // Proportionality calculation for info badge
  const numMonths = selectedCompetencias.length;
  const diasMesInicial = params.diasRetroativos ?? 30;
  const totalDias = numMonths > 1
    ? (numMonths - 1) * 30 + diasMesInicial
    : diasMesInicial;
  const mesesEquiv = numMonths > 1
    ? ((numMonths - 1) + (diasMesInicial / 30)).toFixed(2).replace('.00', '').replace('.', ',')
    : (diasMesInicial / 30).toFixed(2).replace('.00', '').replace('.', ',');

  return (
    <div className="solid-card rounded-2xl p-5 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#324f72]/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#008d50]/20 border border-[#008d50]/30 flex items-center justify-center text-[#008d50]">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Parâmetros de Cálculo & Período da Tabela</h3>
            <p className="text-xs text-slate-400">Meses extraídos diretamente da Ficha Financeira e dias retroativos</p>
          </div>
        </div>

        {onResetParams && (
          <button
            onClick={onResetParams}
            className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-[#1b2a3f] hover:bg-[#21354f] rounded-lg border border-[#324f72] transition-all cursor-pointer"
            title="Restaurar parâmetros padrão"
          >
            <RefreshCw className="w-3 h-3 mr-1 text-[#ead04d]" /> Padrão
          </button>
        )}
      </div>

      {/* Row 1: Legal percentages & Hours divisor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Progression % - Color #008d50 (Green) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#008d50]/30">
          <label className="text-slate-200 font-bold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-[#008d50]" /> % Progressão Salarial
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={params.percentualProgressao}
              onChange={(e) => onParamsChange({ ...params, percentualProgressao: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0b131e] border border-[#008d50]/50 rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#008d50] text-sm"
            />
            <span className="absolute right-3 top-2.5 text-[#008d50] font-black">%</span>
          </div>
          <p className="text-[10px] text-slate-400">Reajuste de nível (Letra 1 → Letra 2)</p>
        </div>

        {/* ATS % - Color #324f72 (Navy Blue) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#324f72]/60">
          <label className="text-slate-200 font-bold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-[#446995]" /> % ATS (Anuênio/Triênio)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={params.percentualATS}
              onChange={(e) => onParamsChange({ ...params, percentualATS: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#446995] text-sm"
            />
            <span className="absolute right-3 top-2.5 text-[#446995] font-black">%</span>
          </div>
          <p className="text-[10px] text-slate-400">Tempo de Serviço (Verba 149)</p>
        </div>

        {/* Titulacao / Incentivo % - Color #f88543 (Orange) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#f88543]/40">
          <label className="text-slate-200 font-bold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-[#f88543]" /> % Titulação / Incentivo
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={params.percentualTitulacao}
              onChange={(e) => onParamsChange({ ...params, percentualTitulacao: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0b131e] border border-[#f88543]/50 rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#f88543] text-sm"
            />
            <span className="absolute right-3 top-2.5 text-[#f88543] font-black">%</span>
          </div>
          <p className="text-[10px] text-slate-400">Incentivo Funcional (Verba 104)</p>
        </div>

        {/* Divisor de Jornada - Color #ead04d (Yellow/Gold) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#ead04d]/40">
          <label className="text-slate-200 font-bold flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Divisor de Carga Horária
          </label>
          <select
            value={params.divisorJornada}
            onChange={(e) => onParamsChange({ ...params, divisorJornada: parseInt(e.target.value, 10) as 150 | 200 | 220 })}
            className="w-full bg-[#0b131e] border border-[#ead04d]/50 rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#ead04d] text-sm"
          >
            <option value={150}>150 Horas (30h/semana)</option>
            <option value={200}>200 Horas (40h/semana)</option>
            <option value={220}>220 Horas (44h/semana)</option>
          </select>
          <p className="text-[10px] text-slate-400">Base de Horas Extras e Noturno</p>
        </div>

      </div>

      {/* Row 2: Selected Months from Table & Dias Retroativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs pt-2 border-t border-[#324f72]/30">
        
        {/* Mês Inicial Dropdown (strictly extracted months) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#324f72]/50">
          <label className="text-slate-200 font-bold flex items-center justify-between">
            <span className="flex items-center text-[#ead04d]">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Mês Inicial (Tabela)
            </span>
          </label>
          <select
            value={params.mesInicial}
            onChange={(e) => handleStartCompChange(e.target.value)}
            className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#ead04d] text-sm"
          >
            {competencias.map((comp) => (
              <option key={comp} value={comp}>
                {formatCompetenciaLabel(comp)} ({comp})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">Início da apuração na ficha</p>
        </div>

        {/* Mês Final Dropdown (strictly extracted months) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#324f72]/50">
          <label className="text-slate-200 font-bold flex items-center justify-between">
            <span className="flex items-center text-[#ead04d]">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Mês Final (Tabela)
            </span>
          </label>
          <select
            value={params.mesFinal}
            onChange={(e) => handleEndCompChange(e.target.value)}
            className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#ead04d] text-sm"
          >
            {competencias
              .filter((comp) => {
                const startIdx = competencias.indexOf(params.mesInicial);
                const curIdx = competencias.indexOf(comp);
                return curIdx >= startIdx;
              })
              .map((comp) => (
                <option key={comp} value={comp}>
                  {formatCompetenciaLabel(comp)} ({comp})
                </option>
              ))}
          </select>
          <p className="text-[10px] text-slate-400">Término da apuração na ficha</p>
        </div>

        {/* Dias Retroativos no Mês Inicial */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3.5 rounded-xl border border-[#f88543]/40">
          <label className="text-slate-200 font-bold flex items-center justify-between">
            <span className="flex items-center text-[#f88543]">
              <CalendarDays className="w-3.5 h-3.5 mr-1 text-[#f88543]" /> Dias Retroativos
            </span>
            <span className="text-[10px] text-[#f88543] font-mono font-bold">
              {totalDias} dias tot.
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={30}
              value={params.diasRetroativos ?? 30}
              onChange={(e) => onParamsChange({
                ...params,
                diasRetroativos: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1))
              })}
              className="w-full bg-[#0b131e] border border-[#f88543]/50 rounded-lg px-3 py-2 text-white font-extrabold focus:outline-none focus:border-[#f88543] text-sm"
            />
            <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">dias (mês inicial)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            {diasMesInicial === 30 ? '30 dias (mês integral)' : `Proporcional: ${diasMesInicial}/30 avos (${mesesEquiv} meses)`}
          </p>
        </div>

        {/* Reflexes Checkboxes */}
        <div className="flex flex-col justify-center space-y-2 bg-[#0f1a27] p-3 rounded-xl border border-[#324f72]/40">
          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-200 font-bold text-xs">
            <input
              type="checkbox"
              checked={params.aplicarReflexo13}
              onChange={(e) => onParamsChange({ ...params, aplicarReflexo13: e.target.checked })}
              className="rounded bg-[#0b131e] border-[#324f72] text-[#008d50] focus:ring-0 accent-[#008d50] w-4 h-4 cursor-pointer"
            />
            <span>Reflexo 13º Salário</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-200 font-bold text-xs">
            <input
              type="checkbox"
              checked={params.aplicarReflexoFerias}
              onChange={(e) => onParamsChange({ ...params, aplicarReflexoFerias: e.target.checked })}
              className="rounded bg-[#0b131e] border-[#324f72] text-[#008d50] focus:ring-0 accent-[#008d50] w-4 h-4 cursor-pointer"
            />
            <span>Reflexo Férias + 1/3</span>
          </label>
        </div>

      </div>

    </div>
  );
};
