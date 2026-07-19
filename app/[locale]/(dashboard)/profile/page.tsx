'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trash2, Save, AlertTriangle, ChevronRight, Tag, TrendingUp, Languages, Moon, Coins } from 'lucide-react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { UserAvatar } from '@/components/shared/UserAvatar';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSession, signOut } from '@/lib/auth-client';
import { useI18n } from '@/locales/client';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { usePartnerInfo, usePartnerInvitations, useSentPartnerInvitations, useRefreshPartnerInfo } from '@/hooks/usePartner';
import PartnerManagement from '@/components/partner-management';
import PartnerInvitationCard from '@/components/partner-invitation-card';
import SentInvitationCard from '@/components/sent-invitation-card';
import { toast } from 'sonner';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-utils';


const createProfileSchema = (t: ReturnType<typeof useI18n>) =>
  z.object({
    name: z.string().min(2, t('validation_nameMinLength')),
    email: z.email(t('validation_emailInvalid')),
    currency: z.string().min(1, t('validation_categoryRequired')),
  });

type ProfileFormData = {
  name: string;
  email: string;
  currency: string;
};

// Small uppercase section label, mirroring the mobile "You" screen grouping.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{children}</h2>;
}

// Rounded panel that groups setting rows, mobile-style.
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">{children}</div>;
}

const rowTints: Record<string, string> = {
  coral: 'bg-primary/15 text-primary',
  blue: 'bg-blue-500/15 text-blue-500',
  green: 'bg-emerald-500/15 text-emerald-500',
  red: 'bg-destructive/15 text-destructive',
};

