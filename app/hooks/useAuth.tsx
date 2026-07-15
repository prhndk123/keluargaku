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
  alias?: string;
  role?: string;
  photoUrl?: string;
};

type AuthCtx = {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  login: (alias: string, password: string) => Promise<void>;
  register: (name: string, alias: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isBackendlessConfigured();

  useEffect(() => {
    if (configured) {
      initBackendless();
    }
    const saved = localStorage.getItem("keluargaku_user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, [configured]);

  const login = useCallback(async (alias: string, password: string) => {
    initBackendless();
    const query = (Backendless as any).DataQueryBuilder.create()
      .setWhereClause(`alias = '${alias}' AND password = '${password}'`);
    const results = await Backendless.Data.of("Members").find(query);
    if (!results || results.length === 0) {
      throw new Error("Nama panggilan atau kata sandi salah.");
    }
    const member = results[0] as any;
    const appUser: AppUser = {
      objectId: member.objectId,
      email: (member.alias || "member") + "@keluarga.local",
      name: member.name,
      alias: member.alias,
      role: member.role,
      photoUrl: member.photoUrl,
    };
    setUser(appUser);
    localStorage.setItem("keluargaku_user", JSON.stringify(appUser));
  }, []);

  const register = useCallback(
    async (name: string, alias: string, password: string) => {
      initBackendless();
      const newMember = {
        name,
        alias,
        password,
        role: "Kepala Keluarga",
        birthDate: Date.now(),
      };
      const saved = await Backendless.Data.of("Members").save(newMember) as any;
      const appUser: AppUser = {
        objectId: saved.objectId,
        email: (saved.alias || "member") + "@keluarga.local",
        name: saved.name,
        alias: saved.alias,
        role: saved.role,
        photoUrl: saved.photoUrl,
      };
      setUser(appUser);
      localStorage.setItem("keluargaku_user", JSON.stringify(appUser));
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("keluargaku_user");
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
