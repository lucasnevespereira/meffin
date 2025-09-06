'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/locales/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/lib/auth-client';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useI18n();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loginSchema = z.object({
    email: z.string().min(1, t('validation_emailRequired')).email(t('validation_emailInvalid')),
    password: z.string().min(6, t('validation_passwordMinLength')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.data) {
        router.push(`/${locale}/dashboard`);
      } else {
        setError(t('login_error'));
      }
    } catch (err: unknown) {
      setError((err as Error).message || t('login_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
      });
    } catch (err: unknown) {
      setError((err as Error).message || t('login_error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-medium">{t('login_title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('login_subtitle')}
        </p>
      </div>

      <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login_email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login_password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('login_submitting') : t('login_submit')}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('common_or')}</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="m12.017 0c-.57.003-1.141.013-1.71.033-5.458.193-9.847 4.597-10.004 10.056-.157 5.467 4.163 10.067 9.63 10.344 5.467.277 10.067-3.443 10.344-8.91.277-5.467-3.443-10.067-8.91-10.344-.454-.30-.907-.042-1.35-.043zm.003 1.5c.442.001.884.013 1.325.036 4.597.24 8.256 4.217 8.016 8.814-.24 4.597-4.217 8.256-8.814 8.016s-8.256-4.217-8.016-8.814c.233-4.461 3.879-8.04 8.489-8.052z"
                fill="currentColor"
              />
            </svg>
            {t('login_withGoogle')}
          </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t('login_noAccount')} </span>
          <Link
            href={`/${locale}/register`}
            className="text-primary hover:underline font-medium"
          >
            {t('login_signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}