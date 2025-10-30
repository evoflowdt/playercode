import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Server, Settings2 } from "lucide-react";
import type { Organization } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/language-provider";

export default function OrganizationPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    plan: "free",
    maxDisplays: 5,
  });

  // Fetch organization
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  // Update form data when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        plan: organization.plan,
        maxDisplays: organization.maxDisplays,
      });
    }
  }, [organization]);

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      return await apiRequest("PATCH", "/api/organization", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      toast({
        title: t("organizationUpdated"),
        description: t("organizationUpdated"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedUpdateOrganization"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg text-muted-foreground" data-testid="text-loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("organizationSettings")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("organizationSettingsSubtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("generalSettings")}</CardTitle>
            </div>
            <CardDescription>
              {t("basicInformation")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("organizationName")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("orgSettingsNamePlaceholder")}
                data-testid="input-organization-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("organizationSlug")}</Label>
              <Input
                id="slug"
                value={organization?.slug || ""}
                disabled
                className="bg-muted"
                data-testid="input-organization-slug"
              />
              <p className="text-sm text-muted-foreground">
                {t("uniqueIdentifier")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Limits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("planLimits")}</CardTitle>
            </div>
            <CardDescription>
              {t("subscriptionPlan")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">{t("plan")}</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) => setFormData({ ...formData, plan: value })}
              >
                <SelectTrigger id="plan" data-testid="select-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{t("planFree")}</SelectItem>
                  <SelectItem value="pro">{t("planPro")}</SelectItem>
                  <SelectItem value="enterprise">{t("planEnterprise")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDisplays">{t("maxDisplays")}</Label>
              <Input
                id="maxDisplays"
                type="number"
                min="1"
                max="1000"
                value={formData.maxDisplays}
                onChange={(e) =>
                  setFormData({ ...formData, maxDisplays: parseInt(e.target.value) || 5 })
                }
                data-testid="input-max-displays"
              />
              <p className="text-sm text-muted-foreground">
                {t("maxDisplaysDescription")}
              </p>
            </div>

            {organization && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">{t("organizationDetails")}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("created")}</p>
                    <p className="font-medium">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("lastUpdated")}</p>
                    <p className="font-medium">
                      {new Date(organization.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
