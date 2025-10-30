import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Loader2, WifiOff, Wifi } from "lucide-react";

interface PlayerContent {
  id: string;
  name: string;
  type: string;
  url?: string;
  htmlContent?: string;
  duration?: number;
}

interface PlayerData {
  display: {
    id: string;
    name: string;
    os: string;
    resolution?: string;
  };
  content: PlayerContent[];
  schedules: any[];
}

export default function Player() {
  const [isPaired, setIsPaired] = useState(false);
  const [pairingToken, setPairingToken] = useState("");
  const [displayId, setDisplayId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [content, setContent] = useState<PlayerContent[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [radioStreamUrl, setRadioStreamUrl] = useState<string | null>(null);
  const [displayResolution, setDisplayResolution] = useState<{ width: number; height: number } | null>(null);
  const [syncState, setSyncState] = useState<{
    isActive: boolean;
    sessionId?: string;
    status: "playing" | "paused" | "stopped";
  }>({ isActive: false, status: "stopped" });
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentRotationRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const syncSessionRef = useRef<string | null>(null);

  // Reset player state (when display is deleted)
  const resetPlayer = useCallback(() => {
    console.log("[Player] Resetting player - display was deleted");
    localStorage.removeItem("evoflow_display_id");
    setIsPaired(false);
    setDisplayId("");
    setContent([]);
    setCurrentContentIndex(0);
    setIsConnected(false);
    
    // Close WebSocket if open
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear WebSocket reconnect timeout
    if (wsReconnectTimeoutRef.current) {
      clearTimeout(wsReconnectTimeoutRef.current);
      wsReconnectTimeoutRef.current = null;
    }
    
    // Clear intervals
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (contentRotationRef.current) {
      clearTimeout(contentRotationRef.current);
      contentRotationRef.current = null;
    }
    
    toast({
      title: "Player disconnected",
      description: "This display was removed. Please pair with a new token.",
      variant: "destructive",
    });
  }, [toast]);

  // Fetch content from server
  const fetchContent = useCallback(async (displayId: string) => {
    try {
      console.log("[Player] Fetching content for displayId:", displayId);
      const response = await fetch(`/api/player/content/${displayId}`);
      
      // If display not found (404), reset the player
      if (response.status === 404) {
        resetPlayer();
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }
      const data: PlayerData & { radioStreams?: any[] } = await response.json();
      console.log("[Player] Received content data:", data);
      console.log("[Player] Content array:", data.content);
      console.log("[Player] Radio streams:", data.radioStreams);
      
      // Parse display resolution
      if (data.display.resolution) {
        const [width, height] = data.display.resolution.split('x').map(Number);
        if (!isNaN(width) && !isNaN(height)) {
          console.log("[Player] Setting display resolution:", { width, height });
          setDisplayResolution({ width, height });
        } else {
          console.log("[Player] Invalid resolution format, resetting to null");
          setDisplayResolution(null);
        }
      } else {
        console.log("[Player] No resolution configured, resetting to null");
        setDisplayResolution(null);
      }
      
      setContent(data.content || []);
      
      // Set radio stream if available
      if (data.radioStreams && data.radioStreams.length > 0) {
        const activeStream = data.radioStreams.find(s => s.active);
        if (activeStream) {
          console.log("[Player] Setting radio stream:", activeStream.url);
          setRadioStreamUrl(activeStream.url);
        } else {
          setRadioStreamUrl(null);
        }
      } else {
        setRadioStreamUrl(null);
      }
      
      if (data.content && data.content.length > 0) {
        console.log("[Player] Content loaded successfully, count:", data.content.length);
        toast({
          title: "Content updated",
          description: `${data.content.length} content item(s) loaded`,
        });
      } else {
        console.log("[Player] No content items in response");
      }
    } catch (error) {
      console.error("[Player] Content fetch error:", error);
    }
  }, [toast, resetPlayer]);

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async (displayId: string) => {
    try {
      const response = await fetch("/api/player/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayId,
          status: "online",
          currentContentId: content[currentContentIndex]?.id,
        }),
      });
      
      // If display not found (404), reset the player
      if (response.status === 404) {
        resetPlayer();
        return;
      }
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, [content, currentContentIndex, resetPlayer]);

  // Pair with server using token
  const handlePair = async () => {
    if (!pairingToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a pairing token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/player/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: pairingToken.trim().toUpperCase(),
          displayInfo: {
            name: `Web Player`,
            os: "web",
            playerVersion: "1.0.0",
            // Don't send resolution during pairing - let user configure it manually
            capabilities: {
              supportsVideo: true,
              supportsAudio: true,
              supportsHtml: true,
              supportsTouch: 'ontouchstart' in window,
              maxVideoResolution: `${window.screen.width}x${window.screen.height}`,
              supportedVideoFormats: ['video/mp4', 'video/webm'],
              supportedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Pairing failed");
      }

      const data = await response.json();
      setDisplayId(data.display.id);
      localStorage.setItem("evoflow_display_id", data.display.id);
      setIsPaired(true);
      
      toast({
        title: "Display Created & Paired Successfully",
        description: `Display Name: ${data.display.name}\nDisplay ID: ${data.display.id}\n\nYou can now create schedules targeting this display ID.`,
      });

      console.log("[Player] Display created with ID:", data.display.id);

      // Fetch content after pairing
      await fetchContent(data.display.id);
    } catch (error: any) {
      toast({
        title: "Pairing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!isPaired || !displayId) {
      // Cancel any pending reconnection if we're no longer paired
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
        wsReconnectTimeoutRef.current = null;
      }
      return;
    }

    const connectWebSocket = () => {
      // Double-check we're still paired before connecting
      if (!isPaired || !displayId) {
        console.log("WebSocket reconnect cancelled - not paired");
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'display_updated' && message.data?.id === displayId) {
            console.log("Display updated, refetching content");
            fetchContent(displayId);
          }
          
          // Handle sync commands
          if (message.type === 'sync:start' && message.data) {
            console.log("[Sync] Received start command:", message.data);
            syncSessionRef.current = message.data.sessionId;
            setSyncState({
              isActive: true,
              sessionId: message.data.sessionId,
              status: "playing",
            });
            // Fetch the new content for this sync session
            fetchContent(displayId);
          }
          
          if (message.type === 'sync:pause' && message.data?.sessionId === syncSessionRef.current) {
            console.log("[Sync] Received pause command");
            setSyncState(prev => ({ ...prev, status: "paused" }));
            // Pause video if playing
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          }
          
          if (message.type === 'sync:resume' && message.data?.sessionId === syncSessionRef.current) {
            console.log("[Sync] Received resume command");
            setSyncState(prev => ({ ...prev, status: "playing" }));
            // Resume video if paused
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(console.error);
            }
          }
          
          if (message.type === 'sync:stop' && message.data?.sessionId === syncSessionRef.current) {
            console.log("[Sync] Received stop command");
            syncSessionRef.current = null;
            setSyncState({ isActive: false, status: "stopped" });
            // Stop video and reset
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
            // Return to regular content rotation
            fetchContent(displayId);
          }
          
          if (message.type === 'sync:seek' && message.data?.sessionId === syncSessionRef.current) {
            console.log("[Sync] Received seek command:", message.data.position);
            // Seek video to position
            if (videoRef.current) {
              videoRef.current.currentTime = message.data.position;
            }
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        // Only reconnect if still paired
        if (isPaired && displayId) {
          console.log("Scheduling WebSocket reconnect in 3 seconds");
          wsReconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        } else {
          console.log("WebSocket reconnect cancelled - not paired");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
        wsReconnectTimeoutRef.current = null;
      }
    };
  }, [isPaired, displayId, fetchContent]);

  // Setup heartbeat interval
  useEffect(() => {
    if (!isPaired || !displayId) return;

    // Send initial heartbeat
    sendHeartbeat(displayId);

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(displayId);
    }, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [isPaired, displayId, sendHeartbeat]);

  // Setup content rotation for non-video content (disabled during sync mode)
  useEffect(() => {
    // Don't rotate if sync mode is active or no content
    if (!isPaired || content.length === 0 || syncState.isActive) return;
    
    const currentContent = content[currentContentIndex];
    
    // Only use timeout for non-video content (images, html, webpages)
    // Videos will rotate via onEnded event
    if (currentContent?.type === "video") return;

    const rotateContent = () => {
      setCurrentContentIndex((prev) => (prev + 1) % content.length);
    };

    // Get duration for current content (default 10 seconds)
    const duration = currentContent?.duration || 10000;

    contentRotationRef.current = setTimeout(rotateContent, duration);

    return () => {
      if (contentRotationRef.current) {
        clearTimeout(contentRotationRef.current);
      }
    };
  }, [isPaired, content, currentContentIndex, syncState.isActive]);

  // Check for existing display ID on mount
  useEffect(() => {
    const savedDisplayId = localStorage.getItem("evoflow_display_id");
    if (savedDisplayId) {
      setDisplayId(savedDisplayId);
      setIsPaired(true);
      fetchContent(savedDisplayId);
    }
  }, [fetchContent]);

  // Enter fullscreen on paired
  useEffect(() => {
    if (isPaired) {
      document.documentElement.requestFullscreen?.().catch(console.error);
    }
  }, [isPaired]);

  // Handle radio stream playback
  useEffect(() => {
    console.log("[Player] Radio stream effect triggered");
    console.log("[Player] radioStreamUrl:", radioStreamUrl);
    console.log("[Player] content.length:", content.length);
    console.log("[Player] radioAudioRef.current:", radioAudioRef.current);
    
    if (!radioAudioRef.current) {
      console.log("[Player] No radioAudioRef, skipping");
      return;
    }

    if (radioStreamUrl && content.length > 0) {
      // Start playing radio stream
      console.log("[Player] Starting radio stream:", radioStreamUrl);
      radioAudioRef.current.src = radioStreamUrl;
      radioAudioRef.current.volume = 0.5; // Set volume to 50%
      radioAudioRef.current.play().then(() => {
        console.log("[Player] Radio stream started successfully");
      }).catch(err => {
        console.error("[Player] Failed to play radio stream:", err);
        console.error("[Player] Error details:", err.message);
      });
    } else {
      // Stop radio stream
      console.log("[Player] Stopping radio stream - radioStreamUrl:", radioStreamUrl, "content.length:", content.length);
      radioAudioRef.current.pause();
      radioAudioRef.current.src = "";
    }
  }, [radioStreamUrl, content.length]);

  // Render content
  const renderContent = () => {
    if (content.length === 0) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4">
            <Monitor className="w-24 h-24 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">No content scheduled</h2>
            <p className="text-muted-foreground">
              Waiting for content from EvoFlow dashboard
            </p>
          </div>
        </div>
      );
    }

    const currentContent = content[currentContentIndex];
    
    // Check if content has a valid URL (for media types)
    if ((currentContent.type === "image" || currentContent.type === "video" || currentContent.type === "webpage") && !currentContent.url) {
      const isMediaType = currentContent.type === "image" || currentContent.type === "video";
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4">
            <Monitor className="w-24 h-24 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold text-destructive">Content Error</h2>
            <p className="text-muted-foreground max-w-md">
              The content "{currentContent.name}" is missing a {isMediaType ? "file" : "webpage"} URL.
              <br />
              {isMediaType 
                ? 'Please upload the file using "Upload Content" in the Content Library.'
                : 'Please edit this content and provide a valid webpage URL.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Content ID: <code className="bg-muted px-2 py-1 rounded">{currentContent.id}</code>
            </p>
          </div>
        </div>
      );
    }

    // Check if URL is external (for iframe support)
    const isExternalUrl = currentContent.url && (
      currentContent.url.startsWith('http://') || 
      currentContent.url.startsWith('https://')
    );

    if (currentContent.type === "image") {
      // If URL is external and looks like a webpage, render as iframe
      if (isExternalUrl && !currentContent.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        return (
          <div className="h-screen w-screen bg-black">
            <iframe
              key={currentContent.id}
              src={currentContent.url}
              className="w-full h-full border-0"
              title={currentContent.name}
              data-testid="player-iframe-content"
            />
          </div>
        );
      }
      
      // Create bounded wrapper style if resolution is configured
      const wrapperStyle = displayResolution ? {
        width: `${displayResolution.width}px`,
        height: `${displayResolution.height}px`,
      } : {};
      
      console.log('[Player] Rendering image with resolution:', displayResolution);
      console.log('[Player] Wrapper style:', wrapperStyle);
      
      return (
        <div className="flex items-center justify-center h-screen bg-black">
          <div style={wrapperStyle} className={displayResolution ? "" : "w-full h-full"}>
            <img
              key={currentContent.id}
              src={currentContent.url}
              alt={currentContent.name}
              className="w-full h-full object-contain"
              data-testid="player-image-content"
              onError={(e) => {
                console.error('Failed to load image:', currentContent.url);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      );
    }

    if (currentContent.type === "video") {
      const handleVideoEnded = () => {
        console.log('[Player] Video ended');
        // Only rotate if not in sync mode and there are multiple videos
        if (!syncState.isActive && content.length > 1) {
          console.log('[Player] Rotating to next video');
          setCurrentContentIndex((prev) => (prev + 1) % content.length);
        }
      };

      // Create bounded wrapper style if resolution is configured
      const wrapperStyle = displayResolution ? {
        width: `${displayResolution.width}px`,
        height: `${displayResolution.height}px`,
      } : {};

      return (
        <div className="flex items-center justify-center h-screen bg-black">
          <div style={wrapperStyle} className={displayResolution ? "" : "w-full h-full"}>
            <video
              key={currentContent.id}
              ref={videoRef}
              src={currentContent.url}
              autoPlay={!syncState.isActive || syncState.status === "playing"}
              loop={content.length === 1 && !syncState.isActive}
              muted
              className="w-full h-full object-contain"
              data-testid="player-video-content"
              onError={() => console.error('Failed to load video:', currentContent.url)}
              onEnded={handleVideoEnded}
            />
          </div>
        </div>
      );
    }

    if (currentContent.type === "html" && currentContent.htmlContent) {
      return (
        <div
          className="h-screen overflow-hidden"
          dangerouslySetInnerHTML={{ __html: currentContent.htmlContent }}
          data-testid="player-html-content"
        />
      );
    }
    
    // Support for webpage type - render as iframe
    if (currentContent.type === "webpage" || isExternalUrl) {
      return (
        <div className="h-screen w-screen bg-black">
          <iframe
            key={currentContent.id}
            src={currentContent.url}
            className="w-full h-full border-0"
            title={currentContent.name}
            data-testid="player-iframe-content"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Unsupported content type: {currentContent.type}</p>
      </div>
    );
  };

  // Pairing screen
  if (!isPaired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">EvoFlow Web Player</CardTitle>
            <CardDescription>
              Enter the pairing token from your EvoFlow dashboard to connect this display
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Pairing Token
              </label>
              <Input
                id="token"
                placeholder="Enter token (e.g., ABC123XYZ)"
                value={pairingToken}
                onChange={(e) => setPairingToken(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handlePair()}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={12}
                data-testid="input-pairing-token"
              />
            </div>
            <Button
              onClick={handlePair}
              disabled={isLoading || !pairingToken.trim()}
              className="w-full"
              data-testid="button-pair"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pairing...
                </>
              ) : (
                "Pair Display"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Generate a pairing token from the EvoFlow dashboard Settings page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Player screen with connection status overlay
  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {renderContent()}
      
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm backdrop-blur-sm ${
          isConnected ? "bg-green-500/80" : "bg-red-500/80"
        }`}>
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              Disconnected
            </>
          )}
        </div>
      </div>

      {/* Content counter */}
      {content.length > 1 && (
        <div className="absolute bottom-4 left-4 z-50">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm">
            {currentContentIndex + 1} / {content.length}
          </div>
        </div>
      )}

      {/* Radio stream audio (hidden) */}
      <audio
        ref={radioAudioRef}
        loop
        autoPlay
        muted={false}
        style={{ display: 'none' }}
        data-testid="radio-audio-player"
        onPlay={() => console.log("[Player] Radio audio element started playing")}
        onPause={() => console.log("[Player] Radio audio element paused")}
        onError={(e) => console.error("[Player] Radio audio element error:", e)}
      />

      {/* Reset button (hidden, accessible via double-tap) */}
      <button
        onClick={() => {
          localStorage.removeItem("evoflow_display_id");
          setIsPaired(false);
          setDisplayId("");
          setContent([]);
        }}
        className="absolute top-0 left-0 w-20 h-20 opacity-0"
        data-testid="button-reset-player"
      />
    </div>
  );
}
