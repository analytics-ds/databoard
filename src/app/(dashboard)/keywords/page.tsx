"use client";

import { useState } from "react";
import { useStudy } from "@/lib/study-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ExternalLink,
  Tag,
  Trash2,
  HelpCircle,
  Image,
  Video,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPositionColor } from "@/lib/constants";
import Link from "next/link";

// Demo keywords for Quitoque
const DEMO_KEYWORDS = [
  { id: "1", keyword: "pizza", url: "", position: null, prevPosition: null, bestPosition: null, volume: 1500000, cpc: 0.45, snippets: ["faq", "people_also_ask", "images", "video"] },
  { id: "2", keyword: "\u00e9picerie", url: "", position: null, prevPosition: null, bestPosition: null, volume: 550000, cpc: 0.30, snippets: ["images", "faq", "people_also_ask", "video"] },
  { id: "3", keyword: "mousses au chocolat", url: "", position: null, prevPosition: null, bestPosition: null, volume: 246000, cpc: 0.20, snippets: ["faq", "images", "video"] },
  { id: "4", keyword: "recette lasagnes", url: "", position: null, prevPosition: null, bestPosition: null, volume: 201000, cpc: 0.15, snippets: ["video", "faq"] },
  { id: "5", keyword: "halloween", url: "/nos-paniers/box-halloween", position: null, prevPosition: null, bestPosition: null, volume: 201000, cpc: 0.35, snippets: ["faq", "video", "images"] },
  { id: "6", keyword: "crumbles aux pommes", url: "", position: null, prevPosition: null, bestPosition: null, volume: 165000, cpc: 0.18, snippets: ["images", "video"] },
  { id: "7", keyword: "batch cooking", url: "/blog/batch-cooking", position: 8, prevPosition: 12, bestPosition: 5, volume: 110000, cpc: 0.55, snippets: ["faq", "people_also_ask"] },
  { id: "8", keyword: "menu de la semaine", url: "/menus", position: 5, prevPosition: 3, bestPosition: 2, volume: 90500, cpc: 0.65, snippets: ["faq"] },
  { id: "9", keyword: "box repas", url: "/", position: 2, prevPosition: 3, bestPosition: 1, volume: 33100, cpc: 1.20, snippets: ["shopping"] },
  { id: "10", keyword: "panier repas livraison", url: "/livraison", position: 4, prevPosition: 6, bestPosition: 3, volume: 14800, cpc: 0.95, snippets: ["shopping"] },
  { id: "11", keyword: "recette facile soir", url: "/blog/recettes-faciles", position: 15, prevPosition: 18, bestPosition: 10, volume: 27100, cpc: 0.40, snippets: ["faq", "images"] },
  { id: "12", keyword: "livraison repas domicile", url: "/livraison", position: 6, prevPosition: 9, bestPosition: 4, volume: 5400, cpc: 1.10, snippets: ["shopping", "faq"] },
];

const SNIPPET_ICONS: Record<string, { icon: typeof HelpCircle; label: string }> = {
  faq: { icon: HelpCircle, label: "FAQ" },
  people_also_ask: { icon: MessageSquare, label: "PAA" },
  images: { icon: Image, label: "Images" },
  video: { icon: Video, label: "Vid\u00e9o" },
  shopping: { icon: ShoppingBag, label: "Shopping" },
};

function PositionBadge({ position }: { position: number | null }) {
  if (!position) return <span className="text-sm text-muted-foreground">&gt; 30 <Minus className="inline h-3 w-3" /></span>;
  const color = getPositionColor(position);
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold", color)}>
      {position}
    </span>
  );
}

function TrendIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (!current || !previous) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const diff = previous - current;
  if (diff === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (diff > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" />+{diff}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
      <TrendingDown className="h-3.5 w-3.5" />{diff}
    </span>
  );
}

