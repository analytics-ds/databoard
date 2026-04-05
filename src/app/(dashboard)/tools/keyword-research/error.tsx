"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function KeywordResearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6 p-6">
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Erreur sur la page Recherche de mots cles</h2>
              <p className="text-sm text-muted-foreground">
                {error.message || "Une erreur inattendue s'est produite"}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground font-mono">Digest: {error.digest}</p>
              )}
              <Button onClick={reset} variant="outline">
                Reessayer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
