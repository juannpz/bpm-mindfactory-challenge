"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/services/api";
import type { AuthState, AuthUser } from "@/lib/types";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginMock: (azureObjectId: string, nombre: string, rol?: string) => Promise<void>;
  register: (data: {
    nombre: string;
    email: string;
    password: string;
    documento: string;
    organizacion: string;
  }) => Promise<{ email: string }>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = "bpm_auth";
const AUTH_COOKIE = "bpm_token";

function setAuthCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${AUTH_COOKIE}=${token}; expires=${expires}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }
}

function loadStoredAuth(): AuthState {
  if (typeof window === "undefined") return { user: null, token: null, isAuthenticated: false };
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, isAuthenticated: !!parsed.token };
    }
  } catch {
    // ignore
  }
  return { user: null, token: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadStoredAuth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      setAuthCookie(auth.token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthCookie(null);
    }
  }, [auth]);

  useEffect(() => {
    if (auth.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
      delete api.defaults.headers.common["X-Mock-User-Id"];
    } else {
      delete api.defaults.headers.common["Authorization"];
      delete api.defaults.headers.common["X-Mock-User-Id"];
    }
  }, [auth.token]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/external/login", { email, password });
    const user: AuthUser = {
      id: data.usuario.id,
      nombre: data.usuario.nombre,
      email: data.usuario.email,
      tipo: "EXTERNO",
    };
    const token = data.token;
    setAuthCookie(token);
    setAuth({ user, token, isAuthenticated: true });
  }, []);

  const loginMock = useCallback(async (azureObjectId: string, nombre: string, rol?: string) => {
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "false") {
      // Production mode: use MSAL
      const { msalInstance, loginRequest } = await import("@/lib/msal-config");
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        const token = response.accessToken;
        setAuthCookie(token);
        setAuth({
          user: null,
          token,
          isAuthenticated: true,
        });
      }
      return;
    }

    // Mock mode: call internal login endpoint
    const { data } = await api.post("/auth/internal/login", {
      azureObjectId,
    });
    const user: AuthUser = {
      id: data.usuario.id,
      nombre: data.usuario.nombre,
      email: data.usuario.email,
      tipo: "INTERNO",
      rol: data.usuario.rol || rol,
      areaId: data.usuario.areaId,
    };
    const token = data.access_token || data.token;
    setAuthCookie(token);
    setAuth({ user, token, isAuthenticated: true });
  }, []);

  const register = useCallback(
    async (data: {
      nombre: string;
      email: string;
      password: string;
      documento: string;
      organizacion: string;
    }) => {
      const res = await api.post("/auth/external/register", data);
      const user: AuthUser = {
        id: res.data.usuario.id,
        nombre: res.data.usuario.nombre,
        email: res.data.usuario.email,
        tipo: "EXTERNO",
      };
      const token = res.data.token;
      setAuthCookie(token);
      setAuth({ user, token, isAuthenticated: true });
      return { email: res.data.usuario.email };
    },
    [],
  );

  const fetchMe = useCallback(async () => {
    if (!auth.token) return;
    try {
      const res = await api.get("/auth/me");
      if (res.data) {
        setAuth((prev) => ({
          ...prev,
          user: {
            id: res.data.id,
            nombre: res.data.nombre,
            email: res.data.email,
            tipo: res.data.tipo,
            rol: res.data.rol,
            areaId: res.data.areaId,
          },
        }));
      }
    } catch {
      // token invalid, do nothing
    }
  }, [auth.token]);

  const logout = useCallback(() => {
    setAuth({ user: null, token: null, isAuthenticated: false });
  }, []);

  useEffect(() => {
    if (!initialized && auth.isAuthenticated) {
      setInitialized(true);
      if (auth.user?.tipo === "INTERNO") {
        fetchMe();
      }
    }
  }, [auth.isAuthenticated, auth.user?.tipo, fetchMe, initialized]);

  return (
    <AuthContext.Provider value={{ ...auth, login, loginMock, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
