import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Monitor, RefreshCw, Clock, Copy, Check, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-provider";

interface PairingToken {
  id: string;
  token: string;
  displayName?: string;
  os?: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

interface PlayerSession {
  id: string;
  displayId: string;
  displayName: string;
  displayOs: string;
  displayStatus: string;
  connectedAt: string;
  lastHeartbeat: string;
  playerVersion?: string;
  currentContentId?: string;
}

export default function Settings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [os, setOs] = useState("web");
  const [currentToken, setCurrentToken] = useState<PairingToken | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [deletingSessionIds, setDeletingSessionIds] = useState<Set<string>>(new Set());

  // Fetch player sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<PlayerSession[]>({
    queryKey: ["/api/player/sessions"],
    refetchInterval: 10000,
  });

  // Delete player session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (displayId: string) => {
      const response = await fetch(`/api/player/session/${displayId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete session");
      }
      // 204 No Content has no body, don't try to parse it
      return displayId;
    },
    onMutate: (displayId) => {
      // Track which session is being deleted
      setDeletingSessionIds(prev => {
        const newSet = new Set(prev);
        newSet.add(displayId);
        return newSet;
      });
    },
    onSuccess: (displayId) => {
      // Remove from pending set
      setDeletingSessionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(displayId);
        return newSet;
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/player/sessions"] });
      toast({
        title: t('sessionDeleted'),
        description: t('sessionDeletedDesc'),
      });
    },
    onError: (error, displayId) => {
      // Remove from pending set
      setDeletingSessionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(displayId);
        return newSet;
      });
      
      console.error("Delete session error:", error);
      toast({
        title: t('error'),
        description: t('failedDeleteSession'),
        variant: "destructive",
      });
    },
  });

  // Generate pairing token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async (data: { displayName?: string; os?: string }): Promise<PairingToken> => {
      const response = await apiRequest("POST", "/api/player/pairing-token", data);
      return response.json();
    },
    onSuccess: (data: PairingToken) => {
      setCurrentToken(data);
      toast({
        title: t('pairingTokenGenerated'),
        description: t('pairingTokenGeneratedDesc'),
      });
      
      // Calculate time left
      const expiresAt = new Date(data.expiresAt).getTime();
      const now = Date.now();
      setTimeLeft(Math.floor((expiresAt - now) / 1000));
      
      // Update countdown every second
      const interval = setInterval(() => {
        const newTimeLeft = Math.floor((expiresAt - Date.now()) / 1000);
        if (newTimeLeft <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
          setCurrentToken(null);
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedGenerateToken'),
        variant: "destructive",
      });
    },
  });

  const handleGenerateToken = () => {
    generateTokenMutation.mutate({
      displayName: displayName.trim() || undefined,
      os: os || undefined,
    });
  };

  const handleCopyToken = () => {
    if (currentToken) {
      navigator.clipboard.writeText(currentToken.token);
      setCopiedToken(true);
      toast({
        title: t('copied'),
        description: t('tokenCopiedToClipboard'),
      });
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('settings')}</h1>
        <p className="text-muted-foreground">
          Configure your digital signage platform and manage player devices
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            {t('pairNewDisplay')}
          </CardTitle>
          <CardDescription>
            {t('generatePairingTokenDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!currentToken ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('displayNameOptional')}</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., Reception Display"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="os">{t('platformOptional')}</Label>
                  <select
                    id="os"
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="select-os"
                  >
                    <option value="web">Web Browser</option>
                    <option value="raspberry-pi">Raspberry Pi</option>
                    <option value="lg-webos">LG webOS</option>
                    <option value="samsung-tizen">Samsung Tizen</option>
                    <option value="android">Android</option>
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                  </select>
                </div>
              </div>
              
              <Button
                onClick={handleGenerateToken}
                disabled={generateTokenMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-generate-token"
              >
                {generateTokenMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('generatePairingToken')}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pairing Token</h3>
                  {timeLeft !== null && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {t('expiresIn')} {formatTime(timeLeft)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-3xl font-bold tracking-widest text-center py-4 bg-background rounded-md border" data-testid="text-pairing-token">
                    {currentToken.token}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToken}
                    data-testid="button-copy-token"
                  >
                    {copiedToken ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Open a web browser on your display device</li>
                    <li>Navigate to: <code className="bg-muted px-1 py-0.5 rounded">{window.location.origin}/player</code></li>
                    <li>Enter the pairing token above</li>
                    <li>Your display will automatically connect and start showing content</li>
                  </ol>
                </div>
              </div>

              <Button
                onClick={() => {
                  setCurrentToken(null);
                  setTimeLeft(null);
                  setDisplayName("");
                }}
                variant="outline"
                data-testid="button-generate-another"
              >
                Generate Another Token
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Player Application</CardTitle>
          <CardDescription>
            Access the standalone player application to display content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {t('playerUrlDesc')}
              </p>
              <code className="block bg-muted px-4 py-2 rounded-md text-sm">
                {window.location.origin}/player
              </code>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.open("/player", "_blank");
              }}
              data-testid="button-open-player"
            >
              {t('openPlayer')}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Supported Platforms:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Web Browser (Chrome, Firefox, Safari, Edge)</li>
              <li>Raspberry Pi (Chromium browser in kiosk mode)</li>
              <li>LG webOS (WebOS browser)</li>
              <li>Samsung Tizen (Tizen browser)</li>
              <li>Android devices (Chrome browser)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('activePlayerSessions')}</CardTitle>
          <CardDescription>
            {t('activePlayerSessionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('noActivePlayerSessions')}</p>
              <p className="text-sm">{t('pairDisplayToSee')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{session.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.displayOs} • v{session.playerVersion || "1.0.0"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Last heartbeat</p>
                      <p className="font-medium">
                        {new Date(session.lastHeartbeat).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge
                      variant={session.displayStatus === "online" ? "default" : "secondary"}
                      className={session.displayStatus === "online" ? "bg-green-500" : ""}
                    >
                      {session.displayStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSessionMutation.mutate(session.displayId)}
                      disabled={deletingSessionIds.has(session.displayId)}
                      data-testid={`button-delete-session-${session.displayId}`}
                      title="Delete session"
                    >
                      {deletingSessionIds.has(session.displayId) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('systemInformation')}</CardTitle>
          <CardDescription>
            {t('systemInformationDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Platform</p>
              <p className="text-sm text-muted-foreground">EvoFlow Digital Signage</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Version</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Sessions</p>
              <Badge variant="outline">{sessions.length}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Database</p>
              <p className="text-sm text-muted-foreground">PostgreSQL (Neon)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
