import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Monitor } from "lucide-react";
import { useLanguage } from "@/lib/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    organizationName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('passwordsDontMatchTitle'),
        description: t('passwordsDontMatchMessage'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: t('passwordTooShortTitle'),
        description: t('passwordTooShortMessage'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName,
      });
      toast({
        title: t('registrationSuccessTitle'),
        description: t('registrationSuccessMessage'),
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: t('registrationFailedTitle'),
        description: error.message || t('registrationFailedMessage'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="fixed top-4 right-4 flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">EvoFlow</span>
            </div>
          </div>
          <CardTitle data-testid="text-register-title">{t('registerTitle')}</CardTitle>
          <CardDescription data-testid="text-register-description">
            {t('registerDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={t('firstNamePlaceholder')}
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  data-testid="input-firstName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={t('lastNamePlaceholder')}
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  data-testid="input-lastName"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">{t('organizationNameLabel')}</Label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                placeholder={t('organizationNamePlaceholder')}
                value={formData.organizationName}
                onChange={handleChange}
                required
                disabled={isLoading}
                data-testid="input-organizationName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                data-testid="input-confirmPassword"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? t('creatingAccountButton') : t('createAccountButton')}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('alreadyHaveAccount')} </span>
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline font-medium"
              data-testid="link-login"
            >
              {t('signIn')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
