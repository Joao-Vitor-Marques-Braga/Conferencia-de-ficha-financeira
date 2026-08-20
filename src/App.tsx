import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './core/components/Header';
import { FileUploader } from './features/report-parser/components/FileUploader';
import { ServerHeaderCard } from './features/report-parser/components/ServerHeaderCard';
import { ParameterControls } from './features/calculation/components/ParameterControls';
import { SummaryMetricsCards } from './features/calculation/components/SummaryMetricsCards';
import { ProgressionTable } from './features/summary-view/components/ProgressionTable';
import { SummaryConsolidation } from './features/calculation/components/SummaryConsolidation';
import { calculateProgressionSummary } from './features/calculation/domain/calculateProgression';
import { exportProgressionPdfReport } from './features/pdf-exporter/exportProgressionPdf';
import { getMockCentiRioVerdeData } from './features/report-parser/mockData';
import { roundMoney } from './core/utils/math';
import type { ParseResult, ProgressionParams, CalculatedEventRow } from './core/types';
import { Download, FileCheck, ShieldCheck } from 'lucide-react';

export function App() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Calculation parameters default state
  const [params, setParams] = useState<ProgressionParams>({
    percentualProgressao: 6.12,
    percentualATS: 15,
    percentualTitulacao: 20,
    percentualRiscoInsalubridade: 20,
    divisorJornada: 200,
    mesInicial: '01/2026',
    mesFinal: '08/2026',
    diasRetroativos: 30,
    aplicarReflexo13: true,
    aplicarReflexoFerias: true,
  });

  const [selectedCompetencias, setSelectedCompetencias] = useState<string[]>([]);
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<CalculatedEventRow>>>({});
  const [deletedRowCodes, setDeletedRowCodes] = useState<string[]>([]);

  // Handler when PDF or Mock is loaded
  const handleDataParsed = (result: ParseResult) => {
    setParseResult(result);
    setRowOverrides({});
    setDeletedRowCodes([]);
    
    if (result.competencias.length > 0) {
      const initComp = result.competencias[0];
      const endComp = result.competencias[result.competencias.length - 1];
      setParams(prev => ({
        ...prev,
        mesInicial: initComp,
        mesFinal: endComp,
        diasRetroativos: 30
      }));
      setSelectedCompetencias(result.competencias);
    }
  };

  const handleLoadMock = () => {
    const mock = getMockCentiRioVerdeData();
    handleDataParsed(mock);
  };

  const handleReset = () => {
    setParseResult(null);
    setRowOverrides({});
    setDeletedRowCodes([]);
  };

  // Recompute summary whenever data or parameters change
  const summary = useMemo(() => {
    if (!parseResult) return null;

    const computed = calculateProgressionSummary(
      parseResult.records,
      params,
      selectedCompetencias
    );

    computed.server = parseResult.server;

    // Filter out user-deleted rows
    if (deletedRowCodes.length > 0) {
      computed.rows = computed.rows.filter(r => !deletedRowCodes.includes(r.codigo));
    }

    // Apply manual row overrides if any
    if (Object.keys(rowOverrides).length > 0) {
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

    // Recalculate totals
    computed.totalLetra1Mensal = roundMoney(computed.rows.reduce((sum, r) => sum + r.letra1Valor, 0));
    computed.totalLetra2Mensal = roundMoney(computed.rows.reduce((sum, r) => sum + r.letra2Valor, 0));
    computed.totalDiferencaMensal = roundMoney(computed.totalLetra2Mensal - computed.totalLetra1Mensal);
    computed.totalDiferencaAcumulada = roundMoney(computed.rows.reduce((sum, r) => sum + r.totalDiferenca, 0));
    computed.totalReflexo13 = computed.rows.reduce((sum, r) => sum + r.reflexo13, 0);
    computed.totalReflexoFerias = computed.rows.reduce((sum, r) => sum + r.reflexoFerias, 0);
    computed.grandTotal = computed.totalDiferencaAcumulada + computed.totalReflexo13 + computed.totalReflexoFerias;

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

  const handleExportPdf = () => {
    if (!summary) return;
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      exportProgressionPdfReport(summary);
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b131e] text-slate-100 flex flex-col selection:bg-[#008d50] selection:text-white">
      
      {/* Top Header */}
      <Header
        onLoadMockData={handleLoadMock}
        onReset={handleReset}
        hasData={!!parseResult}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
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
                Carregue a Ficha Financeira em PDF do servidor para apurar automaticamente as diferenças salariais acumuladas entre a Letra Atual (Letra 1) e a Letra com Progressão (Letra 2), incluindo o Quadro de Consolidação e Parcelamento.
              </p>
            </div>

            {/* Drag & Drop PDF Uploader */}
            <FileUploader onDataParsed={handleDataParsed} />

            {/* Quick Feature Badges with the 4 Brand Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-xs">
              
              {/* Badge 1: #324f72 (Navy Blue) */}
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

              {/* Badge 2: #008d50 (Green) */}
              <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#008d50] flex items-start space-x-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#008d50]/20 text-[#008d50] flex items-center justify-center shrink-0 border border-[#008d50]/40">
                  <FileCheck className="w-5 h-5 text-[#008d50]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Filtro de Meses com Dados</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-normal font-medium">
                    Extração inteligente apenas dos meses com lançamentos válidos na tabela Centi (ex: Jan a Ago).
                  </p>
                </div>
              </div>

              {/* Badge 3: #f88543 & #ead04d (Orange / Yellow) */}
              <div className="solid-card p-4 rounded-2xl border-l-4 border-l-[#f88543] flex items-start space-x-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#f88543]/20 text-[#f88543] flex items-center justify-center shrink-0 border border-[#f88543]/40">
                  <Download className="w-5 h-5 text-[#f88543]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white">Consolidação & Parcelamento</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-normal font-medium">
                    Quadros de consolidação integral, proporcional e parcelamento gerados com exportação em PDF.
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Active State: Dashboard & Calculation Analysis */
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Toolbar Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-[#324f72]/40">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-3 w-3 rounded-full bg-[#008d50] animate-pulse" />
                <h2 className="text-lg font-black text-white">Painel de Apuração e Apresentação</h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-[#008d50] hover:bg-[#00663a] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Relatório PDF Oficial
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
              onResetParams={() => {
                setParams({
                  percentualProgressao: 6.12,
                  percentualATS: 15,
                  percentualTitulacao: 20,
                  percentualRiscoInsalubridade: 20,
                  divisorJornada: 200,
                  mesInicial: parseResult.competencias[0] || '01/2026',
                  mesFinal: parseResult.competencias[parseResult.competencias.length - 1] || '08/2026',
                  diasRetroativos: 30,
                  aplicarReflexo13: true,
                  aplicarReflexoFerias: true,
                });
                setSelectedCompetencias(parseResult.competencias);
                setRowOverrides({});
                setDeletedRowCodes([]);
              }}
            />

            {/* Executive KPI Summary Cards */}
            {summary && <SummaryMetricsCards summary={summary} />}

            {/* Interactive Progression Breakdown Table */}
            {summary && (
              <ProgressionTable
                summary={summary}
                onRowUpdate={handleRowUpdate}
                onDeleteRow={handleDeleteRow}
                deletedCount={deletedRowCodes.length}
                onRestoreRows={handleRestoreRows}
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

      </main>

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
