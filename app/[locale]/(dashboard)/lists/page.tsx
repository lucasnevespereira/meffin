'use client';

import { useState } from 'react';
import { Plus, ClipboardList, Circle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/locales/client';
import { useSession } from '@/lib/auth-client';
import { useFormatCurrency } from '@/lib/currency-utils';
import { useLists, useCreateList, useUpdateList } from '@/hooks/useLists';
import { useCategories } from '@/hooks/useCategories';
import { ListForm, ListFormData } from '@/components/forms/ListForm';
import { ListWithItems } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ListsPage() {
  const t = useI18n();
  const params = useParams();
  const locale = params.locale as string;
  const { data: session } = useSession();
  const formatCurrency = useFormatCurrency();
  const { data: listsData, isLoading, error } = useLists();
  const { data: categoriesData } = useCategories();
  const createListMutation = useCreateList();
  const updateListMutation = useUpdateList();

  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithItems | null>(null);

  const handleCreateList = () => {
    setEditingList(null);
    setIsListFormOpen(true);
  };


  const handleSubmitList = (data: ListFormData) => {
    if (editingList) {
      updateListMutation.mutate(
        { id: editingList.id, data },
        {
          onSuccess: () => {
            setIsListFormOpen(false);
            setEditingList(null);
          },
        }
      );
    } else {
      createListMutation.mutate(data, {
        onSuccess: () => {
          setIsListFormOpen(false);
        },
      });
    }
  };

  const handleCloseListForm = () => {
    setIsListFormOpen(false);
    setEditingList(null);
  };

  const lists = listsData?.lists || [];

  if (!session) {
    return (
      <div className="text-center py-12 md:py-16">
        <p className="text-muted-foreground">Please sign in to view your lists.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 md:py-16">
        <p className="text-muted-foreground">Error loading lists. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-card animate-pulse">
              <div className="p-4 md:p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
            {t('lists_title') || 'Shopping Lists'}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {t('lists_subtitle') || 'Create lists for potential purchases and convert them to transactions'}
          </p>
        </div>
        <Button
          onClick={handleCreateList}
          className="shadow-card hover:shadow-lg shrink-0 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('lists_create') || 'Create List'}
        </Button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <ClipboardList className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">
            {t('lists_empty_title') || 'No lists yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('lists_empty_description') || 'Create your first shopping list to start organizing your potential purchases.'}
          </p>
          <Button onClick={handleCreateList} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            {t('lists_create_first') || 'Create your first list'}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/${locale}/lists/${list.id}`}
              className="group block"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/20 cursor-pointer">
                <CardContent className="p-4 md:p-6">
                  {/* Header with color indicator */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: list.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg md:text-xl truncate group-hover:text-primary transition-colors">
                        {list.title}
                      </h3>
                      {list.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>
                    {list.isShared && (
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">👥</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('lists_progress') || 'Progress'}
                      </span>
                      <span className="font-medium">
                        {list.checkedCount}/{list.itemCount} {t('items') || 'items'}
                      </span>
                    </div>

                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                        style={{
                          width: `${list.itemCount > 0 ? (list.checkedCount / list.itemCount) * 100 : 0}%`
                        }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Circle className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {t('lists_remaining') || 'Remaining'}
                          </span>
                        </div>
                        <div className="font-semibold">
                          {list.itemCount - list.checkedCount}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <ShoppingCart className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {t('lists_estimated') || 'Estimated'}
                          </span>
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(list.totalEstimatedPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      {t('lists_updated') || 'Updated'} {new Date(list.updatedAt).toLocaleDateString()}
                    </div>
                    {list.createdBy && (
                      <div className="text-xs text-muted-foreground">
                        {t('lists_by') || 'by'} {list.createdBy.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List Form Modal */}
      <ListForm
        isOpen={isListFormOpen}
        onClose={handleCloseListForm}
        onSubmit={handleSubmitList}
        categories={categoriesData?.categories || []}
        initialData={editingList || undefined}
        mode={editingList ? 'edit' : 'create'}
        isSubmitting={createListMutation.isPending || updateListMutation.isPending}
      />
    </div>
  );
}