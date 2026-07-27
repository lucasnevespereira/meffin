import { describe, expect, it } from 'vitest';
import {
  buildAppStoreScreenshotFixture,
  SCREENSHOT_ACCOUNTS,
} from './app-store-screenshots';

const now = new Date('2026-07-27T12:00:00.000Z');

describe('App Store screenshot fixture', () => {
  it('builds a complete, deterministic year in both locales', () => {
    const english = buildAppStoreScreenshotFixture({
      locale: 'en',
      userId: 'user-en',
      partnerId: 'partner-en',
      now,
    });
    const french = buildAppStoreScreenshotFixture({
      locale: 'fr',
      userId: 'user-fr',
      partnerId: 'partner-fr',
      now,
    });

    expect(english.currentMonth - english.firstMonth).toBe(11);
    expect(english.transactions).toHaveLength(french.transactions.length);
    expect(new Set(english.transactions.map(row => row.id)).size)
      .toBe(english.transactions.length);
    expect(english.transactions.some(row => row.description === 'Salary')).toBe(true);
    expect(french.transactions.some(row => row.description === 'Salaire')).toBe(true);
    expect(english.listItems.some(item => item.estimatedPrice === null)).toBe(true);
    expect(french.lists.every(list => list.isShared)).toBe(true);
  });

  it('uses reserved and distinct demo accounts', () => {
    const emails = Object.values(SCREENSHOT_ACCOUNTS)
      .flatMap(account => [account.email, account.partnerEmail]);

    expect(new Set(emails).size).toBe(4);
    expect(emails.every(email => email.endsWith('@demo.meffin.app'))).toBe(true);
  });

  it('keeps one occurrence per recurring series and month', () => {
    const fixture = buildAppStoreScreenshotFixture({
      locale: 'en',
      userId: 'user-en',
      partnerId: 'partner-en',
      now,
    });
    const occurrences = fixture.transactions
      .filter(row => row.seriesId)
      .map(row => `${row.seriesId}:${row.date?.slice(0, 7)}`);

    expect(new Set(occurrences).size).toBe(occurrences.length);
  });
});
