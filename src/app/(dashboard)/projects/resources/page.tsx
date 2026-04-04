"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
  Plus,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  seo: { label: "SEO", color: "bg-blue-100 text-blue-700" },
  contenu: { label: "Contenu", color: "bg-emerald-100 text-emerald-700" },
  technique: { label: "Technique", color: "bg-orange-100 text-orange-700" },
  images: { label: "Images", color: "bg-purple-100 text-purple-700" },
  general: { label: "Général", color: "bg-gray-100 text-gray-700" },
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resource {
  id: string;
  title: string;
  category: string;
  content: string;
  url?: string;
  createdBy?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResourcesPage() {
  const { activeClient, isReader } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchResources = useCallback(async () => {
    if (!activeClient?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/resources?org_id=${activeClient.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeClient?.id]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // -----------------------------------------------------------------------
  // Create
  // -----------------------------------------------------------------------

  const handleCreate = async () => {
    if (!activeClient?.id || !newTitle.trim() || !newCategory) return;
    setCreating(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeClient.id,
          title: newTitle.trim(),
          category: newCategory,
          content: newContent.trim(),
          url: newUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setCreateOpen(false);
        resetForm();
        fetchResources();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewCategory("");
    setNewContent("");
    setNewUrl("");
  };

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    if (!activeClient?.id) return;
    try {
      const res = await fetch("/api/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, orgId: activeClient.id }),
      });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------------------------------------
  // Expand / collapse
  // -----------------------------------------------------------------------

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // -----------------------------------------------------------------------
  // Group by category
  // -----------------------------------------------------------------------

  const grouped = CATEGORIES.map(([key, cfg]) => ({
    key,
    ...cfg,
    items: resources.filter((r) => r.category === key),
  })).filter((g) => g.items.length > 0);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ressources & guides"
        description="Bonnes pratiques et guides partagés par Datashake"
      />

      {/* Action bar */}
      {!isReader && (
        <div className="flex items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5 text-xs" />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une ressource
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle ressource</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Ex : Best practices - Images"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={newCategory}
                    onValueChange={(v) => setNewCategory(v || "general")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contenu du guide</Label>
                  <Textarea
                    rows={8}
                    placeholder="Rédigez le contenu de la ressource..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lien externe (optionnel)</Label>
                  <Input
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    creating || !newTitle.trim() || !newCategory
                  }
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && resources.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucune ressource pour le moment.
            </p>
            {!isReader && (
              <p className="text-xs text-muted-foreground mt-1">
                Cliquez sur &quot;Ajouter une ressource&quot; pour commencer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped resources */}
      {!loading &&
        grouped.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", group.color)}
              >
                {group.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {group.items.length} ressource
                {group.items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((resource) => {
                const isExpanded = expandedIds.has(resource.id);
                const hasLongContent =
                  resource.content && resource.content.length > 180;
                const preview =
                  hasLongContent && !isExpanded
                    ? resource.content.slice(0, 180) + "..."
                    : resource.content;

                return (
                  <Card
                    key={resource.id}
                    className="flex flex-col"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold leading-snug">
                          {resource.title}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "shrink-0 text-[10px]",
                            CATEGORY_CONFIG[resource.category]
                              ?.color
                          )}
                        >
                          {CATEGORY_CONFIG[resource.category]
                            ?.label ?? resource.category}
                        </Badge>
                      </div>
                      {resource.createdAt && (
                        <CardDescription className="text-[11px]">
                          {new Date(
                            resource.createdAt
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      {/* Content preview / expanded */}
                      {resource.content && (
                        <div>
                          <p className="whitespace-pre-line text-xs text-muted-foreground leading-relaxed">
                            {preview}
                          </p>
                          {hasLongContent && (
                            <button
                              onClick={() =>
                                toggleExpand(resource.id)
                              }
                              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Réduire
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Lire la suite
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* External link */}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir le lien externe
                        </a>
                      )}

                      {/* Delete */}
                      {!isReader && (
                        <div className="pt-1">
                          {deletingId === resource.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-destructive">
                                Supprimer ?
                              </span>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() =>
                                  handleDelete(resource.id)
                                }
                              >
                                Confirmer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() =>
                                  setDeletingId(null)
                                }
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setDeletingId(resource.id)
                              }
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
