'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      <div>
        <h1 className="text-2xl font-semibold">{t('profile_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('profile_subtitle')}</p>
      </div>

      <div className="max-w-2xl">
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50/50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50/50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">{t('profile_info_section')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t('profile_name')}</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder={t('register_name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('profile_email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="bg-muted/30 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile_email_readonly')}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">{t('profile_preferences_section')}</h2>
            </div>
            <div className="max-w-xs">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">{t('profile_currency')}</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile_currency_select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {t(currency.nameKey as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="pt-4 border-t border-border/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">{t('profile_user_id')}:</span>
                <div className="font-mono text-xs mt-1 break-all">{session.user.id}</div>
              </div>
              <div>
                <span className="font-medium">{t('profile_created_at')}:</span>
                <div className="mt-1">{new Date(session.user.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? t('profile_saving') : t('profile_save')}
          </Button>
        </form>
      </div>

      {/* Danger Zone - Discrete Collapsible */}
      <div className="pt-4 border-t border-border/20">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDangerZone ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>{t('profile_danger_section')}</span>
        </button>
        
        {showDangerZone && (
          <div className="mt-4 p-4 rounded-lg border border-border/40 bg-muted/20">
            <p className="text-sm text-muted-foreground mb-3">
              {t('profile_delete_description')}
            </p>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="h-3 w-3" />
              {t('profile_delete_button')}
            </Button>
          </div>
        )}
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