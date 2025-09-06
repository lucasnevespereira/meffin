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
    <Sidebar variant="inset" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shadow-sm border border-border/60">
            <Image
              src="/logo.png"
              alt="Meffin Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">{t('app_name')}</span>
            <span className="text-xs text-sidebar-foreground/60 font-medium">{t('app_tagline')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground rounded-xl transition-all duration-200 py-3 ${
                      isActive(item.url) 
                        ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium shadow-sm' 
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50">
        <div className="px-3 py-4">
          <SidebarMenu className="space-y-2">
            {session && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground rounded-xl transition-all duration-200 py-3">
                    <Link href={`/${locale}/profile`} className="flex items-center gap-3 px-3">
                      <User className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sidebar-foreground">{t('nav_profile')}</span>
                        <span className="text-xs text-sidebar-foreground/60">{session.user.email}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleSignOut}
                    className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 w-full rounded-xl transition-all duration-200 py-3"
                  >
                    <div className="flex items-center gap-3 px-3">
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">{t('nav_signOut')}</span>
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