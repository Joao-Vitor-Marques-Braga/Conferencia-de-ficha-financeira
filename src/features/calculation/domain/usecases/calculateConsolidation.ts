import type { ProgressionSummary } from '../../../../core/types';
import type { ConsolidationItem, ConsolidationSummaryData, InstallmentOverrideMap } from '../types';
import { roundMoney } from '../../../../core/utils/math';

export const calculateConsolidation = (
  summary: ProgressionSummary,
  diasRetroativos: number = 30,
  installmentOverrides: InstallmentOverrideMap = {}
): ConsolidationSummaryData => {
  const monthlyDetails = summary.monthlyBreakdown || [];
  const hasMonthlyBreakdown = monthlyDetails.length > 0;

  const mes1 = hasMonthlyBreakdown ? monthlyDetails[0] : null;
  const mesesIntegrais = hasMonthlyBreakdown ? monthlyDetails.slice(1) : [];

  const diasDevidosMes1 = mes1 ? mes1.diasDevidos : diasRetroativos;
  const customFactorMes1 = mes1
    ? (diasRetroativos === mes1.diasDevidos
        ? mes1.fatorProporcional
        : (diasRetroativos / (mes1.diasBaseRateio || 30)))
    : (diasRetroativos / 30);

  const ratioMes1 = mes1 && mes1.fatorProporcional > 0
    ? customFactorMes1 / mes1.fatorProporcional
    : 1.0;

  const items: ConsolidationItem[] = [];

  // 1. Process EVERY event row directly from analytical summary.rows (including 163 Férias 1/3, Salário Base, ATS, etc.)
  summary.rows.forEach((row) => {
    const parcelas = Math.max(1, installmentOverrides[row.codigo] ?? 1);

    // Value in Month 1 (Proporcional)
    let valorTotalProporcional = 0;
    if (mes1) {
      const ev1 = mes1.eventos.find(e => e.codigo === row.codigo);
      if (ev1) {
        valorTotalProporcional = roundMoney(ev1.diferenca * ratioMes1);
      }
    } else {
      valorTotalProporcional = roundMoney(row.diferencaUnitaria * (diasRetroativos / 30));
    }

    // Value in subsequent months (Integral)
    let valorTotalIntegral = 0;
    if (mesesIntegrais.length > 0) {
      valorTotalIntegral = roundMoney(
        mesesIntegrais.reduce((sum, m) => {
          const ev = m.eventos.find(e => e.codigo === row.codigo);
          return sum + (ev ? ev.diferenca : 0);
        }, 0)
      );
    }

    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);
    const diferencaMensalBase = row.diferencaUnitaria;

    if (totalGeral > 0 || valorTotalIntegral > 0 || valorTotalProporcional > 0) {
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

  // 2. Constitutional 13º Salary Reflexo (if enabled and > 0)
  if (summary.params.aplicarReflexo13 && summary.totalReflexo13 > 0) {
    const parcelas = Math.max(1, installmentOverrides['REF_13'] ?? installmentOverrides['13'] ?? 1);

    const valorTotalProporcional = mes1 ? roundMoney(mes1.reflexo13 * ratioMes1) : 0;
    const valorTotalIntegral = roundMoney(
      mesesIntegrais.reduce((sum, m) => sum + m.reflexo13, 0)
    );
    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);
    const diferencaMensalBase = roundMoney(totalGeral / (monthlyDetails.length || 1));

    if (totalGeral > 0) {
      items.push({
        id: 'REF_13',
        codigo: '13',
        descricao: '13º SALÁRIO (REFLEXO CONSTITUCIONAL)',
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

  // 3. Constitutional Férias 1/3 Reflexo (if enabled and > 0)
  if (summary.params.aplicarReflexoFerias && summary.totalReflexoFerias > 0) {
    const parcelas = Math.max(1, installmentOverrides['REF_FERIAS'] ?? installmentOverrides['163_REF'] ?? 1);

    const valorTotalProporcional = mes1 ? roundMoney(mes1.reflexoFerias * ratioMes1) : 0;
    const valorTotalIntegral = roundMoney(
      mesesIntegrais.reduce((sum, m) => sum + m.reflexoFerias, 0)
    );
    const totalGeral = roundMoney(valorTotalIntegral + valorTotalProporcional);
    const valorParcelaIntegral = roundMoney(valorTotalIntegral / parcelas);
    const valorParcelaProporcional = roundMoney(valorTotalProporcional / parcelas);
    const totalGeralParcelado = roundMoney(valorParcelaIntegral + valorParcelaProporcional);
    const diferencaMensalBase = roundMoney(totalGeral / (monthlyDetails.length || 1));

    if (totalGeral > 0) {
      items.push({
        id: 'REF_FERIAS',
        codigo: '163',
        descricao: 'FÉRIAS 1/3 (REFLEXO CONSTITUCIONAL)',
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
    diasRetroativos: diasDevidosMes1,
    items,
    somaTotalIntegral,
    somaParcelaIntegral,
    somaTotalProporcional,
    somaParcelaProporcional,
    somaTotalGeral,
    somaTotalGeralParcelado
  };
};

