'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import React from 'react';
import { usePathname } from 'next/navigation';
import { useCurrentLocale, useI18n } from '@/locales/client';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function DashboardHeader() {
  const pathname = usePathname();
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = currentLocale === 'fr' ? 'fr' : 'en';

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const route = segments.find((segment) =>
      ['dashboard', 'transactions', 'categories', 'profile', 'trends', 'lists'].includes(segment)
    ) || 'dashboard';

    const breadcrumbs = [
      { name: t('app_name'), href: `/${locale}` },
    ];

    switch (route) {
      case 'dashboard':
        breadcrumbs.push({ name: t('nav_dashboard'), href: `/${locale}/dashboard` });
        break;
      case 'transactions':
        breadcrumbs.push({ name: t('nav_transactions'), href: `/${locale}/transactions` });
        break;
      case 'categories':
        breadcrumbs.push({ name: t('nav_categories'), href: `/${locale}/categories` });
        break;
      case 'profile':
        breadcrumbs.push({ name: t('nav_profile'), href: `/${locale}/profile` });
        break;
      case 'trends':
        breadcrumbs.push({ name: t('nav_trends'), href: `/${locale}/trends` });
        break;
      case 'lists':
        breadcrumbs.push({ name: t('nav_lists'), href: `/${locale}/lists` });
        break;
      default:
        breadcrumbs.push({ name: route.charAt(0).toUpperCase() + route.slice(1), href: pathname });
        break;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border/40">
      <div className="flex items-center gap-3 px-6">
        <SidebarTrigger className="-ml-1 hover:bg-accent/50 rounded-lg transition-colors duration-200" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-border/60" />

        {/* Mobile: Just show "Meffin" */}
        <div className="block md:hidden">
          <span className="text-foreground font-bold text-lg">
            {t('app_name')}
          </span>
        </div>

        {/* Desktop: Show full breadcrumbs */}
        <div className="hidden md:block">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.href}>
                  <BreadcrumbItem>
                    {index < breadcrumbs.length - 1 ? (
                      <BreadcrumbLink
                        href={breadcrumb.href}
                        className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200"
                      >
                        {breadcrumb.name}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-foreground font-semibold">
                        {breadcrumb.name}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator className="text-muted-foreground/60" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6">
        <div className="hidden select-none items-center gap-2 text-muted-foreground md:flex">
          <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">
            {new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <ThemeSwitcher />
        <LocaleSwitcher showText />
      </div>
    </header>
  );
}