export default function KeywordsPage() {
  const { currentStudy } = useStudy();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = DEMO_KEYWORDS.filter((kw) => {
    if (search && !kw.keyword.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const positioned = filtered.filter(k => k.position !== null);
  const top3 = positioned.filter(k => k.position! <= 3);
  const top10 = positioned.filter(k => k.position! <= 10);
  const top30 = positioned.filter(k => k.position! <= 30);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(k => k.id)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tous les mots cl\u00e9s"
        description={`${currentStudy.clientName} (${currentStudy.domain})`}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Dialog>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <Plus className="h-4 w-4" />
            Ajouter des mots-cl\u00e9s
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter des mots-cl\u00e9s</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mots-cl\u00e9s (un par ligne)</Label>
                <Textarea placeholder="pizza&#10;recette lasagnes&#10;batch cooking" rows={5} />
              </div>
              <div className="space-y-2">
                <Label>URL cible (optionnel)</Label>
                <Input placeholder={`https://${currentStudy.domain}/page`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moteur</Label>
                  <Select defaultValue="google_mobile">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google (Desktop)</SelectItem>
                      <SelectItem value="google_mobile">Google (Mobile)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>P\u00e9riodicit\u00e9</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Journalier</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Position distribution tabs like SmartKeyword */}
      <div className="flex items-center gap-6 border-b border-border pb-2 text-sm">
        <span className="font-medium">
          Positions 1 \u00e0 3 ({top3.length}
          <TrendingUp className="inline h-3 w-3 text-emerald-600 mx-0.5" />
          <TrendingDown className="inline h-3 w-3 text-red-500 mx-0.5" />)
        </span>
        <span className="font-medium">
          Positions 4 \u00e0 10 ({top10.length - top3.length}
          <TrendingUp className="inline h-3 w-3 text-emerald-600 mx-0.5" />
          <TrendingDown className="inline h-3 w-3 text-red-500 mx-0.5" />)
        </span>
        <span className="font-medium">
          Positions 11 \u00e0 30 ({top30.length - top10.length}
          <TrendingUp className="inline h-3 w-3 text-emerald-600 mx-0.5" />
          <TrendingDown className="inline h-3 w-3 text-red-500 mx-0.5" />)
        </span>
      </div>

      {/* Trafic potentiel */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Trafic potentiel : <span className="font-mono font-semibold text-foreground">~{Math.round(positioned.reduce((acc, k) => acc + (k.volume / (k.position || 30)), 0)).toLocaleString("fr-FR")}</span> visites/mois estim\u00e9es</p>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} mot(s)-cl\u00e9(s) s\u00e9lectionn\u00e9(s)</span>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"><Tag className="h-3 w-3" />Taguer</Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">D\u00e9taguer</Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"><Download className="h-3 w-3" />Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3" />Supprimer</Button>
        </div>
      )}

      {selectedIds.size === 0 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={toggleAll}>
            S\u00e9lectionner tous les mots cl\u00e9s de la page
          </Button>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un mot-cl\u00e9..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-[280px]">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Mot cl\u00e9 <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right w-[120px]">
                  <button className="flex items-center gap-1 hover:text-foreground ml-auto">
                    Volume <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[90px]">Position</TableHead>
                <TableHead className="w-[250px]">Page</TableHead>
                <TableHead className="w-[120px]">Snippets</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((kw) => (
                <TableRow key={kw.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(kw.id)}
                      onCheckedChange={() => toggleSelect(kw.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/keywords/${kw.id}`} className="text-primary hover:underline text-sm font-medium">
                      {kw.keyword}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {kw.volume.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <PositionBadge position={kw.position} />
                      {kw.position && kw.prevPosition && (
                        <TrendIndicator current={kw.position} previous={kw.prevPosition} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {kw.url ? (
                      <a
                        href={`https://${currentStudy.domain}${kw.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {kw.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pas de page positionn\u00e9e.</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {kw.snippets.map((s) => {
                        const config = SNIPPET_ICONS[s];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <span key={s} title={config.label} className="text-muted-foreground hover:text-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Optimiser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
