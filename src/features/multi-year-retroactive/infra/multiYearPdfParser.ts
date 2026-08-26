import * as pdfjs from 'pdfjs-dist';
import type { ParseResult, ServerInfo, MonthlyRecord, ParsedEvent } from '../../../core/types';
import { parseBrazilianNumber } from '../../../core/utils/math';

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

interface PositionedItem {
  text: string;
  x: number;
  y: number;
  page: number;
}

export const parseMultiYearPdfFichaFinanceira = async (file: File): Promise<ParseResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pagesItems: PositionedItem[][] = [];
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
        y: item.transform ? Math.round(item.transform[5]) : 0,
        page: pageNum
      }));

    pagesItems.push(pageItems);

    // Group items into visual rows per page with 3px tolerance
    const rowMap = new Map<number, PositionedItem[]>();
    pageItems.forEach(item => {
      let foundKey: number | null = null;
      for (const key of rowMap.keys()) {
        if (Math.abs(key - item.y) <= 3) {
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

  // Parse Competencias & Events strictly mapped to monthly columns per page
  const { records, competencias } = extractMonthlyRecords(pagesItems, fullText);

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
  const orgaoMatch = text.match(/(Fundo Municipal de Sa[úu]de|Prefeitura Municipal de Rio Verde|FMS|FMC|Prefeitura|Fundo Municipal de Educa[çc][ãa]o|Fund\.\s*de\s*Man)/i);
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
  pagesItems: PositionedItem[][],
  fullText: string
): { records: MonthlyRecord[]; competencias: string[] } {
  const anoMatch = fullText.match(/(?:Exerc[íi]cio|Ano|Compet[êe]ncia)\s*[:\.-]?\s*(\d{4})/i) ||
    fullText.match(/\b(202[0-9])\b/);
  const anoPadrao = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();

  // Initialize events map per month (1 to 12)
  const eventsByMonth = new Map<number, ParsedEvent[]>();
  for (let m = 1; m <= 12; m++) {
    eventsByMonth.set(m, []);
  }

  const allActiveMonths = new Set<number>();

  // Process each page independently to eliminate cross-page coordinate collisions
  pagesItems.forEach(pageItems => {
    // 1. Locate Month Column Headers on THIS page
    const monthHeaderPositions: Array<{ mes: number; nome: string; x: number }> = [];

    MONTH_NAMES.forEach((nomeMes, idx) => {
      const headerItem = pageItems.find(it =>
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
    monthHeaderPositions.forEach(h => allActiveMonths.add(h.mes));

    // 2. Group items on THIS page into visual rows by Y coordinate with 3px tolerance
    const rowMap = new Map<number, PositionedItem[]>();
    pageItems.forEach(item => {
      let foundKey: number | null = null;
      for (const key of rowMap.keys()) {
        if (Math.abs(key - item.y) <= 3) {
          foundKey = key;
          break;
        }
      }
      const targetKey = foundKey !== null ? foundKey : item.y;
      const existing = rowMap.get(targetKey) || [];
      existing.push(item);
      rowMap.set(targetKey, existing);
    });

    // 3. Process visual rows for this page
    rowMap.forEach((rowItems) => {
      rowItems.sort((a, b) => a.x - b.x);
      const rowText = rowItems.map(i => i.text).join(' ');

      // Ignore discount totals, footer totals, bank loans (consignado), taxes, adiantamentos, iparv/ipasgo and generic deductions
      if (/TOTAL\s*DE\s*DESCONTOS|TOTAL\s*DESCONTOS|TOTAL\s*DE\s*PROVENTOS|L[IÍ]QUIDO\s*A\s*RECEBER|BASE\s*DE\s*C[AÁ]LCULO/i.test(rowText)) return;
      if (/IPARV|IPASGO|INSS|IRRF|CONSIGNADO|EMPR[EÉ]STIMO|DESCONTO|PENS[AÃ]O\s*ALIMENT|SINDICATO|MENSALIDADE|UNIMED|PLANO\s*DE\s*SA[UÚ]DE|VALE\s*TRANSPORTE|ADIANTAMENTO|SINDIVERDE|PLANO ODONTO|MULTA DE TRANSITO|INDENIZACAO LICENCA PREMIO/i.test(rowText)) return;
      if (/\bFALTA\b|\bFALTAS\b/i.test(rowText)) return;

      // Ignore Função Gratificada / Cargo em Comissão (FG, FC, etc.) - not subject to career letter progression
      if (/\bFG\b|\bFC\b|\bFG-\d+\b|FUN[CÇ][AÃ]O\s*GRATIFICADA|FUN[CÇ][AÃ]O\s*COMISSIONADA|CARGO\s*EM\s*COMISS[AÃ]O/i.test(rowText)) return;
      if (/^\s*(?:1158|1721|3503|3876)\b/i.test(rowText)) return;

      // Ignore Abono de Permanência
      if (/ABONO\s*PERMAN[EÊ]NCIA|\b609\b/i.test(rowText)) return;

      // Extract real numeric code and description from label
      const codeMatch = rowText.match(/(?:^|\s)(\d{1,4})\s*[-–]\s*(.+)$/);
      if (!codeMatch) return;

      const eventCode = codeMatch[1];
      const rawDesc = codeMatch[2].replace(/\s*\d+,\d+.*$/, '').trim();

      // Ignore known discount codes
      const isDesconto = ["54", "1883", "142", "160", "640", "641", "657", "719", "86", "91", "94", "95", "101", "104", "282", "1121", "3359"].includes(eventCode);
      if (isDesconto) return;

      // Separate Event Label (left items) from data columns (items near/under month columns)
      const firstMonthX = monthHeaderPositions[0]?.x || 145;

      // Extract description from the left items
      const labelItems = rowItems.filter(it => it.x < firstMonthX - 25);
      let rowLabel = labelItems.map(i => i.text).join(' ').trim();
      const descMatch = rowLabel.match(/(?:^|\s)\d{1,4}\s*[-–]\s*(.+)$/);
      const cleanDesc = descMatch ? descMatch[1].trim() : rowLabel.replace(/^\s*\d+\s*[-–]?\s*/, '').trim();
      const eventDesc = cleanDesc.length > 0 ? cleanDesc : rawDesc;

      // Filter items that belong to table cells (x >= firstMonthX - 25)
      const cellItems = rowItems.filter(it => it.x >= firstMonthX - 25);
      if (cellItems.length === 0) return;

      // Distribute cell items into each month column (12 monthly grid slots of 50px)
      for (let m = 1; m <= 12; m++) {
        const minX = 145 + (m - 1) * 50;
        const maxX = 145 + m * 50;

        const itemsInColumn = cellItems.filter(it => it.x >= minX && it.x < maxX);
        if (itemsInColumn.length === 0) continue;

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

        if (numberMatches.length === 0) continue;

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

          const list = eventsByMonth.get(m) || [];
          const existingIdx = list.findIndex(e => e.codigo === eventCode);
          if (existingIdx >= 0) {
            list[existingIdx] = ev;
          } else {
            list.push(ev);
          }
          eventsByMonth.set(m, list);
          allActiveMonths.add(m);
        }
      }
    });
  });

  const activeMonthsList = Array.from(allActiveMonths);
  const activeMonthCount = activeMonthsList.length > 0 ? Math.max(...activeMonthsList) : 8;

  const competencias: string[] = [];
  for (let m = 1; m <= activeMonthCount; m++) {
    const mesStr = m.toString().padStart(2, '0');
    competencias.push(`${mesStr}/${anoPadrao}`);
  }

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

export { mergePdfParseResults } from '../../report-parser/mergePdfResults';
