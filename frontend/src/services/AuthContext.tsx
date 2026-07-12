import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../services/types';
import { db } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = db.getAuth();
    if (saved) {
      setUser(saved);
    }
  }, []);

  const login = (email: string, role: UserRole) => {
    const newUser: User = {
      email,
      name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      role,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
    };
    setUser(newUser);
    db.setAuth(newUser);
    localStorage.setItem('transitops_token', 'mock_jwt_token_for_' + email);
  };

  const logout = () => {
    setUser(null);
    db.setAuth(null);
    localStorage.removeItem('transitops_token');
  };

  const updateRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      db.setAuth(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
