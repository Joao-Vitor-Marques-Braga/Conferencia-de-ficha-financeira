import type { SavedCalculation } from '../types';

const STORAGE_KEY = 'centi_rio_verde_saved_calculations';

export const storageService = {
  getSavedCalculations(): SavedCalculation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SavedCalculation[];
    } catch (err) {
      console.error('Erro ao ler cálculos do localStorage:', err);
      return [];
    }
  },

  saveCalculation(item: SavedCalculation): void {
    try {
      const list = this.getSavedCalculations();
      const existingIdx = list.findIndex(c => c.id === item.id || (c.matricula === item.matricula && c.periodo === item.periodo));
      
      if (existingIdx >= 0) {
        list[existingIdx] = item;
      } else {
        list.unshift(item);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao salvar cálculo no localStorage:', err);
      throw err;
    }
  },

  deleteCalculation(id: string): void {
    try {
      const list = this.getSavedCalculations().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao excluir cálculo do localStorage:', err);
    }
  },

  toggleConferidoStatus(id: string): boolean {
    try {
      const list = this.getSavedCalculations();
      const item = list.find(c => c.id === id);
      if (!item) return false;
      item.conferido = !item.conferido;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return item.conferido;
    } catch (err) {
      console.error('Erro ao alternar status conferido:', err);
      return false;
    }
  },

  updateNotes(id: string, notas: string): void {
    try {
      const list = this.getSavedCalculations();
      const item = list.find(c => c.id === id);
      if (!item) return;
      item.notas = notas;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao atualizar anotações:', err);
    }
  }
};
