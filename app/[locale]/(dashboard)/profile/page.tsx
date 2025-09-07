'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Trash2, Save, AlertTriangle, ChevronRight } from 'lucide-react';

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

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profileData, isLoading: profileLoading } = useProfile();
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

      {/* Profile Card */}
      <div className="rounded-lg md:rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          {/* Profile Header */}
          <div className="flex items-start md:items-center gap-3 md:gap-4 pb-5 md:pb-6 border-b border-border">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden ring-2 ring-border shadow-sm shrink-0">
              <Image
                src={getAvatarUrl(session.user)}
                alt={session.user.name || 'User Avatar'}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials avatar if Google image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = generateFallbackAvatarUrl(session.user.name || session.user.email || 'user');
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-xl font-bold tracking-tight truncate">{profileData?.user?.name || session.user.name || 'User'}</h2>
              <p className="text-muted-foreground text-xs md:text-sm truncate">{profileData?.user?.email || session.user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                {t('profile_member_since')} {new Date(profileData?.user?.createdAt || session.user.createdAt).getFullYear()}
              </p>
            </div>
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              ✓ {t('profile_status_active')}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 pt-5 md:pt-6">
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

            <div className="flex justify-end pt-2 md:pt-4">
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
      </div>


      {/* Danger Zone - Minimal */}
      <div className="pt-4 md:pt-8 border-t border-border/30">
        <details className="group">
          <summary className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation">
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{t('profile_danger_section')}</span>
          </summary>
          <div className="mt-3 md:mt-4 pl-6 md:pl-10">
            <p className="text-xs text-muted-foreground mb-3">
              {t('profile_delete_description')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-xs text-destructive hover:text-destructive hover:border-destructive/50 transition-colors w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              {t('profile_delete_button')}
            </Button>
          </div>
        </details>
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
