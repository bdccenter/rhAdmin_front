// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// URL base de la API
const API_URL = 'https://rhadminback-production.up.railway.app';

// Definición de tipos
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  agency: string;
  is_superuser: number;
}

// Valor por defecto del contexto
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
};

// Crear el contexto
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Hook personalizado para acceder al contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verificar si el usuario ya está autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Función para manejar el inicio de sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.status === 200 && response.data.success) {
        // Guardar token y datos de usuario
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Actualizar estado
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Valor del contexto que será proporcionado
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;