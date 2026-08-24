import React, { useState, useMemo } from 'react';
import type { IncentivePeriod } from '../../../core/types';
import { calculateIncentiveSummary } from '../domain/calculateIncentive';
import { formatCurrency, formatPercent } from '../../../core/utils/formatters';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  Download
} from 'lucide-react';

export const FunctionalIncentiveView: React.FC = () => {
  const [serverNome, setServerNome] = useState('MARIA EDUARDA SILVA E SOUZA');
  const [serverMatricula, setServerMatricula] = useState('104859-1');
  const [cargo, setCargo] = useState('ENFERMEIRO - CLASSE B');
  const [portaria, setPortaria] = useState('Portaria nº 540/2026');

  const [startComp, setStartComp] = useState('01/2024');
  const [endComp, setEndComp] = useState('12/2024');
  const [defaultBaseSalary, setDefaultBaseSalary] = useState<number>(5493.74);
  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, number>>({});
  const [aplicarReflexos, setAplicarReflexos] = useState<boolean>(true);

  // Multi-period percentual rules
  const [periods, setPeriods] = useState<IncentivePeriod[]>([
    { id: '1', mesInicial: '01/2024', mesFinal: '06/2024', percentual: 10 },
    { id: '2', mesInicial: '07/2024', mesFinal: '12/2024', percentual: 20 }
  ]);

  const [newPeriodStart, setNewPeriodStart] = useState('01/2025');
  const [newPeriodEnd, setNewPeriodEnd] = useState('12/2025');
  const [newPeriodPct, setNewPeriodPct] = useState<number>(20);

  const summary = useMemo(() => {
    return calculateIncentiveSummary(
      serverNome,
      serverMatricula,
      startComp,
      endComp,
      defaultBaseSalary,
      monthlyOverrides,
      periods,
      aplicarReflexos
    );
  }, [serverNome, serverMatricula, startComp, endComp, defaultBaseSalary, monthlyOverrides, periods, aplicarReflexos]);

  const handleAddPeriod = () => {
    if (!newPeriodStart || !newPeriodEnd) return;
    const newP: IncentivePeriod = {
      id: Date.now().toString(),
      mesInicial: newPeriodStart,
      mesFinal: newPeriodEnd,
      percentual: newPeriodPct
    };
    setPeriods(prev => [...prev, newP]);
  };

  const handleRemovePeriod = (id: string) => {
    setPeriods(prev => prev.filter(p => p.id !== id));
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['PREFEITURA MUNICIPAL DE RIO VERDE - GOIÁS'],
      ['DEMONSTRATIVO DE DIFERENÇAS DE INCENTIVO FUNCIONAL'],
      ['Servidor(a)', serverNome, 'Matrícula', serverMatricula, 'Cargo', cargo],
      ['Portaria / Ato', portaria, 'Período Apurado', `${startComp} a ${endComp}`],
      [''],
      ['Competência', 'Mês', 'Salário Base (R$)', '% Incentivo', 'Valor Devido (R$)', 'Diferença (R$)', 'Reflexo 13º (R$)', 'Reflexo Férias (R$)', 'Total Mês (R$)']
    ];

    summary.monthlyRows.forEach(r => {
      rows.push([
        r.competencia,
        r.mesNome,
        r.salarioBase.toFixed(2).replace('.', ','),
        formatPercent(r.percentualDevido),
        r.valorIncentivoDevido.toFixed(2).replace('.', ','),
        r.diferenca.toFixed(2).replace('.', ','),
        r.reflexo13.toFixed(2).replace('.', ','),
        r.reflexoFerias.toFixed(2).replace('.', ','),
        r.totalMes.toFixed(2).replace('.', ',')
      ]);
    });

    rows.push([
      'TOTAL',
      'TOTAL GERAL ACUMULADO',
      summary.totalBaseAcumulada.toFixed(2).replace('.', ','),
      '-',
      summary.totalIncentivoDevido.toFixed(2).replace('.', ','),
      summary.totalDiferenca.toFixed(2).replace('.', ','),
      summary.totalReflexo13.toFixed(2).replace('.', ','),
      summary.totalReflexoFerias.toFixed(2).replace('.', ','),
      summary.grandTotal.toFixed(2).replace('.', ',')
    ]);

    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Incentivo_Funcional_${serverNome.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Header Banner */}
      <div className="solid-card rounded-2xl p-6 border-l-4 border-l-[#008d50] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#008d50]/20 border border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Calculadora de Incentivo Funcional</h2>
            <p className="text-xs text-slate-400 font-medium">
              Apuração de diferenças retroativas com percentuais configuráveis por período e edição de salário-base
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-[#008d50] hover:bg-[#00663a] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Planilha Excel/CSV
        </button>
      </div>

      {/* Metadata & General Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Servidor & Portaria */}
        <div className="solid-card rounded-2xl p-5 space-y-3.5 bg-[#101c2b]">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider text-slate-400">
            Identificação do Servidor
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Nome do(a) Servidor(a)</label>
              <input
                type="text"
                value={serverNome}
                onChange={(e) => setServerNome(e.target.value)}
                className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Matrícula</label>
                <input
                  type="text"
                  value={serverMatricula}
                  onChange={(e) => setServerMatricula(e.target.value)}
                  className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Portaria / Decreto</label>
                <input
                  type="text"
                  value={portaria}
                  onChange={(e) => setPortaria(e.target.value)}
                  className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-[#ead04d] font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Período & Salário Base */}
        <div className="solid-card rounded-2xl p-5 space-y-3.5 bg-[#101c2b]">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider text-slate-400">
            Período Global & Salário Base
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Mês Inicial (MM/AAAA)</label>
                <input
                  type="text"
                  value={startComp}
                  placeholder="01/2024"
                  onChange={(e) => setStartComp(e.target.value)}
                  className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Mês Final (MM/AAAA)</label>
                <input
                  type="text"
                  value={endComp}
                  placeholder="12/2024"
                  onChange={(e) => setEndComp(e.target.value)}
                  className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Salário-Base Padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                value={defaultBaseSalary}
                onChange={(e) => setDefaultBaseSalary(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b131e] border border-[#008d50]/50 rounded-xl px-3 py-1.5 text-[#008d50] font-black text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Você também pode ajustar valores específicos de cada mês diretamente na tabela abaixo.
              </p>
            </div>

            <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none font-bold text-xs">
              <input
                type="checkbox"
                checked={aplicarReflexos}
                onChange={(e) => setAplicarReflexos(e.target.checked)}
                className="accent-[#008d50] w-4 h-4 rounded"
              />
              <span>Calcular Reflexos (13º Salário e Férias 1/3)</span>
            </label>
          </div>
        </div>

        {/* Card 3: Regras de Percentual por Período */}
        <div className="solid-card rounded-2xl p-5 space-y-3.5 bg-[#101c2b]">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Regras de Percentual (%)</span>
            <span className="text-[10px] text-[#ead04d] font-bold">{periods.length} regras ativas</span>
          </h3>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1 text-xs">
            {periods.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#17263a] border border-[#324f72]/60"
              >
                <div>
                  <span className="font-bold text-white">{p.mesInicial} a {p.mesFinal}</span>
                  <span className="ml-2 px-2 py-0.5 rounded bg-[#008d50]/20 text-[#008d50] font-black">
                    {p.percentual}%
                  </span>
                </div>
                <button
                  onClick={() => handleRemovePeriod(p.id)}
                  disabled={periods.length <= 1}
                  className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add period form */}
          <div className="pt-2 border-t border-[#324f72]/40 flex items-center gap-1.5 text-xs">
            <input
              type="text"
              placeholder="Início"
              value={newPeriodStart}
              onChange={(e) => setNewPeriodStart(e.target.value)}
              className="w-16 bg-[#0b131e] border border-[#324f72] rounded-lg px-2 py-1 text-white font-bold text-[11px]"
            />
            <span className="text-slate-400">a</span>
            <input
              type="text"
              placeholder="Fim"
              value={newPeriodEnd}
              onChange={(e) => setNewPeriodEnd(e.target.value)}
              className="w-16 bg-[#0b131e] border border-[#324f72] rounded-lg px-2 py-1 text-white font-bold text-[11px]"
            />
            <input
              type="number"
              placeholder="%"
              value={newPeriodPct}
              onChange={(e) => setNewPeriodPct(parseFloat(e.target.value) || 0)}
              className="w-14 bg-[#0b131e] border border-[#324f72] rounded-lg px-2 py-1 text-white font-bold text-[11px]"
            />
            <button
              onClick={handleAddPeriod}
              className="p-1.5 bg-[#008d50] hover:bg-[#00663a] text-white rounded-lg cursor-pointer"
              title="Adicionar Período de Percentual"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#324f72] bg-[#101c2b]">
          <span className="text-[11px] text-slate-400 font-bold block">Base Acumulada</span>
          <strong className="text-lg font-black text-white font-mono mt-1 block">
            {formatCurrency(summary.totalBaseAcumulada)}
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">{summary.monthlyRows.length} meses apurados</span>
        </div>

        <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#f88543] bg-[#101c2b]">
          <span className="text-[11px] text-slate-400 font-bold block">Diferença do Incentivo</span>
          <strong className="text-lg font-black text-[#f88543] font-mono mt-1 block">
            {formatCurrency(summary.totalDiferenca)}
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">Valor principal retroativo</span>
        </div>

        <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#ead04d] bg-[#101c2b]">
          <span className="text-[11px] text-slate-400 font-bold block">Reflexos (13º + Férias 1/3)</span>
          <strong className="text-lg font-black text-[#ead04d] font-mono mt-1 block">
            {formatCurrency(summary.totalReflexo13 + summary.totalReflexoFerias)}
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">
            13º: {formatCurrency(summary.totalReflexo13)} | Férias: {formatCurrency(summary.totalReflexoFerias)}
          </span>
        </div>

        <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#008d50] bg-[#101c2b]">
          <span className="text-[11px] text-slate-400 font-bold block">Total Geral Devido</span>
          <strong className="text-xl font-black text-[#008d50] font-mono mt-1 block">
            {formatCurrency(summary.grandTotal)}
          </strong>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Principal + Reflexos Legais</span>
        </div>
      </div>

      {/* Monthly Calculation Table */}
      <div className="solid-card rounded-2xl overflow-hidden shadow-xs bg-[#101c2b]">
        <div className="px-6 py-4 bg-[#132030] border-b border-[#324f72]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#ead04d]" />
            <h3 className="text-sm font-extrabold text-white">Demonstrativo Mês a Mês do Incentivo Funcional</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {summary.monthlyRows.length} meses apurados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#0b131e] text-slate-200 border-b border-[#324f72]/40 uppercase font-black text-[10px]">
                <th className="py-3 px-4">Competência</th>
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4 text-right">Salário Base (R$)</th>
                <th className="py-3 px-4 text-center">% Inc.</th>
                <th className="py-3 px-4 text-right text-[#008d50]">Incentivo Devido</th>
                <th className="py-3 px-4 text-right text-[#ead04d]">Diferença Mês</th>
                <th className="py-3 px-4 text-right text-slate-300">Reflexo 13º</th>
                <th className="py-3 px-4 text-right text-slate-300">Férias 1/3</th>
                <th className="py-3 px-4 text-right text-[#f88543]">Total do Mês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#324f72]/30 text-slate-200">
              {summary.monthlyRows.map((r) => (
                <tr key={r.competencia} className="hover:bg-[#1b2a3f]/50">
                  <td className="py-2.5 px-4 font-bold text-white">{r.competencia}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">{r.mesNome}</td>
                  <td className="py-2.5 px-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={r.salarioBase}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMonthlyOverrides(prev => ({ ...prev, [r.competencia]: val }));
                      }}
                      className="w-24 bg-[#0b131e] border border-[#324f72] rounded px-2 py-0.5 text-right font-mono text-xs text-white"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b131e] text-slate-300 border border-[#324f72]/40 font-bold">
                      {formatPercent(r.percentualDevido)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#008d50] font-bold">
                    {formatCurrency(r.valorIncentivoDevido)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#ead04d] font-bold">
                    {formatCurrency(r.diferenca)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-300">
                    {formatCurrency(r.reflexo13)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-300">
                    {formatCurrency(r.reflexoFerias)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#f88543] font-black">
                    {formatCurrency(r.totalMes)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0b131e] border-t-2 border-[#324f72] text-white font-bold text-xs">
                <td colSpan={2} className="py-3.5 px-4 uppercase font-black">
                  TOTAL GERAL
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                  {formatCurrency(summary.totalBaseAcumulada)}
                </td>
                <td className="py-3.5 px-4 text-center">-</td>
                <td className="py-3.5 px-4 text-right text-[#008d50] font-black">
                  {formatCurrency(summary.totalIncentivoDevido)}
                </td>
                <td className="py-3.5 px-4 text-right text-[#ead04d] font-black">
                  {formatCurrency(summary.totalDiferenca)}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-200">
                  {formatCurrency(summary.totalReflexo13)}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-200">
                  {formatCurrency(summary.totalReflexoFerias)}
                </td>
                <td className="py-3.5 px-4 text-right text-[#008d50] font-black text-sm">
                  {formatCurrency(summary.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
