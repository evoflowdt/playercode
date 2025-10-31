import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Monitor, Info, CheckCircle2, AlertCircle, Terminal, Laptop, Apple, SquareTerminal, ExternalLink } from "lucide-react";
import { SiLinux, SiApple } from "react-icons/si";
import { useLanguage } from "@/lib/language-provider";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface PlayerRelease {
  id: string;
  version: string;
  platform: string;
  releaseDate: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number | null;
  isLatest: boolean;
}

export default function Downloads() {
  const { t } = useLanguage();
  
  // Fetch latest releases for each platform
  const { data: releases } = useQuery<PlayerRelease[]>({
    queryKey: ['/api/player/releases?latest=true'],
  });
  
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <Download className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
          {t('downloadsTitle')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          {t('downloadsSubtitle')}
        </p>
      </div>

      {/* Source Code Download - Always visible */}
      <Card className="mb-6 border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="h-5 w-5" />
            Download Source Code
          </CardTitle>
          <CardDescription className="text-sm">
            Get the EvoFlow Player source code to build it yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base">Clone with Git</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="block bg-muted p-2 sm:p-3 rounded text-xs sm:text-sm mb-3 overflow-x-auto break-all">
                    git clone https://github.com/evoflowdt/playercode.git
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Recommended for developers. Allows easy updates with git pull.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base">Download ZIP</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full mb-3" data-testid="button-download-source">
                    <a href="https://codeload.github.com/evoflowdt/playercode/zip/refs/heads/main" download>
                      <Download className="h-4 w-4 mr-2" />
                      Download ZIP
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Quick download without Git required.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>What's Next?</AlertTitle>
              <AlertDescription>
                After downloading, follow the build instructions below for your operating system.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Pre-compiled Releases - Only if available */}
      {releases && releases.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Download className="h-5 w-5" />
              Pre-compiled Installers
            </CardTitle>
            <CardDescription className="text-sm">
              Ready-to-install packages (no build required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {releases.map(release => (
                <Card key={release.id} className="border-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                      <span>{t(release.platform as any)}</span>
                      <Badge className="ml-auto">{t('latestVersion')}</Badge>
                    </CardTitle>
                    <CardDescription>{release.version}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="default" data-testid={`button-download-${release.platform}`}>
                      <a href={release.downloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        {t('downloadNow')}
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {release.fileName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>{t('buildRequired')}</AlertTitle>
        <AlertDescription>
          {t('buildRequiredDesc')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm">
            <Monitor className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="windows" data-testid="tab-windows" className="text-xs sm:text-sm">
            <SquareTerminal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('windows')}</span>
          </TabsTrigger>
          <TabsTrigger value="macos" data-testid="tab-macos" className="text-xs sm:text-sm">
            <SiApple className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('macos')}</span>
          </TabsTrigger>
          <TabsTrigger value="linux" data-testid="tab-linux" className="text-xs sm:text-sm">
            <SiLinux className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('linux')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Laptop className="h-5 w-5" />
                {t('desktopPlayer')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('desktopPlayerDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  {t('featuresTitle')}
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('featureKiosk')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('featureAutoLaunch')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('featureOffline')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('featureTray')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('featureHardware')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  {t('requirementsTitle')}
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <li>• {t('requirementNode')}</li>
                  <li>• Internet connection for initial pairing</li>
                  <li>• ~200MB disk space for the application</li>
                  <li>• Windows 10/11, macOS 10.13+, or modern Linux distribution</li>
                </ul>
              </div>

              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>For Developers</AlertTitle>
                <AlertDescription>
                  See <code className="bg-muted px-1.5 py-0.5 rounded">README-ELECTRON.md</code> for complete technical documentation,
                  build scripts, and advanced configuration options.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="windows" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <SquareTerminal className="h-5 w-5" />
                {t('windowsInstallation')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('windowsInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">{t('prereqInstallNode')}</strong>
                    <p className="mt-1 text-sm">{t('prereqInstallNodeDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqCloneProject')}</strong>
                    <p className="mt-1 text-sm">{t('prereqCloneProjectDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqOpenPowershell')}</strong>
                    <p className="mt-1 text-sm">{t('prereqOpenPowershellDetail')}</p>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('buildSteps')}</h3>
                <ol className="list-decimal pl-4 sm:pl-5 space-y-4 text-sm sm:text-base">
                  <li>
                    <strong className="text-foreground">{t('stepNavigate')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepNavigateDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      cd C:\path\to\evoflow
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepInstallDeps')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepInstallDepsDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 space-y-1 overflow-x-auto">
                      <div>npm install</div>
                      <div>npm install --save-dev wait-on</div>
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepTestDev')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepTestDevDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:dev
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepBuildProd')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepBuildProdDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:build:win
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('findOutputFiles')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3">{t('findOutputFilesDetail')}</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/EvoFlow-Setup-1.0.0.exe</code> - {t('nsisInstaller')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/EvoFlow-1.0.0-win.zip</code> - {t('portableVersion')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('playerInstallInstructions')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{t('installInstructionsWin')}</p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('codeSigning')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Apple className="h-5 w-5" />
                {t('macosInstallation')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('macosInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-4 sm:pl-5 space-y-4 text-sm sm:text-base text-muted-foreground">
                  <li>
                    <strong className="text-foreground">{t('prereqInstallNode')}</strong>
                    <p className="mt-1 text-sm">{t('prereqInstallNodeDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqXcode')}</strong>
                    <p className="mt-1 text-sm">{t('prereqXcodeDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      xcode-select --install
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqCloneMac')}</strong>
                    <p className="mt-1 text-sm">{t('prereqCloneMacDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqOpenTerminal')}</strong>
                    <p className="mt-1 text-sm">{t('prereqOpenTerminalDetail')}</p>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('buildSteps')}</h3>
                <ol className="list-decimal pl-4 sm:pl-5 space-y-4 text-sm sm:text-base">
                  <li>
                    <strong className="text-foreground">{t('stepNavigate')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepNavigateDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      cd /path/to/evoflow
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepInstallDeps')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepInstallDepsDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 space-y-1 overflow-x-auto">
                      <div>npm install</div>
                      <div>npm install --save-dev wait-on</div>
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepTestDev')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepTestDevDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:dev
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepBuildProd')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepBuildProdDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:build:mac
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('findOutputFiles')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3">{t('findOutputFilesDetail')}</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/EvoFlow Player-1.0.0.dmg</code> - DMG installer (recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/EvoFlow Player-1.0.0-mac.zip</code> - ZIP archive</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  {t('supportsArchitecture')}
                </p>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('playerInstallInstructions')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{t('installInstructionsMac')}</p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('notarization')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linux" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <SiLinux className="h-5 w-5" />
                {t('linuxInstallation')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('linuxInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-4 sm:pl-5 space-y-4 text-sm sm:text-base text-muted-foreground">
                  <li>
                    <strong className="text-foreground">{t('prereqInstallNode')}</strong>
                    <p className="mt-1 text-sm">{t('prereqInstallNodeDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqNodeLinux')}</strong>
                    <p className="mt-1 text-sm">{t('prereqNodeLinuxDetail')}</p>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('prereqBuildDeps')}</strong>
                    <p className="mt-1 text-sm">{t('prereqBuildDepsDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      sudo apt-get install -y libgtk-3-dev libnotify-dev \<br />
                      &nbsp;&nbsp;libgconf-2-4 libnss3 libxss1 libasound2
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('buildSteps')}</h3>
                <ol className="list-decimal pl-4 sm:pl-5 space-y-4 text-sm sm:text-base">
                  <li>
                    <strong className="text-foreground">{t('stepNavigate')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepNavigateDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      cd /path/to/evoflow
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepInstallDeps')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepInstallDepsDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 space-y-1 overflow-x-auto">
                      <div>npm install</div>
                      <div>npm install --save-dev wait-on</div>
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepTestDev')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepTestDevDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:dev
                    </div>
                  </li>
                  <li>
                    <strong className="text-foreground">{t('stepBuildProd')}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{t('stepBuildProdDetail')}</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm mt-2 overflow-x-auto">
                      npm run electron:build:linux
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('findOutputFiles')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3">{t('findOutputFilesDetail')}</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/EvoFlow-Player-1.0.0.AppImage</code> - {t('universalLinux')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/evoflow-player_1.0.0_amd64.deb</code> - {t('debianPackage')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/evoflow-player-1.0.0.x86_64.rpm</code> - {t('rpmPackage')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{t('playerInstallInstructions')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{t('installInstructionsLinux')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t('additionalResources')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-2">{t('documentationResources')}</h4>
            <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
              <li className="break-all">
                • <code className="bg-muted px-1.5 py-0.5 rounded text-xs">README-ELECTRON.md</code> - {t('readmeElectron')}
              </li>
              <li className="break-all">
                • <code className="bg-muted px-1.5 py-0.5 rounded text-xs">electron-builder.json</code> - {t('builderConfig')}
              </li>
              <li className="break-all">
                • <code className="bg-muted px-1.5 py-0.5 rounded text-xs">electron/main.js</code> - {t('mainProcess')}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-2">{t('support')}</h4>
            <p className="text-sm sm:text-base text-muted-foreground">
              For issues, questions, or feature requests, please refer to the README-ELECTRON.md file or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
