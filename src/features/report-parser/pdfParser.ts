import * as pdfjs from 'pdfjs-dist';
import type { ParseResult, ServerInfo, MonthlyRecord, ParsedEvent } from '../../core/types';
import { parseBrazilianNumber } from '../../core/utils/math';

// Configure pdfjs worker URL for client-side execution
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
} catch (err) {
  console.warn('Unable to set workerSrc for pdfjs automatically', err);
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface VerbaDefinition {
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

interface PositionedItem {
  text: string;
  x: number;
  y: number;
}

export const parsePdfFichaFinanceira = async (file: File): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const allPositionedItems: PositionedItem[] = [];
  const extractedLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items as Array<{ str: string; transform?: number[] }>;

    const pageItems = items
      .filter(item => item.str && item.str.trim().length > 0)
      .map(item => ({
        text: item.str.trim(),
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? Math.round(item.transform[5]) : 0
      }));

    allPositionedItems.push(...pageItems);

    // Group items into visual rows by Y coordinate with 2px tolerance
    const rowMap = new Map<number, PositionedItem[]>();
    pageItems.forEach(item => {
      let foundKey: number | null = null;
      for (const key of rowMap.keys()) {
        if (Math.abs(key - item.y) <= 2) {
          foundKey = key;
          break;
        }
      }
      const targetKey = foundKey !== null ? foundKey : item.y;
      const existing = rowMap.get(targetKey) || [];
      existing.push(item);
      rowMap.set(targetKey, existing);
    });

    const sortedYKeys = Array.from(rowMap.keys()).sort((a, b) => b - a);

    sortedYKeys.forEach(y => {
      const rowItems = rowMap.get(y) || [];
      rowItems.sort((a, b) => a.x - b.x);
      const lineText = rowItems.map(i => i.text).join(' ');
      if (lineText.length > 0) {
        extractedLines.push(lineText);
      }
    });
  }

  const fullText = extractedLines.join('\n');

  // Parse Header Details
  const server = extractServerMetadata(fullText);

  // Parse Competencias & Events strictly mapped to monthly columns
  const { records, competencias } = extractMonthlyRecords(allPositionedItems, fullText);

  return {
    server,
    records,
    competencias,
    rawText: fullText,
    parseMethod: 'PDF'
  };
};

function extractServerMetadata(text: string): ServerInfo {
  const matriculaMatch = text.match(/(?:Matr[íi]cula|Matr\.)\s*[:\.-]?\s*([\d\w\-]+)/i);
  const nomeMatch = text.match(/(?:Nome|Servidor|Funcion[áa]rio)\s*[:\.-]?\s*([A-Z\sÁÉÍÓÚÂÊÔÃÕÇ]{4,60})/i) ||
    text.match(/Ficha Financeira.*?\n\s*([A-Z\sÁÉÍÓÚÂÊÔÃÕÇ]{4,60})/i);
  const cargoMatch = text.match(/(?:Cargo|Fun[çc][ãa]o)\s*[:\.-]?\s*([A-Z0-9\sÁÉÍÓÚ\-\/]{3,60})/i);
  const cpfMatch = text.match(/\b\d{3}\.\d{3}\.\d{3}\-\d{2}\b/);
  const orgaoMatch = text.match(/(Fundo Municipal de Sa[úu]de|Prefeitura Municipal de Rio Verde|FMS|FMC|Prefeitura)/i);
  const admissaoMatch = text.match(/(?:Admiss[ãa]o|Data Admiss[ãa]o)\s*[:\.-]?\s*(\d{2}\/\d{2}\/\d{4})/i);

  const cleanNome = (nomeMatch ? nomeMatch[1].trim() : 'SERVIDOR MUNICIPAL')
    .replace(/\s*(?:Rendimentos|Descontos|Proventos|Totais|Data|CPF|Matr[íi]cula).*$/i, '')
    .trim();

  const cleanCargo = (cargoMatch ? cargoMatch[1].trim() : 'SERVIDOR PÚBLICO')
    .replace(/\s*(?:Data\s*Nascimento|Nascimento|Admiss[ãa]o|Lota[çc][ãa]o|Carga\s*Hor[áa]ria).*$/i, '')
    .trim();

  const cleanMatricula = matriculaMatch ? matriculaMatch[1].trim() : '104859-1';
  const cleanOrgao = orgaoMatch ? orgaoMatch[1].toUpperCase() : 'PREFEITURA MUNICIPAL DE RIO VERDE - GO / CENTI';

  return {
    nome: cleanNome.replace(/\s+/g, ' '),
    matricula: cleanMatricula,
    cargo: cleanCargo.replace(/\s+/g, ' '),
    cpf: cpfMatch ? cpfMatch[0] : undefined,
    orgao: cleanOrgao,
    admissao: admissaoMatch ? admissaoMatch[1] : '01/01/2020'
  };
}

