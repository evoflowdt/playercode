import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Info, CheckCircle2, AlertCircle, Terminal, Laptop, Apple, SquareTerminal } from "lucide-react";
import { SiLinux, SiApple } from "react-icons/si";
import { useLanguage } from "@/lib/language-provider";

export default function Downloads() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Download className="h-10 w-10" />
          {t('downloadsTitle')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('downloadsSubtitle')}
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>{t('buildRequired')}</AlertTitle>
        <AlertDescription>
          {t('buildRequiredDesc')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Monitor className="h-4 w-4 mr-2" />
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="windows" data-testid="tab-windows">
            <SquareTerminal className="h-4 w-4 mr-2" />
            {t('windows')}
          </TabsTrigger>
          <TabsTrigger value="macos" data-testid="tab-macos">
            <SiApple className="h-4 w-4 mr-2" />
            {t('macos')}
          </TabsTrigger>
          <TabsTrigger value="linux" data-testid="tab-linux">
            <SiLinux className="h-4 w-4 mr-2" />
            {t('linux')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                {t('desktopPlayer')}
              </CardTitle>
              <CardDescription>
                {t('desktopPlayerDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {t('featuresTitle')}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
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
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  {t('requirementsTitle')}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
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
              <CardTitle className="flex items-center gap-2">
                <SquareTerminal className="h-5 w-5" />
                {t('windowsInstallation')}
              </CardTitle>
              <CardDescription>
                {t('windowsInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>{t('prereqInstallNode')}</li>
                  <li>{t('prereqCloneProject')}</li>
                  <li>{t('prereqOpenPowershell')}</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('buildSteps')}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
                  <div className="text-muted-foreground"># {t('stepNavigate')}</div>
                  <div>cd path\to\evoflow</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepInstallDeps')}</div>
                  <div>npm install</div>
                  <div>npm install --save-dev wait-on</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepTestDev')}</div>
                  <div>npm run electron:dev</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepBuildProd')}</div>
                  <div>npm run electron:build:win</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('outputFiles')}</h3>
                <p className="text-muted-foreground mb-3">{t('outputFilesDesc')}</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('nsisInstaller')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('portableVersion')}</span>
                  </li>
                </ul>
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
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                {t('macosInstallation')}
              </CardTitle>
              <CardDescription>
                {t('macosInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>{t('prereqInstallNode')}</li>
                  <li>{t('prereqXcode')}</li>
                  <li>{t('prereqCloneMac')}</li>
                  <li>{t('prereqOpenTerminal')}</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('buildSteps')}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
                  <div className="text-muted-foreground"># {t('stepNavigate')}</div>
                  <div>cd /path/to/evoflow</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepInstallDeps')}</div>
                  <div>npm install</div>
                  <div>npm install --save-dev wait-on</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepTestDev')}</div>
                  <div>npm run electron:dev</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepBuildProd')}</div>
                  <div>npm run electron:build:mac</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('outputFiles')}</h3>
                <p className="text-muted-foreground mb-3">{t('outputFilesDesc')}</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>EvoFlow Player-x.x.x.dmg</strong> - DMG installer (recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>EvoFlow Player-x.x.x-mac.zip</strong> - ZIP archive</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  {t('supportsArchitecture')}
                </p>
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
              <CardTitle className="flex items-center gap-2">
                <SiLinux className="h-5 w-5" />
                {t('linuxInstallation')}
              </CardTitle>
              <CardDescription>
                {t('linuxInstallDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('prerequisites')}</h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>{t('prereqNodeLinux')}</li>
                  <li>{t('prereqBuildDeps')}</li>
                </ol>
                <div className="bg-muted p-4 rounded-md font-mono text-sm mt-2">
                  sudo apt-get install -y libgtk-3-dev libnotify-dev \<br />
                  &nbsp;&nbsp;libgconf-2-4 libnss3 libxss1 libasound2
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('buildSteps')}</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
                  <div className="text-muted-foreground"># {t('stepNavigate')}</div>
                  <div>cd /path/to/evoflow</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepInstallDeps')}</div>
                  <div>npm install</div>
                  <div>npm install --save-dev wait-on</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepTestDev')}</div>
                  <div>npm run electron:dev</div>
                  <br />
                  <div className="text-muted-foreground"># {t('stepBuildProd')}</div>
                  <div>npm run electron:build:linux</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('outputFiles')}</h3>
                <p className="text-muted-foreground mb-3">{t('outputFilesDesc')}</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('universalLinux')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('debianPackage')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('rpmPackage')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('installation')}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">AppImage (Universal):</p>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-1">
                      <div>{t('appImageInstall').split('\n')[0]}</div>
                      <div>{t('appImageInstall').split('\n')[1]}</div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Debian/Ubuntu (.deb):</p>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                      {t('debInstall')}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Fedora/RedHat (.rpm):</p>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                      {t('rpmInstall')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('additionalResources')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('documentationResources')}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • <code className="bg-muted px-1.5 py-0.5 rounded">README-ELECTRON.md</code> - {t('readmeElectron')}
              </li>
              <li>
                • <code className="bg-muted px-1.5 py-0.5 rounded">electron-builder.json</code> - {t('builderConfig')}
              </li>
              <li>
                • <code className="bg-muted px-1.5 py-0.5 rounded">electron/main.js</code> - {t('mainProcess')}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('support')}</h4>
            <p className="text-muted-foreground">
              For issues, questions, or feature requests, please refer to the README-ELECTRON.md file or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
