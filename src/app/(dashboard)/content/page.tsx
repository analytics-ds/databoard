"use client";

import Link from "next/link";
import { useStudy } from "@/lib/study-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_STATUS_CONFIG } from "@/lib/constants";

const DEMO_CONTENT = [
  { id: "1", title: "LP batch cooking automne", status: "writing" as const, targetKeyword: "batch cooking automne", wordCount: 2450, seoScore: 72, author: "Marie L.", authorInitials: "ML", updatedAt: "2026-04-02" },
  { id: "2", title: "LP batch cooking ete", status: "draft" as const, targetKeyword: "batch cooking ete", wordCount: 450, seoScore: 23, author: "Pierre G.", authorInitials: "PG", updatedAt: "2026-04-03" },
  { id: "3", title: "Guide menu de la semaine", status: "published" as const, targetKeyword: "menu de la semaine", wordCount: 3200, seoScore: 91, author: "Thomas R.", authorInitials: "TR", updatedAt: "2026-03-28" },
  { id: "4", title: "Top recettes faciles du soir", status: "review" as const, targetKeyword: "recette facile soir", wordCount: 1800, seoScore: 85, author: "Marie L.", authorInitials: "ML", updatedAt: "2026-04-01" },
  { id: "5", title: "Comparatif box repas 2026", status: "writing" as const, targetKeyword: "box repas", wordCount: 1200, seoScore: 56, author: "Pierre G.", authorInitials: "PG", updatedAt: "2026-04-02" },
];

function ScoreIndicator({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={score} className="h-2 w-16" />
      <span className={cn("text-xs font-mono font-semibold", score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500")}>{score}</span>
    </div>
  );
}

export default function ContentPage() {
  const { currentStudy } = useStudy();

  return (
    <div className="space-y-6">
      <PageHeader title="Contenu" description={`Articles SEO pour ${currentStudy.clientName}`}>
        <Link href="/content/new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nouvel article</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold font-mono">{DEMO_CONTENT.length}</p><p className="text-xs text-muted-foreground">Total</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold font-mono text-blue-600">{DEMO_CONTENT.filter(c => c.status === "writing").length}</p><p className="text-xs text-muted-foreground">En r\u00e9daction</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold font-mono text-amber-600">{DEMO_CONTENT.filter(c => c.status === "review").length}</p><p className="text-xs text-muted-foreground">En relecture</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold font-mono text-emerald-600">{DEMO_CONTENT.filter(c => c.status === "published").length}</p><p className="text-xs text-muted-foreground">Publi\u00e9s</p></Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Titre</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead>Mot-cl\u00e9 cible</TableHead>
                <TableHead className="text-right">Mots</TableHead>
                <TableHead className="w-[120px]">Score SEO</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead className="text-right">Mis \u00e0 jour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_CONTENT.map((item) => (
                <TableRow key={item.id} className="group cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/content/${item.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("text-xs", CONTENT_STATUS_CONFIG[item.status].color)}>
                      {CONTENT_STATUS_CONFIG[item.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.targetKeyword}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{item.wordCount.toLocaleString("fr-FR")}</TableCell>
                  <TableCell><ScoreIndicator score={item.seoScore} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{item.authorInitials}</AvatarFallback></Avatar>
                      <span className="text-sm">{item.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString("fr-FR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
