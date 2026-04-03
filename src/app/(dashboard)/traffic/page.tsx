"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, ExternalLink, Download, Settings2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_TRAFFIC_PAGES = [
  { page: "https://www.quitoque.fr/", sessions: 36720, variation: 1356, engaged: 31718, avgTime: "5 min 36 sec", timeChange: -26, engagement: 86, engChange: 4.1 },
  { page: "not set", sessions: 36327, variation: 8795, engaged: 301, avgTime: "2 sec", timeChange: -2, engagement: 1, engChange: -0.1 },
  { page: "https://www.quitoque.fr/blog/art...", sessions: 20355, variation: 20287, engaged: 14297, avgTime: "2 min 13 sec", timeChange: 86, engagement: 70, engChange: 20.2 },
  { page: "https://www.quitoque.fr/blog/art...", sessions: 17314, variation: -10296, engaged: 13246, avgTime: "1 min 51 sec", timeChange: 4, engagement: 77, engChange: 32.7 },
  { page: "https://www.quitoque.fr/au-men...", sessions: 15399, variation: 7366, engaged: 13536, avgTime: "3 min 4 sec", timeChange: -16, engagement: 88, engChange: 15.5 },
  { page: "https://www.quitoque.fr/blog/art...", sessions: 13830, variation: 11862, engaged: 10379, avgTime: "1 min 31 sec", timeChange: -4, engagement: 75, engChange: 27.9 },
  { page: "https://www.quitoque.fr/blog/art...", sessions: 13402, variation: -7057, engaged: 11417, avgTime: "1 min 43 sec", timeChange: -8, engagement: 85, engChange: 23.6 },
  { page: "https://www.quitoque.fr/login", sessions: 12535, variation: 4271, engaged: 10395, avgTime: "7 min 10 sec", timeChange: -93, engagement: 83, engChange: -6.0 },
];

function VariationCell({ value, suffix }: { value: number; suffix?: string }) {
  const isPositive = value > 0;
  return (
    <span className={cn("font-mono text-sm", isPositive ? "text-emerald-600" : value < 0 ? "text-red-500" : "text-muted-foreground")}>
      {isPositive && "+"}{value.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

export default function TrafficPage() {
  const { organization } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Trafic SEO" description={`${organization?.name || ""} (${organization?.domain || ""})`}>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Mode par défaut
        </Button>
      </PageHeader>

      {/* Filters bar like SmartKeyword */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-1">Mode</p>
              <Select defaultValue="traffic_gsc">
                <SelectTrigger className="h-9 bg-primary/10 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic_gsc">Trafic & Search Console</SelectItem>
                  <SelectItem value="gsc_only">Search Console</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-1">Source</p>
              <Select defaultValue="ga4">
                <SelectTrigger className="h-9 bg-primary/10 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ga4">Google Analytics 4</SelectItem>
                  <SelectItem value="gsc">Search Console</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Plage de dates</p>
              <div className="flex items-center gap-1">
                <Input type="date" defaultValue="2026-01-01" className="h-9 text-xs" />
                <span className="text-xs text-muted-foreground">à</span>
                <Input type="date" defaultValue="2026-03-31" className="h-9 text-xs" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Marque</p>
              <Select>
                <SelectTrigger className="h-9"><SelectValue placeholder="Marque" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="brand">Marque</SelectItem>
                  <SelectItem value="no_brand">Hors marque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Appareil</p>
              <Select>
                <SelectTrigger className="h-9"><SelectValue placeholder="Appareil" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="tablet">Tablette</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pays</p>
              <Select>
                <SelectTrigger className="h-9"><SelectValue placeholder="Pays" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="BE">Belgique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Segment pages
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Segment mots clés
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Conversion
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                <RotateCcw className="h-3 w-3" />Réinitialiser
              </Button>
              <Button size="sm" className="text-xs">Appliquer</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Sessions SEO</p>
            <p className="text-3xl font-bold font-mono mt-1">757 k</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              <TrendingUp className="inline h-3 w-3" /> 59 %
            </p>
            <p className="text-xs text-muted-foreground mt-1">61 % total sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Sessions SEO Marque</p>
            <p className="text-3xl font-bold font-mono mt-1">69 k</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              <TrendingUp className="inline h-3 w-3" /> 20 %
            </p>
            <p className="text-xs text-muted-foreground mt-1">9 % Sessions SEO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Sessions SEO Hors Marque</p>
            <p className="text-3xl font-bold font-mono mt-1">688 k</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              <TrendingUp className="inline h-3 w-3" /> 64 %
            </p>
            <p className="text-xs text-muted-foreground mt-1">91 % Sessions SEO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-3xl font-bold font-mono mt-1">1,2 M</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              <TrendingUp className="inline h-3 w-3" /> 26 %
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart placeholder + table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Sessions et engagements</CardTitle>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="none">
              <TabsList className="h-8">
                <TabsTrigger value="none" className="text-xs px-3 h-6">Aucune</TabsTrigger>
                <TabsTrigger value="country" className="text-xs px-3 h-6">Pays</TabsTrigger>
                <TabsTrigger value="device" className="text-xs px-3 h-6">Appareil</TabsTrigger>
                <TabsTrigger value="brand" className="text-xs px-3 h-6">Marque</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Chart area - placeholder for recharts */}
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Graphique Sessions SEO (intégration recharts à venir avec données GSC/GA4 réelles)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pages table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Détail par page</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Settings2 className="h-3 w-3" />Gérer les colonnes 6/13
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3 w-3" />Exporter
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Page</TableHead>
                <TableHead className="text-right">Sessions SEO</TableHead>
                <TableHead className="text-right">Variation sessions</TableHead>
                <TableHead className="text-right">Sessions avec engagement</TableHead>
                <TableHead className="text-right">Durée moyenne sur la page</TableHead>
                <TableHead className="text-right">Taux d&apos;engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_TRAFFIC_PAGES.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {row.page.startsWith("http") ? (
                      <a href={row.page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-[260px]">
                        {row.page.replace("https://www.", "")}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-sm">{row.page}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm">{row.sessions.toLocaleString("fr-FR")}</span>
                    {" "}
                    <VariationCell value={Math.round((row.variation / (row.sessions - row.variation)) * 100)} suffix="%" />
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationCell value={row.variation} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm">{row.engaged.toLocaleString("fr-FR")}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm">{row.avgTime}</span>
                    {" "}
                    <VariationCell value={row.timeChange} suffix="sec" />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm">{row.engagement} %</span>
                    {" "}
                    <VariationCell value={row.engChange} suffix="%" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-4 p-4 border-t text-sm text-muted-foreground">
          <span>Lignes par page</span>
          <Select defaultValue="100">
            <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>1 - 100 / 5331</span>
          <span>Page 1 / 54</span>
        </div>
      </Card>
    </div>
  );
}
