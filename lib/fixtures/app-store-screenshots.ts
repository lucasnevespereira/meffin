import {
  categories,
  listItems,
  lists,
  transactions,
} from '../db/schema';
import {
  currentMonthKey,
  fromKey,
  occurrenceDate,
} from '../services/budget/keys';

export type ScreenshotLocale = 'en' | 'fr';

type TransactionInsert = typeof transactions.$inferInsert;
type CategoryInsert = typeof categories.$inferInsert;
type ListInsert = typeof lists.$inferInsert;
type ListItemInsert = typeof listItems.$inferInsert;

export const SCREENSHOT_ACCOUNTS = {
  en: {
    email: 'screenshots-en@demo.meffin.app',
    name: 'Jamie Taylor',
    partnerEmail: 'screenshots-en-partner@demo.meffin.app',
    partnerName: 'Alex Taylor',
  },
  fr: {
    email: 'screenshots-fr@demo.meffin.app',
    name: 'Camille Martin',
    partnerEmail: 'screenshots-fr-partner@demo.meffin.app',
    partnerName: 'Alex Martin',
  },
} as const satisfies Record<ScreenshotLocale, {
  email: string;
  name: string;
  partnerEmail: string;
  partnerName: string;
}>;

const COPY = {
  en: {
    salary: 'Salary',
    freelance: 'Freelance project',
    rent: 'Rent',
    internet: 'Internet',
    streaming: 'Streaming',
    gym: 'Gym',
    insurance: 'Home insurance',
    water: 'Water bill',
    flights: 'Flights to Lisbon',
    groceries: ['Weekly groceries', 'Farmers market', 'Supermarket'],
    dining: ['Dinner with friends', 'Coffee and lunch', 'Sunday brunch'],
    transport: ['Metro pass', 'Train tickets', 'Bike service'],
    shopping: ['Running shoes', 'Home supplies', 'Bookshop'],
    entertainment: ['Cinema', 'Concert tickets', 'Museum'],
    travelCategory: 'Travel',
    travelList: 'Lisbon trip',
    travelListDescription: 'Everything we need for our weekend away',
    groceriesList: 'Weekly groceries',
    groceriesListDescription: 'Shared household shopping',
    listItems: {
      flights: 'Flight tickets',
      hotel: 'Hotel',
      guide: 'City guide',
      passport: 'Check passports',
      vegetables: 'Fresh vegetables',
      coffee: 'Coffee',
      pasta: 'Pasta',
      detergent: 'Laundry detergent',
    },
  },
  fr: {
    salary: 'Salaire',
    freelance: 'Mission freelance',
    rent: 'Loyer',
    internet: 'Internet',
    streaming: 'Streaming',
    gym: 'Salle de sport',
    insurance: 'Assurance habitation',
    water: "Facture d'eau",
    flights: 'Billets pour Lisbonne',
    groceries: ['Courses de la semaine', 'Marché', 'Supermarché'],
    dining: ['Dîner entre amis', 'Café et déjeuner', 'Brunch du dimanche'],
    transport: ['Pass métro', 'Billets de train', 'Révision du vélo'],
    shopping: ['Chaussures de sport', 'Maison', 'Librairie'],
    entertainment: ['Cinéma', 'Billets de concert', 'Musée'],
    travelCategory: 'Voyages',
    travelList: 'Week-end à Lisbonne',
    travelListDescription: 'Tout préparer pour notre week-end',
    groceriesList: 'Courses de la semaine',
    groceriesListDescription: 'Liste partagée pour la maison',
    listItems: {
      flights: "Billets d'avion",
      hotel: 'Hôtel',
      guide: 'Guide de la ville',
      passport: 'Vérifier les passeports',
      vegetables: 'Légumes frais',
      coffee: 'Café',
      pasta: 'Pâtes',
      detergent: 'Lessive',
    },
  },
} as const;

type BuildOptions = {
  locale: ScreenshotLocale;
  userId: string;
  partnerId: string;
  now?: Date;
};

