import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
  email: string;
  role: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<{ role: string; name: string; email: string }>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.sub,
      role: payload.role || 'STUDENT',
      name: payload.name || payload.sub,
    };
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('user_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_token');
    return saved ? decodeToken(saved) : null;
  });

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken } = response.data;
    localStorage.setItem('user_token', accessToken);
    setToken(accessToken);

    // Decode immediately — don't wait for useEffect re-render
    const decoded = decodeToken(accessToken);
    const userInfo = {
      role: decoded?.role || 'STUDENT',
      name: decoded?.name || credentials.email,
      email: decoded?.email || credentials.email,
    };
    setUser({ email: userInfo.email, role: userInfo.role, name: userInfo.name });
    return userInfo;
  };

  const register = async (userData: any) => {
    await api.post('/auth/register', userData);
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
