import { describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => {
  const invitation = {
    id: 'invite-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    status: 'pending',
    expiresAt: new Date('2099-01-01'),
  };
  let mutations = 0;

  function select(inTransaction: boolean, fields?: Record<string, unknown>) {
    const query = {
      from() { return query; },
      leftJoin() { return query; },
      where() { return query; },
      limit() { return query; },
      orderBy() { return query; },
      for() { return query; },
      then(resolve: (rows: unknown[]) => unknown, reject?: (error: unknown) => unknown) {
        const rows = fields && 'invitation' in fields
          ? [{
              invitation: { ...invitation },
              fromUser: { id: 'user-1', name: 'Sender', email: 'sender@example.com' },
              toUser: { id: 'user-2', name: 'Recipient', email: 'recipient@example.com' },
            }]
          : fields && 'status' in fields
            ? [{ status: 'pending', expiresAt: invitation.expiresAt }]
            : !fields
              ? []
            : inTransaction
              ? [
                  { id: 'user-1', partnerId: 'user-3' },
                  { id: 'user-2', partnerId: null },
                ]
              : [
                  { id: 'user-1', partnerId: null },
                  { id: 'user-2', partnerId: null },
                ];
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return query;
  }

  const tx = {
    select: (fields: Record<string, unknown>) => select(true, fields),
    update() { mutations++; return { set() { return { where() {} }; } }; },
    delete() { mutations++; return { where() {} }; },
  };
  const db = {
    select: (fields?: Record<string, unknown>) => select(false, fields),
    update() { mutations++; return { set() { return { where() {} }; } }; },
    insert() {
      const query = {
        values() { mutations++; return query; },
        async returning() { return [{ ...invitation }]; },
      };
      return query;
    },
    transaction<T>(callback: (transaction: typeof tx) => Promise<T>) { return callback(tx); },
  };

  return { db, get mutations() { return mutations; }, reset() { mutations = 0; } };
});

vi.mock('@/lib/db', () => ({ db: fixture.db }));

import { PartnerService } from './partner';
import { ServiceError } from '@/lib/errors';

describe('partner invitation acceptance', () => {
  it('rejects a partnership created by another request after the first read', async () => {
    fixture.reset();

    await expect(PartnerService.acceptInvitation('token', 'user-2'))
      .rejects.toEqual(new ServiceError('One of the users already has a partner', 409));
    expect(fixture.mutations).toBe(0);
  });
});

describe('partner invitation creation', () => {
  it('rejects an invitation to the same account', async () => {
    fixture.reset();

    await expect(PartnerService.invitePartner('user-1', 'user-1'))
      .rejects.toEqual(new ServiceError('You cannot invite yourself', 400));
    expect(fixture.mutations).toBe(0);
  });
});
