/**
 * Creates isolated, resettable accounts for App Store and Play Store screenshots.
 *
 * The script only ever deletes the reserved accounts declared in
 * `SCREENSHOT_ACCOUNTS`. Remote databases require an explicit opt-in.
 */
import { inArray, eq } from 'drizzle-orm';
import {
  buildAppStoreScreenshotFixture,
  SCREENSHOT_ACCOUNTS,
} from '@/lib/fixtures/app-store-screenshots';
import type { ScreenshotLocale } from '@/lib/fixtures/app-store-screenshots';
import {
  categories,
  listItems,
  lists,
  transactions,
  users,
} from '@/lib/db/schema';
import { fromKey } from '@/lib/services/budget/keys';

type Arguments = {
  locales: ScreenshotLocale[];
  dryRun: boolean;
};

function parseArguments(argv: string[]): Arguments {
  const localeIndex = argv.indexOf('--locale');
  const requestedLocale = localeIndex === -1 ? 'all' : argv[localeIndex + 1];

  if (!['all', 'en', 'fr'].includes(requestedLocale)) {
    throw new Error('Use --locale en, --locale fr, or --locale all.');
  }

  return {
    locales: requestedLocale === 'all'
      ? ['en', 'fr']
      : [requestedLocale as ScreenshotLocale],
    dryRun: argv.includes('--dry-run'),
  };
}

function isLocalDatabase(databaseUrl: string) {
  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL URL.');
  }

  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function assertSafeDatabase(databaseUrl: string) {
  if (
    !isLocalDatabase(databaseUrl) &&
    process.env.SCREENSHOT_SEED_ALLOW_REMOTE !== 'true'
  ) {
    throw new Error(
      'Refusing to seed a remote database. Use a dedicated preview/staging database ' +
      'and set SCREENSHOT_SEED_ALLOW_REMOTE=true explicitly.'
    );
  }
}

function labelMonth(key: number) {
  const { year, month } = fromKey(key);
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));

  if (args.dryRun) {
    for (const locale of args.locales) {
      const fixture = buildAppStoreScreenshotFixture({
        locale,
        userId: `dry-run-${locale}-user`,
        partnerId: `dry-run-${locale}-partner`,
      });
      console.log(
        `${locale.toUpperCase()}: ${fixture.transactions.length} transactions, ` +
        `${fixture.lists.length} lists, ${fixture.listItems.length} items, ` +
        `${labelMonth(fixture.firstMonth)} → ${labelMonth(fixture.currentMonth)}`
      );
    }
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const password = process.env.SCREENSHOT_SEED_PASSWORD;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }
  if (!password || password.length < 8) {
    throw new Error('SCREENSHOT_SEED_PASSWORD must contain at least 8 characters.');
  }

  assertSafeDatabase(databaseUrl);

  const [{ db }, { auth }] = await Promise.all([
    import('@/lib/db'),
    import('@/lib/auth'),
  ]);

  for (const locale of args.locales) {
    const account = SCREENSHOT_ACCOUNTS[locale];
    const emails = [account.email, account.partnerEmail];

    // Resetting these reserved accounts makes every run deterministic while
    // limiting the destructive scope to data created by this script.
    await db.delete(users).where(inArray(users.email, emails));

    const primary = await auth.api.signUpEmail({
      body: {
        email: account.email,
        name: account.name,
        password,
      },
    });
    const partner = await auth.api.signUpEmail({
      body: {
        email: account.partnerEmail,
        name: account.partnerName,
        password,
      },
    });

    const fixture = buildAppStoreScreenshotFixture({
      locale,
      userId: primary.user.id,
      partnerId: partner.user.id,
    });

    await db.transaction(async tx => {
      await tx
        .update(users)
        .set({
          partnerId: partner.user.id,
          currency: 'EUR',
          emailVerified: true,
        })
        .where(eq(users.id, primary.user.id));
      await tx
        .update(users)
        .set({
          partnerId: primary.user.id,
          currency: 'EUR',
          emailVerified: true,
        })
        .where(eq(users.id, partner.user.id));

      await tx.insert(categories).values(fixture.categories);
      await tx.insert(transactions).values(fixture.transactions);
      await tx.insert(lists).values(fixture.lists);
      await tx.insert(listItems).values(fixture.listItems);
    });

    console.log(`\n${locale.toUpperCase()} screenshot account`);
    console.log(`  email        ${account.email}`);
    console.log(`  partner      ${account.partnerName}`);
    console.log(`  history      ${labelMonth(fixture.firstMonth)} → ${labelMonth(fixture.currentMonth)}`);
    console.log(`  transactions ${fixture.transactions.length}`);
    console.log(`  lists        ${fixture.lists.length}`);
  }

  console.log('\nThe password is the value of SCREENSHOT_SEED_PASSWORD.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
