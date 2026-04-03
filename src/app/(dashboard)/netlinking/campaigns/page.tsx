"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DEMO_CAMPAIGNS = [
  { id: "1", name: "Janvier 2026 - Février 2026", budget: 4000, startDate: "01/01/2026", endDate: "28/02/2026", status: "late" as const },
  { id: "2", name: "Janvier 2025 - Décembre 2025", budget: 25830, startDate: "02/01/2025", endDate: "31/12/2025", status: "completed" as const },
  { id: "3", name: "Janvier 2024 - Décembre 2024", budget: 10170, startDate: "02/01/2024", endDate: "31/12/2024", status: "completed" as const },
  { id: "4", name: "Avril 2023 - Décembre 2023", budget: 10100, startDate: "19/04/2023", endDate: "31/12/2023", status: "completed" as const },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-emerald-600" },
  late: { label: "En retard", color: "text-red-500" },
  completed: { label: "Terminée", color: "text-muted-foreground" },
};

export default function CampaignsPage() {
  const { organization } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de campagne netlinking"
        description={`${organization?.name || ""}`}
      />

      {/* Add campaign */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center p-6">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une campagne
          </Button>
        </CardContent>
      </Card>

      {/* Campaign list */}
      <div className="space-y-3">
        {DEMO_CAMPAIGNS.map((campaign) => {
          const status = STATUS_CONFIG[campaign.status];
          return (
            <Card key={campaign.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <h3 className="text-base font-semibold">
                    {organization?.name || ""} - {campaign.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-mono font-medium">{campaign.budget.toLocaleString("fr-FR")} €</span>
                    {" "}- du {campaign.startDate} au {campaign.endDate}
                    {" "}- <span className={status.color}>{status.label}</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
