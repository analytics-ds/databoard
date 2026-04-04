"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Users,
  ListTodo,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
}

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  assignedTo: string;
}

interface Todo {
  id: string;
  orgId: string;
  orgName: string;
  weekDate: string;
  createdAt: string;
  totalItems: number;
  doneItems: number;
  items: TodoItem[];
}

interface Task {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  status: string;
  type: string;
  category: string;
  keyword: string;
  dueDate: string;
  assigneeName: string;
  createdAt: string;
}

interface OverviewData {
  clients: Client[];
  todos: Todo[];
  tasks: Task[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  brief_prep: "En prépa",
  brief_done: "Brief rédigé",
  review: "À relire",
  done: "Terminé",
  todo: "À faire",
  in_progress: "En cours",
};

const STATUS_COLORS: Record<string, string> = {
  brief_prep: "bg-slate-100 text-slate-700",
  brief_done: "bg-yellow-100 text-yellow-700",
  review: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-orange-100 text-orange-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  content: "bg-blue-500",
  technique: "bg-orange-500",
  netlinking: "bg-purple-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Contenu",
  technique: "Technique",
  netlinking: "Netlinking",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWeekDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `Semaine du ${day}/${month}/${year}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameWeek(a: Date, b: Date): boolean {
  const ma = getMonday(a);
  const mb = getMonday(b);
  return ma.getTime() === mb.getTime();
}

function isOverdue(dueDate: string, status: string): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate) < new Date();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const { isAdmin, isConsultant, clients, setActiveClient, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>("orgName");
  const [sortAsc, setSortAsc] = useState(true);

  // --- Auth guard ---
  useEffect(() => {
    if (!authLoading && !isAdmin && !isConsultant) {
      router.push("/dashboard");
    }
  }, [authLoading, isAdmin, isConsultant, router]);

  // --- Fetch data ---
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/consultant-overview");
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    if (isAdmin || isConsultant) {
      fetchData();
    }
  }, [isAdmin, isConsultant]);

  // --- Filtered data ---
  const filteredTodos = useMemo(() => {
    if (!data) return [];
    if (clientFilter === "all") return data.todos;
    return data.todos.filter((t) => t.orgId === clientFilter);
  }, [data, clientFilter]);

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    let tasks = data.tasks;
    if (clientFilter !== "all")
      tasks = tasks.filter((t) => t.orgId === clientFilter);
    if (statusFilter !== "all")
      tasks = tasks.filter((t) => t.status === statusFilter);
    if (categoryFilter !== "all")
      tasks = tasks.filter((t) => t.category === categoryFilter);
    return tasks;
  }, [data, clientFilter, statusFilter, categoryFilter]);

  // --- Sorted tasks for table ---
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      const aVal = (a as any)[sortColumn] || "";
      const bVal = (b as any)[sortColumn] || "";
      const cmp = String(aVal).localeCompare(String(bVal), "fr");
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [filteredTasks, sortColumn, sortAsc]);

  // --- Summary stats ---
  const stats = useMemo(() => {
    if (!data) return { clients: 0, pendingItems: 0, totalTasks: 0, overdue: 0 };
    const pendingItems = data.todos.reduce(
      (sum, t) => sum + (t.totalItems - t.doneItems),
      0
    );
    const overdue = data.tasks.filter((t) =>
      isOverdue(t.dueDate, t.status)
    ).length;
    return {
      clients: data.clients.length,
      pendingItems,
      totalTasks: data.tasks.length,
      overdue,
    };
  }, [data]);

  // --- Todos grouped by client ---
  const todosByClient = useMemo(() => {
    const map = new Map<string, { client: Client | null; todos: Todo[] }>();
    for (const todo of filteredTodos) {
      if (!map.has(todo.orgId)) {
        const client = data?.clients.find((c) => c.id === todo.orgId) || null;
        map.set(todo.orgId, { client, todos: [] });
      }
      map.get(todo.orgId)!.todos.push(todo);
    }
    // Sort by client name
    return Array.from(map.values()).sort((a, b) =>
      (a.client?.name || "").localeCompare(b.client?.name || "", "fr")
    );
  }, [filteredTodos, data]);

  // --- Gantt helpers ---
  const ganttWeeks = useMemo(() => {
    const today = new Date();
    const currentMonday = getMonday(today);
    const weeks: Date[] = [];
    for (let i = -2; i <= 5; i++) {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i * 7);
      weeks.push(d);
    }
    return weeks;
  }, []);

  const ganttTasksByClient = useMemo(() => {
    const tasks = filteredTasks.filter((t) => t.status !== "done");
    const withDate = tasks.filter((t) => t.dueDate);
    const withoutDate = tasks.filter((t) => !t.dueDate);
    const map = new Map<
      string,
      { client: Client | null; tasks: Task[]; noDateTasks: Task[] }
    >();
    for (const task of withDate) {
      if (!map.has(task.orgId)) {
        const client = data?.clients.find((c) => c.id === task.orgId) || null;
        map.set(task.orgId, { client, tasks: [], noDateTasks: [] });
      }
      map.get(task.orgId)!.tasks.push(task);
    }
    for (const task of withoutDate) {
      if (!map.has(task.orgId)) {
        const client = data?.clients.find((c) => c.id === task.orgId) || null;
        map.set(task.orgId, { client, tasks: [], noDateTasks: [] });
      }
      map.get(task.orgId)!.noDateTasks.push(task);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.client?.name || "").localeCompare(b.client?.name || "", "fr")
    );
  }, [filteredTasks, data]);

  // --- Toggle sort ---
  function handleSort(col: string) {
    if (sortColumn === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  }

  // --- Toggle todo expansion ---
  function toggleTodo(id: string) {
    setExpandedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Gantt: get week index for a date ---
  function getWeekIndex(dueDate: string): number {
    const d = new Date(dueDate);
    const taskMonday = getMonday(d);
    for (let i = 0; i < ganttWeeks.length; i++) {
      if (ganttWeeks[i].getTime() === taskMonday.getTime()) return i;
    }
    return -1;
  }

  // -------------------------------------------------------------------------
  // Auth loading / guard
  // -------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin && !isConsultant) return null;

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vue d'ensemble"
          description="Récapitulatif de tous vos projets"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue d'ensemble"
        description="Récapitulatif de tous vos projets"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.clients}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <ListTodo className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingItems}</p>
              <p className="text-xs text-muted-foreground">To-dos en attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
              <p className="text-xs text-muted-foreground">Tâches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className={cn("rounded-lg p-2.5", stats.overdue > 0 ? "bg-red-100" : "bg-gray-100")}>
              <AlertTriangle className={cn("h-5 w-5", stats.overdue > 0 ? "text-red-600" : "text-gray-400")} />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", stats.overdue > 0 && "text-red-600")}>
                {stats.overdue}
              </p>
              <p className="text-xs text-muted-foreground">En retard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client filter (global) */}
      <div className="flex items-center gap-3">
        <Select
          value={clientFilter}
          onValueChange={(v) => setClientFilter(v || "all")}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {data?.clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todo">To-do</TabsTrigger>
          <TabsTrigger value="tableau">Tableau</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: To-do */}
        {/* ================================================================ */}
        <TabsContent value="todo">
          {todosByClient.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune to-do hebdomadaire.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {todosByClient.map(({ client, todos }) => (
                <div key={client?.id || "unknown"} className="space-y-3">
                  {/* Client header */}
                  <div className="flex items-center gap-3">
                    {client?.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(client?.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold">
                      {client?.name || "Client inconnu"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {client?.domain}
                    </span>
                  </div>

                  {/* Weekly todo cards */}
                  {todos
                    .sort((a, b) => (b.weekDate > a.weekDate ? 1 : -1))
                    .map((todo) => {
                      const expanded = expandedTodos.has(todo.id);
                      const pct =
                        todo.totalItems > 0
                          ? Math.round(
                              (todo.doneItems / todo.totalItems) * 100
                            )
                          : 0;
                      const allDone =
                        todo.totalItems > 0 &&
                        todo.doneItems === todo.totalItems;

                      return (
                        <Card key={todo.id} className="overflow-hidden">
                          <CardHeader
                            className="cursor-pointer select-none py-4 hover:bg-muted/30 transition-colors"
                            onClick={() => toggleTodo(todo.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <CardTitle className="text-sm font-semibold">
                                  {formatWeekDate(todo.weekDate)}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {pct}%
                                </span>
                                <Badge
                                  variant={allDone ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs",
                                    allDone &&
                                      "bg-emerald-500 hover:bg-emerald-600 text-white"
                                  )}
                                >
                                  {todo.doneItems}/{todo.totalItems}
                                </Badge>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 ml-7">
                              <div className="h-1.5 w-full rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    allDone ? "bg-emerald-500" : "bg-primary"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </CardHeader>

                          {expanded && (
                            <CardContent className="pt-0 pb-4">
                              <ul className="space-y-1">
                                {todo.items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-md px-2 py-1.5"
                                  >
                                    {item.done ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span
                                      className={cn(
                                        "flex-1 text-sm",
                                        item.done &&
                                          "line-through text-muted-foreground"
                                      )}
                                    >
                                      {item.title}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {item.assignedTo === "datashake"
                                        ? "Datashake"
                                        : "Client"}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 pt-3 border-t">
                                <button
                                  onClick={() => {
                                    const target = clients.find((c) => c.id === todo.orgId);
                                    if (target) setActiveClient(target);
                                    router.push("/projects");
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Voir le projet &rarr;
                                </button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: Tableau */}
        {/* ================================================================ */}
        <TabsContent value="tableau">
          {/* Extra filters for table */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v || "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v || "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sortedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune tâche trouvée.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {[
                      { key: "orgName", label: "Client" },
                      { key: "title", label: "Titre" },
                      { key: "category", label: "Catégorie" },
                      { key: "type", label: "Type" },
                      { key: "status", label: "Statut" },
                      { key: "dueDate", label: "Échéance" },
                      { key: "assigneeName", label: "Assigné" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleSort(col.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown
                            className={cn(
                              "h-3 w-3",
                              sortColumn === col.key
                                ? "text-foreground"
                                : "text-muted-foreground/40"
                            )}
                          />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => {
                        const target = clients.find((c) => c.id === task.orgId);
                        if (target) setActiveClient(target);
                        router.push("/projects/kanban");
                      }}
                    >
                      <td className="px-4 py-3 font-medium">{task.orgName}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate">
                        {task.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[task.category] || task.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {task.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_COLORS[task.status] ||
                              "bg-gray-100 text-gray-700"
                          )}
                        >
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            isOverdue(task.dueDate, task.status) &&
                              "text-red-600 font-medium"
                          )}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {task.assigneeName || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: Gantt */}
        {/* ================================================================ */}
        <TabsContent value="gantt">
          <TooltipProvider>
            {ganttTasksByClient.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucune tâche à afficher.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Timeline header */}
                <div className="rounded-lg border overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Week headers */}
                    <div className="flex border-b bg-muted/50">
                      <div className="w-48 shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground">
                        Client / Tâche
                      </div>
                      <div className="flex flex-1">
                        {ganttWeeks.map((week, i) => {
                          const isCurrentWeek = isSameWeek(week, new Date());
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 border-l px-2 py-2 text-center text-xs",
                                isCurrentWeek
                                  ? "bg-primary/5 font-semibold text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              <span className="hidden sm:inline">S. </span>
                              {String(week.getDate()).padStart(2, "0")}/
                              {String(week.getMonth() + 1).padStart(2, "0")}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rows grouped by client */}
                    {ganttTasksByClient.map(
                      ({ client, tasks: clientTasks, noDateTasks }) => (
                        <div key={client?.id || "unknown"}>
                          {/* Client row header */}
                          <div className="flex border-b bg-muted/20">
                            <div className="w-48 shrink-0 px-4 py-2 flex items-center gap-2">
                              {client?.logoUrl ? (
                                <img
                                  src={client.logoUrl}
                                  alt=""
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                  {(client?.name || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs font-semibold truncate">
                                {client?.name || "Inconnu"}
                              </span>
                            </div>
                            <div className="flex flex-1">
                              {ganttWeeks.map((week, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex-1 border-l",
                                    isSameWeek(week, new Date()) &&
                                      "bg-primary/5"
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Task rows */}
                          {clientTasks.map((task) => {
                            const weekIdx = getWeekIndex(task.dueDate);
                            const catColor =
                              CATEGORY_COLORS[task.category] || "bg-gray-400";
                            return (
                              <div
                                key={task.id}
                                className="flex border-b last:border-0 hover:bg-muted/20 transition-colors"
                              >
                                <div className="w-48 shrink-0 px-4 py-1.5 text-xs truncate text-muted-foreground">
                                  {task.title}
                                </div>
                                <div className="flex flex-1 relative">
                                  {ganttWeeks.map((week, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "flex-1 border-l flex items-center justify-center py-1.5",
                                        isSameWeek(week, new Date()) &&
                                          "bg-primary/5"
                                      )}
                                    >
                                      {i === weekIdx && (
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <div
                                                className={cn(
                                                  "h-5 w-[85%] rounded-sm cursor-default",
                                                  catColor,
                                                  isOverdue(
                                                    task.dueDate,
                                                    task.status
                                                  ) && "opacity-70 ring-2 ring-red-400"
                                                )}
                                              />
                                            }
                                          />
                                          <TooltipContent>
                                            <p className="font-medium">
                                              {task.title}
                                            </p>
                                            <p className="text-[10px] opacity-70">
                                              {CATEGORY_LABELS[task.category] ||
                                                task.category}{" "}
                                              &middot;{" "}
                                              {STATUS_LABELS[task.status] ||
                                                task.status}{" "}
                                              &middot; {formatDate(task.dueDate)}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Tasks without dates */}
                {(() => {
                  const noDateTasks = ganttTasksByClient.flatMap(
                    (g) => g.noDateTasks
                  );
                  if (noDateTasks.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Sans date
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {noDateTasks.map((task) => (
                          <Badge
                            key={task.id}
                            variant="secondary"
                            className="text-xs gap-1.5"
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                CATEGORY_COLORS[task.category] || "bg-gray-400"
                              )}
                            />
                            {task.orgName}: {task.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-medium">Légende :</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-blue-500" />
                    Contenu
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-orange-500" />
                    Technique
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-purple-500" />
                    Netlinking
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-gray-400" />
                    Autre
                  </span>
                </div>
              </div>
            )}
          </TooltipProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
}
