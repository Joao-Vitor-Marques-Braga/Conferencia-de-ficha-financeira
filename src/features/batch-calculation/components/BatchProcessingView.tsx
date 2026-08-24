import React, { useState } from 'react';
import type { ParseResult, ProgressionSummary, ProgressionParams } from '../../../core/types';
import { parsePdfFichaFinanceira } from '../../report-parser/pdfParser';
import { calculateProgressionSummary } from '../../calculation/domain/calculateProgression';
import { exportProgressionPdfReport } from '../../pdf-exporter/exportProgressionPdf';
import { formatCurrency } from '../../../core/utils/formatters';
import {
  Users,
  UploadCloud,
  FileCheck,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface BatchItem {
  id: string;
  file: File;
  parseResult?: ParseResult;
  summary?: ProgressionSummary;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  errorMessage?: string;
}

interface BatchProcessingViewProps {
  onLoadSingleServer: (result: ParseResult) => void;
}

export const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
  onLoadSingleServer
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalParams] = useState<ProgressionParams>({
    percentualProgressao: 6.12,
    percentualATS: 15,
    percentualTitulacao: 20,
    percentualRiscoInsalubridade: 20,
    divisorJornada: 200,
    mesInicial: '01/2026',
    mesFinal: '08/2026',
    modoRateio: 'DIAS_MANUAIS',
    diasRetroativos: 30,
    diasFerias: 15,
    aplicarReflexo13: false,
    aplicarReflexoFerias: false
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: BatchItem[] = Array.from(files).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'PENDING'
    }));

    setItems(prev => [...prev, ...newItems]);
  };

  const handleProcessBatch = async () => {
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'DONE') continue;

      setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'PROCESSING' } : it));

      try {
        const parsed = await parsePdfFichaFinanceira(item.file);
        const selComps = parsed.competencias;
        const initComp = selComps[0] || '01/2026';
        const endComp = selComps[selComps.length - 1] || '08/2026';

        const params: ProgressionParams = {
          ...globalParams,
          mesInicial: initComp,
          mesFinal: endComp
        };

        const summary = calculateProgressionSummary(parsed.records, params, selComps);
        summary.server = parsed.server;

        setItems(prev => prev.map((it, idx) => idx === i ? {
          ...it,
          status: 'DONE',
          parseResult: parsed,
          summary
        } : it));
      } catch (err: any) {
        console.error(`Erro ao processar ${item.file.name}:`, err);
        setItems(prev => prev.map((it, idx) => idx === i ? {
          ...it,
          status: 'ERROR',
          errorMessage: err?.message || 'Falha ao processar PDF'
        } : it));
      }
    }

    setIsProcessing(false);
  };

  const handleExportConsolidatedBatchExcel = () => {
    const doneItems = items.filter(i => i.summary);
    if (doneItems.length === 0) {
      alert('Nenhum servidor processado com sucesso para exportar.');
      return;
    }

    const rows: string[][] = [
      ['PREFEITURA MUNICIPAL DE RIO VERDE - GOIÁS'],
      ['RELATÓRIO CONSOLIDADO DE PROGRESSÃO EM LOTE (FOLHA MUNICIPAL)'],
      [''],
      ['Matrícula', 'Nome do Servidor', 'Cargo', 'Órgão', 'Período Apurado', 'Diferença Principal (R$)', 'Reflexo 13º (R$)', 'Reflexo Férias 1/3 (R$)', 'Total Geral Devido (R$)']
    ];

    let totalGeralFolha = 0;
    let totalDiferencaFolha = 0;
    let total13Folha = 0;
    let totalFeriasFolha = 0;

    doneItems.forEach(it => {
      const s = it.summary!;
      totalGeralFolha += s.grandTotal;
      totalDiferencaFolha += s.totalDiferencaAcumulada;
      total13Folha += s.totalReflexo13;
      totalFeriasFolha += s.totalReflexoFerias;

      rows.push([
        s.server.matricula || 'N/A',
        s.server.nome || 'N/A',
        s.server.cargo || 'N/A',
        s.server.orgao || 'N/A',
        `${s.params.mesInicial} a ${s.params.mesFinal}`,
        s.totalDiferencaAcumulada.toFixed(2).replace('.', ','),
        s.totalReflexo13.toFixed(2).replace('.', ','),
        s.totalReflexoFerias.toFixed(2).replace('.', ','),
        s.grandTotal.toFixed(2).replace('.', ',')
      ]);
    });

    rows.push([
      'TOTAL GERAL',
      `${doneItems.length} SERVIDORES PROCESSADOS`,
      '-',
      '-',
      '-',
      totalDiferencaFolha.toFixed(2).replace('.', ','),
      total13Folha.toFixed(2).replace('.', ','),
      totalFeriasFolha.toFixed(2).replace('.', ','),
      totalGeralFolha.toFixed(2).replace('.', ',')
    ]);

    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Progressao_Lote_Folha_Geral_Rio_Verde.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processedCount = items.filter(i => i.status === 'DONE').length;
  const grandTotalAll = items.reduce((acc, it) => acc + (it.summary?.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Banner */}
      <div className="solid-card rounded-2xl p-6 border-l-4 border-l-[#f88543] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#101c2b]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f88543]/20 border border-[#f88543]/40 flex items-center justify-center text-[#f88543]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Cálculo em Massa & Processamento em Lote</h2>
            <p className="text-xs text-slate-400 font-medium">
              Carregue múltiplos arquivos PDF da Ficha Centi simultaneamente para calcular toda a folha de uma vez
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportConsolidatedBatchExcel}
              disabled={processedCount === 0}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-[#1b2a3f] hover:bg-[#233752] text-[#ead04d] border border-[#324f72] disabled:opacity-40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-[#ead04d]" />
              Exportar Consolidação Geral (Excel)
            </button>
          </div>
        )}
      </div>

      {/* Dropzone for Multi-PDF */}
      <div className="solid-card rounded-3xl p-8 border-2 border-dashed border-[#324f72] hover:border-[#f88543]/60 bg-[#0f1a27]/60 text-center space-y-4 transition-all">
        <UploadCloud className="w-12 h-12 text-[#f88543] mx-auto animate-bounce" />
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white">
            Arraste e solte múltiplos PDFs ou clique para selecionar
          </h3>
          <p className="text-xs text-slate-400">
            Suporta importação simultânea de dezenas de Fichas Financeiras do Sistema Centi
          </p>
        </div>

        <label className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#f88543] hover:bg-[#df6824] text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer active:scale-95">
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <Sparkles className="w-4 h-4 mr-2 text-slate-950 fill-current" />
          Selecionar Arquivos PDF
        </label>
      </div>

      {/* Batch Control Toolbar */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#132030] border border-[#324f72]">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-bold text-slate-200">
              {items.length} {items.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[#008d50] font-black">
              {processedCount} processados
            </span>
            {grandTotalAll > 0 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-[#ead04d] font-mono font-black">
                  Total Lote: {formatCurrency(grandTotalAll)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setItems([])}
              className="px-3 py-1.5 rounded-xl bg-[#1b2a3f] text-slate-400 hover:text-white border border-[#324f72] text-xs font-bold cursor-pointer"
            >
              Limpar Lista
            </button>
            <button
              onClick={handleProcessBatch}
              disabled={isProcessing || processedCount === items.length}
              className="inline-flex items-center px-5 py-2 rounded-xl bg-[#008d50] hover:bg-[#00663a] text-white font-black text-xs shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando ({processedCount}/{items.length})...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Iniciar Apuração do Lote ({items.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      {items.length > 0 && (
        <div className="solid-card rounded-2xl overflow-hidden shadow-xs bg-[#101c2b]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b131e] text-slate-200 border-b border-[#324f72]/40 uppercase font-black text-[10px]">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Arquivo</th>
                  <th className="py-3.5 px-4">Servidor(a)</th>
                  <th className="py-3.5 px-4">Matrícula</th>
                  <th className="py-3.5 px-4">Período</th>
                  <th className="py-3.5 px-4 text-right font-mono text-[#ead04d]">Diferença Acum.</th>
                  <th className="py-3.5 px-4 text-right font-mono text-[#008d50]">Total Devido</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#324f72]/30 text-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1b2a3f]/50">
                    <td className="py-3 px-4">
                      {item.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/40 text-slate-400">
                          Pendente
                        </span>
                      )}
                      {item.status === 'PROCESSING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#ead04d]/20 text-[#ead04d] flex items-center w-fit">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processando
                        </span>
                      )}
                      {item.status === 'DONE' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#008d50]/20 text-[#008d50] flex items-center w-fit">
                          <FileCheck className="w-3 h-3 mr-1" /> Concluído
                        </span>
                      )}
                      {item.status === 'ERROR' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 flex items-center w-fit" title={item.errorMessage}>
                          <AlertCircle className="w-3 h-3 mr-1" /> Erro
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 max-w-[150px] truncate" title={item.file.name}>
                      {item.file.name}
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      {item.summary?.server.nome || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#ead04d]">
                      {item.summary?.server.matricula || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.summary ? `${item.summary.params.mesInicial} a ${item.summary.params.mesFinal}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#ead04d]">
                      {item.summary ? formatCurrency(item.summary.totalDiferencaAcumulada) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-[#008d50]">
                      {item.summary ? formatCurrency(item.summary.grandTotal) : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.summary && item.parseResult && (
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onLoadSingleServer(item.parseResult!)}
                            className="p-1.5 rounded-lg bg-[#1b2a3f] hover:bg-[#008d50]/20 text-slate-300 hover:text-[#008d50] transition-colors cursor-pointer"
                            title="Carregar no Painel Principal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportProgressionPdfReport(item.summary!)}
                            className="p-1.5 rounded-lg bg-[#1b2a3f] hover:bg-[#008d50] text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Exportar PDF Individual"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
