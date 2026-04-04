"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Link2,
  ExternalLink,
  X,
  Save,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Attachment {
  type: "link" | "file";
  url: string;
  name: string;
}

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  assignedTo: "client" | "datashake";
  linkedTaskId: string | null;
  description: string;
  attachments: Attachment[];
  order: number;
}

interface WeeklyTodo {
  id: string;
  weekDate: string; // ISO date string (Monday of the week)
  createdBy: string;
  items: TodoItem[];
}

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  type: string;
  category: string;
  dueDate: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWeekDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `Semaine du ${day}/${month}/${year}`;
}

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun ... 6=Sat
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toISOString().slice(0, 10);
}

function doneCount(items: TodoItem[]): number {
  return items.filter((i) => i.done).length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const { activeClient, isReader } = useAuth();

  const [todos, setTodos] = useState<WeeklyTodo[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // --- Expanded item detail (per item) ---
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
  const [savingItem, setSavingItem] = useState(false);

  // --- Create dialog state ---
  const [createOpen, setCreateOpen] = useState(false);
  const [newWeekDate, setNewWeekDate] = useState(getNextMonday);
  const [newItems, setNewItems] = useState<
    { title: string; assignedTo: "client" | "datashake"; linkedTaskId: string }[]
  >([{ title: "", assignedTo: "client", linkedTaskId: "" }, { title: "", assignedTo: "datashake", linkedTaskId: "" }]);
  const [creating, setCreating] = useState(false);

  // --- Add item inline state ---
  const [addingToTodo, setAddingToTodo] = useState<string | null>(null);
  const [addItemTitle, setAddItemTitle] = useState("");
  const taskSelectRef = useRef<HTMLSelectElement>(null);

  // --- Open tasks for linking ---
  const [openTasks, setOpenTasks] = useState<{ id: string; title: string; status: string }[]>([]);

  // --- History ---
  const [showHistory, setShowHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(20);

  // --- Fetch ---
  const fetchTodos = useCallback(async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`/api/weekly-todos?org_id=${activeClient.id}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const fetched: WeeklyTodo[] = data.todos ?? [];
      // Sort most recent first
      fetched.sort((a, b) => (b.weekDate > a.weekDate ? 1 : -1));
      setTodos(fetched);
      setLinkedTasks(data.linkedTasks ?? []);
      // Fetch open tasks for linking
      const tasksRes = await fetch(`/api/project-tasks?org_id=${activeClient.id}`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setOpenTasks((tasksData.tasks || []).filter((t: any) => t.status !== "done"));
      }
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  useEffect(() => {
    setLoading(true);
    fetchTodos();
  }, [fetchTodos]);

  // --- Toggle item ---
  async function toggleItem(item: TodoItem) {
    if (!activeClient) return;
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) =>
          i.id === item.id ? { ...i, done: !i.done } : i
        ),
      }))
    );
    try {
      await fetch("/api/weekly-todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_item",
          orgId: activeClient.id,
          itemId: item.id,
          done: !item.done,
        }),
      });
    } catch {
      // revert on error
      fetchTodos();
    }
  }

  // --- Add item (explicit assignedTo parameter, no select needed) ---
  async function addItem(todoId: string, assignedTo: "client" | "datashake") {
    if (!activeClient || !addItemTitle.trim()) return;
    const linkedTaskId = taskSelectRef.current?.value || null;
    try {
      await fetch("/api/weekly-todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          orgId: activeClient.id,
          todoId,
          title: addItemTitle.trim(),
          assignedTo,
          linkedTaskId,
          description: "",
          attachments: [],
        }),
      });
      setAddItemTitle("");
      setAddingToTodo(null);
      fetchTodos();
    } catch {
      // ignore
    }
  }

  // --- Update item details ---
  async function updateItemDetails(item: TodoItem) {
    if (!activeClient) return;
    setSavingItem(true);
    try {
      await fetch("/api/weekly-todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_item",
          orgId: activeClient.id,
          itemId: item.id,
          title: item.title,
          description: editDescription,
          attachments: editAttachments,
        }),
      });
      fetchTodos();
    } catch {
      // ignore
    } finally {
      setSavingItem(false);
    }
  }

  // --- Remove item ---
  async function removeItem(itemId: string) {
    if (!activeClient) return;
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    }
    setTodos((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.filter((i) => i.id !== itemId),
      }))
    );
    try {
      await fetch("/api/weekly-todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_item",
          orgId: activeClient.id,
          itemId,
        }),
      });
    } catch {
      fetchTodos();
    }
  }

  // --- Delete weekly to-do ---
  async function deleteTodo(todoId: string) {
    if (!activeClient) return;
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    try {
      await fetch("/api/weekly-todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todoId, orgId: activeClient.id }),
      });
    } catch {
      fetchTodos();
    }
  }

  // --- Create weekly to-do ---
  async function createTodo() {
    if (!activeClient) return;
    const validItems = newItems.filter((i) => i.title.trim());
    if (!newWeekDate || validItems.length === 0) return;
    setCreating(true);
    try {
      await fetch("/api/weekly-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeClient.id,
          weekDate: newWeekDate,
          items: validItems.map((i) => ({
            title: i.title.trim(),
            assignedTo: i.assignedTo,
            linkedTaskId: i.linkedTaskId || null,
          })),
        }),
      });
      setCreateOpen(false);
      setNewWeekDate(getNextMonday());
      setNewItems([{ title: "", assignedTo: "client", linkedTaskId: "" }, { title: "", assignedTo: "datashake", linkedTaskId: "" }]);
      fetchTodos();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  // --- Expand / collapse week ---
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Expand / collapse item detail ---
  function toggleItemDetail(item: TodoItem) {
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(item.id);
      setEditDescription(item.description ?? "");
      setEditAttachments(item.attachments ?? []);
    }
  }

  // --- Add link attachment ---
  function addLinkAttachment() {
    const url = prompt("URL du lien :");
    if (!url) return;
    const name = prompt("Nom du lien :") || url;
    setEditAttachments((prev) => [...prev, { type: "link", url, name }]);
  }

  // --- Remove attachment ---
  function removeAttachment(index: number) {
    setEditAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Update a single newItem's assignedTo ---
  function updateNewItemAssignedTo(
    index: number,
    value: "client" | "datashake"
  ) {
    setNewItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, assignedTo: value } : item
      )
    );
  }

  // --- Update a single newItem's title ---
  function updateNewItemTitle(index: number, value: string) {
    setNewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, title: value } : item))
    );
  }

  // --- Update linked task ---
  function updateNewItemLinkedTask(index: number, value: string) {
    setNewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, linkedTaskId: value } : item))
    );
  }

  // --- Remove a newItem ---
  function removeNewItem(index: number) {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Render item detail panel ---
  function renderItemDetail(item: TodoItem) {
    if (expandedItemId !== item.id) return null;

    return (
      <div className="ml-8 mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
        {/* Description */}
        {!isReader ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              className="min-h-20 text-sm"
              placeholder="Ajouter une description..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
        ) : (
          editDescription && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm">{editDescription}</p>
            </div>
          )
        )}

        {/* Attachments */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Pièces jointes
          </p>
          {editAttachments.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {editAttachments.map((att, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"
                >
                  {att.type === "link" ? (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                  )}
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {att.name}
                  </a>
                  {!isReader && (
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60">
              Aucune pièce jointe.
            </p>
          )}

          {!isReader && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5 text-xs"
              onClick={addLinkAttachment}
            >
              <Link2 className="h-3 w-3" />
              Ajouter un lien
            </Button>
          )}
        </div>

        {/* Save button */}
        {!isReader && (
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => updateItemDetails(item)}
              disabled={savingItem}
            >
              {savingItem ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Render items ---
  function renderItems(items: TodoItem[], label: string) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <ul className="space-y-1">
          {items
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <li key={item.id}>
                <div className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={
                      item.done
                        ? "Marquer comme non terminé"
                        : "Marquer comme terminé"
                    }
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  {/* Title — clickable to expand detail */}
                  <button
                    onClick={() => toggleItemDetail(item)}
                    className={cn(
                      "flex-1 text-left text-sm hover:text-primary transition-colors",
                      item.done && "line-through text-muted-foreground",
                      expandedItemId === item.id && "font-medium text-primary"
                    )}
                  >
                    {item.title}
                  </button>

                  {/* Linked task badge */}
                  {item.linkedTaskId && (() => {
                    const task = openTasks.find((t) => t.id === item.linkedTaskId);
                    return (
                      <Link
                        href="/projects/kanban"
                        className="shrink-0 flex items-center gap-1 text-[10px] text-primary hover:underline transition-colors"
                        title={task ? `Tâche : ${task.title}` : "Voir la tâche liée"}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link2 className="h-3 w-3" />
                        {task ? task.title.slice(0, 25) + (task.title.length > 25 ? "…" : "") : "Tâche liée"}
                      </Link>
                    );
                  })()}

                  {/* Attachment indicator */}
                  {(item.attachments?.length ?? 0) > 0 && (
                    <span className="shrink-0 text-muted-foreground" title="Pièces jointes">
                      <Paperclip className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {/* Delete */}
                  {!isReader && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Expanded detail panel */}
                {renderItemDetail(item)}
              </li>
            ))}
        </ul>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="To-do hebdo"
        description={activeClient ? `${activeClient.name}` : undefined}
      >
        {!isReader && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
              <Plus className="h-4 w-4" />
              Nouvelle to-do
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle to-do hebdomadaire</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Week date */}
                <div className="space-y-2">
                  <Label>Semaine du (lundi)</Label>
                  <Input
                    type="date"
                    value={newWeekDate}
                    onChange={(e) => setNewWeekDate(e.target.value)}
                  />
                </div>

                {/* Items grouped by assignee */}
                <div className="space-y-4">
                  {/* Client items */}
                  <div className="space-y-2">
                    <Label>Actions pour {activeClient?.name || "le client"}</Label>
                    {newItems.filter(i => i.assignedTo === "client").map((item) => {
                      const realIdx = newItems.indexOf(item);
                      return (
                        <div key={realIdx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Input className="flex-1" placeholder="Titre de l'action" value={item.title}
                              onChange={(e) => updateNewItemTitle(realIdx, e.target.value)} />
                            {newItems.length > 1 && (
                              <button onClick={() => removeNewItem(realIdx)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {openTasks.length > 0 && (
                            <select className="h-7 w-full rounded border border-input bg-background px-2 text-[11px] text-muted-foreground"
                              value={item.linkedTaskId} onChange={(e) => updateNewItemLinkedTask(realIdx, e.target.value)}>
                              <option value="">Lier à une tâche (optionnel)</option>
                              {openTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                      onClick={() => setNewItems((prev) => [...prev, { title: "", assignedTo: "client", linkedTaskId: "" }])}>
                      <Plus className="h-3 w-3" />Ajouter pour {activeClient?.name || "le client"}
                    </Button>
                  </div>

                  {/* DATASHAKE items */}
                  <div className="space-y-2">
                    <Label>Actions pour DATASHAKE</Label>
                    {newItems.filter(i => i.assignedTo === "datashake").map((item) => {
                      const realIdx = newItems.indexOf(item);
                      return (
                        <div key={realIdx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Input className="flex-1" placeholder="Titre de l'action" value={item.title}
                              onChange={(e) => updateNewItemTitle(realIdx, e.target.value)} />
                            <button onClick={() => removeNewItem(realIdx)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {openTasks.length > 0 && (
                            <select className="h-7 w-full rounded border border-input bg-background px-2 text-[11px] text-muted-foreground"
                              value={item.linkedTaskId} onChange={(e) => updateNewItemLinkedTask(realIdx, e.target.value)}>
                              <option value="">Lier à une tâche (optionnel)</option>
                              {openTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => setNewItems((prev) => [...prev, { title: "", assignedTo: "datashake", linkedTaskId: "" }])}>
                      <Plus className="h-3 w-3" />Ajouter pour DATASHAKE
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={createTodo} disabled={creating}>
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && todos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune to-do hebdomadaire pour le moment.
            </p>
            {!isReader && (
              <p className="text-xs text-muted-foreground mt-1">
                Cliquez sur &laquo;&nbsp;Nouvelle to-do&nbsp;&raquo; pour
                commencer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Latest to-do: 2-column layout ── */}
      {!loading && todos.length > 0 && (() => {
        const latest = todos[0];
        const clientItems = latest.items.filter((i) => i.assignedTo === "client");
        const datashakeItems = latest.items.filter((i) => i.assignedTo === "datashake");
        const done = doneCount(latest.items);
        const total = latest.items.length;
        const allDone = total > 0 && done === total;

        return (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{formatWeekDate(latest.weekDate)}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={allDone ? "default" : "secondary"}
                      className={cn("text-xs", allDone && "bg-emerald-500 hover:bg-emerald-600 text-white")}
                    >
                      {done}/{total} terminée{total > 1 ? "s" : ""}
                    </Badge>
                    {!isReader && (
                      <button
                        onClick={() => { if (confirm("Supprimer cette to-do hebdomadaire ?")) deleteTodo(latest.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={cn("h-1.5 rounded-full transition-all duration-300", allDone ? "bg-emerald-500" : "bg-primary")}
                      style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-5">
                {/* 2-column layout: client | datashake */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {renderItems(clientItems, `Pour ${activeClient?.name ?? "le client"}`)}
                    {clientItems.length === 0 && (
                      <p className="text-xs text-muted-foreground">Aucune action pour le client.</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {renderItems(datashakeItems, "Pour DATASHAKE")}
                    {datashakeItems.length === 0 && (
                      <p className="text-xs text-muted-foreground">Aucune action pour DATASHAKE.</p>
                    )}
                  </div>
                </div>

                {/* Linked tasks */}
                {(() => {
                  const weekStart = new Date(latest.weekDate);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekEnd.getDate() + 6);
                  const weekTasks = linkedTasks.filter((t) => {
                    const d = new Date(t.dueDate);
                    return d >= weekStart && d <= weekEnd;
                  });
                  if (weekTasks.length === 0) return null;
                  return (
                    <div className="mt-5 pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tâches de la semaine</p>
                      <ul className="space-y-1.5">
                        {weekTasks.map((task) => (
                          <li key={task.id}>
                            <Link href="/projects/kanban" className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 group">
                              <Badge variant="secondary" className="text-[10px] shrink-0">{task.category}</Badge>
                              <span className="flex-1 text-sm group-hover:text-primary transition-colors">{task.title}</span>
                              <Badge variant="secondary" className={cn("text-[10px]",
                                task.status === "done" ? "bg-emerald-100 text-emerald-700" :
                                task.status === "review" ? "bg-green-100 text-green-700" :
                                task.status === "brief_done" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-700"
                              )}>
                                {task.status === "done" ? "Terminé" : task.status === "review" ? "À relire" :
                                 task.status === "brief_done" ? "Brief rédigé" : "En prépa"}
                              </Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Inline add */}
                {!isReader && (
                  <div className="mt-4 pt-3 border-t">
                    {addingToTodo === latest.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input className="flex-1" placeholder="Titre de l'action..." value={addItemTitle}
                            onChange={(e) => setAddItemTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") { setAddingToTodo(null); setAddItemTitle(""); } }}
                            autoFocus />
                          <Button size="sm" variant="outline" onClick={() => addItem(latest.id, "client")} disabled={!addItemTitle.trim()}>
                            + {activeClient?.name || "Client"}
                          </Button>
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => addItem(latest.id, "datashake")} disabled={!addItemTitle.trim()}>
                            + DATASHAKE
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAddingToTodo(null); setAddItemTitle(""); }}>Annuler</Button>
                        </div>
                        {openTasks.length > 0 && (
                          <div className="flex items-center gap-2 pl-1">
                            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <select ref={taskSelectRef} className="h-8 rounded-md border border-input bg-background px-2 text-xs flex-1" defaultValue="">
                              <option value="">Lier à une tâche (optionnel)</option>
                              {openTasks.map((t) => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground"
                        onClick={() => { setAddingToTodo(latest.id); setAddItemTitle(""); }}>
                        <Plus className="h-3.5 w-3.5" />Ajouter une action
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── History toggle ── */}
            {todos.length > 1 && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {showHistory ? "Masquer l'historique" : `Voir l'historique (${todos.length - 1} semaine${todos.length - 1 > 1 ? "s" : ""})`}
                </Button>

                {showHistory && (
                  <div className="space-y-3">
                    {todos.slice(1, 1 + historyLimit).map((todo) => {
                      const expanded = expandedIds.has(todo.id);
                      const hDone = doneCount(todo.items);
                      const hTotal = todo.items.length;
                      const hAllDone = hTotal > 0 && hDone === hTotal;
                      const hClientItems = todo.items.filter((i) => i.assignedTo === "client");
                      const hDatashakeItems = todo.items.filter((i) => i.assignedTo === "datashake");

                      return (
                        <Card key={todo.id} className="overflow-hidden">
                          <CardHeader className="cursor-pointer select-none py-3 hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(todo.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <CardTitle className="text-sm font-medium">{formatWeekDate(todo.weekDate)}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={hAllDone ? "default" : "secondary"} className={cn("text-[10px]", hAllDone && "bg-emerald-500 text-white")}>
                                  {hDone}/{hTotal} terminée{hTotal > 1 ? "s" : ""}
                                </Badge>
                                {!isReader && (
                                  <button onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer ?")) deleteTodo(todo.id); }}
                                    className="text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          {expanded && (
                            <CardContent className="pt-0 pb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>{renderItems(hClientItems, `Pour ${activeClient?.name ?? "le client"}`)}</div>
                                <div>{renderItems(hDatashakeItems, "Pour DATASHAKE")}</div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}

                    {/* Load more */}
                    {todos.length - 1 > historyLimit && (
                      <Button variant="outline" className="w-full" onClick={() => setHistoryLimit((l) => l + 20)}>
                        Voir plus ({todos.length - 1 - historyLimit} restante{todos.length - 1 - historyLimit > 1 ? "s" : ""})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
