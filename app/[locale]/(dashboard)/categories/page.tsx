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
            <p className="text-red-600">Erreur lors du chargement des catégories</p>
            <p className="text-sm text-muted-foreground mt-2">
              Veuillez vous connecter pour accéder aux catégories
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
        <div className="flex items-center gap-2">
          <Tag className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Catégories</h1>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Categories */}
      {!isLoading && defaultCats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Catégories par défaut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {defaultCats.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                      {category.type === 'income' ? 'revenu' : 'dépense'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Mes catégories</CardTitle>
        </CardHeader>
        <CardContent>
          {customCats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune catégorie personnalisée</p>
              <p className="text-sm mt-1">
                Créez vos propres catégories pour mieux organiser vos transactions
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {customCats.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                      {category.type === 'income' ? 'revenu' : 'dépense'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(category)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete?.name}" ?
              Cette action ne peut pas être annulée et la catégorie ne doit pas être utilisée
              dans des transactions existantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
