"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Key, UserPlus, Users, Shield, Building2, Loader2, Trash2, Crown, Star, Plus, X, Phone, Mail, User, Camera, ImageIcon } from "lucide-react";
import { AdminPanel } from "@/components/admin/admin-panel";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

          <LogoCard orgId={activeClient?.id} currentLogoUrl={activeClient?.logoUrl || null} readOnly={isReader} />
          <ContactsCard orgId={activeClient?.id} readOnly={isReader} />
          <NotesCard orgId={activeClient?.id} readOnly={isReader} />
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

function canRemoveMember(actorRole: string, targetRole: string): boolean {
  const hierarchy: Record<string, string[]> = {
    admin: ["consultant", "client", "reader"],
    consultant: ["client", "reader"],
    client: ["reader"],
    reader: [],
  };
  return (hierarchy[actorRole] || []).includes(targetRole);
}

function ProjectTeamCard({ projectName, orgId, currentUserId }: { projectName: string; orgId?: string; currentUserId?: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentRole = user?.role || "reader";

  function fetchMembers() {
    if (!orgId) return;
    setLoading(true);
    fetch(`/api/project-team?org_id=${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members || []);
        setCreatedBy(data.createdBy || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  async function handleRemove(targetUserId: string) {
    setActionLoading(targetUserId);
    try {
      const res = await fetch("/api/team-manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, orgId }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTransferOwnership(targetUserId: string) {
    setActionLoading(`transfer-${targetUserId}`);
    try {
      const res = await fetch("/api/team-manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer_ownership", targetUserId, orgId }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres du projet</CardTitle>
        <CardDescription>Toutes les personnes ayant accès à {projectName}</CardDescription>
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
              const isCurrentUser = m.id === currentUserId;
              const isPrincipal = m.id === createdBy;
              const showRemove = !isCurrentUser && canRemoveMember(currentRole, m.role) && !isPrincipal;
              const showTransfer = !isCurrentUser && currentRole === "client" && m.role !== "admin";

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
                        {isCurrentUser && <span className="ml-1.5 text-[10px] text-muted-foreground">(vous)</span>}
                        {isPrincipal && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                            <Star className="h-3 w-3" />Créateur
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showTransfer && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              disabled={actionLoading === `transfer-${m.id}`}
                            />
                          }
                        >
                          {actionLoading === `transfer-${m.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Crown className="h-3.5 w-3.5" />
                          )}
                          Rendre propriétaire
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Transférer la propriété</AlertDialogTitle>
                            <AlertDialogDescription>
                              Vous êtes sur le point de rendre <strong>{m.name}</strong> propriétaire de ce projet.
                              {isPrincipal ? "" : " Vous resterez le propriétaire principal en tant que créateur du projet."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleTransferOwnership(m.id)}>
                              Confirmer le transfert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {showRemove && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={actionLoading === m.id}
                            />
                          }
                        >
                          {actionLoading === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Retirer
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retirer ce membre</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir retirer <strong>{m.name}</strong> ({ROLE_LABELS[m.role]}) du projet ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(m.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Retirer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Badge className={ROLE_COLORS[m.role] || "bg-gray-100 text-gray-700"}>{ROLE_LABELS[m.role]}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LogoCard({ orgId, currentLogoUrl, readOnly }: { orgId?: string; currentLogoUrl: string | null; readOnly: boolean }) {
  const { refresh } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 256);
      const res = await fetch("/api/org-logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, logoUrl: dataUrl }),
      });
      if (res.ok) {
        setLogoUrl(dataUrl);
        await refresh();
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!orgId) return;
    setUploading(true);
    try {
      const res = await fetch("/api/org-logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, logoUrl: null }),
      });
      if (res.ok) {
        setLogoUrl(null);
        await refresh();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />Logo de l'entreprise
        </CardTitle>
        <CardDescription>Le logo sera affiché dans le tableau de bord et la barre supérieure</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
          {!readOnly && (
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                {logoUrl ? "Changer le logo" : "Ajouter un logo"}
              </Button>
              {logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />Supprimer
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Max 2 Mo.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContactsCard({ orgId, readOnly }: { orgId?: string; readOnly: boolean }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetch(`/api/org-details?org_id=${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        setContacts(data.contacts || []);
        setDirty(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  function updateContact(index: number, field: keyof Contact, value: string) {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
    setDirty(true);
  }

  function addContact() {
    setContacts([...contacts, { name: "", role: "", email: "", phone: "" }]);
    setDirty(true);
  }

  function removeContact(index: number) {
    setContacts(contacts.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    try {
      await fetch("/api/org-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, contacts }),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4" />Points de contact
            </CardTitle>
            <CardDescription>Contacts clés du projet visibles par toute l'équipe</CardDescription>
          </div>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addContact} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun point de contact ajouté.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nom</Label>
                    <Input
                      placeholder="Jean Dupont"
                      value={c.name}
                      onChange={(e) => updateContact(i, "name", e.target.value)}
                      disabled={readOnly}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fonction</Label>
                    <Input
                      placeholder="Directeur marketing"
                      value={c.role}
                      onChange={(e) => updateContact(i, "role", e.target.value)}
                      disabled={readOnly}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      placeholder="jean@exemple.fr"
                      value={c.email}
                      onChange={(e) => updateContact(i, "email", e.target.value)}
                      disabled={readOnly}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Téléphone</Label>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      value={c.phone}
                      onChange={(e) => updateContact(i, "phone", e.target.value)}
                      disabled={readOnly}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(i)}
                      className="h-7 gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />Supprimer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && dirty && (
          <div className="mt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder les contacts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesCard({ orgId, readOnly }: { orgId?: string; readOnly: boolean }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetch(`/api/org-details?org_id=${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        setNotes(data.notes || "");
        setDirty(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    try {
      await fetch("/api/org-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, notes }),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />Informations générales
        </CardTitle>
        <CardDescription>Notes et informations partagées visibles par toute l'équipe du projet</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Ajoutez des informations générales sur le projet, le client, les contraintes particulières..."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
              disabled={readOnly}
              rows={6}
              className="resize-y"
            />
            {!readOnly && dirty && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Sauvegarder
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
