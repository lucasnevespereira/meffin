'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Check, Edit, ArrowLeft, Circle, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useI18n } from '@/locales/client';
import { useSession } from '@/lib/auth-client';
import { useFormatCurrency } from '@/lib/currency-utils';
import { getCategoryDisplayName } from '@/lib/category-utils';
import {
  useList,
  useUpdateList,
  useDeleteList,
  useCreateListItem,
  useUpdateListItem,
  useDeleteListItem,
  useToggleListItem,
} from '@/hooks/useLists';
import { useCategories } from '@/hooks/useCategories';
import { ListForm, ListFormData } from '@/components/forms/ListForm';
import { ListItemForm, ListItemFormData } from '@/components/forms/ListItemForm';
import { ListItemWithCategory } from '@/types';

export default function ListDetailPage() {
  const t = useI18n();
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;
  const locale = params.locale as string;

  const { data: session } = useSession();
  const formatCurrency = useFormatCurrency();

  const { data: listData, isLoading, error } = useList(listId);
  const { data: categoriesData } = useCategories();
  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();
  const createItemMutation = useCreateListItem();
  const updateItemMutation = useUpdateListItem();
  const toggleItemMutation = useToggleListItem();
  const deleteItemMutation = useDeleteListItem();

  const [isEditingList, setIsEditingList] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemWithCategory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const list = listData?.list;

  if (!session) {
    return (
      <div className="text-center py-12 md:py-16">
        <p className="text-muted-foreground">Please sign in to view this list.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 md:py-16">
        <p className="text-muted-foreground">Error loading list. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div>
            <div className="h-8 bg-muted rounded w-48 animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-muted rounded w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12 md:py-16">
        <p className="text-muted-foreground">List not found.</p>
      </div>
    );
  }

  const handleUpdateList = (data: ListFormData) => {
    updateListMutation.mutate(
      { id: listId, data },
      {
        onSuccess: () => {
          setIsEditingList(false);
        },
      }
    );
  };

  const handleToggleItem = (item: ListItemWithCategory) => {
    const newCheckedState = !item.isChecked;
    toggleItemMutation.mutate({
      listId,
      itemId: item.id,
      data: {
        isChecked: newCheckedState,
        actualPrice: newCheckedState && item.estimatedPrice ? parseFloat(item.estimatedPrice) : undefined,
      },
    });
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemFormOpen(true);
  };


  const handleSubmitItem = (data: ListItemFormData) => {
    // Transform the data to match API expectations
    const apiData = {
      ...data,
      estimatedPrice: data.estimatedPrice?.toString(),
    };

    if (editingItem) {
      updateItemMutation.mutate(
        { listId, itemId: editingItem.id, data: apiData },
        {
          onSuccess: () => {
            setIsItemFormOpen(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      createItemMutation.mutate(
        { listId, data: apiData },
        {
          onSuccess: () => {
            setIsItemFormOpen(false);
          },
        }
      );
    }
  };

  const handleCloseItemForm = () => {
    setIsItemFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle
    deleteItemMutation.mutate({ listId, itemId });
  };

  const handleDeleteList = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteList = () => {
    deleteListMutation.mutate(listId, {
      onSuccess: () => {
        router.push(`/${locale}/lists`);
      },
    });
  };

  const progress = list.itemCount > 0 ? (list.checkedCount / list.itemCount) * 100 : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/lists`}>
          <Button variant="ghost" size="sm" className="cursor-pointer p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
              {list.title}
            </h1>
            {list.isShared && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 hidden sm:inline-flex">👥 Shared</Badge>
            )}
          </div>
          {/* Show description only on larger screens */}
          {list.description && (
            <p className="text-muted-foreground text-sm hidden md:block truncate">{list.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingList(true)}
            className="cursor-pointer p-2 hidden sm:inline-flex"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteList}
            className="cursor-pointer p-2 hidden sm:inline-flex hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAddItem}
            disabled={!list.categoryId}
            className="cursor-pointer text-sm px-3 py-2 disabled:cursor-not-allowed"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('lists_detail_add_item') || 'Add Item'}</span>
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('lists_detail_progress') || 'Progress'}
              </div>
              <div className="text-sm font-medium">
                {list.checkedCount}/{list.itemCount} {t('items') || 'items'}
              </div>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                {list.itemCount - list.checkedCount} {t('lists_detail_remaining') || 'remaining'}
              </div>
              <div className="font-medium">
                {formatCurrency(list.totalEstimatedPrice)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Category Warning */}
      {!list.categoryId && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <Circle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-2">{t('lists_no_category_title') || 'No Category Assigned'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('lists_no_category_description') || 'This list needs a category before you can add items to it.'}
              </p>
              <Button
                onClick={() => setIsEditingList(true)}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('lists_assign_category') || 'Assign Category'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {list.categoryId && (
        <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('lists_detail_items') || 'Items'}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {list.itemCount} {list.itemCount === 1
                ? (t('lists_detail_item') || 'item')
                : (t('lists_detail_items_plural') || 'items')
              }
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {list.items && list.items.length > 0 ? (
            <div className="space-y-2">
              {list.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                    item.isChecked
                      ? 'bg-muted/10 opacity-75'
                      : 'bg-card hover:bg-muted/10 active:bg-muted/20 shadow-sm hover:shadow-md'
                  }`}
                  onClick={() => handleToggleItem(item)}
                >
                  <Checkbox
                    checked={item.isChecked}
                    className="pointer-events-none shrink-0 h-6 w-6 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium leading-tight ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </p>
                      {item.estimatedPrice && (
                        <span className="text-sm font-semibold text-right shrink-0 text-primary">
                          {formatCurrency(parseFloat(item.estimatedPrice))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {item.category && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.category?.color || '#6B7280' }}
                            />
                            <span>{getCategoryDisplayName(item.category, t)}</span>
                          </div>
                        )}
                        {item.createdBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.createdBy.name}</span>
                          </div>
                        )}
                      </div>
                      {item.isChecked && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{t('lists_detail_no_items') || 'No items in this list yet'}</p>
              <Button onClick={handleAddItem} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                {t('lists_detail_add_first_item') || 'Add your first item'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* List Edit Modal */}
      <ListForm
        isOpen={isEditingList}
        onClose={() => setIsEditingList(false)}
        onSubmit={handleUpdateList}
        categories={categoriesData?.categories || []}
        initialData={list}
        mode="edit"
        isSubmitting={updateListMutation.isPending}
      />

      {/* List Item Form Modal - Only show if list has a category */}
      {list.categoryId && (
        <ListItemForm
          isOpen={isItemFormOpen}
          onClose={handleCloseItemForm}
          onSubmit={handleSubmitItem}
          categories={categoriesData?.categories || []}
          defaultCategoryId={list.categoryId}
          initialData={editingItem || undefined}
          mode={editingItem ? 'edit' : 'create'}
          isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lists_delete_title') || 'Delete List'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lists_delete_confirmation') || 'Are you sure you want to delete this list? This will also delete all items in the list. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t('common_cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteList}
              disabled={deleteListMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer disabled:cursor-not-allowed"
            >
              {deleteListMutation.isPending ? (t('lists_deleting') || 'Deleting...') : (t('common_delete') || 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}