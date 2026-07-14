import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Backendless, initBackendless, isBackendlessConfigured } from "@/lib/backendless";

export type AppUser = {
  objectId: string;
  email: string;
  name?: string;
};

type AuthCtx = {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function toAppUser(raw: unknown): AppUser | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.objectId) return null;
  return {
    objectId: String(r.objectId),
    email: String(r.email ?? ""),
    name: r.name ? String(r.name) : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isBackendlessConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    initBackendless();
    (async () => {
      try {
        const raw = await (
          Backendless.UserService as unknown as {
            getCurrentUser: (reload?: boolean) => Promise<unknown>;
          }
        ).getCurrentUser(false);
        setUser(toAppUser(raw));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [configured]);

  const login = useCallback(async (email: string, password: string) => {
    initBackendless();
    const raw = await (
      Backendless.UserService as unknown as {
        login: (e: string, p: string, stayLoggedIn: boolean) => Promise<unknown>;
      }
    ).login(email, password, true);
    setUser(toAppUser(raw));
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      initBackendless();
      const BL = Backendless as unknown as {
        User: new () => Record<string, unknown>;
        UserService: {
          register: (u: unknown) => Promise<unknown>;
          login: (e: string, p: string, stay: boolean) => Promise<unknown>;
        };
      };
      const newUser = new BL.User();
      newUser.email = email;
      newUser.password = password;
      newUser.name = name;
      await BL.UserService.register(newUser);
      const raw = await BL.UserService.login(email, password, true);
      setUser(toAppUser(raw));
    },
    [],
  );

  const logout = useCallback(async () => {
    initBackendless();
    try {
      await (
        Backendless.UserService as unknown as { logout: () => Promise<void> }
      ).logout();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured, login, register, logout }),
    [user, loading, configured, login, register, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
