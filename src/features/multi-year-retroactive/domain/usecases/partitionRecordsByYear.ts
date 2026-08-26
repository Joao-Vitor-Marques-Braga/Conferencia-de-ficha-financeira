import type { MonthlyRecord } from '../../../../core/types';
import type { YearPartition } from '../types';

/**
 * Pure function: Groups monthly records by civil year, filtering and ordering
 * competencies strictly according to the selectedCompetencias list.
 */
export function partitionRecordsByYear(
  records: MonthlyRecord[],
  selectedCompetencias: string[]
): YearPartition[] {
  if (!records || records.length === 0 || !selectedCompetencias || selectedCompetencias.length === 0) {
    return [];
  }

  // 1. Identify all unique years from selectedCompetencias in chronological order
  const yearSet = new Set<number>();
  selectedCompetencias.forEach(comp => {
    const parts = comp.split('/');
    if (parts.length === 2) {
      const ano = parseInt(parts[1], 10);
      if (!isNaN(ano)) {
        yearSet.add(ano);
      }
    }
  });

  const sortedYears = Array.from(yearSet).sort((a, b) => a - b);

  // 2. Build partition for each year
  return sortedYears.map(ano => {
    const yearSuffix = `/${ano}`;
    const yearCompetencias = selectedCompetencias.filter(comp => comp.endsWith(yearSuffix));

    // Filter records belonging to this year
    const yearRecords = records.filter(r => r.ano === ano || r.competencia.endsWith(yearSuffix));

    return {
      ano,
      records: yearRecords,
      competencias: yearCompetencias
    };
  });
}
