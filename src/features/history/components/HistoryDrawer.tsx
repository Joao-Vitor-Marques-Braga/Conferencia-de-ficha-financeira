import React, { useState, useEffect } from 'react';
import type { SavedCalculation } from '../../../core/types';
import { storageService } from '../../../core/services/storageService';
import { useAuth } from '../../../core/context/AuthContext';
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
  FileSpreadsheet,
  Cloud,
  CloudUpload,
  Loader2,
  HardDrive
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
  const { user, isConfigured } = useAuth();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFERIDO' | 'PENDENTE'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const refreshList = () => {
    setCalculations(storageService.getSavedCalculations());
  };

  useEffect(() => {
    if (!isOpen) return;

    // Initial load from cache/storage
    refreshList();

    // If user is authenticated, listen to real-time updates from Cloud Firestore
    if (user && isConfigured) {
      const unsubscribe = storageService.listenToCloudCalculations(user.uid, (cloudItems) => {
        setCalculations(cloudItems);
      });
      return () => unsubscribe();
    } else {
      // Subscribe to local storage changes
      const unsubscribe = storageService.subscribe(() => {
        refreshList();
      });
      return () => unsubscribe();
    }
  }, [isOpen, user, isConfigured]);

  if (!isOpen) return null;

  const handleSyncToCloud = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      const res = await storageService.syncLocalToCloud(user.uid);
      setSyncSuccess(`${res.synced} apuração(ões) sincronizada(s) com a nuvem!`);
      setTimeout(() => setSyncSuccess(null), 4000);
      refreshList();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleConferido = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await storageService.toggleConferidoStatus(id);
    refreshList();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta apuração do histórico?')) {
      await storageService.deleteCalculation(id);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f1a27] border-l border-slate-200 dark:border-[#324f72] h-full flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#132030] border-b border-slate-200 dark:border-[#324f72]/60 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#008d50]/20 border border-emerald-300 dark:border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white transition-colors">Histórico de Apurações</h3>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Cloud className="w-3 h-3" />
                    Nuvem Firebase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <HardDrive className="w-3 h-3" />
                    Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                {user 
                  ? `Sincronizado na conta de ${user.displayName || user.email}`
                  : 'Armazenamento local seguro no seu navegador'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && calculations.length > 0 && (
              <button
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                title="Sincronizar apurações com o Cloud Firestore"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                <span>Sincronizar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1b2a3f] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {syncSuccess && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncSuccess}</span>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="p-4 bg-slate-50/70 dark:bg-[#132030]/60 border-b border-slate-200 dark:border-[#324f72]/40 space-y-3 transition-colors">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por servidor, matrícula, cargo ou portaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#008d50] transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#1e3a5f] dark:bg-[#324f72] text-white border-[#1e3a5f] dark:border-[#324f72]'
                    : 'bg-white dark:bg-[#0b131e] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[#324f72]/40 hover:bg-slate-100'
                }`}
              >
                Todos ({calculations.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONFERIDO')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'CONFERIDO'
                    ? 'bg-[#008d50] text-white border-[#008d50]'
                    : 'bg-white dark:bg-[#0b131e] text-emerald-700 dark:text-[#008d50] border-emerald-300 dark:border-[#008d50]/40 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Conferidos ({calculations.filter(c => c.conferido).length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDENTE')}
                className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'PENDENTE'
                    ? 'bg-[#ea580c] dark:bg-[#f88543] text-white dark:text-slate-950 border-[#ea580c] dark:border-[#f88543]'
                    : 'bg-white dark:bg-[#0b131e] text-orange-700 dark:text-[#f88543] border-orange-300 dark:border-[#f88543]/40 hover:bg-orange-50'
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
              <History className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhum cálculo salvo encontrado</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ao realizar apurações no painel, use o botão Salvar ou o atalho <strong className="text-slate-700 dark:text-slate-300">Ctrl + S</strong> para armazenar o cálculo aqui.
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
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#324f72]/60 hover:border-[#008d50] dark:hover:border-[#008d50]/60 transition-all cursor-pointer group bg-slate-50/70 dark:bg-[#111e2e] shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <strong className="text-slate-900 dark:text-white font-extrabold text-sm group-hover:text-[#008d50] transition-colors">
                        {item.nomeServidor}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-[#1b2a3f] text-amber-800 dark:text-[#ead04d] font-mono font-bold text-[10px] border border-slate-200 dark:border-[#324f72]/60">
                        {item.matricula}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.cargo} • {item.orgao}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                      <span>Período: <strong>{item.periodo}</strong></span>
                      {item.portariaNumero && (
                        <span className="text-amber-800 dark:text-[#ead04d]">Portaria: <strong>{item.portariaNumero}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Grand Total & Status */}
                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Total Apurado</span>
                    <strong className="text-base font-black text-emerald-700 dark:text-[#008d50] block font-mono">
                      {formatCurrency(item.grandTotal)}
                    </strong>

                    <button
                      type="button"
                      onClick={(e) => handleToggleConferido(item.id, e)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                        item.conferido
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-[#008d50]/20 dark:text-[#008d50] dark:border-[#008d50]/40'
                          : 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100 dark:bg-[#f88543]/20 dark:text-[#f88543] dark:border-[#f88543]/40'
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
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-[#324f72]/40 text-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Salvo em: {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => handleExportPdf(item, e)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#1b2a3f] dark:hover:bg-[#233752] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                      title="Baixar PDF Oficial"
                    >
                      <Download className="w-3.5 h-3.5 text-[#008d50]" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExportExcel(item, e)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#1b2a3f] dark:hover:bg-[#233752] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                      title="Baixar Planilha Excel/CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-[#ead04d]" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 dark:border-transparent dark:bg-[#1b2a3f] dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer shadow-2xs"
                      title="Excluir apuração"
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
