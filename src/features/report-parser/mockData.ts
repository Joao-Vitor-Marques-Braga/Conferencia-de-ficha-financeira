import type { ParseResult } from '../../core/types';

export const getMockCentiRioVerdeData = (): ParseResult => {
  const competencias = [
    '01/2024', '02/2024', '03/2024', '04/2024',
    '05/2024', '06/2024', '07/2024', '08/2024',
    '09/2024', '10/2024', '11/2024', '12/2024'
  ];

  const baseSalary = 3850.00;

  const records = competencias.map((comp) => {
    const [mesStr, anoStr] = comp.split('/');
    const isJuly = mesStr === '07';

    return {
      competencia: comp,
      ano: parseInt(anoStr, 10),
      mes: parseInt(mesStr, 10),
      eventos: [
        {
          codigo: '50',
          descricao: 'SALÁRIO BASE',
          tipo: 'PROVENTO' as const,
          referencia: '30.00',
          valor: baseSalary,
        },
        {
          codigo: '149',
          descricao: 'ADICIONAL TEMPO DE SERVIÇO (ATS)',
          tipo: 'PROVENTO' as const,
          referencia: '15.00%',
          valor: baseSalary * 0.15, // R$ 577,50
        },
        {
          codigo: '80',
          descricao: 'ADICIONAL DE INSALUBRIDADE',
          tipo: 'PROVENTO' as const,
          referencia: '20.00%',
          valor: baseSalary * 0.20, // R$ 770,00
        },
        {
          codigo: '104',
          descricao: 'INCENTIVO FUNCIONAL / TITULAÇÃO',
          tipo: 'PROVENTO' as const,
          referencia: '20.00%',
          valor: baseSalary * 0.20, // R$ 770,00
        },
        {
          codigo: '72',
          descricao: 'HORA EXTRA 50%',
          tipo: 'PROVENTO' as const,
          referencia: '15.00h',
          valor: (baseSalary / 200 * 1.5) * 15, // R$ 433.13
        },
        {
          codigo: '85',
          descricao: 'ADICIONAL NOTURNO 20%',
          tipo: 'PROVENTO' as const,
          referencia: '20.00h',
          valor: (baseSalary / 200 * 0.20) * 20, // R$ 77.00
        },
        ...(isJuly ? [{
          codigo: '163',
          descricao: 'TERÇO CONSTITUCIONAL DE FÉRIAS (1/3)',
          tipo: 'PROVENTO' as const,
          referencia: '1/3',
          valor: (baseSalary + (baseSalary * 0.15) + (baseSalary * 0.20) + (baseSalary * 0.20)) / 3, // R$ 1.989.17
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
      orgao: 'FUNDO MUNICIPAL DE SAÚDE - RIO VERDE / CENTI',
      admissao: '15/03/2018',
      lotacao: 'HOSPITAL MUNICIPAL DE RIO VERDE'
    },
    records,
    competencias,
    parseMethod: 'MOCK',
    rawText: 'Ficha Financeira Demonstrativa - Centi / Município de Rio Verde'
  };
};
