"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, AlertTriangle, FileText, CheckCircle2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_ALERTS = [
  { id: "1", type: "position_drop", title: "Chute de position: 'menu de la semaine'", message: "Le mot-clé est passé de la position 3 à 5", severity: "warning" as const, isRead: false, createdAt: "2026-04-03T10:30:00" },
  { id: "2", type: "position_gain", title: "Gain de position: 'batch cooking'", message: "Le mot-clé est passé de la position 12 à 8", severity: "info" as const, isRead: false, createdAt: "2026-04-03T09:15:00" },
  { id: "3", type: "content_due", title: "Article en retard: 'LP batch cooking automne'", message: "L'article devait être publié le 01/04", severity: "critical" as const, isRead: false, createdAt: "2026-04-02T14:00:00" },
  { id: "4", type: "position_drop", title: "Chute importante: 'recette lasagnes'", message: "Le mot-clé est passé de la position 15 à 23", severity: "warning" as const, isRead: true, createdAt: "2026-04-01T11:20:00" },
  { id: "5", type: "position_gain", title: "Top 3 atteint: 'box repas'", message: "Le mot-clé est maintenant en position 2", severity: "info" as const, isRead: true, createdAt: "2026-03-31T08:00:00" },
];

const ALERT_ICONS = { position_drop: TrendingDown, position_gain: TrendingUp, crawl_error: AlertTriangle, content_due: FileText, custom: Bell };
const SEVERITY_STYLES = { info: "border-l-blue-500 bg-blue-50/50", warning: "border-l-amber-500 bg-amber-50/50", critical: "border-l-red-500 bg-red-50/50" };

export default function AlertsPage() {
  const { organization } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Alertes" description={`${organization?.name || ""} (${organization?.domain || ""})`}>
        <Button variant="outline" size="sm" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {DEMO_ALERTS.map((alert) => {
          const Icon = ALERT_ICONS[alert.type as keyof typeof ALERT_ICONS] || Bell;
          return (
            <Card key={alert.id} className={cn("border-l-4 transition-colors", SEVERITY_STYLES[alert.severity], alert.isRead && "opacity-60")}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", alert.severity === "critical" ? "bg-red-100" : alert.severity === "warning" ? "bg-amber-100" : "bg-blue-100")}>
                  <Icon className={cn("h-5 w-5", alert.severity === "critical" ? "text-red-600" : alert.severity === "warning" ? "text-amber-600" : "text-blue-600")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn("text-sm font-semibold", !alert.isRead && "text-foreground")}>{alert.title}</h4>
                    {!alert.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="secondary" className={cn("text-[10px]", alert.severity === "critical" ? "bg-red-100 text-red-700" : alert.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                      {alert.severity === "critical" ? "Critique" : alert.severity === "warning" ? "Attention" : "Info"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
