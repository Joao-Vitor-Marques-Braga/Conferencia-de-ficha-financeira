import type {
  CalculatedEventRow,
  MonthlyBreakdownDetail,
  ProgressionParams,
  ProgressionSummary,
  ServerInfo,
  YearlyBreakdownGroup
} from '../../../../core/types';
import { roundMoney } from '../../../../core/utils/math';
import type { MultiYearConsolidatedSummary } from '../types';

/**
 * Pure function: Consolidates multiple single-year ProgressionSummary results
 * into a single unified timeline and multi-year analytical summary.
 *
 * Rules:
 * 1. Aggregates rows (Demonstrativo Analítico) strictly by `(codigo + descricao)`, NEVER by year.
 * 2. Totals are derived by direct mathematical summation across yearly results.
 * 3. Monthly and yearly breakdowns are cleanly merged in chronological order.
 */
export function consolidateYearlyResults(
  yearlySummaries: ProgressionSummary[],
  params: ProgressionParams,
  serverInfo?: ServerInfo
): MultiYearConsolidatedSummary {
  if (!yearlySummaries || yearlySummaries.length === 0) {
    return {
      server: serverInfo || { nome: '', matricula: '', cargo: '', orgao: '' },
      params,
      competenciasDisponiveis: [],
      competenciasSelecionadas: [],
      totalDiasRetroativos: 0,
      qtdMesesEquivalentes: 0,
      rows: [],
      monthlyBreakdown: [],
      yearlyBreakdown: [],
      totalLetra1Mensal: 0,
      totalLetra2Mensal: 0,
      totalDiferencaMensal: 0,
      totalDiferencaAcumulada: 0,
      totalReflexo13: 0,
      totalReflexoFerias: 0,
      grandTotal: 0,
      isMultiYear: false
    };
  }

  if (yearlySummaries.length === 1) {
    return {
      ...yearlySummaries[0],
      server: serverInfo || yearlySummaries[0].server,
      yearlyEntries: [{
        ano: yearlySummaries[0].yearlyBreakdown[0]?.ano || 2026,
        summary: yearlySummaries[0]
      }],
      isMultiYear: false
    };
  }

  // 1. Merge Server Metadata
  const mergedServer: ServerInfo = {
    ...yearlySummaries[0].server,
    ...(serverInfo || {})
  };

  // 2. Sum overall totals across all years
  const totalDiasRetroativos = yearlySummaries.reduce((acc, s) => acc + s.totalDiasRetroativos, 0);
  const qtdMesesEquivalentes = roundMoney(yearlySummaries.reduce((acc, s) => acc + s.qtdMesesEquivalentes, 0));
  const totalDiferencaAcumulada = roundMoney(yearlySummaries.reduce((acc, s) => acc + s.totalDiferencaAcumulada, 0));
  const totalReflexo13 = roundMoney(yearlySummaries.reduce((acc, s) => acc + s.totalReflexo13, 0));
  const totalReflexoFerias = roundMoney(yearlySummaries.reduce((acc, s) => acc + s.totalReflexoFerias, 0));
  const grandTotal = roundMoney(yearlySummaries.reduce((acc, s) => acc + s.grandTotal, 0));

  // 3. Concatenate Monthly and Yearly breakdowns chronologically
  const monthlyBreakdown: MonthlyBreakdownDetail[] = yearlySummaries.flatMap(s => s.monthlyBreakdown);
  const yearlyBreakdown: YearlyBreakdownGroup[] = yearlySummaries.flatMap(s => s.yearlyBreakdown);

  // 4. Consolidate Analytical Rows (by codigo + normalized description)
  interface RowAccumulator {
    codigo: string;
    descricao: string;
    referenciaOrig: string;
    sumL1Weighted: number;
    sumL2Weighted: number;
    totalWeight: number;
    percentualAplicado: number;
    totalDiferenca: number;
    reflexo13: number;
    reflexoFerias: number;
    isSalarioBase: boolean;
    isUnified?: boolean;
    origemCodigos?: string[];
  }

  const rowMap = new Map<string, RowAccumulator>();

  yearlySummaries.forEach(summary => {
    summary.rows.forEach(row => {
      const normDesc = row.descricao.trim().toUpperCase();
      const key = `${row.codigo}_${normDesc}`;
      const weight = row.qtdMeses > 0 ? row.qtdMeses : 1;

      const existing = rowMap.get(key);
      if (existing) {
        existing.totalDiferenca = roundMoney(existing.totalDiferenca + row.totalDiferenca);
        existing.reflexo13 = roundMoney(existing.reflexo13 + row.reflexo13);
        existing.reflexoFerias = roundMoney(existing.reflexoFerias + row.reflexoFerias);
        existing.sumL1Weighted += row.letra1Valor * weight;
        existing.sumL2Weighted += row.letra2Valor * weight;
        existing.totalWeight += weight;
      } else {
        rowMap.set(key, {
          codigo: row.codigo,
          descricao: row.descricao,
          referenciaOrig: row.referenciaOrig,
          sumL1Weighted: row.letra1Valor * weight,
          sumL2Weighted: row.letra2Valor * weight,
          totalWeight: weight,
          percentualAplicado: row.percentualAplicado,
          totalDiferenca: row.totalDiferenca,
          reflexo13: row.reflexo13,
          reflexoFerias: row.reflexoFerias,
          isSalarioBase: row.isSalarioBase,
          isUnified: row.isUnified,
          origemCodigos: row.origemCodigos
        });
      }
    });
  });

  const rows: CalculatedEventRow[] = Array.from(rowMap.values()).map(item => {
    const l1Valor = roundMoney(item.sumL1Weighted / (item.totalWeight || 1));
    const l2Valor = roundMoney(item.sumL2Weighted / (item.totalWeight || 1));
    const diferencaUnitaria = roundMoney(l2Valor - l1Valor);
    const qtdMeses = diferencaUnitaria > 0
      ? roundMoney(item.totalDiferenca / diferencaUnitaria)
      : qtdMesesEquivalentes;

    return {
      codigo: item.codigo,
      descricao: item.descricao,
      referenciaOrig: item.referenciaOrig,
      letra1Valor: l1Valor,
      percentualAplicado: item.percentualAplicado,
      letra2Valor: l2Valor,
      diferencaUnitaria,
      qtdMeses,
      totalDiasRetroativos,
      totalDiferenca: item.totalDiferenca,
      reflexo13: item.reflexo13,
      reflexoFerias: item.reflexoFerias,
      isSalarioBase: item.isSalarioBase,
      isUnified: item.isUnified,
      origemCodigos: item.origemCodigos
    };
  });

  // Sort rows: Salário Base first, then by numeric code
  rows.sort((a, b) => {
    if (a.isSalarioBase) return -1;
    if (b.isSalarioBase) return 1;
    const numA = parseInt(a.codigo, 10) || 9999;
    const numB = parseInt(b.codigo, 10) || 9999;
    return numA - numB;
  });

  const totalLetra1Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra1Valor, 0));
  const totalLetra2Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra2Valor, 0));
  const totalDiferencaMensal = roundMoney(totalLetra2Mensal - totalLetra1Mensal);

  const competenciasDisponiveis = Array.from(
    new Set(yearlySummaries.flatMap(s => s.competenciasDisponiveis))
  );
  const competenciasSelecionadas = yearlySummaries.flatMap(s => s.competenciasSelecionadas);

  const yearlyEntries = yearlySummaries.map(s => ({
    ano: s.yearlyBreakdown[0]?.ano || 2026,
    summary: s
  }));

  return {
    server: mergedServer,
    params,
    competenciasDisponiveis,
    competenciasSelecionadas,
    totalDiasRetroativos,
    qtdMesesEquivalentes,
    rows,
    monthlyBreakdown,
    yearlyBreakdown,
    yearlyEntries,
    totalLetra1Mensal,
    totalLetra2Mensal,
    totalDiferencaMensal,
    totalDiferencaAcumulada,
    totalReflexo13,
    totalReflexoFerias,
    grandTotal,
    isMultiYear: true
  };
}
