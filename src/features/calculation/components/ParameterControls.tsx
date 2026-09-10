import React from 'react';
import type { ProgressionParams } from '../../../core/types';
import { Settings, Percent, Calendar, RefreshCw, CalendarDays, Filter, ScrollText, Award, Tag } from 'lucide-react';
import { formatCompetenciaLabel } from '../../../core/utils/formatters';

interface ParameterControlsProps {
  params: ProgressionParams;
  onParamsChange: (newParams: ProgressionParams) => void;
  competencias: string[];
  selectedCompetencias: string[];
  onCompetenciasChange: (comps: string[]) => void;
  onOpenVerbaSelector?: () => void;
  totalVerbasDisponiveis?: number;
  verbasSelecionadasCount?: number;
  onResetParams?: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onParamsChange,
  competencias,
  selectedCompetencias,
  onCompetenciasChange,
  onOpenVerbaSelector,
  totalVerbasDisponiveis = 0,
  verbasSelecionadasCount = 0,
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


  return (
    <div className="solid-card rounded-2xl p-5 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#324f72]/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#008d50]/20 border border-[#008d50]/30 flex items-center justify-center text-[#008d50]">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Parâmetros de Cálculo & Período da Tabela</h3>
            <p className="text-xs text-slate-400">
              Configuração de reajuste, rateio de dias ({selectedCompetencias.length} meses ativos) e rubricas
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenVerbaSelector && (
            <button
              type="button"
              onClick={onOpenVerbaSelector}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-[#1b2a3f] hover:bg-[#233752] rounded-xl border border-[#324f72] transition-all cursor-pointer shadow-xs"
              title="Filtrar e unificar verbas da ficha financeira"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5 text-[#008d50]" />
              Verbas no Cálculo
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#008d50]/20 text-[#008d50] text-[10px] font-black border border-[#008d50]/30">
                {verbasSelecionadasCount}/{totalVerbasDisponiveis}
              </span>
            </button>
          )}

          {onResetParams && (
            <button
              onClick={onResetParams}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#1b2a3f] hover:bg-[#21354f] rounded-xl border border-[#324f72] transition-all cursor-pointer"
              title="Restaurar parâmetros padrão"
            >
              <RefreshCw className="w-3 h-3 mr-1 text-[#ead04d]" /> Padrão
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Legal percentage, Letter transition (Origin -> Destination), and Portaria/Decreto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        
        {/* Progression % - Color #008d50 (Green) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#008d50]/30">
          <label className="text-slate-200 font-bold flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-[#008d50]" /> % Progressão Salarial
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={params.percentualProgressao}
              onChange={(e) => onParamsChange({ ...params, percentualProgressao: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0b131e] border border-[#008d50]/50 rounded-lg px-3 py-1.5 text-white font-extrabold focus:outline-none focus:border-[#008d50] text-sm"
            />
            <span className="absolute right-3 top-2 text-[#008d50] font-black">%</span>
          </div>
          <p className="text-[10px] text-slate-400">Reajuste de nível ({params.letraOrigem || 'Letra 1'} → {params.letraDestino || 'Letra 2'})</p>
        </div>

        {/* Letra Atual (Sai de) - Color #324f72 (Blue) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#324f72]/60">
          <label className="text-slate-200 font-bold flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1 text-[#446995]" /> Letra Atual (Sai de)
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              placeholder="Ex: E"
              value={params.letraOrigem || ''}
              onChange={(e) => onParamsChange({ ...params, letraOrigem: e.target.value.toUpperCase() })}
              className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-1.5 text-white font-black uppercase text-center focus:outline-none focus:border-[#446995] text-sm tracking-wider"
            />
          </div>
          <p className="text-[10px] text-slate-400">Nível / Letra anterior da carreira</p>
        </div>

        {/* Nova Letra (Vai para) - Color #f88543 (Orange) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#f88543]/40">
          <label className="text-slate-200 font-bold flex items-center">
            <Award className="w-3.5 h-3.5 mr-1 text-[#f88543]" /> Nova Letra (Vai para)
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              placeholder="Ex: F"
              value={params.letraDestino || ''}
              onChange={(e) => onParamsChange({ ...params, letraDestino: e.target.value.toUpperCase() })}
              className="w-full bg-[#0b131e] border border-[#f88543]/50 rounded-lg px-3 py-1.5 text-white font-black uppercase text-center focus:outline-none focus:border-[#f88543] text-sm tracking-wider"
            />
          </div>
          <p className="text-[10px] text-slate-400">Nível / Letra promovida</p>
        </div>

        {/* Portaria / Decreto - Input (Requirement 3) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#ead04d]/40">
          <label className="text-slate-200 font-bold flex items-center">
            <ScrollText className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Portaria / Decreto
          </label>
          <input
            type="text"
            placeholder="Ex: Portaria nº 1.234/26"
            value={params.portariaNumero || ''}
            onChange={(e) => onParamsChange({ ...params, portariaNumero: e.target.value })}
            className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-1.5 text-white font-bold focus:outline-none focus:border-[#ead04d] text-xs placeholder:text-slate-500"
          />
          <p className="text-[10px] text-slate-400">Ato normativo no laudo PDF</p>
        </div>

      </div>

      {/* Row 2: Selected Months, Rateio Mode & Data Efetiva / Dias Retroativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs pt-2 border-t border-[#324f72]/30">
        
        {/* Mês Inicial Dropdown */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#324f72]/50">
          <label className="text-slate-200 font-bold flex items-center justify-between">
            <span className="flex items-center text-[#ead04d]">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Mês Inicial (Tabela)
            </span>
          </label>
          <select
            value={params.mesInicial}
            onChange={(e) => handleStartCompChange(e.target.value)}
            className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-1.5 text-white font-extrabold focus:outline-none focus:border-[#ead04d] text-sm"
          >
            {Array.from(new Set(competencias.map(c => c.split('/')[1]))).map(ano => (
              <optgroup key={`start-group-${ano}`} label={`Exercício ${ano}`} className="bg-[#132030] text-[#ead04d] font-bold">
                {competencias
                  .filter(c => c.endsWith(`/${ano}`))
                  .map(comp => (
                    <option key={`start-${comp}`} value={comp} className="bg-[#0b131e] text-white">
                      {formatCompetenciaLabel(comp)} ({comp})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">Início da apuração na ficha</p>
        </div>

        {/* Mês Final Dropdown */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#324f72]/50">
          <label className="text-slate-200 font-bold flex items-center justify-between">
            <span className="flex items-center text-[#ead04d]">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Mês Final (Tabela)
            </span>
          </label>
          <select
            value={params.mesFinal}
            onChange={(e) => handleEndCompChange(e.target.value)}
            className="w-full bg-[#0b131e] border border-[#324f72] rounded-lg px-3 py-1.5 text-white font-extrabold focus:outline-none focus:border-[#ead04d] text-sm"
          >
            {Array.from(new Set(competencias.map(c => c.split('/')[1]))).map(ano => {
              const startIdx = competencias.indexOf(params.mesInicial);
              const validComps = competencias
                .filter(c => c.endsWith(`/${ano}`))
                .filter(c => competencias.indexOf(c) >= startIdx);

              if (validComps.length === 0) return null;

              return (
                <optgroup key={`end-group-${ano}`} label={`Exercício ${ano}`} className="bg-[#132030] text-[#ead04d] font-bold">
                  {validComps.map(comp => (
                    <option key={`end-${comp}`} value={comp} className="bg-[#0b131e] text-white">
                      {formatCompetenciaLabel(comp)} ({comp})
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <p className="text-[10px] text-slate-400">Término da apuração na ficha</p>
        </div>

        {/* Rateio de Dias Retroativos (Mês 1) */}
        <div className="space-y-1.5 bg-[#0f1a27] p-3 rounded-xl border border-[#f88543]/40">
          <label className="text-slate-200 font-bold flex items-center text-[#f88543]">
            <CalendarDays className="w-3.5 h-3.5 mr-1 text-[#f88543]" /> Rateio de Dias (Mês 1)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={30}
              value={params.diasRetroativos ?? 30}
              onChange={(e) => onParamsChange({
                ...params,
                modoRateio: 'DIAS_MANUAIS',
                diasRetroativos: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1))
              })}
              className="w-full bg-[#0b131e] border border-[#f88543]/50 rounded-lg px-3 py-1.5 text-white font-extrabold focus:outline-none focus:border-[#f88543] text-sm"
            />
            <span className="absolute right-3 top-1.5 text-slate-400 font-bold text-xs">dias (mês inicial)</span>
          </div>
          <p className="text-[10px] text-slate-400">Proporcional fixo sobre base de 30 dias (ex: 30 = integral)</p>
        </div>

      </div>

    </div>
  );
};

