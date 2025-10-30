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
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

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

  const instructions = {
    chrome: {
      title: "Chrome / Edge (Windows, Android)",
      icon: Chrome,
      steps: [
        t === ((x: string) => x) ? "Visit EvoFlow from Chrome or Edge browser" : "Visita EvoFlow da Chrome o Edge",
        t === ((x: string) => x) ? "Look for the install icon (⊕) in the address bar" : "Cerca l'icona di installazione (⊕) nella barra degli indirizzi",
        t === ((x: string) => x) ? "Click 'Install' and confirm" : "Clicca 'Installa' e conferma",
        t === ((x: string) => x) ? "The app will be added to your desktop/home screen" : "L'app verrà aggiunta al desktop/home screen"
      ]
    },
    safari: {
      title: "Safari (iPhone / iPad)",
      icon: Apple,
      steps: [
        t === ((x: string) => x) ? "Visit EvoFlow from Safari browser" : "Visita EvoFlow da Safari",
        t === ((x: string) => x) ? "Tap the Share button (square with arrow)" : "Tocca il pulsante Condividi (quadrato con freccia)",
        t === ((x: string) => x) ? "Scroll and select 'Add to Home Screen'" : "Scorri e seleziona 'Aggiungi alla schermata Home'",
        t === ((x: string) => x) ? "Confirm - the icon will appear on your home screen" : "Conferma - l'icona apparirà nella home screen"
      ]
    },
    edge: {
      title: "Microsoft Edge (Windows)",
      icon: Globe,
      steps: [
        t === ((x: string) => x) ? "Visit EvoFlow from Edge browser" : "Visita EvoFlow da Edge",
        t === ((x: string) => x) ? "Click menu (⋯) → 'Apps' → 'Install EvoFlow'" : "Clicca menu (⋯) → 'App' → 'Installa EvoFlow'",
        t === ((x: string) => x) ? "Confirm installation" : "Conferma l'installazione",
        t === ((x: string) => x) ? "Access from Start Menu or Desktop" : "Accedi dal Menu Start o Desktop"
      ]
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          {t === ((x: string) => x) ? "Install EvoFlow App" : "Installa l'App EvoFlow"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t === ((x: string) => x) 
            ? "Install EvoFlow as a native app on your device for quick access and offline support"
            : "Installa EvoFlow come app nativa sul tuo dispositivo per accesso rapido e supporto offline"}
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
                  {t === ((x: string) => x) ? "App Already Installed" : "App Già Installata"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t === ((x: string) => x)
                    ? "You're using EvoFlow as an installed app!"
                    : "Stai usando EvoFlow come app installata!"}
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
                  {t === ((x: string) => x) ? "Quick Install Available" : "Installazione Rapida Disponibile"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t === ((x: string) => x)
                    ? "Install EvoFlow with one click for the best experience"
                    : "Installa EvoFlow con un click per la migliore esperienza"}
                </p>
              </div>
              <Button
                onClick={handleInstallClick}
                size="lg"
                data-testid="button-quick-install"
                className="min-h-11 w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {t === ((x: string) => x) ? "Install Now" : "Installa Ora"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t === ((x: string) => x) ? "Installation Instructions" : "Istruzioni di Installazione"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Object.entries(instructions).map(([key, { title, icon: Icon, steps }]) => (
            <Card key={key} className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t === ((x: string) => x) ? "Why Install?" : "Perché Installare?"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t === ((x: string) => x) ? "Quick Access" : "Accesso Rapido"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t === ((x: string) => x)
                  ? "Launch EvoFlow directly from your desktop or home screen like a native app"
                  : "Lancia EvoFlow direttamente dal desktop o home screen come un'app nativa"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t === ((x: string) => x) ? "Offline Support" : "Supporto Offline"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t === ((x: string) => x)
                  ? "Continue working even without an internet connection with smart caching"
                  : "Continua a lavorare anche senza connessione internet con cache intelligente"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t === ((x: string) => x) ? "No App Store" : "Nessun App Store"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t === ((x: string) => x)
                  ? "Install directly from your browser - no external downloads required"
                  : "Installa direttamente dal browser - nessun download esterno richiesto"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Chrome className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {t === ((x: string) => x) ? "Auto Updates" : "Aggiornamenti Automatici"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t === ((x: string) => x)
                  ? "Always get the latest features automatically without manual updates"
                  : "Ricevi sempre le ultime funzionalità automaticamente senza aggiornamenti manuali"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isInstalled && !deferredPrompt && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              {t === ((x: string) => x)
                ? "Note: The install button will appear automatically when you visit EvoFlow from a supported browser. Follow the instructions above for your specific platform."
                : "Nota: Il pulsante di installazione apparirà automaticamente quando visiti EvoFlow da un browser supportato. Segui le istruzioni sopra per la tua piattaforma specifica."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
