"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/keywords": "Suivi de mots clés",
  "/traffic": "Trafic et conversion",
  "/tools/keyword-research": "Recherche de mots clés",
  "/projects": "Suivi de projet",
  "/content": "Contenu",
  "/netlinking": "Netlinking",
  "/netlinking/campaigns": "Campagnes netlinking",
  "/alerts": "Alertes",
  "/settings": "Paramètres",
};

export function Topbar() {
  const pathname = usePathname();
  const { organization } = useAuth();

  const title = Object.entries(PAGE_TITLES).find(
    ([path]) => pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
  )?.[1] || "Databoard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {organization && (
          <p className="text-[11px] text-muted-foreground">
            {organization.name}{organization.domain ? ` · ${organization.domain}` : ""}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="h-8 w-56 bg-muted/50 pl-9 text-sm" />
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
