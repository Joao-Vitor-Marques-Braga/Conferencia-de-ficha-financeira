import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured, getFirebaseErrorMessage } from '../config/firebase';

export const INSTITUTIONAL_DOMAIN = '@rioverde.go.gov.br';

export const isAllowedInstitutionalEmail = (email: string): boolean => {
  return email.trim().toLowerCase().endsWith(INSTITUTIONAL_DOMAIN);
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('[AuthContext] Erro ao monitorar estado de autenticação:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    if (!isAllowedInstitutionalEmail(cleanEmail)) {
      throw new Error(`Acesso restrito: utilize seu e-mail institucional oficial (${INSTITUTIONAL_DOMAIN}).`);
    }

    if (!auth) throw new Error('O Firebase não está configurado.');
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err) {
      throw new Error(getFirebaseErrorMessage(err));
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim();
    if (!isAllowedInstitutionalEmail(cleanEmail)) {
      throw new Error(`Cadastro restrito: apenas contas com domínio oficial ${INSTITUTIONAL_DOMAIN} são permitidas.`);
    }

    if (!auth) throw new Error('O Firebase não está configurado.');
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (name.trim() && cred.user) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (err) {
      throw new Error(getFirebaseErrorMessage(err));
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[AuthContext] Erro ao deslogar:', err);
    }
  };

  const sendPasswordReset = async (email: string) => {
    const cleanEmail = email.trim();
    if (!isAllowedInstitutionalEmail(cleanEmail)) {
      throw new Error(`Apenas e-mails institucionais oficiais (${INSTITUTIONAL_DOMAIN}) podem solicitar recuperação.`);
    }

    if (!auth) throw new Error('O Firebase não está configurado.');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      throw new Error(getFirebaseErrorMessage(err));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        logout,
        sendPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
