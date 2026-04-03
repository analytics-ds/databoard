"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Key, Camera, Trash2, User, Shield, Building2 } from "lucide-react";
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
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes projets</CardTitle>
                <CardDescription>
                  {isAdmin ? "Tous les projets de la plateforme" : "Les projets auxquels vous etes assigne"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun projet assigne</p>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            {client.domain && <p className="text-xs text-muted-foreground">{client.domain}</p>}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Projet</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
