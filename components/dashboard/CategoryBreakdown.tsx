'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string;
  type: 'income' | 'expense';
  total: number;
  transactionCount: number;
}

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  month: number;
  year: number;
}

export function CategoryBreakdown({ categories, month, year }: CategoryBreakdownProps) {
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex];
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Répartition par catégorie</span>
          <Badge variant="outline">
            {getMonthName(month)} {year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenseCategories.length > 0 ? (
            expenseCategories.map((category) => (
              <div key={category.categoryId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.categoryName}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatEuro(category.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune dépense pour ce mois
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}