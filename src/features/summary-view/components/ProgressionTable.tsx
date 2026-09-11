import React, { useState } from 'react';
import type { CalculatedEventRow, ProgressionSummary } from '../../../core/types';
import { formatCurrency, formatPercent } from '../../../core/utils/formatters';
import { Edit3, Check, Info, FileSpreadsheet, Trash2, RotateCcw, ChevronDown, ChevronRight, CornerDownRight, Unlink } from 'lucide-react';

interface ProgressionTableProps {
  summary: ProgressionSummary;
  onRowUpdate?: (updatedRow: CalculatedEventRow) => void;
  onDeleteRow?: (codigo: string) => void;
  deletedCount?: number;
  onRestoreRows?: () => void;
  onAddRow?: () => void;
  onUngroupEvent?: (groupCodigo: string, subCodigo: string) => void;
}

export const ProgressionTable: React.FC<ProgressionTableProps> = ({
  summary,
  onRowUpdate,
  onDeleteRow,
  deletedCount = 0,
  onRestoreRows,
  onUngroupEvent
}) => {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [tempRow, setTempRow] = useState<CalculatedEventRow | null>(null);
  const [expandedUnified, setExpandedUnified] = useState<Record<string, boolean>>({});

  const toggleUnified = (code: string) => {
    setExpandedUnified(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleStartEdit = (row: CalculatedEventRow) => {
    setEditingCode(row.codigo);
    setTempRow({ ...row });
  };

  const handleSaveEdit = () => {
    if (tempRow && onRowUpdate) {
      onRowUpdate(tempRow);
    }
    setEditingCode(null);
    setTempRow(null);
  };

  return (
    <div className="solid-card rounded-2xl overflow-hidden shadow-xs my-6 transition-colors">

      {/* Table Top Toolbar */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-[#101c2b] border-b border-slate-200 dark:border-[#324f72]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#008d50]/15 dark:bg-[#008d50]/20 border border-[#008d50]/30 flex items-center justify-center text-[#008d50]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white transition-colors">Demonstrativo Analítico de Diferenças Salariais</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">Apurado com base no reajuste da progressão funcional e adicionais incidentes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {deletedCount > 0 && onRestoreRows && (
            <button
              onClick={onRestoreRows}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300 dark:border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
              title="Restaurar linhas excluídas"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Restaurar {deletedCount} {deletedCount === 1 ? 'linha' : 'linhas'}
            </button>
          )}

          <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#324f72]/30 border border-slate-200 dark:border-[#324f72] text-amber-800 dark:text-[#ead04d] font-bold shadow-2xs transition-colors">
            {summary.competenciasSelecionadas.length} {summary.competenciasSelecionadas.length === 1 ? 'mês apurado' : 'meses apurados'} ({summary.totalDiasRetroativos} dias retroativos)
          </span>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">

          {/* Table Header */}
          <thead>
            <tr className="bg-slate-100 dark:bg-[#0b131e] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#324f72]/40 uppercase font-black text-[11px] tracking-wider transition-colors">
              <th className="py-3.5 px-4 font-black">Cód. / Evento</th>
              <th className="py-3.5 px-4 text-right font-black">
                {summary.params?.letraOrigem ? `Letra ${summary.params.letraOrigem} (R$)` : 'Letra 1 (R$)'}
              </th>
              <th className="py-3.5 px-4 text-center font-black">% Appl.</th>
              <th className="py-3.5 px-4 text-right font-black text-emerald-700 dark:text-[#008d50]">
                {summary.params?.letraDestino ? `Letra ${summary.params.letraDestino} (R$)` : 'Letra 2 (R$)'}
              </th>
              <th className="py-3.5 px-4 text-right font-black text-amber-800 dark:text-[#ead04d]">Diferença/Mês</th>
              <th className="py-3.5 px-4 text-center font-black">Qtd. Meses</th>
              <th className="py-3.5 px-4 text-right font-black text-orange-700 dark:text-[#f88543]">Total Acumulado</th>
              <th className="py-3.5 px-4 text-right font-black text-slate-700 dark:text-slate-300">Reflexo 13º</th>
              <th className="py-3.5 px-3 text-center font-black">Ações</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-[#324f72]/30 text-slate-800 dark:text-slate-200 transition-colors">
            {summary.rows.map((row) => {
              const isEditing = editingCode === row.codigo;
              const isExpanded = !!expandedUnified[row.codigo];

              return (
                <React.Fragment key={row.codigo}>
                  <tr
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-[#1b2a3f]/50 ${row.isSalarioBase ? 'bg-emerald-50/70 dark:bg-[#008d50]/10 font-bold' : ''
                      } ${row.isUnified ? 'bg-orange-50/70 dark:bg-[#f88543]/5' : ''}`}
                  >
                    {/* Cod / Descricao */}
                    <td className="py-3.5 px-4">
                      {row.isUnified ? (
                        <div className="flex items-start space-x-2.5">
                          <button
                            type="button"
                            onClick={() => toggleUnified(row.codigo)}
                            className="mt-0.5 p-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200 dark:bg-[#f88543]/20 dark:hover:bg-[#f88543]/30 dark:text-[#f88543] dark:border-[#f88543]/40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                            title={isExpanded ? "Recolher agrupamento" : "Expandir itens do agrupamento"}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-mono text-[9px] border border-orange-200 dark:bg-[#f88543]/20 dark:text-[#f88543] dark:border-[#f88543]/40 font-black">
                                UNIFICADO ({row.subItens?.length || row.origemCodigos?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleUnified(row.codigo)}
                                className="font-extrabold text-slate-900 dark:text-white hover:text-orange-700 dark:hover:text-[#f88543] transition-colors cursor-pointer text-left"
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
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] border border-slate-300 dark:bg-[#1b2a3f] dark:text-slate-200 dark:border-[#324f72]/60 font-black">
                            {row.codigo}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{row.descricao}</span>
                          {row.isSalarioBase && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#008d50]/20 dark:text-[#008d50] dark:border-[#008d50]/40">
                              BASE
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Letra 1 */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {isEditing && tempRow ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tempRow.letra1Valor}
                          onChange={(e) => setTempRow({ ...tempRow, letra1Valor: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72] rounded px-2 py-1 text-right font-mono text-xs text-slate-900 dark:text-white font-bold"
                        />
                      ) : (
                        formatCurrency(row.letra1Valor)
                      )}
                    </td>

                    {/* % Aplicado */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#0b131e] dark:text-slate-300 dark:border-[#324f72]/40 font-bold">
                        {formatPercent(row.percentualAplicado)}
                      </span>
                    </td>

                    {/* Letra 2 */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-[#008d50]">
                      {isEditing && tempRow ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tempRow.letra2Valor}
                          onChange={(e) => setTempRow({ ...tempRow, letra2Valor: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-white dark:bg-[#0b131e] border border-emerald-300 dark:border-[#008d50] rounded px-2 py-1 text-right font-mono text-xs text-emerald-700 dark:text-[#008d50] font-bold"
                        />
                      ) : (
                        formatCurrency(row.letra2Valor)
                      )}
                    </td>

                    {/* Diferenca Unitaria */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-amber-800 dark:text-[#ead04d]">
                      {formatCurrency(row.diferencaUnitaria)}
                    </td>

                    {/* Qtd Meses / Proporcao */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.qtdMeses.toString().replace('.', ',')}
                    </td>

                    {/* Subtotal Acumulado */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-orange-700 dark:text-[#f88543]">
                      {formatCurrency(row.totalDiferenca)}
                    </td>

                    {/* Reflexo 13º */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(row.reflexo13)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {isEditing ? (
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 rounded bg-[#008d50] hover:bg-[#00663a] text-white cursor-pointer"
                            title="Salvar alteração"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#1b2a3f] rounded cursor-pointer transition-colors"
                            title="Editar valores manualmente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteRow && (
                          <button
                            onClick={() => onDeleteRow(row.codigo)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                            title={`Excluir verba ${row.descricao} da apuração`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Dropdown / Sub-Items for Unified Group */}
                  {row.isUnified && isExpanded && row.subItens && row.subItens.length > 0 && (
                    row.subItens.map((sub) => (
                      <tr
                        key={`sub-${row.codigo}-${sub.codigo}`}
                        className="bg-slate-50/80 dark:bg-[#0b131e]/90 border-b border-slate-200 dark:border-[#324f72]/20 text-slate-700 dark:text-slate-300 text-[11px] hover:bg-slate-100 dark:hover:bg-[#132030]/60 transition-colors"
                      >
                        <td className="py-2.5 px-4 pl-10">
                          <div className="flex items-center space-x-2">
                            <CornerDownRight className="w-3.5 h-3.5 text-orange-600 dark:text-[#f88543] shrink-0" />
                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101b29] text-slate-800 dark:text-slate-300 font-mono text-[9px] border border-slate-200 dark:border-[#324f72]/50 font-bold">
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
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-[#008d50]/90">
                          {formatCurrency(sub.letra2Valor)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800 dark:text-[#ead04d]/90">
                          {formatCurrency(sub.diferencaUnitaria)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                          {sub.qtdMeses.toString().replace('.', ',')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-orange-700 dark:text-[#f88543]/90">
                          {formatCurrency(sub.totalDiferenca)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                          {formatCurrency(sub.reflexo13)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="italic text-slate-500 text-[10px]">item agrupado</span>
                            {onUngroupEvent && (
                              <button
                                type="button"
                                onClick={() => onUngroupEvent(row.codigo, sub.codigo)}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 dark:bg-[#f88543]/15 dark:hover:bg-[#f88543]/30 dark:text-[#f88543] dark:border-[#f88543]/40 text-[10px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                title={`Desagrupar evento ${sub.codigo} - ${sub.descricao} desta unificação`}
                              >
                                <Unlink className="w-3 h-3" />
                                <span>Desagrupar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-100 dark:bg-[#0b131e] border-t-2 border-slate-300 dark:border-[#324f72] text-slate-900 dark:text-white font-bold text-xs transition-colors">
              <td className="py-4 px-4 uppercase tracking-wider text-slate-900 dark:text-slate-200 font-black">
                TOTAL GERAL DA APURAÇÃO
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-300">
                {formatCurrency(summary.totalLetra1Mensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                -
              </td>
              <td className="py-4 px-4 text-right font-mono text-emerald-700 dark:text-[#008d50] text-sm font-black">
                {formatCurrency(summary.totalLetra2Mensal)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-amber-800 dark:text-[#ead04d] text-sm font-black">
                {formatCurrency(summary.totalDiferencaMensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-300">
                {summary.qtdMesesEquivalentes.toString().replace('.', ',')}
              </td>
              <td className="py-4 px-4 text-right font-mono text-orange-700 dark:text-[#f88543] text-sm font-black">
                {formatCurrency(summary.totalDiferencaAcumulada)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-800 dark:text-slate-200 text-sm font-bold">
                {formatCurrency(summary.totalReflexo13)}
              </td>
              <td className="py-4 px-3"></td>
            </tr>
          </tfoot>

        </table>
      </div>

      {/* Table Footer Note */}
      <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#101c2b] border-t border-slate-200 dark:border-[#324f72]/40 text-[11px] text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors">
        <div className="flex items-center space-x-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-[#ead04d]" />
          <span>Fórmulas em conformidade com o plano de cargos da Prefeitura Municipal de Rio Verde — GO.</span>
        </div>
        <div className="text-slate-800 dark:text-slate-200 font-bold">
          Total Devido ({summary.totalDiasRetroativos} dias retroativos): <span className="text-emerald-700 dark:text-[#008d50] text-sm font-black ml-1">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

    </div>
  );
};
