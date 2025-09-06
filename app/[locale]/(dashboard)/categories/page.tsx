'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold">{t('categories_title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('categories_subtitle')}</p>
        </div>

        <div className="flex justify-center sm:justify-start">
          <Button 
            onClick={() => setIsFormOpen(true)} 
            className="h-11 px-6 text-sm font-medium touch-manipulation w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('categories_add_button')}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-5 bg-muted rounded w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg border border-border/40 bg-card/20 animate-pulse touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-muted rounded-full" />
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Categories */}
      {!isLoading && defaultCats.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-4 px-1">{t('categories_default_title')}</h2>
          <div className="space-y-3">
            {defaultCats.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-4 rounded-lg border border-border/40 bg-card/20 touch-manipulation"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-sm flex-1 min-w-0 truncate">{category.name}</span>
                <Badge variant={category.type === 'income' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                  {category.type === 'income' ? t('categories_income') : t('categories_expense')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Categories */}
      <div>
        <h2 className="text-lg font-medium mb-4 px-1">{t('categories_custom_title')}</h2>
        {customCats.length === 0 ? (
          <div className="text-center py-12 px-4 text-muted-foreground rounded-lg border border-border/40 bg-card/20">
            <Tag className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('categories_no_custom')}</p>
            <p className="text-xs mt-1 opacity-75">
              {t('categories_create_custom')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customCats.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/20 hover:bg-card/40 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-sm flex-1 min-w-0 truncate">{category.name}</span>
                  <Badge variant={category.type === 'income' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap ml-2">
                    {category.type === 'income' ? t('categories_income') : t('categories_expense')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditCategory(category)}
                    className="h-9 w-9 p-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(category)}
                    disabled={deleteMutation.isPending}
                    className="h-9 w-9 p-0 touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
