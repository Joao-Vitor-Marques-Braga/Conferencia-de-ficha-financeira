import React from 'react';
import type { ProgressionSummary } from '../../../core/types';
import { formatCurrency } from '../../../core/utils/formatters';
import { TrendingUp, DollarSign, CalendarDays, Gift, Award } from 'lucide-react';

interface SummaryMetricsCardsProps {
  summary: ProgressionSummary;
}

export const SummaryMetricsCards: React.FC<SummaryMetricsCardsProps> = ({ summary }) => {
  const qtdMeses = summary.qtdMesesEquivalentes;
  const totalDias = summary.totalDiasRetroativos;
  const numCompetencias = summary.competenciasSelecionadas.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      
      {/* Card 1: Diferença Acumulada - #324f72 (Navy Blue) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#324f72] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
            Diferença Acumulada
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#324f72]/30 text-[#446995] flex items-center justify-center border border-[#324f72]/40">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(summary.totalDiferencaAcumulada)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center font-medium">
            <CalendarDays className="w-3.5 h-3.5 mr-1 text-[#446995]" />
            {formatCurrency(summary.totalDiferencaMensal)}/mês × {qtdMeses} {qtdMeses === 1 ? 'mês' : 'meses'} ({totalDias} dias)
          </p>
        </div>
      </div>

      {/* Card 2: Letra 1 vs Letra 2 - #f88543 (Orange) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#f88543] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-[#f88543] uppercase tracking-wider">
            Folha Mensal (L1 → L2)
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#f88543]/20 text-[#f88543] flex items-center justify-center border border-[#f88543]/40">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Letra 1 (Atual):</span>
            <span className="font-bold text-slate-200">{formatCurrency(summary.totalLetra1Mensal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#f88543] font-bold">Letra 2 (Progressão):</span>
            <span className="font-extrabold text-[#f88543]">{formatCurrency(summary.totalLetra2Mensal)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Reflexos 13º e Ferias - #ead04d (Yellow/Gold) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#ead04d] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-[#ead04d] uppercase tracking-wider">
            Reflexos Constitucionais
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#ead04d]/20 text-[#ead04d] flex items-center justify-center border border-[#ead04d]/40">
            <Gift className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#ead04d]">
            {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1 font-medium">
            <span>13º: <strong className="text-white font-bold">{formatCurrency(summary.totalReflexo13)}</strong></span>
            <span>Férias 1/3: <strong className="text-white font-bold">{formatCurrency(summary.totalReflexoFerias)}</strong></span>
          </div>
        </div>
      </div>

      {/* Card 4: Grand Total - #008d50 (Rio Verde Green) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#008d50] bg-[#0f1f1a] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-[#008d50] uppercase tracking-wider">
            Total Geral Devido
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#008d50] text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#008d50] tracking-tight">
            {formatCurrency(summary.grandTotal)}
          </div>
          <p className="text-[11px] text-slate-300 mt-1 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008d50]"></span>
            {numCompetencias} {numCompetencias === 1 ? 'mês apurado' : 'meses apurados'} ({totalDias} dias retroativos)
          </p>
        </div>
      </div>

    </div>
  );
};
