'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useI18n } from '@/locales/client';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TransactionFormData, Category } from '@/types';
import { useSession } from '@/lib/auth-client';
import { getCategoryDisplayName } from '@/lib/category-utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  categories: Category[];
  initialData?: TransactionFormData;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  mode = 'create',
  isSubmitting = false,
}: TransactionFormProps) {
  const t = useI18n();
  const { data: session } = useSession();

  const transactionSchema = z.object({
    description: z.string().min(1, t('validation_descriptionRequired') || 'Description is required'),
    amount: z.number().positive(t('validation_amountPositive') || 'Amount must be positive'),
    categoryId: z.string().min(1, t('validation_categoryRequired') || 'Category is required'),
    dayOfMonth: z.number().min(1).max(31),
    repeatType: z.enum(['forever', '3months', '4months', '6months', '12months', 'until', 'once']).default('forever'),
    customEndDate: z.date().optional(),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData ? {
      description: initialData.description || '',
      amount: initialData.amount || 0,
      categoryId: initialData.categoryId || '',
      dayOfMonth: initialData.dayOfMonth || new Date().getDate(),
      repeatType: initialData.repeatType || 'forever',
      customEndDate: initialData.customEndDate || new Date(),
    } : {
      description: '',
      amount: 0,
      categoryId: '',
      dayOfMonth: new Date().getDate(),
      repeatType: 'forever',
      customEndDate: new Date(),
    },
  });

  const selectedCategoryId = watch('categoryId');
  const dayOfMonth = watch('dayOfMonth');
  const repeatType = watch('repeatType');
  const customEndDate = watch('customEndDate');

  // Reset form when initialData changes (switching between create/edit)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        description: initialData.description || '',
        amount: initialData.amount || 0,
        categoryId: initialData.categoryId || '',
        dayOfMonth: initialData.dayOfMonth || new Date().getDate(),
        repeatType: initialData.repeatType || 'forever',
        customEndDate: initialData.customEndDate || new Date(),
      });
    }
  }, [initialData, mode, reset]);

  const getRecurringText = () => {
    if (repeatType === 'once') {
      return t('transaction_one_time') || 'One-time transaction';
    }

    if (repeatType === 'forever') {
      return `${t('transaction_monthly_on') || 'Monthly on day'} ${dayOfMonth}`;
    }

    const months = {
      '3months': 3,
      '4months': 4,
      '6months': 6,
      '12months': 12
    };

    if (months[repeatType]) {
      return `${t('transaction_monthly_for') || 'Monthly for'} ${months[repeatType]} ${t('months') || 'months'} (${t('transaction_on_day') || 'on day'} ${dayOfMonth})`;
    }

    if (repeatType === 'until' && customEndDate) {
      return `${t('transaction_monthly_until') || 'Monthly until'} ${customEndDate.toLocaleDateString()} (${t('transaction_on_day') || 'on day'} ${dayOfMonth})`;
    }

    return '';
  };

  const onFormSubmit = (data: TransactionFormData) => {
    if (!session?.user?.id) {
      console.error('No valid session user found');
      return;
    }

    // Convert dayOfMonth to actual date in current month
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), data.dayOfMonth);

    // Calculate end date based on repeat type
    let endDate = null;
    if (data.repeatType !== 'forever' && data.repeatType !== 'once') {
      const months = {
        '3months': 3,
        '4months': 4,
        '6months': 6,
        '12months': 12
      };

      if (months[data.repeatType]) {
        endDate = new Date(now.getFullYear(), now.getMonth() + months[data.repeatType], data.dayOfMonth);
      } else if (data.repeatType === 'until' && data.customEndDate) {
        endDate = data.customEndDate;
      }
    }

    const formattedData = {
      ...data,
      date: targetDate,
      isFixed: data.repeatType !== 'once',
      endDate: endDate
    };

    onSubmit(formattedData);
    if (mode === 'create') {
      reset();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? t('transaction_add') : t('transaction_edit')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('transaction_description')}
              </Label>
              <Input
                id="description"
                {...register('description')}
                placeholder={t('transaction_placeholder_desc')}
                className="h-10"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  {t('transaction_amount')}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder={t('transaction_placeholder_amount')}
                  className="h-10"
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium">
                  {t('transaction_category')}
                </Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('transaction_select_category')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="min-h-[48px] py-3 px-3 focus:bg-gray-100 data-[highlighted]:bg-gray-100"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">
                              {getCategoryDisplayName(category, t)}
                            </span>
                          </div>
                          <Badge
                            variant={category.type === 'income' ? 'default' : 'secondary'}
                            className="text-xs px-2 py-1 ml-auto flex-shrink-0"
                          >
                            {category.type === 'income' ? '↑ Income' : '↓ Expense'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">
              📅 Recurring Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth" className="text-sm font-medium">
                  {t('transaction_day_of_month')}
                </Label>
                <Select
                  value={dayOfMonth?.toString() || ''}
                  onValueChange={(value) => setValue('dayOfMonth', parseInt(value))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('transaction_select_day')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {t('day') || 'Day'} {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfMonth && (
                  <p className="text-sm text-red-600">{errors.dayOfMonth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeatType" className="text-sm font-medium">
                  {t('transaction_repeats')}
                </Label>
                <Select
                  value={repeatType}
                  onValueChange={(value) => setValue('repeatType', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✔️</span>
                        <span>{t('transaction_one_time_only')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="forever">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">♾️</span>
                        <span>{t('transaction_monthly_forever')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="3months">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{t('transaction_for_3_months')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="4months">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{t('transaction_for_4_months')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="6months">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{t('transaction_for_6_months')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="12months">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{t('transaction_for_12_months')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="until">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗓️</span>
                        <span>{t('transaction_until_date')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {repeatType === 'until' && (
              <div className="space-y-2">
                <Label htmlFor="customEndDate" className="text-sm font-medium">
                  {t('transaction_end_date')}
                </Label>
                <Input
                  id="customEndDate"
                  type="date"
                  className="h-10"
                  {...register('customEndDate', { valueAsDate: true })}
                />
                {errors.customEndDate && (
                  <p className="text-sm text-red-600">{errors.customEndDate.message}</p>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                {getRecurringText()}
              </p>
            </div>
          </div>


          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {t('transaction_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? t('transaction_submitting') : (mode === 'create' ? t('transaction_submit_add') : t('transaction_submit_edit'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