function extractMonthlyRecords(
  items: PositionedItem[],
  fullText: string
): { records: MonthlyRecord[]; competencias: string[] } {
  const anoMatch = fullText.match(/(?:Exerc[íi]cio|Ano|Compet[êe]ncia)\s*[:\.-]?\s*(\d{4})/i) ||
    fullText.match(/\b(202[0-9])\b/);
  const anoPadrao = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();

  // 1. Locate Month Column Headers and their center X coordinates
  const monthHeaderPositions: Array<{ mes: number; nome: string; x: number }> = [];

  MONTH_NAMES.forEach((nomeMes, idx) => {
    const headerItem = items.find(it =>
      it.text.toLowerCase() === nomeMes.toLowerCase() ||
      (nomeMes === 'Março' && it.text.toLowerCase().startsWith('mar'))
    );
    if (headerItem) {
      monthHeaderPositions.push({
        mes: idx + 1,
        nome: nomeMes,
        x: headerItem.x
      });
    }
  });

  monthHeaderPositions.sort((a, b) => a.x - b.x);

  // Group items into visual rows by Y coordinate with 2px tolerance
  const rowMap = new Map<number, PositionedItem[]>();
  items.forEach(item => {
    let foundKey: number | null = null;
    for (const key of rowMap.keys()) {
      if (Math.abs(key - item.y) <= 2) {
        foundKey = key;
        break;
      }
    }
    const targetKey = foundKey !== null ? foundKey : item.y;
    const existing = rowMap.get(targetKey) || [];
    existing.push(item);
    rowMap.set(targetKey, existing);
  });

  // 2. Detect column boundaries for each month
  const activeMonthsList = monthHeaderPositions.length > 0
    ? monthHeaderPositions.map(h => h.mes)
    : [1, 2, 3, 4, 5, 6, 7, 8];

  const activeMonthCount = Math.max(...activeMonthsList);

  const competencias: string[] = [];
  for (let m = 1; m <= activeMonthCount; m++) {
    const mesStr = m.toString().padStart(2, '0');
    competencias.push(`${mesStr}/${anoPadrao}`);
  }

  // 3. Initialize events map per month
  const eventsByMonth = new Map<number, ParsedEvent[]>();
  for (let m = 1; m <= activeMonthCount; m++) {
    eventsByMonth.set(m, []);
  }

  // 4. Process each visual row
  rowMap.forEach((rowItems) => {
    rowItems.sort((a, b) => a.x - b.x);
    const rowText = rowItems.map(i => i.text).join(' ');

    // Ignore discount totals, footer totals, bank loans (consignado), taxes and generic deductions
    if (/TOTAL\s*DE\s*DESCONTOS|TOTAL\s*DESCONTOS|TOTAL\s*DE\s*PROVENTOS|L[IÍ]QUIDO\s*A\s*RECEBER|BASE\s*DE\s*C[AÁ]LCULO/i.test(rowText)) return;
    if (/CONSIGNADO|EMPR[EÉ]STIMO|DESCONTO|IRRF|INSS|IPASGO|PENS[AÃ]O\s*ALIMENT|SINDICATO|MENSALIDADE|UNIMED|PLANO\s*DE\s*SA[UÚ]DE|VALE\s*TRANSPORTE/i.test(rowText)) return;

    // Ignore difference reajuste events (3473, 3476, 3879, 3886, 3898, 3900, 678, 791, 816, 831, 842, 1147, 3928) or descriptions containing DIF / DIFERENÇA
    if (/^\s*(?:3473|3476|3879|3886|3898|3900|678|791|816|831|842|1147|3928)\b/i.test(rowText)) return;
    if (/\b(?:DIF\b|DIF\.|DIFEREN[CÇ]A)\b/i.test(rowText)) return;

    // Check if row matches an allowed verba
    const matchedVerba = ALLOWED_VERBAS.find(v => v.patterns.some(p => p.test(rowText)));
    if (!matchedVerba) return;

    // Extract real numeric code from the row (e.g. "149 - ADICIONAL POR TEMPO DE SERVIÇO" -> "149")
    const codeMatch = rowText.match(/(?:^|\s)(\d{1,4})\s*[-–]\s*/);
    const eventCode = codeMatch ? codeMatch[1] : matchedVerba.code;

    // Separate Event Label (left items) from data columns (items near/under month columns)
    const firstMonthX = monthHeaderPositions[0]?.x || 160;

    // Extract description from the left items
    const labelItems = rowItems.filter(it => it.x < firstMonthX - 25);
    let rowLabel = labelItems.map(i => i.text).join(' ').trim();
    const descMatch = rowLabel.match(/(?:^|\s)\d{1,4}\s*[-–]\s*(.+)$/);
    const cleanDesc = descMatch ? descMatch[1].trim() : rowLabel.replace(/^\s*\d+\s*[-–]?\s*/, '').trim();
    const eventDesc = cleanDesc.length > 0 ? cleanDesc : matchedVerba.defaultName;

    // Filter items that belong to table cells (x >= firstMonthX - 30)
    const cellItems = rowItems.filter(it => it.x >= firstMonthX - 25);
    if (cellItems.length === 0) return;

    // Distribute cell items into each month column
    monthHeaderPositions.forEach((hdr, idx) => {
      const prevHdr = monthHeaderPositions[idx - 1];
      const nextHdr = monthHeaderPositions[idx + 1];

      const minX = prevHdr ? (prevHdr.x + hdr.x) / 2 : hdr.x - 30;
      const maxX = nextHdr ? (hdr.x + nextHdr.x) / 2 : hdr.x + 35;

      const itemsInColumn = cellItems.filter(it => it.x >= minX && it.x < maxX);
      if (itemsInColumn.length === 0) return;

      // Extract numbers in this column cell
      const numberMatches: Array<{ text: string; num: number; x: number }> = [];
      itemsInColumn.forEach(it => {
        const moneyMatch = it.text.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/);
        if (moneyMatch) {
          numberMatches.push({
            text: moneyMatch[0],
            num: parseBrazilianNumber(moneyMatch[0]),
            x: it.x
          });
        }
      });

      if (numberMatches.length === 0) return;

      let referencia = '1.00';
      let valor = 0;

      if (numberMatches.length === 1) {
        valor = numberMatches[0].num;
      } else if (numberMatches.length >= 2) {
        // Left is reference (e.g. 30,00 or 20,00 or 15,00), Right is monetary value (e.g. 2.439,24)
        numberMatches.sort((a, b) => a.x - b.x);
        referencia = numberMatches[0].text;
        valor = numberMatches[numberMatches.length - 1].num;
      }

      if (valor > 0) {
        const ev: ParsedEvent = {
          codigo: eventCode,
          descricao: eventDesc,
          tipo: 'PROVENTO',
          referencia,
          valor
        };

        const list = eventsByMonth.get(hdr.mes) || [];
        const existingIdx = list.findIndex(e => e.codigo === eventCode);
        if (existingIdx >= 0) {
          list[existingIdx] = ev;
        } else {
          list.push(ev);
        }
        eventsByMonth.set(hdr.mes, list);
      }
    });
  });

  const records: MonthlyRecord[] = competencias.map((comp) => {
    const [m, y] = comp.split('/').map(Number);
    const monthEvents = eventsByMonth.get(m) || [];

    return {
      competencia: comp,
      ano: y,
      mes: m,
      mesNome: MONTH_NAMES[m - 1] || `Mês ${m}`,
      eventos: monthEvents
    };
  });

  return { records, competencias };
}

export { mergePdfParseResults } from './mergePdfResults';

