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
    isFixed: z.boolean().default(false),
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
      isFixed: false,
    },
  });

  const selectedCategoryId = watch('categoryId');

  const onFormSubmit = (data: TransactionFormData) => {
    if (!session?.user?.id) {
      console.error('No valid session user found');
      return;
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
