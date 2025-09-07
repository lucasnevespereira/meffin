import Image from 'next/image';
import { getI18n } from '@/locales/server';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { Github } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-50 flex items-center gap-2">
        <ThemeSwitcher />
        <LocaleSwitcher variant="outline" showText />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-16 bg-muted/30">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-background border border-border rounded-lg mx-auto">
            <Image
              src="/logo.png"
              alt="Meffin Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">{t('app_name')}</h1>
            <p className="text-lg text-muted-foreground">{t('app_tagline')}</p>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-sm">
              {t('app_description')}
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="https://github.com/lucasnevespereira/meffin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Github className="h-4 w-4" />
              <span>Open Source on GitHub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-16 lg:py-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo - Only visible on smaller screens */}
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-background border border-border rounded-lg">
              <Image
                src="/logo.png"
                alt="Meffin Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-xl font-semibold">{t('app_name')}</h1>
              <p className="text-sm text-muted-foreground">{t('app_tagline')}</p>
            </div>
          </div>

          {/* Auth Form */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
