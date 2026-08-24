import React, { useState, useEffect } from 'react';
import type { SavedCalculation } from '../../../core/types';
import { storageService } from '../../../core/services/storageService';
import { formatCurrency } from '../../../core/utils/formatters';
import { exportProgressionPdfReport } from '../../pdf-exporter/exportProgressionPdf';
import { exportConsolidatedSpreadsheet } from '../../spreadsheet-exporter/exportSpreadsheet';
import {
  History,
  X,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCalculation: (saved: SavedCalculation) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onLoadCalculation
}) => {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFERIDO' | 'PENDENTE'>('ALL');

  const refreshList = () => {
    setCalculations(storageService.getSavedCalculations());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleConferido = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleConferidoStatus(id);
    refreshList();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta apuração do histórico local?')) {
      storageService.deleteCalculation(id);
      refreshList();
    }
  };

  const handleExportPdf = (saved: SavedCalculation, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProgressionPdfReport(saved.summary);
  };

  const handleExportExcel = (saved: SavedCalculation, e: React.MouseEvent) => {
    e.stopPropagation();
    exportConsolidatedSpreadsheet(saved.summary);
  };

  const filtered = calculations.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.nomeServidor.toLowerCase().includes(term) ||
      c.matricula.toLowerCase().includes(term) ||
      c.cargo.toLowerCase().includes(term) ||
      (c.portariaNumero && c.portariaNumero.toLowerCase().includes(term));

    if (statusFilter === 'CONFERIDO') return matchesSearch && c.conferido;
    if (statusFilter === 'PENDENTE') return matchesSearch && !c.conferido;
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0f1a27] border-l border-[#324f72] h-full flex flex-col shadow-2xl text-slate-100">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-[#132030] border-b border-[#324f72]/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#008d50]/20 border border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Histórico de Apurações Salvas</h3>
              <p className="text-xs text-slate-400">Armazenamento local seguro no seu navegador (IndexedDB / LocalStorage)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1b2a3f] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="p-4 bg-[#132030]/60 border-b border-[#324f72]/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por servidor, matrícula, cargo ou portaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b131e] border border-[#324f72] rounded-xl pl-10 pr-4 py-2 text-xs text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-[#008d50]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#324f72] text-white border-[#324f72]'
                    : 'bg-[#0b131e] text-slate-400 border-[#324f72]/40'
                }`}
              >
                Todos ({calculations.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONFERIDO')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'CONFERIDO'
                    ? 'bg-[#008d50] text-white border-[#008d50]'
                    : 'bg-[#0b131e] text-[#008d50] border-[#008d50]/40'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Conferidos ({calculations.filter(c => c.conferido).length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDENTE')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'PENDENTE'
                    ? 'bg-[#f88543] text-slate-950 border-[#f88543]'
                    : 'bg-[#0b131e] text-[#f88543] border-[#f88543]/40'
                }`}
              >
                <Clock className="w-3 h-3 mr-1" /> Pendentes ({calculations.filter(c => !c.conferido).length})
              </button>
            </div>
          </div>
        </div>

        {/* Calculations List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-400">Nenhum cálculo salvo encontrado</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ao realizar apurações no painel, use o botão Salvar ou o atalho <strong className="text-slate-300">Ctrl + S</strong> para armazenar o cálculo aqui.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onLoadCalculation(item);
                  onClose();
                }}
                className="solid-card p-4 rounded-2xl border border-[#324f72]/60 hover:border-[#008d50]/60 transition-all cursor-pointer group bg-[#111e2e]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <strong className="text-white font-extrabold text-sm group-hover:text-[#008d50] transition-colors">
                        {item.nomeServidor}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-[#1b2a3f] text-[#ead04d] font-mono font-bold text-[10px] border border-[#324f72]/60">
                        {item.matricula}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5">{item.cargo} • {item.orgao}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-300 font-mono">
                      <span>Período: <strong>{item.periodo}</strong></span>
                      {item.portariaNumero && (
                        <span className="text-[#ead04d]">Portaria: <strong>{item.portariaNumero}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Grand Total & Status */}
                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">Total Apurado</span>
                    <strong className="text-base font-black text-[#008d50] block font-mono">
                      {formatCurrency(item.grandTotal)}
                    </strong>

                    <button
                      type="button"
                      onClick={(e) => handleToggleConferido(item.id, e)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                        item.conferido
                          ? 'bg-[#008d50]/20 text-[#008d50] border-[#008d50]/40 hover:bg-[#008d50]/30'
                          : 'bg-[#f88543]/20 text-[#f88543] border-[#f88543]/40 hover:bg-[#f88543]/30'
                      }`}
                    >
                      {item.conferido ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Conferido
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> Pendente
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#324f72]/40 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Salvo em: {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => handleExportPdf(item, e)}
                      className="p-1.5 rounded-lg bg-[#1b2a3f] hover:bg-[#233752] text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Baixar PDF Oficial"
                    >
                      <Download className="w-3.5 h-3.5 text-[#008d50]" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportExcel(item, e)}
                      className="p-1.5 rounded-lg bg-[#1b2a3f] hover:bg-[#233752] text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Baixar Planilha Excel/CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#ead04d]" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-lg bg-[#1b2a3f] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Excluir do Histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="inline-flex items-center text-[#008d50] font-bold text-[11px] ml-1">
                      Abrir <ExternalLink className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
