import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { getApiUrl } from "@/lib/query-client";

const SYNC_KEYS = [
  "mindful_moods",
  "mindful_journals",
  "mindful_meditations",
  "mindful_streak",
  "mindful_profile",
  "mindful_eating",
  "mindful_game_scores",
  "mindful_challenges",
  "mindful_week_course",
  "mindful_gratitude_tiles",
];

const AUTH_TOKEN_KEY = "mindful_auth_token";
const AUTH_USER_KEY = "mindful_auth_user";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (email: string, name: string, password: string, avatar?: string, recoveryQuestion?: string, recoveryAnswer?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, avatar: string) => Promise<void>;
  syncProgress: (data: Record<string, string>) => Promise<void>;
  loadProgress: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function apiUrl(path: string) {
  return new URL(path, getApiUrl()).toString();
}

async function authFetch(path: string, options: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string> || {}),
  };
  const res = await fetch(apiUrl(path), { ...rest, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify token is still valid in the background
          authFetch("/api/auth/me", { token: storedToken })
            .then((d) => setUser(d.user))
            .catch(() => {
              setToken(null);
              setUser(null);
              AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
            });
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  // Keep tokenRef up to date so AppState listener always has the latest token
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Auto-sync when app goes to background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        const t = tokenRef.current;
        if (t) {
          AsyncStorage.multiGet(SYNC_KEYS).then((pairs) => {
            const data: Record<string, string> = {};
            for (const [key, value] of pairs) {
              if (value !== null) data[key] = value;
            }
            if (Object.keys(data).length > 0) {
              authFetch("/api/user/sync", {
                method: "POST",
                token: t,
                body: JSON.stringify({ data }),
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  const persist = async (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    tokenRef.current = t;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, t);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
  };

  // Upload all local AsyncStorage data to server
  const uploadLocalData = async (t: string) => {
    try {
      const pairs = await AsyncStorage.multiGet(SYNC_KEYS);
      const data: Record<string, string> = {};
      for (const [key, value] of pairs) {
        if (value !== null) data[key] = value;
      }
      if (Object.keys(data).length > 0) {
        await authFetch("/api/user/sync", {
          method: "POST",
          token: t,
          body: JSON.stringify({ data }),
        });
      }
    } catch {}
  };

  // Download server data and restore into AsyncStorage
  const downloadServerData = async (t: string) => {
    try {
      const result = await authFetch("/api/user/sync", { token: t });
      const data: Record<string, string> = result.data || {};
      if (Object.keys(data).length > 0) {
        const pairs: [string, string][] = Object.entries(data);
        await AsyncStorage.multiSet(pairs);
      }
    } catch {}
  };

  const register = async (email: string, name: string, password: string, avatar = "lotus", recoveryQuestion?: string, recoveryAnswer?: string) => {
    const data = await authFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password, avatar, recoveryQuestion, recoveryAnswer }),
    });
    await persist(data.user, data.token);
    // Upload any existing local progress to the new account
    await uploadLocalData(data.token);
  };

  const login = async (email: string, password: string) => {
    const data = await authFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await persist(data.user, data.token);
    // Restore progress from server (overwrites local with cloud data)
    await downloadServerData(data.token);
  };

  const logout = async () => {
    if (token) {
      // Sync latest local data before logging out
      await uploadLocalData(token).catch(() => {});
      authFetch("/api/auth/logout", { method: "POST", token }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  };

  const updateProfile = async (name: string, avatar: string) => {
    if (!token) return;
    const data = await authFetch("/api/auth/profile", {
      method: "PUT",
      token,
      body: JSON.stringify({ name, avatar }),
    });
    setUser(data.user);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  };

  const syncProgress = useCallback(async (data: Record<string, string>) => {
    if (!token) return;
    await authFetch("/api/user/sync", {
      method: "POST",
      token,
      body: JSON.stringify({ data }),
    });
  }, [token]);

  const loadProgress = useCallback(async (): Promise<Record<string, string>> => {
    if (!token) return {};
    const data = await authFetch("/api/user/sync", { token });
    return data.data || {};
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      register, login, logout, updateProfile, syncProgress, loadProgress,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
