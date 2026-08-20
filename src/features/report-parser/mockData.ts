import type { ParseResult, MonthlyRecord } from '../../core/types';

export const getMockCentiRioVerdeData = (): ParseResult => {
  // Apenas os meses presentes e preenchidos na tabela (Janeiro a Agosto de 2026)
  const mesesComDados = [
    { mes: 1, mesNome: 'Janeiro', comp: '01/2026', salarioBase: 5269.27, ats: 790.39, insalubridade: 324.20, ferias13: 1063.97, adiant13: 0 },
    { mes: 2, mesNome: 'Fevereiro', comp: '02/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 2658.63 },
    { mes: 3, mesNome: 'Março', comp: '03/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 0 },
    { mes: 4, mesNome: 'Abril', comp: '04/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 0 },
    { mes: 5, mesNome: 'Maio', comp: '05/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 0 },
    { mes: 6, mesNome: 'Junho', comp: '06/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 1107.76, adiant13: 0 },
    { mes: 7, mesNome: 'Julho', comp: '07/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 0 },
    { mes: 8, mesNome: 'Agosto', comp: '08/2026', salarioBase: 5493.74, ats: 824.06, insalubridade: 328.78, ferias13: 0, adiant13: 0 },
  ];

  const competencias = mesesComDados.map(m => m.comp);

  const records: MonthlyRecord[] = mesesComDados.map((m) => {
    return {
      competencia: m.comp,
      ano: 2026,
      mes: m.mes,
      mesNome: m.mesNome,
      eventos: [
        {
          codigo: '50',
          descricao: 'SALÁRIO BASE',
          tipo: 'PROVENTO' as const,
          referencia: '30.00',
          valor: m.salarioBase,
        },
        {
          codigo: '149',
          descricao: 'ADICIONAL POR TEMPO DE SERVIÇO (ATS)',
          tipo: 'PROVENTO' as const,
          referencia: '15.00%',
          valor: m.ats,
        },
        {
          codigo: '80',
          descricao: 'INSALUBRIDADE',
          tipo: 'PROVENTO' as const,
          referencia: '20.00',
          valor: m.insalubridade,
        },
        ...(m.ferias13 > 0 ? [{
          codigo: '163',
          descricao: '1/3 DE FÉRIAS ADIANTADO',
          tipo: 'PROVENTO' as const,
          referencia: '15.00',
          valor: m.ferias13,
        }] : []),
        ...(m.adiant13 > 0 ? [{
          codigo: '793',
          descricao: 'ADIANTAMENTO DE 13º SALÁRIO',
          tipo: 'PROVENTO' as const,
          referencia: '40.00',
          valor: m.adiant13,
        }] : [])
      ]
    };
  });

  return {
    server: {
      nome: 'MARIA EDUARDA SILVA E SOUZA',
      matricula: '104859-1',
      cargo: 'ENFERMEIRO - CLASSE B',
      cpf: '789.456.123-00',
      orgao: 'FUNDO MUNICIPAL DE SAÚDE - PREFEITURA DE RIO VERDE',
      admissao: '01/03/2018',
      lotacao: 'FUNDO MUNICIPAL DE SAUDE'
    },
    records,
    competencias,
    parseMethod: 'MOCK',
    rawText: 'Ficha Financeira Demonstrativa - Centi / Município de Rio Verde'
  };
};
