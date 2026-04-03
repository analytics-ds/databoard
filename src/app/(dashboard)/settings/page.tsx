"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User, Key, Globe, BarChart3, Search, Satellite, UserPlus, Users, Shield } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  consultant: "Consultant",
  client: "Client",
  reader: "Lecteur",
};

export default function SettingsPage() {
  const { user, organization, isAdmin, isClient, canManageSettings } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteStatus(null);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
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

  const tabs = [
    { value: "profile", label: "Profil", icon: User },
    ...(isClient || isAdmin ? [{ value: "team", label: "Équipe", icon: Users }] : []),
    ...(canManageSettings ? [{ value: "integrations", label: "Intégrations", icon: Key }] : []),
    ...(isAdmin ? [{ value: "admin", label: "Administration", icon: Shield }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Configuration de votre compte et intégrations" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input defaultValue={user?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email || ""} type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Input value={ROLE_LABELS[user?.role || "client"] || user?.role || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Organisation</Label>
                  <Input value={organization?.name || ""} disabled />
                </div>
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" />Sauvegarder</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button variant="outline" className="gap-2"><Key className="h-4 w-4" />Mettre à jour</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team / Invitations */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inviter un utilisateur</CardTitle>
              <CardDescription>
                Invitez des collaborateurs à accéder à votre espace.
                {isClient && " Ils auront un accès en lecture seule."}
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
                  <UserPlus className="h-4 w-4" />
                  Inviter
                </Button>
              </div>
              {inviteStatus && (
                <p className={`text-sm ${inviteStatus.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {inviteStatus.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membres de l'équipe</CardTitle>
              <CardDescription>Les personnes ayant accès à ce compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Current user */}
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{ROLE_LABELS[user?.role || "client"]}</Badge>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Les utilisateurs invités apparaîtront ici une fois qu'ils auront accepté l'invitation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        {canManageSettings && (
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Google Search Console
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bientôt</Badge>
                    </CardTitle>
                    <CardDescription>Connectez vos propriétés GSC pour suivre les performances</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Connecter Google Search Console
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Globe className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Google Analytics 4
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bientôt</Badge>
                    </CardTitle>
                    <CardDescription>Connectez GA4 pour suivre le trafic et les conversions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Connecter Google Analytics 4
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Satellite className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Meteoria API (GEO Monitoring)
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bientôt</Badge>
                    </CardTitle>
                    <CardDescription>Monitoring de la visibilité dans les réponses génératives</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Clé API</Label>
                  <Input placeholder="Votre clé API Meteoria" disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admin panel */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Panel d'administration</CardTitle>
                <CardDescription>
                  Gérez les consultants, les clients et les assignations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ici vous pourrez assigner des consultants à des clients, changer les rôles des utilisateurs
                  et voir tous les comptes de la plateforme.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cette section sera activée quand vous aurez des consultants et des clients enregistrés.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
