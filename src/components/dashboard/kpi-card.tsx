import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor = "text-primary" }: KPICardProps) {
  const trend = change === undefined ? null : change > 0 ? "up" : change < 0 ? "down" : "stable";

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
            {trend !== null && (
              <div className="flex items-center gap-1.5">
                {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                {trend === "stable" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-emerald-600",
                    trend === "down" && "text-red-500",
                    trend === "stable" && "text-muted-foreground"
                  )}
                >
                  {change !== undefined && change > 0 && "+"}
                  {change}
                  {changeLabel && ` ${changeLabel}`}
                </span>
              </div>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10", iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
