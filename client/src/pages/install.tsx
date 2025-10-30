import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Smartphone, Monitor, Apple, Chrome, Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-provider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('✓ beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    console.log('Install page loaded, waiting for beforeinstallprompt...');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const instructions = [
    {
      titleKey: 'chromeEdgeTitle' as const,
      icon: Chrome,
      stepKeys: ['chromeStep1', 'chromeStep2', 'chromeStep3', 'chromeStep4'] as const
    },
    {
      titleKey: 'safariTitle' as const,
      icon: Apple,
      stepKeys: ['safariStep1', 'safariStep2', 'safariStep3', 'safariStep4'] as const
    },
    {
      titleKey: 'edgeTitle' as const,
      icon: Globe,
      stepKeys: ['edgeStep1', 'edgeStep2', 'edgeStep3', 'edgeStep4'] as const
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          {t('installTitle')}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t('installSubtitle')}
        </p>
      </div>

      {isInstalled ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('appAlreadyInstalled')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('appAlreadyInstalledDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : deferredPrompt ? (
        <Card className="border-primary/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('quickInstallAvailable')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('quickInstallDesc')}
                </p>
              </div>
              <Button 
                onClick={handleInstallClick}
                className="w-full sm:w-auto flex items-center justify-center"
                size="default"
                data-testid="button-install-app"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('installNow')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t('installInstructions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {instructions.map((instruction, idx) => {
            const Icon = instruction.icon;
            return (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{t(instruction.titleKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    {instruction.stepKeys.map((stepKey, stepIdx) => (
                      <li key={stepIdx} className="flex gap-2">
                        <span className="font-semibold text-primary flex-shrink-0">
                          {stepIdx + 1}.
                        </span>
                        <span className="text-muted-foreground">{t(stepKey)}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t('whyInstall')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t('quickAccess')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('quickAccessDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t('offlineSupport')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('offlineSupportDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t('noAppStore')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('noAppStoreDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Chrome className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t('autoUpdates')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('autoUpdatesDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            {t('installNote')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
