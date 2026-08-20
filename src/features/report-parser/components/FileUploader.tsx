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
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragOver
            ? 'border-[#008d50] bg-[#008d50]/15 scale-[1.01]'
            : 'border-[#324f72] bg-[#132030] hover:border-[#008d50] hover:bg-[#18283d] shadow-sm'
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
          <div className="w-16 h-16 rounded-2xl bg-[#008d50]/20 border border-[#008d50]/30 flex items-center justify-center text-[#008d50]">
            {parsing ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#008d50]" />
            ) : (
              <UploadCloud className="w-8 h-8 text-[#008d50]" />
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">
              {parsing ? 'Processando Ficha Financeira...' : 'Arraste & Solte a Ficha Financeira em PDF'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Compatível com o layout padrão do <strong className="text-[#ead04d]">Sistema Centi</strong> da Prefeitura Municipal de Rio Verde — GO.
            </p>
          </div>

          {!parsing && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#1b2a3f] text-slate-200 border border-[#324f72] hover:border-slate-400 transition-colors">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-[#008d50]" /> Selecionar PDF do Computador
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMockClick();
                }}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#f88543] hover:bg-[#df6824] text-slate-950 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-slate-950 fill-current" />
                Ou Carregar Exemplo Demonstrativo
              </button>
            </div>
          )}

          {fileName && !errorMsg && (
            <div className="inline-flex items-center px-3 py-1 bg-[#008d50]/15 border border-[#008d50]/40 rounded-full text-xs font-bold text-[#008d50]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Arquivo: {fileName}
            </div>
          )}

          {errorMsg && (
            <div className="inline-flex items-center px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs font-semibold text-red-400">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
