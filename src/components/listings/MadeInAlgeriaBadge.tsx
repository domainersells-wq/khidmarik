
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function MadeInAlgeriaBadge() {
  return (
    <Badge variant="secondary" className="my-1 bg-accent/20 text-accent-foreground border-accent/50 hover:bg-accent/30">
      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-accent" />
      Made in Algérie
    </Badge>
  );
}
