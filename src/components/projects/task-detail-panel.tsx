"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/shared/rich-editor";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
import {
  X,
  Save,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Calendar,
  Clock,
  BarChart3,
  Target,
  User,
  Tag,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────
export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  category: string;
  keyword: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  url: string;
  progress: number;
  estimatedDays: number | null;
  endDate: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Props {
  task: TaskDetail;
  orgId: string;
  members: TeamMember[];
  readOnly: boolean;
  onClose: () => void;
  onSave: (updates: Partial<TaskDetail>) => Promise<void>;
  onDelete: () => Promise<void>;
}

// ── Config ─────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "brief_prep", label: "Brief en préparation", color: "bg-teal-100 text-teal-700" },
  { value: "brief_done", label: "Brief rédigé", color: "bg-yellow-100 text-yellow-700" },
  { value: "review", label: "Rédaction à relire", color: "bg-green-100 text-green-700" },
  { value: "done", label: "Terminé", color: "bg-emerald-100 text-emerald-700" },
];

const CATEGORY_OPTIONS = [
  { value: "content", label: "Contenu" },
  { value: "technique", label: "Technique" },
  { value: "netlinking", label: "Netlinking" },
  { value: "other", label: "Autre" },
];

const TYPE_OPTIONS = [
  { value: "content", label: "Content" },
  { value: "netlinking", label: "Netlinking" },
  { value: "technique", label: "Technique" },
  { value: "audit", label: "Audit" },
  { value: "other", label: "Autre" },
];

