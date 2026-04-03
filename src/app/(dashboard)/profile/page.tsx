"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Key, Camera, Trash2 } from "lucide-react";

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
  const { user, organization, refresh } = useAuth();
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

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Mon profil" description="Gérez vos informations personnelles" />

      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>Votre photo sera visible par votre équipe</CardDescription>
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
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nom complet</Label><Input defaultValue={user?.name || ""} /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} type="email" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Rôle</Label><Input value={ROLE_LABELS[user?.role || "client"] || user?.role || ""} disabled /></div>
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
          <Button variant="outline" className="gap-2"><Key className="h-4 w-4" />Mettre à jour</Button>
        </CardContent>
      </Card>
    </div>
  );
}
