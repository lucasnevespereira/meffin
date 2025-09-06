'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Category, CategoryFormData } from '@/types';
import { useI18n } from '@/locales/client';

// Helper function to get translated category name
const getCategoryName = (category: Category, t: ReturnType<typeof useI18n>): string => {
  // For default categories, try to get translation, fallback to original name
  if (!category.isCustom) {
    // @ts-ignore - TypeScript doesn't know about dynamic keys but it's safe here
    const translated = t(category.name as any);
    // If translation exists and is different from the key, use it
    return translated !== category.name ? translated : category.name;
  }
  // For custom categories, use the name as is
  return category.name;
};

// Default categories that should be created for new users
// const defaultCategories = [
//   { name: 'Maison', type: 'expense' as const, color: '#EF4444', isDefault: true },
//   { name: 'Transports', type: 'expense' as const, color: '#3B82F6', isDefault: true },
//   { name: 'Banque', type: 'expense' as const, color: '#D946EF', isDefault: true },
//   { name: 'Abonnements', type: 'expense' as const, color: '#06B6D4', isDefault: true },
//   { name: 'Sorties', type: 'expense' as const, color: '#F59E0B', isDefault: true },
//   { name: 'Divers', type: 'expense' as const, color: '#F97316', isDefault: true },
//   { name: 'Travail', type: 'income' as const, color: '#EF4444', isDefault: true },
//   { name: 'Investissement', type: 'income' as const, color: '#DC2626', isDefault: true },
// ];

export default function CategoriesPage() {
  const t = useI18n();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { data: categoriesData, isLoading, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleCreateCategory = (data: CategoryFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            setEditingCategory(null);
          },
        }
      );
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        },
      });
    }
  };

  const closeEditForm = () => {
    setEditingCategory(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{t('categories_loading_error')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('categories_login_required')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = categoriesData?.categories || [];
  const defaultCats = categories.filter(cat => !cat.isCustom);
  const customCats = categories.filter(cat => cat.isCustom);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t('categories_title')}</h1>
          <p className="text-muted-foreground mt-2">{t('categories_subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="shadow-card hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('categories_add_button')}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-card animate-pulse">
              <div className="p-6">
                <div className="h-6 bg-muted rounded w-32 mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
                      <div className="w-8 h-8 bg-muted rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-24 mb-2" />
                        <div className="h-3 bg-muted rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Default Categories */}
      {!isLoading && defaultCats.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">{t('categories_default_title')}</h2>
              <div className="px-3 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border">
                {defaultCats.length} {defaultCats.length > 1 ? t('categories_count_plural') : t('categories_count_single')}
              </div>
            </div>

            <div className="space-y-3">
              {defaultCats.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border border-transparent transition-all duration-200 touch-manipulation"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{getCategoryName(category, t)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {category.type === 'income' ? t('categories_income') : t('categories_expense')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Categories */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">{t('categories_custom_title')}</h2>
            <div className="px-3 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border">
              {customCats.length} {customCats.length > 1 ? t('categories_custom_plural') : t('categories_custom_single')}
            </div>
          </div>

          {customCats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Tag className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t('categories_no_custom')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('categories_create_custom')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customCats.map((category) => (
                <div
                  key={category.id}
                  className="group flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border transition-all duration-200 touch-manipulation"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{getCategoryName(category, t)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {category.type === 'income' ? t('categories_income') : t('categories_expense')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(category)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modals */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateCategory}
        mode="create"
        isSubmitting={createMutation.isPending}
      />

      {editingCategory && (
        <CategoryForm
          isOpen={true}
          onClose={closeEditForm}
          onSubmit={handleUpdateCategory}
          initialData={{
            name: editingCategory.name,
            type: editingCategory.type,
            color: editingCategory.color,
          }}
          mode="edit"
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories_delete_confirmation', { name: categoryToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? t('categories_deleting') : t('categories_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
