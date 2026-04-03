"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Key, UserPlus, Users, Shield, Building2, Loader2 } from "lucide-react";
import { AdminPanel } from "@/components/admin/admin-panel";
import { IntegrationsTab } from "@/components/settings/integrations-tab";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Propriétaire",
  reader: "Lecteur",
};

export default function SettingsPage() {
  const { user, organization, activeClient, isAdmin, isReader, canManageSettings } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteStatus(null);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, orgId: activeClient?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteStatus({ ok: true, message: `Invitation envoyée à ${inviteEmail}` });
        setInviteEmail("");
      } else {
        setInviteStatus({ ok: false, message: data.error || "Erreur" });
      }
    } catch {
      setInviteStatus({ ok: false, message: "Erreur réseau" });
    } finally {
      setInviteLoading(false);
    }
  }

  const projectName = activeClient?.name || organization?.name || "Projet";

  const tabs = [
    { value: "general", label: "Général", icon: Building2 },
    ...(!isReader ? [{ value: "team", label: "Équipe", icon: Users }] : []),
    ...(canManageSettings ? [{ value: "integrations", label: "Intégrations", icon: Key }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Paramètres — ${projectName}`}
        description={`Configuration du projet ${activeClient?.domain ? `(${activeClient.domain})` : ""}`}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General — project info */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
              <CardDescription>Nom, domaine et informations générales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du projet</Label>
                  <Input defaultValue={projectName} />
                </div>
                <div className="space-y-2">
                  <Label>Domaine</Label>
                  <Input defaultValue={activeClient?.domain || ""} placeholder="exemple.fr" />
                </div>
              </div>
              <Button className="gap-2" disabled={isReader}>
                <Save className="h-4 w-4" />Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        {!isReader && (
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inviter au projet</CardTitle>
                <CardDescription>
                  Ajoutez des collaborateurs au projet « {projectName} ».
                  Les nouveaux invités auront un accès en lecture seule.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="nom@exemple.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleInvite} disabled={inviteLoading} className="gap-2">
                    <UserPlus className="h-4 w-4" />Inviter
                  </Button>
                </div>
                {inviteStatus && (
                  <p className={`text-sm ${inviteStatus.ok ? "text-emerald-600" : "text-red-500"}`}>
                    {inviteStatus.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <ProjectTeamCard projectName={projectName} orgId={activeClient?.id} currentUserId={user?.id} />
          </TabsContent>
        )}

        {/* Integrations — per org/project */}
        {canManageSettings && (
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  consultant: "bg-blue-100 text-blue-700",
  client: "bg-emerald-100 text-emerald-700",
  reader: "bg-gray-100 text-gray-700",
};

function ProjectTeamCard({ projectName, orgId, currentUserId }: { projectName: string; orgId?: string; currentUserId?: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetch(`/api/project-team?org_id=${orgId}`)
      .then((r) => r.json())
      .then((data) => setMembers(data.members || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres du projet</CardTitle>
        <CardDescription>Toutes les personnes ayant acces a {projectName}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun membre</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const initials = m.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              return (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {m.name}
                        {m.id === currentUserId && <span className="ml-1.5 text-[10px] text-muted-foreground">(vous)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <Badge className={ROLE_COLORS[m.role] || "bg-gray-100 text-gray-700"}>{ROLE_LABELS[m.role]}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
