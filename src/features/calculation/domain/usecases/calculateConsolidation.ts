import type { ProgressionSummary } from '../../../../core/types';
import type { ConsolidationItem, ConsolidationSummaryData, InstallmentOverrideMap } from '../types';
import { roundMoney } from '../../../../core/utils/math';

export const calculateConsolidation = (
  summary: ProgressionSummary,
  diasRetroativos: number = 30,
  installmentOverrides: InstallmentOverrideMap = {}
): ConsolidationSummaryData => {
  const numSelectedMonths = summary.competenciasSelecionadas.length;
  // Períodos integrais correspondem aos meses da apuração excluindo o mês inicial proporcional
  const qtdMesesIntegrais = Math.max(0, numSelectedMonths - 1);

  const items: ConsolidationItem[] = [];

  let somaProporcionalVerbasBase = 0;
  let somaIntegralVerbasBase = 0;

  // 1. Process standard non-ferias rows directly from analytical summary.rows
  summary.rows.forEach((row) => {
    const isFerias = row.codigo === '163' || row.descricao.toUpperCase().includes('FÉRIAS') || row.descricao.toUpperCase().includes('FERIAS');
    if (isFerias) return;

    const parcelas = Math.max(1, installmentOverrides[row.codigo] ?? 1);
    const diferencaMensalBase = row.diferencaUnitaria;

    // Períodos integrais = diferencaMensal * meses integrais (N - 1)
    const valorTotalIntegral = roundMoney(diferencaMensalBase * qtdMesesIntegrais);
    // Proporcional = (diferencaMensal / 30) * diasRetroativos do mês inicial
    const valorTotalProporcional = roundMoney((diferencaMensalBase / 30) * diasRetroativos);

    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);

    // Sum base for Férias and 13º calculation
    somaIntegralVerbasBase += valorTotalIntegral;
    somaProporcionalVerbasBase += valorTotalProporcional;

    // Only include rows that have actual difference values (> 0)
    if (totalGeral > 0) {
      items.push({
        id: row.codigo,
        codigo: row.codigo,
        descricao: row.descricao,
        valorTotalIntegral,
        parcelas,
        valorParcelaIntegral,
        diferencaMensalBase,
        valorTotalProporcional,
        valorParcelaProporcional,
        totalGeral,
        totalGeralParcelado
      });
    }
  });

  // 2. Process Férias 1/3 (if present in analytical summary)
  const feriasRow = summary.rows.find(r => r.codigo === '163' || r.descricao.toUpperCase().includes('FÉRIAS') || r.descricao.toUpperCase().includes('FERIAS'));
  if (feriasRow) {
    const diasFerias = summary.params.diasFerias || 15;
    const divisorFerias = diasFerias === 15 ? 6 : (30 / diasFerias) * 3;
    const parcelas = Math.max(1, installmentOverrides['163'] ?? 1);

    // Proporcional de férias = soma proporcional / divisorFerias (ex: 386,65 / 6 = 64,44)
    const valorTotalProporcional = roundMoney(somaProporcionalVerbasBase / divisorFerias);
    // Integral = se o gozo ocorreu em mês integral
    const valorTotalIntegral = feriasRow.qtdMeses > 1 ? roundMoney((somaIntegralVerbasBase / (qtdMesesIntegrais || 1)) / divisorFerias) : 0;
    const diferencaMensalBase = valorTotalProporcional > 0 ? valorTotalProporcional : valorTotalIntegral;

    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);

    if (totalGeral > 0) {
      items.push({
        id: '163',
        codigo: '163',
        descricao: 'FÉRIAS 1/3',
        valorTotalIntegral,
        parcelas,
        valorParcelaIntegral,
        diferencaMensalBase,
        valorTotalProporcional,
        valorParcelaProporcional,
        totalGeral,
        totalGeralParcelado
      });
    }
  }

  // 3. Process 13º Reflexo (if enabled in params)
  if (summary.params.aplicarReflexo13 && (somaIntegralVerbasBase > 0 || somaProporcionalVerbasBase > 0)) {
    const parcelas = Math.max(1, installmentOverrides['13'] ?? 1);

    const valorTotalIntegral = roundMoney(somaIntegralVerbasBase * (1 / 12));
    const valorTotalProporcional = roundMoney(somaProporcionalVerbasBase * (1 / 12));
    const diferencaMensalBase = roundMoney((valorTotalIntegral + valorTotalProporcional) / (numSelectedMonths || 1));

    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);

    if (totalGeral > 0) {
      items.push({
        id: '13',
        codigo: '13',
        descricao: '13º SALÁRIO',
        valorTotalIntegral,
        parcelas,
        valorParcelaIntegral,
        diferencaMensalBase,
        valorTotalProporcional,
        valorParcelaProporcional,
        totalGeral,
        totalGeralParcelado
      });
    }
  }

  // Calculate totals for each block
  const somaTotalIntegral = roundMoney(items.reduce((s, i) => s + i.valorTotalIntegral, 0));
  const somaParcelaIntegral = roundMoney(items.reduce((s, i) => s + i.valorParcelaIntegral, 0));
  const somaTotalProporcional = roundMoney(items.reduce((s, i) => s + i.valorTotalProporcional, 0));
  const somaParcelaProporcional = roundMoney(items.reduce((s, i) => s + i.valorParcelaProporcional, 0));
  const somaTotalGeral = roundMoney(somaTotalIntegral + somaTotalProporcional);
  const somaTotalGeralParcelado = roundMoney(somaParcelaIntegral + somaParcelaProporcional);

  return {
    diasRetroativos,
    items,
    somaTotalIntegral,
    somaParcelaIntegral,
    somaTotalProporcional,
    somaParcelaProporcional,
    somaTotalGeral,
    somaTotalGeralParcelado
  };
};
