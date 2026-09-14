export interface VerbaDefinition {
  id: string;
  defaultName: string;
  code: string;
  patterns: RegExp[];
}

export const ALLOWED_VERBAS: VerbaDefinition[] = [
  {
    id: '50',
    defaultName: 'BASE',
    code: '50',
    patterns: [/\b50\s*[-–]\s*SAL[AÁ]RIO/i, /(?:SAL[AÁ]RIO|VENCIMENTO)\s*BASE/i]
  },
  {
    id: '149',
    defaultName: 'ADICIONAL POR TEMPO DE SERVIÇO',
    code: '149',
    patterns: [/\b149\s*[-–]/i, /ADICIONAL\s*(?:POR\s*)?TEMPO\s*(?:DE\s*)?SERVI[CÇ]O/i, /\bATS\b/i]
  },
  {
    id: 'incentivo',
    defaultName: 'INCENTIVO FUNCIONAL',
    code: '708',
    patterns: [/INCENTIVO\s*FUNCIONAL/i]
  },
  {
    id: '702',
    defaultName: 'ADIC TITULAÇÃO PROF DA (SAÚDE)',
    code: '702',
    patterns: [/\b702\s*[-–]/i, /TITULA[CÇ][AÃ]O\s*PROFIS/i, /TITULA[CÇ][AÃ]O\s*PROF/i]
  },
  {
    id: '80',
    defaultName: 'INSALUBRIDADE',
    code: '80',
    patterns: [/\b80\s*[-–]\s*INSALUBRIDADE/i, /^INSALUBRIDADE(?!.*EXTRA)/i]
  },
  {
    id: '163',
    defaultName: 'FÉRIAS 1/3',
    code: '163',
    patterns: [/\b163\s*[-–]/i, /1\/3\s*(?:DE\s*)?F[EÉ]RIAS/i, /F[EÉ]RIAS\s*1\/3/i]
  },
  {
    id: 'periculo_he',
    defaultName: 'ADIC. PERICULO. HORA EXTRA',
    code: '787',
    patterns: [/PERICULO.*HORA/i]
  },
  {
    id: '72',
    defaultName: 'HORA EXTRA',
    code: '72',
    patterns: [/\b815\s*[-–]/i, /\b72\s*[-–]/i, /HORA\s*EXTRA\s*50%/i, /^(?!.*PERICULO).*HORA\s*EXTRA/i]
  },
  {
    id: '85',
    defaultName: 'AD NOTURNO',
    code: '85',
    patterns: [/\b85\s*[-–]/i, /AD(?:ICIONAL)?\s*NOTURNO/i]
  },
  {
    id: 'dsr',
    defaultName: 'D.S.R',
    code: 'DSR',
    patterns: [/^\s*D\.?\s*S\.?\s*R\b/i, /REPOUSO\s*SEMANAL/i]
  },
  {
    id: 'produtividade',
    defaultName: 'PRODUTIVIDADE',
    code: 'PROD',
    patterns: [/PRODUTIVIDADE/i]
  },
  {
    id: 'periculosidade',
    defaultName: 'PERICULOSIDADE',
    code: 'PERIC',
    patterns: [/PERICULOSIDADE(?!.*HORA)/i]
  },
  {
    id: 'risco',
    defaultName: 'ADICIONAL DE RISCO',
    code: 'RISCO',
    patterns: [/ADICIONAL\s*(?:DE\s*)?RISCO/i, /RISCO\s*DE\s*VIDA/i]
  },
  {
    id: 'fg_fc',
    defaultName: 'FG OU FC',
    code: 'FG/FC',
    patterns: [/^\s*FG\b|^\s*FC\b/i, /FUN[CÇ][AÃ]O\s*GRATIFICADA/i, /FUN[CÇ][AÃ]O\s*DE\s*CONFIAN[CÇ]A/i]
  }
];

export { parseMultiYearPdfFichaFinanceira as parsePdfFichaFinanceira } from '../multi-year-retroactive/infra/multiYearPdfParser';
export { mergePdfParseResults } from './mergePdfResults';

