import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          View insights and performance metrics for your digital signage network
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="rounded-full bg-muted p-6 inline-block mb-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Detailed analytics and reporting features will be available in the next update
        </p>
      </Card>
    </div>
  );
}
