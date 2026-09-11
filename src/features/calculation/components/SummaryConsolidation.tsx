import React, { useState, useMemo, useEffect } from 'react';
import type { ProgressionSummary } from '../../../core/types';
import type { InstallmentOverrideMap } from '../domain/types';
import { calculateConsolidation } from '../domain/usecases/calculateConsolidation';
import { formatCurrency } from '../../../core/utils/formatters';
import { Layers, CalendarDays, Calculator, Split } from 'lucide-react';

interface SummaryConsolidationProps {
  summary: ProgressionSummary;
  onConsolidationCalculated?: (data: ReturnType<typeof calculateConsolidation>) => void;
  onDiasRetroativosChange?: (dias: number) => void;
}

export const SummaryConsolidation: React.FC<SummaryConsolidationProps> = ({
  summary,
  onDiasRetroativosChange
}) => {
  const activeDias = summary.params.diasRetroativos ?? 30;
  const [localDias, setLocalDias] = useState<string>(String(activeDias));
  const [installmentOverrides, setInstallmentOverrides] = useState<InstallmentOverrideMap>({});
  const [globalParcelas, setGlobalParcelas] = useState<number>(1);

  // Synchronize local input state whenever activeDias changes in parent
  useEffect(() => {
    setLocalDias(String(activeDias));
  }, [activeDias]);

  const handleDiasChange = (raw: string) => {
    setLocalDias(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      if (onDiasRetroativosChange && parsed !== activeDias) {
        onDiasRetroativosChange(parsed);
      }
    }
  };

  const handleDiasBlur = () => {
    const parsed = parseInt(localDias, 10);
    const safe = !isNaN(parsed) ? Math.min(30, Math.max(1, parsed)) : 30;
    setLocalDias(String(safe));
    if (onDiasRetroativosChange && safe !== activeDias) {
      onDiasRetroativosChange(safe);
    }
  };

  // Compute consolidation using the pure domain usecase
  const consolidation = useMemo(() => {
    return calculateConsolidation(summary, activeDias, installmentOverrides);
  }, [summary, activeDias, installmentOverrides]);

  const handleRowParcelaChange = (itemId: string, val: number) => {
    const safeVal = Math.max(1, Math.min(120, val || 1));
    setInstallmentOverrides(prev => ({
      ...prev,
      [itemId]: safeVal
    }));
  };

  const handleApplyGlobalParcelas = (n: number) => {
    setGlobalParcelas(n);
    const updated: InstallmentOverrideMap = {};
    consolidation.items.forEach(i => {
      updated[i.id] = n;
    });
    setInstallmentOverrides(updated);
  };

  return (
    <div className="solid-card rounded-2xl overflow-hidden shadow-xs my-8 border border-slate-200 dark:border-[#324f72]/50 transition-colors">

      {/* Top Header Toolbar */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-[#101c2b] border-b border-slate-200 dark:border-[#324f72]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 border border-orange-200 dark:bg-[#f88543]/20 dark:border-[#f88543]/30 dark:text-[#f88543] flex items-center justify-center transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
              Quadro de Consolidação Final & Parcelamento
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#008d50]/20 dark:text-[#008d50] dark:border-[#008d50]/30 transition-colors">
                Oficial Rio Verde
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
              Consolidação dos períodos integrais apurados, cálculo proporcional por dias retroativos e simulação de parcelamento
            </p>
          </div>
        </div>

        {/* Global Parcelas Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center mr-1 transition-colors">
            <Split className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-[#ead04d]" /> Parcelar Todos em:
          </span>
          {[1, 2, 3, 6, 10, 12, 24].map((num) => (
            <button
              key={num}
              onClick={() => handleApplyGlobalParcelas(num)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${globalParcelas === num
                ? 'bg-[#ea580c] dark:bg-[#f88543] text-white dark:text-slate-950 border-[#ea580c] dark:border-[#f88543] shadow-xs'
                : 'bg-slate-100 dark:bg-[#1b2a3f] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#324f72] hover:bg-slate-200 dark:hover:border-slate-400'
                }`}
            >
              {num}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Consolidation Grid: 3 Integrated Blocks */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full text-left text-xs border-collapse">

            {/* Top Super Headers for the 3 Blocks */}
            <thead>
              <tr>
                {/* Block 1: TOTAL (Orange) */}
                <th colSpan={4} className="bg-[#df6824] text-white font-black text-center py-2.5 text-sm uppercase tracking-wider border-r border-slate-300 dark:border-[#101c2b]">
                  TOTAL (PERÍODOS INTEGRAIS)
                </th>

                {/* Block 2: PROPORCIONAL (Yellow/Amber) */}
                <th colSpan={3} className="bg-[#f59e0b] dark:bg-[#ead04d] text-slate-950 font-black text-center py-2.5 text-sm uppercase tracking-wider border-r border-slate-300 dark:border-[#101c2b]">
                  <div className="flex items-center justify-center space-x-2">
                    <span>PROPORCIONAL</span>
                    <span className="text-[11px] font-bold bg-slate-900 text-amber-300 dark:bg-[#132030] dark:text-[#ead04d] px-2 py-0.5 rounded-md flex items-center">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {activeDias} Dias Retroativos
                    </span>
                  </div>
                </th>

                {/* Block 3: TOTAL GERAL (Navy) */}
                <th colSpan={2} className="bg-[#1e3a5f] dark:bg-[#324f72] text-white font-black text-center py-2.5 text-sm uppercase tracking-wider">
                  TOTAL GERAL (INTEGRAL + PROPORCIONAL)
                </th>
              </tr>

              {/* Subheaders Row */}
              <tr className="bg-slate-100 dark:bg-[#0b131e] text-slate-700 dark:text-slate-300 font-extrabold text-[11px] border-b border-slate-200 dark:border-[#324f72]/40 transition-colors">
                {/* Block 1 Columns */}
                <th className="py-3 px-3.5">EVENTOS</th>
                <th className="py-3 px-3.5 text-right">VALOR TOTAL</th>
                <th className="py-3 px-2 text-center w-20">PARCELAS</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-200 dark:border-[#324f72]/40">VALOR DA PARCELA</th>

                {/* Block 2 Columns */}
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1.5 bg-white dark:bg-[#132030] px-2 py-1 rounded-md border border-slate-300 dark:border-[#324f72] transition-colors">
                    <span className="text-slate-500 dark:text-slate-400">DIAS:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={localDias}
                      onChange={(e) => handleDiasChange(e.target.value)}
                      onBlur={handleDiasBlur}
                      className="w-10 bg-slate-50 dark:bg-[#0b131e] border border-amber-500 dark:border-[#ead04d] rounded px-1 text-center font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">VALOR TOTAL</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-200 dark:border-[#324f72]/40">VALOR PARCELADO</th>

                {/* Block 3 Columns */}
                <th className="py-3 px-3.5 text-right">TOTAL GERAL</th>
                <th className="py-3 px-3.5 text-right">TOTAL PARCELADO</th>
              </tr>
            </thead>

            {/* Table Rows Body: Exibe apenas linhas com valores > 0 */}
            <tbody className="divide-y divide-slate-200 dark:divide-[#324f72]/20 text-slate-800 dark:text-slate-200 transition-colors">
              {consolidation.items
                .filter((item) => item.valorTotalIntegral > 0 || item.valorTotalProporcional > 0 || item.totalGeral > 0)
                .map((item) => {
                  const hasValue = item.valorTotalIntegral > 0 || item.valorTotalProporcional > 0;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1b2a3f]/40 bg-white dark:bg-[#0f1a27]"
                    >
                      {/* Evento Nome */}
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.descricao}
                      </td>

                      {/* Bloco 1: Valor Total Integral */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${hasValue ? 'bg-emerald-50 text-emerald-800 font-extrabold dark:bg-[#008d50]/15 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {formatCurrency(item.valorTotalIntegral)}
                      </td>

                      {/* Bloco 1: Input Parcelas */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={item.parcelas}
                          onChange={(e) => handleRowParcelaChange(item.id, parseInt(e.target.value, 10))}
                          className="w-14 bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72] rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-bold text-slate-900 dark:text-white focus:border-[#ea580c] dark:focus:border-[#f88543] focus:outline-none"
                        />
                      </td>

                      {/* Bloco 1: Valor da Parcela */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-[#324f72]/40">
                        {formatCurrency(item.valorParcelaIntegral)}
                      </td>

                      {/* Bloco 2: Label / Evento Proporcional */}
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-medium text-[11px] truncate max-w-[120px]">
                        {item.descricao}
                      </td>

                      {/* Bloco 2: Valor Total Proporcional */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${item.valorTotalProporcional > 0 ? 'bg-emerald-50 text-emerald-800 font-extrabold dark:bg-[#008d50]/15 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {formatCurrency(item.valorTotalProporcional)}
                      </td>

                      {/* Bloco 2: Valor Parcelado Proporcional */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-[#324f72]/40">
                        {formatCurrency(item.valorParcelaProporcional)}
                      </td>

                      {/* Bloco 3: Total Geral */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-black ${item.totalGeral > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {formatCurrency(item.totalGeral)}
                      </td>

                      {/* Bloco 3: Total Geral Parcelado */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-black ${item.totalGeralParcelado > 0 ? 'text-amber-800 dark:text-[#ead04d]' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {formatCurrency(item.totalGeralParcelado)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>

            {/* Footer Summary Row (Color-Coded Bars) */}
            <tfoot>
              <tr className="font-black text-xs text-white">
                {/* Total Bloco 1 (Orange #df6824) */}
                <td className="py-3.5 px-3.5 bg-[#df6824] uppercase tracking-wider font-black">
                  TOTAL
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#df6824] font-black text-sm">
                  {formatCurrency(consolidation.somaTotalIntegral)}
                </td>
                <td className="py-3.5 px-2 text-center bg-[#df6824] font-black">
                  -
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#df6824] font-black text-sm border-r border-slate-300 dark:border-[#101c2b]">
                  {formatCurrency(consolidation.somaParcelaIntegral)}
                </td>

                {/* Total Bloco 2 (Yellow #f59e0b / #ead04d) */}
                <td className="py-3.5 px-3 bg-[#f59e0b] dark:bg-[#ead04d] uppercase tracking-wider text-slate-950 font-black">
                  TOTAL
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#f59e0b] dark:bg-[#ead04d] text-slate-950 font-black text-sm">
                  {formatCurrency(consolidation.somaTotalProporcional)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#f59e0b] dark:bg-[#ead04d] text-slate-950 font-black text-sm border-r border-slate-300 dark:border-[#101c2b]">
                  {formatCurrency(consolidation.somaParcelaProporcional)}
                </td>

                {/* Total Bloco 3 (Navy #1e3a5f / #324f72) */}
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#1e3a5f] dark:bg-[#324f72] text-white font-black text-sm">
                  {formatCurrency(consolidation.somaTotalGeral)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#1e3a5f] dark:bg-[#324f72] text-amber-300 dark:text-[#ead04d] font-black text-sm">
                  {formatCurrency(consolidation.somaTotalGeralParcelado)}
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* Footer Info & Legal Notice */}
      <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#101c2b] border-t border-slate-200 dark:border-[#324f72]/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 dark:text-slate-400 transition-colors">
        <div className="flex items-center space-x-2 font-medium">
          <Calculator className="w-4 h-4 text-amber-600 dark:text-[#ead04d]" />
          <span>
            Valores consolidados em conformidade com as fichas financeiras do Município de Rio Verde — GO.
          </span>
        </div>
        <div className="text-slate-800 dark:text-white font-extrabold text-xs">
          Total Geral Consolidado: <strong className="text-emerald-700 dark:text-[#008d50] text-sm ml-1">{formatCurrency(consolidation.somaTotalGeral)}</strong>
        </div>
      </div>

    </div>
  );
};
