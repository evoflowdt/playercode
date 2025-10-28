import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  testId?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export function StatsCard({ title, value, icon: Icon, trend, testId, variant = "default" }: StatsCardProps) {
  const iconBgColor = {
    default: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    destructive: "bg-destructive/10",
  }[variant];

  const iconColor = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[variant];

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight" data-testid={testId}>
            {value}
          </p>
          {trend && (
            <p
              className={`text-sm mt-2 font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-xl ${iconBgColor} p-4 shrink-0`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
