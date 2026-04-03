"use client";

import { useStudy } from "@/lib/study-context";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, KanbanSquare, FileText, TrendingUp, TrendingDown, Link2, Bell, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { currentStudy } = useStudy();

  return (
    <div className="space-y-6">
      {/* Study context header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble pour {currentStudy.clientName} ({currentStudy.domain})
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Mots-cl\u00e9s suivis" value="347" change={12} changeLabel="cette semaine" icon={Search} />
        <KPICard title="Position moyenne" value="18.4" change={-2.1} changeLabel="vs semaine pr\u00e9c." icon={TrendingUp} />
        <KPICard title="Sessions SEO" value="12.4k" change={15} changeLabel="% vs p\u00e9riode pr\u00e9c." icon={TrendingUp} iconColor="text-emerald-600" />
        <KPICard title="Backlinks actifs" value="28" change={3} icon={Link2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Top 3" value="24" change={2} icon={TrendingUp} iconColor="text-emerald-600" />
        <KPICard title="Top 10" value="84" change={5} icon={TrendingUp} iconColor="text-blue-600" />
        <KPICard title="Top 30" value="156" change={-3} icon={TrendingDown} iconColor="text-amber-600" />
        <KPICard title="T\u00e2ches en cours" value="5" change={1} icon={KanbanSquare} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/keywords">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Voir les mots-cl\u00e9s
          </Button>
        </Link>
        <Link href="/traffic">
          <Button size="sm" variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trafic SEO
          </Button>
        </Link>
        <Link href="/content/new">
          <Button size="sm" variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Nouvel article
          </Button>
        </Link>
        <Link href="/projects">
          <Button size="sm" variant="outline" className="gap-2">
            <KanbanSquare className="h-4 w-4" />
            T\u00e2ches
          </Button>
        </Link>
      </div>

      {/* Top Keywords + Alerts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Top mots-cl\u00e9s - {currentStudy.clientName}</CardTitle>
            <Link href="/keywords">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { keyword: "pizza", position: 2, change: 1, volume: 1500000 },
                { keyword: "\u00e9picerie", position: 4, change: -2, volume: 550000 },
                { keyword: "mousses au chocolat", position: 8, change: 3, volume: 246000 },
                { keyword: "recette lasagnes", position: 12, change: 0, volume: 201000 },
                { keyword: "halloween", position: 15, change: -5, volume: 201000 },
              ].map((kw) => (
                <div key={kw.keyword} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                      {kw.position}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground font-mono">{kw.volume.toLocaleString("fr-FR")} vol.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {kw.change > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <TrendingUp className="h-3 w-3" />+{kw.change}
                      </Badge>
                    )}
                    {kw.change < 0 && (
                      <Badge variant="secondary" className="gap-1 bg-red-50 text-red-700 border-red-200">
                        <TrendingDown className="h-3 w-3" />{kw.change}
                      </Badge>
                    )}
                    {kw.change === 0 && (
                      <Badge variant="secondary" className="text-muted-foreground">=</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Alertes r\u00e9centes</CardTitle>
            <Link href="/alerts">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Chute: 'recette lasagnes' -5 pos.", severity: "warning", time: "Il y a 2h" },
                { title: "Top 3 atteint: 'pizza'", severity: "success", time: "Il y a 5h" },
                { title: "Article en retard", severity: "critical", time: "Hier" },
              ].map((alert, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    alert.severity === "critical" ? "bg-red-500" : alert.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div>
                    <p className="text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
