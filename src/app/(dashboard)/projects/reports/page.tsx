"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { RichEditor } from "@/components/shared/rich-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
  Edit,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingReport {
  id: string;
  date: string;
  subject: string;
  duration: string | null;
  reportUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export default function MeetingReportsPage() {
  const { activeClient, isReader } = useAuth();
  const [reports, setReports] = useState<MeetingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create form state
  const [formDate, setFormDate] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formReportUrl, setFormReportUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchReports = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meeting-reports?org_id=${activeClient.id}`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeClient]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function resetForm() {
    setFormDate("");
    setFormSubject("");
    setFormDuration("");
    setFormReportUrl("");
    setFormNotes("");
  }

  async function handleCreate() {
    if (!activeClient || !formDate || !formSubject) return;
    setSaving(true);
    try {
      await fetch("/api/meeting-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeClient.id,
          date: formDate,
          subject: formSubject,
          duration: formDuration || null,
          reportUrl: formReportUrl || null,
          notes: formNotes || null,
        }),
      });
      resetForm();
      setCreateOpen(false);
      await fetchReports();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes(report: MeetingReport) {
    if (!activeClient) return;
    setSaving(true);
    try {
      await fetch("/api/meeting-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: report.id,
          orgId: activeClient.id,
          date: report.date,
          subject: report.subject,
          duration: report.duration,
          reportUrl: report.reportUrl,
          notes: editNotes,
        }),
      });
      setEditingId(null);
      await fetchReports();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reportId: string) {
    if (!activeClient) return;
    try {
      await fetch("/api/meeting-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, orgId: activeClient.id }),
      });
      await fetchReports();
    } catch {
      // silently fail
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes rendus"
        description="Points mensuels avec le client"
      >
        {!isReader && (
          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Nouveau compte rendu
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau compte rendu</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cr-date">Date *</Label>
                  <Input
                    id="cr-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cr-subject">Sujet *</Label>
                  <Input
                    id="cr-subject"
                    placeholder="Ex : Point mensuel mars 2026"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cr-duration">Durée</Label>
                    <Input
                      id="cr-duration"
                      placeholder="Ex : 45 min"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cr-url">Lien du document</Label>
                    <Input
                      id="cr-url"
                      type="url"
                      placeholder="https://docs.google.com/..."
                      value={formReportUrl}
                      onChange={(e) => setFormReportUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <RichEditor
                    content={formNotes}
                    onChange={setFormNotes}
                    placeholder="Compte rendu de la réunion..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={saving || !formDate || !formSubject}
                  className="gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun compte rendu
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isReader
                ? "Les comptes rendus apparaîtront ici."
                : "Créez votre premier compte rendu pour commencer."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const isEditing = editingId === report.id;

            return (
              <Card key={report.id} className="transition-colors hover:border-primary/20">
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : report.id);
                    if (isEditing) setEditingId(null);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{report.subject}</CardTitle>
                        {report.duration && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {report.duration}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="capitalize">{formatDate(report.date)}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>par {report.createdBy}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {report.reportUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewUrl(report.reportUrl!);
                            }}
                            title="Prévisualiser le document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(report.reportUrl!, "_blank");
                            }}
                            title="Ouvrir le document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    {report.reportUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={report.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {report.reportUrl}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 gap-1.5 text-xs"
                          onClick={() => setPreviewUrl(report.reportUrl!)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Prévisualiser
                        </Button>
                      </div>
                    )}

                    {isEditing ? (
                      <div className="space-y-3">
                        <RichEditor
                          content={editNotes}
                          onChange={setEditNotes}
                          placeholder="Notes du compte rendu..."
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(report)}
                            disabled={saving}
                            className="gap-2"
                          >
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {report.notes ? (
                          <div
                            className="prose prose-sm max-w-none rounded-lg bg-muted/50 p-3 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: report.notes }}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Aucune note pour ce compte rendu.
                          </p>
                        )}
                      </>
                    )}

                    {!isReader && !isEditing && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => {
                            setEditingId(report.id);
                            setEditNotes(report.notes ?? "");
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Modifier les notes
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                              />
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Supprimer ce compte rendu ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Le compte rendu du{" "}
                                {new Date(report.date).toLocaleDateString("fr-FR")} sera
                                supprimé définitivement. Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Iframe preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="truncate">Prévisualisation du document</DialogTitle>
              <div className="flex items-center gap-2 shrink-0">
                {previewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(previewUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border overflow-hidden bg-white">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="h-full w-full"
                title="Prévisualisation du document"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
