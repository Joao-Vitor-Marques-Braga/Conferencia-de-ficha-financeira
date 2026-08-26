import { useState, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './core/components/Header';
import { FileUploader } from './features/report-parser/components/FileUploader';
import { ServerHeaderCard } from './features/report-parser/components/ServerHeaderCard';
import { ParameterControls } from './features/calculation/components/ParameterControls';
import { SummaryMetricsCards } from './features/calculation/components/SummaryMetricsCards';
import { ProgressionTable } from './features/summary-view/components/ProgressionTable';
import { MonthlyBreakdownAccordion } from './features/calculation/components/MonthlyBreakdownAccordion';
import { SummaryConsolidation } from './features/calculation/components/SummaryConsolidation';
import { VerbaSelectorModal } from './features/calculation/components/VerbaSelectorModal';
import { HistoryDrawer } from './features/history/components/HistoryDrawer';
import { FunctionalIncentiveView } from './features/functional-incentive/components/FunctionalIncentiveView';
import { BatchProcessingView } from './features/batch-calculation/components/BatchProcessingView';
import { calculateProgressionSummary } from './features/calculation/domain/calculateProgression';
import { calculateMultiYearRetroactive } from './features/multi-year-retroactive';
import { exportProgressionPdfReport } from './features/pdf-exporter/exportProgressionPdf';
import { exportConsolidatedSpreadsheet, exportDetailedMonthlySpreadsheet } from './features/spreadsheet-exporter/exportSpreadsheet';
import { storageService } from './core/services/storageService';
import { roundMoney } from './core/utils/math';
import type { ParseResult, ProgressionParams, CalculatedEventRow, SavedCalculation, UnifiedVerbaGroup } from './core/types';
import { Download, FileCheck, ShieldCheck, Save, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export function App() {
  // Navigation tabs: 'PROGRESSAO' | 'INCENTIVO' | 'MASSA'
  const [activeTab, setActiveTab] = useState<'PROGRESSAO' | 'INCENTIVO' | 'MASSA'>('PROGRESSAO');

  // Modals & Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVerbaSelectorOpen, setIsVerbaSelectorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Active progression dataset
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'ANALITICA' | 'HIERARQUICA'>('ANALITICA');

  // Calculation parameters default state
  const [params, setParams] = useState<ProgressionParams>({
    percentualProgressao: 6.12,
    percentualATS: 15,
    percentualTitulacao: 20,
    percentualRiscoInsalubridade: 20,
    divisorJornada: 200,
    mesInicial: '01/2026',
    mesFinal: '08/2026',
    modoRateio: 'DATA_EFETIVA',
    dataEfetiva: '2026-01-14',
    diasRetroativos: 30,
    diasFerias: 15,
    aplicarReflexo13: false,
    aplicarReflexoFerias: false,
    portariaNumero: 'Portaria nº 1.482/2026',
    selectedVerbaCodes: undefined,
    unifiedVerbas: []
  });

  const [selectedCompetencias, setSelectedCompetencias] = useState<string[]>([]);
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<CalculatedEventRow>>>({});
  const [deletedRowCodes, setDeletedRowCodes] = useState<string[]>([]);

  // Update saved calculations count
  const refreshSavedCount = useCallback(() => {
    setSavedCount(storageService.getSavedCalculations().length);
  }, []);

  useEffect(() => {
    refreshSavedCount();
  }, [refreshSavedCount]);

  // Show temporary toast
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Collect all unique verbas present in the parsed records
  const allAvailableVerbas = useMemo(() => {
    if (!parseResult) return [];
    const map = new Map<string, { codigo: string; descricao: string }>();
    parseResult.records.forEach(rec => {
      rec.eventos.forEach(ev => {
        if (!map.has(ev.codigo)) {
          map.set(ev.codigo, { codigo: ev.codigo, descricao: ev.descricao });
        }
      });
    });
    return Array.from(map.values());
  }, [parseResult]);

  // Handler when PDF or Mock is loaded
  const handleDataParsed = (result: ParseResult) => {
    setParseResult(result);
    setRowOverrides({});
    setDeletedRowCodes([]);

    const availableCodes: string[] = [];
    const map = new Map<string, string>();
    result.records.forEach(rec => {
      rec.eventos.forEach(ev => map.set(ev.codigo, ev.descricao));
    });
    for (const code of map.keys()) {
      availableCodes.push(code);
    }

    if (result.competencias.length > 0) {
      const initComp = result.competencias[0];
      const endComp = result.competencias[result.competencias.length - 1];
      setParams(prev => ({
        ...prev,
        mesInicial: initComp,
        mesFinal: endComp,
        diasRetroativos: 30,
        selectedVerbaCodes: availableCodes
      }));
      setSelectedCompetencias(result.competencias);
    }
  };

  const handleReset = () => {
    if (parseResult && !confirm('Deseja iniciar uma nova apuração? Todos os parâmetros atuais serão reiniciados.')) {
      return;
    }
    setParseResult(null);
    setRowOverrides({});
    setDeletedRowCodes([]);
  };

  // Recompute summary whenever data or parameters change
  const summary = useMemo(() => {
    if (!parseResult) return null;

    // Detect if this calculation spans multiple calendar years
    const uniqueYears = Array.from(new Set(selectedCompetencias.map(c => c.split('/')[1])));

    let computed: ReturnType<typeof calculateProgressionSummary>;

    if (uniqueYears.length > 1) {
      computed = calculateMultiYearRetroactive({
        mergedRecords: parseResult.records,
        params,
        selectedCompetencias,
        serverInfo: parseResult.server
      });
    } else {
      computed = calculateProgressionSummary(
        parseResult.records,
        params,
        selectedCompetencias
      );
    }

    computed.server = {
      ...parseResult.server,
      portariaNumero: params.portariaNumero
    };

    // Filter out user-deleted rows
    if (deletedRowCodes.length > 0) {
      computed.rows = computed.rows.filter(r => !deletedRowCodes.includes(r.codigo));
    }

    // Apply manual row overrides if any
    const hasOverrides = Object.keys(rowOverrides).length > 0;
    if (hasOverrides) {
      computed.rows = computed.rows.map(row => {
        const override = rowOverrides[row.codigo];
        if (override) {
          const newL1 = override.letra1Valor ?? row.letra1Valor;
          const newL2 = override.letra2Valor ?? row.letra2Valor;
          const diff = newL2 - newL1;
          const totalDiff = row.codigo === '163' ? diff : roundMoney(diff * row.qtdMeses);
          return {
            ...row,
            letra1Valor: newL1,
            letra2Valor: newL2,
            diferencaUnitaria: diff,
            totalDiferenca: totalDiff,
            reflexo13: params.aplicarReflexo13 && row.codigo !== '163' ? roundMoney(totalDiff * (1 / 12)) : 0,
            reflexoFerias: params.aplicarReflexoFerias && row.codigo !== '163' ? roundMoney(totalDiff * (1 / 3) * (1 / 12)) : 0,
            manualOverride: true
          };
        }
        return row;
      });
    }

    // If rows were deleted or overridden, update summary totals accordingly
    if (deletedRowCodes.length > 0 || hasOverrides) {
      computed.totalLetra1Mensal = roundMoney(computed.rows.reduce((sum, r) => sum + r.letra1Valor, 0));
      computed.totalLetra2Mensal = roundMoney(computed.rows.reduce((sum, r) => sum + r.letra2Valor, 0));
      computed.totalDiferencaMensal = roundMoney(computed.totalLetra2Mensal - computed.totalLetra1Mensal);
      computed.totalDiferencaAcumulada = roundMoney(computed.rows.reduce((sum, r) => sum + r.totalDiferenca, 0));
      computed.totalReflexo13 = roundMoney(computed.rows.reduce((sum, r) => sum + r.reflexo13, 0));
      computed.totalReflexoFerias = roundMoney(computed.rows.reduce((sum, r) => sum + r.reflexoFerias, 0));
      computed.grandTotal = roundMoney(computed.totalDiferencaAcumulada + computed.totalReflexo13 + computed.totalReflexoFerias);
    }

    return computed;
  }, [parseResult, params, selectedCompetencias, rowOverrides, deletedRowCodes]);

  const handleRowUpdate = (updatedRow: CalculatedEventRow) => {
    setRowOverrides(prev => ({
      ...prev,
      [updatedRow.codigo]: {
        letra1Valor: updatedRow.letra1Valor,
        letra2Valor: updatedRow.letra2Valor
      }
    }));
  };

  const handleDeleteRow = (codigo: string) => {
    setDeletedRowCodes(prev => [...prev, codigo]);
  };

  const handleRestoreRows = () => {
    setDeletedRowCodes([]);
  };

  // Save active calculation into localStorage
  const handleSaveCalculation = useCallback(() => {
    if (!summary || !parseResult) {
      showToast('Nenhuma apuração ativa para salvar.', 'info');
      return;
    }

    const savedItem: SavedCalculation = {
      id: `CALC_${parseResult.server.matricula || '0'}_${params.mesInicial}_${params.mesFinal}`.replace(/\//g, '-'),
      timestamp: new Date().toISOString(),
      nomeServidor: summary.server.nome,
      matricula: summary.server.matricula,
      cargo: summary.server.cargo,
      orgao: summary.server.orgao,
      portariaNumero: params.portariaNumero || 'N/A',
      periodo: `${params.mesInicial} a ${params.mesFinal}`,
      grandTotal: summary.grandTotal,
      totalDiferenca: summary.totalDiferencaAcumulada,
      conferido: true,
      parseResult,
      params,
      summary
    };

    storageService.saveCalculation(savedItem);
    refreshSavedCount();
    showToast(`Apuração de ${summary.server.nome} salva no histórico!`, 'success');
  }, [summary, parseResult, params, refreshSavedCount]);

  // Global keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveCalculation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveCalculation]);

  // Restore saved calculation from History
  const handleLoadSavedCalculation = (saved: SavedCalculation) => {
    setParseResult(saved.parseResult);
    setParams(saved.params);
    setSelectedCompetencias(saved.summary.competenciasSelecionadas);
    setRowOverrides({});
    setDeletedRowCodes([]);
    showToast(`Cálculo de ${saved.nomeServidor} restaurado do histórico.`, 'info');
  };

  // Export handlers
  const handleExportPdf = () => {
    if (!summary) return;
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      exportProgressionPdfReport(summary);
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
    }
  };

  const handleExportConsolidatedCsv = () => {
    if (!summary) return;
    exportConsolidatedSpreadsheet(summary);
    showToast('Planilha Consolidada baixada com sucesso!', 'success');
  };

  const handleExportDetailedCsv = () => {
    if (!summary) return;
    exportDetailedMonthlySpreadsheet(summary);
    showToast('Planilha Detalhada Mês a Mês baixada com sucesso!', 'success');
  };

  // Apply verba selection
  const handleApplyVerbaSelection = (selectedCodes: string[], unifiedGroups: UnifiedVerbaGroup[]) => {
    setParams(prev => ({
      ...prev,
      selectedVerbaCodes: selectedCodes,
      unifiedVerbas: unifiedGroups
    }));
    showToast(`${selectedCodes.length} verbas aplicadas ao cálculo.`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#0b131e] text-slate-100 flex flex-col selection:bg-[#008d50] selection:text-white">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border font-bold text-xs ${toastMessage.type === 'success'
              ? 'bg-[#008d50] text-white border-[#008d50]'
              : 'bg-[#1b2a3f] text-[#ead04d] border-[#324f72]'
            }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header with Module Navigation */}
      <Header
        onReset={handleReset}
        hasData={!!parseResult}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        savedCount={savedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Module Tab 2: Incentivo Funcional */}
        {activeTab === 'INCENTIVO' && (
          <FunctionalIncentiveView />
        )}

        {/* Module Tab 3: Cálculo em Massa */}
        {activeTab === 'MASSA' && (
          <BatchProcessingView
            onLoadSingleServer={(res) => {
              handleDataParsed(res);
              setActiveTab('PROGRESSAO');
            }}
          />
        )}

        {/* Module Tab 1: Progressão Funcional */}
        {activeTab === 'PROGRESSAO' && (
          <>
            {!parseResult ? (
              /* Empty State: File Uploader & Hero Info */
              <div className="space-y-8 py-4">

                {/* Hero Banner */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#132030] border border-[#324f72]/60 text-xs font-bold shadow-xs">
                    <span className="flex h-2 w-2 rounded-full bg-[#008d50]" />
                    <span className="text-[#ead04d] font-extrabold">Prefeitura de Rio Verde</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-semibold">Sistema Centi</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    Apuração e Cálculo de Diferenças Salariais por Progressão
                  </h2>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
                    Carregue a Ficha Financeira em PDF do servidor para apurar automaticamente as diferenças salariais acumuladas entre a Letra Atual (Letra 1) e a Letra com Progressão (Letra 2), incluindo rateio por data efetiva e quadro de parcelamento.
                  </p>
                </div>

                {/* Drag & Drop PDF Uploader */}
                <FileUploader onDataParsed={handleDataParsed} />

                {/* Quick Feature Badges with Brand Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-xs">
                  <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#324f72] flex items-start space-x-3.5 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-[#324f72]/30 text-[#446995] flex items-center justify-center shrink-0 border border-[#324f72]/40">
                      <ShieldCheck className="w-5 h-5 text-[#446995]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white">100% Client-Side & Seguro</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-normal font-medium">
                        Seus dados e relatórios em PDF são processados em memória no seu navegador, sem envio para servidores externos.
                      </p>
                    </div>
                  </div>

                  <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#008d50] flex items-start space-x-3.5 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-[#008d50]/20 text-[#008d50] flex items-center justify-center shrink-0 border border-[#008d50]/40">
                      <FileCheck className="w-5 h-5 text-[#008d50]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white">Rateio por Data Efetiva</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-normal font-medium">
                        Cálculo proporcional exato dia a dia pelo calendário real da portaria.
                      </p>
                    </div>
                  </div>

                  <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#f88543] flex items-start space-x-3.5 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-[#f88543]/20 text-[#f88543] flex items-center justify-center shrink-0 border border-[#f88543]/40">
                      <Download className="w-5 h-5 text-[#f88543]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white">Exportação Excel & PDF</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-normal font-medium">
                        Exportação oficial em PDF, Excel Consolidado e Detalhado mês a mês.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Active State: Dashboard & Calculation Analysis */
              <div className="space-y-6 animate-fade-in">

                {/* Top Toolbar Actions */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-2 border-b border-[#324f72]/40">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-[#008d50] animate-pulse" />
                    <h2 className="text-lg font-black text-white">Painel de Apuração e Apresentação</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Save Button with Ctrl+S badge */}
                    <button
                      onClick={handleSaveCalculation}
                      className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-[#008d50] border border-[#008d50]/40 shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Salvar cálculo no histórico local (Atalho: Ctrl+S)"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Salvar <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[#0b131e] text-[10px] text-slate-400 border border-[#324f72]">Ctrl+S</span>
                    </button>

                    {/* Export Excel Consolidado */}
                    <button
                      onClick={handleExportConsolidatedCsv}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-[#ead04d] border border-[#324f72] transition-all cursor-pointer"
                      title="Exportar Planilha Excel com Resumo Consolidado e Parcelamento"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#ead04d]" />
                      Excel Consolidado
                    </button>

                    {/* Export Excel Detalhado */}
                    <button
                      onClick={handleExportDetailedCsv}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-[#132030] hover:bg-[#1b2a3f] text-slate-200 border border-[#324f72] transition-all cursor-pointer"
                      title="Exportar Planilha Excel com Detalhamento Mês a Mês"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-400" />
                      Excel Detalhado
                    </button>

                    {/* Export PDF */}
                    <button
                      onClick={handleExportPdf}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-[#008d50] hover:bg-[#00663a] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Laudo PDF Oficial
                    </button>
                  </div>
                </div>

                {/* Server Header Card */}
                <ServerHeaderCard
                  server={parseResult.server}
                  parseMethod={parseResult.parseMethod}
                />

                {/* Parameter Controls */}
                <ParameterControls
                  params={params}
                  onParamsChange={setParams}
                  competencias={parseResult.competencias}
                  selectedCompetencias={selectedCompetencias}
                  onCompetenciasChange={setSelectedCompetencias}
                  onOpenVerbaSelector={() => setIsVerbaSelectorOpen(true)}
                  totalVerbasDisponiveis={allAvailableVerbas.length}
                  verbasSelecionadasCount={params.selectedVerbaCodes ? params.selectedVerbaCodes.length : allAvailableVerbas.length}
                  onResetParams={() => {
                    setParams({
                      percentualProgressao: 6.12,
                      percentualATS: 15,
                      percentualTitulacao: 20,
                      percentualRiscoInsalubridade: 20,
                      divisorJornada: 200,
                      mesInicial: parseResult.competencias[0] || '01/2026',
                      mesFinal: parseResult.competencias[parseResult.competencias.length - 1] || '08/2026',
                      modoRateio: 'DATA_EFETIVA',
                      dataEfetiva: '2026-01-14',
                      diasRetroativos: 30,
                      diasFerias: 15,
                      aplicarReflexo13: false,
                      aplicarReflexoFerias: false,
                      portariaNumero: 'Portaria nº 1.482/2026',
                      selectedVerbaCodes: allAvailableVerbas.map(v => v.codigo),
                      unifiedVerbas: []
                    });
                    setSelectedCompetencias(parseResult.competencias);
                    setRowOverrides({});
                    setDeletedRowCodes([]);
                  }}
                />

                {/* Executive KPI Summary Cards */}
                {summary && <SummaryMetricsCards summary={summary} />}

                {/* View Mode Switcher: Demonstrativo Analítico vs Detalhamento Hierárquico Ano > Mês */}
                <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0c1624] border border-[#324f72]/50">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveViewMode('ANALITICA')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeViewMode === 'ANALITICA'
                          ? 'bg-[#324f72] text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Demonstrativo Analítico (Por Verba)
                    </button>
                    <button
                      onClick={() => setActiveViewMode('HIERARQUICA')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeViewMode === 'HIERARQUICA'
                          ? 'bg-[#324f72] text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Detalhamento por Ano &gt; Mês (Acordeão)
                    </button>
                  </div>

                  <span className="text-[11px] text-[#ead04d] font-mono font-bold pr-3 hidden sm:inline">
                    {summary?.qtdMesesEquivalentes} meses equivalentes apurados
                  </span>
                </div>

                {/* Analytical Progression Table */}
                {summary && activeViewMode === 'ANALITICA' && (
                  <ProgressionTable
                    summary={summary}
                    onRowUpdate={handleRowUpdate}
                    onDeleteRow={handleDeleteRow}
                    deletedCount={deletedRowCodes.length}
                    onRestoreRows={handleRestoreRows}
                  />
                )}

                {/* Monthly/Yearly Breakdown Accordion (Item 4) */}
                {summary && activeViewMode === 'HIERARQUICA' && (
                  <MonthlyBreakdownAccordion
                    yearlyBreakdown={summary.yearlyBreakdown}
                  />
                )}

                {/* Quadro de Consolidação Final (Total, Proporcional e Parcelamento) */}
                {summary && (
                  <SummaryConsolidation
                    summary={summary}
                  />
                )}

              </div>
            )}
          </>
        )}

      </main>

      {/* Verba Selector Modal (Item 1) */}
      <VerbaSelectorModal
        isOpen={isVerbaSelectorOpen}
        onClose={() => setIsVerbaSelectorOpen(false)}
        allAvailableVerbas={allAvailableVerbas}
        selectedCodes={params.selectedVerbaCodes || allAvailableVerbas.map(v => v.codigo)}
        unifiedGroups={params.unifiedVerbas || []}
        onApplySelection={handleApplyVerbaSelection}
      />

      {/* History Drawer (Item 7) */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadCalculation={handleLoadSavedCalculation}
      />

      {/* Footer */}
      <footer className="bg-[#0c1521] border-t border-[#324f72]/40 text-xs text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          {/* 4-color dots in footer */}
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008d50]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#324f72]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f88543]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ead04d]" />
          </div>
          <p className="font-extrabold text-slate-200">Prefeitura Municipal de Rio Verde — GO • Conferência de Ficha Financeira</p>
          <p className="text-[11px] text-slate-500 font-medium">Desenvolvido em React + TypeScript • Processamento 100% Stateless no Navegador</p>
        </div>
      </footer>

    </div>
  );
}

export default App;

