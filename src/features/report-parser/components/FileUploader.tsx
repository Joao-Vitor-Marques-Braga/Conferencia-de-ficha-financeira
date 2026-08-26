import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Files } from 'lucide-react';
import { parsePdfFichaFinanceira, mergePdfParseResults } from '../pdfParser';
import { parseMultiYearPdfFichaFinanceira } from '../../multi-year-retroactive';
import type { ParseResult } from '../../../core/types';

interface FileUploaderProps {
  onDataParsed: (result: ParseResult, overlapNotice?: string | null) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDataParsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      setErrorMsg('Por favor, selecione arquivos em formato PDF da Ficha Financeira.');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg(null);
      setFileNames(pdfFiles.map(f => f.name));

      const isMultiFile = pdfFiles.length > 1;
      const parsedResults: ParseResult[] = [];

      for (const file of pdfFiles) {
        const res = isMultiFile
          ? await parseMultiYearPdfFichaFinanceira(file)
          : await parsePdfFichaFinanceira(file);
        parsedResults.push(res);
      }

      const { merged, overlaps } = mergePdfParseResults(parsedResults);

      let overlapMsg: string | null = null;
      if (overlaps.length > 0) {
        overlapMsg = `Sobreposição detectada nas competências: ${overlaps.join(', ')}. Os dados foram mesclados sem duplicações.`;
      }

      onDataParsed(merged, overlapMsg);
    } catch (err: any) {
      console.error('Erro ao ler PDFs:', err);
      setErrorMsg('Não foi possível processar os arquivos PDF. Verifique se os arquivos são Fichas Financeiras válidas do Sistema Centi.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
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
          onChange={(e) => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
          accept=".pdf"
          multiple
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
              {parsing ? 'Processando Fichas Financeiras...' : 'Arraste & Solte uma ou mais Fichas em PDF'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Suporta múltiplos arquivos para apurações multi-ano (ex: 2025 e 2026). Layout padrão do <strong className="text-[#ead04d]">Sistema Centi</strong>.
            </p>
          </div>

          {!parsing && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-black bg-[#008d50] hover:bg-[#00663a] text-white shadow-xs transition-all cursor-pointer">
                <Files className="w-4 h-4 mr-2" /> Selecionar PDF(s) do Computador
              </span>
            </div>
          )}

          {fileNames.length > 0 && !errorMsg && (
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 bg-[#008d50]/15 border border-[#008d50]/40 rounded-2xl text-xs font-bold text-[#008d50]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>{fileNames.length === 1 ? `Arquivo: ${fileNames[0]}` : `${fileNames.length} arquivos carregados: ${fileNames.join(', ')}`}</span>
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
