'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { TransactionWithCategory } from '@/types';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  type: 'income' | 'expense';
  onEdit: (transaction: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function TransactionList({
  transactions,
  type,
  onEdit,
  onDelete,
  isDeleting = false,
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(
    transaction => transaction.category.type === type
  );

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const sectionTitle = type === 'income' ? 'Mes entrées' : 'Mes dépenses';
  const emptyMessage = type === 'income' ? 'Aucune entrée pour ce mois' : 'Aucune dépense pour ce mois';

  if (filteredTransactions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold px-1">{sectionTitle}</h2>
        <div className="text-center py-8 text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold px-1">{sectionTitle}</h2>
        
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/40 bg-card/20 hover:bg-card/40 transition-colors touch-manipulation"
            >
              <div className="flex items-start gap-3 mb-3 sm:mb-0 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: transaction.category.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base truncate">{transaction.description}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                    <span className="block sm:inline">{transaction.category.name}</span>
                    <div className="flex items-center gap-2">
                      {transaction.isFixed && (
                        <Badge variant="outline" className="text-xs">
                          FIXE
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2 sm:ml-4">
                <div className={`font-semibold text-base sm:text-lg ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {type === 'income' ? '+' : '-'} {formatEuro(Number(transaction.amount))}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                    className="h-9 w-9 p-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(transaction.id)}
                    disabled={isDeleting}
                    className="h-9 w-9 p-0 touch-manipulation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}