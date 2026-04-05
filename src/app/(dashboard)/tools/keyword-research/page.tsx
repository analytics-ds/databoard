"use client";

import { useState, Component, type ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Globe, BarChart3, ArrowUpDown, FileText, AlertTriangle } from "lucide-react";
import { getPositionColor } from "@/lib/constants";

// Error Boundary to catch rendering crashes
class SearchErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: `${error.message || String(error)}\n\nStack: ${error.stack?.split("\n").slice(0, 3).join("\n") || ""}` };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[KeywordResearch] Render crash:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">Erreur d'affichage des resultats</p>
                <p className="text-sm text-muted-foreground">{this.state.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    this.setState({ hasError: false, error: "" });
                    this.props.onReset?.();
                  }}
                >
                  Reessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

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
    const data = await res.json();
    // Worker returns { error: true, message } when Haloscan fails
    if (data?.error === true) {
      throw new Error(data.message || "Erreur API Haloscan");
    }
    return data;
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

function LineChart({ data, height = 160, color = "#2563eb", label = "Valeur" }: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  label?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length < 2) return null;
  const padding = { top: 28, right: 12, bottom: 28, left: 48 };
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

  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    // Account for chart padding (left=48, right=12 out of viewBox width=600)
    const padLeftRatio = padding.left / w;
    const padRightRatio = padding.right / w;
    const chartRelX = (relX - padLeftRatio) / (1 - padLeftRatio - padRightRatio);
    const idx = Math.round(chartRelX * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const hp = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="relative" onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} onMouseMove={handleMouseMove}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((pct) => {
          const yVal = min + range * pct;
          return (
            <g key={pct}>
              <line x1={padding.left} y1={padding.top + chartH * (1 - pct)} x2={w - padding.right} y2={padding.top + chartH * (1 - pct)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padding.left - 6} y={padding.top + chartH * (1 - pct) + 3} textAnchor="end" className="text-[9px] fill-muted-foreground">
                {yVal >= 1000 ? `${(yVal / 1000).toFixed(1)}k` : Math.round(yVal * 10) / 10}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots — small for many points */}
        {data.length <= 30 && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === hoverIdx ? 5 : 2.5} fill={i === hoverIdx ? color : "white"} stroke={color} strokeWidth="1.5" className="transition-all duration-100" />
        ))}
        {/* Hover vertical line */}
        {hp && (
          <line x1={hp.x} y1={padding.top} x2={hp.x} y2={padding.top + chartH} stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        )}
        {/* X-axis labels */}
        {points.map((p, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={`l${i}`} x={p.x} y={h - 6} textAnchor="middle" className="text-[9px] fill-muted-foreground">
              {p.label}
            </text>
          );
        })}
      </svg>
      {/* Tooltip */}
      {hp && (
        <div
          className="absolute z-50 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg pointer-events-none"
          style={{ left: `${Math.min((hp.x / w) * 100, 75)}%`, top: 0 }}
        >
          <p className="text-xs font-semibold">{hp.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{label}:</span>
            <span className="text-xs font-bold">{hp.value >= 1000 ? `${(hp.value / 1000).toFixed(1)}k` : Math.round(hp.value * 10) / 10}</span>
          </div>
        </div>
      )}
    </div>
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
        <TabsContent value="keywords"><SearchErrorBoundary><KeywordTab /></SearchErrorBoundary></TabsContent>
        <TabsContent value="domain"><SearchErrorBoundary><DomainTab /></SearchErrorBoundary></TabsContent>
        <TabsContent value="bulk"><SearchErrorBoundary><BulkTab /></SearchErrorBoundary></TabsContent>
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
    setOverview(null);
    setMatchResults([]);
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
      if (overviewRes.status === "fulfilled" && overviewRes.value) {
        setOverview(overviewRes.value);
      }
      if (matchRes.status === "fulfilled" && matchRes.value) {
        const val = matchRes.value;
        setMatchResults(val.results || val.data || []);
      }
      if (overviewRes.status === "rejected" && matchRes.status === "rejected") {
        const msg = overviewRes.reason?.message || "Erreur inconnue";
        setError(`Erreur lors de la recherche: ${msg}`);
      }
    } catch (e: any) {
      setError(e.message || "Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  }

  // Support both real Haloscan format and demo data format
  const seoMetrics = overview?.seo_metrics || overview?.data?.metrics || {};
  const adsMetrics = overview?.ads_metrics || {};
  const volume = Number(adsMetrics.volume || seoMetrics.volume || 0) || 0;
  const cpc = Number(adsMetrics.cpc || seoMetrics.cpc || 0) || 0;
  const competition = Number(adsMetrics.competition || seoMetrics.competition || 0) || 0;

  const volumeHistory: { label: string; value: number }[] = [];
  // Real API: overview.volume_history.results = { timestamp: volume, ... }
  // Demo: overview.data.volume_history = [{ date, volume }, ...]
  const volHistRaw = overview?.volume_history?.results;
  const volHistDemo = overview?.data?.volume_history;
  if (volHistRaw && typeof volHistRaw === "object" && !Array.isArray(volHistRaw)) {
    const entries = Object.entries(volHistRaw) as [string, number][];
    entries.sort(([a], [b]) => Number(a) - Number(b));
    for (const [ts, vol] of entries.slice(-24)) {
      const d = new Date(Number(ts) * 1000);
      volumeHistory.push({
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        value: Number(vol) || 0,
      });
    }
  } else if (Array.isArray(volHistDemo)) {
    for (const item of volHistDemo.slice(-24)) {
      volumeHistory.push({
        label: item.date || "",
        value: Number(item.volume) || 0,
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
                <p className="text-2xl font-bold">{Number(cpc).toFixed(2)} EUR</p>
                <p className="text-xs text-muted-foreground mt-1">
                  KGR: {seoMetrics.kgr != null ? Number(seoMetrics.kgr).toFixed(2) : "-"}
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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: any } | null>(null);

  if (data.length < 2) return null;

  // Aggregate daily data to monthly (last value per month)
  const monthlyMap = new Map<string, { label: string; top3: number; top10Raw: number; top50Raw: number; top100Raw: number }>();
  for (const d of data) {
    const dateStr = d.search_date || d.date || "";
    try {
      const dt = new Date(dateStr);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      monthlyMap.set(key, {
        label,
        top3: Number(d.top_3_positions || d.top_3 || 0) || 0,
        top10Raw: Number(d.top_10_positions || d.top_10 || 0) || 0,
        top50Raw: Number(d.top_50_positions || d.top_50 || 0) || 0,
        top100Raw: Number(d.top_100_positions || d.top_100 || 0) || 0,
      });
    } catch {}
  }

  const parsed = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label: v.label,
      shortLabel: v.label.split(" ").map((w, i) => i === 0 ? w.slice(0, 4) + "." : w.slice(2)).join(" "),
      top3: v.top3,
      top10: Math.max(0, v.top10Raw - v.top3),
      top50: Math.max(0, v.top50Raw - v.top10Raw),
      top100: Math.max(0, v.top100Raw - v.top50Raw),
      total: v.top100Raw,
      top10Raw: v.top10Raw,
      top50Raw: v.top50Raw,
      top100Raw: v.top100Raw,
    }));

  if (parsed.length < 2) return null;

  const padding = { top: 8, right: 8, bottom: 28, left: 50 };
  const w = 700;
  const h = 220;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const max = Math.max(...parsed.map((d) => d.total));
  const barW = Math.max(4, (chartW / parsed.length) - 2);

  const bands = [
    { key: "top3" as const, color: "#10b981", label: "Top 1-3" },
    { key: "top10" as const, color: "#3b82f6", label: "Top 4-10" },
    { key: "top50" as const, color: "#f59e0b", label: "Top 11-50" },
    { key: "top100" as const, color: "#f97316", label: "Top 51-100" },
  ];

  function formatAxis(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return String(Math.round(n));
  }

  return (
    <div className="relative" onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1={padding.left} y1={padding.top + chartH * (1 - pct)} x2={w - padding.right} y2={padding.top + chartH * (1 - pct)} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={padding.left - 4} y={padding.top + chartH * (1 - pct) + 3} textAnchor="end" className="text-[9px] fill-muted-foreground">{formatAxis(max * pct)}</text>
          </g>
        ))}
        {parsed.map((d, i) => {
          const x = padding.left + (i / parsed.length) * chartW;
          let y = padding.top + chartH;
          return (
            <g key={i} className="cursor-pointer" onMouseEnter={(e) => {
              const rect = e.currentTarget.closest("svg")!.getBoundingClientRect();
              setTooltip({ x: (e.clientX - rect.left), y: (e.clientY - rect.top - 10), data: d });
            }}>
              {/* Invisible hit area for the full column */}
              <rect x={x - 1} y={padding.top} width={barW + 2} height={chartH} fill="transparent" />
              {bands.map((band) => {
                const val = d[band.key];
                const barH = max > 0 ? (val / max) * chartH : 0;
                y -= barH;
                return <rect key={band.key} x={x} y={y} width={barW} height={barH} fill={band.color} opacity="0.85" rx="1" />;
              })}
              {i % Math.max(1, Math.ceil(parsed.length / 8)) === 0 && (
                <text x={x + barW / 2} y={h - 6} textAnchor="middle" className="text-[9px] fill-muted-foreground">{d.shortLabel}</text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg pointer-events-none"
          style={{ left: Math.min(tooltip.x, 500), top: tooltip.y - 100 }}
        >
          <p className="text-xs font-semibold mb-1.5">{tooltip.data.label}</p>
          <div className="space-y-0.5">
            {[
              { label: "Top 1-3", value: tooltip.data.top3, color: "#10b981" },
              { label: "Top 4-10", value: tooltip.data.top10, color: "#3b82f6" },
              { label: "Top 11-50", value: tooltip.data.top50, color: "#f59e0b" },
              { label: "Top 51-100", value: tooltip.data.top100, color: "#f97316" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium ml-auto">{formatNum(row.value)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-1 mt-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{formatNum(tooltip.data.total)}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-4 mt-2">
        {bands.map((l) => (
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
  const [topPages, setTopPages] = useState<any[]>([]);
  const [domainSubTab, setDomainSubTab] = useState<"keywords" | "pages" | "competitors">("keywords");

  async function handleSearch() {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setPositions([]);
    setData(null);
    setCompetitors([]);
    setTopPages([]);
    try {
      const [overviewRes, posRes, compRes, pagesRes] = await Promise.allSettled([
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
        haloscanCall("domains/topPages", {
          input: domain.trim(),
          mode: "domain",
          lineCount: 20,
        }),
      ]);
      if (overviewRes.status === "fulfilled" && overviewRes.value) {
        const val = overviewRes.value;
        setData(val.data ? val.data : val);
      }
      if (posRes.status === "fulfilled" && posRes.value) {
        const val = posRes.value;
        setPositions(val.results || val.data || []);
        setTotalPositions(val.total_result_count || val.filtered_result_count || val.meta?.total || 0);
        setPositionPage(1);
      }
      if (compRes.status === "fulfilled" && compRes.value) {
        const val = compRes.value;
        setCompetitors(val.results || val.data || []);
      }
      if (pagesRes.status === "fulfilled" && pagesRes.value) {
        const val = pagesRes.value;
        setTopPages(val.results || val.data || []);
      }
      if (overviewRes.status === "rejected" && posRes.status === "rejected") {
        const msg = overviewRes.reason?.message || "Erreur inconnue";
        setError(`Erreur lors de l'analyse: ${msg}`);
      }
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'analyse.");
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
      setPositions((prev) => [...prev, ...(res.results || res.data || [])]);
      setPositionPage(nextPage);
    } catch {} finally {
      setLoadingMore(false);
    }
  }

  // Support real API format (metrics.stats) and demo format (metrics directly)
  const stats = data?.metrics?.stats || data?.metrics || null;
  const posBreakdown = data?.positions_breakdown_history?.results || data?.positions_breakdown_history || [];
  const visHistoryRaw = data?.visibility_index_history?.results || data?.visibility_index_history || [];
  // Aggregate daily data to monthly averages for readability
  const visHistory: { label: string; value: number }[] = (() => {
    if (!Array.isArray(visHistoryRaw) || visHistoryRaw.length === 0) return [];
    const monthly = new Map<string, { sum: number; count: number }>();
    for (const p of visHistoryRaw) {
      try {
        const d = new Date(p.agg_date || p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        const val = Number(p.visibility_index || p.index || 0) || 0;
        const existing = monthly.get(key);
        if (existing) { existing.sum += val; existing.count++; }
        else monthly.set(key, { sum: val, count: 1 });
      } catch {}
    }
    return Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { sum, count }]) => {
        const [y, m] = key.split("-");
        const d = new Date(Number(y), Number(m) - 1);
        return {
          label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          value: Math.round((sum / count) * 10) / 10,
        };
      });
  })();
  const bestPages = data?.best_pages?.results || data?.best_pages || [];

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
                <LineChart data={visHistory} height={180} label="Indice de visibilite" />
              </CardContent>
            </Card>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "keywords" as const, label: `Top mots cles (${formatNum(totalPositions)})` },
              { id: "pages" as const, label: `Top pages (${topPages.length || bestPages.length})` },
              { id: "competitors" as const, label: `Concurrents (${competitors.length})` },
            ].map((t) => (
              <button key={t.id} onClick={() => setDomainSubTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${domainSubTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {domainSubTab === "keywords" && (
            <div className="space-y-3">
              <KeywordTable data={positions.slice(0, 200)} showPosition showTraffic showUrl showKgr />
              {positions.length < Math.min(totalPositions, 200) && (
                <div className="flex items-center justify-center">
                  <Button variant="outline" onClick={loadMorePositions} disabled={loadingMore} className="gap-2">
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Charger plus ({positions.length} / {formatNum(Math.min(totalPositions, 200))})
                  </Button>
                </div>
              )}
            </div>
          )}

          {domainSubTab === "pages" && (topPages.length > 0 || bestPages.length > 0) && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>URL</span>
                    <span className="text-right">Mots cles</span>
                    <span className="text-right">Top 10</span>
                    <span className="text-right">Top 3</span>
                    <span className="text-right">Trafic</span>
                  </div>
                  {(topPages.length > 0 ? topPages : bestPages).slice(0, 20).map((page: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors items-center">
                      <span className="truncate text-sm text-primary" title={page.url}>{page.url?.replace(/^https?:\/\/[^/]+/, "") || page.url}</span>
                      <span className="text-right text-sm">{formatNum(page.unique_keywords || page.total_top_100)}</span>
                      <span className="text-right text-sm">
                        <span className="inline-flex items-center justify-center rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-xs font-medium">
                          {formatNum(page.total_top_10)}
                        </span>
                      </span>
                      <span className="text-right text-sm">
                        <span className="inline-flex items-center justify-center rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-xs font-medium">
                          {formatNum(page.total_top_3)}
                        </span>
                      </span>
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
    } catch (e: any) {
      setError(e.message || "Erreur lors de la recuperation des volumes.");
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

function KgrBadge({ value }: { value: any }) {
  if (value == null || value === "NA" || isNaN(Number(value))) return <span className="text-xs text-muted-foreground">-</span>;
  const n = Number(value);
  const color = n < 0.25 ? "bg-emerald-50 text-emerald-700" : n < 1 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>{n.toFixed(2)}</span>;
}

function KeywordTable({ data, showPosition = false, showTraffic = false, showUrl = false, showKgr = false }: {
  data: any[];
  showPosition?: boolean;
  showTraffic?: boolean;
  showUrl?: boolean;
  showKgr?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const safeData = Array.isArray(data) ? data : [];

  const sorted = [...safeData].sort((a, b) => {
    const av = a?.[sortKey] ?? 0;
    const bv = b?.[sortKey] ?? 0;
    if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    const numA = Number(av) || 0;
    const numB = Number(bv) || 0;
    return sortDir === "asc" ? numA - numB : numB - numA;
  });

  // Build grid template with inline style (Tailwind v4 doesn't support dynamic grid-cols)
  const colParts: string[] = ["1fr"];
  if (showPosition) colParts.push("60px");
  colParts.push("80px"); // volume
  colParts.push("70px"); // cpc
  if (showTraffic) colParts.push("80px");
  if (showKgr) colParts.push("70px");
  if (!showTraffic && !showKgr) colParts.push("100px");
  if (showUrl) colParts.push("1.5fr");
  const gridStyle = { gridTemplateColumns: colParts.join(" ") };

  function SortHeader({ label, field, align }: { label: string; field: string; align?: "right" }) {
    return (
      <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 hover:text-foreground transition-colors ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? "text-primary" : ""}`} />
      </button>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          <div className="grid gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground" style={gridStyle}>
            <SortHeader label="Mot cle" field="keyword" />
            {showPosition && <SortHeader label="Pos." field="position" />}
            <SortHeader label="Volume" field="volume" align="right" />
            <SortHeader label="CPC" field="cpc" align="right" />
            {showTraffic && <SortHeader label="Trafic" field="traffic" align="right" />}
            {showKgr && (
              <div className="relative group flex items-center justify-end gap-1">
                <SortHeader label="KGR" field="kgr" align="right" />
                <span className="cursor-help text-muted-foreground/50 text-[10px]">?</span>
                <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover:block w-64 rounded-lg border border-border bg-popover p-3 shadow-lg text-left normal-case tracking-normal">
                  <p className="text-xs font-semibold mb-1">Keyword Golden Ratio</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    KGR = nombre de resultats "allintitle" / volume de recherche mensuel.
                  </p>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> &lt; 0.25 = opportunite facile</div>
                    <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm bg-amber-500" /> 0.25 - 1 = faisable</div>
                    <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm bg-red-500" /> &gt; 1 = tres competitif</div>
                  </div>
                </div>
              </div>
            )}
            {!showTraffic && !showKgr && <span>Concurrence</span>}
            {showUrl && <span>URL</span>}
          </div>

          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun resultat</div>
          ) : (
            sorted.map((kw, i) => (
              <div key={i} className="grid gap-4 px-4 py-2 hover:bg-muted/30 transition-colors items-center" style={gridStyle}>
                <span className="text-sm font-medium truncate">{kw.keyword}</span>
                {showPosition && (
                  <span className={`inline-flex h-6 w-10 items-center justify-center rounded text-xs font-bold ${getPositionColor(kw.position)}`}>
                    {kw.position || "-"}
                  </span>
                )}
                <span className="text-sm font-medium text-right">{formatNum(kw.volume)}</span>
                <span className="text-sm text-muted-foreground text-right">{kw.cpc != null && kw.cpc !== "NA" && !isNaN(Number(kw.cpc)) ? `${Number(kw.cpc).toFixed(2)} EUR` : "-"}</span>
                {showTraffic && <span className="text-sm text-right">{formatNum(kw.traffic)}</span>}
                {showKgr && <div className="text-right"><KgrBadge value={kw.kgr} /></div>}
                {!showTraffic && !showKgr && <CompetitionBar value={kw.competition || 0} />}
                {showUrl && <span className="text-xs text-muted-foreground truncate" title={kw.url}>{kw.url?.replace(/^https?:\/\/[^/]+/, "") || kw.url}</span>}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
