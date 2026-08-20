import type { MonthlyRecord, ProgressionParams, ProgressionSummary, CalculatedEventRow } from '../../../core/types';
import { roundMoney } from '../../../core/utils/math';

export const calculateProgressionSummary = (
  records: MonthlyRecord[],
  params: ProgressionParams,
  selectedCompetencias: string[]
): ProgressionSummary => {
  // Filter records strictly within the selected competencias
  const activeRecords = records.filter(r => selectedCompetencias.includes(r.competencia));
  const numSelectedMonths = activeRecords.length;

  // Compute retroactive proportionality (dias retroativos no mês inicial)
  const diasMesInicial = Math.min(30, Math.max(1, params.diasRetroativos ?? 30));
  
  let qtdMesesEquivalentes = 0;
  let totalDiasRetroativos = 0;

  if (numSelectedMonths === 1) {
    qtdMesesEquivalentes = roundMoney(diasMesInicial / 30);
    totalDiasRetroativos = diasMesInicial;
  } else if (numSelectedMonths > 1) {
    qtdMesesEquivalentes = roundMoney((numSelectedMonths - 1) + (diasMesInicial / 30));
    totalDiasRetroativos = (numSelectedMonths - 1) * 30 + diasMesInicial;
  }

  if (numSelectedMonths === 0) {
    return {
      server: { nome: '', matricula: '', cargo: '', orgao: '' },
      params,
      competenciasDisponiveis: records.map(r => r.competencia),
      competenciasSelecionadas: [],
      totalDiasRetroativos: 0,
      qtdMesesEquivalentes: 0,
      rows: [],
      totalLetra1Mensal: 0,
      totalLetra2Mensal: 0,
      totalDiferencaMensal: 0,
      totalDiferencaAcumulada: 0,
      totalReflexo13: 0,
      totalReflexoFerias: 0,
      grandTotal: 0,
    };
  }

  // 1. Identify Base Salary in Letra 1 (Verba 50 or largest salary item)
  let baseSalaryLetra1 = 0;
  activeRecords.forEach(rec => {
    const baseEvent = rec.eventos.find(e => e.codigo === '50' || e.descricao.toUpperCase().includes('SALÁRIO BASE') || e.descricao.toUpperCase().includes('SALARIO BASE') || e.descricao.toUpperCase() === 'BASE');
    if (baseEvent) {
      baseSalaryLetra1 = Math.max(baseSalaryLetra1, baseEvent.valor);
    }
  });

  if (baseSalaryLetra1 === 0 && activeRecords[0]?.eventos.length > 0) {
    baseSalaryLetra1 = activeRecords[0].eventos[0].valor;
  }

  // 2. Compute Base Salary in Letra 2
  const progressionFactor = 1 + (params.percentualProgressao / 100);
  const baseSalaryLetra2 = roundMoney(baseSalaryLetra1 * progressionFactor);

  // Group events across selected competencies to compute averages or standard reference values
  const eventGroupMap = new Map<string, {
    codigo: string;
    descricao: string;
    referencia: string;
    totalValorLetra1: number;
    count: number;
  }>();

  activeRecords.forEach(rec => {
    rec.eventos.forEach(ev => {
      const key = `${ev.codigo}-${ev.descricao.toUpperCase()}`;
      const existing = eventGroupMap.get(key);
      if (existing) {
        existing.totalValorLetra1 += ev.valor;
        existing.count += 1;
      } else {
        eventGroupMap.set(key, {
          codigo: ev.codigo,
          descricao: ev.descricao,
          referencia: ev.referencia,
          totalValorLetra1: ev.valor,
          count: 1,
        });
      }
    });
  });

  // Separate non-ferias and ferias events so remunerative base can be computed first
  const intermediateRows: Array<{
    codigo: string;
    descricao: string;
    referencia: string;
    l1Valor: number;
    pctAplicado: number;
    l2Valor: number;
    isSalarioBase: boolean;
    isFerias: boolean;
  }> = [];

  // Pass 1: Compute non-ferias items
  eventGroupMap.forEach((item) => {
    const isSalarioBase = item.codigo === '50' || item.descricao.toUpperCase().includes('SALÁRIO BASE') || item.descricao.toUpperCase().includes('SALARIO BASE') || item.descricao.toUpperCase() === 'BASE';
    const isFerias = item.codigo === '163' || item.descricao.toUpperCase().includes('FÉRIAS') || item.descricao.toUpperCase().includes('FERIAS');
    const l1Valor = roundMoney(item.totalValorLetra1 / item.count);
    
    let l2Valor = 0;
    let pctAplicado = 0;

    if (isSalarioBase) {
      l2Valor = baseSalaryLetra2;
      pctAplicado = params.percentualProgressao;
    } else if (item.codigo === '80' || item.descricao.toUpperCase().includes('INSALUBRIDADE') || item.descricao.toUpperCase().includes('RISCO')) {
      // Insalubridade / Risco: Valor fixo referente ao salário mínimo/estatutário, NÃO altera por letra
      l2Valor = l1Valor;
      pctAplicado = 0;
    } else if (!isFerias) {
      // Demais verbas remuneratórias reajustam proporcionalmente ao aumento da base (Letra 1 -> Letra 2)
      l2Valor = roundMoney(l1Valor * progressionFactor);
      
      const refNum = parseFloat(item.referencia.replace(',', '.').replace(/[^\d\.]/g, ''));
      pctAplicado = refNum > 0 ? refNum : params.percentualProgressao;
    }

    intermediateRows.push({
      codigo: item.codigo,
      descricao: item.descricao,
      referencia: item.referencia,
      l1Valor,
      pctAplicado,
      l2Valor,
      isSalarioBase,
      isFerias
    });
  });

  // Helper: Soma das verbas remuneratórias que compõem a base de férias
  const codigosVerbasRemuneratorias = ['50', '149', '104', '80', '72', '85', 'dsr', 'tit_saude', 'produtividade', 'periculosidade', 'periculo_he', 'fg_fc'];

  const getBaseRemuneratoriaFerias = (letra: 'L1' | 'L2'): number => {
    return intermediateRows
      .filter(it => !it.isFerias && (codigosVerbasRemuneratorias.includes(it.codigo) || it.isSalarioBase))
      .reduce((acc, it) => acc + (letra === 'L1' ? it.l1Valor : it.l2Valor), 0);
  };

  const rows: CalculatedEventRow[] = [];

  // Pass 2: Finalize rows including Férias 1/3
  intermediateRows.forEach((item) => {
    let l1Valor = item.l1Valor;
    let l2Valor = item.l2Valor;
    let pctAplicado = item.pctAplicado;

    if (item.isFerias) {
      // Quantidade de dias de férias gozados (extraído da referência da ficha, ex: 15 dias ou 30 dias)
      const refNum = parseFloat(item.referencia.replace(',', '.').replace(/[^\d\.]/g, ''));
      const diasFerias = (refNum > 0 && refNum <= 30) ? refNum : (params.diasFerias || 15);

      // Soma das verbas que compõem a remuneração para Letra 1 e Letra 2
      const somaVerbasL1 = getBaseRemuneratoriaFerias('L1');
      const somaVerbasL2 = getBaseRemuneratoriaFerias('L2');

      // Base de cálculo proporcional aos dias gozados + 1/3 Constitucional:
      // (Remuneração * (diasFerias / 30)) / 3
      l1Valor = roundMoney(((somaVerbasL1 * (diasFerias / 30)) / 3));
      l2Valor = roundMoney(((somaVerbasL2 * (diasFerias / 30)) / 3));
      pctAplicado = 33.33; // 1/3 Constitucional
    }

    const diferencaUnitaria = roundMoney(l2Valor - l1Valor);
    
    // Férias 1/3 é evento pontual de 1 único gozo (ocorrência = 1), não se multiplica por todos os meses recorrentes
    const qtdMesesEvento = item.isFerias ? 1 : qtdMesesEquivalentes;
    const totalDiferenca = roundMoney(diferencaUnitaria * qtdMesesEvento);

    // Reflexo 13º e Férias por evento
    const reflexo13 = params.aplicarReflexo13 && !item.isFerias ? roundMoney(totalDiferenca * (1 / 12)) : 0;
    const reflexoFerias = params.aplicarReflexoFerias && !item.isFerias ? roundMoney(totalDiferenca * (1 / 3) * (1 / 12)) : 0;

    rows.push({
      codigo: item.codigo,
      descricao: item.descricao,
      referenciaOrig: item.referencia,
      letra1Valor: l1Valor,
      percentualAplicado: pctAplicado,
      letra2Valor: l2Valor,
      diferencaUnitaria,
      qtdMeses: qtdMesesEvento,
      totalDiasRetroativos,
      totalDiferenca,
      reflexo13,
      reflexoFerias,
      isSalarioBase: item.isSalarioBase
    });
  });

  // Calculate totals
  const totalLetra1Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra1Valor, 0));
  const totalLetra2Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra2Valor, 0));
  const totalDiferencaMensal = roundMoney(totalLetra2Mensal - totalLetra1Mensal);
  const totalDiferencaAcumulada = roundMoney(rows.reduce((sum, r) => sum + r.totalDiferenca, 0));

  const totalReflexo13 = roundMoney(rows.reduce((sum, r) => sum + r.reflexo13, 0));
  const totalReflexoFerias = roundMoney(rows.reduce((sum, r) => sum + r.reflexoFerias, 0));
  const grandTotal = roundMoney(totalDiferencaAcumulada + totalReflexo13 + totalReflexoFerias);

  return {
    server: { nome: '', matricula: '', cargo: '', orgao: '' },
    params,
    competenciasDisponiveis: records.map(r => r.competencia),
    competenciasSelecionadas: selectedCompetencias,
    totalDiasRetroativos,
    qtdMesesEquivalentes,
    rows,
    totalLetra1Mensal,
    totalLetra2Mensal,
    totalDiferencaMensal,
    totalDiferencaAcumulada,
    totalReflexo13,
    totalReflexoFerias,
    grandTotal
  };
};
