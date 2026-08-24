import type { IncentivePeriod, IncentiveMonthlyRow, IncentiveSummary } from '../../../core/types';
import { roundMoney } from '../../../core/utils/math';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Parses "MM/YYYY" to month (1-12) and year (e.g. 2026).
 */
function parseComp(comp: string): { mes: number; ano: number } {
  const [m, y] = comp.split('/').map(Number);
  return { mes: m || 1, ano: y || 2026 };
}

/**
 * Generates an array of "MM/YYYY" competencies between start and end inclusive.
 */
export function generateCompetenciaRange(startComp: string, endComp: string): string[] {
  const start = parseComp(startComp);
  const end = parseComp(endComp);

  const list: string[] = [];
  let currentYear = start.ano;
  let currentMonth = start.mes;

  while (
    currentYear < end.ano ||
    (currentYear === end.ano && currentMonth <= end.mes)
  ) {
    const compStr = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
    list.push(compStr);

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return list;
}

/**
 * Calculates Functional Incentive differences across all competencies.
 */
export const calculateIncentiveSummary = (
  serverNome: string,
  serverMatricula: string,
  startComp: string,
  endComp: string,
  defaultBaseSalary: number,
  monthlyBaseOverrides: Record<string, number>,
  periods: IncentivePeriod[],
  aplicarReflexos: boolean = true
): IncentiveSummary => {
  const competencias = generateCompetenciaRange(startComp, endComp);

  const monthlyRows: IncentiveMonthlyRow[] = competencias.map((comp) => {
    const { mes, ano } = parseComp(comp);
    const mesNome = MONTH_NAMES[mes - 1] || `Mês ${mes}`;

    const salarioBase = monthlyBaseOverrides[comp] !== undefined
      ? monthlyBaseOverrides[comp]
      : defaultBaseSalary;

    // Find which period rule applies to this month
    const matchingPeriod = periods.find(p => {
      const pStart = parseComp(p.mesInicial);
      const pEnd = parseComp(p.mesFinal);

      const isAfterStart = ano > pStart.ano || (ano === pStart.ano && mes >= pStart.mes);
      const isBeforeEnd = ano < pEnd.ano || (ano === pEnd.ano && mes <= pEnd.mes);

      return isAfterStart && isBeforeEnd;
    });

    const percentualDevido = matchingPeriod ? matchingPeriod.percentual : (periods[0]?.percentual || 20);
    const valorIncentivoDevido = roundMoney(salarioBase * (percentualDevido / 100));
    const valorIncentivoPago = 0; // standard default (unpaid retroactive difference)
    const diferenca = roundMoney(valorIncentivoDevido - valorIncentivoPago);

    const reflexo13 = aplicarReflexos ? roundMoney(diferenca * (1 / 12)) : 0;
    const reflexoFerias = aplicarReflexos ? roundMoney(diferenca * (1 / 3) * (1 / 12)) : 0;
    const totalMes = roundMoney(diferenca + reflexo13 + reflexoFerias);

    return {
      competencia: comp,
      ano,
      mes,
      mesNome,
      salarioBase,
      percentualDevido,
      valorIncentivoDevido,
      valorIncentivoPago,
      diferenca,
      reflexo13,
      reflexoFerias,
      totalMes
    };
  });

  const totalBaseAcumulada = roundMoney(monthlyRows.reduce((sum, r) => sum + r.salarioBase, 0));
  const totalIncentivoDevido = roundMoney(monthlyRows.reduce((sum, r) => sum + r.valorIncentivoDevido, 0));
  const totalIncentivoPago = roundMoney(monthlyRows.reduce((sum, r) => sum + r.valorIncentivoPago, 0));
  const totalDiferenca = roundMoney(monthlyRows.reduce((sum, r) => sum + r.diferenca, 0));
  const totalReflexo13 = roundMoney(monthlyRows.reduce((sum, r) => sum + r.reflexo13, 0));
  const totalReflexoFerias = roundMoney(monthlyRows.reduce((sum, r) => sum + r.reflexoFerias, 0));
  const grandTotal = roundMoney(totalDiferenca + totalReflexo13 + totalReflexoFerias);

  return {
    serverNome,
    serverMatricula,
    periods,
    monthlyRows,
    totalBaseAcumulada,
    totalIncentivoDevido,
    totalIncentivoPago,
    totalDiferenca,
    totalReflexo13,
    totalReflexoFerias,
    grandTotal
  };
};
