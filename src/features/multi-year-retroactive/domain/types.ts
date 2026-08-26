import type {
  MonthlyRecord,
  ProgressionParams,
  ProgressionSummary,
  ServerInfo
} from '../../../core/types';

export interface YearPartition {
  ano: number;
  records: MonthlyRecord[];
  competencias: string[];
}

export interface MultiYearRequest {
  mergedRecords: MonthlyRecord[];
  params: ProgressionParams;
  selectedCompetencias: string[];
  serverInfo?: ServerInfo;
}

export interface ConsolidatedYearEntry {
  ano: number;
  summary: ProgressionSummary;
}

export interface MultiYearConsolidatedSummary extends ProgressionSummary {
  yearlyEntries?: ConsolidatedYearEntry[];
  isMultiYear?: boolean;
}
