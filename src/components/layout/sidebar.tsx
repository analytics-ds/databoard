"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, BOTTOM_NAV, CONSULTANT_NAV } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, Building2, Check } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, activeClient, clients, setActiveClient, canSwitchClients, isAdmin, isConsultant, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

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
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-3">
        <Image
          src="/datashake-icon.jpeg"
          alt="Datashake"
          width={30}
          height={30}
          className="shrink-0 rounded-md"
        />
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-white">Databoard</span>
            <span className="text-[8px] uppercase tracking-[0.15em] text-sidebar-foreground/40">
              by datashake
            </span>
          </div>
        )}
      </div>

      {/* Client selector */}
      {!collapsed && (
        <div className="border-b border-sidebar-border px-2.5 py-2">
          {canSwitchClients && clients.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="flex w-full items-center gap-2 rounded-md bg-sidebar-accent px-2.5 py-2 text-left hover:bg-sidebar-accent/80 transition-colors"
              >
                {activeClient?.logoUrl ? (
                  <img src={activeClient.logoUrl} alt={activeClient.name} className="h-7 w-7 shrink-0 rounded-md object-contain bg-white p-0.5" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/20">
                    <Building2 className="h-3.5 w-3.5 text-sidebar-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{activeClient?.name || "Sélectionner"}</p>
                  {activeClient?.domain && (
                    <p className="truncate text-[10px] text-sidebar-foreground/50">{activeClient.domain}</p>
                  )}
                </div>
                <ChevronDown className={cn("h-3 w-3 shrink-0 text-sidebar-foreground/40 transition-transform", clientDropdownOpen && "rotate-180")} />
              </button>

              {clientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-sidebar-border bg-sidebar shadow-xl">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => { setActiveClient(client); setClientDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sidebar-accent/50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt={client.name} className="h-6 w-6 shrink-0 rounded object-contain bg-white p-0.5" />
                      ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sidebar-primary/20">
                          <Building2 className="h-3 w-3 text-sidebar-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-white">{client.name}</p>
                        {client.domain && <p className="truncate text-[10px] text-sidebar-foreground/50">{client.domain}</p>}
                      </div>
                      {client.id === activeClient?.id && (
                        <Check className="h-4 w-4 shrink-0 text-sidebar-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-2.5 py-2">
              {(activeClient?.logoUrl || organization?.logoUrl) ? (
                <img src={(activeClient?.logoUrl || organization?.logoUrl)!} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain bg-white p-0.5" />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/20">
                  <Building2 className="h-3.5 w-3.5 text-sidebar-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">{activeClient?.name || organization?.name}</p>
                {(activeClient?.domain || organization?.domain) && (
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{activeClient?.domain || organization?.domain}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consultant overview link */}
      {!collapsed && (isAdmin || isConsultant) && (
        <div className="border-b border-sidebar-border px-2.5 py-1.5">
          <Link
            href={CONSULTANT_NAV.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              pathname === CONSULTANT_NAV.href
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
            )}
          >
            <CONSULTANT_NAV.icon className="h-4 w-4 shrink-0" />
            <span>{CONSULTANT_NAV.title}</span>
          </Link>
        </div>
      )}

      {/* Navigation — scrollable when content overflows */}
      <nav className="flex-1 flex flex-col justify-between px-2.5 py-2 overflow-y-auto min-h-0">
        <div>
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className={cn(sIdx > 0 && "mt-3")}>
              {!collapsed && section.label && (
                <p className="mb-1 px-2.5 text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                  {section.label}
                </p>
              )}
              {collapsed && sIdx > 0 && (
                <div className="mx-2.5 mb-1.5 border-t border-sidebar-border" />
              )}

              <ul className="space-y-px">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const hasChildren = item.children && item.children.length > 0;
                  const isSubmenuOpen = openSubmenu === item.href || isActive;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.disabled ? "#" : (hasChildren ? item.children![0].href : item.href)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
                          item.disabled && "pointer-events-none opacity-40"
                        )}
                        onClick={(e) => {
                          if (hasChildren) {
                            e.preventDefault();
                            setOpenSubmenu(isSubmenuOpen ? null : item.href);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {!collapsed && item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                        {!collapsed && hasChildren && (
                          <ChevronDown className={cn("h-3 w-3 text-sidebar-foreground/40 transition-transform", isSubmenuOpen && "rotate-180")} />
                        )}
                      </Link>

                      {!collapsed && hasChildren && isSubmenuOpen && (
                        <ul className="mt-px ml-4 space-y-px border-l border-sidebar-border pl-2.5">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "block rounded-md px-2.5 py-1 text-[12px] transition-colors",
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
            </div>
          ))}
        </div>

        {/* Bottom nav pinned at bottom of nav area */}
        <div className="border-t border-sidebar-border pt-2 mt-2">
          {BOTTOM_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.title}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User profile — compact */}
      <div className="border-t border-sidebar-border px-2.5 py-2">
        <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "px-2.5")}>
          <Link href="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 group">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-transparent group-hover:ring-sidebar-primary/50 transition-all"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-blue-400 text-[11px] font-bold text-white group-hover:ring-2 group-hover:ring-sidebar-primary/50 transition-all">
                {initials}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium text-white group-hover:text-sidebar-primary transition-colors">{user?.name}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/40 capitalize">{user?.role}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button onClick={logout} className="text-sidebar-foreground/40 hover:text-white transition-colors" title="Déconnexion">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
