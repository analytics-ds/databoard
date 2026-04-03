"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3, Globe, Satellite, Search, Loader2, Check, X, Unplug, Plug,
} from "lucide-react";

interface Integration {
  id: string;
  type: string;
  enabled: boolean;
  config: any;
  connectedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const INTEGRATION_TYPES = [
  {
    type: "gsc",
    name: "Google Search Console",
    description: "Connectez vos propriétés GSC pour suivre les performances de recherche",
    icon: BarChart3,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    fields: [{ key: "propertyUrl", label: "URL de la propriété", placeholder: "https://quitoque.fr/" }],
    comingSoon: true,
  },
  {
    type: "ga4",
    name: "Google Analytics 4",
    description: "Connectez GA4 pour suivre le trafic et les conversions",
    icon: Globe,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    fields: [{ key: "propertyId", label: "ID de propriété GA4", placeholder: "123456789" }],
    comingSoon: true,
  },
  {
    type: "haloscan",
    name: "Haloscan API",
    description: "Clé API Haloscan pour la recherche de mots clés et l'analyse de domaine",
    icon: Search,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    fields: [{ key: "apiKey", label: "Clé API", placeholder: "Votre clé API Haloscan" }],
    comingSoon: false,
  },
  {
    type: "meteoria",
    name: "Meteoria API (GEO Monitoring)",
    description: "Monitoring de la visibilité dans les réponses génératives (AI Overview)",
    icon: Satellite,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    fields: [{ key: "apiKey", label: "Clé API", placeholder: "Votre clé API Meteoria" }],
    comingSoon: true,
  },
];

export function IntegrationsTab() {
  const { activeClient, isReader } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const orgId = activeClient?.id;

  const fetchIntegrations = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/integrations?org_id=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    setLoading(true);
    fetchIntegrations();
  }, [fetchIntegrations]);

  async function handleConnect(type: string) {
    if (!orgId) return;
    setSaving(true);
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, type, config: formValues }),
      });
      setEditingType(null);
      setFormValues({});
      await fetchIntegrations();
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(type: string) {
    if (!orgId) return;
    setSaving(true);
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", orgId, type }),
      });
      await fetchIntegrations();
    } finally {
      setSaving(false);
    }
  }

  if (isReader) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Vous n'avez pas accès aux intégrations en tant que lecteur.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context banner */}
      <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
        Intégrations pour <span className="font-medium">{activeClient?.name}</span>
        {activeClient?.domain && <span className="text-muted-foreground"> ({activeClient.domain})</span>}
      </div>

      {INTEGRATION_TYPES.map((intType) => {
        const existing = integrations.find((i) => i.type === intType.type);
        const isEditing = editingType === intType.type;
        const Icon = intType.icon;

        return (
          <Card key={intType.type}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${intType.iconBg}`}>
                  <Icon className={`h-5 w-5 ${intType.iconColor}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {intType.name}
                    {intType.comingSoon && !existing && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bientôt</Badge>
                    )}
                    {existing && existing.enabled && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                        <Check className="h-3 w-3 mr-0.5" />Connecté
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{intType.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {existing && !isEditing ? (
                <div className="space-y-3">
                  {/* Show masked config */}
                  {intType.fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <Label className="w-32 text-xs text-muted-foreground">{field.label}</Label>
                      <span className="text-sm font-mono">{existing.config?.[field.key] || "—"}</span>
                    </div>
                  ))}
                  {existing.connectedBy && (
                    <p className="text-xs text-muted-foreground">
                      Connecté par {existing.connectedBy} le {new Date(existing.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingType(intType.type);
                        setFormValues({});
                      }}
                      className="gap-1.5"
                    >
                      <Plug className="h-3.5 w-3.5" />Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(intType.type)}
                      disabled={saving}
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unplug className="h-3.5 w-3.5" />Déconnecter
                    </Button>
                  </div>
                </div>
              ) : isEditing || (!intType.comingSoon && !existing) ? (
                <div className="space-y-3">
                  {intType.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label>{field.label}</Label>
                      <Input
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ""}
                        onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleConnect(intType.type)}
                      disabled={saving || !Object.values(formValues).some((v) => v.trim())}
                      className="gap-1.5"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Connecter
                    </Button>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={() => { setEditingType(null); setFormValues({}); }} className="gap-1.5">
                        <X className="h-3.5 w-3.5" />Annuler
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button variant="outline" disabled className="gap-2">
                  <Icon className="h-4 w-4" />
                  Connecter {intType.name}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
