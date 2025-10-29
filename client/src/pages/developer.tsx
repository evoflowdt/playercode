import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Webhook as WebhookIcon, Copy, Trash2, Eye, Send, Edit } from "lucide-react";
import type { ApiKey, Webhook, WebhookEvent } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const AVAILABLE_EVENTS = [
  "display.created",
  "display.updated",
  "display.deleted",
  "content.created",
  "content.updated",
  "content.deleted",
  "schedule.created",
  "schedule.updated",
  "schedule.deleted",
];

export default function Developer() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKeyExpiry, setNewApiKeyExpiry] = useState("");
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const { data: webhooks = [] } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  const { data: webhookEvents = [] } = useQuery<WebhookEvent[]>({
    queryKey: ["/api/webhooks", selectedWebhook?.id, "events"],
    enabled: !!selectedWebhook,
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string; expiresAt?: string }) => {
      return await apiRequest("POST", "/api/api-keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setApiKeyDialogOpen(false);
      setNewApiKeyName("");
      setNewApiKeyExpiry("");
      toast({
        title: t("success"),
        description: t("apiKeyCreated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setRevokeKeyId(null);
      toast({
        title: t("success"),
        description: t("apiKeyRevoked"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data: { name: string; url: string; events: string[] }) => {
      return await apiRequest("POST", "/api/webhooks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setWebhookDialogOpen(false);
      setWebhookForm({ name: "", url: "", events: [] });
      setEditingWebhook(null);
      toast({
        title: t("success"),
        description: t("webhookCreated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Webhook> }) => {
      return await apiRequest("PATCH", `/api/webhooks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setWebhookDialogOpen(false);
      setWebhookForm({ name: "", url: "", events: [] });
      setEditingWebhook(null);
      toast({
        title: t("success"),
        description: t("webhookUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setDeleteWebhookId(null);
      toast({
        title: t("success"),
        description: t("webhookDeleted"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/webhooks/${id}/test`);
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("testWebhookSent"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("success"),
      description: t("keyCopied"),
    });
  };

  const handleCreateApiKey = () => {
    createApiKeyMutation.mutate({
      name: newApiKeyName,
      expiresAt: newApiKeyExpiry || undefined,
    });
  };

  const handleCreateWebhook = () => {
    if (editingWebhook) {
      updateWebhookMutation.mutate({
        id: editingWebhook.id,
        data: webhookForm,
      });
    } else {
      createWebhookMutation.mutate(webhookForm);
    }
  };

  const openEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setWebhookForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
    });
    setWebhookDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("developerTitle")}</h1>
        <p className="text-muted-foreground text-base">{t("developerSubtitle")}</p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">
            {t("apiKeys")}
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            {t("webhooks")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {t("apiKeys")}
                </CardTitle>
                <CardDescription>{t("apiKeysDescription")}</CardDescription>
              </div>
              <Button
                onClick={() => setApiKeyDialogOpen(true)}
                data-testid="button-create-api-key"
              >
                {t("createApiKey")}
              </Button>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">{t("noApiKeys")}</p>
                  <p className="text-sm text-muted-foreground">{t("createFirstApiKey")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("apiKey")}</TableHead>
                      <TableHead>{t("created")}</TableHead>
                      <TableHead>{t("lastUsed")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id} data-testid={`api-key-${key.id}`}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {key.key.substring(0, 20)}...
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(key.key)}
                            className="ml-2 h-6 w-6"
                            data-testid={`button-copy-key-${key.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>{format(new Date(key.createdAt), "PPp")}</TableCell>
                        <TableCell>
                          {key.lastUsedAt ? format(new Date(key.lastUsedAt), "PPp") : t("never")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRevokeKeyId(key.id)}
                            disabled={key.revoked}
                            data-testid={`button-revoke-key-${key.id}`}
                          >
                            {key.revoked ? t("revoked") : t("revoke")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <WebhookIcon className="h-5 w-5" />
                  {t("webhooks")}
                </CardTitle>
                <CardDescription>{t("webhooksDescription")}</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingWebhook(null);
                  setWebhookForm({ name: "", url: "", events: [] });
                  setWebhookDialogOpen(true);
                }}
                data-testid="button-create-webhook"
              >
                {t("createWebhook")}
              </Button>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-12">
                  <WebhookIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">{t("noWebhooks")}</p>
                  <p className="text-sm text-muted-foreground">{t("createFirstWebhook")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("webhookUrl")}</TableHead>
                      <TableHead>{t("events")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id} data-testid={`webhook-${webhook.id}`}>
                        <TableCell className="font-medium">{webhook.name}</TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">
                          {webhook.url}
                        </TableCell>
                        <TableCell>{webhook.events.length} events</TableCell>
                        <TableCell>
                          <Badge variant={webhook.active ? "default" : "secondary"}>
                            {webhook.active ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setEventsDialogOpen(true);
                            }}
                            data-testid={`button-view-events-${webhook.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t("viewEvents")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhookMutation.mutate(webhook.id)}
                            data-testid={`button-test-webhook-${webhook.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {t("testWebhook")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditWebhook(webhook)}
                            data-testid={`button-edit-webhook-${webhook.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteWebhookId(webhook.id)}
                            data-testid={`button-delete-webhook-${webhook.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("delete")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent data-testid="dialog-create-api-key">
          <DialogHeader>
            <DialogTitle>{t("createApiKey")}</DialogTitle>
            <DialogDescription>{t("apiKeysDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">{t("keyName")}</Label>
              <Input
                id="key-name"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder={t("keyNamePlaceholder")}
                data-testid="input-api-key-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-expiry">
                {t("expiresAt")} ({t("optional")})
              </Label>
              <Input
                id="key-expiry"
                type="date"
                value={newApiKeyExpiry}
                onChange={(e) => setNewApiKeyExpiry(e.target.value)}
                data-testid="input-api-key-expiry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreateApiKey}
              disabled={!newApiKeyName || createApiKeyMutation.isPending}
              data-testid="button-submit-api-key"
            >
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-webhook">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? t("editWebhook") : t("createWebhook")}
            </DialogTitle>
            <DialogDescription>{t("webhooksDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">{t("webhookName")}</Label>
              <Input
                id="webhook-name"
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder={t("webhookName")}
                data-testid="input-webhook-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">{t("webhookUrl")}</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                placeholder={t("webhookUrlPlaceholder")}
                data-testid="input-webhook-url"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("webhookEvents")}</Label>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={webhookForm.events.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setWebhookForm({
                            ...webhookForm,
                            events: [...webhookForm.events, event],
                          });
                        } else {
                          setWebhookForm({
                            ...webhookForm,
                            events: webhookForm.events.filter((e) => e !== event),
                          });
                        }
                      }}
                      data-testid={`checkbox-event-${event}`}
                    />
                    <label
                      htmlFor={event}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={
                !webhookForm.name ||
                !webhookForm.url ||
                webhookForm.events.length === 0 ||
                createWebhookMutation.isPending ||
                updateWebhookMutation.isPending
              }
              data-testid="button-submit-webhook"
            >
              {editingWebhook ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Events Dialog */}
      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
        <DialogContent className="max-w-4xl" data-testid="dialog-webhook-events">
          <DialogHeader>
            <DialogTitle>{t("webhookEventHistory")}</DialogTitle>
            <DialogDescription>
              {selectedWebhook?.name} - {selectedWebhook?.url}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {webhookEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t("noEvents")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("eventType")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("attempts")}</TableHead>
                    <TableHead>{t("responseStatus")}</TableHead>
                    <TableHead>{t("created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.status === "sent"
                              ? "default"
                              : event.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {event.status === "sent"
                            ? t("sent")
                            : event.status === "failed"
                              ? t("failed")
                              : t("pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.attempts}</TableCell>
                      <TableCell>{event.responseStatus || "-"}</TableCell>
                      <TableCell>{format(new Date(event.createdAt), "PPp")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Alert Dialog */}
      <AlertDialog open={!!revokeKeyId} onOpenChange={() => setRevokeKeyId(null)}>
        <AlertDialogContent data-testid="dialog-revoke-api-key">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revokeKey")}</AlertDialogTitle>
            <AlertDialogDescription>{t("revokeKeyConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeKeyId && revokeApiKeyMutation.mutate(revokeKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-revoke"
            >
              {t("revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Webhook Alert Dialog */}
      <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
        <AlertDialogContent data-testid="dialog-delete-webhook">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteWebhook")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteWebhookConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWebhookId && deleteWebhookMutation.mutate(deleteWebhookId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
