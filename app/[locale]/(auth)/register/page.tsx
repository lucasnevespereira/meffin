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
import { signUp, signIn } from '@/lib/auth-client';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useI18n();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const registerSchema = z.object({
    name: z.string().min(2, t('validation_nameMinLength')),
    email: z.string().min(1, t('validation_emailRequired')).email(t('validation_emailInvalid')),
    password: z.string().min(6, t('validation_passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation_passwordsMatch'),
    path: ["confirmPassword"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      console.log("onSubmit data:", data)
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      console.log("SignUp result:", result)

      if (result.data) {
        router.push(`/${locale}/dashboard`);
      } else if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message  : t('register_error') ;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message  : t('register_error') ;
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-semibold">{t('register_title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('register_subtitle')}
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
            <Label htmlFor="name">{t('register_name')}</Label>
            <Input
              id="name"
              placeholder={t('register_name')}
              {...register('name')}
              className="h-12 touch-manipulation"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('register_email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register('email')}
              className="h-12 touch-manipulation"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('register_password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="h-12 touch-manipulation"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('register_confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="h-12 touch-manipulation"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 touch-manipulation font-medium" disabled={isLoading}>
            {isLoading ? t('register_submitting') : t('register_submit')}
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
          className="w-full h-12 touch-manipulation font-medium"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t('register_withGoogle')}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t('register_hasAccount')} </span>
          <Link
            href={`/${locale}/login`}
            className="text-primary hover:underline font-medium"
          >
            {t('register_signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
