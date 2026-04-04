import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/shared/lib/api";
import type {
  AuthResponse,
  MessageResponse,
  UserProfile,
} from "@/shared/types/api";

const TOKEN_STORAGE_KEY = "flim_access_token";

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  startRegistration: (payload: { email: string }) => Promise<MessageResponse>;
  completeRegistration: (payload: {
    verificationToken: string;
    fullName: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(data: AuthResponse | null) {
  if (!data) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsReady(true);
      return;
    }

    setToken(storedToken);
    api
      .me(storedToken)
      .then((nextUser) => setUser(nextUser))
      .catch(() => {
        persistAuth(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    persistAuth(data);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isReady,
      async login(payload) {
        const data = await api.login(payload);
        handleAuthSuccess(data);
      },
      async startRegistration(payload) {
        return api.startRegistration(payload);
      },
      async completeRegistration(payload) {
        const data = await api.completeRegistration(payload);
        handleAuthSuccess(data);
      },
      logout() {
        persistAuth(null);
        setToken(null);
        setUser(null);
      },
      async refreshMe() {
        if (!token) {
          return;
        }
        const nextUser = await api.me(token);
        setUser(nextUser);
      },
    }),
    [isReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
