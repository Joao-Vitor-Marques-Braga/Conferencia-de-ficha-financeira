import type { ParseResult, MonthlyRecord, ServerInfo } from '../../core/types';

/**
 * Merges multiple ParseResults into a continuous chronological timeline,
 * eliminating overlapping competencies and combining unique events.
 */
export function mergePdfParseResults(results: ParseResult[]): {
  merged: ParseResult;
  overlaps: string[];
} {
  if (results.length === 0) {
    return {
      merged: {
        server: { nome: '', matricula: '', cargo: '', orgao: '' },
        records: [],
        competencias: [],
        rawText: '',
        parseMethod: 'PDF'
      },
      overlaps: []
    };
  }

  if (results.length === 1) {
    return { merged: results[0], overlaps: [] };
  }

  const recordMap = new Map<string, MonthlyRecord>();
  const overlaps: string[] = [];

  // Merge server metadata from the latest/most complete result
  let mergedServer: ServerInfo = { ...results[0].server };
  let mergedRawText = '';

  results.forEach(res => {
    mergedRawText += `\n--- NOVO PDF ---\n` + res.rawText;
    if (res.server.nome && res.server.nome !== 'SERVIDOR MUNICIPAL') {
      mergedServer.nome = res.server.nome;
    }
    if (res.server.matricula && res.server.matricula !== '104859-1') {
      mergedServer.matricula = res.server.matricula;
    }
    if (res.server.cargo && res.server.cargo !== 'SERVIDOR PÚBLICO') {
      mergedServer.cargo = res.server.cargo;
    }
    if (res.server.orgao) mergedServer.orgao = res.server.orgao;
    if (res.server.admissao) mergedServer.admissao = res.server.admissao;
    if (res.server.portariaNumero) mergedServer.portariaNumero = res.server.portariaNumero;

    res.records.forEach(rec => {
      if (recordMap.has(rec.competencia)) {
        overlaps.push(rec.competencia);
        // If current record has more events, replace
        const existing = recordMap.get(rec.competencia)!;
        if (rec.eventos.length > existing.eventos.length) {
          recordMap.set(rec.competencia, rec);
        }
      } else {
        recordMap.set(rec.competencia, rec);
      }
    });
  });

  // Sort all unique records chronologically (by year and month)
  const allRecords = Array.from(recordMap.values()).sort((a, b) => {
    const keyA = a.ano * 100 + a.mes;
    const keyB = b.ano * 100 + b.mes;
    return keyA - keyB;
  });

  const competencias = allRecords.map(r => r.competencia);

  return {
    merged: {
      server: mergedServer,
      records: allRecords,
      competencias,
      rawText: mergedRawText,
      parseMethod: 'PDF'
    },
    overlaps: Array.from(new Set(overlaps))
  };
}
