import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  defaultOrganizationId: string | null;
}

interface Organization {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: Date;
  invitedBy: string | null;
  organizationName: string;
}

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setOrganizations([]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
    setOrganizations(data.organizations || []);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const register = async (registerData: RegisterData) => {
    const response = await apiRequest('POST', '/api/auth/register', registerData);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    setOrganizations([{
      id: '',
      userId: data.user.id,
      organizationId: data.organization.id,
      role: 'owner',
      joinedAt: new Date(),
      invitedBy: null,
      organizationName: data.organization.name,
    }]);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setOrganizations([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
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
