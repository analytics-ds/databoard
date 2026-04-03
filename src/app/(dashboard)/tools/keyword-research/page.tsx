"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Loader2, Globe, BarChart3, ArrowUpDown, FileText,
} from "lucide-react";
import { getPositionColor } from "@/lib/constants";

async function haloscanCall(endpoint: string, params: Record<string, any>) {
  const res = await fetch("/api/haloscan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, params }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function formatNum(n: number | undefined | null) {
  if (n == null || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("fr-FR");
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round((value > 1 ? value : value * 100));
  const color = pct < 30 ? "bg-emerald-500" : pct < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function MiniBarChart({ data, labelKey, valueKey, color = "bg-primary" }: {
  data: { label: string; value: number }[];
  labelKey?: string;
  valueKey?: string;
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((point, i) => {
        const heightPct = max > 0 ? (point.value / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <div className={`w-full ${color} rounded-t opacity-70 min-h-[2px]`} style={{ height: `${heightPct}%` }} />
            <span className="text-[7px] text-muted-foreground truncate w-full text-center">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function KeywordResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Recherche de mots clés" description="Explorez les mots clés et analysez les domaines avec Haloscan" />
      <Tabs defaultValue="keywords" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keywords" className="gap-2"><Search className="h-4 w-4" />Mots clés</TabsTrigger>
          <TabsTrigger value="domain" className="gap-2"><Globe className="h-4 w-4" />Analyse de domaine</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2"><FileText className="h-4 w-4" />Volumes en masse</TabsTrigger>
        </TabsList>
        <TabsContent value="keywords"><KeywordTab /></TabsContent>
        <TabsContent value="domain"><DomainTab /></TabsContent>
        <TabsContent value="bulk"><BulkTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Tab 1: Keywords ──────────────────────────────────────
function KeywordTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<"match" | "history">("match");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [overviewRes, matchRes] = await Promise.all([
        haloscanCall("keywords/overview", {
          keyword: query.trim(),
          requested_data: ["metrics", "volume_history"],
        }),
        haloscanCall("keywords/match", {
          keyword: query.trim(),
          lineCount: 100,
          order_by: "volume",
          order: "desc",
        }),
      ]);
      setOverview(overviewRes);
      setMatchResults(matchRes.results || []);
    } catch (e: any) {
      setError("Erreur lors de la recherche. Vérifiez votre clé API Haloscan.");
    } finally {
      setLoading(false);
    }
  }

  // Parse Haloscan response
  const seoMetrics = overview?.seo_metrics || {};
  const adsMetrics = overview?.ads_metrics || {};
  const volume = adsMetrics.volume || seoMetrics.volume || 0;
  const cpc = adsMetrics.cpc || 0;
  const competition = adsMetrics.competition || 0;

  // Volume history: timestamps → array
  const volumeHistory: { label: string; value: number }[] = [];
  if (overview?.volume_history?.results) {
    const entries = Object.entries(overview.volume_history.results) as [string, number][];
    entries.sort(([a], [b]) => Number(a) - Number(b));
    for (const [ts, vol] of entries.slice(-12)) {
      const d = new Date(Number(ts) * 1000);
      volumeHistory.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).slice(0, 3),
        value: vol,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Entrez un mot clé (ex: chaussures running)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()} className="gap-2 min-w-[140px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">{error}</div>
      )}

      {overview && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Volume mensuel</p>
                <p className="text-2xl font-bold">{formatNum(volume)}</p>
                {volumeHistory.length > 0 && (
                  <div className="mt-3">
                    <MiniBarChart data={volumeHistory} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">CPC moyen</p>
                <p className="text-2xl font-bold">{cpc.toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground mt-1">
                  KGR: {seoMetrics.kgr?.toFixed(2) || "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Concurrence</p>
                <CompetitionBar value={competition} />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatNum(seoMetrics.results_count)} résultats Google
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            <button onClick={() => setSubTab("match")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === "match" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Mots clés similaires ({matchResults.length})
            </button>
            <button onClick={() => setSubTab("history")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Historique de volume
            </button>
          </div>

          {subTab === "match" && <KeywordTable data={matchResults} />}

          {subTab === "history" && volumeHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Évolution du volume de recherche — « {query} »</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-40">
                  {volumeHistory.map((point, i) => {
                    const max = Math.max(...volumeHistory.map((p) => p.value));
                    const heightPct = max > 0 ? (point.value / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-medium text-muted-foreground">{formatNum(point.value)}</span>
                        <div className="w-full bg-primary rounded-t min-h-[2px] opacity-70" style={{ height: `${heightPct}%` }} />
                        <span className="text-[9px] text-muted-foreground">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!overview && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez un mot clé pour commencer votre recherche</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Domain ────────────────────────────────────────
function DomainTab() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [domainSubTab, setDomainSubTab] = useState<"keywords" | "pages" | "visibility">("keywords");

  async function handleSearch() {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    try {
      const overviewRes = await haloscanCall("domains/overview", {
        input: domain.trim(),
        mode: "domain",
        requested_data: ["metrics", "best_keywords", "best_pages", "visibility_index_history", "positions_breakdown_history"],
      });
      setData(overviewRes);

      // Load all positions with pagination
      let allPositions: any[] = [];
      let page = 1;
      let hasNext = true;
      while (hasNext) {
        const res = await haloscanCall("domains/positions", {
          input: domain.trim(),
          mode: "domain",
          lineCount: 100,
          page,
          order_by: "traffic",
          order: "desc",
        });
        const results = res.results || [];
        allPositions = [...allPositions, ...results];
        hasNext = results.length === 100 && allPositions.length < 5000; // safety cap
        page++;
      }
      setPositions(allPositions);
    } catch {
      setError("Erreur lors de l'analyse. Vérifiez le domaine et votre clé API.");
    } finally {
      setLoading(false);
    }
  }

  // Parse domain metrics
  const stats = data?.metrics?.stats;
  const visHistory = (data?.visibility_index_history?.results || []).map((p: any) => ({
    label: new Date(p.agg_date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }).slice(0, 6),
    value: p.visibility_index || 0,
  }));
  const bestKws = data?.best_keywords?.results || [];
  const bestPages = data?.best_pages?.results || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Entrez un domaine (ex: quitoque.fr)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !domain.trim()} className="gap-2 min-w-[140px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">{error}</div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Mots clés", value: formatNum(stats.total_keyword_count) },
              { label: "Trafic organique", value: formatNum(stats.total_traffic) },
              { label: "Valeur du trafic", value: `${formatNum(stats.traffic_value)} €` },
              { label: "Pages actives", value: formatNum(stats.active_page_count) },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Top 3", value: stats.top_3_positions, color: "bg-emerald-500" },
              { label: "Top 10", value: stats.top_10_positions, color: "bg-blue-500" },
              { label: "Top 50", value: stats.top_50_positions, color: "bg-amber-500" },
              { label: "Top 100", value: stats.top_100_positions, color: "bg-orange-500" },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                <div className={`h-3 w-3 rounded-full ${p.color}`} />
                <div>
                  <p className="text-lg font-bold">{formatNum(p.value)}</p>
                  <p className="text-[11px] text-muted-foreground">{p.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "keywords" as const, label: `Mots clés positionnés (${positions.length})` },
              { id: "pages" as const, label: `Meilleures pages (${bestPages.length})` },
              { id: "visibility" as const, label: "Courbe de visibilité" },
            ].map((t) => (
              <button key={t.id} onClick={() => setDomainSubTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${domainSubTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {domainSubTab === "keywords" && (
            <KeywordTable data={positions} showPosition showTraffic showUrl />
          )}

          {domainSubTab === "pages" && bestPages.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>URL</span>
                    <span className="text-right">Mots clés</span>
                    <span className="text-right">Trafic</span>
                  </div>
                  {bestPages.map((page: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <span className="truncate text-sm text-primary">{page.url}</span>
                      <span className="text-right text-sm">{formatNum(page.unique_keywords)}</span>
                      <span className="text-right text-sm font-medium">{formatNum(page.total_traffic)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {domainSubTab === "visibility" && visHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Indice de visibilité — {domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-0.5 h-40">
                  {visHistory.slice(-30).map((point: any, i: number) => {
                    const max = Math.max(...visHistory.map((p: any) => p.value));
                    const heightPct = max > 0 ? (point.value / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                        <div className="w-full bg-primary rounded-t min-h-[2px] opacity-70" style={{ height: `${heightPct}%` }} />
                        {i % 5 === 0 && <span className="text-[7px] text-muted-foreground truncate">{point.label}</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!stats && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez un domaine pour analyser ses performances SEO</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Bulk ──────────────────────────────────────────
function BulkTab() {
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch() {
    const kws = keywords.split("\n").map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await haloscanCall("keywords/bulk", { keywords: kws });
      setResults(res.results || res.data || []);
    } catch {
      setError("Erreur lors de la récupération des volumes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-medium">Collez vos mots clés (un par ligne)</p>
          <textarea
            className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={"chaussures running\nbaskets homme\nsneakers pas cher"}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {keywords.split("\n").filter((k) => k.trim()).length} mots clés
            </p>
            <Button onClick={handleSearch} disabled={loading || !keywords.trim()} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Récupérer les volumes
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">{error}</div>
      )}

      {results.length > 0 && <KeywordTable data={results} />}
    </div>
  );
}

// ── Reusable Table ───────────────────────────────────────
function KeywordTable({ data, showPosition = false, showTraffic = false, showUrl = false }: {
  data: any[];
  showPosition?: boolean;
  showTraffic?: boolean;
  showUrl?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const cols = showUrl ? "grid-cols-[1fr_1fr_80px_70px_80px_80px]"
    : showPosition ? "grid-cols-[1fr_60px_80px_70px_80px]"
    : "grid-cols-[1fr_80px_70px_100px]";

  function SortHeader({ label, field }: { label: string; field: string }) {
    return (
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? "text-primary" : ""}`} />
      </button>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          <div className={`grid gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${cols}`}>
            <SortHeader label="Mot clé" field="keyword" />
            {showPosition && <SortHeader label="Pos." field="position" />}
            <SortHeader label="Volume" field="volume" />
            <SortHeader label="CPC" field="cpc" />
            {showTraffic ? <SortHeader label="Trafic" field="traffic" /> : <span>Concurrence</span>}
            {showUrl && <span>URL</span>}
          </div>

          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun résultat</div>
          ) : (
            sorted.map((kw, i) => (
              <div key={i} className={`grid gap-4 px-4 py-2 hover:bg-muted/30 transition-colors items-center ${cols}`}>
                <span className="text-sm font-medium truncate">{kw.keyword}</span>
                {showPosition && (
                  <span className={`inline-flex h-6 w-10 items-center justify-center rounded text-xs font-bold ${getPositionColor(kw.position)}`}>
                    {kw.position || "—"}
                  </span>
                )}
                <span className="text-sm font-medium">{formatNum(kw.volume)}</span>
                <span className="text-sm text-muted-foreground">{kw.cpc != null ? `${Number(kw.cpc).toFixed(2)} €` : "—"}</span>
                {showTraffic ? <span className="text-sm">{formatNum(kw.traffic)}</span> : <CompetitionBar value={kw.competition || 0} />}
                {showUrl && <span className="text-xs text-muted-foreground truncate">{kw.url}</span>}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
