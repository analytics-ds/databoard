"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, Building2, Link2, Unlink, Search, ChevronDown, Loader2, RefreshCw,
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
  const [assignDropdownOpen, setAssignDropdownOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setOrganizations(data.organizations || []);
        setAssignments(data.assignments || []);
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

  async function handleSetRole(userId: string, role: string) {
    setRoleDropdownOpen(null);
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
    }
  }

  async function handleAssign(consultantId: string, orgId: string) {
    setAssignDropdownOpen(null);
    setActionLoading(`assign-${consultantId}-${orgId}`);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", consultantId, orgId }),
      });
      await fetchData(true);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnassign(consultantId: string, orgId: string) {
    setActionLoading(`unassign-${consultantId}-${orgId}`);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unassign", consultantId, orgId }),
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
            <div className="grid grid-cols-[1fr_1fr_140px_1fr_90px] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                    className="grid grid-cols-[1fr_1fr_140px_1fr_90px] items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-muted/30 transition-colors"
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

                    {/* Role selector — uses select-like pattern, no global listener */}
                    <div className="relative">
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
                            <>
                              {/* Backdrop to close dropdown */}
                              <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(null)} />
                              <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg">
                                {ALL_ROLES.map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleSetRole(u.id, role)}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg ${
                                      u.role === role ? "font-medium text-primary" : ""
                                    }`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${ROLE_COLORS[role].split(" ")[0]}`} />
                                    {ROLE_LABELS[role]}
                                  </button>
                                ))}
                              </div>
                            </>
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

      {/* Consultant assignments — chip-based per consultant */}
      {consultants.length > 0 && clientOrgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignation des consultants</CardTitle>
            <CardDescription>
              Gérez quels consultants ont accès à quels clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultants.map((consultant) => {
                const assignedOrgIds = assignments
                  .filter((a) => a.consultant_id === consultant.id)
                  .map((a) => a.org_id);
                const assignedOrgs = clientOrgs.filter((o) => assignedOrgIds.includes(o.id));
                const unassignedOrgs = clientOrgs.filter((o) => !assignedOrgIds.includes(o.id));

                return (
                  <div key={consultant.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {consultant.avatar_url ? (
                        <img src={consultant.avatar_url} alt={consultant.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {consultant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{consultant.name}</p>
                        <p className="text-xs text-muted-foreground">{consultant.email}</p>
                      </div>
                      <Badge className="ml-auto bg-blue-100 text-blue-700">
                        {assignedOrgs.length} client{assignedOrgs.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {assignedOrgs.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleUnassign(consultant.id, org.id)}
                          disabled={actionLoading === `unassign-${consultant.id}-${org.id}`}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
                          title="Cliquer pour retirer"
                        >
                          {actionLoading === `unassign-${consultant.id}-${org.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Building2 className="h-3 w-3" />
                              {org.name}
                              <Unlink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
                            </>
                          )}
                        </button>
                      ))}

                      {unassignedOrgs.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setAssignDropdownOpen(assignDropdownOpen === consultant.id ? null : consultant.id)
                            }
                            className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Link2 className="h-3 w-3" />
                            Ajouter
                          </button>

                          {assignDropdownOpen === consultant.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setAssignDropdownOpen(null)} />
                              <div className="absolute left-0 top-full z-50 mt-1 w-52 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                                {unassignedOrgs.map((org) => (
                                  <button
                                    key={org.id}
                                    onClick={() => handleAssign(consultant.id, org.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">{org.name}</span>
                                    {org.domain && (
                                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{org.domain}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
