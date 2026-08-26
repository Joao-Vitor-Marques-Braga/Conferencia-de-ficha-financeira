/**
 * Public API for the Multi-Year Retroactive Feature Module.
 */
export * from './domain/types';
export * from './domain/usecases/partitionRecordsByYear';
export * from './domain/usecases/consolidateYearlyResults';
export * from './domain/usecases/calculateMultiYearRetroactive';
export * from './presentation/components/MultiYearRetroactiveView';
export * from './infra/multiYearPdfParser';
