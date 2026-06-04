import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthenticatorProps {
  children: ReactNode;
}

export function Authenticator({ children }: AuthenticatorProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Ejecutar la sincronización con Firestore en segundo plano
        // para no bloquear la resolución del estado de autenticación en la UI.
        const syncUserDoc = async () => {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            const userData = userDoc.data();
            const shouldUpdate = !userDoc.exists() || !userData?.email;

            if (shouldUpdate) {
              await setDoc(userDocRef, {
                uid: firebaseUser.uid,
                username: firebaseUser.displayName || userData?.username || '',
                email: firebaseUser.email || '',
              }, { merge: true });
            }
          } catch (error) {
            console.error("Error de permisos o conexión en Firestore al actualizar email del usuario:", error);
          }
        };
        syncUserDoc();
      }

      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const logout = () => signOut(auth);

  const value: AuthContextValue = { user, loading, signUp, signIn, signInWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// Hook para consumir el usuario y las funciones de auth desde cualquier componente
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <Authenticator>");
  }
  return context;
}
