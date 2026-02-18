import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authAPI, setUnauthorizedHandler } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'job-seeker' | 'entrepreneur' | 'company' | 'admin' | 'super-admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  comuna: string;
  profile_image?: string | null;
  cv_url?: string | null;
  roles: UserRole[];
  role_number?: number;
  region_id?: string;
  // Job seeker specific
  rubro?: string;
  experience?: string;
  cvUrl?: string;
  // Entrepreneur specific
  service?: string;
  portfolio?: string[];
  priceRange?: string;
  // Company specific
  companyRut?: string;
  companyAddress?: string;
  companyRubro?: string;
  hrContact?: string;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loadUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<UserProfile | null>(null);

  // Mantener referencia actualizada del usuario
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Función para cerrar sesión cuando la cookie expira
  const handleUnauthorized = async () => {
    // Solo cerrar sesión si el usuario estaba logueado
    if (userRef.current) {
      toast.info('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      // Limpiar estado local
      localStorage.removeItem('token');
      setUser(null);
      // Intentar cerrar sesión en el backend (puede fallar si la cookie ya expiró)
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignorar errores si la cookie ya expiró
      }
    }
  };

  // Registrar el handler para cuando la cookie expire (solo una vez)
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => {
      setUnauthorizedHandler(() => { });
    };
  }, []); // Sin dependencias, se registra solo una vez

  // Cargar usuario al iniciar - las cookies y el token de localStorage se envían automáticamente
  useEffect(() => {
    const initAuth = async () => {
      // Capturar token de la URL si existe (útil para login social o redirecciones)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('token', urlToken);

        // Limpiar parámetros de la URL para mayor seguridad y estética
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('google_login');
        url.searchParams.delete('status');
        window.history.replaceState({}, '', url.pathname + url.search);
      }

      await loadUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      const dbUser = response.user;

      // Convertir role_number a UserRole
      const roleMap: Record<number, UserRole> = {
        1: 'job-seeker',
        2: 'entrepreneur',
        3: 'company',
        4: 'admin',
        5: 'super-admin',
      };

      const userProfile: UserProfile = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        comuna: dbUser.comuna,
        profile_image: dbUser.profile_image || null,
        cv_url: dbUser.cv_url || null,
        roles: [roleMap[Number(dbUser.role_number)] || 'job-seeker'],
        role_number: Number(dbUser.role_number),
        region_id: dbUser.region_id,
      };

      setUser(userProfile);
    } catch (error: any) {
      // Si no hay cookie válida o expiró, el usuario no está autenticado
      // Esto es normal cuando el usuario no ha iniciado sesión
      // Solo loguear errores que no sean 401 (no autenticado)
      if (error?.status !== 401) {
        console.error('Error al cargar usuario:', error);
      }
      // Limpiar cualquier dato local residual
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });

    // Cargar perfil completo después del login
    // La cookie ya fue establecida por el servidor
    await loadUser();
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const isLoggedIn = user !== null;

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn, isLoading, logout, login, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
