import React, { useState } from 'react';
import type { CalculatedEventRow, ProgressionSummary } from '../../../core/types';
import { formatCurrency, formatPercent } from '../../../core/utils/formatters';
import { Edit3, Check, Info, FileSpreadsheet } from 'lucide-react';

interface ProgressionTableProps {
  summary: ProgressionSummary;
  onRowUpdate?: (updatedRow: CalculatedEventRow) => void;
  onAddRow?: () => void;
}

export const ProgressionTable: React.FC<ProgressionTableProps> = ({ summary, onRowUpdate }) => {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [tempRow, setTempRow] = useState<CalculatedEventRow | null>(null);

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
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl my-6">
      
      {/* Table Top Toolbar */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Demonstrativo Analítico de Diferenças Salariais</h3>
            <p className="text-xs text-slate-400">Apurado com base no reajuste da progressão e adicionais incidentes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
            {summary.competenciasSelecionadas.length} {summary.competenciasSelecionadas.length === 1 ? 'mês apurado' : 'meses apurados'}
          </span>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3.5 px-4 font-bold">Cód. / Evento</th>
              <th className="py-3.5 px-4 text-right font-bold">Letra 1 (R$)</th>
              <th className="py-3.5 px-4 text-center font-bold">% Appl.</th>
              <th className="py-3.5 px-4 text-right font-bold text-emerald-400">Letra 2 (R$)</th>
              <th className="py-3.5 px-4 text-right font-bold text-blue-400">Diferença/Mês</th>
              <th className="py-3.5 px-4 text-center font-bold">Qtd.</th>
              <th className="py-3.5 px-4 text-right font-bold text-indigo-300">Total Acumulado</th>
              <th className="py-3.5 px-4 text-right font-bold text-amber-300">Reflexo 13º</th>
              <th className="py-3.5 px-3 text-center font-bold">Ações</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {summary.rows.map((row) => {
              const isEditing = editingCode === row.codigo;

              return (
                <tr
                  key={row.codigo}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    row.isSalarioBase ? 'bg-blue-950/20 font-medium' : ''
                  }`}
                >
                  {/* Cod / Descricao */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 font-bold">
                        {row.codigo}
                      </span>
                      <span className="font-semibold text-slate-100">{row.descricao}</span>
                      {row.isSalarioBase && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          BASE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Letra 1 */}
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {isEditing && tempRow ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempRow.letra1Valor}
                        onChange={(e) => setTempRow({ ...tempRow, letra1Valor: parseFloat(e.target.value) || 0 })}
                        className="w-24 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-right font-mono text-xs text-white"
                      />
                    ) : (
                      formatCurrency(row.letra1Valor)
                    )}
                  </td>

                  {/* % Aplicado */}
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                      {formatPercent(row.percentualAplicado)}
                    </span>
                  </td>

                  {/* Letra 2 */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {isEditing && tempRow ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempRow.letra2Valor}
                        onChange={(e) => setTempRow({ ...tempRow, letra2Valor: parseFloat(e.target.value) || 0 })}
                        className="w-24 bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-right font-mono text-xs text-emerald-300"
                      />
                    ) : (
                      formatCurrency(row.letra2Valor)
                    )}
                  </td>

                  {/* Diferenca Unitaria */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-300">
                    {formatCurrency(row.diferencaUnitaria)}
                  </td>

                  {/* Qtd Competencias */}
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {row.qtdMeses}
                  </td>

                  {/* Subtotal Acumulado */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">
                    {formatCurrency(row.totalDiferenca)}
                  </td>

                  {/* Reflexo 13º */}
                  <td className="py-3 px-4 text-right font-mono text-amber-300 font-medium">
                    {formatCurrency(row.reflexo13)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center">
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="Salvar alteração"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(row)}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                        title="Editar valores manualmente"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-950 border-t-2 border-slate-700 text-slate-100 font-bold text-xs">
              <td className="py-4 px-4 uppercase tracking-wider text-slate-300">
                TOTAL GERAL DA APURAÇÃO
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-300">
                {formatCurrency(summary.totalLetra1Mensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono text-slate-400">
                -
              </td>
              <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                {formatCurrency(summary.totalLetra2Mensal)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-blue-300 text-sm">
                {formatCurrency(summary.totalDiferencaMensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono text-slate-300">
                {summary.competenciasSelecionadas.length}
              </td>
              <td className="py-4 px-4 text-right font-mono text-indigo-300 text-sm">
                {formatCurrency(summary.totalDiferencaAcumulada)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-amber-300 text-sm">
                {formatCurrency(summary.totalReflexo13)}
              </td>
              <td className="py-4 px-3"></td>
            </tr>
          </tfoot>

        </table>
      </div>

      {/* Table Footer Note */}
      <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Fórmulas em conformidade com as diretrizes do plano de cargos e estatuto dos servidores públicos de Rio Verde - GO.</span>
        </div>
        <div className="text-slate-300 font-semibold">
          Total Devido (Diferença + Reflexos): <span className="text-emerald-400 text-sm font-black">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

    </div>
  );
};
