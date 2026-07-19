'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Trash2, Save, AlertTriangle } from 'lucide-react';

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

// Generate a fallback avatar URL based on user's name or email using initials
const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

// Get the best available avatar URL (Google profile image or fallback to initials)
const getAvatarUrl = (user: { name?: string | null; email?: string | null; image?: string | null }): string => {
  // Use Google profile image if available
  if (user.image) {
    return user.image;
  }
  
  // Fallback to initials avatar
  return generateFallbackAvatarUrl(user.name || user.email || 'user');
};

// Small uppercase section label, mirroring the mobile "You" screen grouping.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{children}</h2>;
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
  const updateProfileMutation = useUpdateProfile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      {/* Profile header */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden ring-2 ring-border shrink-0">
            <Image
              src={getAvatarUrl(session.user)}
              alt={session.user.name || 'User Avatar'}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = generateFallbackAvatarUrl(session.user.name || session.user.email || 'user');
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-xl font-bold tracking-tight truncate">{profileData?.user?.name || session.user.name || 'User'}</h2>
            <p className="text-muted-foreground text-xs md:text-sm truncate">{profileData?.user?.email || session.user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('profile_member_since')} {new Date(profileData?.user?.createdAt || session.user.createdAt).getFullYear()}
            </p>
          </div>
          <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500 shrink-0">
            ✓ {t('profile_status_active')}
          </div>
        </div>
      </div>

      {/* Account */}
      <section className="space-y-3">
        <SectionLabel>{t('profile_section_account')}</SectionLabel>
        <div className="rounded-xl border border-border bg-card shadow-card p-4 md:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">{t('profile_name')}</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder={t('register_name')}
                  className="h-9 md:h-10"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">{t('profile_email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="h-9 md:h-10 bg-muted/30 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile_email_readonly')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium text-foreground">{t('profile_currency')}</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger className="h-9 md:h-10 w-full sm:max-w-xs">
                  <SelectValue placeholder={t('profile_currency_select')} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="py-2">
                      <span>{t(currency.nameKey)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-4 md:px-6 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? t('profile_saving') : t('profile_save')}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Received Partner Invitations */}
      {invitations?.invitations && invitations.invitations.length > 0 && (
        <div className="space-y-3">
          {invitations.invitations.map((invitation) => (
            <PartnerInvitationCard
              key={invitation.id}
              invitation={invitation}
              onUpdate={refreshPartnerInfo}
            />
          ))}
        </div>
      )}

      {/* Sent Partner Invitations */}
      {sentInvitations?.invitations && sentInvitations.invitations.length > 0 && (
        <div className="space-y-3">
          {sentInvitations.invitations.map((invitation) => (
            <SentInvitationCard
              key={invitation.id}
              invitation={invitation}
              onUpdate={refreshPartnerInfo}
            />
          ))}
        </div>
      )}

      {/* Partner Management */}
      <PartnerManagement 
        partnerInfo={partnerInfo}
        sentInvitations={sentInvitations?.invitations}
        onPartnerUpdate={refreshPartnerInfo}
      />

      {/* Security */}
      <section className="space-y-3">
        <SectionLabel>{t('profile_danger_section')}</SectionLabel>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 md:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('profile_delete_button')}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">{t('profile_delete_description')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive hover:border-destructive/50 transition-colors w-full sm:w-auto shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('profile_delete_button')}
          </Button>
        </div>
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
