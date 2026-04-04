"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { TaskDetailPanel, type TaskDetail } from "@/components/projects/task-detail-panel";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  Calendar,
  User,
  ListTodo,
  ClipboardCheck,
  Loader2,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_TYPE_CONFIG } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────
type KanbanStatus = "brief_prep" | "brief_done" | "review" | "done";
type TaskType = keyof typeof TASK_TYPE_CONFIG;
type TaskCategory = "content" | "technique" | "netlinking" | "other";

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: KanbanStatus;
  type: TaskType;
  category: TaskCategory;
  keyword?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  order?: number;
  createdAt?: string;
}

// ── Status config ───────────────────────────────────────────
const STATUS_CONFIG: Record<
  KanbanStatus,
  { title: string; headerBg: string; headerText: string }
> = {
  brief_prep: {
    title: "Brief en préparation",
    headerBg: "bg-teal-900",
    headerText: "text-teal-100",
  },
  brief_done: {
    title: "Brief rédigé",
    headerBg: "bg-yellow-500",
    headerText: "text-yellow-950",
  },
  review: {
    title: "Rédaction à relire",
    headerBg: "bg-emerald-600",
    headerText: "text-white",
  },
  done: {
    title: "Terminé",
    headerBg: "bg-stone-700",
    headerText: "text-stone-100",
  },
};

const COLUMN_ORDER: KanbanStatus[] = [
  "brief_prep",
  "brief_done",
  "review",
  "done",
];

// ── Category config ─────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; color: string }
> = {
  content: { label: "Contenu", color: "bg-blue-100 text-blue-700" },
  technique: { label: "Technique", color: "bg-orange-100 text-orange-700" },
  netlinking: {
    label: "Netlinking",
    color: "bg-purple-100 text-purple-700",
  },
  other: { label: "Autre", color: "bg-gray-100 text-gray-700" },
};

const CATEGORY_TABS: { value: TaskCategory | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "content", label: "Contenu" },
  { value: "technique", label: "Technique" },
  { value: "netlinking", label: "Netlinking" },
  { value: "other", label: "Autre" },
];

