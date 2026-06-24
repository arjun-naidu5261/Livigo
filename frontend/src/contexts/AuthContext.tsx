import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken } from "@/lib/api";
import type { AppRole, AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  profile: { full_name: string | null; phone: string | null; avatar_url: string | null } | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = user
    ? { full_name: user.full_name, phone: user.phone, avatar_url: user.avatar_url }
    : null;
  const roles = user?.roles || [];

  const loadUser = async () => {
    try {
      const { user: currentUser } = await api.auth.me();
      setUser(currentUser);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { token, user: newUser } = await api.auth.signUp({
      email,
      password,
      full_name: fullName,
      role,
    });
    setToken(token);
    setUser(newUser);
    return newUser;
  };

  const signIn = async (email: string, password: string) => {
    const { token, user: signedInUser } = await api.auth.signIn({ email, password });
    setToken(token);
    setUser(signedInUser);
    return signedInUser;
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