// ── Component ──────────────────────────────────────────────
export function TaskDetailPanel({ task, orgId, members, readOnly, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [type, setType] = useState(task.type);
  const [category, setCategory] = useState(task.category);
  const [keyword, setKeyword] = useState(task.keyword || "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [url, setUrl] = useState(task.url || "");
  const [progress, setProgress] = useState(task.progress || 0);
  const [estimatedDays, setEstimatedDays] = useState(task.estimatedDays?.toString() || "");
  const [endDate, setEndDate] = useState(task.endDate || "");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      title !== task.title ||
      description !== task.description ||
      status !== task.status ||
      type !== task.type ||
      category !== task.category ||
      keyword !== (task.keyword || "") ||
      assigneeId !== (task.assigneeId || "") ||
      dueDate !== (task.dueDate || "") ||
      url !== (task.url || "") ||
      progress !== (task.progress || 0) ||
      estimatedDays !== (task.estimatedDays?.toString() || "") ||
      endDate !== (task.endDate || "");
    setDirty(changed);
  }, [title, description, status, type, category, keyword, assigneeId, dueDate, url, progress, estimatedDays, endDate, task]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        status,
        type,
        category,
        keyword: keyword || undefined,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        url,
        progress,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        endDate: endDate || null,
      } as any);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette tâche ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl bg-background shadow-2xl border-l border-border overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center gap-3">
            {statusConfig && (
              <Badge className={cn("text-xs", statusConfig.color)}>{statusConfig.label}</Badge>
            )}
            {dirty && <span className="text-[10px] text-amber-500 font-medium">Non sauvegardé</span>}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && dirty && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Sauvegarder
              </Button>
            )}
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="gap-1.5 text-red-600 hover:bg-red-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          {readOnly ? (
            <h1 className="text-2xl font-bold">{title}</h1>
          ) : (
            <input
              className="w-full text-2xl font-bold bg-transparent border-0 outline-none placeholder:text-muted-foreground/40"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
            />
          )}

          {/* Properties grid */}
          <div className="rounded-lg border border-border divide-y">
            {/* Catégorie */}
            <PropertyRow icon={<Layers className="h-4 w-4" />} label="Catégorie">
              {readOnly ? (
                <Badge variant="secondary" className="text-xs">{CATEGORY_OPTIONS.find(c => c.value === category)?.label || category}</Badge>
              ) : (
                <select className="h-8 rounded border border-input bg-background px-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )}
            </PropertyRow>

            {/* Status */}
            <PropertyRow icon={<Target className="h-4 w-4" />} label="Statut">
              {readOnly ? (
                <Badge className={cn("text-xs", statusConfig?.color)}>{statusConfig?.label}</Badge>
              ) : (
                <select className="h-8 rounded border border-input bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
            </PropertyRow>

            {/* Type */}
            <PropertyRow icon={<Tag className="h-4 w-4" />} label="Type">
              {readOnly ? (
                <span className="text-sm">{TYPE_OPTIONS.find(t => t.value === type)?.label || type}</span>
              ) : (
                <select className="h-8 rounded border border-input bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              )}
            </PropertyRow>

            {/* Assigné */}
            <PropertyRow icon={<User className="h-4 w-4" />} label="Assigné à">
              {readOnly ? (
                <span className="text-sm">{members.find(m => m.id === assigneeId)?.name || "Non assigné"}</span>
              ) : (
                <select className="h-8 rounded border border-input bg-background px-2 text-sm" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  <option value="">Non assigné</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
            </PropertyRow>

            {/* Mot clé */}
            <PropertyRow icon={<Tag className="h-4 w-4" />} label="Mot clé">
              {readOnly ? (
                <span className="text-sm">{keyword || "—"}</span>
              ) : (
                <Input className="h-8 text-sm" placeholder="Ex: batch cooking" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              )}
            </PropertyRow>

            {/* URL */}
            <PropertyRow icon={<LinkIcon className="h-4 w-4" />} label="URL">
              {readOnly ? (
                url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{url}</a> : <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <Input className="h-8 text-sm" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
              )}
            </PropertyRow>

            {/* Échéance */}
            <PropertyRow icon={<Calendar className="h-4 w-4" />} label="Échéance">
              {readOnly ? (
                <span className="text-sm">{dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "—"}</span>
              ) : (
                <Input type="date" className="h-8 text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              )}
            </PropertyRow>

            {/* Date de fin */}
            <PropertyRow icon={<Calendar className="h-4 w-4" />} label="Date de fin">
              {readOnly ? (
                <span className="text-sm">{endDate ? new Date(endDate).toLocaleDateString("fr-FR") : "—"}</span>
              ) : (
                <Input type="date" className="h-8 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              )}
            </PropertyRow>

            {/* Nombre de jours estimé */}
            <PropertyRow icon={<Clock className="h-4 w-4" />} label="Jours estimés">
              {readOnly ? (
                <span className="text-sm">{estimatedDays || "—"}</span>
              ) : (
                <Input type="number" className="h-8 text-sm w-20" placeholder="—" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} />
              )}
            </PropertyRow>

            {/* Progression */}
            <PropertyRow icon={<BarChart3 className="h-4 w-4" />} label="Progression">
              <div className="flex items-center gap-3 flex-1">
                {readOnly ? (
                  <>
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm font-medium">{progress}%</span>
                  </>
                ) : (
                  <>
                    <input type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                    <span className="text-sm font-medium w-10 text-right">{progress}%</span>
                  </>
                )}
              </div>
            </PropertyRow>
          </div>

          {/* Description — Rich Editor */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Contenu de la tâche</Label>
            {readOnly ? (
              description ? (
                <div className="prose prose-sm max-w-none rounded-lg border border-border p-4" dangerouslySetInnerHTML={{ __html: description }} />
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucun contenu ajouté.</p>
              )
            ) : (
              <RichEditor
                content={description}
                onChange={(html) => setDescription(html)}
                placeholder="Décrivez la tâche en détail : captures d'écran, liens, instructions..."
              />
            )}
          </div>

          {/* Fichiers joints */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Fichiers joints</Label>
            <FileUpload
              orgId={orgId}
              files={files}
              onUpload={(file) => setFiles((prev) => [...prev, file])}
              onRemove={(fileId) => setFiles((prev) => prev.filter((f) => f.id !== fileId))}
              readOnly={readOnly}
              accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function PropertyRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
