'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { User, Globe, Trash2, Save, AlertTriangle, Info, ChevronDown, ChevronRight } from 'lucide-react';

const APP_VERSION = '0.1.0';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useSession, signOut } from '@/lib/auth-client';
import { useI18n } from '@/locales/client';

const currencies = [
  { code: 'EUR', nameKey: 'currency_eur', symbol: '€' },
  { code: 'USD', nameKey: 'currency_usd', symbol: '$' },
  { code: 'GBP', nameKey: 'currency_gbp', symbol: '£' },
  { code: 'CAD', nameKey: 'currency_cad', symbol: 'C$' },
  { code: 'CHF', nameKey: 'currency_chf', symbol: 'CHF' },
];


const createProfileSchema = (t: any) => z.object({
  name: z.string().min(2, t('validation_nameMinLength')),
  email: z.string().email(t('validation_emailInvalid')),
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
  const t = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const profileSchema = createProfileSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      currency: 'EUR', // TODO: Get from user preferences
    },
  });

  const selectedCurrency = watch('currency');

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSuccess('');
    setError('');

    try {
      // TODO: Implement profile update API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess(t('profile_success'));
    } catch (err: any) {
      setError(err.message || t('profile_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement account deletion API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      await signOut();
      router.push('/login');
    } catch (err: any) {
      setError(err.message || t('profile_error'));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">{t('profile_title')}</h1>
        <p className="text-muted-foreground mt-2">{t('profile_subtitle')}</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50/50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Avatar and Basic Info Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Section */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-border shadow-card">
                <Image
                  src={generateAvatarUrl(session.user.name || session.user.email || 'user')}
                  alt={session.user.name || 'User Avatar'}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* User Info and Status */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{session.user.name || 'User'}</h1>
                <p className="text-muted-foreground mt-2 text-lg">{session.user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Compte actif
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Membre depuis {new Date(session.user.createdAt).getFullYear()}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Edit Profile Card */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">{t('profile_name')}</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder={t('register_name')}
                      className="h-11"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t('profile_email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      disabled
                      className="h-11 bg-muted/50 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('profile_email_readonly')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">{t('profile_currency')}</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger className="h-11 max-w-xs">
                      <SelectValue placeholder={t('profile_currency_select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="py-3">
                          {t(currency.nameKey as any)}
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
                <div className="p-6 rounded-xl bg-muted/20 border border-border/50">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">Quick Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Member since</span>
                      <span className="font-medium">{new Date(session.user.createdAt).getFullYear()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account type</span>
                      <span className="font-medium text-emerald-700">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profile ID</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {session.user.id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="shadow-card hover:shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? t('profile_saving') : t('profile_save')}
              </Button>
            </div>
          </form>
        </div>
      </div>


      {/* Danger Zone - Discrete Collapsible */}
      <div className="rounded-xl border border-border/50 bg-card">
        <div className="p-4">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDangerZone ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <AlertTriangle className="h-4 w-4" />
            <span>{t('profile_danger_section')}</span>
          </button>
          
          {showDangerZone && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-4">
                {t('profile_delete_description')}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
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
            <AlertDialogTitle className="text-red-600">
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
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t('profile_delete_processing') : t('profile_delete_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}