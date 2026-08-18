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
  competencia: string; // Ex: "01/2024", "02/2024"
  ano: number;
  mes: number;
  eventos: ParsedEvent[];
}

export interface ParsedEvent {
  codigo: string; // Ex: "50", "149", "80", "163"
  descricao: string; // Ex: "SALARIO BASE", "ATS - ANUÊNIO/TRIÊNIO", "INSALUBRIDADE"
  tipo: 'PROVENTO' | 'DESCONTO';
  referencia: string; // Ex: "15%", "220h", "1.00"
  valor: number; // Valor original na Letra 1
}

export interface ProgressionParams {
  percentualProgressao: number; // Ex: 6.12 (%)
  percentualATS: number; // Ex: 15 (%) ou do cadastro
  percentualTitulacao: number; // Ex: 20 (%)
  percentualRiscoInsalubridade: number; // Ex: 20 ou 30 (%)
  divisorJornada: 150 | 200 | 220; // 150h, 200h ou 220h
  mesInicial: string; // Ex: "01/2024"
  mesFinal: string; // Ex: "12/2024"
  aplicarReflexo13: boolean;
  aplicarReflexoFerias: boolean;
}

export interface CalculatedEventRow {
  codigo: string;
  descricao: string;
  referenciaOrig: string;
  letra1Valor: number; // Valor médio ou base unitário na Letra 1 por mês
  percentualAplicado: number; // % sobre o salário base
  letra2Valor: number; // Valor apurado na Letra 2 por mês
  diferencaUnitaria: number; // Letra 2 - Letra 1
  qtdMeses: number; // Número de competências no período
  totalDiferenca: number; // diferencaUnitaria * qtdMeses
  reflexo13: number; // Reflexo no 13º salário
  reflexoFerias: number; // Reflexo nas Férias + 1/3
  isSalarioBase: boolean;
  manualOverride?: boolean;
}

export interface ProgressionSummary {
  server: ServerInfo;
  params: ProgressionParams;
  competenciasDisponiveis: string[];
  competenciasSelecionadas: string[];
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
  competencias: string[];
  rawText?: string;
  parseMethod: 'PDF' | 'MOCK';
}
