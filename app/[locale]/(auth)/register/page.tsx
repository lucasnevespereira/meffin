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
        <h1 className="text-2xl font-semibold text-foreground">{t('register_title')}</h1>
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
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('register_email')}</Label>
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
            <Label htmlFor="password">{t('register_password')}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('register_confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
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
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="m12.017 0c-.57.003-1.141.013-1.71.033-5.458.193-9.847 4.597-10.004 10.056-.157 5.467 4.163 10.067 9.63 10.344 5.467.277 10.067-3.443 10.344-8.91.277-5.467-3.443-10.067-8.91-10.344-.454-.30-.907-.042-1.35-.043zm.003 1.5c.442.001.884.013 1.325.036 4.597.24 8.256 4.217 8.016 8.814-.24 4.597-4.217 8.256-8.814 8.016s-8.256-4.217-8.016-8.814c.233-4.461 3.879-8.04 8.489-8.052z"
              fill="currentColor"
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
