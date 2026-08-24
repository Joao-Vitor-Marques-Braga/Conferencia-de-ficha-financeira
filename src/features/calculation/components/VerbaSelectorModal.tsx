import React, { useState } from 'react';
import type { UnifiedVerbaGroup } from '../../../core/types';
import { Merge, Trash2, X, RefreshCw, Filter } from 'lucide-react';

interface VerbaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAvailableVerbas: Array<{ codigo: string; descricao: string }>;
  selectedCodes: string[];
  unifiedGroups: UnifiedVerbaGroup[];
  onApplySelection: (selectedCodes: string[], unifiedGroups: UnifiedVerbaGroup[]) => void;
}

export const VerbaSelectorModal: React.FC<VerbaSelectorModalProps> = ({
  isOpen,
  onClose,
  allAvailableVerbas,
  selectedCodes,
  unifiedGroups,
  onApplySelection
}) => {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCodes);
  const [tempUnified, setTempUnified] = useState<UnifiedVerbaGroup[]>(unifiedGroups);
  const [unifyCodes, setUnifyCodes] = useState<string[]>([]);
  const [unifiedName, setUnifiedName] = useState<string>('');
  const [showUnifySection, setShowUnifySection] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleCode = (code: string) => {
    setTempSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setTempSelected(allAvailableVerbas.map(v => v.codigo));
  };

  const handleDeselectAll = () => {
    // Keep at least base 50 if present
    const hasBase = allAvailableVerbas.some(v => v.codigo === '50');
    setTempSelected(hasBase ? ['50'] : []);
  };

  const handleToggleForUnify = (code: string) => {
    setUnifyCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCreateUnifiedGroup = () => {
    if (unifyCodes.length < 2) {
      alert('Selecione pelo menos 2 verbas para unificar.');
      return;
    }
    if (!unifiedName.trim()) {
      alert('Informe um nome para a verba unificada.');
      return;
    }

    const newGroup: UnifiedVerbaGroup = {
      id: `UNIF_${Date.now().toString().slice(-4)}`,
      nomeUnificado: unifiedName.trim().toUpperCase(),
      codigosOriginais: [...unifyCodes]
    };

    setTempUnified(prev => [...prev, newGroup]);
    setUnifyCodes([]);
    setUnifiedName('');
    setShowUnifySection(false);
  };

  const handleRemoveUnifiedGroup = (id: string) => {
    setTempUnified(prev => prev.filter(g => g.id !== id));
  };

  const handleApply = () => {
    onApplySelection(tempSelected, tempUnified);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#0f1a27] border border-[#324f72] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#132030] border-b border-[#324f72]/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#008d50]/20 border border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Seleção & Unificação de Verbas</h3>
              <p className="text-xs text-slate-400">Escolha quais rubricas da ficha comporão a apuração da progressão</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1b2a3f] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* Quick Selection Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#1b2a3f]/60 border border-[#324f72]/40">
            <span className="font-bold text-slate-300">
              {tempSelected.length} de {allAvailableVerbas.length} verbas ativas
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-[#008d50]/20 hover:bg-[#008d50]/30 text-[#008d50] font-bold border border-[#008d50]/40 cursor-pointer"
              >
                Selecionar Todas
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 rounded-lg bg-[#132030] hover:bg-[#1b2a3f] text-slate-300 font-bold border border-[#324f72] cursor-pointer"
              >
                Apenas Base
              </button>
              <button
                type="button"
                onClick={() => setShowUnifySection(!showUnifySection)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${showUnifySection
                    ? 'bg-[#f88543] text-slate-950 border-[#f88543]'
                    : 'bg-[#f88543]/20 hover:bg-[#f88543]/30 text-[#f88543] border-[#f88543]/40'
                  }`}
              >
                <Merge className="w-3.5 h-3.5 mr-1" />
                {showUnifySection ? 'Fechar Unificação' : 'Unificar Verbas'}
              </button>
            </div>
          </div>

          {/* Section: Unify Verbas Creator */}
          {showUnifySection && (
            <div className="p-4 rounded-2xl bg-[#17263a] border border-[#f88543]/40 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-[#f88543] font-bold">
                <Merge className="w-4 h-4" />
                <span>Criar Linha Consolidada Unificada</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Marque abaixo as verbas que deseja agrupar em uma única linha no demonstrativo (ex: juntar horas extras de diferentes percentuais em uma só linha consolidada):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-[#0b131e] rounded-xl border border-[#324f72]/40">
                {allAvailableVerbas.map(v => (
                  <label
                    key={`unify-${v.codigo}`}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-[#1b2a3f] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={unifyCodes.includes(v.codigo)}
                      onChange={() => handleToggleForUnify(v.codigo)}
                      className="accent-[#f88543] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-400">{v.codigo}</span>
                    <span className="truncate text-slate-200">{v.descricao}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Nome consolidado (ex: HORAS EXTRAS UNIFICADAS)"
                  value={unifiedName}
                  onChange={(e) => setUnifiedName(e.target.value)}
                  className="flex-1 bg-[#0b131e] border border-[#324f72] rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-[#f88543]"
                />
                <button
                  type="button"
                  onClick={handleCreateUnifiedGroup}
                  disabled={unifyCodes.length < 2 || !unifiedName.trim()}
                  className="px-4 py-2 bg-[#f88543] hover:bg-[#df6824] disabled:opacity-50 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Unificar ({unifyCodes.length})
                </button>
              </div>
            </div>
          )}

          {/* Active Unified Groups list */}
          {tempUnified.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 text-xs">Grupos Unificados Ativos:</h4>
              <div className="space-y-1.5">
                {tempUnified.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1b2a3f] border border-[#324f72] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-[#f88543]/20 text-[#f88543] font-mono font-bold text-[10px]">
                        UNIFICADO
                      </span>
                      <strong className="text-white font-bold">{group.nomeUnificado}</strong>
                      <span className="text-slate-400 text-[11px]">
                        (Cód: {group.codigosOriginais.join(', ')})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveUnifiedGroup(group.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remover unificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verbas Checkbox List */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-300 text-xs">Rubricas Identificadas na Ficha Centi:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allAvailableVerbas.map(verba => {
                const isChecked = tempSelected.includes(verba.codigo);
                const isBase = verba.codigo === '50' || verba.descricao.toUpperCase().includes('BASE');

                return (
                  <label
                    key={verba.codigo}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isChecked
                        ? 'bg-[#17263a] border-[#008d50]/50 text-white'
                        : 'bg-[#0b131e]/60 border-[#324f72]/30 text-slate-400 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCode(verba.codigo)}
                      className="mt-0.5 accent-[#008d50] w-4 h-4 rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#0b131e] text-slate-300 font-mono text-[10px] border border-[#324f72]/60 font-black">
                          {verba.codigo}
                        </span>
                        <span className={`font-bold truncate text-xs ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                          {verba.descricao}
                        </span>
                      </div>
                      {isBase && (
                        <span className="inline-block mt-1 text-[9px] font-black text-[#008d50] uppercase tracking-wider">
                          • Base Salarial
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#132030] border-t border-[#324f72]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#1b2a3f] hover:bg-[#22354f] rounded-xl border border-[#324f72] cursor-pointer transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center px-5 py-2.5 text-xs font-black text-white bg-[#008d50] hover:bg-[#00663a] rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Recalcular com Selecionadas ({tempSelected.length})
          </button>
        </div>

      </div>
    </div>
  );
};
