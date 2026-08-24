import type {
  MonthlyRecord,
  ProgressionParams,
  ProgressionSummary,
  CalculatedEventRow,
  MonthlyBreakdownDetail,
  YearlyBreakdownGroup
} from '../../../core/types';
import { roundMoney } from '../../../core/utils/math';

/**
 * Returns the number of days in a given month and year (e.g. Feb in leap year = 29, Jan = 31).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Parses date string in "YYYY-MM-DD" or "DD/MM/YYYY" format.
 */
export function parseDateString(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (y && m && d) return new Date(y, m - 1, d);
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (y && m && d) return new Date(y, m - 1, d);
    }
  }
  return null;
}

export const calculateProgressionSummary = (
  records: MonthlyRecord[],
  params: ProgressionParams,
  selectedCompetencias: string[]
): ProgressionSummary => {
  // 1. Filter active records strictly within selected competencies
  const activeRecords = records.filter(r => selectedCompetencias.includes(r.competencia));
  const numSelectedMonths = activeRecords.length;

  if (numSelectedMonths === 0) {
    return {
      server: { nome: '', matricula: '', cargo: '', orgao: '', portariaNumero: params.portariaNumero },
      params,
      competenciasDisponiveis: records.map(r => r.competencia),
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
    };
  }

  const progressionFactor = 1 + (params.percentualProgressao / 100);
  const selectedCodes = params.selectedVerbaCodes;
  const unifiedGroups = params.unifiedVerbas || [];

  // 2. Compute calendar proportionality per month
  const effectiveDate = params.modoRateio === 'DATA_EFETIVA' && params.dataEfetiva
    ? parseDateString(params.dataEfetiva)
    : null;

  interface MonthProportion {
    competencia: string;
    ano: number;
    mes: number;
    mesNome: string;
    diasNoMes: number;
    diasBaseRateio: number;
    diasDevidos: number;
    fator: number;
  }

  const monthProportions: MonthProportion[] = activeRecords.map((rec, idx) => {
    const [mStr, yStr] = rec.competencia.split('/');
    const mes = parseInt(mStr, 10);
    const ano = parseInt(yStr, 10);
    const diasNoMes = getDaysInMonth(ano, mes);

    let diasDevidos = diasNoMes;
    let diasBaseRateio = diasNoMes;
    let fator = 1.0;

    if (params.modoRateio === 'DATA_EFETIVA' && effectiveDate) {
      diasBaseRateio = diasNoMes;
      const startOfMonth = new Date(ano, mes - 1, 1);
      const endOfMonth = new Date(ano, mes - 1, diasNoMes);

      if (effectiveDate > endOfMonth) {
        diasDevidos = 0;
        fator = 0;
      } else if (effectiveDate >= startOfMonth && effectiveDate <= endOfMonth) {
        const diaEfetivo = effectiveDate.getDate();
        diasDevidos = Math.max(1, diasNoMes - diaEfetivo + 1);
        fator = diasDevidos / diasNoMes;
      } else {
        diasDevidos = diasNoMes;
        fator = 1.0;
      }
    } else {
      // Manual days mode (proporcional fixo sobre base 30 dias)
      diasBaseRateio = 30;
      if (idx === 0) {
        const diasIniciais = Math.min(30, Math.max(1, params.diasRetroativos ?? 30));
        diasDevidos = diasIniciais;
        fator = diasIniciais / 30;
      } else {
        diasDevidos = 30;
        fator = 1.0;
      }
    }

    return {
      competencia: rec.competencia,
      ano,
      mes,
      mesNome: rec.mesNome,
      diasNoMes,
      diasBaseRateio,
      diasDevidos,
      fator
    };
  });

  const totalDiasRetroativos = monthProportions.reduce((sum, p) => sum + p.diasDevidos, 0);
  const qtdMesesEquivalentes = roundMoney(monthProportions.reduce((sum, p) => sum + p.fator, 0));

  // 3. Process each month strictly from actual extracted events in that month
  interface ProcessedMonthEvent {
    codigo: string;
    descricao: string;
    letra1Cheia: number;
    letra2Cheia: number;
    letra1Valor: number;
    letra2Valor: number;
    diferenca: number;
    diferencaCheia: number;
    isSalarioBase: boolean;
    isFerias: boolean;
    isUnified?: boolean;
    origemCodigos?: string[];
  }

  const monthlyBreakdown: MonthlyBreakdownDetail[] = activeRecords.map((rec, idx) => {
    const mp = monthProportions[idx];

    // Filter events of this month by selectedVerbaCodes
    const filteredEvents = rec.eventos.filter(ev =>
      !selectedCodes || selectedCodes.length === 0 || selectedCodes.includes(ev.codigo)
    );

    const monthEventList: ProcessedMonthEvent[] = [];
    const consumedCodes = new Set<string>();

    // Process unified groups in this month
    unifiedGroups.forEach(group => {
      const matching = filteredEvents.filter(ev => group.codigosOriginais.includes(ev.codigo));
      if (matching.length > 0) {
        matching.forEach(ev => consumedCodes.add(ev.codigo));
        const l1Cheia = roundMoney(matching.reduce((sum, ev) => sum + ev.valor, 0));
        const l2Cheia = roundMoney(l1Cheia * progressionFactor);
        const difCheia = roundMoney(l2Cheia - l1Cheia);

        const l1Aplicada = roundMoney(l1Cheia * mp.fator);
        const l2Aplicada = roundMoney(l2Cheia * mp.fator);
        const difAplicada = roundMoney(difCheia * mp.fator);

        monthEventList.push({
          codigo: group.id,
          descricao: group.nomeUnificado,
          letra1Cheia: l1Cheia,
          letra2Cheia: l2Cheia,
          letra1Valor: l1Aplicada,
          letra2Valor: l2Aplicada,
          diferenca: difAplicada,
          diferencaCheia: difCheia,
          isSalarioBase: false,
          isFerias: false,
          isUnified: true,
          origemCodigos: group.codigosOriginais
        });
      }
    });

    // 1. Calculate base differences (Salário Base + ATS + Titulação) in this month to feed Férias calculation
    let somaDifBaseRemunMes = 0;
    filteredEvents.forEach(ev => {
      const isBase = ev.codigo === '50' ||
        ev.descricao.toUpperCase().includes('SALÁRIO BASE') ||
        ev.descricao.toUpperCase().includes('SALARIO BASE') ||
        ev.descricao.toUpperCase() === 'BASE';

      const isATS = ev.codigo === '149' ||
        ev.descricao.toUpperCase().includes('ATS') ||
        ev.descricao.toUpperCase().includes('TEMPO DE SERVIÇO') ||
        ev.descricao.toUpperCase().includes('TEMPO DE SERVICO') ||
        ev.descricao.toUpperCase().includes('ANUÊNIO') ||
        ev.descricao.toUpperCase().includes('ANUENIO');

      const isTitulacao = ev.codigo === '702' || ev.codigo === '104' ||
        ev.descricao.toUpperCase().includes('TITULAÇÃO') ||
        ev.descricao.toUpperCase().includes('TITULACAO') ||
        ev.descricao.toUpperCase().includes('INCENTIVO');

      if (isBase || isATS || isTitulacao) {
        const l1 = ev.valor;
        const l2 = roundMoney(l1 * progressionFactor);
        somaDifBaseRemunMes = roundMoney(somaDifBaseRemunMes + roundMoney(l2 - l1));
      }
    });

    // Process regular non-unified events in this month
    filteredEvents.forEach(ev => {
      if (consumedCodes.has(ev.codigo)) return;

      const isSalarioBase = ev.codigo === '50' ||
        ev.descricao.toUpperCase().includes('SALÁRIO BASE') ||
        ev.descricao.toUpperCase().includes('SALARIO BASE') ||
        ev.descricao.toUpperCase() === 'BASE';

      const isFerias = ev.codigo === '163' ||
        ev.descricao.toUpperCase().includes('FÉRIAS') ||
        ev.descricao.toUpperCase().includes('FERIAS') ||
        ev.descricao.toUpperCase().includes('1/3');

      const isInsalubridade = ev.codigo === '80' ||
        ev.descricao.toUpperCase().includes('INSALUBRIDADE') ||
        ev.descricao.toUpperCase().includes('RISCO');

      const l1Cheia = ev.valor;
      let l2Cheia = l1Cheia;
      let difCheia = 0;

      if (isSalarioBase) {
        l2Cheia = roundMoney(l1Cheia * progressionFactor);
        difCheia = roundMoney(l2Cheia - l1Cheia);
      } else if (isInsalubridade) {
        l2Cheia = l1Cheia; // Fixo, não reajusta
        difCheia = 0;
      } else if (isFerias) {
        // Férias 1/3: 1/3 (ou 1/6 para 15 dias) sobre a diferença da remuneração base (Salário Base + ATS + Titulação)
        const diasFerias = params.diasFerias || 15;
        const divisorFerias = diasFerias === 15 ? 6 : (30 / diasFerias) * 3;

        if (somaDifBaseRemunMes > 0) {
          difCheia = roundMoney(somaDifBaseRemunMes / divisorFerias);
          l2Cheia = roundMoney(l1Cheia + difCheia);
        } else {
          l2Cheia = roundMoney(l1Cheia * progressionFactor);
          difCheia = roundMoney(l2Cheia - l1Cheia);
        }
      } else {
        l2Cheia = roundMoney(l1Cheia * progressionFactor);
        difCheia = roundMoney(l2Cheia - l1Cheia);
      }

      const l1Aplicada = roundMoney(l1Cheia * mp.fator);
      const l2Aplicada = roundMoney(l2Cheia * mp.fator);
      const difAplicada = roundMoney(difCheia * mp.fator);

      monthEventList.push({
        codigo: ev.codigo,
        descricao: ev.descricao,
        letra1Cheia: l1Cheia,
        letra2Cheia: l2Cheia,
        letra1Valor: l1Aplicada,
        letra2Valor: l2Aplicada,
        diferenca: difAplicada,
        diferencaCheia: difCheia,
        isSalarioBase,
        isFerias
      });
    });

    const subtotalLetra1 = roundMoney(monthEventList.reduce((acc, ev) => acc + ev.letra1Valor, 0));
    const subtotalLetra2 = roundMoney(monthEventList.reduce((acc, ev) => acc + ev.letra2Valor, 0));
    const subtotalDiferenca = roundMoney(monthEventList.reduce((acc, ev) => acc + ev.diferenca, 0));

    const ref13 = params.aplicarReflexo13 ? roundMoney(subtotalDiferenca * (1 / 12)) : 0;
    const refFer = params.aplicarReflexoFerias ? roundMoney(subtotalDiferenca * (1 / 3) * (1 / 12)) : 0;
    const totalMes = roundMoney(subtotalDiferenca + ref13 + refFer);

    return {
      competencia: mp.competencia,
      ano: mp.ano,
      mes: mp.mes,
      mesNome: mp.mesNome,
      diasNoMes: mp.diasNoMes,
      diasBaseRateio: mp.diasBaseRateio,
      diasDevidos: mp.diasDevidos,
      fatorProporcional: mp.fator,
      percentualAplicado: roundMoney(mp.fator * 100),
      eventos: monthEventList.map(e => ({
        codigo: e.codigo,
        descricao: e.descricao,
        letra1Valor: e.letra1Valor,
        letra2Valor: e.letra2Valor,
        diferenca: e.diferenca
      })),
      subtotalLetra1,
      subtotalLetra2,
      subtotalDiferenca,
      reflexo13: ref13,
      reflexoFerias: refFer,
      totalMes
    };
  });

  // 4. Build Analytical CalculatedEventRow by aggregating across monthly breakdown
  const eventAggregationMap = new Map<string, {
    codigo: string;
    descricao: string;
    totalDiferenca: number;
    sumL1Cheia: number;
    sumL2Cheia: number;
    count: number;
    isSalarioBase: boolean;
    isFerias: boolean;
    isUnified?: boolean;
    origemCodigos?: string[];
  }>();

  activeRecords.forEach((rec, idx) => {
    const mb = monthlyBreakdown[idx];
    const filteredEvents = rec.eventos.filter(ev =>
      !selectedCodes || selectedCodes.length === 0 || selectedCodes.includes(ev.codigo)
    );

    const consumed = new Set<string>();

    unifiedGroups.forEach(group => {
      const matching = filteredEvents.filter(ev => group.codigosOriginais.includes(ev.codigo));
      if (matching.length > 0) {
        matching.forEach(ev => consumed.add(ev.codigo));
        const evMb = mb.eventos.find(e => e.codigo === group.id);
        const difMes = evMb?.diferenca ?? 0;
        const l1Cheia = roundMoney(matching.reduce((sum, ev) => sum + ev.valor, 0));
        const l2Cheia = roundMoney(l1Cheia * progressionFactor);

        const existing = eventAggregationMap.get(group.id);
        if (existing) {
          existing.totalDiferenca = roundMoney(existing.totalDiferenca + difMes);
          existing.sumL1Cheia += l1Cheia;
          existing.sumL2Cheia += l2Cheia;
          existing.count += 1;
        } else {
          eventAggregationMap.set(group.id, {
            codigo: group.id,
            descricao: group.nomeUnificado,
            totalDiferenca: difMes,
            sumL1Cheia: l1Cheia,
            sumL2Cheia: l2Cheia,
            count: 1,
            isSalarioBase: false,
            isFerias: false,
            isUnified: true,
            origemCodigos: group.codigosOriginais
          });
        }
      }
    });

    filteredEvents.forEach(ev => {
      if (consumed.has(ev.codigo)) return;

      const isSalarioBase = ev.codigo === '50' ||
        ev.descricao.toUpperCase().includes('SALÁRIO BASE') ||
        ev.descricao.toUpperCase().includes('SALARIO BASE') ||
        ev.descricao.toUpperCase() === 'BASE';

      const isFerias = ev.codigo === '163' ||
        ev.descricao.toUpperCase().includes('FÉRIAS') ||
        ev.descricao.toUpperCase().includes('FERIAS');

      const isInsalubridade = ev.codigo === '80' ||
        ev.descricao.toUpperCase().includes('INSALUBRIDADE') ||
        ev.descricao.toUpperCase().includes('RISCO');

      const evMb = mb.eventos.find(e => e.codigo === ev.codigo);
      const difMes = evMb?.diferenca ?? 0;

      const l1Cheia = ev.valor;
      const l2Cheia = isInsalubridade
        ? l1Cheia
        : (isFerias ? roundMoney(l1Cheia + (difMes / (mb.fatorProporcional || 1))) : roundMoney(l1Cheia * progressionFactor));

      const existing = eventAggregationMap.get(ev.codigo);
      if (existing) {
        existing.totalDiferenca = roundMoney(existing.totalDiferenca + difMes);
        existing.sumL1Cheia += l1Cheia;
        existing.sumL2Cheia += l2Cheia;
        existing.count += 1;
      } else {
        eventAggregationMap.set(ev.codigo, {
          codigo: ev.codigo,
          descricao: ev.descricao,
          totalDiferenca: difMes,
          sumL1Cheia: l1Cheia,
          sumL2Cheia: l2Cheia,
          count: 1,
          isSalarioBase,
          isFerias
        });
      }
    });
  });

  const rows: CalculatedEventRow[] = [];

  eventAggregationMap.forEach(item => {
    const l1Valor = roundMoney(item.sumL1Cheia / (item.count || 1));
    const l2Valor = roundMoney(item.sumL2Cheia / (item.count || 1));
    const diferencaUnitaria = roundMoney(l2Valor - l1Valor);
    const qtdMeses = diferencaUnitaria > 0 ? roundMoney(item.totalDiferenca / diferencaUnitaria) : qtdMesesEquivalentes;

    const reflexo13 = params.aplicarReflexo13 && !item.isFerias
      ? roundMoney(item.totalDiferenca * (1 / 12))
      : 0;

    const reflexoFerias = params.aplicarReflexoFerias && !item.isFerias
      ? roundMoney(item.totalDiferenca * (1 / 3) * (1 / 12))
      : 0;

    const pctAplicado = item.isSalarioBase ? params.percentualProgressao : (item.isFerias ? 33.33 : params.percentualProgressao);

    rows.push({
      codigo: item.codigo,
      descricao: item.descricao,
      referenciaOrig: item.isUnified ? 'UNIF.' : (item.isFerias ? '1/3' : '30.00'),
      letra1Valor: l1Valor,
      percentualAplicado: pctAplicado,
      letra2Valor: l2Valor,
      diferencaUnitaria,
      qtdMeses,
      totalDiasRetroativos,
      totalDiferenca: item.totalDiferenca,
      reflexo13,
      reflexoFerias,
      isSalarioBase: item.isSalarioBase,
      isUnified: item.isUnified,
      origemCodigos: item.origemCodigos
    });
  });

  // 5. Group by Year
  const yearGroupMap = new Map<number, MonthlyBreakdownDetail[]>();
  monthlyBreakdown.forEach(m => {
    const list = yearGroupMap.get(m.ano) || [];
    list.push(m);
    yearGroupMap.set(m.ano, list);
  });

  const yearlyBreakdown: YearlyBreakdownGroup[] = Array.from(yearGroupMap.entries()).map(([ano, meses]) => {
    const totalDiasDevidos = meses.reduce((s, m) => s + m.diasDevidos, 0);
    const subtotalLetra1 = roundMoney(meses.reduce((s, m) => s + m.subtotalLetra1, 0));
    const subtotalLetra2 = roundMoney(meses.reduce((s, m) => s + m.subtotalLetra2, 0));
    const subtotalDiferenca = roundMoney(meses.reduce((s, m) => s + m.subtotalDiferenca, 0));
    const totalReflexo13 = roundMoney(meses.reduce((s, m) => s + m.reflexo13, 0));
    const totalReflexoFerias = roundMoney(meses.reduce((s, m) => s + m.reflexoFerias, 0));
    const grandTotalAno = roundMoney(meses.reduce((s, m) => s + m.totalMes, 0));

    return {
      ano,
      meses,
      totalDiasDevidos,
      subtotalLetra1,
      subtotalLetra2,
      subtotalDiferenca,
      totalReflexo13,
      totalReflexoFerias,
      grandTotalAno
    };
  });

  // 6. Totals strictly derived from the single source of truth (Monthly Breakdown)
  const totalLetra1Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra1Valor, 0));
  const totalLetra2Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra2Valor, 0));
  const totalDiferencaMensal = roundMoney(totalLetra2Mensal - totalLetra1Mensal);

  const totalDiferencaAcumulada = roundMoney(monthlyBreakdown.reduce((sum, m) => sum + m.subtotalDiferenca, 0));
  const totalReflexo13 = roundMoney(monthlyBreakdown.reduce((sum, m) => sum + m.reflexo13, 0));
  const totalReflexoFerias = roundMoney(monthlyBreakdown.reduce((sum, m) => sum + m.reflexoFerias, 0));
  const grandTotal = roundMoney(monthlyBreakdown.reduce((sum, m) => sum + m.totalMes, 0));

  return {
    server: { nome: '', matricula: '', cargo: '', orgao: '', portariaNumero: params.portariaNumero },
    params,
    competenciasDisponiveis: records.map(r => r.competencia),
    competenciasSelecionadas: selectedCompetencias,
    totalDiasRetroativos,
    qtdMesesEquivalentes,
    rows,
    monthlyBreakdown,
    yearlyBreakdown,
    totalLetra1Mensal,
    totalLetra2Mensal,
    totalDiferencaMensal,
    totalDiferencaAcumulada,
    totalReflexo13,
    totalReflexoFerias,
    grandTotal
  };
};
