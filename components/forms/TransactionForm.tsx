'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    date: z.date(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    isFixed: z.boolean().default(false),
    hasEndDate: z.boolean().default(false),
    endDate: z.date().optional(),
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
    defaultValues: initialData || {
      description: '',
      amount: 0,
      categoryId: '',
      date: new Date(),
      dayOfMonth: new Date().getDate(),
      isFixed: false,
      hasEndDate: false,
      endDate: new Date(),
    },
  });

  const selectedCategoryId = watch('categoryId');
  const isFixed = watch('isFixed');
  const hasEndDate = watch('hasEndDate');
  const endDate = watch('endDate');
  const dayOfMonth = watch('dayOfMonth');

  const getRecurringDurationText = () => {
    if (!isFixed) return '';

    if (!hasEndDate) {
      return t('transaction_recurring_indefinite') || 'Repeats monthly indefinitely';
    }

    if (!endDate || !dayOfMonth) return '';

    const now = new Date();
    const end = new Date(endDate);
    const monthsDiff = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());

    if (monthsDiff <= 0) {
      return t('transaction_recurring_ended') || 'This recurring transaction has ended';
    }

    return `${t('transaction_recurring_for') || 'Repeats monthly for'} ${monthsDiff} ${monthsDiff === 1 ? 'month' : 'months'} (${t('transaction_until') || 'until'} ${end.toLocaleDateString()})`;
  };

  const onFormSubmit = (data: TransactionFormData) => {
    if (!session?.user?.id) {
      console.error('No valid session user found');
      return;
    }

    // For recurring transactions, convert dayOfMonth to actual date in current month
    if (data.isFixed && data.dayOfMonth) {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth(), data.dayOfMonth);
      data.date = targetDate;
    }

    onSubmit(data);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('transaction_add') : t('transaction_edit')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t('transaction_description')}</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder={t('transaction_placeholder_desc')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('transaction_amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { valueAsNumber: true })}
              placeholder={t('transaction_placeholder_amount')}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('transaction_category')}</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => setValue('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transaction_select_category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{getCategoryDisplayName(category, t)}</span>
                      <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                        {category.type === 'income' ? t('transactions_income_section') : t('transactions_expenses_section')}
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

          {isFixed ? (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">{t('transaction_day_of_month') || 'Day of month'}</Label>
              <Select
                value={watch('dayOfMonth')?.toString() || ''}
                onValueChange={(value) => setValue('dayOfMonth', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transaction_select_day') || 'Select day'} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {getRecurringDurationText()}
              </p>
              {errors.dayOfMonth && (
                <p className="text-sm text-red-600">{errors.dayOfMonth.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="date">{t('transaction_date')}</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { valueAsDate: true })}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                id="isFixed"
                type="checkbox"
                {...register('isFixed')}
                className="rounded"
              />
              <Label htmlFor="isFixed" className="text-sm">
                {t('transaction_fixed')}
              </Label>
            </div>

            {isFixed && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="hasEndDate"
                    type="checkbox"
                    {...register('hasEndDate')}
                    className="rounded"
                  />
                  <Label htmlFor="hasEndDate" className="text-sm">
                    {t('transaction_has_end_date') || 'This transaction has an end date'}
                  </Label>
                </div>

                {hasEndDate && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm">
                      {t('transaction_end_date') || 'End date'}
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate', { valueAsDate: true })}
                      className="w-full"
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('transaction_cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('transaction_submitting') : (mode === 'create' ? t('transaction_submit_add') : t('transaction_submit_edit'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
