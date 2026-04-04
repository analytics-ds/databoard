"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "consultant" | "client" | "reader";
  avatarUrl?: string;
}

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  logoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  clients: Organization[];
  activeClient: Organization | null;
  setActiveClient: (client: Organization) => void;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isConsultant: boolean;
  isClient: boolean;
  isReader: boolean;
  canManageSettings: boolean;
  canSwitchClients: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clients, setClients] = useState<Organization[]>([]);
  const [activeClient, setActiveClientState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrganization(data.organization);
        setClients(data.clients || []);

        // Preserve current active client on refresh (if still in the list)
        setActiveClientState((prev) => {
          if (prev && data.clients?.length > 0) {
            const stillExists = data.clients.find((c: any) => c.id === prev.id);
            if (stillExists) return stillExists;
          }

          // Set active client (first load)
          if (data.user.role === "admin" || data.user.role === "consultant") {
            if (data.clients?.length > 0) return data.clients[0];
            return data.organization;
          }
          return data.organization;
        });
      } else {
        setUser(null);
        setOrganization(null);
        // Redirect to login if not on auth pages
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
          router.push("/login");
        }
      }
    } catch {
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  function setActiveClient(client: Organization) {
    setActiveClientState(client);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrganization(null);
    router.push("/login");
  }

  const role = user?.role || "reader";
  const isAdmin = role === "admin";
  const isConsultant = role === "consultant";
  const isClient = role === "client";
  const isReader = role === "reader";
  const canManageSettings = isAdmin || isConsultant || isClient;
  const canSwitchClients = isAdmin || isConsultant;

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        clients,
        activeClient,
        setActiveClient,
        loading,
        logout,
        refresh: fetchSession,
        isAdmin,
        isConsultant,
        isClient,
        isReader,
        canManageSettings,
        canSwitchClients,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
