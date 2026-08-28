import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setApiUserId, type ApiUser } from "../api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "admin" | "user";
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; mobile: string; password: string }) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "vaahan_saarthi_user";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toAuthUser(u: ApiUser): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    role: u.role === "admin" ? "admin" : "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = loadUser();
    setUser(u);
    setApiUserId(u?.id ?? null);
    setReady(true);
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    setApiUserId(u?.id ?? null);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiUser>("/auth/login", { email, password });
    persist(toAuthUser(data));
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; mobile: string; password: string }) => {
    const { data: user } = await api.post<ApiUser>("/auth/signup", data);
    persist(toAuthUser(user));
  }, []);

  const logout = useCallback(() => persist(null), []);

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({ user, ready, isAdmin, login, signup, logout }),
    [user, ready, isAdmin, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
