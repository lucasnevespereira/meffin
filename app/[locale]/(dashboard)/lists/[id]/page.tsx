'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Check, Edit, ArrowLeft, ShoppingCart, Circle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  const listId = params.id as string;
  const locale = params.locale as string;

  const { data: session } = useSession();
  const formatCurrency = useFormatCurrency();

  const { data: listData, isLoading, error } = useList(listId);
  const { data: categoriesData } = useCategories();
  const updateListMutation = useUpdateList();
  const createItemMutation = useCreateListItem();
  const updateItemMutation = useUpdateListItem();
  const toggleItemMutation = useToggleListItem();

  const [isEditingList, setIsEditingList] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemWithCategory | null>(null);

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

  const handleEditItem = (item: ListItemWithCategory) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const handleSubmitItem = (data: ListItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate(
        { listId, itemId: editingItem.id, data },
        {
          onSuccess: () => {
            setIsItemFormOpen(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      createItemMutation.mutate(
        { listId, data },
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

  const progress = list.itemCount > 0 ? (list.checkedCount / list.itemCount) * 100 : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/lists`}>
          <Button variant="ghost" size="sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {list.title}
            </h1>
            {list.isShared && (
              <Badge variant="secondary">👥 Shared</Badge>
            )}
          </div>
          {list.description && (
            <p className="text-muted-foreground">{list.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingList(true)}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAddItem}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('lists_detail_add_item') || 'Add Item'}
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Circle className="h-4 w-4" />
                <span className="font-medium">{t('lists_detail_progress') || 'Progress'}</span>
              </div>
              <div className="text-2xl font-bold">
                {list.checkedCount}/{list.itemCount}
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Circle className="h-4 w-4" />
                <span className="font-medium">{t('lists_detail_remaining') || 'Remaining'}</span>
              </div>
              <div className="text-2xl font-bold">
                {list.itemCount - list.checkedCount}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium">{t('lists_detail_estimated_total') || 'Estimated Total'}</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(list.totalEstimatedPrice)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('lists_detail_items') || 'Items'}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {list.itemCount} {list.itemCount === 1
                ? (t('lists_detail_item') || 'item')
                : (t('lists_detail_items_plural') || 'items')
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.items && list.items.length > 0 ? (
            <div className="space-y-2">
              {list.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                    item.isChecked
                      ? 'bg-muted/20 border-muted text-muted-foreground'
                      : 'border-border'
                  }`}
                  onClick={() => handleToggleItem(item)}
                >
                  <Checkbox
                    checked={item.isChecked}
                    className="pointer-events-none"
                  />
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.category?.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${item.isChecked ? 'line-through' : ''}`}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.category && (
                        <Badge variant="outline">
                          {getCategoryDisplayName(item.category, t)}
                        </Badge>
                      )}
                      {item.createdBy && (
                        <span className="text-xs text-muted-foreground">
                          {t('lists_item_created_by') || 'Created by'} {item.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.estimatedPrice && (
                    <div className="text-sm font-medium">
                      {formatCurrency(parseFloat(item.estimatedPrice))}
                    </div>
                  )}
                  {item.isChecked && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
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

      {/* List Edit Modal */}
      <ListForm
        isOpen={isEditingList}
        onClose={() => setIsEditingList(false)}
        onSubmit={handleUpdateList}
        initialData={list}
        mode="edit"
        isSubmitting={updateListMutation.isPending}
      />

      {/* List Item Form Modal */}
      <ListItemForm
        isOpen={isItemFormOpen}
        onClose={handleCloseItemForm}
        onSubmit={handleSubmitItem}
        categories={categoriesData?.categories || []}
        initialData={editingItem || undefined}
        mode={editingItem ? 'edit' : 'create'}
        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
      />
    </div>
  );
}