type ScreenshotFixture = {
  categories: CategoryInsert[];
  transactions: TransactionInsert[];
  lists: ListInsert[];
  listItems: ListItemInsert[];
  firstMonth: number;
  currentMonth: number;
};

const HISTORY_MONTHS = 12;

function stableId(locale: ScreenshotLocale, kind: string, suffix: string | number) {
  return `screenshot-${locale}-${kind}-${suffix}`;
}

function monthLabel(key: number) {
  const { year, month } = fromKey(key);
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function buildAppStoreScreenshotFixture({
  locale,
  userId,
  partnerId,
  now = new Date(),
}: BuildOptions): ScreenshotFixture {
  const copy = COPY[locale];
  const current = currentMonthKey(now);
  const firstMonth = current - (HISTORY_MONTHS - 1);
  const travelCategoryId = stableId(locale, 'category', 'travel');
  const rows: TransactionInsert[] = [];

  const baseTransaction = (
    id: string,
    ownerId: string,
    description: string,
    categoryId: string,
    amount: number,
    key: number,
    day: number
  ): TransactionInsert => ({
    id,
    userId: ownerId,
    createdBy: ownerId,
    categoryId,
    description,
    amount: amount.toFixed(2),
    date: occurrenceDate(key, day),
    isFixed: false,
    isPrivate: false,
    repeatType: 'once',
  });

  const addMonthlySeries = ({
    key,
    ownerId,
    description,
    categoryId,
    amount,
    day,
    startsAt = firstMonth,
    endMonth = null,
  }: {
    key: string;
    ownerId: string;
    description: string;
    categoryId: string;
    amount: number;
    day: number;
    startsAt?: number;
    endMonth?: number | null;
  }) => {
    const seriesId = stableId(locale, 'series', key);

    for (let month = startsAt; month <= current; month++) {
      rows.push({
        ...baseTransaction(
          stableId(locale, 'transaction', `${key}-${monthLabel(month)}`),
          ownerId,
          description,
          categoryId,
          amount,
          month,
          day
        ),
        isFixed: true,
        repeatType: endMonth === null ? 'forever' : 'until',
        seriesId,
        endMonth,
        endDate: endMonth === null ? null : occurrenceDate(endMonth, day),
      });
    }
  };

  addMonthlySeries({
    key: 'salary',
    ownerId: userId,
    description: copy.salary,
    categoryId: 'default_salary',
    amount: 3400,
    day: 28,
  });
  addMonthlySeries({
    key: 'freelance',
    ownerId: partnerId,
    description: copy.freelance,
    categoryId: 'default_freelance',
    amount: 720,
    day: 12,
  });
  addMonthlySeries({
    key: 'rent',
    ownerId: userId,
    description: copy.rent,
    categoryId: 'default_housing',
    amount: 1250,
    day: 5,
  });
  addMonthlySeries({
    key: 'internet',
    ownerId: partnerId,
    description: copy.internet,
    categoryId: 'default_utilities',
    amount: 39.99,
    day: 15,
  });
  addMonthlySeries({
    key: 'streaming',
    ownerId: userId,
    description: copy.streaming,
    categoryId: 'default_subscriptions',
    amount: 15.99,
    day: 20,
  });
  addMonthlySeries({
    key: 'gym',
    ownerId: userId,
    description: copy.gym,
    categoryId: 'default_healthcare',
    amount: 42,
    day: 2,
    startsAt: current - 5,
    endMonth: current + 1,
  });

  const annualId = stableId(locale, 'series', 'insurance');
  rows.push({
    ...baseTransaction(
      stableId(locale, 'transaction', 'insurance'),
      userId,
      copy.insurance,
      'default_insurance',
      420,
      current + 2,
      3
    ),
    isFixed: true,
    repeatType: 'annual',
    seriesId: annualId,
  });

  const variableAmounts = [
    [86.4, 42, 78, 64, 25],
    [94.2, 31, 78, 129, 38],
    [72.6, 54, 45, 47, 22],
    [105.8, 36, 78, 84, 32],
  ];

  for (let key = firstMonth; key <= current; key++) {
    const index = (key - firstMonth) % variableAmounts.length;
    const amounts = variableAmounts[index];
    const ownerId = index % 2 === 0 ? userId : partnerId;

    [
      [copy.groceries[index % copy.groceries.length], 'default_groceries', amounts[0], 7],
      [copy.dining[index % copy.dining.length], 'default_dining', amounts[1], 14],
      [copy.transport[index % copy.transport.length], 'default_transportation', amounts[2], 9],
      [copy.shopping[index % copy.shopping.length], 'default_shopping', amounts[3], 19],
      [copy.entertainment[index % copy.entertainment.length], 'default_entertainment', amounts[4], 23],
    ].forEach(([description, categoryId, amount, day], itemIndex) => {
      rows.push(baseTransaction(
        stableId(locale, 'transaction', `variable-${monthLabel(key)}-${itemIndex}`),
        ownerId,
        description as string,
        categoryId as string,
        amount as number,
        key,
        day as number
      ));
    });
  }

  rows.push(baseTransaction(
    stableId(locale, 'transaction', 'planned-water'),
    partnerId,
    copy.water,
    'default_utilities',
    86.5,
    current + 1,
    14
  ));
  rows.push(baseTransaction(
    stableId(locale, 'transaction', 'planned-flights'),
    userId,
    copy.flights,
    travelCategoryId,
    420,
    current + 2,
    9
  ));

  const travelListId = stableId(locale, 'list', 'travel');
  const groceriesListId = stableId(locale, 'list', 'groceries');

  return {
    currentMonth: current,
    firstMonth,
    categories: [
      {
        id: travelCategoryId,
        userId,
        createdBy: userId,
        name: copy.travelCategory,
        type: 'expense',
        color: '#14B8A6',
      },
    ],
    transactions: rows,
    lists: [
      {
        id: travelListId,
        userId,
        createdBy: userId,
        title: copy.travelList,
        description: copy.travelListDescription,
        color: '#F97316',
        categoryId: travelCategoryId,
        isShared: true,
      },
      {
        id: groceriesListId,
        userId: partnerId,
        createdBy: partnerId,
        title: copy.groceriesList,
        description: copy.groceriesListDescription,
        color: '#10B981',
        categoryId: 'default_groceries',
        isShared: true,
      },
    ],
    listItems: [
      {
        id: stableId(locale, 'item', 'flights'),
        listId: travelListId,
        createdBy: userId,
        name: copy.listItems.flights,
        estimatedPrice: '420.00',
        categoryId: travelCategoryId,
      },
      {
        id: stableId(locale, 'item', 'hotel'),
        listId: travelListId,
        createdBy: partnerId,
        name: copy.listItems.hotel,
        estimatedPrice: '310.00',
        categoryId: travelCategoryId,
      },
      {
        id: stableId(locale, 'item', 'guide'),
        listId: travelListId,
        createdBy: userId,
        name: copy.listItems.guide,
        estimatedPrice: '18.00',
        categoryId: travelCategoryId,
        isChecked: true,
        checkedAt: occurrenceDate(current, 4),
      },
      {
        id: stableId(locale, 'item', 'passport'),
        listId: travelListId,
        createdBy: partnerId,
        name: copy.listItems.passport,
        estimatedPrice: null,
        categoryId: travelCategoryId,
      },
      ...[
        [copy.listItems.vegetables, '24.00'],
        [copy.listItems.coffee, '8.50'],
        [copy.listItems.pasta, '5.20'],
        [copy.listItems.detergent, '11.90'],
      ].map(([name, estimatedPrice], index): ListItemInsert => ({
        id: stableId(locale, 'item', `groceries-${index}`),
        listId: groceriesListId,
        createdBy: index % 2 === 0 ? userId : partnerId,
        name,
        estimatedPrice,
        categoryId: 'default_groceries',
        isChecked: index === 0,
        checkedAt: index === 0 ? occurrenceDate(current, 4) : null,
      })),
    ],
  };
}
