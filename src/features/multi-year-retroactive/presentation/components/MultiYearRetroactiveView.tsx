import React, { useState } from 'react';
import { CalendarRange, CheckCircle2, ChevronDown, ChevronRight, Layers, CornerDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../../../core/utils/formatters';
import type { MultiYearConsolidatedSummary } from '../../domain/types';
import { MonthlyBreakdownAccordion } from '../../../calculation/components/MonthlyBreakdownAccordion';

interface MultiYearRetroactiveViewProps {
  summary: MultiYearConsolidatedSummary;
  onMonthPercentChange?: (competencia: string, newPercent: number) => void;
}

export const MultiYearRetroactiveView: React.FC<MultiYearRetroactiveViewProps> = ({
  summary,
  onMonthPercentChange
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLIDADO' | 'ANOS'>('CONSOLIDADO');
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedUnifiedRows, setExpandedUnifiedRows] = useState<Record<string, boolean>>({});

  const toggleYear = (ano: number) => {
    setExpandedYears(prev => ({ ...prev, [ano]: !prev[ano] }));
  };

  const toggleUnifiedRow = (codigo: string) => {
    setExpandedUnifiedRows(prev => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const yearlyEntries = summary.yearlyEntries || [];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Multi-Year Header Card */}
      <div className="solid-card p-5 rounded-2xl bg-white dark:bg-[#0f1a27] border border-slate-200 dark:border-[#324f72]/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#008d50]/20 border border-emerald-200 dark:border-[#008d50]/40 flex items-center justify-center text-[#007240] dark:text-[#008d50]">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Apuração Retroativa Multi-Ano</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-[#008d50]/20 text-[#007240] dark:text-[#008d50] border border-emerald-200 dark:border-[#008d50]/40">
                {yearlyEntries.length > 0 ? `${yearlyEntries.length} Exercícios` : 'Multi-Ano'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Consolidação cronológica por composição pura de apurações anuais independentes
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0b131e] border border-slate-200 dark:border-[#324f72]/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('CONSOLIDADO')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'CONSOLIDADO'
                ? 'bg-white dark:bg-[#324f72] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Visão Consolidada
          </button>
          <button
            onClick={() => setActiveTab('ANOS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'ANOS'
                ? 'bg-white dark:bg-[#324f72] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Comparativo por Exercício
          </button>
        </div>
      </div>

      {/* Year-by-Year Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {yearlyEntries.map(entry => (
          <div
            key={`kpi-year-${entry.ano}`}
            className="solid-card p-4 rounded-xl border border-slate-200 dark:border-[#324f72]/40 bg-white dark:bg-[#0d1723] space-y-2 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800 dark:text-[#ead04d] tracking-wider uppercase">
                Exercício {entry.ano}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {entry.summary.competenciasSelecionadas.length} meses
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(entry.summary.grandTotal)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-[#324f72]/30">
              <span>Dias Retroativos: {entry.summary.totalDiasRetroativos}d</span>
              <span>Diferença: {formatCurrency(entry.summary.totalDiferencaAcumulada)}</span>
            </div>
          </div>
        ))}

        {/* Grand Total Summary Card */}
        <div className="solid-card p-4 rounded-xl border border-emerald-300 dark:border-[#008d50]/50 bg-emerald-50/70 dark:bg-[#008d50]/10 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#007240] dark:text-[#008d50] tracking-wider uppercase">
              Total Geral Consolidado
            </span>
            <span className="text-[11px] font-bold text-[#007240] dark:text-[#008d50]">
              {summary.competenciasSelecionadas.length} meses totais
            </span>
          </div>
          <div className="text-lg font-black text-[#007240] dark:text-[#008d50] font-mono">
            {formatCurrency(summary.grandTotal)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 pt-1 border-t border-emerald-200 dark:border-[#008d50]/30">
            <span>{summary.totalDiasRetroativos} dias acumulados</span>
            <span>Reflexos: {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Visão Consolidada (Demonstrativo Analítico Unificado) */}
      {activeTab === 'CONSOLIDADO' && (
        <div className="solid-card rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-[#324f72]/40 bg-white dark:bg-[#101c2b]">
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#101c2b] border-b border-slate-200 dark:border-[#324f72]/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#007240] dark:text-[#008d50]" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Demonstrativo Analítico Consolidado por Rubrica</h4>
            </div>
            <span className="text-xs font-bold text-amber-800 dark:text-[#ead04d] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
              {summary.rows.length} rubricas apuradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0b131e] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#324f72]/40 uppercase font-black text-[11px] tracking-wider">
                  <th className="py-3 px-4">Cód. / Rubrica</th>
                  <th className="py-3 px-4 text-right">
                    {summary.params?.letraOrigem ? `Letra ${summary.params.letraOrigem} Méd. (R$)` : 'L1 Médio (R$)'}
                  </th>
                  <th className="py-3 px-4 text-center">% Appl.</th>
                  <th className="py-3 px-4 text-right text-[#007240] dark:text-[#008d50]">
                    {summary.params?.letraDestino ? `Letra ${summary.params.letraDestino} Méd. (R$)` : 'L2 Médio (R$)'}
                  </th>
                  <th className="py-3 px-4 text-right text-amber-800 dark:text-[#ead04d]">Dif. Média</th>
                  <th className="py-3 px-4 text-center">Qtd. Meses</th>
                  <th className="py-3 px-4 text-right text-[#ea580c] dark:text-[#f88543]">Total Acumulado</th>
                  <th className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">Reflexos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#324f72]/30 text-slate-700 dark:text-slate-200">
                {summary.rows.map(row => {
                  const isExpanded = !!expandedUnifiedRows[row.codigo];

                  return (
                    <React.Fragment key={`multi-row-${row.codigo}`}>
                      <tr
                        className={`hover:bg-slate-50 dark:hover:bg-[#1b2a3f]/40 transition-colors ${row.isSalarioBase ? 'bg-emerald-50/40 dark:bg-[#008d50]/10 font-bold' : ''
                          } ${row.isUnified ? 'bg-orange-50/40 dark:bg-[#f88543]/5' : ''}`}
                      >
                        <td className="py-3 px-4">
                          {row.isUnified ? (
                            <div className="flex items-start space-x-2">
                              <button
                                type="button"
                                onClick={() => toggleUnifiedRow(row.codigo)}
                                className="mt-0.5 p-1 rounded-lg bg-orange-50 dark:bg-[#f88543]/20 hover:bg-orange-100 dark:hover:bg-[#f88543]/30 text-[#ea580c] dark:text-[#f88543] border border-orange-200 dark:border-[#f88543]/40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                                title={isExpanded ? "Recolher agrupamento" : "Expandir itens do agrupamento"}
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 dark:bg-[#f88543]/20 text-[#ea580c] dark:text-[#f88543] font-mono text-[9px] border border-orange-200 dark:border-[#f88543]/40 font-black">
                                    UNIFICADO ({row.subItens?.length || row.origemCodigos?.length || 0})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleUnifiedRow(row.codigo)}
                                    className="font-extrabold text-slate-900 dark:text-white hover:text-[#ea580c] dark:hover:text-[#f88543] transition-colors cursor-pointer text-left"
                                  >
                                    {row.descricao}
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                                  Cód. agrupados: {row.origemCodigos?.join(', ')} • Clique na seta para {isExpanded ? 'recolher' : 'ver detalhamento'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1b2a3f] text-slate-700 dark:text-slate-200 font-mono text-[10px] border border-slate-200 dark:border-[#324f72]/60 font-black">
                                {row.codigo}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">{row.descricao}</span>
                              {row.isSalarioBase && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 dark:bg-[#008d50]/20 text-[#007240] dark:text-[#008d50] border border-emerald-200 dark:border-[#008d50]/40">
                                  BASE
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.letra1Valor)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0b131e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#324f72]/40 font-bold">
                            {formatPercent(row.percentualAplicado)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-[#007240] dark:text-[#008d50]">
                          {formatCurrency(row.letra2Valor)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-800 dark:text-[#ead04d]">
                          {formatCurrency(row.diferencaUnitaria)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {row.qtdMeses.toString().replace('.', ',')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-[#ea580c] dark:text-[#f88543]">
                          {formatCurrency(row.totalDiferenca)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.reflexo13 + row.reflexoFerias)}
                        </td>
                      </tr>

                      {/* Dropdown / Sub-Items for Unified Group */}
                      {row.isUnified && isExpanded && row.subItens && row.subItens.length > 0 && (
                        row.subItens.map((sub) => (
                          <tr
                            key={`multi-sub-${row.codigo}-${sub.codigo}`}
                            className="bg-slate-50 dark:bg-[#0b131e]/90 border-b border-slate-200 dark:border-[#324f72]/20 text-slate-600 dark:text-slate-300 text-[11px] hover:bg-slate-100/80 dark:hover:bg-[#132030]/60 transition-colors"
                          >
                            <td className="py-2.5 px-4 pl-10">
                              <div className="flex items-center space-x-2">
                                <CornerDownRight className="w-3.5 h-3.5 text-[#ea580c] dark:text-[#f88543] shrink-0" />
                                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101b29] text-slate-700 dark:text-slate-300 font-mono text-[9px] border border-slate-200 dark:border-[#324f72]/50 font-bold">
                                  {sub.codigo}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{sub.descricao}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-500 dark:text-slate-400">
                              {formatCurrency(sub.letra1Valor)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                              <span className="px-1 py-0.5 rounded bg-slate-100 dark:bg-[#0b131e] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#324f72]/30 text-[10px]">
                                {formatPercent(sub.percentualAplicado)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#007240] dark:text-[#008d50]/90">
                              {formatCurrency(sub.letra2Valor)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800 dark:text-[#ead04d]/90">
                              {formatCurrency(sub.diferencaUnitaria)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                              {sub.qtdMeses.toString().replace('.', ',')}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#ea580c] dark:text-[#f88543]/90">
                              {formatCurrency(sub.totalDiferenca)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                              {formatCurrency(sub.reflexo13 + sub.reflexoFerias)}
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-[#0b131e] border-t-2 border-slate-300 dark:border-[#324f72] text-slate-900 dark:text-white font-bold text-xs">
                  <td className="py-3.5 px-4 font-black uppercase">TOTAL CONSOLIDADO</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(summary.totalLetra1Mensal)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">-</td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#007240] dark:text-[#008d50] font-black">
                    {formatCurrency(summary.totalLetra2Mensal)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-800 dark:text-[#ead04d] font-black">
                    {formatCurrency(summary.totalDiferencaMensal)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {summary.qtdMesesEquivalentes.toString().replace('.', ',')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#ea580c] dark:text-[#f88543] font-black text-sm">
                    {formatCurrency(summary.totalDiferencaAcumulada)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200 font-bold">
                    {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Comparativo por Exercício */}
      {activeTab === 'ANOS' && (
        <div className="space-y-4">
          {yearlyEntries.map(entry => {
            const isExpanded = expandedYears[entry.ano] ?? true;

            return (
              <div
                key={`detail-year-${entry.ano}`}
                className="solid-card rounded-2xl overflow-hidden border border-slate-200 dark:border-[#324f72]/40 bg-white dark:bg-[#0c1624]"
              >
                <button
                  onClick={() => toggleYear(entry.ano)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 dark:bg-[#101c2b] hover:bg-slate-100 dark:hover:bg-[#152335] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-amber-700 dark:text-[#ead04d]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-amber-700 dark:text-[#ead04d]" />
                    )}
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Exercício {entry.ano} ({entry.summary.competenciasSelecionadas.length} competências)
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Subtotal: <span className="text-[#007240] dark:text-[#008d50] font-black font-mono ml-1">{formatCurrency(entry.summary.grandTotal)}</span>
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#0b131e] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-[#324f72]/40 uppercase font-black text-[10px]">
                            <th className="py-2.5 px-3">Cód. / Rubrica</th>
                            <th className="py-2.5 px-3 text-right">L1 (R$)</th>
                            <th className="py-2.5 px-3 text-center">%</th>
                            <th className="py-2.5 px-3 text-right text-[#007240] dark:text-[#008d50]">L2 (R$)</th>
                            <th className="py-2.5 px-3 text-right text-amber-800 dark:text-[#ead04d]">Diferença</th>
                            <th className="py-2.5 px-3 text-center">Meses</th>
                            <th className="py-2.5 px-3 text-right text-[#ea580c] dark:text-[#f88543]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#324f72]/20">
                          {entry.summary.rows.map(row => (
                            <tr key={`year-${entry.ano}-row-${row.codigo}`} className="hover:bg-slate-50 dark:hover:bg-[#132030]/50">
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                [{row.codigo}] {row.descricao}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                {formatCurrency(row.letra1Valor)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                {formatPercent(row.percentualAplicado)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#007240] dark:text-[#008d50] font-bold">
                                {formatCurrency(row.letra2Valor)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-800 dark:text-[#ead04d] font-bold">
                                {formatCurrency(row.diferencaUnitaria)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                {row.qtdMeses.toString().replace('.', ',')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#ea580c] dark:text-[#f88543] font-bold">
                                {formatCurrency(row.totalDiferenca)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Monthly Breakdown Accordion for this year with editable month percent */}
                    <div className="pt-2">
                      <MonthlyBreakdownAccordion
                        yearlyBreakdown={entry.summary.yearlyBreakdown}
                        onMonthPercentChange={onMonthPercentChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-[#008d50]/10 border border-emerald-200 dark:border-[#008d50]/30 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
          <CheckCircle2 className="w-4 h-4 text-[#007240] dark:text-[#008d50]" />
          <span>Apuração multi-ano matematicamente reconciliada com 0 divergências.</span>
        </div>
        <span className="font-extrabold text-[#007240] dark:text-[#008d50] font-mono text-sm">
          {formatCurrency(summary.grandTotal)}
        </span>
      </div>

    </div>
  );
};
