"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Loader2, TrendingUp, TrendingDown, Minus, Globe, BarChart3,
  ArrowUpDown, ExternalLink, HelpCircle, FileText,
} from "lucide-react";
import { getPositionColor } from "@/lib/constants";

// ── Haloscan API helper ──────────────────────────────────
async function haloscanCall(endpoint: string, params: Record<string, any>) {
  const res = await fetch("/api/haloscan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, params }),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

function formatNum(n: number | undefined | null) {
  if (n == null) return "—";
  return n.toLocaleString("fr-FR");
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct < 30 ? "bg-emerald-500" : pct < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function MiniChart({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function KeywordResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Recherche de mots clés" description="Explorez les mots clés et analysez les domaines" />
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

// ── Tab 1: Keyword Research ──────────────────────────────
function KeywordTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [subTab, setSubTab] = useState<"overview" | "similar" | "questions">("overview");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await haloscanCall("keywords/overview", {
        keyword: query.trim(),
        requested_data: ["metrics", "volume_history", "serp", "keyword_match", "related_question", "similar_serp"],
      });
      setData(res.data);
    } catch {
      // Demo data will be returned by the proxy
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
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

      {data && (
        <>
          {/* Metrics KPIs */}
          {data.metrics && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Volume mensuel</p>
                  <p className="text-2xl font-bold">{formatNum(data.metrics.volume)}</p>
                  {data.volume_history && (
                    <div className="mt-2">
                      <MiniChart data={data.volume_history.map((v: any) => v.volume)} />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">CPC moyen</p>
                  <p className="text-2xl font-bold">{data.metrics.cpc?.toFixed(2)} €</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Concurrence</p>
                  <CompetitionBar value={data.metrics.competition || 0} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "overview" as const, label: "SERP actuel", count: data.serp?.length },
              { id: "similar" as const, label: "Mots clés similaires", count: data.keyword_match?.length || data.similar_serp?.length },
              { id: "questions" as const, label: "Questions", count: data.related_question?.length },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  subTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {t.count != null && <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>}
              </button>
            ))}
          </div>

          {/* SERP */}
          {subTab === "overview" && data.serp && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {data.serp.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${getPositionColor(r.position)}`}>
                        {r.position}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.domain}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar / Match keywords */}
          {subTab === "similar" && (
            <KeywordTable data={[...(data.keyword_match || []), ...(data.similar_serp || [])]} />
          )}

          {/* Questions */}
          {subTab === "questions" && data.related_question && (
            <KeywordTable data={data.related_question} showType />
          )}
        </>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez un mot clé pour commencer votre recherche</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Domain Analysis ───────────────────────────────
function DomainTab() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [domainSubTab, setDomainSubTab] = useState<"overview" | "keywords" | "pages">("overview");

  async function handleSearch() {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const [overviewRes, positionsRes] = await Promise.all([
        haloscanCall("domains/overview", {
          input: domain.trim(),
          mode: "domain",
          requested_data: ["metrics", "positions_breakdown", "best_keywords", "best_pages", "visibility_index_history", "positions_breakdown_history"],
        }),
        haloscanCall("domains/positions", {
          input: domain.trim(),
          mode: "domain",
          lineCount: 50,
          order_by: "traffic",
          order: "desc",
        }),
      ]);
      setData(overviewRes.data);
      setPositions(positionsRes.data || []);
    } catch {
      // Demo data
    } finally {
      setLoading(false);
    }
  }

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

      {data && (
        <>
          {/* Domain KPIs */}
          {data.metrics && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Mots clés", value: formatNum(data.metrics.unique_keywords) },
                { label: "Trafic organique", value: formatNum(data.metrics.total_traffic) },
                { label: "Valeur du trafic", value: `${formatNum(data.metrics.total_traffic_value)} €` },
                { label: "Pages indexées", value: formatNum(data.metrics.indexed_pages) },
              ].map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="text-xl font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Position distribution */}
          {data.metrics && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Top 3", value: data.metrics.total_top_3, color: "bg-emerald-500" },
                { label: "Top 10", value: data.metrics.total_top_10, color: "bg-blue-500" },
                { label: "Top 50", value: data.metrics.total_top_50, color: "bg-amber-500" },
                { label: "Top 100", value: data.metrics.total_top_100, color: "bg-orange-500" },
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
          )}

          {/* Visibility chart */}
          {data.visibility_index_history && data.visibility_index_history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Évolution de la visibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {data.visibility_index_history.map((point: any, i: number) => {
                    const max = Math.max(...data.visibility_index_history.map((p: any) => p.index));
                    const heightPct = max > 0 ? (point.index / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${heightPct}%`, minHeight: 2 }}>
                          <div className="absolute inset-0 bg-primary rounded-t opacity-70" />
                        </div>
                        <span className="text-[8px] text-muted-foreground">{point.date?.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "overview" as const, label: "Meilleurs mots clés" },
              { id: "keywords" as const, label: `Tous les mots clés (${positions.length})` },
              { id: "pages" as const, label: "Meilleures pages" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDomainSubTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  domainSubTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {domainSubTab === "overview" && data.best_keywords && (
            <KeywordTable data={data.best_keywords} showPosition showTraffic />
          )}

          {domainSubTab === "keywords" && (
            <KeywordTable data={positions} showPosition showTraffic showUrl />
          )}

          {domainSubTab === "pages" && data.best_pages && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>URL</span>
                    <span className="text-right">Mots clés</span>
                    <span className="text-right">Trafic</span>
                  </div>
                  {data.best_pages.map((page: any, i: number) => (
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
        </>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Entrez un domaine pour analyser ses performances SEO</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Bulk Volume ───────────────────────────────────
function BulkTab() {
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch() {
    const kws = keywords.split("\n").map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) return;
    setLoading(true);
    try {
      const res = await haloscanCall("keywords/bulk", { keywords: kws });
      setResults(res.data || []);
    } catch {
      // demo data
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Collez vos mots clés (un par ligne)</p>
            <textarea
              className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder={"chaussures running\nbaskets homme\nsneakers pas cher\n..."}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {keywords.split("\n").filter((k) => k.trim()).length} mots clés
              </p>
              <Button onClick={handleSearch} disabled={loading || !keywords.trim()} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Récupérer les volumes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && <KeywordTable data={results} />}
    </div>
  );
}

// ── Reusable Keyword Table ───────────────────────────────
function KeywordTable({
  data,
  showPosition = false,
  showTraffic = false,
  showUrl = false,
  showType = false,
}: {
  data: any[];
  showPosition?: boolean;
  showTraffic?: boolean;
  showUrl?: boolean;
  showType?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  function SortHeader({ label, field }: { label: string; field: string }) {
    const active = sortKey === field;
    return (
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : ""}`} />
      </button>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="divide-y divide-border">
            {/* Header */}
            <div className={`grid gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${
              showUrl
                ? "grid-cols-[1fr_1fr_80px_70px_80px_80px]"
                : showPosition
                  ? "grid-cols-[1fr_80px_70px_80px_80px]"
                  : "grid-cols-[1fr_80px_70px_100px]"
            }`}>
              <SortHeader label="Mot clé" field="keyword" />
              {showPosition && <SortHeader label="Position" field="position" />}
              <SortHeader label="Volume" field="volume" />
              <SortHeader label="CPC" field="cpc" />
              {showTraffic && <SortHeader label="Trafic" field="traffic" />}
              {!showTraffic && <span>Concurrence</span>}
              {showUrl && <span>URL</span>}
            </div>

            {sorted.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              sorted.map((kw, i) => (
                <div
                  key={i}
                  className={`grid gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors items-center ${
                    showUrl
                      ? "grid-cols-[1fr_1fr_80px_70px_80px_80px]"
                      : showPosition
                        ? "grid-cols-[1fr_80px_70px_80px_80px]"
                        : "grid-cols-[1fr_80px_70px_100px]"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">{kw.keyword}</span>
                    {showType && kw.question_type && (
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">{kw.question_type}</Badge>
                    )}
                  </div>
                  {showPosition && (
                    <span className={`inline-flex h-6 w-12 items-center justify-center rounded text-xs font-bold ${getPositionColor(kw.position)}`}>
                      {kw.position || "—"}
                    </span>
                  )}
                  <span className="text-sm font-medium">{formatNum(kw.volume)}</span>
                  <span className="text-sm text-muted-foreground">{kw.cpc?.toFixed(2)} €</span>
                  {showTraffic && <span className="text-sm">{formatNum(kw.traffic)}</span>}
                  {!showTraffic && <CompetitionBar value={kw.competition || 0} />}
                  {showUrl && <span className="text-xs text-muted-foreground truncate">{kw.url}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
