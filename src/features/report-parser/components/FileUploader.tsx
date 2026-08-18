import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parsePdfFichaFinanceira } from '../pdfParser';
import { getMockCentiRioVerdeData } from '../mockData';
import type { ParseResult } from '../../../core/types';

interface FileUploaderProps {
  onDataParsed: (result: ParseResult) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDataParsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor, selecione um arquivo em formato PDF.');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg(null);
      setFileName(file.name);
      
      const result = await parsePdfFichaFinanceira(file);
      onDataParsed(result);
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      setErrorMsg('Não foi possível processar o arquivo PDF. Tente carregar os dados de demonstração ou outro arquivo.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleMockClick = () => {
    setParsing(true);
    setErrorMsg(null);
    setFileName('Ficha_Financeira_Centi_Rio_Verde_Demonstrativo.pdf');
    setTimeout(() => {
      const mockResult = getMockCentiRioVerdeData();
      onDataParsed(mockResult);
      setParsing(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept=".pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-500/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
            {parsing ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            ) : (
              <UploadCloud className="w-8 h-8 text-blue-400" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">
              {parsing ? 'Processando Ficha Financeira...' : 'Arraste & Solte a Ficha Financeira (PDF)'}
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Suporta relatórios do sistema <span className="font-semibold text-blue-400">Centi / Município de Rio Verde</span> contendo proventos, adicionais e competências.
            </p>
          </div>

          {!parsing && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Selecionar PDF do Computador
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMockClick();
                }}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-slate-950 fill-current" />
                Ou Usar PDF de Exemplo (1-Clique)
              </button>
            </div>
          )}

          {fileName && !errorMsg && (
            <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Arquivo: {fileName}
            </div>
          )}

          {errorMsg && (
            <div className="inline-flex items-center px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
