export interface ServerInfo {
  nome: string;
  matricula: string;
  cargo: string;
  cpf?: string;
  orgao: string; // Ex: FMS - Fundacao Municipal de Saude / Prefeitura de Rio Verde
  admissao?: string;
  lotacao?: string;
  portariaNumero?: string; // Ex: "Portaria nº 1.482/2026"
}

export interface MonthlyRecord {
  competencia: string; // Ex: "01/2026", "02/2026"
  ano: number;
  mes: number;
  mesNome: string; // Ex: "Janeiro", "Fevereiro"
  situacaoFuncional?: string; // Ex: "Férias", "Afastamento"
  eventos: ParsedEvent[];
}

export interface ParsedEvent {
  codigo: string; // Ex: "50", "149", "80", "163"
  descricao: string; // Ex: "SALARIO BASE", "ATS - ANUÊNIO/TRIÊNIO", "INSALUBRIDADE"
  tipo: 'PROVENTO' | 'DESCONTO';
  referencia: string; // Ex: "30.00", "15%", "200h"
  valor: number; // Valor original na Letra 1
}

export interface UnifiedVerbaGroup {
  id: string;
  nomeUnificado: string;
  codigosOriginais: string[];
}

export interface ProgressionParams {
  percentualProgressao: number; // Ex: 6.12 (%)
  percentualATS: number; // Ex: 15 (%) ou do cadastro
  percentualTitulacao: number; // Ex: 20 (%)
  percentualRiscoInsalubridade: number; // Ex: 20 ou 30 (%)
  divisorJornada: 150 | 200 | 220; // 150h, 200h ou 220h
  mesInicial: string; // Ex: "01/2026"
  mesFinal: string; // Ex: "08/2026"
  modoRateio: 'DATA_EFETIVA' | 'DIAS_MANUAIS';
  dataEfetiva?: string; // Ex: "2026-01-14" ou "14/01/2026"
  diasRetroativos: number; // Dias retroativos no mês inicial (1 a 30, padrão: 30)
  diasFerias?: number; // Dias de férias gozados (ex: 15 ou 30, padrão: 15)
  aplicarReflexo13: boolean;
  aplicarReflexoFerias: boolean;
  portariaNumero?: string;
  selectedVerbaCodes?: string[];
  unifiedVerbas?: UnifiedVerbaGroup[];
  percentuaisPorMes?: Record<string, number>; // Ex: { "05/2025": 5.0, "06/2026": 6.12 }
}

export interface MonthlyBreakdownDetail {
  competencia: string;
  ano: number;
  mes: number;
  mesNome: string;
  situacaoFuncional?: string; // Ex: "Férias", "Afastamento"
  diasNoMes: number;
  diasBaseRateio?: number;
  diasDevidos: number;
  fatorProporcional: number; // Ex: 0.5484 (17/31) ou 1.0 (30/30)
  percentualAplicado: number; // Ex: 54.84% ou 100%
  percentualReajuste?: number; // Percentual de progressão aplicado a este mês (ex: 5% ou 6.12%)
  eventos: Array<{
    codigo: string;
    descricao: string;
    letra1Valor: number;
    letra2Valor: number;
    diferenca: number;
  }>;
  subtotalLetra1: number;
  subtotalLetra2: number;
  subtotalDiferenca: number;
  reflexo13: number;
  reflexoFerias: number;
  totalMes: number;
}

export interface YearlyBreakdownGroup {
  ano: number;
  meses: MonthlyBreakdownDetail[];
  totalDiasDevidos: number;
  subtotalLetra1: number;
  subtotalLetra2: number;
  subtotalDiferenca: number;
  totalReflexo13: number;
  totalReflexoFerias: number;
  grandTotalAno: number;
}

export interface CalculatedEventRow {
  codigo: string;
  descricao: string;
  referenciaOrig: string;
  letra1Valor: number; // Valor mensal na Letra 1
  percentualAplicado: number; // % sobre o salário base
  letra2Valor: number; // Valor apurado na Letra 2
  diferencaUnitaria: number; // Letra 2 - Letra 1 (por mês cheio)
  qtdMeses: number; // Quantidade de meses equivalentes considerados (ex: 8 ou 7.54)
  totalDiasRetroativos: number; // Total de dias retroativos apurados
  totalDiferenca: number; // diferencaUnitaria * qtdMeses
  reflexo13: number; // Reflexo no 13º salário
  reflexoFerias: number; // Reflexo nas Férias + 1/3
  isSalarioBase: boolean;
  isUnified?: boolean;
  origemCodigos?: string[];
  manualOverride?: boolean;
}

export interface ProgressionSummary {
  server: ServerInfo;
  params: ProgressionParams;
  competenciasDisponiveis: string[]; // Apenas meses extraídos da tabela com dados
  competenciasSelecionadas: string[];
  totalDiasRetroativos: number;
  qtdMesesEquivalentes: number;
  rows: CalculatedEventRow[];
  monthlyBreakdown: MonthlyBreakdownDetail[];
  yearlyBreakdown: YearlyBreakdownGroup[];
  totalLetra1Mensal: number;
  totalLetra2Mensal: number;
  totalDiferencaMensal: number;
  totalDiferencaAcumulada: number;
  totalReflexo13: number;
  totalReflexoFerias: number;
  grandTotal: number; // totalDiferencaAcumulada + totalReflexo13 + totalReflexoFerias
}

export interface ParseResult {
  server: ServerInfo;
  records: MonthlyRecord[];
  competencias: string[]; // Apenas meses com valores presentes na tabela
  rawText?: string;
  parseMethod: 'PDF' | 'MOCK';
}

export interface SavedCalculation {
  id: string;
  timestamp: string;
  nomeServidor: string;
  matricula: string;
  cargo: string;
  orgao: string;
  portariaNumero: string;
  periodo: string;
  grandTotal: number;
  totalDiferenca: number;
  conferido: boolean;
  parseResult: ParseResult;
  params: ProgressionParams;
  summary: ProgressionSummary;
  notas?: string;
}

export interface IncentivePeriod {
  id: string;
  mesInicial: string; // "01/2024"
  mesFinal: string;   // "12/2024"
  percentual: number; // 10.0 (%)
}

export interface IncentiveMonthlyRow {
  competencia: string;
  ano: number;
  mes: number;
  mesNome: string;
  salarioBase: number;
  percentualDevido: number;
  valorIncentivoDevido: number;
  valorIncentivoPago: number;
  diferenca: number;
  reflexo13: number;
  reflexoFerias: number;
  totalMes: number;
}

export interface IncentiveSummary {
  serverNome?: string;
  serverMatricula?: string;
  periods: IncentivePeriod[];
  monthlyRows: IncentiveMonthlyRow[];
  totalBaseAcumulada: number;
  totalIncentivoDevido: number;
  totalIncentivoPago: number;
  totalDiferenca: number;
  totalReflexo13: number;
  totalReflexoFerias: number;
  grandTotal: number;
}

