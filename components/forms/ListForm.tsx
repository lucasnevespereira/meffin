'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useI18n } from '@/locales/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListWithItems } from '@/types';

interface ListFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListFormData) => void;
  initialData?: Partial<ListWithItems>;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

export interface ListFormData {
  title: string;
  description?: string;
  color: string;
  isShared: boolean;
}

const LIST_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function ListForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  isSubmitting = false,
}: ListFormProps) {
  const t = useI18n();

  const listSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isShared: z.boolean(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      color: initialData?.color || LIST_COLORS[0],
      isShared: initialData?.isShared || false,
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        color: initialData.color || LIST_COLORS[0],
        isShared: initialData.isShared || false,
      });
    } else if (isOpen && !initialData) {
      reset({
        title: '',
        description: '',
        color: LIST_COLORS[0],
        isShared: false,
      });
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = (data: ListFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? (t('lists_edit_title') || 'Edit List')
              : (t('lists_create_title') || 'Create New List')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t('lists_form_title') || 'List Title'} *
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder={t('lists_form_title_placeholder') || 'e.g. Weekly Groceries, Birthday Ideas...'}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('lists_form_description') || 'Description'}
              <span className="text-muted-foreground ml-1">({t('common_optional') || 'optional'})</span>
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('lists_form_description_placeholder') || 'Brief description of this list...'}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>
              {t('lists_form_color') || 'Color'}
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {LIST_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor === color
                      ? 'border-foreground shadow-md scale-110'
                      : 'border-border hover:border-foreground/50'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Shared */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isShared"
              checked={watch('isShared')}
              onCheckedChange={(checked) => setValue('isShared', !!checked)}
            />
            <Label
              htmlFor="isShared"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {t('lists_form_shared') || 'Share with partner'}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {t('lists_form_shared_description') || 'Allow your budget partner to see and edit this list'}
          </p>

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
                  ? (t('lists_updating') || 'Updating...')
                  : (t('lists_creating') || 'Creating...')
              ) : (
                mode === 'edit'
                  ? (t('common_save') || 'Save')
                  : (t('lists_create') || 'Create List')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}