'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { CategoryFormData } from '@/types';
import { useI18n } from '@/locales/client';

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const createCategorySchema = (t: ReturnType<typeof useI18n>) => z.object({
  name: z.string().min(1, t('validation_nameRequired')).max(100, t('validation_nameMinLength')),
  type: z.enum(['income', 'expense'], { required_error: t('validation_categoryRequired') }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  initialData?: CategoryFormData;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

export function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  isSubmitting = false,
}: CategoryFormProps) {
  const t = useI18n();
  const categorySchema = createCategorySchema(t);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {
      name: '',
      type: 'expense',
      color: predefinedColors[0],
    },
  });

  const selectedType = watch('type');
  const selectedColor = watch('color');

  const onFormSubmit = (data: CategoryFormData) => {
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
            {mode === 'create' ? t('category_form_add_title') : t('category_form_edit_title')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('category_form_name_label')}</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('category_form_name_placeholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('category_form_type_label')}</Label>
            <Select
              value={selectedType}
              onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('category_form_type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{t('categories_income')}</SelectItem>
                <SelectItem value="expense">{t('categories_expense')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('category_form_color_label')}</Label>
            <div className="grid grid-cols-8 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              {...register('color')}
              className="w-20 h-10"
            />
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'En cours...' : (mode === 'create' ? 'Ajouter' : 'Modifier')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}