import React, { useState, useEffect, useMemo } from 'react';
import type { UnifiedVerbaGroup } from '../../../core/types';
import { Merge, Trash2, X, Filter, CheckCircle2, Search, Sparkles } from 'lucide-react';

export interface VerbaItem {
  codigo: string;
  descricao: string;
  defaultIgnored?: boolean;
  categoria?: 'CARREIRA' | 'FG_COMISSAO' | 'ABONO_PERMANENCIA' | 'DESCONTO' | 'OUTROS';
  tipo?: 'PROVENTO' | 'DESCONTO';
}

interface VerbaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAvailableVerbas: VerbaItem[];
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'TODAS' | 'RECOMENDADAS' | 'OPCIONAIS'>('TODAS');

  // Synchronize internal state whenever the modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedCodes);
      setTempUnified(unifiedGroups);
      setSearchTerm('');
      setCategoryFilter('TODAS');
    }
  }, [isOpen, selectedCodes, unifiedGroups]);

  const handleToggleCode = (code: string) => {
    setTempSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setTempSelected(allAvailableVerbas.map(v => v.codigo));
  };

  const handleSelectRecommended = () => {
    const recommended = allAvailableVerbas
      .filter(v => !v.defaultIgnored)
      .map(v => v.codigo);
    // If no recommended, at least keep base 50 if present
    if (recommended.length === 0 && allAvailableVerbas.some(v => v.codigo === '50')) {
      setTempSelected(['50']);
    } else {
      setTempSelected(recommended);
    }
  };

  const handleDeselectAll = () => {
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

  // Filter verbas by search term and tab category
  const filteredVerbas = useMemo(() => {
    return allAvailableVerbas.filter(v => {
      const matchesSearch =
        !searchTerm.trim() ||
        v.codigo.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        v.descricao.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (categoryFilter === 'RECOMENDADAS') {
        return !v.defaultIgnored;
      }
      if (categoryFilter === 'OPCIONAIS') {
        return !!v.defaultIgnored;
      }
      return true;
    });
  }, [allAvailableVerbas, searchTerm, categoryFilter]);

  if (!isOpen) return null;

  const countRecommended = allAvailableVerbas.filter(v => !v.defaultIgnored).length;
  const countOptionals = allAvailableVerbas.filter(v => !!v.defaultIgnored).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#0f1a27] border border-[#324f72] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#132030] border-b border-[#324f72]/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#008d50]/20 border border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white">Eventos & Rubricas da Ficha Financeira</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#008d50]/20 text-[#008d50] border border-[#008d50]/40">
                  {allAvailableVerbas.length} detectados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione os eventos que serão utilizados no cálculo retroativo. Itens opcionais (FG, Abono, etc.) podem ser ativados livremente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1b2a3f] transition-all cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Quick Selection Toolbar & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#17263a]/80 border border-[#324f72]/50">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center font-black text-white text-xs">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#008d50]" />
                {tempSelected.length} de {allAvailableVerbas.length} rubricas ativas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectRecommended}
                className="px-2.5 py-1.5 rounded-lg bg-[#008d50]/20 hover:bg-[#008d50]/30 text-[#008d50] font-bold border border-[#008d50]/40 transition-all cursor-pointer flex items-center space-x-1"
                title="Marcar apenas eventos padrão de carreira recomendados"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#008d50]" />
                Padrão Recomendado ({countRecommended})
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-lg bg-[#132030] hover:bg-[#1f3148] text-slate-200 font-bold border border-[#324f72] transition-all cursor-pointer"
              >
                Marcar Todas
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 rounded-lg bg-[#132030] hover:bg-[#1f3148] text-slate-400 hover:text-slate-200 font-bold border border-[#324f72] transition-all cursor-pointer"
              >
                Apenas Base
              </button>

              <button
                type="button"
                onClick={() => setShowUnifySection(!showUnifySection)}
                className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${showUnifySection
                    ? 'bg-[#f88543] text-slate-950 border-[#f88543]'
                    : 'bg-[#f88543]/20 hover:bg-[#f88543]/30 text-[#f88543] border-[#f88543]/40'
                  }`}
              >
                <Merge className="w-3.5 h-3.5 mr-1" />
                {showUnifySection ? 'Fechar Unificação' : 'Unificar Verbas'}
              </button>
            </div>
          </div>

          {/* Search Input & Category Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por código ou descrição do evento (ex: 50, 1158, FG, Base)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0b131e] border border-[#324f72]/70 rounded-xl text-white font-medium text-xs focus:outline-none focus:border-[#008d50] placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center p-1 rounded-xl bg-[#0b131e] border border-[#324f72]/50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCategoryFilter('TODAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryFilter === 'TODAS'
                    ? 'bg-[#324f72] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({allAvailableVerbas.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('RECOMENDADAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryFilter === 'RECOMENDADAS'
                    ? 'bg-[#008d50] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recomendadas ({countRecommended})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('OPCIONAIS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryFilter === 'OPCIONAIS'
                    ? 'bg-[#f88543] text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Opcionais / FG / Abono ({countOptionals})
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
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-300 text-xs">
                Lista de Eventos Encontrados na(s) Ficha(s):
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Mostrando {filteredVerbas.length} de {allAvailableVerbas.length}
              </span>
            </div>

            {filteredVerbas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0b131e]/50 border border-[#324f72]/30 text-slate-400 text-xs">
                Nenhuma rubrica encontrada para os filtros aplicados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredVerbas.map(verba => {
                  const isChecked = tempSelected.includes(verba.codigo);
                  const isBase = verba.codigo === '50' || verba.descricao.toUpperCase().includes('BASE');
                  const isFG = verba.categoria === 'FG_COMISSAO';
                  const isAbono = verba.categoria === 'ABONO_PERMANENCIA';
                  const isDesconto = verba.categoria === 'DESCONTO';

                  let badgeColor = 'bg-[#008d50]/20 text-[#008d50] border-[#008d50]/40';
                  let badgeText = 'Padrão Carreira';

                  if (isBase) {
                    badgeColor = 'bg-[#008d50]/30 text-[#008d50] border-[#008d50]/60 font-black';
                    badgeText = 'Base Salarial';
                  } else if (isFG) {
                    badgeColor = 'bg-[#f88543]/20 text-[#f88543] border-[#f88543]/40';
                    badgeText = 'FG / Comissão';
                  } else if (isAbono) {
                    badgeColor = 'bg-[#3b82f6]/20 text-[#60a5fa] border-[#3b82f6]/40';
                    badgeText = 'Abono Permanência';
                  } else if (isDesconto) {
                    badgeColor = 'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/40';
                    badgeText = 'Dedução / Desconto';
                  } else if (verba.defaultIgnored) {
                    badgeColor = 'bg-slate-700/40 text-slate-300 border-slate-600';
                    badgeText = 'Opcional';
                  }

                  return (
                    <label
                      key={verba.codigo}
                      className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#152335] border-[#008d50]/60 shadow-xs'
                          : 'bg-[#0b131e]/50 border-[#324f72]/30 text-slate-400 opacity-65 hover:opacity-100 hover:border-[#324f72]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCode(verba.codigo)}
                        className="mt-1 accent-[#008d50] w-4 h-4 rounded cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#0b131e] text-slate-200 font-mono text-[10px] border border-[#324f72]/60 font-black">
                            {verba.codigo}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className={`font-bold truncate text-xs mt-1.5 ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                          {verba.descricao}
                        </div>

                        {verba.defaultIgnored && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Ignorado por regra padrão — marque para incluir no cálculo.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#132030] border-t border-[#324f72]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Total selecionado: <strong className="text-white font-bold">{tempSelected.length}</strong> de {allAvailableVerbas.length} rubricas
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
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
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Seleção & Calcular ({tempSelected.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
