"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  assignedTo: "client" | "datashake";
  order: number;
}

interface WeeklyTodo {
  id: string;
  weekDate: string; // ISO date string (Monday of the week)
  createdBy: string;
  items: TodoItem[];
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
  const day = now.getDay(); // 0=Sun … 6=Sat
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
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // --- Create dialog state ---
  const [createOpen, setCreateOpen] = useState(false);
  const [newWeekDate, setNewWeekDate] = useState(getNextMonday);
  const [newItems, setNewItems] = useState<{ title: string; assignedTo: "client" | "datashake" }[]>([
    { title: "", assignedTo: "client" },
  ]);
  const [creating, setCreating] = useState(false);

  // --- Add item inline state ---
  const [addingToTodo, setAddingToTodo] = useState<string | null>(null);
  const [addItemTitle, setAddItemTitle] = useState("");
  const [addItemAssignedTo, setAddItemAssignedTo] = useState<"client" | "datashake">("client");

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
      // Expand the most recent one by default
      if (fetched.length > 0) {
        setExpandedIds(new Set([fetched[0].id]));
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
        items: t.items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
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

  // --- Add item ---
  async function addItem(todoId: string) {
    if (!activeClient || !addItemTitle.trim()) return;
    try {
      await fetch("/api/weekly-todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          orgId: activeClient.id,
          todoId,
          title: addItemTitle.trim(),
          assignedTo: addItemAssignedTo,
        }),
      });
      setAddItemTitle("");
      setAddingToTodo(null);
      fetchTodos();
    } catch {
      // ignore
    }
  }

  // --- Remove item ---
  async function removeItem(itemId: string) {
    if (!activeClient) return;
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
          items: validItems.map((i) => ({ title: i.title.trim(), assignedTo: i.assignedTo })),
        }),
      });
      setCreateOpen(false);
      setNewWeekDate(getNextMonday());
      setNewItems([{ title: "", assignedTo: "client" }]);
      fetchTodos();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  // --- Expand / collapse ---
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Render helpers ---
  function renderItems(items: TodoItem[], label: string) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <ul className="space-y-1.5">
          {items
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <li key={item.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <button
                  onClick={() => toggleItem(item)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={item.done ? "Marquer comme non terminé" : "Marquer comme terminé"}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.done && "line-through text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
                {!isReader && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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
      <PageHeader title="To-do hebdo" description={activeClient ? `${activeClient.name}` : undefined}>
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

                {/* Items */}
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="space-y-2">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="Titre de l'action"
                          value={item.title}
                          onChange={(e) => {
                            const copy = [...newItems];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setNewItems(copy);
                          }}
                        />
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                          value={item.assignedTo}
                          onChange={(e) => {
                            const copy = [...newItems];
                            copy[idx] = { ...copy[idx], assignedTo: e.target.value as "client" | "datashake" };
                            setNewItems(copy);
                          }}
                        >
                          <option value="client">Client</option>
                          <option value="datashake">Datashake</option>
                        </select>
                        {newItems.length > 1 && (
                          <button
                            onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      setNewItems([...newItems, { title: "", assignedTo: "client" }])
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter une action
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={createTodo} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                Cliquez sur &laquo;&nbsp;Nouvelle to-do&nbsp;&raquo; pour commencer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly to-do list */}
      {!loading && todos.length > 0 && (
        <div className="space-y-3">
          {todos.map((todo) => {
            const expanded = expandedIds.has(todo.id);
            const done = doneCount(todo.items);
            const total = todo.items.length;
            const allDone = total > 0 && done === total;
            const clientItems = todo.items.filter((i) => i.assignedTo === "client");
            const datashakeItems = todo.items.filter((i) => i.assignedTo === "datashake");

            return (
              <Card key={todo.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer select-none py-4 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(todo.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base font-semibold">
                        {formatWeekDate(todo.weekDate)}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={allDone ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          allDone && "bg-emerald-500 hover:bg-emerald-600 text-white"
                        )}
                      >
                        {done}/{total} terminée{total > 1 ? "s" : ""}
                      </Badge>
                      {!isReader && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Supprimer cette to-do hebdomadaire ?")) {
                              deleteTodo(todo.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Supprimer la to-do"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 ml-8">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          allDone ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0 pb-5 space-y-5">
                    {/* Client items */}
                    {renderItems(clientItems, `Pour ${activeClient?.name ?? "le client"}`)}

                    {/* Datashake items */}
                    {renderItems(datashakeItems, "Pour Datashake")}

                    {/* No items fallback */}
                    {todo.items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune action pour cette semaine.
                      </p>
                    )}

                    {/* Inline add item */}
                    {!isReader && (
                      <div className="pt-2 border-t">
                        {addingToTodo === todo.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="flex-1"
                              placeholder="Nouvelle action..."
                              value={addItemTitle}
                              onChange={(e) => setAddItemTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addItem(todo.id);
                                if (e.key === "Escape") {
                                  setAddingToTodo(null);
                                  setAddItemTitle("");
                                }
                              }}
                              autoFocus
                            />
                            <select
                              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                              value={addItemAssignedTo}
                              onChange={(e) =>
                                setAddItemAssignedTo(e.target.value as "client" | "datashake")
                              }
                            >
                              <option value="client">Client</option>
                              <option value="datashake">Datashake</option>
                            </select>
                            <Button size="sm" onClick={() => addItem(todo.id)}>
                              Ajouter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAddingToTodo(null);
                                setAddItemTitle("");
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground"
                            onClick={() => {
                              setAddingToTodo(todo.id);
                              setAddItemTitle("");
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter une action
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
