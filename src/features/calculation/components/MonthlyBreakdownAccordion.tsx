import React, { useState } from 'react';
import type { YearlyBreakdownGroup } from '../../../core/types';
import { formatCurrency, formatPercent } from '../../../core/utils/formatters';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';

interface MonthlyBreakdownAccordionProps {
  yearlyBreakdown: YearlyBreakdownGroup[];
  onMonthPercentChange?: (competencia: string, newPercent: number) => void;
}

export const MonthlyBreakdownAccordion: React.FC<MonthlyBreakdownAccordionProps> = ({
  yearlyBreakdown,
  onMonthPercentChange
}) => {
  // All years expanded by default
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    yearlyBreakdown.forEach(y => { map[y.ano] = true; });
    return map;
  });

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleYear = (ano: number) => {
    setExpandedYears(prev => ({ ...prev, [ano]: !prev[ano] }));
  };

  const toggleMonth = (comp: string) => {
    setExpandedMonths(prev => ({ ...prev, [comp]: !prev[comp] }));
  };

  if (!yearlyBreakdown || yearlyBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="solid-card rounded-2xl overflow-hidden shadow-xs my-6 space-y-4 p-5 bg-white dark:bg-[#0e1724] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#324f72]/40 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1e3a5f] border border-slate-200 dark:bg-[#324f72]/30 dark:border-[#324f72] flex items-center justify-center dark:text-[#ead04d] transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white transition-colors">Detalhamento Hierárquico Mensal (Ano &gt; Mês)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
              Rateio proporcional exato dia a dia por competência do calendário real com ajuste individual de % por mês
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-[#008d50]/20 border border-emerald-300 dark:border-[#008d50]/40 text-emerald-800 dark:text-[#008d50] font-black transition-colors">
            {yearlyBreakdown.reduce((s, y) => s + y.meses.length, 0)} Meses Apurados
          </span>
        </div>
      </div>

      {/* Year Accordions */}
      <div className="space-y-4">
        {yearlyBreakdown.map((yearGroup) => {
          const isYearExpanded = expandedYears[yearGroup.ano] !== false;

          return (
            <div
              key={yearGroup.ano}
              className="rounded-2xl border border-slate-200 dark:border-[#324f72]/60 overflow-hidden bg-slate-50 dark:bg-[#101c2b] transition-all"
            >
              {/* Year Header Button */}
              <button
                type="button"
                onClick={() => toggleYear(yearGroup.ano)}
                className="w-full px-5 py-3.5 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-[#132236] dark:hover:bg-[#182b44] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1e3a5f] dark:bg-[#324f72] flex items-center justify-center text-white font-black text-sm">
                    {yearGroup.ano}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 transition-colors">
                      <span>Exercício de {yearGroup.ano}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        ({yearGroup.meses.length} {yearGroup.meses.length === 1 ? 'competência' : 'competências'} • {yearGroup.totalDiasDevidos} dias apurados)
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="text-right hidden sm:block">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Subtotal Diferença</span>
                    <strong className="text-amber-800 dark:text-[#ead04d] font-black">{formatCurrency(yearGroup.subtotalDiferenca)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Total Geral Ano (c/ Reflexos)</span>
                    <strong className="text-emerald-700 dark:text-[#008d50] font-black text-sm">{formatCurrency(yearGroup.grandTotalAno)}</strong>
                  </div>
                  <div className="p-1 rounded-lg bg-slate-200 dark:bg-[#1b2a3f] text-slate-700 dark:text-slate-300">
                    {isYearExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Year Body: Months List */}
              {isYearExpanded && (
                <div className="p-4 space-y-3 bg-white dark:bg-[#0c1521] border-t border-slate-200 dark:border-[#324f72]/40 transition-colors">
                  <div className="grid grid-cols-1 gap-3">
                    {yearGroup.meses.map((month) => {
                      const isMonthExpanded = expandedMonths[month.competencia] ?? true;
                      const isProportional = month.fatorProporcional < 1.0;

                      return (
                        <div
                          key={month.competencia}
                          className="rounded-xl border border-slate-200 dark:border-[#324f72]/40 overflow-hidden bg-slate-50 dark:bg-[#132030] transition-colors"
                        >
                          {/* Month Header Bar */}
                          <div
                            onClick={() => toggleMonth(month.competencia)}
                            className="px-4 py-2.5 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-[#17263a] dark:hover:bg-[#1c2e47] flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 dark:bg-[#1b2a3f] dark:border-[#324f72] font-mono font-black dark:text-white text-xs">
                                {month.competencia}
                              </span>
                              <strong className="text-slate-900 dark:text-white text-xs font-bold">{month.mesNome}</strong>

                              {/* Editable Month-Specific Progression Percentage */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72] shadow-2xs"
                                title={`Alterar percentual de progressão de ${month.mesNome}/${month.ano}`}
                              >
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={month.percentualReajuste ?? 5}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && onMonthPercentChange) {
                                      onMonthPercentChange(month.competencia, val);
                                    }
                                  }}
                                  className="w-14 bg-transparent text-right font-mono font-black text-amber-800 dark:text-[#ead04d] focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-0.5 text-xs"
                                />
                                <span className="text-xs text-amber-800 dark:text-[#ead04d] font-black">%</span>
                              </div>

                              {month.situacaoFuncional && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-[#ead04d]/20 dark:text-[#ead04d] dark:border-[#ead04d]/40">
                                  {month.situacaoFuncional === 'Férias' ? 'Férias' : `${month.situacaoFuncional}`}
                                </span>
                              )}

                              {isProportional ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300 dark:bg-[#f88543]/20 dark:text-[#f88543] dark:border-[#f88543]/40 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Rateio: {month.diasDevidos}/{month.diasBaseRateio} dias ({formatPercent(month.percentualAplicado)})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#008d50]/20 dark:text-[#008d50] dark:border-[#008d50]/30">
                                  Integral (100% • {month.diasNoMes} dias)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 text-xs font-mono justify-between sm:justify-end">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Dif. Mês: </span>
                                <strong className="text-amber-800 dark:text-[#ead04d] font-bold">{formatCurrency(month.subtotalDiferenca)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Total Devido: </span>
                                <strong className="text-emerald-700 dark:text-[#008d50] font-black">{formatCurrency(month.totalMes)}</strong>
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {isMonthExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>

                          {/* Month Expanded Details Table */}
                          {isMonthExpanded && (
                            <div className="p-3 overflow-x-auto text-[11px]">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#324f72]/40 text-[10px] uppercase font-bold">
                                    <th className="py-1.5 px-2">Cód. / Rubrica</th>
                                    <th className="py-1.5 px-2 text-right">Letra 1 (R$)</th>
                                    <th className="py-1.5 px-2 text-right text-emerald-700 dark:text-[#008d50]">Letra 2 (R$)</th>
                                    <th className="py-1.5 px-2 text-right text-amber-800 dark:text-[#ead04d]">Diferença (R$)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-[#324f72]/20 font-mono text-slate-800 dark:text-slate-200">
                                  {month.eventos.map((ev) => (
                                    <tr key={`${month.competencia}-${ev.codigo}`} className="hover:bg-slate-100/70 dark:hover:bg-[#1b2a3f]/40 transition-colors">
                                      <td className="py-1.5 px-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 mr-1.5">[{ev.codigo}]</span>
                                        <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{ev.descricao}</span>
                                      </td>
                                      <td className="py-1.5 px-2 text-right text-slate-700 dark:text-slate-300">
                                        {formatCurrency(ev.letra1Valor)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right text-emerald-700 dark:text-[#008d50] font-bold">
                                        {formatCurrency(ev.letra2Valor)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right text-amber-800 dark:text-[#ead04d] font-bold">
                                        {formatCurrency(ev.diferenca)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-slate-200 dark:border-[#324f72]/60 font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                                    <td className="py-2 px-2 text-slate-700 dark:text-slate-300">
                                      SUBTOTAL + REFLEXOS (13º: {formatCurrency(month.reflexo13)} | Férias 1/3: {formatCurrency(month.reflexoFerias)})
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                      {formatCurrency(month.subtotalLetra1)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-emerald-700 dark:text-[#008d50]">
                                      {formatCurrency(month.subtotalLetra2)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-emerald-700 dark:text-[#008d50] font-black text-xs">
                                      {formatCurrency(month.totalMes)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
