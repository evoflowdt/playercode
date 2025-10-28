import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your digital signage platform settings
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="rounded-full bg-muted p-6 inline-block mb-4">
          <SettingsIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Settings Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Configuration options and settings will be available in the next update
        </p>
      </Card>
    </div>
  );
}
