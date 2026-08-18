import type { MonthlyRecord, ProgressionParams, ProgressionSummary, CalculatedEventRow } from '../../../core/types';
import { roundMoney } from '../../../core/utils/math';

export const calculateProgressionSummary = (
  records: MonthlyRecord[],
  params: ProgressionParams,
  selectedCompetencias: string[]
): ProgressionSummary => {
  // Filter records within the selected competencias
  const activeRecords = records.filter(r => selectedCompetencias.includes(r.competencia));
  const qtdMeses = activeRecords.length;

  if (qtdMeses === 0) {
    return {
      server: { nome: '', matricula: '', cargo: '', orgao: '' },
      params,
      competenciasDisponiveis: records.map(r => r.competencia),
      competenciasSelecionadas: [],
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
    const baseEvent = rec.eventos.find(e => e.codigo === '50' || e.descricao.toUpperCase().includes('SALÁRIO BASE') || e.descricao.toUpperCase().includes('SALARIO BASE'));
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

  const rows: CalculatedEventRow[] = [];

  eventGroupMap.forEach((item) => {
    const isSalarioBase = item.codigo === '50' || item.descricao.toUpperCase().includes('SALÁRIO BASE') || item.descricao.toUpperCase().includes('SALARIO BASE');
    const l1Valor = roundMoney(item.totalValorLetra1 / item.count);
    
    let l2Valor = 0;
    let pctAplicado = 0;

    if (isSalarioBase) {
      l2Valor = baseSalaryLetra2;
      pctAplicado = params.percentualProgressao;
    } else if (item.codigo === '149' || item.descricao.toUpperCase().includes('ATS') || item.descricao.toUpperCase().includes('TEMPO DE SERVIÇO')) {
      // ATS (Adicional de Tempo de Serviço)
      pctAplicado = params.percentualATS;
      l2Valor = roundMoney(baseSalaryLetra2 * (params.percentualATS / 100));
    } else if (item.codigo === '104' || item.descricao.toUpperCase().includes('INCENTIVO') || item.descricao.toUpperCase().includes('TITULAÇÃO')) {
      // Titulação / Incentivo Funcional
      pctAplicado = params.percentualTitulacao;
      l2Valor = roundMoney(baseSalaryLetra2 * (params.percentualTitulacao / 100));
    } else if (item.codigo === '80' || item.descricao.toUpperCase().includes('INSALUBRIDADE') || item.descricao.toUpperCase().includes('RISCO')) {
      // Insalubridade / Risco
      pctAplicado = params.percentualRiscoInsalubridade;
      l2Valor = roundMoney(baseSalaryLetra2 * (params.percentualRiscoInsalubridade / 100));
    } else if (item.codigo === '72' || item.descricao.toUpperCase().includes('HORA EXTRA') || item.descricao.toUpperCase().includes('HE')) {
      // Hora Extra: ((Base / Divisor) * 1.5) * Qtd Horas
      const horasNum = parseFloat(item.referencia.replace(/[^\d\.]/g, '')) || 15;
      l2Valor = roundMoney(((baseSalaryLetra2 / params.divisorJornada) * 1.5) * horasNum);
      pctAplicado = 50;
    } else if (item.codigo === '85' || item.descricao.toUpperCase().includes('NOTURNO')) {
      // Adicional Noturno: ((Base / Divisor) * 0.20) * Qtd Horas
      const horasNum = parseFloat(item.referencia.replace(/[^\d\.]/g, '')) || 20;
      l2Valor = roundMoney(((baseSalaryLetra2 / params.divisorJornada) * 0.20) * horasNum);
      pctAplicado = 20;
    } else if (item.codigo === '163' || item.descricao.toUpperCase().includes('FÉRIAS') || item.descricao.toUpperCase().includes('FERIAS')) {
      // Férias 1/3 (calculado se ativado no final ou por evento)
      l2Valor = roundMoney(l1Valor * progressionFactor);
      pctAplicado = params.percentualProgressao;
    } else {
      // Proporcional padrão pela progressão
      l2Valor = roundMoney(l1Valor * progressionFactor);
      pctAplicado = params.percentualProgressao;
    }

    const diferencaUnitaria = roundMoney(l2Valor - l1Valor);
    const totalDiferenca = roundMoney(diferencaUnitaria * qtdMeses);

    // Reflexo 13º e Férias por evento
    const reflexo13 = params.aplicarReflexo13 ? roundMoney(totalDiferenca * (1 / 12)) : 0;
    const reflexoFerias = params.aplicarReflexoFerias ? roundMoney(totalDiferenca * (1 / 3) * (1 / 12)) : 0;

    rows.push({
      codigo: item.codigo,
      descricao: item.descricao,
      referenciaOrig: item.referencia,
      letra1Valor: l1Valor,
      percentualAplicado: pctAplicado,
      letra2Valor: l2Valor,
      diferencaUnitaria,
      qtdMeses,
      totalDiferenca,
      reflexo13,
      reflexoFerias,
      isSalarioBase
    });
  });

  // Calculate totals
  const totalLetra1Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra1Valor, 0));
  const totalLetra2Mensal = roundMoney(rows.reduce((sum, r) => sum + r.letra2Valor, 0));
  const totalDiferencaMensal = roundMoney(totalLetra2Mensal - totalLetra1Mensal);
  const totalDiferencaAcumulada = roundMoney(totalDiferencaMensal * qtdMeses);

  const totalReflexo13 = roundMoney(rows.reduce((sum, r) => sum + r.reflexo13, 0));
  const totalReflexoFerias = roundMoney(rows.reduce((sum, r) => sum + r.reflexoFerias, 0));
  const grandTotal = roundMoney(totalDiferencaAcumulada + totalReflexo13 + totalReflexoFerias);

  return {
    server: { nome: '', matricula: '', cargo: '', orgao: '' },
    params,
    competenciasDisponiveis: records.map(r => r.competencia),
    competenciasSelecionadas: selectedCompetencias,
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
