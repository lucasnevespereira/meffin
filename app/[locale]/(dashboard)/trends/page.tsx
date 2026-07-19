'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, LineChart as LineChartIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useHistory } from '@/hooks/useHistory';
import { useFormatCurrency } from '@/lib/currency-utils';
import { useCurrentLocale, useI18n } from '@/locales/client';
import { PageHeader } from '@/components/shared/PageHeader';

type Period = '6' | '12' | 'ytd';

export default function TrendsPage() {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = currentLocale === 'fr' ? 'fr' : 'en';
  const formatCurrency = useFormatCurrency();
  const [period, setPeriod] = useState<Period>('12');

  const now = new Date();
  const months = period === 'ytd' ? now.getMonth() + 1 : Number(period);

  const { data, isLoading } = useHistory(months);

  const chartConfig = {
    balance: { label: t('trends_balance'), color: 'var(--primary)' },
    income: { label: t('trends_income'), color: '#16a34a' },
    expenses: { label: t('trends_expenses'), color: 'var(--destructive)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    return (data?.history ?? []).map((point) => {
      const date = new Date(point.year, point.month, 1);
      const label = point.month === 0
        ? `${monthFormatter.format(date)} ${String(point.year).slice(2)}`
        : monthFormatter.format(date);
      return { label, income: point.income, expenses: point.expenses, balance: point.balance };
    });
  }, [data, locale]);

  const activeMonths = chartData.filter((p) => p.income > 0 || p.expenses > 0).length;
  const compactNumber = (value: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

  const periods: { value: Period; label: string }[] = [
    { value: '6', label: t('trends_period_6m') },
    { value: '12', label: t('trends_period_12m') },
    { value: 'ytd', label: t('trends_period_ytd') },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('trends_title')}
        description={t('trends_subtitle')}
        actions={
          <div className="flex w-full items-center gap-1 rounded-lg bg-muted/50 p-1 sm:w-auto">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4 md:space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-card animate-pulse">
              <div className="p-6">
                <div className="h-5 bg-muted/60 rounded w-40 mb-6" />
                <div className="h-[240px] bg-muted/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activeMonths < 2 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-12 md:py-16">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm md:text-base">{t('trends_empty_title')}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{t('trends_empty_subtitle')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Balance over time */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <LineChartIcon className="h-4 w-4 text-primary" />
                {t('trends_balance_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label ?? name}</span>
                            <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="balance"
                    type="monotone"
                    stroke="var(--color-balance)"
                    fill="url(#fillBalance)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Income vs expenses */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('trends_income_expenses_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <LineChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label ?? name}</span>
                            <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line dataKey="income" type="monotone" stroke="var(--color-income)" strokeWidth={2} dot={false} />
                  <Line dataKey="expenses" type="monotone" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
