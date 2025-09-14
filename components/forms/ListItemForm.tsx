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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListItemWithCategory, Category } from '@/types';
import { getCategoryDisplayName } from '@/lib/category-utils';

interface ListItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListItemFormData) => void;
  categories: Category[];
  defaultCategoryId: string;
  initialData?: Partial<ListItemWithCategory>;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

export interface ListItemFormData {
  name: string;
  estimatedPrice?: number;
  categoryId: string;
}

export function ListItemForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  defaultCategoryId,
  initialData,
  mode = 'create',
  isSubmitting = false,
}: ListItemFormProps) {
  const t = useI18n();

  const itemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    estimatedPrice: z.number().positive('Price must be positive').optional(),
    categoryId: z.string().min(1, 'Category is required'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialData?.name || '',
      estimatedPrice: initialData?.estimatedPrice ? parseFloat(initialData.estimatedPrice) : undefined,
      categoryId: initialData?.categoryId || defaultCategoryId,
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        name: initialData.name || '',
        estimatedPrice: initialData.estimatedPrice ? parseFloat(initialData.estimatedPrice) : undefined,
        categoryId: initialData.categoryId || defaultCategoryId,
      });
    } else if (isOpen && !initialData) {
      reset({
        name: '',
        estimatedPrice: undefined,
        categoryId: defaultCategoryId,
      });
    }
  }, [isOpen, initialData, defaultCategoryId, reset]);

  const handleFormSubmit = (data: ListItemFormData) => {
    onSubmit(data);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? (t('lists_item_edit_title') || 'Edit Item')
              : (t('lists_item_create_title') || 'Add New Item')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('lists_item_name') || 'Item Name'} *
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('lists_item_name_placeholder') || 'e.g. Milk, Bread, Gift for John...'}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>
              {t('transaction_category') || 'Category'}
            </Label>
            <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/10 text-sm">
              {(() => {
                const defaultCategory = categories.find(cat => cat.id === defaultCategoryId);
                return defaultCategory ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: defaultCategory.color }}
                    />
                    <span>{getCategoryDisplayName(defaultCategory, t)}</span>
                    <span className="text-muted-foreground ml-auto">({t('lists_default_category') || 'List category'})</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{t('lists_category_not_found') || 'Category not found'}</span>
                );
              })()}
            </div>
          </div>

          {/* Estimated Price */}
          <div className="space-y-2">
            <Label htmlFor="estimatedPrice">
              {t('lists_item_estimated_price') || 'Estimated Price'}
              <span className="text-muted-foreground ml-1">({t('common_optional') || 'optional'})</span>
            </Label>
            <Input
              id="estimatedPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('estimatedPrice', { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.estimatedPrice ? 'border-red-500' : ''}
            />
            {errors.estimatedPrice && (
              <p className="text-sm text-red-500">{errors.estimatedPrice.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common_cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                mode === 'edit'
                  ? (t('lists_item_updating') || 'Updating...')
                  : (t('lists_item_creating') || 'Adding...')
              ) : (
                mode === 'edit'
                  ? (t('common_save') || 'Save')
                  : (t('lists_item_add') || 'Add Item')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}