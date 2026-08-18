import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './core/components/Header';
import { FileUploader } from './features/report-parser/components/FileUploader';
import { ServerHeaderCard } from './features/report-parser/components/ServerHeaderCard';
import { ParameterControls } from './features/calculation/components/ParameterControls';
import { SummaryMetricsCards } from './features/calculation/components/SummaryMetricsCards';
import { ProgressionTable } from './features/summary-view/components/ProgressionTable';
import { calculateProgressionSummary } from './features/calculation/domain/calculateProgression';
import { exportProgressionPdfReport } from './features/pdf-exporter/exportProgressionPdf';
import { getMockCentiRioVerdeData } from './features/report-parser/mockData';
import type { ParseResult, ProgressionParams, CalculatedEventRow } from './core/types';
import { Download, Sparkles, FileCheck, ShieldCheck } from 'lucide-react';

export function App() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Calculation parameters default state
  const [params, setParams] = useState<ProgressionParams>({
    percentualProgressao: 6.12,
    percentualATS: 15,
    percentualTitulacao: 20,
    percentualRiscoInsalubridade: 20,
    divisorJornada: 200,
    mesInicial: '01/2024',
    mesFinal: '12/2024',
    aplicarReflexo13: true,
    aplicarReflexoFerias: true,
  });

  const [selectedCompetencias, setSelectedCompetencias] = useState<string[]>([]);
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<CalculatedEventRow>>>({});

  // Handler when PDF or Mock is loaded
  const handleDataParsed = (result: ParseResult) => {
    setParseResult(result);
    setRowOverrides({});
    
    if (result.competencias.length > 0) {
      const initComp = result.competencias[0];
      const endComp = result.competencias[result.competencias.length - 1];
      setParams(prev => ({
        ...prev,
        mesInicial: initComp,
        mesFinal: endComp
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

    // Apply manual row overrides if any
    if (Object.keys(rowOverrides).length > 0) {
      computed.rows = computed.rows.map(row => {
        const override = rowOverrides[row.codigo];
        if (override) {
          const newL1 = override.letra1Valor ?? row.letra1Valor;
          const newL2 = override.letra2Valor ?? row.letra2Valor;
          const diff = newL2 - newL1;
          const totalDiff = diff * row.qtdMeses;
          return {
            ...row,
            letra1Valor: newL1,
            letra2Valor: newL2,
            diferencaUnitaria: diff,
            totalDiferenca: totalDiff,
            reflexo13: params.aplicarReflexo13 ? totalDiff * (1 / 12) : 0,
            reflexoFerias: params.aplicarReflexoFerias ? totalDiff * (1 / 3) * (1 / 12) : 0,
            manualOverride: true
          };
        }
        return row;
      });

      // Recalculate totals
      computed.totalLetra1Mensal = computed.rows.reduce((sum, r) => sum + r.letra1Valor, 0);
      computed.totalLetra2Mensal = computed.rows.reduce((sum, r) => sum + r.letra2Valor, 0);
      computed.totalDiferencaMensal = computed.totalLetra2Mensal - computed.totalLetra1Mensal;
      computed.totalDiferencaAcumulada = computed.totalDiferencaMensal * computed.competenciasSelecionadas.length;
      computed.totalReflexo13 = computed.rows.reduce((sum, r) => sum + r.reflexo13, 0);
      computed.totalReflexoFerias = computed.rows.reduce((sum, r) => sum + r.reflexoFerias, 0);
      computed.grandTotal = computed.totalDiferencaAcumulada + computed.totalReflexo13 + computed.totalReflexoFerias;
    }

    return computed;
  }, [parseResult, params, selectedCompetencias, rowOverrides]);

  const handleRowUpdate = (updatedRow: CalculatedEventRow) => {
    setRowOverrides(prev => ({
      ...prev,
      [updatedRow.codigo]: {
        letra1Valor: updatedRow.letra1Valor,
        letra2Valor: updatedRow.letra2Valor
      }
    }));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      
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
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sistema Centi / Município de Rio Verde — Goiás</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Apuração e Cálculo de Diferenças Salariais por Progressão Funcional
              </h2>
              
              <p className="text-sm text-slate-400 leading-relaxed">
                Carregue a Ficha Financeira em PDF do servidor para apurar automaticamente as diferenças salariais acumuladas entre a Letra Atual (Letra 1) e a Letra com Progressão (Letra 2), incluindo reflexos em 13º Salário e Férias.
              </p>
            </div>

            {/* Drag & Drop PDF Uploader */}
            <FileUploader onDataParsed={handleDataParsed} />

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-xs">
              <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">100% Client-Side & Seguro</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Seus dados e relatórios em PDF são processados em memória no seu navegador, sem envio para servidores externos.</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Parser Nativo Centi / Rio Verde</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Extração precisa de Salário Base (Verba 50), ATS (149), Titulação (104), Insalubridade e Horas Extras.</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Exportação PDF Oficial</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Gere com 1-clique o Laudo de Cálculo diagramado com cabeçalho oficial do Município e espaço para assinaturas.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Active State: Dashboard & Calculation Analysis */
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Toolbar Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-100">Painel de Apuração e Apresentação</h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
                  mesInicial: parseResult.competencias[0] || '01/2024',
                  mesFinal: parseResult.competencias[parseResult.competencias.length - 1] || '12/2024',
                  aplicarReflexo13: true,
                  aplicarReflexoFerias: true,
                });
                setRowOverrides({});
              }}
            />

            {/* Executive KPI Summary Cards */}
            {summary && <SummaryMetricsCards summary={summary} />}

            {/* Interactive Progression Breakdown Table */}
            {summary && (
              <ProgressionTable
                summary={summary}
                onRowUpdate={handleRowUpdate}
              />
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">Sistema de Conferência e Cálculo de Diferenças Salariais por Progressão de Servidores Públicos</p>
          <p className="text-[11px] text-slate-500">Desenvolvido em React + TypeScript + Clean Architecture • Processamento 100% Stateless no Navegador</p>
        </div>
      </footer>

    </div>
  );
}

export default App;
