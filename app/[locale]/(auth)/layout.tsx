import { DollarSign } from 'lucide-react';
import Image from 'next/image';
import { getI18n } from '@/locales/server';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params to fix Next.js warning
  await params;
  const t = await getI18n();
  
  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Locale Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LocaleSwitcher variant="outline" showText />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="text-center text-primary-foreground space-y-8">
          <div className="flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-3xl shadow-2xl mx-auto">
            <Image
              src="/logo.png"
              alt="Meffin Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold">{t('app_name')}</h1>
            <p className="text-xl text-primary-foreground/90">{t('app_tagline')}</p>
            <p className="text-primary-foreground/80 max-w-md mx-auto leading-relaxed">
              {t('app_description')}
            </p>
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm border border-white/20">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="font-medium">Sécurisé et fiable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo - Only visible on smaller screens */}
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg">
              <Image
                src="/logo.png"
                alt="Meffin Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{t('app_name')}</h1>
              <p className="text-sm text-muted-foreground">{t('app_tagline')}</p>
            </div>
          </div>
          
          {/* Auth Form */}
          {children}
        </div>
      </div>
    </div>
  );
}