// ── Color bar per task type ─────────────────────────────────
function typeBarColor(type: TaskType): string {
  switch (type) {
    case "content":
      return "bg-blue-500";
    case "netlinking":
      return "bg-purple-500";
    case "technique":
      return "bg-orange-500";
    case "audit":
      return "bg-pink-500";
    case "other":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

// ── Page ────────────────────────────────────────────────────
export default function KanbanPage() {
  const { activeClient, isReader, organization } = useAuth();
  const orgId = activeClient?.id || organization?.id || "";

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<
    TaskCategory | "all"
  >("all");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<TaskType>("content");
  const [newCategory, setNewCategory] = useState<TaskCategory>("content");
  const [newKeyword, setNewKeyword] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStatus, setNewStatus] = useState<KanbanStatus>("brief_prep");

  // Detail panel (Notion-like slide-over)
  const [detailTask, setDetailTask] = useState<KanbanTask | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

  // Legacy edit dialog state (kept for compatibility but replaced by panel)
  const [editOpen, setEditOpen] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<TaskType>("content");
  const [editCategory, setEditCategory] = useState<TaskCategory>("content");
  const [editKeyword, setEditKeyword] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<KanbanStatus>("brief_prep");

  // ── Fetch tasks ─────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(
        `/api/project-tasks?org_id=${encodeURIComponent(orgId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTasks();
    // Fetch team members for task assignment
    if (orgId) {
      fetch(`/api/project-team?org_id=${orgId}`)
        .then((r) => r.json())
        .then((data) => setTeamMembers(data.members || []))
        .catch(() => {});
    }
  }, [fetchTasks, orgId]);

  // ── Filtered tasks ──────────────────────────────────────
  const filteredTasks =
    categoryFilter === "all"
      ? tasks
      : tasks.filter((t) => t.category === categoryFilter);

  // ── Dashboard counts ────────────────────────────────────
  const totalCount = tasks.length;
  const statusCounts = {
    todo: tasks.filter(
      (t) => t.status === "brief_prep" || t.status === "brief_done"
    ).length,
    inProgress: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
  const categoryCounts: Record<TaskCategory, number> = {
    content: tasks.filter((t) => t.category === "content").length,
    technique: tasks.filter((t) => t.category === "technique").length,
    netlinking: tasks.filter((t) => t.category === "netlinking").length,
    other: tasks.filter((t) => t.category === "other").length,
  };

  // ── Create handler ──────────────────────────────────────
  async function handleCreate() {
    if (!newTitle.trim() || !orgId) return;
    try {
      const res = await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          type: newType,
          category: newCategory,
          keyword: newKeyword.trim() || undefined,
          dueDate: newDueDate || undefined,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await fetchTasks();
        resetCreateForm();
        setCreateOpen(false);
      }
    } catch {
      // silently fail
    }
  }

  function resetCreateForm() {
    setNewTitle("");
    setNewDescription("");
    setNewType("content");
    setNewCategory("content");
    setNewKeyword("");
    setNewDueDate("");
    setNewStatus("brief_prep");
  }

  // ── Edit handler ────────────────────────────────────────
  function openEditDialog(task: KanbanTask) {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditType(task.type);
    setEditCategory(task.category);
    setEditKeyword(task.keyword || "");
    setEditDueDate(task.dueDate || "");
    setEditStatus(task.status);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editTask || !editTitle.trim() || !orgId) return;
    try {
      const res = await fetch("/api/project-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTask.id,
          orgId,
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          type: editType,
          category: editCategory,
          keyword: editKeyword.trim() || undefined,
          dueDate: editDueDate || undefined,
          status: editStatus,
        }),
      });
      if (res.ok) {
        await fetchTasks();
        setEditOpen(false);
        setEditTask(null);
      }
    } catch {
      // silently fail
    }
  }

  async function handleDelete() {
    if (!editTask || !orgId) return;
    try {
      const res = await fetch("/api/project-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTask.id, orgId }),
      });
      if (res.ok) {
        await fetchTasks();
        setEditOpen(false);
        setEditTask(null);
      }
    } catch {
      // silently fail
    }
  }

  // ── Quick status change ─────────────────────────────────
  async function handleStatusChange(task: KanbanTask, newSt: KanbanStatus) {
    if (!orgId) return;
    try {
      const res = await fetch("/api/project-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          orgId,
          status: newSt,
        }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch {
      // silently fail
    }
  }

  // ── Format date for display ─────────────────────────────
  function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  }

  function isOverdue(dateStr?: string) {
    if (!dateStr) return false;
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban"
        description={`${activeClient?.domain || organization?.domain || ""} — Suivi des tâches SEO`}
      />

      {/* ── 1. Dashboard recap ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Total */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <ListTodo className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total tâches</p>
            </div>
          </CardContent>
        </Card>
        {/* À faire */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.todo}</p>
              <p className="text-xs text-muted-foreground">À faire</p>
            </div>
          </CardContent>
        </Card>
        {/* En cours */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-100 p-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.inProgress}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        {/* Terminé */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-stone-100 p-2">
              <CheckCircle2 className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.done}</p>
              <p className="text-xs text-muted-foreground">Terminé</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Par catégorie :
        </span>
        {(
          Object.entries(CATEGORY_CONFIG) as [
            TaskCategory,
            { label: string; color: string },
          ][]
        ).map(([key, cfg]) => (
          <Badge key={key} variant="secondary" className={cn("text-xs", cfg.color)}>
            {cfg.label} : {categoryCounts[key]}
          </Badge>
        ))}
      </div>

      {/* ── 2. Category filter tabs ──────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategoryFilter(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              categoryFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Spacer + create button */}
        <div className="flex-1" />
        {!isReader && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={<Button size="sm" className="gap-1.5 text-xs" />}
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle tâche
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle tâche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Titre de la tâche"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    placeholder="Description (optionnel)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newType}
                      onValueChange={(v) =>
                        setNewType((v as TaskType) || "content")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={newCategory}
                      onValueChange={(v) =>
                        setNewCategory((v as TaskCategory) || "content")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mot clé associé</Label>
                    <Input
                      placeholder="Ex: batch cooking"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date d&apos;échéance</Label>
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Statut initial</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v) =>
                      setNewStatus((v as KanbanStatus) || "brief_prep")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_CONFIG[s].title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreate}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── 3. Kanban board ──────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMN_ORDER.map((status) => {
            const col = STATUS_CONFIG[status];
            const columnTasks = filteredTasks.filter(
              (t) => t.status === status
            );
            return (
              <div key={status} className="flex flex-col">
                {/* Column header */}
                <div
                  className={cn(
                    "mb-3 rounded-lg px-4 py-2.5 text-center",
                    col.headerBg,
                    col.headerText
                  )}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-[10px] opacity-75">
                    {columnTasks.length}{" "}
                    {columnTasks.length > 1 ? "tâches" : "tâche"}
                  </span>
                </div>

                {/* Cards container */}
                <div className="flex-1 space-y-3 rounded-lg border border-border bg-muted/20 p-3 min-h-[320px]">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => setDetailTask(task)}
                    >
                      <CardContent className="p-3.5">
                        {/* Color bar */}
                        <div
                          className={cn(
                            "mb-2.5 h-1 w-14 rounded-full",
                            typeBarColor(task.type)
                          )}
                        />

                        <h4 className="mb-2.5 text-sm font-medium leading-snug">
                          {task.title}
                        </h4>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-1.5 py-0 text-[10px]",
                              TASK_TYPE_CONFIG[task.type]?.color
                            )}
                          >
                            {TASK_TYPE_CONFIG[task.type]?.label || task.type}
                          </Badge>

                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-1.5 py-0 text-[10px]",
                              CATEGORY_CONFIG[task.category]?.color ||
                                "bg-gray-100 text-gray-600"
                            )}
                          >
                            {CATEGORY_CONFIG[task.category]?.label ||
                              task.category}
                          </Badge>

                          {task.keyword && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 px-1.5 py-0 text-[10px] text-gray-600"
                            >
                              {task.keyword}
                            </Badge>
                          )}
                        </div>

                        {/* Status dropdown (quick change) */}
                        <div
                          className="mt-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={task.status}
                            onValueChange={(v) => {
                              if (v && v !== task.status) {
                                handleStatusChange(
                                  task,
                                  v as KanbanStatus
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="h-6 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMN_ORDER.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_CONFIG[s].title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Footer: due date + assignee */}
                        {(task.dueDate || task.assigneeName) && (
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                            {task.dueDate ? (
                              <span
                                className={cn(
                                  "flex items-center gap-1",
                                  isOverdue(task.dueDate) &&
                                    task.status !== "done" &&
                                    "font-medium text-red-500"
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            ) : (
                              <span />
                            )}
                            {task.assigneeName && (
                              <span className="flex items-center gap-1 font-medium">
                                <User className="h-3 w-3" />
                                {task.assigneeName}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {columnTasks.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Aucune tâche
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit dialog ──────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) =>
                    setEditStatus((v as KanbanStatus) || "brief_prep")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_CONFIG[s].title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editType}
                  onValueChange={(v) =>
                    setEditType((v as TaskType) || "content")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={editCategory}
                  onValueChange={(v) =>
                    setEditCategory((v as TaskCategory) || "content")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mot clé</Label>
                <Input
                  value={editKeyword}
                  onChange={(e) => setEditKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date d&apos;échéance</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            {!isReader && (
              <Button
                variant="destructive"
                size="sm"
                className="mr-auto gap-1.5"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            {!isReader && (
              <Button onClick={handleEdit}>Enregistrer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notion-like task detail panel */}
      {detailTask && orgId && (
        <TaskDetailPanel
          task={{
            id: detailTask.id,
            title: detailTask.title,
            description: detailTask.description || "",
            status: detailTask.status,
            type: detailTask.type,
            category: detailTask.category,
            keyword: detailTask.keyword || "",
            assigneeId: detailTask.assigneeId || null,
            assigneeName: detailTask.assigneeName || null,
            dueDate: detailTask.dueDate || null,
            url: (detailTask as any).url || "",
            progress: (detailTask as any).progress || 0,
            estimatedDays: (detailTask as any).estimatedDays || null,
            endDate: (detailTask as any).endDate || null,
          }}
          orgId={orgId}
          members={teamMembers}
          readOnly={isReader}
          onClose={() => setDetailTask(null)}
          onSave={async (updates) => {
            await fetch("/api/project-tasks", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: detailTask.id, orgId, ...updates }),
            });
            setDetailTask(null);
            fetchTasks();
          }}
          onDelete={async () => {
            await fetch("/api/project-tasks", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: detailTask.id, orgId }),
            });
            setDetailTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
