import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('token');
    // Auto-login with mock token for development (but not in tests)
    if (!stored && import.meta.env.MODE === 'development' && !import.meta.env.VITEST) {
      return 'mock-token-dev';
    }
    return stored;
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      // Auto-login with mock user (Alice) for development (but not in tests)
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITEST) {
        const mockUser = { _id: 'u1', name: 'Alice Chen', email: 'alice@uw.edu' };
        return mockUser;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync with localStorage when state changes (optional, but robust)
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
