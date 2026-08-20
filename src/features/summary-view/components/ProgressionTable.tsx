import React, { useState } from 'react';
import type { CalculatedEventRow, ProgressionSummary } from '../../../core/types';
import { formatCurrency, formatPercent } from '../../../core/utils/formatters';
import { Edit3, Check, Info, FileSpreadsheet, Trash2, RotateCcw } from 'lucide-react';

interface ProgressionTableProps {
  summary: ProgressionSummary;
  onRowUpdate?: (updatedRow: CalculatedEventRow) => void;
  onDeleteRow?: (codigo: string) => void;
  deletedCount?: number;
  onRestoreRows?: () => void;
  onAddRow?: () => void;
}

export const ProgressionTable: React.FC<ProgressionTableProps> = ({
  summary,
  onRowUpdate,
  onDeleteRow,
  deletedCount = 0,
  onRestoreRows
}) => {
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
    <div className="solid-card rounded-2xl overflow-hidden shadow-xs my-6">
      
      {/* Table Top Toolbar */}
      <div className="px-6 py-4 bg-[#101c2b] border-b border-[#324f72]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#008d50]/20 border border-[#008d50]/30 flex items-center justify-center text-[#008d50]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Demonstrativo Analítico de Diferenças Salariais</h3>
            <p className="text-xs text-slate-400 font-medium">Apurado com base no reajuste da progressão funcional e adicionais incidentes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {deletedCount > 0 && onRestoreRows && (
            <button
              onClick={onRestoreRows}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
              title="Restaurar linhas excluídas"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Restaurar {deletedCount} {deletedCount === 1 ? 'linha' : 'linhas'}
            </button>
          )}

          <span className="px-3 py-1 rounded-lg bg-[#324f72]/30 border border-[#324f72] text-[#ead04d] font-bold shadow-2xs">
            {summary.competenciasSelecionadas.length} {summary.competenciasSelecionadas.length === 1 ? 'mês apurado' : 'meses apurados'} ({summary.totalDiasRetroativos} dias retroativos)
          </span>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          
          {/* Table Header */}
          <thead>
            <tr className="bg-[#0b131e] text-slate-200 border-b border-[#324f72]/40 uppercase font-black text-[11px] tracking-wider">
              <th className="py-3.5 px-4 font-black">Cód. / Evento</th>
              <th className="py-3.5 px-4 text-right font-black">Letra 1 (R$)</th>
              <th className="py-3.5 px-4 text-center font-black">% Appl.</th>
              <th className="py-3.5 px-4 text-right font-black text-[#008d50]">Letra 2 (R$)</th>
              <th className="py-3.5 px-4 text-right font-black text-[#ead04d]">Diferença/Mês</th>
              <th className="py-3.5 px-4 text-center font-black">Qtd. Meses</th>
              <th className="py-3.5 px-4 text-right font-black text-[#f88543]">Total Acumulado</th>
              <th className="py-3.5 px-4 text-right font-black text-slate-300">Reflexo 13º</th>
              <th className="py-3.5 px-3 text-center font-black">Ações</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#324f72]/30 text-slate-200">
            {summary.rows.map((row) => {
              const isEditing = editingCode === row.codigo;

              return (
                <tr
                  key={row.codigo}
                  className={`transition-colors hover:bg-[#1b2a3f]/50 ${
                    row.isSalarioBase ? 'bg-[#008d50]/10 font-bold' : ''
                  }`}
                >
                  {/* Cod / Descricao */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#1b2a3f] text-slate-200 font-mono text-[10px] border border-[#324f72]/60 font-black">
                        {row.codigo}
                      </span>
                      <span className="font-bold text-white">{row.descricao}</span>
                      {row.isSalarioBase && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#008d50]/20 text-[#008d50] border border-[#008d50]/40">
                          BASE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Letra 1 */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-300">
                    {isEditing && tempRow ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempRow.letra1Valor}
                        onChange={(e) => setTempRow({ ...tempRow, letra1Valor: parseFloat(e.target.value) || 0 })}
                        className="w-24 bg-[#0b131e] border border-[#324f72] rounded px-2 py-1 text-right font-mono text-xs text-white font-bold"
                      />
                    ) : (
                      formatCurrency(row.letra1Valor)
                    )}
                  </td>

                  {/* % Aplicado */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b131e] text-slate-300 border border-[#324f72]/40 font-bold">
                      {formatPercent(row.percentualAplicado)}
                    </span>
                  </td>

                  {/* Letra 2 */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-[#008d50]">
                    {isEditing && tempRow ? (
                      <input
                        type="number"
                        step="0.01"
                        value={tempRow.letra2Valor}
                        onChange={(e) => setTempRow({ ...tempRow, letra2Valor: parseFloat(e.target.value) || 0 })}
                        className="w-24 bg-[#0b131e] border border-[#008d50] rounded px-2 py-1 text-right font-mono text-xs text-[#008d50] font-bold"
                      />
                    ) : (
                      formatCurrency(row.letra2Valor)
                    )}
                  </td>

                  {/* Diferenca Unitaria */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-[#ead04d]">
                    {formatCurrency(row.diferencaUnitaria)}
                  </td>

                  {/* Qtd Meses / Proporcao */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    {row.qtdMeses.toString().replace('.', ',')}
                  </td>

                  {/* Subtotal Acumulado */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-[#f88543]">
                    {formatCurrency(row.totalDiferenca)}
                  </td>

                  {/* Reflexo 13º */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-300">
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
                          className="p-1 text-slate-400 hover:text-white hover:bg-[#1b2a3f] rounded cursor-pointer transition-colors"
                          title="Editar valores manualmente"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onDeleteRow && (
                        <button
                          onClick={() => onDeleteRow(row.codigo)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                          title={`Excluir verba ${row.descricao} da apuração`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-[#0b131e] border-t-2 border-[#324f72] text-white font-bold text-xs">
              <td className="py-4 px-4 uppercase tracking-wider text-slate-200 font-black">
                TOTAL GERAL DA APURAÇÃO
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold text-slate-300">
                {formatCurrency(summary.totalLetra1Mensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                -
              </td>
              <td className="py-4 px-4 text-right font-mono text-[#008d50] text-sm font-black">
                {formatCurrency(summary.totalLetra2Mensal)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-[#ead04d] text-sm font-black">
                {formatCurrency(summary.totalDiferencaMensal)}
              </td>
              <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">
                {summary.qtdMesesEquivalentes.toString().replace('.', ',')}
              </td>
              <td className="py-4 px-4 text-right font-mono text-[#f88543] text-sm font-black">
                {formatCurrency(summary.totalDiferencaAcumulada)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-200 text-sm font-bold">
                {formatCurrency(summary.totalReflexo13)}
              </td>
              <td className="py-4 px-3"></td>
            </tr>
          </tfoot>

        </table>
      </div>

      {/* Table Footer Note */}
      <div className="px-6 py-3.5 bg-[#101c2b] border-t border-[#324f72]/40 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#ead04d]" />
          <span>Fórmulas em conformidade com o plano de cargos da Prefeitura Municipal de Rio Verde — GO.</span>
        </div>
        <div className="text-slate-200 font-bold">
          Total Devido ({summary.totalDiasRetroativos} dias retroativos): <span className="text-[#008d50] text-sm font-black ml-1">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

    </div>
  );
};
