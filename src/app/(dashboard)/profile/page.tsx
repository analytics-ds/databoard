"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Key, Camera, Trash2, User, Shield, Building2, Search, Loader2, Link2, Unlink, ChevronDown } from "lucide-react";
import { AdminPanel } from "@/components/admin/admin-panel";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Propriétaire",
  reader: "Lecteur",
};

function compressImage(file: File, maxSize: number = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; } }
        else { if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; } }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, organization, clients, isAdmin, isConsultant, refresh } = useAuth();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarLoading(true);
    try {
      const dataUrl = await compressImage(file, 128);
      const res = await fetch("/api/avatar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: dataUrl }) });
      if (res.ok) await refresh();
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    setAvatarLoading(true);
    try {
      const res = await fetch("/api/avatar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: null }) });
      if (res.ok) await refresh();
    } finally { setAvatarLoading(false); }
  }

  const tabs = [
    { value: "profile", label: "Profil", icon: User },
    ...((isConsultant || isAdmin) ? [{ value: "projects", label: "Mes projets", icon: Building2 }] : []),
    ...(isAdmin ? [{ value: "admin", label: "Administration", icon: Shield }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mon profil" description="Espace personnel et administration" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>Votre photo sera visible par votre equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-400 text-xl font-bold text-white ring-2 ring-border">{initials}</div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={avatarLoading} className="gap-2">
                      <Camera className="h-4 w-4" />{user?.avatarUrl ? "Changer" : "Ajouter une photo"}
                    </Button>
                    {user?.avatarUrl && (
                      <Button variant="outline" size="sm" onClick={handleAvatarRemove} disabled={avatarLoading} className="gap-2 text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />Supprimer
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. 2 Mo max.</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom complet</Label><Input defaultValue={user?.name || ""} /></div>
                <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} type="email" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Role</Label><Input value={ROLE_LABELS[user?.role || "client"] || user?.role || ""} disabled /></div>
                <div className="space-y-2"><Label>Organisation</Label><Input value={organization?.name || ""} disabled /></div>
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" />Sauvegarder</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Changer le mot de passe</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Mot de passe actuel</Label><Input type="password" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nouveau mot de passe</Label><Input type="password" /></div>
                <div className="space-y-2"><Label>Confirmer</Label><Input type="password" /></div>
              </div>
              <Button variant="outline" className="gap-2"><Key className="h-4 w-4" />Mettre a jour</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {(isConsultant || isAdmin) && (
          <TabsContent value="projects">
            <ProjectsTab isAdmin={isAdmin} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ProjectsTab({ isAdmin }: { isAdmin: boolean }) {
  const { clients } = useAuth();
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
        setAllOrgs(data.organizations || []);
        setAssignments(data.assignments || []);
      }
    } catch {} finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const projects = isAdmin
    ? allOrgs.filter((o) => o.name !== "datashake")
    : clients;

  const consultants = allUsers.filter((u) => u.role === "consultant");

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.domain || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAssign(consultantId: string, orgId: string) {
    setActionLoading(`assign-${consultantId}-${orgId}`);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", consultantId, orgId }),
      });
      await fetchData();
    } finally { setActionLoading(null); }
  }

  async function handleUnassign(consultantId: string, orgId: string) {
    setActionLoading(`unassign-${consultantId}-${orgId}`);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unassign", consultantId, orgId }),
      });
      await fetchData();
    } finally { setActionLoading(null); }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes projets</CardTitle>
              <CardDescription>{filtered.length} projet{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucun projet trouve</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((project) => {
                const isExpanded = expandedProject === project.id;
                const projectAssignments = assignments.filter((a) => a.org_id === project.id);
                const assignedConsultants = consultants.filter((c) =>
                  projectAssignments.some((a: any) => a.consultant_id === c.id)
                );
                const unassignedConsultants = consultants.filter((c) =>
                  !projectAssignments.some((a: any) => a.consultant_id === c.id)
                );

                return (
                  <div key={project.id} className="rounded-lg border border-border">
                    <button
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          {project.domain && <p className="text-xs text-muted-foreground">{project.domain}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && assignedConsultants.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            {assignedConsultants.length} consultant{assignedConsultants.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {isAdmin && (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </button>

                    {isAdmin && isExpanded && (
                      <div className="border-t border-border px-4 py-3 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Consultants assignes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {assignedConsultants.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleUnassign(c.id, project.id)}
                              disabled={actionLoading === `unassign-${c.id}-${project.id}`}
                              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
                              title="Retirer"
                            >
                              {actionLoading === `unassign-${c.id}-${project.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  {c.avatar_url ? (
                                    <img src={c.avatar_url} alt={c.name} className="h-4 w-4 rounded-full object-cover" />
                                  ) : null}
                                  {c.name}
                                  <Unlink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-red-500" />
                                </>
                              )}
                            </button>
                          ))}

                          {unassignedConsultants.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={() => setAssignDropdown(assignDropdown === project.id ? null : project.id)}
                                className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                              >
                                <Link2 className="h-3 w-3" />Ajouter
                              </button>
                              {assignDropdown === project.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setAssignDropdown(null)} />
                                  <div className="absolute left-0 top-full z-50 mt-1 w-52 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                                    {unassignedConsultants.map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() => { handleAssign(c.id, project.id); setAssignDropdown(null); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                                      >
                                        {c.avatar_url ? (
                                          <img src={c.avatar_url} alt={c.name} className="h-5 w-5 rounded-full object-cover" />
                                        ) : (
                                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                                            {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                          </div>
                                        )}
                                        <span className="truncate">{c.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {assignedConsultants.length === 0 && unassignedConsultants.length === 0 && (
                            <p className="text-xs text-muted-foreground">Aucun consultant disponible</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
