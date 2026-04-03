"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Eye, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreItem {
  label: string;
  check: (data: ContentData) => boolean;
  recommendation: string;
  weight: number;
}

interface ContentData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  body: string;
  targetKeyword: string;
}

const SCORE_RULES: ScoreItem[] = [
  { label: "Mot-cl\u00e9 dans le titre", check: (d) => d.targetKeyword.length > 0 && d.title.toLowerCase().includes(d.targetKeyword.toLowerCase()), recommendation: "Incluez le mot-cl\u00e9 cible dans le titre", weight: 15 },
  { label: "Meta title (30-60 car.)", check: (d) => d.metaTitle.length >= 30 && d.metaTitle.length <= 60, recommendation: "Le meta title doit faire entre 30 et 60 caract\u00e8res", weight: 10 },
  { label: "Meta description (120-155 car.)", check: (d) => d.metaDescription.length >= 120 && d.metaDescription.length <= 155, recommendation: "La meta description doit faire entre 120 et 155 caract\u00e8res", weight: 10 },
  { label: "Contenu > 800 mots", check: (d) => d.body.split(/\s+/).filter(Boolean).length >= 800, recommendation: "Visez au moins 800 mots pour un bon r\u00e9f\u00e9rencement", weight: 20 },
  { label: "Contenu > 300 mots", check: (d) => d.body.split(/\s+/).filter(Boolean).length >= 300, recommendation: "Minimum 300 mots pour \u00eatre index\u00e9 correctement", weight: 10 },
  { label: "Mot-cl\u00e9 dans le contenu", check: (d) => d.targetKeyword.length > 0 && d.body.toLowerCase().includes(d.targetKeyword.toLowerCase()), recommendation: "Utilisez le mot-cl\u00e9 cible dans le corps du texte", weight: 15 },
  { label: "Meta title renseign\u00e9", check: (d) => d.metaTitle.length > 0, recommendation: "Renseignez le meta title", weight: 10 },
  { label: "Meta description renseign\u00e9e", check: (d) => d.metaDescription.length > 0, recommendation: "Renseignez la meta description", weight: 10 },
];

export default function NewContentPage() {
  const [data, setData] = useState<ContentData>({
    title: "",
    metaTitle: "",
    metaDescription: "",
    body: "",
    targetKeyword: "",
  });

  const wordCount = useMemo(() => data.body.split(/\s+/).filter(Boolean).length, [data.body]);

  const scoreResults = useMemo(
    () => SCORE_RULES.map((rule) => ({ ...rule, passed: rule.check(data) })),
    [data]
  );

  const totalScore = useMemo(
    () => scoreResults.reduce((acc, r) => acc + (r.passed ? r.weight : 0), 0),
    [scoreResults]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvel article" description="\u00c9diteur de contenu avec scoring SEO en temps r\u00e9el">
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Pr\u00e9visualiser
        </Button>
        <Button size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor Area */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Input
                  placeholder="Titre de l'article"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="text-xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 h-auto text-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mot-cl\u00e9 cible</Label>
                  <Input
                    placeholder="Ex: recette box repas"
                    value={data.targetKeyword}
                    onChange={(e) => setData({ ...data, targetKeyword: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <Select>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quitoque">Quitoque</SelectItem>
                      <SelectItem value="manomano">ManoMano</SelectItem>
                      <SelectItem value="decathlon">Decathlon</SelectItem>
                      <SelectItem value="leroy">Leroy Merlin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Meta Title <span className="text-muted-foreground/60">({data.metaTitle.length}/60)</span>
                </Label>
                <Input
                  placeholder="Titre pour les moteurs de recherche"
                  value={data.metaTitle}
                  onChange={(e) => setData({ ...data, metaTitle: e.target.value })}
                  className="h-9"
                  maxLength={60}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Meta Description <span className="text-muted-foreground/60">({data.metaDescription.length}/155)</span>
                </Label>
                <Textarea
                  placeholder="Description pour les moteurs de recherche"
                  value={data.metaDescription}
                  onChange={(e) => setData({ ...data, metaDescription: e.target.value })}
                  rows={2}
                  maxLength={155}
                />
              </div>

              {/* Content editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Contenu</Label>
                  <span className="font-mono text-xs text-muted-foreground">{wordCount} mots</span>
                </div>
                <Textarea
                  placeholder="Commencez \u00e0 r\u00e9diger votre contenu optimis\u00e9 SEO...&#10;&#10;Utilisez des titres (##, ###) pour structurer votre article.&#10;Incluez votre mot-cl\u00e9 cible naturellement dans le texte."
                  value={data.body}
                  onChange={(e) => setData({ ...data, body: e.target.value })}
                  rows={20}
                  className="min-h-[400px] font-sans leading-relaxed resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEO Scoring Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Score SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score circle */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-full border-4",
                    totalScore >= 80 ? "border-emerald-500 text-emerald-600" : totalScore >= 50 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-500"
                  )}
                >
                  <span className="text-3xl font-bold font-mono">{totalScore}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalScore >= 80 ? "Excellent" : totalScore >= 50 ? "Correct" : "A am\u00e9liorer"}
                </p>
              </div>

              <Progress
                value={totalScore}
                className="h-2"
              />

              {/* Checklist */}
              <div className="space-y-2.5">
                {scoreResults.map((rule) => (
                  <div key={rule.label} className="flex items-start gap-2.5">
                    {rule.passed ? (
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <X className="h-2.5 w-2.5 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className={cn("text-xs font-medium", rule.passed ? "text-emerald-700" : "text-foreground")}>
                        {rule.label}
                      </p>
                      {!rule.passed && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{rule.recommendation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mots</span>
                <span className="font-mono font-medium">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Caract\u00e8res</span>
                <span className="font-mono font-medium">{data.body.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temps de lecture</span>
                <span className="font-mono font-medium">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
              {data.targetKeyword && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Densit\u00e9 mot-cl\u00e9</span>
                  <span className="font-mono font-medium">
                    {wordCount > 0
                      ? ((data.body.toLowerCase().split(data.targetKeyword.toLowerCase()).length - 1) / wordCount * 100).toFixed(1)
                      : "0.0"}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
