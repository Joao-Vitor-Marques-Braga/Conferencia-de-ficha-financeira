import type { SavedCalculation } from '../types';
import { db, auth, isFirebaseConfigured } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  type Unsubscribe 
} from 'firebase/firestore';

const STORAGE_KEY = 'centi_rio_verde_saved_calculations';

type StorageListener = () => void;
const listeners = new Set<StorageListener>();

const notifyListeners = () => {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (err) {
      console.error('[StorageService] Erro ao notificar listener:', err);
    }
  });
};

function sanitizeForFirestore(obj: unknown): unknown {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (_, value) => value === undefined ? null : value));
}

export const storageService = {
  subscribe(callback: StorageListener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

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

  async saveCalculation(item: SavedCalculation): Promise<void> {
    try {
      // 1. Save to local cache immediately
      const list = this.getSavedCalculations();
      const existingIdx = list.findIndex(c => c.id === item.id || (c.matricula === item.matricula && c.periodo === item.periodo));
      
      if (existingIdx >= 0) {
        list[existingIdx] = item;
      } else {
        list.unshift(item);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyListeners();

      // 2. If authenticated, persist in Cloud Firestore
      const currentUser = auth?.currentUser;
      if (isFirebaseConfigured && db && currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'calculations', item.id);
        const firestoreData = sanitizeForFirestore(item) as Record<string, unknown>;
        await setDoc(docRef, firestoreData, { merge: true });
      }
    } catch (err) {
      console.error('Erro ao salvar cálculo:', err);
      throw err;
    }
  },

  async deleteCalculation(id: string): Promise<void> {
    try {
      // 1. Delete from local cache
      const list = this.getSavedCalculations().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyListeners();

      // 2. Delete from Cloud Firestore if authenticated
      const currentUser = auth?.currentUser;
      if (isFirebaseConfigured && db && currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'calculations', id);
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.error('Erro ao excluir cálculo:', err);
    }
  },

  async toggleConferidoStatus(id: string): Promise<boolean> {
    try {
      const list = this.getSavedCalculations();
      const item = list.find(c => c.id === id);
      if (!item) return false;
      item.conferido = !item.conferido;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyListeners();

      const currentUser = auth?.currentUser;
      if (isFirebaseConfigured && db && currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'calculations', id);
        await updateDoc(docRef, { conferido: item.conferido });
      }
      return item.conferido;
    } catch (err) {
      console.error('Erro ao alternar status conferido:', err);
      return false;
    }
  },

  async updateNotes(id: string, notas: string): Promise<void> {
    try {
      const list = this.getSavedCalculations();
      const item = list.find(c => c.id === id);
      if (!item) return;
      item.notas = notas;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyListeners();

      const currentUser = auth?.currentUser;
      if (isFirebaseConfigured && db && currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'calculations', id);
        await updateDoc(docRef, { notas: notas || '' });
      }
    } catch (err) {
      console.error('Erro ao atualizar anotações:', err);
    }
  },

  async fetchCloudCalculations(uid: string): Promise<SavedCalculation[]> {
    if (!isFirebaseConfigured || !db) return this.getSavedCalculations();

    try {
      const calcsRef = collection(db, 'users', uid, 'calculations');
      const q = query(calcsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const cloudItems: SavedCalculation[] = [];
      snapshot.forEach(docSnap => {
        cloudItems.push(docSnap.data() as SavedCalculation);
      });

      // Merge cloud items into local cache to keep offline availability
      if (cloudItems.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudItems));
        notifyListeners();
        return cloudItems;
      }

      return this.getSavedCalculations();
    } catch (err) {
      console.warn('[StorageService] Falha ao buscar cálculos da nuvem. Usando cache local:', err);
      return this.getSavedCalculations();
    }
  },

  async syncLocalToCloud(uid: string): Promise<{ synced: number }> {
    if (!isFirebaseConfigured || !db) return { synced: 0 };

    try {
      const localList = this.getSavedCalculations();
      if (localList.length === 0) return { synced: 0 };

      let count = 0;
      for (const item of localList) {
        const docRef = doc(db, 'users', uid, 'calculations', item.id);
        const data = sanitizeForFirestore(item) as Record<string, unknown>;
        await setDoc(docRef, data, { merge: true });
        count++;
      }

      return { synced: count };
    } catch (err) {
      console.error('[StorageService] Erro ao sincronizar cálculos locais com o Firebase:', err);
      return { synced: 0 };
    }
  },

  listenToCloudCalculations(uid: string, onUpdate: (items: SavedCalculation[]) => void): Unsubscribe {
    if (!isFirebaseConfigured || !db) {
      onUpdate(this.getSavedCalculations());
      return () => {};
    }

    try {
      const calcsRef = collection(db, 'users', uid, 'calculations');
      const q = query(calcsRef, orderBy('timestamp', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const items: SavedCalculation[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as SavedCalculation);
        });
        
        // Update local storage cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        notifyListeners();
        onUpdate(items);
      }, (err) => {
        console.warn('[StorageService] Listener Firestore desconectado:', err);
        onUpdate(this.getSavedCalculations());
      });
    } catch (err) {
      console.error('[StorageService] Erro ao iniciar listener Firestore:', err);
      onUpdate(this.getSavedCalculations());
      return () => {};
    }
  }
};
