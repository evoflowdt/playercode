import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/lib/language-provider";
import { BookOpen, Rocket, Layers, Code } from "lucide-react";

export default function Documentation() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('documentation')}</h1>
        <p className="text-muted-foreground text-lg">
          {t('documentationSubtitle')}
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started" data-testid="tab-getting-started">
            <Rocket className="h-4 w-4 mr-2" />
            {t('gettingStarted')}
          </TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features">
            <Layers className="h-4 w-4 mr-2" />
            {t('features')}
          </TabsTrigger>
          <TabsTrigger value="tutorials" data-testid="tab-tutorials">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('tutorials')}
          </TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">
            <Code className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
        </TabsList>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                {t('gettingStarted')}
              </CardTitle>
              <CardDescription>{t('gettingStartedDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="overview">
                  <AccordionTrigger>{t('platformOverview')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('platformOverviewContent')}</p>
                    <h4 className="font-semibold mt-4">{t('keyCapabilities')}</h4>
                    <ul>
                      <li>{t('capabilityDisplayManagement')}</li>
                      <li>{t('capabilityContentLibrary')}</li>
                      <li>{t('capabilityScheduling')}</li>
                      <li>{t('capabilityPlaylists')}</li>
                      <li>{t('capabilityGroups')}</li>
                      <li>{t('capabilityAnalytics')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="first-display">
                  <AccordionTrigger>{t('addingFirstDisplay')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>{t('stepOpenPlayer')}</li>
                      <li>{t('stepEnterHashCode')}</li>
                      <li>{t('stepFillDetails')}</li>
                      <li>{t('stepVerifyDashboard')}</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="upload-content">
                  <AccordionTrigger>{t('uploadingContent')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>{t('stepGoContent')}</li>
                      <li>{t('stepClickUpload')}</li>
                      <li>{t('stepDragDrop')}</li>
                      <li>{t('stepWaitProcessing')}</li>
                    </ol>
                    <p className="mt-4 text-sm text-muted-foreground">{t('supportedFormats')}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {t('platformFeatures')}
              </CardTitle>
              <CardDescription>{t('platformFeaturesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="displays">
                  <AccordionTrigger>{t('displayManagement')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('displayManagementDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('realtimeMonitoring')}:</strong> {t('realtimeMonitoringDesc')}</li>
                      <li><strong>{t('platformSupport')}:</strong> {t('platformSupportDesc')}</li>
                      <li><strong>{t('geolocation')}:</strong> {t('geolocationDesc')}</li>
                      <li><strong>{t('hashCodePairing')}:</strong> {t('hashCodePairingDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="content">
                  <AccordionTrigger>{t('contentLibrary')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('contentLibraryDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('cloudStorage')}:</strong> {t('cloudStorageDesc')}</li>
                      <li><strong>{t('dragDropUpload')}:</strong> {t('dragDropUploadDesc')}</li>
                      <li><strong>{t('thumbnails')}:</strong> {t('thumbnailsDesc')}</li>
                      <li><strong>{t('searchFilter')}:</strong> {t('searchFilterDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scheduling">
                  <AccordionTrigger>{t('scheduling')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('schedulingDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('timeBasedScheduling')}:</strong> {t('timeBasedSchedulingDesc')}</li>
                      <li><strong>{t('recurringSchedules')}:</strong> {t('recurringSchedulesDesc')}</li>
                      <li><strong>{t('targetTypes')}:</strong> {t('targetTypesDesc')}</li>
                      <li><strong>{t('playlistScheduling')}:</strong> {t('playlistSchedulingDesc')}</li>
                      <li><strong>{t('priorities')}:</strong> {t('prioritiesDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="playlists">
                  <AccordionTrigger>{t('playlists')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('playlistsDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('sequentialPlayback')}:</strong> {t('sequentialPlaybackDesc')}</li>
                      <li><strong>{t('customDuration')}:</strong> {t('customDurationDesc')}</li>
                      <li><strong>{t('reordering')}:</strong> {t('reorderingDesc')}</li>
                      <li><strong>{t('scheduleIntegration')}:</strong> {t('scheduleIntegrationDesc')}</li>
                      <li><strong>{t('radioStreamFeature')}:</strong> {t('radioStreamFeatureDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="groups">
                  <AccordionTrigger>{t('displayGroups')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('displayGroupsDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('bulkManagement')}:</strong> {t('bulkManagementDesc')}</li>
                      <li><strong>{t('groupScheduling')}:</strong> {t('groupSchedulingDesc')}</li>
                      <li><strong>{t('organization')}:</strong> {t('organizationDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sync-groups">
                  <AccordionTrigger>{t('multiMonitorSync')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('multiMonitorSyncDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('features')}</h4>
                    <ul>
                      <li><strong>{t('syncFeatureRealtime')}:</strong> {t('syncFeatureRealtimeDesc')}</li>
                      <li><strong>{t('syncFeaturePlayback')}:</strong> {t('syncFeaturePlaybackDesc')}</li>
                      <li><strong>{t('syncFeatureControl')}:</strong> {t('syncFeatureControlDesc')}</li>
                      <li><strong>{t('syncFeatureSessions')}:</strong> {t('syncFeatureSessionsDesc')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analytics">
                  <AccordionTrigger>{t('analytics')}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('analyticsDesc')}</p>
                    <h4 className="font-semibold mt-4">{t('metrics')}</h4>
                    <ul>
                      <li>{t('metricDisplayStatus')}</li>
                      <li>{t('metricPlatformDistribution')}</li>
                      <li>{t('metricContentTypes')}</li>
                      <li>{t('metricSystemMetrics')}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('createFirstSchedule')}</CardTitle>
              <CardDescription>{t('createFirstScheduleDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>{t('tutorialUploadContent')}:</strong> {t('tutorialUploadContentDesc')}
                </li>
                <li>
                  <strong>{t('navigateScheduling')}:</strong> {t('tutorialNavigateSchedulingDesc')}
                </li>
                <li>
                  <strong>{t('tutorialCreateSchedule')}:</strong> {t('tutorialCreateScheduleDesc')}
                </li>
                <li>
                  <strong>{t('verifyPlayback')}:</strong> {t('tutorialVerifyPlaybackDesc')}
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('tutorialPlaylistSchedule')}</CardTitle>
              <CardDescription>{t('tutorialPlaylistScheduleDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>{t('tutorialCreatePlaylist')}:</strong> {t('tutorialCreatePlaylistDesc')}
                </li>
                <li>
                  <strong>{t('addVideos')}:</strong> {t('tutorialAddVideosDesc')}
                </li>
                <li>
                  <strong>{t('schedulePlaylist')}:</strong> {t('tutorialSchedulePlaylistDesc')}
                </li>
                <li>
                  <strong>{t('customizeDurations')}:</strong> {t('tutorialCustomizeDurationsDesc')}
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('managingGroups')}</CardTitle>
              <CardDescription>{t('managingGroupsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>{t('tutorialCreateGroup')}:</strong> {t('tutorialCreateGroupDesc')}
                </li>
                <li>
                  <strong>{t('assignDisplays')}:</strong> {t('tutorialAssignDisplaysDesc')}
                </li>
                <li>
                  <strong>{t('bulkSchedule')}:</strong> {t('tutorialBulkScheduleDesc')}
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('tutorialSyncGroups')}</CardTitle>
              <CardDescription>{t('tutorialSyncGroupsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>{t('tutorialNavigateSyncGroups')}:</strong> {t('tutorialNavigateSyncGroupsDesc')}
                </li>
                <li>
                  <strong>{t('tutorialCreateSyncGroup')}:</strong> {t('tutorialCreateSyncGroupDesc')}
                </li>
                <li>
                  <strong>{t('tutorialAddDisplays')}:</strong> {t('tutorialAddDisplaysDesc')}
                </li>
                <li>
                  <strong>{t('tutorialStartSync')}:</strong> {t('tutorialStartSyncDesc')}
                </li>
                <li>
                  <strong>{t('tutorialControlSync')}:</strong> {t('tutorialControlSyncDesc')}
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Player API Reference
              </CardTitle>
              <CardDescription>{t('apiReferenceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pairing">
                  <AccordionTrigger>POST /api/player/verify-hash</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiVerifyHashDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "hashCode": "ABC123"
}`}
                    </pre>
                    <h4 className="font-semibold mt-4">Response:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "valid": true,
  "sessionId": "uuid"
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="register">
                  <AccordionTrigger>POST /api/player/register</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiRegisterDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "sessionId": "uuid",
  "name": "Display Name",
  "location": "Store Front",
  "platform": "webos",
  "latitude": 45.4642,
  "longitude": 9.1900
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="heartbeat">
                  <AccordionTrigger>POST /api/player/heartbeat</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiHeartbeatDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "displayId": "uuid"
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="content">
                  <AccordionTrigger>GET /api/player/content/:displayId</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiContentDesc')}</p>
                    <h4 className="font-semibold mt-4">Response:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "display": { /* display object */ },
  "content": [
    {
      "id": "uuid",
      "name": "video.mp4",
      "type": "video",
      "url": "/public-objects/...",
      "duration": 30
    }
  ],
  "schedules": [ /* active schedules */ ]
}`}
                    </pre>
                    <p className="text-sm text-muted-foreground mt-4">
                      {t('apiContentNote')}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sync-create">
                  <AccordionTrigger>POST /api/sync-groups</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiSyncCreateDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "name": "Video Wall A",
  "description": "Main lobby video wall",
  "active": true
}`}
                    </pre>
                    <h4 className="font-semibold mt-4">Response:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "id": "uuid",
  "name": "Video Wall A",
  "description": "Main lobby video wall",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "memberCount": 0
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sync-members">
                  <AccordionTrigger>POST /api/sync-groups/:id/members</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiSyncMembersDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "displayId": "display-uuid"
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sync-control">
                  <AccordionTrigger>POST /api/sync-control/:id/play</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none">
                    <p>{t('apiSyncControlDesc')}</p>
                    <h4 className="font-semibold mt-4">Request Body:</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "contentId": "content-uuid",  // For single content
  "playlistId": "playlist-uuid" // Or for playlist
}`}
                    </pre>
                    <p className="text-sm text-muted-foreground mt-4">
                      {t('apiSyncControlNote')}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
