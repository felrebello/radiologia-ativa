/**
 * Contexto de autenticação com Firebase
 * Gerencia o estado de login e informações do usuário
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
// Lista de emails com permissão de ADMIN vindos do .env (separados por vírgula)
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);
import { auth, db } from '../lib/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  updateUser: (id: string, data: Partial<Pick<User, 'name' | 'email'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário atual e escutar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Carregar lista de usuários
    loadUsers();

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('Carregando perfil para usuário:', firebaseUser.uid);
      
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profile = profileSnap.data();
        console.log('Perfil carregado:', profile);
        const emailLower = (profile.email || firebaseUser.email || '').toLowerCase();
        const effectiveRole = (emailLower && adminEmails.includes(emailLower)) ? 'admin' : profile.role;
        setUser({
          id: firebaseUser.uid,
          name: profile.name,
          email: profile.email,
          role: effectiveRole
        });
      } else {
        console.error('Nenhum perfil encontrado para o usuário');
        // Criar perfil básico se não existir
        const newProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
          email: firebaseUser.email || '',
          role: 'student' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(profileRef, newProfile);
        setUser({
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      // Fallback: ainda assim mantém usuário autenticado como student/admin por email
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email || '',
        role: (firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())) ? 'admin' : 'student'
      });
    }
  };

  const loadUsers = async () => {
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const userList: User[] = [];
      querySnapshot.forEach((doc) => {
        const profile = doc.data();
        userList.push({
          id: doc.id,
          name: profile.name,
          email: profile.email,
          role: profile.role
        });
      });
      
      setUsers(userList);
    } catch (error) {
      console.error('Erro ao carregar lista de usuários:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Tentando login com:', { 
        email: email.trim().toLowerCase()
      });
      
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email.trim().toLowerCase(), 
        password
      );

      if (userCredential.user) {
        console.log('Login bem-sucedido, carregando perfil...');
        await loadUserProfile(userCredential.user);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<RegisterResult> => {
    try {
      setIsLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );

      if (userCredential.user) {
        // Criar perfil no Firestore
        const profileData = {
          id: userCredential.user.uid,
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          role: 'student' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const profileRef = doc(db, 'profiles', userCredential.user.uid);
        await setDoc(profileRef, profileData);
        
        // Recarregar lista de usuários
        await loadUsers();
        return { success: true, userId: userCredential.user.uid };
      }

      return { success: false, error: 'Erro desconhecido' };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<Pick<User, 'name' | 'email'>>) => {
    try {
      const profileRef = doc(db, 'profiles', id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(profileRef, updateData);

      // Recarregar lista de usuários
      await loadUsers();

      // Se for o usuário atual, atualizar o estado
      if (user && user.id === id) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const profileRef = doc(db, 'profiles', id);
      await deleteDoc(profileRef);

      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
      login, 
      register, 
      updateUser, 
      deleteUser, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