function SettingsRow({
  icon: Icon,
  tint = 'coral',
  title,
  subtitle,
  href,
  onClick,
  right,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint?: keyof typeof rowTints;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  const interactive = Boolean(href || onClick);
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${interactive ? 'hover:bg-primary/5 transition-colors' : ''}`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${rowTints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${destructive ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right ?? (interactive && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />)}
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
  return inner;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: partnerInfo } = usePartnerInfo();
  const { data: invitations } = usePartnerInvitations();
  const { data: sentInvitations } = useSentPartnerInvitations();
  const refreshPartnerInfo = useRefreshPartnerInfo();
  const t = useI18n();
  const params = useParams();
  const locale = params.locale as string;
  const updateProfileMutation = useUpdateProfile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const profileSchema = createProfileSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profileData?.user) {
      reset({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
        currency: profileData.user.currency || 'EUR',
      });
    } else if (session?.user && !profileLoading) {
      reset({
        name: session.user.name || '',
        email: session.user.email || '',
        currency: 'EUR',
      });
    }
  }, [profileData, session, profileLoading, reset]);

  const selectedCurrency = watch('currency') || profileData?.user?.currency || 'EUR';
  const currentName = watch('name') || profileData?.user?.name || session?.user?.name || '';

  // Currency lives in Preferences and saves immediately on change.
  const handleCurrencyChange = async (value: string) => {
    setValue('currency', value);
    try {
      await updateProfileMutation.mutateAsync({ name: currentName, currency: value });
      toast.success(t('profile_success'), { description: t('profile_success_description'), duration: 3000 });
    } catch (err: unknown) {
      toast.error(t('profile_error'), { description: err instanceof Error ? err.message : t('profile_error'), duration: 4000 });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        name: data.name,
        currency: data.currency,
      });

      toast.success(t('profile_success'), {
        description: t('profile_success_description'),
        duration: 4000,
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('profile_error');
      toast.error(t('profile_error'), {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement account deletion API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast.success(t('profile_delete_success'), {
        description: t('profile_delete_success_description'),
        duration: 3000,
      });

      await signOut();
      router.push('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('profile_error');
      toast.error(t('profile_delete_error'), {
        description: errorMessage,
        duration: 5000,
      });
      setIsDeleting(false);
    }
  };


  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <p className="text-lg font-medium text-foreground">{t('profile_session_expired')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('profile_login_required')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="space-y-3 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-balance">{t('profile_title')}</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-base">{t('profile_subtitle')}</p>
        </div>
        <div className="rounded-lg md:rounded-xl border border-border bg-card shadow-card animate-pulse">
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b border-border">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-muted/60 rounded-lg md:rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 md:h-6 w-24 md:w-32 bg-muted/60 rounded" />
                <div className="h-3 md:h-4 w-32 md:w-48 bg-muted/60 rounded" />
              </div>
            </div>
            <div className="space-y-3 pt-4 md:pt-6">
              <div className="h-9 md:h-10 bg-muted/60 rounded" />
              <div className="h-9 md:h-10 bg-muted/60 rounded" />
              <div className="h-9 md:h-10 bg-muted/60 rounded w-full md:w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-balance">{t('profile_title')}</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-base">{t('profile_subtitle')}</p>
      </div>

      {/* Profile card with inline name editing */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <UserAvatar
            image={profileData?.user?.image || session.user.image}
            name={profileData?.user?.name || session.user.name}
            email={profileData?.user?.email || session.user.email}
            size={60}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-xl font-bold tracking-tight truncate">{profileData?.user?.name || session.user.name || 'User'}</h2>
            <p className="text-muted-foreground text-xs md:text-sm truncate">{profileData?.user?.email || session.user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('profile_member_since')} {new Date(profileData?.user?.createdAt || session.user.createdAt).getFullYear()}
              <span className="mx-1.5">·</span>
              <span className="text-emerald-500 font-medium">{t('profile_status_active')}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} className="shrink-0">
            {editing ? t('common_cancel') : t('profile_edit')}
          </Button>
        </div>

        {editing && (
          <form
            onSubmit={handleSubmit(async (data) => { await onSubmit(data); setEditing(false); })}
            className="mt-5 pt-5 border-t border-border space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">{t('profile_name')}</Label>
              <Input id="name" {...register('name')} placeholder={t('register_name')} className="h-10" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? t('profile_saving') : t('profile_save')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Preferences */}
      <section className="space-y-3">
        <SectionLabel>{t('profile_section_preferences')}</SectionLabel>
        <Panel>
          <SettingsRow
            icon={Coins}
            tint="coral"
            title={t('profile_currency')}
            right={
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-9 w-auto gap-2 border-0 shadow-none bg-transparent focus:ring-0">
                  <SelectValue placeholder={t('profile_currency_select')} />
                </SelectTrigger>
                <SelectContent align="end">
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="py-2">
                      <span>{t(currency.nameKey)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <SettingsRow icon={Languages} tint="green" title={t('profile_language')} right={<LocaleSwitcher variant="ghost" showText />} />
          <SettingsRow icon={Moon} tint="blue" title={t('profile_appearance')} right={<ThemeSwitcher />} />
        </Panel>
      </section>

      {/* Budget */}
      <section className="space-y-3">
        <SectionLabel>{t('profile_section_budget')}</SectionLabel>
        <Panel>
          <SettingsRow icon={Tag} tint="green" title={t('nav_categories')} href={`/${locale}/categories`} />
          <SettingsRow icon={TrendingUp} tint="blue" title={t('nav_trends')} href={`/${locale}/trends`} />
        </Panel>
      </section>

      {/* Budget Partner — its own section (the card carries its own heading) */}
      <section className="space-y-3">
        {invitations?.invitations?.map((invitation) => (
          <PartnerInvitationCard key={invitation.id} invitation={invitation} onUpdate={refreshPartnerInfo} />
        ))}
        {sentInvitations?.invitations?.map((invitation) => (
          <SentInvitationCard key={invitation.id} invitation={invitation} onUpdate={refreshPartnerInfo} />
        ))}
        <PartnerManagement
          partnerInfo={partnerInfo}
          sentInvitations={sentInvitations?.invitations}
          onPartnerUpdate={refreshPartnerInfo}
        />
      </section>

      {/* Security */}
      <section className="space-y-3">
        <SectionLabel>{t('profile_danger_section')}</SectionLabel>
        <Panel>
          <SettingsRow
            icon={Trash2}
            tint="red"
            title={t('profile_delete_button')}
            subtitle={t('profile_delete_description')}
            onClick={() => setShowDeleteDialog(true)}
            destructive
          />
        </Panel>
      </section>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('profile_delete_dialog_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('profile_delete_dialog_description')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('profile_delete_data_transactions')}</li>
                <li>{t('profile_delete_data_categories')}</li>
                <li>{t('profile_delete_data_history')}</li>
                <li>{t('profile_delete_data_preferences')}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t('profile_delete_processing') : t('profile_delete_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
