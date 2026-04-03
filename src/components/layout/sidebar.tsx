"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, BOTTOM_NAV } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, Zap, Building2 } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[270px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white">Databoard</span>
            <span className="text-[9px] uppercase tracking-widest text-sidebar-foreground/50">
              by Datashake
            </span>
          </div>
        )}
      </div>

      {/* Organization info */}
      {!collapsed && organization && (
        <div className="border-b border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20">
              <Building2 className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{organization.name}</p>
              {organization.domain && (
                <p className="truncate text-[11px] text-sidebar-foreground/50">{organization.domain}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const hasChildren = item.children && item.children.length > 0;
            const isSubmenuOpen = openSubmenu === item.href || isActive;

            return (
              <li key={item.href}>
                <div className="flex items-center">
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
                      item.disabled && "pointer-events-none opacity-40"
                    )}
                    onClick={() => hasChildren && setOpenSubmenu(isSubmenuOpen ? null : item.href)}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="flex-1">{item.title}</span>}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && hasChildren && (
                      <ChevronDown className={cn("h-3 w-3 text-sidebar-foreground/40 transition-transform", isSubmenuOpen && "rotate-180")} />
                    )}
                  </Link>
                </div>

                {!collapsed && hasChildren && isSubmenuOpen && (
                  <ul className="mt-0.5 ml-5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                              isChildActive ? "text-white font-medium" : "text-sidebar-foreground/50 hover:text-white"
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-sidebar-border pt-3">
          {BOTTOM_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "px-3 py-2")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-sidebar-foreground/50 hover:text-white transition-colors" title="Déconnexion">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
