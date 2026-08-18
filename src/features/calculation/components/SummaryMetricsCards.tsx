import React from 'react';
import type { ProgressionSummary } from '../../../core/types';
import { formatCurrency } from '../../../core/utils/formatters';
import { TrendingUp, DollarSign, CalendarDays, Gift, Award } from 'lucide-react';

interface SummaryMetricsCardsProps {
  summary: ProgressionSummary;
}

export const SummaryMetricsCards: React.FC<SummaryMetricsCardsProps> = ({ summary }) => {
  const qtdMeses = summary.competenciasSelecionadas.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      
      {/* Card 1: Diferenca Acumulada */}
      <div className="glass-card rounded-2xl p-4 border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900/90 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Diferença Salarial Acumulada</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(summary.totalDiferencaAcumulada)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center">
            <CalendarDays className="w-3 h-3 mr-1 text-slate-500" />
            {formatCurrency(summary.totalDiferencaMensal)}/mês × {qtdMeses} {qtdMeses === 1 ? 'mês' : 'meses'}
          </p>
        </div>
      </div>

      {/* Card 2: Letra 1 vs Letra 2 */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folha Mensal (Letra 1 → 2)</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Letra 1 (Atual):</span>
            <span className="font-semibold text-slate-300">{formatCurrency(summary.totalLetra1Mensal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">Letra 2 (Progressão):</span>
            <span className="font-bold text-emerald-400">{formatCurrency(summary.totalLetra2Mensal)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Reflexos 13º e Ferias */}
      <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-900/90">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Reflexos Constitucionais</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Gift className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-amber-300">
            {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>13º: {formatCurrency(summary.totalReflexo13)}</span>
            <span>Férias 1/3: {formatCurrency(summary.totalReflexoFerias)}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Grand Total */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950/90 glow-emerald">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Total Geral Devido</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center border border-emerald-400/40">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(summary.grandTotal)}
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">
            Diferenças Acumuladas + Reflexos Legais
          </p>
        </div>
      </div>

    </div>
  );
};
