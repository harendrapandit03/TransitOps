import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../services/types';
import { db, client } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toDisplayName = (email: string) =>
  email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = db.getAuth();
    if (saved) {
      setUser(saved);
    }
  }, []);

  // Authenticates against the FastAPI backend (/auth/login). Since this app
  // has no separate sign-up screen, a login attempt for an email that
  // doesn't exist yet will transparently register the account first.
  const login = async (email: string, password: string, role: UserRole) => {
    const doLogin = () => client.post('/auth/login', { email, password });

    let tokenResponse;
    try {
      tokenResponse = await doLogin();
    } catch (err: any) {
      if (err.response?.status === 401) {
        // No account yet (or wrong password) — try registering, then retry login.
        await client.post('/auth/register', {
          name: toDisplayName(email),
          email,
          password,
          role,
        });
        tokenResponse = await doLogin();
      } else {
        throw new Error(err.response?.data?.detail || 'Unable to reach the server.');
      }
    }

    const { access_token } = tokenResponse.data;
    localStorage.setItem('transitops_token', access_token);

    const me = await client.get('/auth/me');

    const newUser: User = {
      email: me.data.email,
      name: me.data.name,
      role: me.data.role as UserRole,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
    };
    setUser(newUser);
    db.setAuth(newUser);
  };

  const logout = () => {
    setUser(null);
    db.setAuth(null);
    localStorage.removeItem('transitops_token');
  };

  // Role changes here are cosmetic/local only — the backend is the source of
  // truth for the role stored on the account.
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
