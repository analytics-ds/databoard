"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Globe, BarChart3, ArrowUpDown, FileText } from "lucide-react";
import { getPositionColor } from "@/lib/constants";

async function haloscanCall(endpoint: string, params: Record<string, any>) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const res = await fetch("/api/haloscan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, params }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Erreur ${res.status}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Timeout: la requete a pris trop de temps");
    throw e;
  }
}

function formatNum(n: number | undefined | null) {
  if (n == null || isNaN(Number(n))) return "-";
  return Number(n).toLocaleString("fr-FR");
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round(value > 1 ? value : value * 100);
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

function LineChart({ data, height = 160, color = "#2563eb", fillColor = "rgba(37,99,235,0.08)", showLabels = true, showValues = true }: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fillColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
}) {
  if (data.length < 2) return null;
  const padding = { top: showValues ? 24 : 8, right: 8, bottom: showLabels ? 24 : 8, left: 8 };
  const w = 600;
  const h = height;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - min) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line key={pct} x1={padding.left} y1={padding.top + chartH * (1 - pct)} x2={w - padding.right} y2={padding.top + chartH * (1 - pct)} stroke="#e5e7eb" strokeWidth="0.5" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
      ))}
      {/* Values */}
      {showValues && points.map((p, i) => {
        if (data.length > 16 && i % 2 !== 0) return null;
        return (
          <text key={`v${i}`} x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-muted-foreground font-medium">
            {formatNum(p.value)}
          </text>
        );
      })}
      {/* Labels */}
      {showLabels && points.map((p, i) => {
        const step = data.length > 20 ? 4 : data.length > 12 ? 2 : 1;
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text key={`l${i}`} x={p.x} y={h - 4} textAnchor="middle" className="text-[9px] fill-muted-foreground">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

function MiniLine({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const h = 32;
  const w = 120;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((v - min) / range) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function KeywordResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Recherche de mots cles" description="Explorez les mots cles et analysez les domaines avec Haloscan" />
      <Tabs defaultValue="keywords" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keywords" className="gap-2"><Search className="h-4 w-4" />Mots cles</TabsTrigger>
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
      const [overviewRes, matchRes] = await Promise.allSettled([
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
      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value);
      if (matchRes.status === "fulfilled") setMatchResults(matchRes.value.results || []);
      if (overviewRes.status === "rejected" && matchRes.status === "rejected") {
        setError("Erreur lors de la recherche. Verifiez votre cle API Haloscan.");
      }
    } catch {
      setError("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  }

  const seoMetrics = overview?.seo_metrics || {};
  const adsMetrics = overview?.ads_metrics || {};
  const volume = adsMetrics.volume || seoMetrics.volume || 0;
  const cpc = adsMetrics.cpc || 0;
  const competition = adsMetrics.competition || 0;

  const volumeHistory: { label: string; value: number }[] = [];
  if (overview?.volume_history?.results) {
    const entries = Object.entries(overview.volume_history.results) as [string, number][];
    entries.sort(([a], [b]) => Number(a) - Number(b));
    for (const [ts, vol] of entries.slice(-24)) {
      const d = new Date(Number(ts) * 1000);
      volumeHistory.push({
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
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
                placeholder="Entrez un mot cle (ex: chaussures running)"
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
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Volume mensuel</p>
                <p className="text-2xl font-bold">{formatNum(volume)}</p>
                {volumeHistory.length > 0 && (
                  <div className="mt-2">
                    <MiniLine data={volumeHistory.map((v) => v.value)} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">CPC moyen</p>
                <p className="text-2xl font-bold">{cpc.toFixed(2)} EUR</p>
                <p className="text-xs text-muted-foreground mt-1">
                  KGR: {seoMetrics.kgr?.toFixed(2) || "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Concurrence</p>
                <CompetitionBar value={competition} />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatNum(seoMetrics.results_count)} resultats Google
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-1 border-b border-border">
            <button onClick={() => setSubTab("match")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === "match" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Mots cles similaires ({matchResults.length})
            </button>
            <button onClick={() => setSubTab("history")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Historique de volume
            </button>
          </div>

          {subTab === "match" && <KeywordTable data={matchResults} />}

          {subTab === "history" && volumeHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Evolution du volume de recherche pour "{query}"</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={volumeHistory} height={200} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!overview && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez un mot cle pour commencer votre recherche</p>
        </div>
      )}
    </div>
  );
}

function StackedPositionsChart({ data }: { data: any[] }) {
  if (data.length < 2) return null;
  const padding = { top: 8, right: 8, bottom: 28, left: 50 };
  const w = 700;
  const h = 220;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const parsed = data.map((d) => ({
    date: d.search_date,
    label: new Date(d.search_date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
    top3: d.top_3_positions || 0,
    top10: (d.top_10_positions || 0) - (d.top_3_positions || 0),
    top50: (d.top_50_positions || 0) - (d.top_10_positions || 0),
    top100: (d.top_100_positions || 0) - (d.top_50_positions || 0),
    total: d.top_100_positions || 0,
  }));

  const max = Math.max(...parsed.map((d) => d.total));
  const barW = Math.max(2, (chartW / parsed.length) - 1);

  const bands = [
    { key: "top3" as const, color: "#10b981" },
    { key: "top10" as const, color: "#3b82f6" },
    { key: "top50" as const, color: "#f59e0b" },
    { key: "top100" as const, color: "#f97316" },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1={padding.left} y1={padding.top + chartH * (1 - pct)} x2={w - padding.right} y2={padding.top + chartH * (1 - pct)} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={padding.left - 4} y={padding.top + chartH * (1 - pct) + 3} textAnchor="end" className="text-[8px] fill-muted-foreground">{formatNum(Math.round(max * pct))}</text>
          </g>
        ))}
        {parsed.map((d, i) => {
          const x = padding.left + (i / parsed.length) * chartW;
          let y = padding.top + chartH;
          return (
            <g key={i}>
              {bands.map((band) => {
                const val = d[band.key];
                const barH = max > 0 ? (val / max) * chartH : 0;
                y -= barH;
                return <rect key={band.key} x={x} y={y} width={barW} height={barH} fill={band.color} opacity="0.8" rx="0.5" />;
              })}
              {i % Math.max(1, Math.floor(parsed.length / 8)) === 0 && (
                <text x={x + barW / 2} y={h - 6} textAnchor="middle" className="text-[8px] fill-muted-foreground">{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-2">
        {[
          { label: "Top 1-3", color: "#10b981" },
          { label: "Top 4-10", color: "#3b82f6" },
          { label: "Top 11-50", color: "#f59e0b" },
          { label: "Top 51-100", color: "#f97316" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DomainTab() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [totalPositions, setTotalPositions] = useState(0);
  const [positionPage, setPositionPage] = useState(1);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [domainSubTab, setDomainSubTab] = useState<"overview" | "keywords" | "pages" | "competitors">("overview");

  async function handleSearch() {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setPositions([]);
    setData(null);
    setCompetitors([]);
    try {
      const [overviewRes, posRes, compRes] = await Promise.allSettled([
        haloscanCall("domains/overview", {
          input: domain.trim(),
          mode: "domain",
          requested_data: ["metrics", "best_keywords", "best_pages", "visibility_index_history", "positions_breakdown_history"],
        }),
        haloscanCall("domains/positions", {
          input: domain.trim(),
          mode: "domain",
          lineCount: 100,
          page: 1,
          order_by: "traffic",
          order: "desc",
        }),
        haloscanCall("domains/siteCompetitors", {
          input: domain.trim(),
          mode: "domain",
          lineCount: 10,
        }),
      ]);
      if (overviewRes.status === "fulfilled") setData(overviewRes.value);
      if (posRes.status === "fulfilled") {
        setPositions(posRes.value.results || []);
        setTotalPositions(posRes.value.total_result_count || posRes.value.filtered_result_count || 0);
        setPositionPage(1);
      }
      if (compRes.status === "fulfilled") setCompetitors(compRes.value.results || []);
      if (overviewRes.status === "rejected" && posRes.status === "rejected") {
        setError("Erreur lors de l'analyse. Verifiez le domaine et votre cle API.");
      }
    } catch {
      setError("Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMorePositions() {
    const nextPage = positionPage + 1;
    setLoadingMore(true);
    try {
      const res = await haloscanCall("domains/positions", {
        input: domain.trim(),
        mode: "domain",
        lineCount: 100,
        page: nextPage,
        order_by: "traffic",
        order: "desc",
      });
      setPositions((prev) => [...prev, ...(res.results || [])]);
      setPositionPage(nextPage);
    } catch {} finally {
      setLoadingMore(false);
    }
  }

  const stats = data?.metrics?.stats;
  const posBreakdown = data?.positions_breakdown_history?.results || [];
  const visHistory = (data?.visibility_index_history?.results || []).map((p: any) => ({
    label: new Date(p.agg_date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
    value: p.visibility_index || 0,
  }));
  const bestPages = data?.best_pages?.results || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Entrez un domaine (ex: izac.fr, celio.com)"
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
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Mots cles", value: formatNum(stats.total_keyword_count) },
              { label: "Trafic organique", value: formatNum(stats.total_traffic) },
              { label: "Valeur du trafic", value: `${formatNum(stats.traffic_value)} EUR` },
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

          {/* Position distribution */}
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

          {/* Stacked positions history chart */}
          {posBreakdown.length > 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Evolution des positions de {domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <StackedPositionsChart data={posBreakdown} />
              </CardContent>
            </Card>
          )}

          {/* Visibility */}
          {visHistory.length > 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Indice de visibilite de {domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={visHistory} height={180} />
              </CardContent>
            </Card>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "keywords" as const, label: `Top mots cles (${Math.min(positions.length, 300)})` },
              { id: "pages" as const, label: `Top pages (${bestPages.length})` },
              { id: "competitors" as const, label: `Concurrents (${competitors.length})` },
            ].map((t) => (
              <button key={t.id} onClick={() => setDomainSubTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${domainSubTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {domainSubTab === "keywords" && (
            <div className="space-y-3">
              <KeywordTable data={positions.slice(0, 300)} showPosition showTraffic showUrl />
              {positions.length < Math.min(totalPositions, 300) && (
                <div className="flex items-center justify-center">
                  <Button variant="outline" onClick={loadMorePositions} disabled={loadingMore} className="gap-2">
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Charger plus ({positions.length} / {formatNum(Math.min(totalPositions, 300))})
                  </Button>
                </div>
              )}
            </div>
          )}

          {domainSubTab === "pages" && bestPages.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>URL</span>
                    <span className="text-right">Mots cles</span>
                    <span className="text-right">Trafic</span>
                  </div>
                  {bestPages.slice(0, 100).map((page: any, i: number) => (
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

          {domainSubTab === "competitors" && competitors.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Concurrent</span>
                    <span className="text-right">Mots cles</span>
                    <span className="text-right">Trafic</span>
                    <span className="text-right">Mots cles communs</span>
                    <span className="text-right">Visibilite</span>
                  </div>
                  {competitors.map((comp: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors items-center">
                      <div>
                        <p className="text-sm font-medium">{comp.domain}</p>
                        <p className="text-[11px] text-muted-foreground">{formatNum(comp.positions)} positions</p>
                      </div>
                      <span className="text-right text-sm">{formatNum(comp.keywords)}</span>
                      <span className="text-right text-sm font-medium">{formatNum(comp.total_traffic)}</span>
                      <span className="text-right text-sm">{formatNum(comp.common_keywords)}</span>
                      <span className="text-right text-sm font-medium">{comp.visibility_index}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!stats && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez n'importe quel domaine pour analyser ses performances SEO</p>
        </div>
      )}
    </div>
  );
}

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
      setError("Erreur lors de la recuperation des volumes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-medium">Collez vos mots cles (un par ligne)</p>
          <textarea
            className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={"chaussures running\nbaskets homme\nsneakers pas cher"}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {keywords.split("\n").filter((k) => k.trim()).length} mots cles
            </p>
            <Button onClick={handleSearch} disabled={loading || !keywords.trim()} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Recuperer les volumes
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
            <SortHeader label="Mot cle" field="keyword" />
            {showPosition && <SortHeader label="Pos." field="position" />}
            <SortHeader label="Volume" field="volume" />
            <SortHeader label="CPC" field="cpc" />
            {showTraffic ? <SortHeader label="Trafic" field="traffic" /> : <span>Concurrence</span>}
            {showUrl && <span>URL</span>}
          </div>

          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun resultat</div>
          ) : (
            sorted.map((kw, i) => (
              <div key={i} className={`grid gap-4 px-4 py-2 hover:bg-muted/30 transition-colors items-center ${cols}`}>
                <span className="text-sm font-medium truncate">{kw.keyword}</span>
                {showPosition && (
                  <span className={`inline-flex h-6 w-10 items-center justify-center rounded text-xs font-bold ${getPositionColor(kw.position)}`}>
                    {kw.position || "-"}
                  </span>
                )}
                <span className="text-sm font-medium">{formatNum(kw.volume)}</span>
                <span className="text-sm text-muted-foreground">{kw.cpc != null ? `${Number(kw.cpc).toFixed(2)} EUR` : "-"}</span>
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
