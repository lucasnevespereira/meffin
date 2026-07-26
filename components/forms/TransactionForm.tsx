'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useI18n } from '@/locales/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { TransactionFormData, Category, RepeatType } from '@/types';
import { useSession } from '@/lib/auth-client';
import { getCategoryDisplayName } from '@/lib/category-utils';
import {
  fixedDurationEndDate,
  fixedDurationMonths,
} from '@/lib/services/budget/schedule';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  categories: Category[];
  initialData?: TransactionFormData;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

// Form-specific type for the actual form fields (excluding computed fields)
//
// Dates are held as `yyyy-MM-dd` strings, the format `<input type="date">` reads and
// writes. Passing Date objects through the input leaves it blank and drags UTC-midnight
// conversion into every read.
type TransactionFormInput = {
  description: string;
  amount: number;
  categoryId: string;
  /** First occurrence. For a one-off it's simply the date; for anything recurring the day
   *  sets the day of the month and the month sets when it starts. */
  startDate: string;
  repeatType: RepeatType;
  customEndDate?: string;
  isPrivate?: boolean;
};

const pad = (value: number) => String(value).padStart(2, '0');
const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** Noon, so no downstream timezone conversion can move it to the neighbouring day. */
const fromDateInput = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

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
    startDate: z.string().min(1, t('validation_dateRequired') || 'Date is required'),
    repeatType: z.enum(['forever', '3months', '4months', '6months', '12months', 'annual', 'until', 'once']),
    customEndDate: z.string().optional(),
    isPrivate: z.boolean().optional(),
  }).refine(
    // "Until specific date" without a date used to fall through as never-ending.
    data => data.repeatType !== 'until' || !!data.customEndDate,
    { path: ['customEndDate'], message: t('validation_endDateRequired') || 'End date is required' }
  ) satisfies z.ZodType<TransactionFormInput>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData ? {
      description: initialData.description || '',
      amount: initialData.amount || 0,
      categoryId: initialData.categoryId || '',
      startDate: toDateInput(initialData.date ? new Date(initialData.date) : new Date()),
      repeatType: initialData.repeatType || 'forever',
      customEndDate: initialData.customEndDate ? toDateInput(initialData.customEndDate) : '',
      isPrivate: initialData.isPrivate || false,
    } : {
      description: '',
      amount: 0,
      categoryId: '',
      startDate: toDateInput(new Date()),
      repeatType: 'forever',
      customEndDate: '',
      isPrivate: false,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const startDate = watch('startDate');
  const repeatType = watch('repeatType');
  const customEndDate = watch('customEndDate');
  const isPrivate = watch('isPrivate');

  // Reset form when initialData changes (switching between create/edit)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        description: initialData.description || '',
        amount: initialData.amount || 0,
        categoryId: initialData.categoryId || '',
        startDate: toDateInput(initialData.date ? new Date(initialData.date) : new Date()),
        repeatType: initialData.repeatType || 'forever',
        customEndDate: initialData.customEndDate ? toDateInput(initialData.customEndDate) : '',
        isPrivate: initialData.isPrivate || false,
      });
    }
  }, [initialData, mode, reset]);

  // Says back, in a sentence, exactly what will be created.
  const getRecurringText = () => {
    if (!startDate) return '';
    const start = fromDateInput(startDate);
    const day = start.getDate();
    const longDate = start.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const monthAndYear = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    if (repeatType === 'once') {
      return `${t('transaction_one_time') || 'One-time transaction'} · ${longDate}`;
    }

    if (repeatType === 'annual') {
      return `${t('transaction_recurring_annual') || 'Annual'} · ${start.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}`;
    }

    const onDay = `${t('transaction_monthly_on') || 'Monthly on day'} ${day}`;
    const from = `${t('transaction_starting') || 'starting'} ${monthAndYear}`;

    if (repeatType === 'forever') return `${onDay}, ${from}`;

    const months = fixedDurationMonths(repeatType);
    if (months) {
      return `${onDay}, ${from} — ${months} ${t('months') || 'months'}`;
    }

    if (repeatType === 'until' && customEndDate) {
      return `${onDay}, ${from} — ${t('transaction_monthly_until') || 'until'} ${fromDateInput(customEndDate).toLocaleDateString()}`;
    }

    return `${onDay}, ${from}`;
  };

  const onFormSubmit = (data: TransactionFormInput) => {
    if (!session?.user?.id) {
      console.error('No valid session user found');
      return;
    }

    // One date drives everything: for a one-off it is the transaction date, for anything
    // recurring it is the first occurrence — its day sets the day of the month and its
    // month sets when the series starts.
    const targetDate = fromDateInput(data.startDate);

    let endDate: Date | null = null;
    const fixedEndDate = fixedDurationEndDate(targetDate, data.repeatType);
    if (fixedEndDate) {
      endDate = fixedEndDate;
    } else if (data.repeatType === 'until' && data.customEndDate) {
      endDate = fromDateInput(data.customEndDate);
    }

    const formattedData: TransactionFormData = {
      ...data,
      dayOfMonth: targetDate.getDate(),
      customEndDate: endDate ?? undefined,
      date: targetDate,
      isFixed: data.repeatType !== 'once',
      repeatType: data.repeatType,
      endDate: endDate,
      isPrivate: data.isPrivate || false
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
                <p className="text-sm text-destructive">{errors.description.message}</p>
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
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
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
                        className="min-h-[48px] py-3 px-3 focus:bg-accent data-[highlighted]:bg-accent dark:focus:bg-accent dark:data-[highlighted]:bg-accent"
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
                            {category.archivedAt && (
                              <span className="block text-xs text-muted-foreground">
                                {t('categories_archived_label')}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 ml-auto flex-shrink-0 border-transparent ${
                              category.type === 'income'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {category.type === 'income' ? '↑ Income' : '↓ Expense'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isPrivate"
                checked={isPrivate || false}
                onCheckedChange={(checked) => setValue('isPrivate', checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="isPrivate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  🔒 {t('transaction_private') || 'Private transaction'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('transaction_private_description') || 'Only you can see the details of this transaction. Your partner will see "Private transaction".'}
                </p>
              </div>
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-foreground">
              📅 {t('transaction_schedule')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Always visible. Every transaction has a date; for a recurring one it is
                  simply the first occurrence, which is also how you start one next month. */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  {repeatType === 'once' ? t('transaction_date') : t('transaction_starts_on')}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-10"
                  {...register('startDate')}
                />
                <p className="text-xs text-muted-foreground">{t('transaction_date_hint')}</p>
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeatType" className="text-sm font-medium">
                  {t('transaction_repeats')}
                </Label>
                <Controller
                  name="repeatType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                    <SelectItem value="annual">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗓️</span>
                        <span>Annual (yearly)</span>
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
                  )}
                />
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
                  {...register('customEndDate')}
                />
                {errors.customEndDate && (
                  <p className="text-sm text-destructive">{errors.customEndDate.message}</p>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-950/20 dark:border-blue-900/30">
              <p className="text-sm text-blue-800 font-medium dark:text-blue-200">
                {getRecurringText()}
              </p>
            </div>
          </div>


          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto order-2 sm:order-1 cursor-pointer"
            >
              {t('transaction_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('transaction_submitting') : (mode === 'create' ? t('transaction_submit_add') : t('transaction_submit_edit'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
