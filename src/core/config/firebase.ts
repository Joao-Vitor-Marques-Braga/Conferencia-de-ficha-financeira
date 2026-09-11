import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.projectId !== ''
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Erro ao inicializar SDK:', err);
  }
} else {
  console.info('[Firebase] Credenciais não configuradas no .env. Operando em modo de armazenamento local.');
}

export { app, auth, db };

export function getFirebaseErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ocorreu um erro inesperado.';
  const code = (error as { code?: string }).code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.';
    case 'auth/invalid-email':
      return 'Endereço de e-mail inválido.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Escolha uma senha com no mínimo 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'O login com Google foi cancelado pela janela ter sido fechada.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a internet. Verifique sua rede.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.';
    case 'auth/operation-not-allowed':
      return 'Este método de autenticação não está habilitado no console do Firebase.';
    default:
      return (error as { message?: string }).message || 'Não foi possível completar a operação no Firebase.';
  }
}
