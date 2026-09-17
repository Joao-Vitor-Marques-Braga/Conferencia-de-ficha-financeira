import React, { useState, useEffect, useMemo } from 'react';
import type { UnifiedVerbaGroup, FavoriteUnifiedTemplate } from '../../../core/types';
import { storageService } from '../../../core/services/storageService';
import { useAuth } from '../../../core/context/AuthContext';
import { Merge, Trash2, X, Filter, CheckCircle2, Search, Sparkles, Pencil, Star, BookmarkCheck, AlertCircle, Check } from 'lucide-react';

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
  const { user } = useAuth();
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCodes);
  const [tempUnified, setTempUnified] = useState<UnifiedVerbaGroup[]>(unifiedGroups);
  const [unifyCodes, setUnifyCodes] = useState<string[]>([]);
  const [unifiedName, setUnifiedName] = useState<string>('');
  const [showUnifySection, setShowUnifySection] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'TODAS' | 'RECOMENDADAS' | 'OPCIONAIS'>('TODAS');
  const [unifySearchTerm, setUnifySearchTerm] = useState<string>('');
  const [favoriteTemplates, setFavoriteTemplates] = useState<FavoriteUnifiedTemplate[]>([]);
  const [updateFavoriteInDb, setUpdateFavoriteInDb] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Synchronize internal state whenever the modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedCodes);
      setTempUnified(unifiedGroups);
      setSearchTerm('');
      setCategoryFilter('TODAS');
      setUnifySearchTerm('');
      setEditingGroupId(null);
      setUpdateFavoriteInDb(false);
      setFeedbackToast(null);

      // Load favorite templates from local storage
      const local = storageService.getFavoriteUnifications();
      setFavoriteTemplates(local);

      // Load and listen to Cloud Firestore favorites if authenticated
      if (user?.uid) {
        storageService.fetchCloudFavoriteUnifications(user.uid).then(remote => {
          if (remote && remote.length > 0) {
            setFavoriteTemplates(remote);
          }
        });
        const unsubscribe = storageService.listenToCloudFavoriteUnifications(user.uid, (items) => {
          setFavoriteTemplates(items);
        });
        return () => unsubscribe();
      }
    }
  }, [isOpen, selectedCodes, unifiedGroups, user?.uid]);

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

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleToggleForUnify = (code: string) => {
    setUnifyCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Find corresponding template for an active unified group
  const getMatchingTemplate = (group: UnifiedVerbaGroup): FavoriteUnifiedTemplate | undefined => {
    if (group.templateId) {
      const byId = favoriteTemplates.find(t => t.id === group.templateId);
      if (byId) return byId;
    }
    return favoriteTemplates.find(
      t => t.nomeUnificado.trim().toUpperCase() === group.nomeUnificado.trim().toUpperCase()
    );
  };

  const isGroupFavorited = (group: UnifiedVerbaGroup): boolean => {
    return !!getMatchingTemplate(group);
  };

  const handleToggleFavoriteGroup = async (group: UnifiedVerbaGroup) => {
    const matching = getMatchingTemplate(group);

    if (matching) {
      const confirmRemove = window.confirm(
        `Deseja remover o modelo "${matching.nomeUnificado}" dos seus favoritos salvos no banco?`
      );
      if (!confirmRemove) return;

      try {
        await storageService.deleteFavoriteUnification(matching.id);
        setFavoriteTemplates(prev => prev.filter(t => t.id !== matching.id));
        setTempUnified(prev => prev.map(g => g.id === group.id ? { ...g, templateId: undefined } : g));
        showToast('info', `Modelo "${matching.nomeUnificado}" removido dos favoritos.`);
      } catch (err) {
        console.error(err);
        showToast('error', 'Erro ao remover modelo favorito.');
      }
    } else {
      try {
        const newTemplate: FavoriteUnifiedTemplate = {
          id: `FAV_${Date.now()}`,
          nomeUnificado: group.nomeUnificado.trim().toUpperCase(),
          codigosOriginais: [...group.codigosOriginais],
          timestamp: new Date().toISOString(),
          userId: user?.uid
        };
        await storageService.saveFavoriteUnification(newTemplate);
        setFavoriteTemplates(prev => [newTemplate, ...prev.filter(t => t.id !== newTemplate.id)]);
        setTempUnified(prev => prev.map(g => g.id === group.id ? { ...g, templateId: newTemplate.id } : g));
        showToast('success', `Modelo "${newTemplate.nomeUnificado}" salvo como favorito no banco!`);
      } catch (err) {
        console.error(err);
        showToast('error', 'Erro ao salvar modelo favorito.');
      }
    }
  };

  const handleApplyFavoriteTemplate = (template: FavoriteUnifiedTemplate) => {
    // Tolerance Rule: Cross template codes with sheet's available verbas
    const availableCodes = template.codigosOriginais.filter(code =>
      allAvailableVerbas.some(v => v.codigo === code)
    );

    if (availableCodes.length === 0) {
      showToast('error', `Nenhuma das ${template.codigosOriginais.length} rubricas do modelo "${template.nomeUnificado}" foi encontrada na ficha deste servidor.`);
      return;
    }

    const newGroup: UnifiedVerbaGroup = {
      id: `UNIF_${Date.now().toString().slice(-4)}`,
      nomeUnificado: template.nomeUnificado.toUpperCase(),
      codigosOriginais: availableCodes,
      templateId: template.id
    };

    // Replace if already applied or add new
    setTempUnified(prev => [
      ...prev.filter(g => g.templateId !== template.id && g.nomeUnificado !== template.nomeUnificado),
      newGroup
    ]);

    // Remove grouped codes from standalone selection
    setTempSelected(prev => prev.filter(c => !availableCodes.includes(c)));

    if (availableCodes.length < template.codigosOriginais.length) {
      const missingCount = template.codigosOriginais.length - availableCodes.length;
      showToast(
        'info',
        `Unificação "${template.nomeUnificado}" aplicada com ${availableCodes.length} de ${template.codigosOriginais.length} rubricas (${missingCount} não constavam nesta ficha). O modelo original no banco foi preservado!`
      );
    } else {
      showToast('success', `Unificação "${template.nomeUnificado}" aplicada com sucesso (${availableCodes.length} rubricas)!`);
    }
  };

  const handleDeleteFavoriteTemplate = async (template: FavoriteUnifiedTemplate) => {
    const confirmDelete = window.confirm(`Deseja excluir permanentemente o modelo "${template.nomeUnificado}" dos seus favoritos salvos no banco?`);
    if (!confirmDelete) return;

    try {
      await storageService.deleteFavoriteUnification(template.id);
      setFavoriteTemplates(prev => prev.filter(t => t.id !== template.id));
      setTempUnified(prev => prev.map(g => g.templateId === template.id ? { ...g, templateId: undefined } : g));
      showToast('info', `Modelo "${template.nomeUnificado}" excluído.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao excluir modelo favorito.');
    }
  };

  const handleStartEditGroup = (group: UnifiedVerbaGroup) => {
    setEditingGroupId(group.id);
    setUnifyCodes([...group.codigosOriginais]);
    setUnifiedName(group.nomeUnificado);
    setShowUnifySection(true);
    setUnifySearchTerm('');
    setUpdateFavoriteInDb(false);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setUnifyCodes([]);
    setUnifiedName('');
    setUpdateFavoriteInDb(false);
  };

  const handleCreateUnifiedGroup = async () => {
    if (unifyCodes.length < 2) {
      alert('Selecione pelo menos 2 verbas para unificar.');
      return;
    }
    if (!unifiedName.trim()) {
      alert('Informe um nome para a verba unificada.');
      return;
    }

    if (editingGroupId) {
      const oldGroup = tempUnified.find(g => g.id === editingGroupId);
      const removedCodes = oldGroup ? oldGroup.codigosOriginais.filter(c => !unifyCodes.includes(c)) : [];
      const matchingTemplate = oldGroup ? getMatchingTemplate(oldGroup) : undefined;

      // Update favorite template in Firestore if user confirmed
      if (updateFavoriteInDb && matchingTemplate) {
        try {
          const updatedTemplate: FavoriteUnifiedTemplate = {
            ...matchingTemplate,
            nomeUnificado: unifiedName.trim().toUpperCase(),
            codigosOriginais: [...unifyCodes],
            timestamp: new Date().toISOString()
          };
          await storageService.saveFavoriteUnification(updatedTemplate);
          setFavoriteTemplates(prev => prev.map(t => t.id === matchingTemplate.id ? updatedTemplate : t));
          showToast('success', `Modelo favorito "${updatedTemplate.nomeUnificado}" atualizado no banco!`);
        } catch (err) {
          console.error(err);
          showToast('error', 'Erro ao sincronizar atualização no banco.');
        }
      }

      setTempUnified(prev => prev.map(g => g.id === editingGroupId ? {
        ...g,
        nomeUnificado: unifiedName.trim().toUpperCase(),
        codigosOriginais: [...unifyCodes],
        templateId: matchingTemplate?.id
      } : g));

      // Remove newly selected codes from standalone and restore deselected codes to standalone
      setTempSelected(prev => {
        const withoutNew = prev.filter(c => !unifyCodes.includes(c));
        return Array.from(new Set([...withoutNew, ...removedCodes]));
      });

      setEditingGroupId(null);
      setUnifyCodes([]);
      setUnifiedName('');
      setShowUnifySection(false);
      setUpdateFavoriteInDb(false);
      return;
    }

    const newGroup: UnifiedVerbaGroup = {
      id: `UNIF_${Date.now().toString().slice(-4)}`,
      nomeUnificado: unifiedName.trim().toUpperCase(),
      codigosOriginais: [...unifyCodes]
    };

    setTempUnified(prev => [...prev, newGroup]);
    // Remove unified codes from standalone selection so they are only calculated as part of the group
    setTempSelected(prev => prev.filter(c => !unifyCodes.includes(c)));
    setUnifyCodes([]);
    setUnifiedName('');
    setShowUnifySection(false);
  };

  const handleRemoveUnifiedGroup = (id: string) => {
    if (editingGroupId === id) {
      handleCancelEdit();
    }
    const removedGroup = tempUnified.find(g => g.id === id);
    setTempUnified(prev => prev.filter(g => g.id !== id));
    if (removedGroup) {
      // Restore codes to standalone selection
      setTempSelected(prev => Array.from(new Set([...prev, ...removedGroup.codigosOriginais])));
    }
  };

  const handleApply = () => {
    onApplySelection(tempSelected, tempUnified);
    onClose();
  };

  // Map of verba code to unified group name
  const unifiedMemberCodesMap = useMemo(() => {
    const map = new Map<string, string>();
    tempUnified.forEach(g => {
      g.codigosOriginais.forEach(c => map.set(c, g.nomeUnificado));
    });
    return map;
  }, [tempUnified]);

  // Total unique active verba codes (standalone selected + inside active unified groups)
  const totalActiveCodes = useMemo(() => {
    const set = new Set(tempSelected);
    tempUnified.forEach(g => g.codigosOriginais.forEach(c => set.add(c)));
    return set;
  }, [tempSelected, tempUnified]);

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

  // Filter verbas for unification by code or name
  const filteredUnifyVerbas = useMemo(() => {
    if (!unifySearchTerm.trim()) return allAvailableVerbas;
    const term = unifySearchTerm.toLowerCase().trim();
    return allAvailableVerbas.filter(v =>
      v.codigo.toLowerCase().includes(term) ||
      v.descricao.toLowerCase().includes(term)
    );
  }, [allAvailableVerbas, unifySearchTerm]);

  if (!isOpen) return null;

  const countRecommended = allAvailableVerbas.filter(v => !v.defaultIgnored).length;
  const countOptionals = allAvailableVerbas.filter(v => !!v.defaultIgnored).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0f1a27] border border-slate-200 dark:border-[#324f72] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#132030] border-b border-slate-200 dark:border-[#324f72]/60 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#008d50]/20 border border-emerald-300 dark:border-[#008d50]/40 flex items-center justify-center text-[#008d50]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white transition-colors">Eventos & Rubricas da Ficha Financeira</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-[#008d50]/20 dark:text-[#008d50] border border-emerald-300 dark:border-[#008d50]/40">
                  {allAvailableVerbas.length} detectados
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                Selecione os eventos que serão utilizados no cálculo retroativo. Itens opcionais (FG, Abono, etc.) podem ser ativados livremente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1b2a3f] transition-all cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Quick Selection Toolbar & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#17263a]/80 border border-slate-200 dark:border-[#324f72]/50 transition-colors">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center font-black text-slate-900 dark:text-white text-xs transition-colors">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#008d50]" />
                {tempUnified.length > 0 ? (
                  <span>
                    <strong className="text-slate-900 dark:text-white font-black">{totalActiveCodes.size}</strong> rubricas ativas{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">
                      ({tempSelected.length} avulsas + {tempUnified.length} {tempUnified.length === 1 ? 'grupo unificado' : 'grupos unificados'})
                    </span>
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-900 dark:text-white font-black">{tempSelected.length}</strong> de {allAvailableVerbas.length} rubricas ativas
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectRecommended}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#008d50]/20 hover:bg-emerald-100 dark:hover:bg-[#008d50]/30 text-emerald-800 dark:text-[#008d50] font-bold border border-emerald-300 dark:border-[#008d50]/40 transition-all cursor-pointer flex items-center space-x-1"
                title="Marcar apenas eventos padrão de carreira recomendados"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#008d50]" />
                Padrão Recomendado ({countRecommended})
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#132030] hover:bg-slate-100 dark:hover:bg-[#1f3148] text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-[#324f72] transition-all cursor-pointer shadow-2xs"
              >
                Marcar Todas
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#132030] hover:bg-slate-100 dark:hover:bg-[#1f3148] text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold border border-slate-300 dark:border-[#324f72] transition-all cursor-pointer shadow-2xs"
              >
                Apenas Base
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#132030] hover:bg-rose-50 text-slate-700 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:text-slate-400 dark:hover:text-rose-300 font-bold border border-slate-300 dark:border-[#324f72] hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                title="Desmarcar todas as rubricas avulsas"
              >
                Limpar Todas
              </button>

              <button
                type="button"
                onClick={() => setShowUnifySection(!showUnifySection)}
                className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${showUnifySection
                  ? 'bg-[#ea580c] dark:bg-[#f88543] text-white dark:text-slate-950 border-[#ea580c] dark:border-[#f88543]'
                  : 'bg-orange-50 dark:bg-[#f88543]/20 hover:bg-orange-100 dark:hover:bg-[#f88543]/30 text-orange-800 dark:text-[#f88543] border-orange-200 dark:border-[#f88543]/40'
                  }`}
              >
                <Merge className="w-3.5 h-3.5 mr-1" />
                {showUnifySection ? 'Fechar Unificação' : 'Unificar Verbas'}
              </button>
            </div>
          </div>

          {/* Feedback Toast Notification */}
          {feedbackToast && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold animate-fade-in shadow-xs ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-[#008d50]/20 dark:text-emerald-300 dark:border-[#008d50]/50'
                : feedbackToast.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                  : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
            }`}>
              <div className="flex items-center space-x-2">
                {feedbackToast.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span>{feedbackToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackToast(null)}
                className="p-1 hover:opacity-75 cursor-pointer ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Seção: Modelos Favoritos Salvos no Banco */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-amber-50/40 to-orange-50/30 dark:from-[#1b251d]/70 dark:via-[#162130] dark:to-[#17263a] border border-amber-200/90 dark:border-amber-500/30 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 font-black text-xs">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Modelos Favoritos Salvos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/40">
                  {favoriteTemplates.length} {favoriteTemplates.length === 1 ? 'modelo' : 'modelos'}
                </span>
              </div>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium hidden sm:inline">
                Aplica grupos salvos com tolerância a eventos ausentes nesta ficha
              </span>
            </div>

            {favoriteTemplates.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-white/60 dark:bg-[#0b131e]/50 border border-amber-200/50 dark:border-[#324f72]/40 text-slate-500 dark:text-slate-400 text-[11px]">
                Nenhum modelo favorito salvo ainda. Crie um grupo unificado e clique no ícone de estrela ⭐ para salvá-lo no banco e reutilizá-lo em qualquer ficha!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {favoriteTemplates.map(template => {
                  // Tolerance Check: Codes present in this sheet
                  const matchingCodes = template.codigosOriginais.filter(c =>
                    allAvailableVerbas.some(v => v.codigo === c)
                  );
                  const isFullyPresent = matchingCodes.length === template.codigosOriginais.length;
                  const isPartiallyPresent = matchingCodes.length > 0 && matchingCodes.length < template.codigosOriginais.length;
                  const isNonePresent = matchingCodes.length === 0;

                  // Check if this model is already active in current selection
                  const isApplied = tempUnified.some(
                    g => g.templateId === template.id || g.nomeUnificado === template.nomeUnificado
                  );

                  return (
                    <div
                      key={template.id}
                      className={`p-3 rounded-xl bg-white dark:bg-[#132030] border text-xs space-y-2.5 shadow-2xs transition-all ${
                        isApplied
                          ? 'border-emerald-400/80 dark:border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'border-amber-200/80 dark:border-[#324f72]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                          <strong className="text-slate-900 dark:text-white font-extrabold truncate text-xs">
                            {template.nomeUnificado}
                          </strong>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {isFullyPresent ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                              {matchingCodes.length}/{template.codigosOriginais.length} na ficha
                            </span>
                          ) : isPartiallyPresent ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                              {matchingCodes.length}/{template.codigosOriginais.length} na ficha
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50">
                              0/{template.codigosOriginais.length} na ficha
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteFavoriteTemplate(template)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Excluir este modelo dos favoritos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rubricas preview pills */}
                      <div className="flex flex-wrap gap-1">
                        {template.codigosOriginais.map(c => {
                          const item = allAvailableVerbas.find(v => v.codigo === c);
                          const existsOnSheet = !!item;
                          return (
                            <span
                              key={c}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                                existsOnSheet
                                  ? 'bg-slate-100 dark:bg-[#0b131e] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#324f72]'
                                  : 'bg-slate-100/50 dark:bg-[#0b131e]/30 text-slate-400 dark:text-slate-500 line-through border-dashed border-slate-300 dark:border-slate-700'
                              }`}
                              title={
                                existsOnSheet
                                  ? `${c} - ${item?.descricao}`
                                  : `Rubrica ${c} não encontrada na ficha deste servidor (será tolerada e ignorada nesta ficha sem alterar o modelo salvo)`
                              }
                            >
                              <span className={`font-bold mr-1 ${existsOnSheet ? 'text-amber-700 dark:text-[#ead04d]' : 'text-slate-400'}`}>
                                {c}
                              </span>
                              <span className="truncate max-w-[90px] inline-block align-bottom">{item?.descricao || c}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Bottom action bar */}
                      <div className="pt-1 flex items-center justify-between">
                        {isPartiallyPresent && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {template.codigosOriginais.length - matchingCodes.length} evento(s) ausente(s)
                          </span>
                        )}
                        {isNonePresent && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            Nenhuma rubrica na ficha
                          </span>
                        )}
                        {isFullyPresent && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                            Todas presentes na ficha
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApplyFavoriteTemplate(template)}
                          disabled={isNonePresent}
                          className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                            isApplied
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                          title="Cruza os códigos do modelo com a ficha atual e aplica a unificação"
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              <span>Reaplicar</span>
                            </>
                          ) : (
                            <>
                              <BookmarkCheck className="w-3 h-3 mr-1" />
                              <span>Aplicar Unificação</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72]/70 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#008d50] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0b131e] border border-slate-200 dark:border-[#324f72]/50 text-xs font-bold transition-colors">
              <button
                type="button"
                onClick={() => setCategoryFilter('TODAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'TODAS'
                    ? 'bg-[#1e3a5f] dark:bg-[#324f72] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Todas ({allAvailableVerbas.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('RECOMENDADAS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'RECOMENDADAS'
                    ? 'bg-[#008d50] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Recomendadas ({countRecommended})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('OPCIONAIS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'OPCIONAIS'
                    ? 'bg-[#ea580c] dark:bg-[#f88543] text-white dark:text-slate-950 font-black shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Opcionais / FG / Abono ({countOptionals})
              </button>
            </div>
          </div>

          {/* Section: Unify Verbas Creator / Editor */}
          {showUnifySection && (
            <div className={`p-4 rounded-2xl border space-y-3 animate-fade-in transition-colors ${
              editingGroupId
                ? 'bg-orange-100/30 dark:bg-[#1a2d45] border-[#ea580c] dark:border-[#f88543]'
                : 'bg-orange-50/50 dark:bg-[#17263a] border-orange-200 dark:border-[#f88543]/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-orange-800 dark:text-[#f88543] font-bold">
                  {editingGroupId ? <Pencil className="w-4 h-4" /> : <Merge className="w-4 h-4" />}
                  <span>{editingGroupId ? `Editar Grupo: ${unifiedName || 'Unificado'}` : 'Criar Linha Consolidada Unificada'}</span>
                </div>
                {editingGroupId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {editingGroupId
                  ? 'Modifique abaixo as verbas integrantes deste grupo. Você pode marcar novas rubricas ou desmarcar existentes:'
                  : 'Marque abaixo as verbas que deseja agrupar em uma única linha no demonstrativo (ex: juntar horas extras de diferentes percentuais em uma só linha consolidada):'}
              </p>

              {/* Filtro de Pesquisa por Código ou Nome na Unificação */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar verba por código ou nome (ex: 787, 815, Horas, Noturno)..."
                  value={unifySearchTerm}
                  onChange={(e) => setUnifySearchTerm(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-[#0b131e] border border-orange-200 dark:border-[#324f72] rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ea580c] dark:focus:border-[#f88543] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs"
                />
                {unifySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setUnifySearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tags/Badges das verbas já selecionadas para unificar */}
              {unifyCodes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-orange-100/60 dark:bg-[#0b131e]/60 border border-orange-200 dark:border-[#f88543]/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 dark:text-[#f88543] mr-1">
                    Selecionadas ({unifyCodes.length}):
                  </span>
                  {unifyCodes.map(c => {
                    const item = allAvailableVerbas.find(v => v.codigo === c);
                    return (
                      <span
                        key={`unify-badge-${c}`}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#1b2a3f] text-slate-800 dark:text-slate-200 text-[10px] font-bold border border-orange-300 dark:border-[#f88543]/50 shadow-2xs"
                      >
                        <span className="font-mono text-orange-700 dark:text-[#f88543]">{c}</span>
                        <span className="truncate max-w-[140px]">{item?.descricao || c}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleForUnify(c)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-1"
                          title="Remover da seleção"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-[#0b131e] rounded-xl border border-slate-200 dark:border-[#324f72]/40">
                {filteredUnifyVerbas.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Nenhuma verba encontrada para a pesquisa "{unifySearchTerm}".
                  </div>
                ) : (
                  filteredUnifyVerbas.map(v => (
                    <label
                      key={`unify-${v.codigo}`}
                      className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                        unifyCodes.includes(v.codigo)
                          ? 'bg-orange-50 dark:bg-[#f88543]/15 text-orange-950 dark:text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-[#1b2a3f]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={unifyCodes.includes(v.codigo)}
                        onChange={() => handleToggleForUnify(v.codigo)}
                        className="accent-[#ea580c] dark:accent-[#f88543] w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{v.codigo}</span>
                      <span className="truncate text-slate-800 dark:text-slate-200">{v.descricao}</span>
                    </label>
                  ))
                )}
              </div>

              {/* Opção de atualizar modelo no banco caso este grupo corresponda a um modelo salvo */}
              {editingGroupId && (
                <label className="flex items-center space-x-2 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold text-amber-900 dark:text-amber-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={updateFavoriteInDb}
                    onChange={(e) => setUpdateFavoriteInDb(e.target.checked)}
                    className="accent-amber-600 w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <span>
                    Atualizar também o modelo favorito correspondente salvo no banco de dados ({unifiedName || 'Modelo'})
                  </span>
                </label>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Nome consolidado (ex: HORAS EXTRAS UNIFICADAS)"
                  value={unifiedName}
                  onChange={(e) => setUnifiedName(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#0b131e] border border-slate-300 dark:border-[#324f72] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#ea580c] dark:focus:border-[#f88543] transition-colors"
                />
                {editingGroupId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-2 bg-slate-200 dark:bg-[#1b2a3f] hover:bg-slate-300 dark:hover:bg-[#233752] text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition-colors text-xs"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCreateUnifiedGroup}
                  disabled={unifyCodes.length < 2 || !unifiedName.trim()}
                  className="px-4 py-2 bg-[#ea580c] dark:bg-[#f88543] hover:bg-[#c2410c] dark:hover:bg-[#df6824] disabled:opacity-50 text-white dark:text-slate-950 font-black rounded-xl cursor-pointer transition-colors whitespace-nowrap text-xs shadow-xs"
                >
                  {editingGroupId ? `Salvar Alterações (${unifyCodes.length})` : `Unificar (${unifyCodes.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Active Unified Groups list */}
          {tempUnified.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-orange-50/40 dark:bg-[#132030] border border-orange-200 dark:border-[#f88543]/40 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center space-x-1.5">
                  <Merge className="w-3.5 h-3.5 text-orange-700 dark:text-[#f88543]" />
                  <span>Grupos Unificados Ativos ({tempUnified.length}):</span>
                </h4>
                <span className="text-[11px] text-orange-800 dark:text-[#f88543] font-bold">
                  Calculam juntos e exibem dropdown no demonstrativo
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {tempUnified.map(group => {
                  const favorited = isGroupFavorited(group);
                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-xl bg-white dark:bg-[#1b2a3f] border text-xs space-y-2 shadow-2xs transition-colors ${
                        editingGroupId === group.id
                          ? 'border-[#ea580c] dark:border-[#f88543] ring-1 ring-[#ea580c]/50 dark:ring-[#f88543]/50'
                          : 'border-slate-200 dark:border-[#324f72]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-[#f88543]/20 text-orange-800 dark:text-[#f88543] font-mono font-bold text-[10px] border border-orange-200 dark:border-[#f88543]/40 inline-flex items-center">
                            {favorited && <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-1" />}
                            <span>UNIFICADO ({group.codigosOriginais.length} rubricas)</span>
                          </span>
                          <strong className="text-slate-900 dark:text-white font-extrabold text-sm">{group.nomeUnificado}</strong>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFavoriteGroup(group)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              favorited
                                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                            }`}
                            title={
                              favorited
                                ? 'Modelo favorito salvo no banco (clique para remover dos favoritos)'
                                : 'Salvar este grupo como modelo favorito no banco de dados'
                            }
                          >
                            <Star className={`w-4 h-4 ${favorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEditGroup(group)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              editingGroupId === group.id
                                ? 'text-[#ea580c] dark:text-[#f88543] bg-orange-100 dark:bg-[#f88543]/20'
                                : 'text-slate-400 hover:text-[#ea580c] dark:hover:text-[#f88543] hover:bg-orange-50 dark:hover:bg-[#f88543]/10'
                            }`}
                            title="Editar rubricas deste grupo unificado"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveUnifiedGroup(group.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remover este grupo unificado e desagrupar verbas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {group.codigosOriginais.map(c => {
                          const item = allAvailableVerbas.find(v => v.codigo === c);
                          return (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0b131e] text-slate-800 dark:text-slate-200 text-[10px] font-mono border border-slate-200 dark:border-[#324f72]/60 font-medium"
                            >
                              <span className="font-bold text-amber-700 dark:text-[#ead04d] mr-1">{c}</span>
                              {item?.descricao || c}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verbas Checkbox List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Lista de Eventos Encontrados na(s) Ficha(s):
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Mostrando {filteredVerbas.length} de {allAvailableVerbas.length}
              </span>
            </div>

            {filteredVerbas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#0b131e]/50 border border-slate-200 dark:border-[#324f72]/30 text-slate-500 dark:text-slate-400 text-xs">
                Nenhuma rubrica encontrada para os filtros aplicados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredVerbas.map(verba => {
                  const isChecked = tempSelected.includes(verba.codigo);
                  const isGrouped = unifiedMemberCodesMap.has(verba.codigo);
                  const groupedGroupName = unifiedMemberCodesMap.get(verba.codigo);
                  const isBase = verba.codigo === '50' || verba.descricao.toUpperCase().includes('BASE');
                  const isFG = verba.categoria === 'FG_COMISSAO';
                  const isAbono = verba.categoria === 'ABONO_PERMANENCIA';
                  const isDesconto = verba.categoria === 'DESCONTO';

                  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-[#008d50]/20 dark:text-[#008d50] dark:border-[#008d50]/40';
                  let badgeText = 'Padrão Carreira';

                  if (isGrouped) {
                    badgeColor = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-[#f88543]/20 dark:text-[#f88543] dark:border-[#f88543]/50 font-bold';
                    badgeText = `Unificado (${groupedGroupName})`;
                  } else if (isBase) {
                    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-[#008d50]/30 dark:text-[#008d50] dark:border-[#008d50]/60 font-black';
                    badgeText = 'Base Salarial';
                  } else if (isFG) {
                    badgeColor = 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-[#f88543]/20 dark:text-[#f88543] dark:border-[#f88543]/40';
                    badgeText = 'FG / Comissão';
                  } else if (isAbono) {
                    badgeColor = 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-[#3b82f6]/20 dark:text-[#60a5fa] dark:border-[#3b82f6]/40';
                    badgeText = 'Abono Permanência';
                  } else if (isDesconto) {
                    badgeColor = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-[#ef4444]/20 dark:text-[#f87171] dark:border-[#ef4444]/40';
                    badgeText = 'Dedução / Desconto';
                  } else if (verba.defaultIgnored) {
                    badgeColor = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600';
                    badgeText = 'Opcional';
                  }

                  return (
                    <label
                      key={verba.codigo}
                      className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${isGrouped
                          ? 'bg-orange-50/40 dark:bg-[#152335]/70 border-orange-200 dark:border-[#f88543]/40 shadow-xs'
                          : isChecked
                            ? 'bg-emerald-50/40 dark:bg-[#152335] border-emerald-300 dark:border-[#008d50]/60 shadow-xs'
                            : 'bg-white dark:bg-[#0b131e]/50 border-slate-200 dark:border-[#324f72]/30 text-slate-500 dark:text-slate-400 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-[#324f72]'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked || isGrouped}
                        onChange={() => {
                          handleToggleCode(verba.codigo);
                        }}
                        className={`mt-1 w-4 h-4 rounded cursor-pointer shrink-0 ${isGrouped ? 'accent-[#ea580c] dark:accent-[#f88543]' : 'accent-[#008d50]'
                          }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0b131e] text-slate-800 dark:text-slate-200 font-mono text-[10px] border border-slate-200 dark:border-[#324f72]/60 font-black">
                            {verba.codigo}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className={`font-bold truncate text-xs mt-1.5 ${isChecked || isGrouped ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {verba.descricao}
                        </div>

                        {isGrouped ? (
                          <p className="text-[10px] text-orange-800 dark:text-[#f88543] mt-1 font-medium">
                            Agrupada em "{groupedGroupName}". Calculada no grupo com dropdown.
                          </p>
                        ) : verba.defaultIgnored ? (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Ignorado por regra padrão — marque para incluir no cálculo.
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#132030] border-t border-slate-200 dark:border-[#324f72]/60 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Total selecionado: <strong className="text-slate-900 dark:text-white font-bold">{totalActiveCodes.size}</strong> rubricas ativas
            {tempUnified.length > 0 && (
              <span className="text-orange-800 dark:text-[#f88543] font-medium ml-1">
                ({tempUnified.length} {tempUnified.length === 1 ? 'grupo unificado' : 'grupos unificados'} + {tempSelected.length} avulsas)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#1b2a3f] hover:bg-slate-100 dark:hover:bg-[#22354f] rounded-xl border border-slate-300 dark:border-[#324f72] cursor-pointer transition-all shadow-2xs"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center px-5 py-2.5 text-xs font-black text-white bg-[#008d50] hover:bg-[#00663a] rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Seleção & Calcular ({totalActiveCodes.size})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
