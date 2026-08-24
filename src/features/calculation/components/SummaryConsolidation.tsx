import React, { useState, useMemo } from 'react';
import type { ProgressionSummary } from '../../../core/types';
import type { InstallmentOverrideMap } from '../domain/types';
import { calculateConsolidation } from '../domain/usecases/calculateConsolidation';
import { formatCurrency } from '../../../core/utils/formatters';
import { Layers, CalendarDays, Calculator, Split } from 'lucide-react';

interface SummaryConsolidationProps {
  summary: ProgressionSummary;
  onConsolidationCalculated?: (data: ReturnType<typeof calculateConsolidation>) => void;
}

export const SummaryConsolidation: React.FC<SummaryConsolidationProps> = ({
  summary,
}) => {
  const [diasRetroativos, setDiasRetroativos] = useState<number>(summary.params.diasRetroativos ?? 30);
  const [installmentOverrides, setInstallmentOverrides] = useState<InstallmentOverrideMap>({});
  const [globalParcelas, setGlobalParcelas] = useState<number>(1);

  // Compute consolidation using the pure domain usecase
  const consolidation = useMemo(() => {
    return calculateConsolidation(summary, diasRetroativos, installmentOverrides);
  }, [summary, diasRetroativos, installmentOverrides]);

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
    <div className="solid-card rounded-2xl overflow-hidden shadow-md my-8 border border-[#324f72]/50">

      {/* Top Header Toolbar */}
      <div className="px-6 py-4 bg-[#101c2b] border-b border-[#324f72]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#f88543]/20 border border-[#f88543]/30 flex items-center justify-center text-[#f88543]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Quadro de Consolidação Final & Parcelamento
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#008d50]/20 text-[#008d50] border border-[#008d50]/30">
                Oficial Rio Verde
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Consolidação dos períodos integrais apurados, cálculo proporcional por dias retroativos e simulação de parcelamento
            </p>
          </div>
        </div>

        {/* Global Parcelas Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center mr-1">
            <Split className="w-3.5 h-3.5 mr-1 text-[#ead04d]" /> Parcelar Todos em:
          </span>
          {[1, 2, 3, 6, 10, 12, 24].map((num) => (
            <button
              key={num}
              onClick={() => handleApplyGlobalParcelas(num)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${globalParcelas === num
                  ? 'bg-[#f88543] text-slate-950 border-[#f88543]'
                  : 'bg-[#1b2a3f] text-slate-300 border-[#324f72] hover:border-slate-400'
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
                {/* Block 1: TOTAL (Orange #f88543) */}
                <th colSpan={4} className="bg-[#df6824] text-slate-950 font-black text-center py-2.5 text-sm uppercase tracking-wider border-r border-[#101c2b]">
                  TOTAL (PERÍODOS INTEGRAIS)
                </th>

                {/* Block 2: PROPORCIONAL (Yellow #ead04d) */}
                <th colSpan={3} className="bg-[#ead04d] text-slate-950 font-black text-center py-2.5 text-sm uppercase tracking-wider border-r border-[#101c2b]">
                  <div className="flex items-center justify-center space-x-2">
                    <span>PROPORCIONAL</span>
                    <span className="text-[11px] font-bold bg-[#132030] text-[#ead04d] px-2 py-0.5 rounded-md flex items-center">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {diasRetroativos} Dias Retroativos
                    </span>
                  </div>
                </th>

                {/* Block 3: TOTAL GERAL (Navy #324f72) */}
                <th colSpan={2} className="bg-[#324f72] text-white font-black text-center py-2.5 text-sm uppercase tracking-wider">
                  TOTAL GERAL (INTEGRAL + PROPORCIONAL)
                </th>
              </tr>

              {/* Subheaders Row */}
              <tr className="bg-[#0b131e] text-slate-300 font-extrabold text-[11px] border-b border-[#324f72]/40">
                {/* Block 1 Columns */}
                <th className="py-3 px-3.5">EVENTOS</th>
                <th className="py-3 px-3.5 text-right">VALOR TOTAL</th>
                <th className="py-3 px-2 text-center w-20">PARCELAS</th>
                <th className="py-3 px-3.5 text-right border-r border-[#324f72]/40">VALOR DA PARCELA</th>

                {/* Block 2 Columns */}
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1.5 bg-[#132030] px-2 py-1 rounded-md border border-[#324f72]">
                    <span className="text-slate-400">DIAS:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={diasRetroativos}
                      onChange={(e) => setDiasRetroativos(Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                      className="w-10 bg-[#0b131e] border border-[#ead04d] rounded px-1 text-center font-bold text-white text-xs"
                    />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">VALOR TOTAL</th>
                <th className="py-3 px-3.5 text-right border-r border-[#324f72]/40">VALOR PARCELADO</th>

                {/* Block 3 Columns */}
                <th className="py-3 px-3.5 text-right">TOTAL GERAL</th>
                <th className="py-3 px-3.5 text-right">TOTAL PARCELADO</th>
              </tr>
            </thead>

            {/* Table Rows Body: Exibe apenas linhas com valores > 0 */}
            <tbody className="divide-y divide-[#324f72]/20 text-slate-200">
              {consolidation.items
                .filter((item) => item.valorTotalIntegral > 0 || item.valorTotalProporcional > 0 || item.totalGeral > 0)
                .map((item) => {
                  const hasValue = item.valorTotalIntegral > 0 || item.valorTotalProporcional > 0;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-[#1b2a3f]/40 bg-[#0f1a27]"
                    >
                      {/* Evento Nome */}
                      <td className="py-2.5 px-3.5 font-bold text-white whitespace-nowrap">
                        {item.descricao}
                      </td>

                      {/* Bloco 1: Valor Total Integral */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${hasValue ? 'bg-[#008d50]/15 text-white font-extrabold' : 'text-slate-400'
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
                          className="w-14 bg-[#0b131e] border border-[#324f72] rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white focus:border-[#f88543] focus:outline-none"
                        />
                      </td>

                      {/* Bloco 1: Valor da Parcela */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-200 border-r border-[#324f72]/40">
                        {formatCurrency(item.valorParcelaIntegral)}
                      </td>

                      {/* Bloco 2: Label / Evento Proporcional */}
                      <td className="py-2.5 px-3 text-slate-400 font-medium text-[11px] truncate max-w-[120px]">
                        {item.descricao}
                      </td>

                      {/* Bloco 2: Valor Total Proporcional */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${item.valorTotalProporcional > 0 ? 'bg-[#008d50]/15 text-white font-extrabold' : 'text-slate-400'
                        }`}>
                        {formatCurrency(item.valorTotalProporcional)}
                      </td>

                      {/* Bloco 2: Valor Parcelado Proporcional */}
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-200 border-r border-[#324f72]/40">
                        {formatCurrency(item.valorParcelaProporcional)}
                      </td>

                      {/* Bloco 3: Total Geral */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-black ${item.totalGeral > 0 ? 'text-white' : 'text-slate-400'
                        }`}>
                        {formatCurrency(item.totalGeral)}
                      </td>

                      {/* Bloco 3: Total Geral Parcelado */}
                      <td className={`py-2.5 px-3.5 text-right font-mono font-black ${item.totalGeralParcelado > 0 ? 'text-[#ead04d]' : 'text-slate-400'
                        }`}>
                        {formatCurrency(item.totalGeralParcelado)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>

            {/* Footer Summary Row (Color-Coded Bars) */}
            <tfoot>
              <tr className="font-black text-xs text-slate-950">
                {/* Total Bloco 1 (Orange #df6824) */}
                <td className="py-3.5 px-3.5 bg-[#df6824] uppercase tracking-wider text-slate-950 font-black">
                  TOTAL
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#df6824] text-slate-950 font-black text-sm">
                  {formatCurrency(consolidation.somaTotalIntegral)}
                </td>
                <td className="py-3.5 px-2 text-center bg-[#df6824] text-slate-950 font-black">
                  -
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#df6824] text-slate-950 font-black text-sm border-r border-[#101c2b]">
                  {formatCurrency(consolidation.somaParcelaIntegral)}
                </td>

                {/* Total Bloco 2 (Yellow #ead04d) */}
                <td className="py-3.5 px-3 bg-[#ead04d] uppercase tracking-wider text-slate-950 font-black">
                  TOTAL
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#ead04d] text-slate-950 font-black text-sm">
                  {formatCurrency(consolidation.somaTotalProporcional)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#ead04d] text-slate-950 font-black text-sm border-r border-[#101c2b]">
                  {formatCurrency(consolidation.somaParcelaProporcional)}
                </td>

                {/* Total Bloco 3 (Navy #324f72 / Blue #5a82b2) */}
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#324f72] text-white font-black text-sm">
                  {formatCurrency(consolidation.somaTotalGeral)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono bg-[#324f72] text-[#ead04d] font-black text-sm">
                  {formatCurrency(consolidation.somaTotalGeralParcelado)}
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* Footer Info & Legal Notice */}
      <div className="px-6 py-3.5 bg-[#101c2b] border-t border-[#324f72]/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center space-x-2 font-medium">
          <Calculator className="w-4 h-4 text-[#ead04d]" />
          <span>
            Valores consolidados em conformidade com as fichas financeiras do Município de Rio Verde — GO.
          </span>
        </div>
        <div className="text-white font-extrabold text-xs">
          Total Geral Consolidado: <strong className="text-[#008d50] text-sm ml-1">{formatCurrency(consolidation.somaTotalGeral)}</strong>
        </div>
      </div>

    </div>
  );
};
