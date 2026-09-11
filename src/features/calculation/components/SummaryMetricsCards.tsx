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
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#1e3a5f] dark:border-l-[#324f72] shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Diferença Acumulada
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#1e3a5f] border border-slate-200 dark:bg-[#324f72]/30 dark:text-[#446995] flex items-center justify-center dark:border-[#324f72]/40 transition-colors">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
            {formatCurrency(summary.totalDiferencaAcumulada)}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center font-medium transition-colors">
            <CalendarDays className="w-3.5 h-3.5 mr-1 text-[#1e3a5f] dark:text-[#446995]" />
            {formatCurrency(summary.totalDiferencaMensal)}/mês × {qtdMeses} {qtdMeses === 1 ? 'mês' : 'meses'} ({totalDias} dias)
          </p>
        </div>
      </div>

      {/* Card 2: Letra 1 vs Letra 2 - #f88543 (Orange) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#ea580c] dark:border-l-[#f88543] shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-orange-800 dark:text-[#f88543] uppercase tracking-wider transition-colors">
            Folha Mensal (L1 → L2)
          </span>
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 dark:bg-[#f88543]/20 dark:text-[#f88543] flex items-center justify-center dark:border-[#f88543]/40 transition-colors">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold transition-colors">Letra 1 (Atual):</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 transition-colors">{formatCurrency(summary.totalLetra1Mensal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-800 dark:text-[#f88543] font-bold transition-colors">Letra 2 (Progressão):</span>
            <span className="font-extrabold text-orange-900 dark:text-[#f88543] transition-colors">{formatCurrency(summary.totalLetra2Mensal)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Reflexos 13º e Férias - #ead04d (Yellow/Gold) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-amber-600 dark:border-l-[#ead04d] shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-amber-800 dark:text-[#ead04d] uppercase tracking-wider transition-colors">
            Reflexos Constitucionais
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 dark:bg-[#ead04d]/20 dark:text-[#ead04d] flex items-center justify-center dark:border-[#ead04d]/40 transition-colors">
            <Gift className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-800 dark:text-[#ead04d] transition-colors">
            {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium transition-colors">
            <span>13º: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(summary.totalReflexo13)}</strong></span>
            <span>Férias 1/3: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(summary.totalReflexoFerias)}</strong></span>
          </div>
        </div>
      </div>

      {/* Card 4: Grand Total - #008d50 (Rio Verde Green) */}
      <div className="solid-card rounded-2xl p-4.5 border-l-4 border-l-[#008d50] bg-emerald-50/70 dark:bg-[#0f1f1a] shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-emerald-800 dark:text-[#008d50] uppercase tracking-wider transition-colors">
            Total Geral Devido
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#008d50] text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-700 dark:text-[#008d50] tracking-tight transition-colors">
            {formatCurrency(summary.grandTotal)}
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 font-bold flex items-center gap-1 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008d50]"></span>
            {numCompetencias} {numCompetencias === 1 ? 'mês apurado' : 'meses apurados'} ({totalDias} dias retroativos)
          </p>
        </div>
      </div>

    </div>
  );
};
