export interface ServerInfo {
  nome: string;
  matricula: string;
  cargo: string;
  cpf?: string;
  orgao: string; // Ex: FMS - Fundacao Municipal de Saude / Prefeitura de Rio Verde
  admissao?: string;
  lotacao?: string;
}

export interface MonthlyRecord {
  competencia: string; // Ex: "01/2026", "02/2026"
  ano: number;
  mes: number;
  mesNome: string; // Ex: "Janeiro", "Fevereiro"
  eventos: ParsedEvent[];
}

export interface ParsedEvent {
  codigo: string; // Ex: "50", "149", "80", "163"
  descricao: string; // Ex: "SALARIO BASE", "ATS - ANUÊNIO/TRIÊNIO", "INSALUBRIDADE"
  tipo: 'PROVENTO' | 'DESCONTO';
  referencia: string; // Ex: "30.00", "15%", "200h"
  valor: number; // Valor original na Letra 1
}

export interface ProgressionParams {
  percentualProgressao: number; // Ex: 6.12 (%)
  percentualATS: number; // Ex: 15 (%) ou do cadastro
  percentualTitulacao: number; // Ex: 20 (%)
  percentualRiscoInsalubridade: number; // Ex: 20 ou 30 (%)
  divisorJornada: 150 | 200 | 220; // 150h, 200h ou 220h
  mesInicial: string; // Ex: "01/2026"
  mesFinal: string; // Ex: "08/2026"
  diasRetroativos: number; // Dias retroativos no mês inicial (1 a 30, padrão: 30)
  diasFerias?: number; // Dias de férias gozados (ex: 15 ou 30, padrão: 15)
  aplicarReflexo13: boolean;
  aplicarReflexoFerias: boolean;
}

export interface CalculatedEventRow {
  codigo: string;
  descricao: string;
  referenciaOrig: string;
  letra1Valor: number; // Valor mensal na Letra 1
  percentualAplicado: number; // % sobre o salário base
  letra2Valor: number; // Valor apurado na Letra 2
  diferencaUnitaria: number; // Letra 2 - Letra 1 (por mês cheio)
  qtdMeses: number; // Quantidade de meses equivalentes considerados (ex: 8 ou 7.5)
  totalDiasRetroativos: number; // Total de dias retroativos apurados
  totalDiferenca: number; // diferencaUnitaria * qtdMeses
  reflexo13: number; // Reflexo no 13º salário
  reflexoFerias: number; // Reflexo nas Férias + 1/3
  isSalarioBase: boolean;
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
