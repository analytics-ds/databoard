"use client";

import { useState } from "react";
import { useStudy } from "@/lib/study-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Loader2, X } from "lucide-react";

interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
}

export default function KeywordResearchPage() {
  const { currentStudy } = useStudy();
  const [query, setQuery] = useState("");
  const [excludeTerms, setExcludeTerms] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/haloscan?keyword=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        // Fallback demo data
        setResults([
          { keyword: `${query} recette`, volume: 12100, cpc: 0.45, competition: 0.3 },
          { keyword: `${query} facile`, volume: 8100, cpc: 0.35, competition: 0.2 },
          { keyword: `${query} rapide`, volume: 6600, cpc: 0.40, competition: 0.25 },
          { keyword: `meilleur ${query}`, volume: 4400, cpc: 0.55, competition: 0.4 },
          { keyword: `${query} maison`, volume: 3600, cpc: 0.30, competition: 0.15 },
          { keyword: `${query} pas cher`, volume: 2900, cpc: 0.60, competition: 0.5 },
          { keyword: `${query} avis`, volume: 1900, cpc: 0.25, competition: 0.2 },
          { keyword: `${query} livraison`, volume: 1300, cpc: 0.70, competition: 0.45 },
        ]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const addExclude = () => {
    if (excludeInput.trim() && !excludeTerms.includes(excludeInput.trim())) {
      setExcludeTerms([...excludeTerms, excludeInput.trim()]);
      setExcludeInput("");
    }
  };

  const filteredResults = results.filter(
    (r) => !excludeTerms.some((t) => r.keyword.toLowerCase().includes(t.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recherche de mots cl\u00e9s"
        description={`Trouvez de nouvelles opportunit\u00e9s pour ${currentStudy.clientName}`}
      />

      <Tabs defaultValue="similar">
        <TabsList>
          <TabsTrigger value="similar">Par mots cl\u00e9s similaires</TabsTrigger>
          <TabsTrigger value="site">Par site</TabsTrigger>
          <TabsTrigger value="volumes">R\u00e9cup\u00e9rer les volumes</TabsTrigger>
        </TabsList>

        <TabsContent value="similar">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 w-20">Mot cl\u00e9</Label>
                    <Input
                      placeholder="Entrez valeur"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 w-20">Exclure</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {excludeTerms.map((term) => (
                        <Badge key={term} variant="secondary" className="gap-1">
                          {term}
                          <button onClick={() => setExcludeTerms(excludeTerms.filter((t) => t !== term))}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        placeholder="+ Exclure mot cl\u00e9"
                        value={excludeInput}
                        onChange={(e) => setExcludeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addExclude()}
                        className="w-40 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 w-20">Pays</Label>
                    <Select defaultValue="FR">
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-start">
                  <Button onClick={handleSearch} disabled={loading || !query.trim()} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Rechercher
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Label className="shrink-0 w-20">Site</Label>
                <Input placeholder="example.fr" className="max-w-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="shrink-0 w-20">Pays</Label>
                <Select defaultValue="FR">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2"><Search className="h-4 w-4" />Rechercher</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volumes">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Mots cl\u00e9s (un par ligne)</Label>
                <textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="pizza&#10;recette lasagnes&#10;batch cooking" />
              </div>
              <Button className="gap-2"><Search className="h-4 w-4" />R\u00e9cup\u00e9rer les volumes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {searched && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[350px]">Mot cl\u00e9</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Concurrence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Recherche en cours via Haloscan...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Aucun r\u00e9sultat
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.keyword}>
                      <TableCell className="font-medium">{result.keyword}</TableCell>
                      <TableCell className="text-right font-mono">{result.volume.toLocaleString("fr-FR")}</TableCell>
                      <TableCell className="text-right font-mono">{result.cpc.toFixed(2)} \u20ac</TableCell>
                      <TableCell className="text-right font-mono">{(result.competition * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" />
                          Suivre
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
