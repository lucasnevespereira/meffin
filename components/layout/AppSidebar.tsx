'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  User, 
  LogOut,
  TrendingUp
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { signOut, useSession } from '@/lib/auth-client';
import { useI18n } from '@/locales/client';

const APP_VERSION = '0.1.0';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useI18n();
  const { data: session } = useSession();

  const items = [
    {
      title: t('nav_dashboard'),
      url: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: t('nav_transactions'),
      url: `/${locale}/transactions`,
      icon: Receipt,
    },
    {
      title: t('nav_categories'),
      url: `/${locale}/categories`,
      icon: Tag,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/login`);
  };

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  return (
    <Sidebar variant="inset" className="border-r border-border shadow-subtle">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-4 px-6 py-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-card">
            <Image
              src="/logo.png"
              alt="Meffin Logo"
              width={24}
              height={24}
              className="w-6 h-6 brightness-0 invert"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight">{t('app_name')}</span>
              <span className="text-xs text-muted-foreground font-mono px-1.5 py-0.5 bg-muted rounded-md">
                v{APP_VERSION}
              </span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">{t('app_tagline')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`rounded-lg transition-all duration-200 ease-in-out touch-manipulation group ${
                      isActive(item.url) 
                        ? 'bg-primary text-primary-foreground font-medium shadow-card' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-subtle'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                        isActive(item.url) ? 'text-primary-foreground' : ''
                      }`} />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="px-4 py-4">
          <SidebarMenu className="space-y-2">
            {session && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 touch-manipulation group"
                  >
                    <Link href={`/${locale}/profile`} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium truncate">{t('nav_profile')}</span>
                        <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleSignOut}
                    className="text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 w-full rounded-lg transition-all duration-200 touch-manipulation group"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">{t('nav_signOut')}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}