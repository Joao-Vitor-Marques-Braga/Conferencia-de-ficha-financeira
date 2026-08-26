import { calculateProgressionSummary } from '../../../calculation/domain/calculateProgression';
import type { MultiYearConsolidatedSummary, MultiYearRequest } from '../types';
import { consolidateYearlyResults } from './consolidateYearlyResults';
import { partitionRecordsByYear } from './partitionRecordsByYear';

/**
 * Orchestrator: Calculates multi-year retroactive progressions by executing the single-year
 * calculation engine (calculateProgressionSummary) once per year partition as an unmodified black box,
 * and consolidating the results into a unified timeline and analytical statement.
 */
export function calculateMultiYearRetroactive(
  request: MultiYearRequest
): MultiYearConsolidatedSummary {
  const { mergedRecords, params, selectedCompetencias, serverInfo } = request;

  if (!mergedRecords || mergedRecords.length === 0 || !selectedCompetencias || selectedCompetencias.length === 0) {
    return consolidateYearlyResults([], params, serverInfo);
  }

  // 1. Partition records by year
  const partitions = partitionRecordsByYear(mergedRecords, selectedCompetencias);

  if (partitions.length === 0) {
    return consolidateYearlyResults([], params, serverInfo);
  }

  // 2. Execute single-year engine for each partition
  const yearlySummaries = partitions.map((partition, idx) => {
    // Initial partial-days rateio only applies to the very first month of the overall period
    const isFirstYear = idx === 0;

    const paramsForYear = {
      ...params,
      mesInicial: partition.competencias[0],
      mesFinal: partition.competencias[partition.competencias.length - 1],
      diasRetroativos: isFirstYear ? (params.diasRetroativos ?? 30) : 30
    };

    const summary = calculateProgressionSummary(
      partition.records,
      paramsForYear,
      partition.competencias
    );

    if (serverInfo) {
      summary.server = { ...summary.server, ...serverInfo };
    }

    return summary;
  });

  // 3. Consolidate results across all years
  return consolidateYearlyResults(yearlySummaries, params, serverInfo);
}
