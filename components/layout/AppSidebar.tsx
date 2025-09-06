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
    <Sidebar variant="inset" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg">
            <Image
              src="/logo.png"
              alt="Meffin Logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{t('app_name')}</span>
              <span className="text-xs text-muted-foreground/60 font-mono">v{APP_VERSION}</span>
            </div>
            <span className="text-xs text-muted-foreground">{t('app_tagline')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors py-2 ${
                      isActive(item.url) 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <div className="px-3 py-3">
          <SidebarMenu className="space-y-1">
            {session && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors py-2">
                    <Link href={`/${locale}/profile`} className="flex items-center gap-3 px-3">
                      <User className="h-4 w-4" />
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
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full rounded-lg transition-colors py-2"
                  >
                    <div className="flex items-center gap-3 px-3">
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">{t('nav_signOut')}</span>
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