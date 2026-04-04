"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Globe,
  Network,
  MessageSquare,
  FolderOpen,
  Plus,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG = {
  audit: { label: "Audit technique", icon: Search, color: "bg-orange-100 text-orange-600" },
  roadmap_editorial: { label: "Roadmap éditoriale", icon: FileText, color: "bg-blue-100 text-blue-600" },
  roadmap_geo: { label: "Roadmap GEO", icon: Globe, color: "bg-green-100 text-green-600" },
  mindmap: { label: "Mindmap", icon: Network, color: "bg-purple-100 text-purple-600" },
  prompts: { label: "Prompts", icon: MessageSquare, color: "bg-pink-100 text-pink-600" },
  other: { label: "Autre", icon: FolderOpen, color: "bg-gray-100 text-gray-600" },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

const CATEGORY_ORDER: CategoryKey[] = [
  "audit",
  "roadmap_editorial",
  "roadmap_geo",
  "mindmap",
  "prompts",
  "other",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkDocument {
  id: string;
  title: string;
  category: CategoryKey;
  url: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkDocumentsPage() {
  const { activeClient, isReader } = useAuth();

  const [documents, setDocuments] = useState<WorkDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("audit");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  // --------------------------------------------------
  // Fetch documents
  // --------------------------------------------------

  const fetchDocuments = useCallback(async () => {
    if (!activeClient?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/work-documents?org_id=${activeClient.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeClient?.id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // --------------------------------------------------
  // Create document
  // --------------------------------------------------

  const handleCreate = async () => {
    if (!activeClient?.id || !title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/work-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeClient.id,
          title: title.trim(),
          category,
          url: url.trim(),
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        resetForm();
        setDialogOpen(false);
        fetchDocuments();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete document
  // --------------------------------------------------

  const handleDelete = async (docId: string) => {
    if (!activeClient?.id) return;
    try {
      const res = await fetch("/api/work-documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, orgId: activeClient.id }),
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // silent
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const resetForm = () => {
    setTitle("");
    setCategory("audit");
    setUrl("");
    setDescription("");
  };

  const groupedDocuments = CATEGORY_ORDER.map((key) => ({
    key,
    config: CATEGORY_CONFIG[key],
    docs: documents.filter((d) => d.category === key),
  })).filter((g) => g.docs.length > 0);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents de travail"
        description={activeClient?.name ?? ""}
      >
        {!isReader && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Ajouter un document
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau document</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">Titre</Label>
                  <Input
                    id="doc-title"
                    placeholder="Ex: Audit technique Q1 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ORDER.map((key) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_CONFIG[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-url">URL</Label>
                  <Input
                    id="doc-url"
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-desc">Description (optionnel)</Label>
                  <Textarea
                    id="doc-desc"
                    placeholder="Notes ou contexte..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving || !title.trim() || !url.trim()}
                >
                  {saving ? "Enregistrement..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Chargement des documents...
        </div>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold">Aucun document</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Ajoutez des liens vers vos documents de travail (audits, roadmaps, mindmaps, etc.)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped documents */}
      {!loading && groupedDocuments.map((group) => {
        const Icon = group.config.icon;
        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", group.config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold">{group.config.label}</h2>
              <span className="text-xs text-muted-foreground">({group.docs.length})</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.docs.map((doc) => (
                <Card key={doc.id} className="group relative transition-colors hover:border-primary/30">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", group.config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                      {doc.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      {!isReader && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
