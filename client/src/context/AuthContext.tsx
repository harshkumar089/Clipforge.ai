import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clipforge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Detect OAuth token in URL query (e.g. from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          localStorage.setItem('clipforge_token', urlToken);
          setToken(urlToken);
          // Clean the query parameter from URL bar
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        const activeToken = urlToken || localStorage.getItem('clipforge_token');
        if (!activeToken) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
          return;
        }

        // Query GET /api/auth/me with credentials: 'include' (cookies) and token header if present
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          if (res.token) {
            localStorage.setItem('clipforge_token', res.token);
            setToken(res.token);
          }
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('clipforge_token');
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('clipforge_token');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    if (newToken) {
      localStorage.setItem('clipforge_token', newToken);
      setToken(newToken);
    }
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('clipforge_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedFields });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
