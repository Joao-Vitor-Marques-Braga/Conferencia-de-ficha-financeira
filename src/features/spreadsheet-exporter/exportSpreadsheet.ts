import type { ProgressionSummary } from '../../core/types';
import type { ConsolidationSummaryData } from '../calculation/domain/types';
import { formatPercent } from '../../core/utils/formatters';

/**
 * Utility to download CSV file with UTF-8 BOM for Microsoft Excel compatibility.
 */
function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats monetary numbers for CSV (e.g. 1234.56 -> "1234,56")
 */
function toCsvNumber(num: number): string {
  return num.toFixed(2).replace('.', ',');
}

/**
 * Export Consolidated Progression Sheet
 */
export const exportConsolidatedSpreadsheet = (
  summary: ProgressionSummary,
  consolidation?: ConsolidationSummaryData
) => {
  const server = summary.server;
  const params = summary.params;

  const rows: string[][] = [
    ['PREFEITURA MUNICIPAL DE RIO VERDE - GOIÁS'],
    ['DEMONSTRATIVO CONSOLIDADO DE PROGRESSÃO FUNCIONAL & PARCELAMENTO'],
    [''],
    ['DADOS DO SERVIDOR'],
    ['Servidor(a)', server.nome || 'NÃO INFORMADO'],
    ['Matrícula', server.matricula || 'N/A'],
    ['Cargo', server.cargo || 'NÃO INFORMADO'],
    ['Órgão', server.orgao || 'FMS'],
    ['Ato / Portaria', params.portariaNumero || server.portariaNumero || 'N/A'],
    ['Período Apurado', `${params.mesInicial} a ${params.mesFinal}`],
    ['Modo de Rateio', params.modoRateio === 'DATA_EFETIVA' ? `Data Efetiva: ${params.dataEfetiva}` : `Dias Manuais: ${params.diasRetroativos} dias`],
    ['% Progressão', formatPercent(params.percentualProgressao)],
    ['% ATS', formatPercent(params.percentualATS)],
    [''],
    ['DEMONSTRATIVO ANALÍTICO DE DIFERENÇAS SALARIAIS'],
    ['Código', 'Descrição da Verba / Rubrica', 'Letra 1 (R$)', '% Aplicado', 'Letra 2 (R$)', 'Diferença Unitária / Mês (R$)', 'Qtd. Meses', 'Total Diferença Acumulada (R$)', 'Reflexo 13º (R$)', 'Reflexo Férias 1/3 (R$)', 'Total c/ Reflexos (R$)']
  ];

  summary.rows.forEach(r => {
    const totalComReflexos = r.totalDiferenca + r.reflexo13 + r.reflexoFerias;
    rows.push([
      r.codigo,
      r.descricao,
      toCsvNumber(r.letra1Valor),
      formatPercent(r.percentualAplicado),
      toCsvNumber(r.letra2Valor),
      toCsvNumber(r.diferencaUnitaria),
      r.qtdMeses.toFixed(2).replace('.', ','),
      toCsvNumber(r.totalDiferenca),
      toCsvNumber(r.reflexo13),
      toCsvNumber(r.reflexoFerias),
      toCsvNumber(totalComReflexos)
    ]);
  });

  // Totals Row
  rows.push([
    'TOTAL',
    'TOTAL GERAL ANALÍTICO',
    toCsvNumber(summary.totalLetra1Mensal),
    '-',
    toCsvNumber(summary.totalLetra2Mensal),
    toCsvNumber(summary.totalDiferencaMensal),
    summary.qtdMesesEquivalentes.toFixed(2).replace('.', ','),
    toCsvNumber(summary.totalDiferencaAcumulada),
    toCsvNumber(summary.totalReflexo13),
    toCsvNumber(summary.totalReflexoFerias),
    toCsvNumber(summary.grandTotal)
  ]);

  if (consolidation) {
    rows.push(['']);
    rows.push(['QUADRO DE CONSOLIDAÇÃO & PARCELAMENTO']);
    rows.push(['Verba / Evento', 'Total Integral (R$)', 'Nº Parcelas', 'Valor Parcela Integral (R$)', 'Total Proporcional (R$)', 'Valor Parcela Proporcional (R$)', 'Total Geral (R$)', 'Total Geral Parcelado (R$)']);

    consolidation.items.forEach(it => {
      rows.push([
        it.descricao,
        toCsvNumber(it.valorTotalIntegral),
        it.parcelas.toString(),
        toCsvNumber(it.valorParcelaIntegral),
        toCsvNumber(it.valorTotalProporcional),
        toCsvNumber(it.valorParcelaProporcional),
        toCsvNumber(it.totalGeral),
        toCsvNumber(it.totalGeralParcelado)
      ]);
    });

    rows.push([
      'TOTAL CONSOLIDADO',
      toCsvNumber(consolidation.somaTotalIntegral),
      '-',
      toCsvNumber(consolidation.somaParcelaIntegral),
      toCsvNumber(consolidation.somaTotalProporcional),
      toCsvNumber(consolidation.somaParcelaProporcional),
      toCsvNumber(consolidation.somaTotalGeral),
      toCsvNumber(consolidation.somaTotalGeralParcelado)
    ]);
  }

  const csvContent = rows
    .map(r => r.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  const cleanName = (server.nome || 'Servidor').replace(/\s+/g, '_');
  downloadCsv(csvContent, `Progressao_Consolidada_${cleanName}.csv`);
};

/**
 * Export Detailed Month-by-Month Spreadsheet
 */
export const exportDetailedMonthlySpreadsheet = (summary: ProgressionSummary) => {
  const server = summary.server;
  const params = summary.params;

  const rows: string[][] = [
    ['PREFEITURA MUNICIPAL DE RIO VERDE - GOIÁS'],
    ['DETALHAMENTO MÊS A MÊS DE DIFERENÇAS SALARIAIS'],
    ['Servidor(a)', server.nome || 'NÃO INFORMADO', 'Matrícula', server.matricula || 'N/A', 'Cargo', server.cargo || 'NÃO INFORMADO'],
    ['Ato / Portaria', params.portariaNumero || 'N/A', 'Período', `${params.mesInicial} a ${params.mesFinal}`],
    [''],
    [
      'Exercício (Ano)',
      'Competência',
      'Mês',
      'Dias Devidos',
      'Dias no Mês',
      '% Aplicado',
      'Cód. Rubrica',
      'Descrição da Rubrica',
      'Letra 1 (R$)',
      'Letra 2 (R$)',
      'Diferença Mês (R$)',
      'Reflexo 13º Mês (R$)',
      'Reflexo Férias Mês (R$)',
      'Total Devido no Mês (R$)'
    ]
  ];

  summary.monthlyBreakdown.forEach(month => {
    month.eventos.forEach(ev => {
      rows.push([
        month.ano.toString(),
        month.competencia,
        month.mesNome,
        month.diasDevidos.toString(),
        month.diasNoMes.toString(),
        formatPercent(month.percentualAplicado),
        ev.codigo,
        ev.descricao,
        toCsvNumber(ev.letra1Valor),
        toCsvNumber(ev.letra2Valor),
        toCsvNumber(ev.diferenca),
        toCsvNumber(month.reflexo13),
        toCsvNumber(month.reflexoFerias),
        toCsvNumber(month.totalMes)
      ]);
    });
  });

  const csvContent = rows
    .map(r => r.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  const cleanName = (server.nome || 'Servidor').replace(/\s+/g, '_');
  downloadCsv(csvContent, `Progressao_Detalhada_Mes_a_Mes_${cleanName}.csv`);
};
