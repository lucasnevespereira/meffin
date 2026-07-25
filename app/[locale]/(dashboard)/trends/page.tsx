'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { AnalyticsUpIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
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
  const [showForecast, setShowForecast] = useState(false);

  const now = new Date();
  const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
  const months = period === 'ytd' ? now.getMonth() + 1 : Number(period);
  const forecastMonths = showForecast ? 6 : 0;

  const { data, isLoading } = useHistory(months, forecastMonths);

  const chartConfig = {
    balanceActual: { label: t('trends_balance'), color: 'var(--primary)' },
    balanceForecast: { label: t('trends_balance'), color: 'var(--primary)' },
    incomeActual: { label: t('trends_income'), color: '#16a34a' },
    incomeForecast: { label: t('trends_income'), color: '#16a34a' },
    expensesActual: { label: t('trends_expenses'), color: 'var(--destructive)' },
    expensesForecast: { label: t('trends_expenses'), color: 'var(--destructive)' },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    const fullMonthFormatter = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    });
    const points = data?.history ?? [];
    const hasForecast = points.some(
      (point) => point.year * 12 + point.month > currentMonthKey
    );

    return points.map((point) => {
      const date = new Date(point.year, point.month, 1);
      const key = point.year * 12 + point.month;
      const tickLabel = point.month === 0
        ? `${monthFormatter.format(date)} ${String(point.year).slice(2)}`
        : monthFormatter.format(date);
      const isFuture = key > currentMonthKey;
      const connectsToForecast = key === currentMonthKey && hasForecast;

      return {
        key,
        tickLabel,
        fullLabel: fullMonthFormatter.format(date),
        income: point.income,
        expenses: point.expenses,
        balance: point.balance,
        isFuture,
        balanceActual: isFuture ? null : point.balance,
        balanceForecast: isFuture || connectsToForecast ? point.balance : null,
        incomeActual: isFuture ? null : point.income,
        incomeForecast: isFuture || connectsToForecast ? point.income : null,
        expensesActual: isFuture ? null : point.expenses,
        expensesForecast: isFuture || connectsToForecast ? point.expenses : null,
      };
    });
  }, [currentMonthKey, data, locale]);

  const firstFutureKey = chartData.find(point => point.isFuture)?.key;
  const lastKey = chartData.at(-1)?.key;
  const currentKey = firstFutureKey === undefined ? undefined : currentMonthKey;
  const tickLabels = new Map(chartData.map(point => [point.key, point.tickLabel]));

  const activeMonths = chartData.filter((p) => p.income > 0 || p.expenses > 0).length;
  const compactNumber = (value: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

  const periods: { value: Period; label: string }[] = [
    { value: '6', label: t('trends_period_6m') },
    { value: '12', label: t('trends_period_12m') },
    { value: 'ytd', label: t('trends_period_ytd') },
  ];

  const tooltipContent = (
    <ChartTooltipContent
      labelFormatter={(_, payload) => {
        const point = payload[0]?.payload;
        if (!point) return null;

        return (
          <div className="flex items-center gap-2">
            <span className="capitalize">{point.fullLabel}</span>
            {point.isFuture && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {t('trends_forecast_label')}
              </span>
            )}
          </div>
        );
      }}
      formatter={(value, name, _item, _index, payload) => {
        if (!payload.isFuture && String(name).endsWith('Forecast')) {
          return null;
        }

        return (
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-muted-foreground">
              {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
            </span>
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(Number(value))}
            </span>
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('trends_title')}
        description={t('trends_subtitle')}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => setShowForecast((on) => !on)}
              aria-pressed={showForecast}
              title={t('trends_forecast_note')}
              className={`cursor-pointer whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                showForecast
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('trends_include_planned')}
            </button>
            <div className="flex w-full items-center gap-1 rounded-lg bg-muted/50 p-1 sm:w-auto">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  aria-pressed={period === p.value}
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
              <HugeiconsIcon icon={AnalyticsUpIcon} className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
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
                <HugeiconsIcon icon={ChartLineData01Icon} className="h-4 w-4 text-primary" />
                {t('trends_balance_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-balanceActual)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-balanceActual)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="key"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => tickLabels.get(Number(value)) ?? ''}
                  />
                  <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} />
                  <ChartTooltip content={tooltipContent} />
                  {firstFutureKey !== undefined && lastKey !== undefined && (
                    <ReferenceArea
                      x1={firstFutureKey}
                      x2={lastKey}
                      fill="var(--primary)"
                      fillOpacity={0.04}
                      strokeOpacity={0}
                    />
                  )}
                  <Area
                    dataKey="balanceActual"
                    type="monotone"
                    stroke="var(--color-balanceActual)"
                    fill="url(#fillBalance)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="balanceForecast"
                    type="monotone"
                    stroke="var(--color-balanceForecast)"
                    fill="url(#fillBalance)"
                    fillOpacity={0.55}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    legendType="none"
                  />
                  {currentKey !== undefined && (
                    <ReferenceLine
                      x={currentKey}
                      stroke="var(--primary)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.8}
                      label={{
                        value: t('trends_today'),
                        position: 'insideTopRight',
                        fill: 'var(--muted-foreground)',
                        fontSize: 11,
                      }}
                    />
                  )}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Income vs expenses */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <HugeiconsIcon icon={AnalyticsUpIcon} className="h-4 w-4 text-primary" />
                {t('trends_income_expenses_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <LineChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="key"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => tickLabels.get(Number(value)) ?? ''}
                  />
                  <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compactNumber} />
                  <ChartTooltip content={tooltipContent} />
                  {firstFutureKey !== undefined && lastKey !== undefined && (
                    <ReferenceArea
                      x1={firstFutureKey}
                      x2={lastKey}
                      fill="var(--primary)"
                      fillOpacity={0.04}
                      strokeOpacity={0}
                    />
                  )}
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="incomeActual"
                    type="monotone"
                    stroke="var(--color-incomeActual)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="expensesActual"
                    type="monotone"
                    stroke="var(--color-expensesActual)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="incomeForecast"
                    type="monotone"
                    stroke="var(--color-incomeForecast)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="none"
                  />
                  <Line
                    dataKey="expensesForecast"
                    type="monotone"
                    stroke="var(--color-expensesForecast)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="none"
                  />
                  {currentKey !== undefined && (
                    <ReferenceLine
                      x={currentKey}
                      stroke="var(--primary)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.8}
                      label={{
                        value: t('trends_today'),
                        position: 'insideTopRight',
                        fill: 'var(--muted-foreground)',
                        fontSize: 11,
                      }}
                    />
                  )}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
