"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, Building2, Link2, Search, ChevronDown, Loader2, Check, RefreshCw,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Propriétaire",
  reader: "Lecteur",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  consultant: "bg-blue-100 text-blue-700",
  client: "bg-emerald-100 text-emerald-700",
  reader: "bg-gray-100 text-gray-700",
};

const ALL_ROLES = ["admin", "consultant", "client", "reader"] as const;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  org_id: string;
  org_name: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
}

interface Assignment {
  consultant_id: string;
  org_id: string;
}

export function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setOrganizations(data.organizations || []);
        setAssignments(data.assignments || []);
        setLastRefresh(new Date());
      }
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function manualRefresh() {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick() { setRoleDropdownOpen(null); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_role", userId, role }),
      });
      await fetchData(true);
    } finally {
      setActionLoading(null);
      setRoleDropdownOpen(null);
    }
  }

  async function toggleAssignment(consultantId: string, orgId: string, isAssigned: boolean) {
    const key = `${consultantId}-${orgId}`;
    setActionLoading(key);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isAssigned ? "unassign" : "assign",
          consultantId,
          orgId,
        }),
      });
      await fetchData(true);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.org_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const consultants = users.filter((u) => u.role === "consultant");
  const clientOrgs = organizations.filter((o) => o.name !== "datashake");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Utilisateurs", value: users.length, icon: Users },
          { label: "Organisations", value: organizations.length, icon: Building2 },
          { label: "Consultants", value: consultants.length, icon: Users },
          { label: "Assignations", value: assignments.length, icon: Link2 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tous les utilisateurs</CardTitle>
              <CardDescription>{users.length} comptes enregistrés</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={manualRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                Actualiser
              </button>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_1fr_130px_1fr_90px] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>Utilisateur</span>
              <span>Email</span>
              <span>Rôle</span>
              <span>Organisation</span>
              <span>Inscrit le</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const isCurrentUser = u.id === user?.id;

                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1fr_1fr_130px_1fr_90px] items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {initials}
                        </div>
                      )}
                      <span className="truncate text-sm font-medium">
                        {u.name}
                        {isCurrentUser && <span className="ml-1 text-[10px] text-muted-foreground">(vous)</span>}
                      </span>
                    </div>

                    <span className="truncate text-sm text-muted-foreground">{u.email}</span>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      {isCurrentUser ? (
                        <Badge className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      ) : (
                        <>
                          <button
                            onClick={() => setRoleDropdownOpen(roleDropdownOpen === u.id ? null : u.id)}
                            className="flex items-center gap-1"
                            disabled={actionLoading === u.id}
                          >
                            <Badge className={`${ROLE_COLORS[u.role]} cursor-pointer hover:opacity-80`}>
                              {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : ROLE_LABELS[u.role]}
                            </Badge>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>

                          {roleDropdownOpen === u.id && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg">
                              {ALL_ROLES.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleSetRole(u.id, role)}
                                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg ${
                                    u.role === role ? "font-medium text-primary" : ""
                                  }`}
                                >
                                  <span className={`h-2 w-2 rounded-full ${ROLE_COLORS[role].split(" ")[0]}`} />
                                  {ROLE_LABELS[role]}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <span className="truncate text-sm text-muted-foreground">{u.org_name || "—"}</span>

                    <span className="text-[11px] text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consultant ↔ Client matrix */}
      {consultants.length > 0 && clientOrgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignation des consultants</CardTitle>
            <CardDescription>
              Cochez/décochez pour assigner un consultant à un client. Les modifications sont instantanées et synchronisées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground min-w-[200px]">
                      Client
                    </th>
                    {consultants.map((c) => (
                      <th key={c.id} className="px-3 py-2.5 text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt={c.name} className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                              {c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <span className="text-[11px] font-medium text-foreground leading-tight">{c.name.split(" ")[0]}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground min-w-[60px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientOrgs.map((org) => {
                    const assignedConsultantCount = assignments.filter((a) => a.org_id === org.id).length;
                    return (
                      <tr key={org.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{org.name}</p>
                              {org.domain && <p className="truncate text-[10px] text-muted-foreground">{org.domain}</p>}
                            </div>
                          </div>
                        </td>
                        {consultants.map((c) => {
                          const isAssigned = assignments.some(
                            (a) => a.consultant_id === c.id && a.org_id === org.id
                          );
                          const key = `${c.id}-${org.id}`;
                          const isLoading = actionLoading === key;

                          return (
                            <td key={c.id} className="px-3 py-2 text-center">
                              <button
                                onClick={() => toggleAssignment(c.id, org.id, isAssigned)}
                                disabled={isLoading}
                                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-all ${
                                  isAssigned
                                    ? "border-primary bg-primary text-white hover:bg-primary/80"
                                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isAssigned ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : null}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-medium ${assignedConsultantCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {assignedConsultantCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary row */}
                  <tr className="bg-muted/30">
                    <td className="sticky left-0 z-10 bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Total clients
                    </td>
                    {consultants.map((c) => {
                      const count = assignments.filter((a) => a.consultant_id === c.id).length;
                      return (
                        <td key={c.id} className="px-3 py-2 text-center">
                          <span className={`text-xs font-bold ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs font-bold text-primary">{assignments.length}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
