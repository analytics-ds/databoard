"use client";

import { useState } from "react";
import { useStudy } from "@/lib/study-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Calendar, Download, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_TYPE_CONFIG } from "@/lib/constants";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskType = keyof typeof TASK_TYPE_CONFIG;

interface DemoTask {
  id: string;
  title: string;
  status: TaskStatus;
  type: TaskType;
  keyword?: string;
  assigneeInitials?: string;
  dueDate?: string;
  overdue?: boolean;
}

const DEMO_TASKS: DemoTask[] = [
  { id: "1", title: "LP : batch cooking automne", status: "todo", type: "content", keyword: "batch cooking automne" },
  { id: "2", title: "LP : batch cooking ete", status: "todo", type: "content", keyword: "batch cooking ete" },
  { id: "3", title: "LP : r\u00e9gime m\u00e9diterran\u00e9en menu semaine", status: "todo", type: "content", keyword: "r\u00e9gime m\u00e9diterran\u00e9en menu semaine" },
  { id: "4", title: "Optimisation balises title x20", status: "todo", type: "technique" },
  { id: "5", title: "Backlink : les-calories.com", status: "in_progress", type: "netlinking", dueDate: "24 juin", overdue: true },
  { id: "6", title: "R\u00e9daction article panier repas", status: "in_progress", type: "content" },
  { id: "7", title: "Backlink : recettehealthy.com", status: "done", type: "netlinking", dueDate: "27 novembre" },
  { id: "8", title: "MAJ contenu + images LP P\u00e2ques", status: "done", type: "content", assigneeInitials: "K.B" },
  { id: "9", title: "Audit technique complet", status: "done", type: "audit" },
  { id: "10", title: "Setup GA4 events", status: "done", type: "technique" },
];

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "A FAIRE" },
  { status: "in_progress", title: "EN COURS" },
  { status: "done", title: "R\u00c9ALIS\u00c9ES" },
];

export default function ProjectsPage() {
  const { currentStudy } = useStudy();
  const [tasks, setTasks] = useState(DEMO_TASKS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="T\u00e2ches"
        description={`\u00c9tude (${currentStudy.domain}) — Soci\u00e9t\u00e9 (${currentStudy.clientName})`}
      />

      {/* Filters bar like SmartKeyword */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground shrink-0">Date d&apos;\u00e9ch\u00e9ance</Label>
          <Input type="date" className="h-8 w-32 text-xs" placeholder="Date de d\u00e9but" />
          <span className="text-xs text-muted-foreground">\u00e0</span>
          <Input type="date" className="h-8 w-32 text-xs" placeholder="Date de fin" />
        </div>
        <Button variant="outline" size="sm" className="text-xs">Filtrer par type</Button>
        <Button variant="outline" size="sm" className="text-xs">Filtrer par utilisateur</Button>
        <Button variant="outline" size="sm" className="text-xs">Suivi par</Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Archive className="h-3 w-3" />T\u00e2ches archiv\u00e9es
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Download className="h-3 w-3" />Exporter les t\u00e2ches
        </Button>
      </div>

      {/* Kanban Board - 3 columns like SmartKeyword */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div className="mb-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{col.title}</h3>
              </div>
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 min-h-[300px]">
                {/* Add task button */}
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-dashed" />}>
                    <Plus className="h-3 w-3" />
                    Ajouter une t\u00e2che
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle t\u00e2che</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input placeholder="Titre de la t\u00e2che" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="content">Content</SelectItem>
                              <SelectItem value="netlinking">Netlinking</SelectItem>
                              <SelectItem value="technique">Technique</SelectItem>
                              <SelectItem value="audit">Audit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date d&apos;\u00e9ch\u00e9ance</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mot cl\u00e9 associ\u00e9</Label>
                        <Input placeholder="Ex: batch cooking" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button>Cr\u00e9er</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {columnTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      {/* Color bar */}
                      <div className={cn(
                        "h-1 w-16 rounded-full mb-3",
                        task.type === "content" ? "bg-blue-500" : task.type === "netlinking" ? "bg-purple-500" : task.type === "technique" ? "bg-orange-500" : "bg-pink-500"
                      )} />

                      <h4 className="text-sm font-medium mb-3">{task.title}</h4>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={cn("text-[10px]", TASK_TYPE_CONFIG[task.type].color)}>
                          {TASK_TYPE_CONFIG[task.type].label}
                        </Badge>
                        {task.keyword && (
                          <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">
                            {task.keyword}
                          </Badge>
                        )}
                        {task.dueDate && (
                          <span className={cn("flex items-center gap-1 text-[10px]", task.overdue ? "text-red-500" : "text-muted-foreground")}>
                            <Calendar className="h-3 w-3" />
                            {task.overdue && "\u26a0"} {task.dueDate}
                          </span>
                        )}
                        {task.assigneeInitials && (
                          <span className="ml-auto text-xs font-medium text-muted-foreground">{task.assigneeInitials}</span>
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
    </div>
  );
}
