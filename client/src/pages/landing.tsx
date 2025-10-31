import { Link } from "wouter";
import { useLanguage } from "@/lib/language-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Monitor,
  FolderOpen,
  Activity,
  Calendar,
  Users,
  BarChart3,
  Building2,
  UserCog,
  Code,
  ScrollText,
} from "lucide-react";

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Monitor,
      title: t('landingFeature1Title'),
      description: t('landingFeature1Desc'),
    },
    {
      icon: FolderOpen,
      title: t('landingFeature2Title'),
      description: t('landingFeature2Desc'),
    },
    {
      icon: Activity,
      title: t('landingFeature3Title'),
      description: t('landingFeature3Desc'),
    },
    {
      icon: Calendar,
      title: t('landingFeature4Title'),
      description: t('landingFeature4Desc'),
    },
    {
      icon: Users,
      title: t('landingFeature5Title'),
      description: t('landingFeature5Desc'),
    },
    {
      icon: BarChart3,
      title: t('landingFeature6Title'),
      description: t('landingFeature6Desc'),
    },
  ];

  const services = [
    {
      icon: Building2,
      title: t('landingService1Title'),
      description: t('landingService1Desc'),
    },
    {
      icon: UserCog,
      title: t('landingService2Title'),
      description: t('landingService2Desc'),
    },
    {
      icon: Code,
      title: t('landingService3Title'),
      description: t('landingService3Desc'),
    },
    {
      icon: ScrollText,
      title: t('landingService4Title'),
      description: t('landingService4Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Activity className="h-6 w-6 text-accent-foreground" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{t('appName')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" asChild data-testid="button-signin">
                <Link href="/login">
                  {t('landingSignIn')}
                </Link>
              </Button>
              <Button asChild data-testid="button-getstarted">
                <Link href="/register">
                  {t('landingGetStarted')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" data-testid="text-hero-title">
              {t('landingHeroTitle')}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl" data-testid="text-hero-subtitle">
              {t('landingHeroSubtitle')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="px-8" asChild data-testid="button-hero-getstarted">
                <Link href="/register">
                  {t('landingGetStarted')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild data-testid="button-hero-learnmore">
                <Link href="#features">
                  {t('landingLearnMore')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-features-title">
              {t('landingFeaturesTitle')}
            </h3>
            <p className="mt-4 text-lg text-muted-foreground" data-testid="text-features-subtitle">
              {t('landingFeaturesSubtitle')}
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="p-6" data-testid={`card-feature-${index}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h4 className="mt-4 text-xl font-semibold">{feature.title}</h4>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-services-title">
              {t('landingServicesTitle')}
            </h3>
            <p className="mt-4 text-lg text-muted-foreground" data-testid="text-services-subtitle">
              {t('landingServicesSubtitle')}
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <Card key={index} className="p-6 text-center" data-testid={`card-service-${index}`}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <service.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">{service.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-cta-title">
              {t('landingCtaTitle')}
            </h3>
            <p className="mt-4 text-lg text-muted-foreground" data-testid="text-cta-subtitle">
              {t('landingCtaSubtitle')}
            </p>
            <div className="mt-10">
              <Button size="lg" className="px-8" asChild data-testid="button-cta-trial">
                <Link href="/register">
                  {t('landingCtaButton')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Activity className="h-6 w-6 text-accent-foreground" />
                </div>
                <h4 className="text-xl font-bold">{t('appName')}</h4>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('landingFooterAboutText')}
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">{t('landingFooterAbout')}</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    {t('landingFeaturesTitle')}
                  </Link>
                </li>
                <li>
                  <Link href="/documentation" className="hover:text-foreground transition-colors">
                    {t('documentation')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">{t('landingGetStarted')}</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    {t('landingSignIn')}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    {t('register')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>Copyright © 2025 Digital Town Srl | P.IVA 03802320139 | REA CO.333859</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
