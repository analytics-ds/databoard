"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
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
import { Plus, Calendar, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_TYPE_CONFIG } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────
type KanbanStatus =
  | "brief_preparation"
  | "brief_redige"
  | "redaction_relire"
  | "termine";

type TaskType = keyof typeof TASK_TYPE_CONFIG;

interface KanbanTask {
  id: string;
  title: string;
  status: KanbanStatus;
  type: TaskType;
  keyword?: string;
  assigneeInitials?: string;
  dueDate?: string;
  overdue?: boolean;
}

// ── Column config ────────────────────────────────────────────
const COLUMNS: {
  status: KanbanStatus;
  title: string;
  headerBg: string;
  headerText: string;
}[] = [
  {
    status: "brief_preparation",
    title: "Brief en pr\u00e9paration",
    headerBg: "bg-teal-900",
    headerText: "text-teal-100",
  },
  {
    status: "brief_redige",
    title: "Brief r\u00e9dig\u00e9",
    headerBg: "bg-yellow-500",
    headerText: "text-yellow-950",
  },
  {
    status: "redaction_relire",
    title: "R\u00e9daction \u00e0 relire",
    headerBg: "bg-emerald-600",
    headerText: "text-white",
  },
  {
    status: "termine",
    title: "Termin\u00e9",
    headerBg: "bg-stone-700",
    headerText: "text-stone-100",
  },
];

// ── Demo data ────────────────────────────────────────────────
// TODO: Replace with API call — GET /api/project-tasks?org_id=xxx
const DEMO_TASKS: KanbanTask[] = [
  {
    id: "1",
    title: "LP : batch cooking automne",
    status: "brief_preparation",
    type: "content",
    keyword: "batch cooking automne",
  },
  {
    id: "2",
    title: "LP : r\u00e9gime m\u00e9diterran\u00e9en menu",
    status: "brief_preparation",
    type: "content",
    keyword: "r\u00e9gime m\u00e9diterran\u00e9en menu semaine",
  },
  {
    id: "3",
    title: "Audit maillage interne",
    status: "brief_preparation",
    type: "audit",
  },
  {
    id: "4",
    title: "Brief LP panier repas",
    status: "brief_redige",
    type: "content",
    keyword: "panier repas",
    assigneeInitials: "P.G",
  },
  {
    id: "5",
    title: "Brief optimisation balises title x20",
    status: "brief_redige",
    type: "technique",
    dueDate: "10 avr.",
  },
  {
    id: "6",
    title: "R\u00e9daction article batch cooking",
    status: "redaction_relire",
    type: "content",
    keyword: "batch cooking",
    assigneeInitials: "K.B",
    dueDate: "15 avr.",
  },
  {
    id: "7",
    title: "Backlink : les-calories.com",
    status: "redaction_relire",
    type: "netlinking",
    dueDate: "12 avr.",
    overdue: true,
  },
  {
    id: "8",
    title: "MAJ contenu + images LP P\u00e2ques",
    status: "termine",
    type: "content",
    assigneeInitials: "K.B",
  },
  {
    id: "9",
    title: "Audit technique complet",
    status: "termine",
    type: "audit",
  },
  {
    id: "10",
    title: "Setup GA4 events",
    status: "termine",
    type: "technique",
  },
  {
    id: "11",
    title: "Analyse UX pages catégories",
    status: "brief_preparation",
    type: "other",
  },
];

// ── Color bar per task type ──────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────
export default function KanbanPage() {
  const { organization, isReader } = useAuth();
  const [tasks, setTasks] = useState<KanbanTask[]>(DEMO_TASKS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<TaskType>("content");
  const [newKeyword, setNewKeyword] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const filteredTasks = search
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.keyword?.toLowerCase().includes(search.toLowerCase()),
      )
    : tasks;

  function handleCreate() {
    if (!newTitle.trim()) return;

    const task: KanbanTask = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      status: "brief_preparation",
      type: newType,
      keyword: newKeyword.trim() || undefined,
      dueDate: newDueDate || undefined,
    };

    // TODO: POST to /api/project-tasks to persist in DB
    setTasks((prev) => [task, ...prev]);
    resetForm();
    setDialogOpen(false);
  }

  function resetForm() {
    setNewTitle("");
    setNewDescription("");
    setNewType("content");
    setNewKeyword("");
    setNewDueDate("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban"
        description={`\u00c9tude (${organization?.domain || ""}) \u2014 Suivi des t\u00e2ches SEO`}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une t\u00e2che..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-8 text-xs"
          />
        </div>

        {!isReader && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5 text-xs" />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle t\u00e2che</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Titre de la t\u00e2che"
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
                      onValueChange={(v) => setNewType(v as TaskType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_CONFIG).map(
                          ([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              {cfg.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date d&apos;\u00e9ch\u00e9ance</Label>
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mot cl\u00e9 associ\u00e9</Label>
                  <Input
                    placeholder="Ex: batch cooking"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreate}>Cr\u00e9er</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Kanban Board — 4 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 md:grid-cols-2">
        {COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter(
            (t) => t.status === col.status,
          );
          return (
            <div key={col.status} className="flex flex-col">
              {/* Column header */}
              <div
                className={cn(
                  "mb-3 rounded-lg px-4 py-2.5 text-center",
                  col.headerBg,
                  col.headerText,
                )}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  {col.title}
                </h3>
                <span className="text-[10px] opacity-75">
                  {columnTasks.length}{" "}
                  {columnTasks.length > 1 ? "t\u00e2ches" : "t\u00e2che"}
                </span>
              </div>

              {/* Cards container */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3 min-h-[320px] flex-1">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-3.5">
                      {/* Color bar */}
                      <div
                        className={cn(
                          "h-1 w-14 rounded-full mb-2.5",
                          typeBarColor(task.type),
                        )}
                      />

                      <h4 className="text-sm font-medium leading-snug mb-2.5">
                        {task.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            TASK_TYPE_CONFIG[task.type].color,
                          )}
                        >
                          {TASK_TYPE_CONFIG[task.type].label}
                        </Badge>

                        {task.keyword && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600"
                          >
                            {task.keyword}
                          </Badge>
                        )}
                      </div>

                      {/* Footer: due date + assignee */}
                      {(task.dueDate || task.assigneeInitials) && (
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          {task.dueDate ? (
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                task.overdue && "text-red-500 font-medium",
                              )}
                            >
                              <Calendar className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          ) : (
                            <span />
                          )}
                          {task.assigneeInitials && (
                            <span className="flex items-center gap-1 font-medium">
                              <User className="h-3 w-3" />
                              {task.assigneeInitials}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {columnTasks.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Aucune t\u00e2che
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
