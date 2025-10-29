import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { useLanguage } from "@/lib/language-provider";

export default function AcceptInvitationPage() {
  const { t } = useLanguage();
  const [, params] = useRoute("/accept-invitation/:token");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const token = params?.token || "";

  const acceptMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      return await apiRequest("POST", `/api/invitations/accept/${invitationToken}`);
    },
    onSuccess: () => {
      setStatus("success");
      toast({
        title: t("invitationAccepted"),
        description: t("invitationAccepted"),
      });
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: any) => {
      setStatus("error");
      setErrorMessage(error.message || t("failedAcceptInvitation"));
      toast({
        title: t("error"),
        description: error.message || t("failedAcceptInvitation"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      // User is not logged in
      setStatus("error");
      setErrorMessage(t("mustBeLoggedIn"));
    }
  }, [user, authLoading, t]);

  const handleAccept = () => {
    if (!user) {
      setStatus("error");
      setErrorMessage(t("mustBeLoggedIn"));
      return;
    }
    acceptMutation.mutate(token);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground" data-testid="text-loading">{t("loading")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t("acceptInvitation")}</CardTitle>
              <CardDescription>{t("acceptInvitationSubtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {status === "pending" && !errorMessage && user && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("youHaveBeenInvited")}
              </p>
              <Button
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
                className="w-full"
                data-testid="button-accept-invitation"
              >
                {acceptMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("acceptAndJoin")
                )}
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold" data-testid="text-success">{t("invitationAccepted")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("invitationAccepted")}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-16 w-16 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold" data-testid="text-error">{t("invalidInvitation")}</h3>
                <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
                {!user && (
                  <Button
                    onClick={() => setLocation("/login")}
                    className="mt-4"
                    data-testid="button-goto-login"
                  >
                    {t("login")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
