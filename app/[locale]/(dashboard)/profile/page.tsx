'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { User, Trash2, Save, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

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
import { toast } from 'sonner';
import { SUPPORTED_CURRENCIES } from '@/lib/currency-utils';
import { useQueryClient } from '@tanstack/react-query';


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

// Generate a consistent avatar URL based on user's name or email using initials
const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const t = useI18n();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

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

  const handleRefreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.refetchQueries({ queryKey: ['profile'] });
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t('profile_title')}</h1>
          <p className="text-muted-foreground mt-2">{t('profile_subtitle')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card animate-pulse">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="w-16 h-16 bg-muted/60 rounded-xl" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted/60 rounded" />
                <div className="h-4 w-48 bg-muted/60 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-muted/60 rounded" />
              <div className="h-10 bg-muted/60 rounded" />
              <div className="h-10 bg-muted/60 rounded w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">{t('profile_title')}</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">{t('profile_subtitle')}</p>
      </div>


      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          {/* Avatar and Basic Info Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 md:pb-6 border-b border-border">
            {/* Avatar Section */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden ring-2 ring-border shadow-sm shrink-0 mx-auto sm:mx-0">
              <Image
                src={generateAvatarUrl(session.user.name || session.user.email || 'user')}
                alt={session.user.name || 'User Avatar'}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>

            {/* User Info and Status */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">{profileData?.user?.name || session.user.name || 'User'}</h2>
              <p className="text-muted-foreground text-sm">{profileData?.user?.email || session.user.email}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                <div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium status-success">
                  ✓ {t('profile_status_active')}
                </div>
                <div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {t('profile_member_since')} {new Date(profileData?.user?.createdAt || session.user.createdAt).getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Card */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-100">
              <User className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{t('profile_edit_title')}</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">{t('profile_name')}</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder={t('register_name')}
                      className="h-10 border-border focus:border-primary focus:ring-primary/20"
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
                      className="h-10 bg-muted/30 text-muted-foreground border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('profile_email_readonly')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="currency" className="text-sm font-medium text-foreground">{t('profile_currency')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshProfile}
                      className="text-xs text-muted-foreground"
                    >
                      Refresh Profile
                    </Button>
                  </div>
                  <Select
                    key={`currency-${profileData?.user?.currency || 'loading'}`}
                    value={selectedCurrency}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger className="h-10 max-w-xs border-border focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder={t('profile_currency_select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="py-2">
                          <div className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span>{t(currency.nameKey)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-destructive">{errors.currency.message}</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="p-4 md:p-6 rounded-xl bg-muted/20 border border-border/50">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2 md:mb-3">{t('profile_quick_stats')}</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{t('profile_member_since_label')}</span>
                      <span className="font-medium">{new Date(profileData?.user?.createdAt || session.user.createdAt).getFullYear()}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{t('profile_account_type')}</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{t('profile_status_active')}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{t('profile_profile_id')}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(profileData?.user?.id || session.user.id).slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end pt-3 md:pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="shadow-card hover:shadow-lg w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? t('profile_saving') : t('profile_save')}
              </Button>
            </div>
          </form>
        </div>
      </div>


      {/* Danger Zone - Discrete Collapsible */}
      <div className="rounded-xl border border-border/50 bg-card">
        <div className="p-3 md:p-4">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full touch-manipulation"
          >
            {showDangerZone ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{t('profile_danger_section')}</span>
          </button>

          {showDangerZone && (
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/30">
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                {t('profile_delete_description')}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors w-full sm:w-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {t('profile_delete_button')}
              </Button>
            </div>
          )}
        </div>
      </div>


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
