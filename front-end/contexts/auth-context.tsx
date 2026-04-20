'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type User, type LoginRequest, type UserRole } from '@/lib/api';
import { MOCK_USERS } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      
      if (storedUser && accessToken) {
        // Intentar validar el token con el servidor
        try {
          const response = await authApi.me();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch {
          // Si falla, usar el usuario almacenado localmente
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    let userData: User;
    let accessToken: string;
    let refreshToken: string;

    if (USE_MOCK_AUTH) {
      // Mock authentication for development
      const mockUser = Object.values(MOCK_USERS).find(
        u => u.email === data.email && u.password === data.password
      );
      
      if (!mockUser) {
        throw new Error('Credenciales incorrectas');
      }

      userData = {
        id: mockUser.id,
        email: mockUser.email,
        nombre: mockUser.nombre,
        apellidos: mockUser.apellidos,
        dni: mockUser.dni,
        role: mockUser.role,
        hospitalId: 'hospitalId' in mockUser ? mockUser.hospitalId : undefined,
        hospitalName: 'hospitalName' in mockUser ? mockUser.hospitalName : undefined,
      };
      accessToken = mockUser.token;
      refreshToken = `refresh-${mockUser.token}`;
    } else {
      const response = await authApi.login(data);
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      userData = response.data.user;
    }
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    
    // Redirigir segun el rol
    switch (userData.role) {
      case 'ROOT':
        router.push('/dashboard/root');
        break;
      case 'HOSPITAL_ADMIN':
        router.push('/dashboard/admin');
        break;
      case 'WORKER':
        router.push('/dashboard/worker');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        updateUser,
      }}
    >
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
