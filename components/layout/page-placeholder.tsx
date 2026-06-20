import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  phase: string;
}

export function PagePlaceholder({
  title,
  description,
  icon: Icon = Construction,
  phase,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Card className="border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Icon className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-base font-medium text-muted-foreground">
            Coming in {phase}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
            This module will be implemented in a future phase. The UI shell is
            ready.
          </p>
          <Badge
            variant="outline"
            className="mt-4 text-xs text-muted-foreground"
          >
            {phase}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
