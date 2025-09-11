import { db } from '../db';
import { users, partnerInvitations } from '../schema';
import { eq, and, or, not, ilike } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

export type PartnerInvitation = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

export type UserSearchResult = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

export class PartnerService {
  // Search for users by name or email
  static async searchUsers(query: string, currentUserId: string): Promise<UserSearchResult[]> {
    const searchResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(
        and(
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.email, `%${query}%`)
          ),
          // Exclude current user
          // Exclude users who already have a partner
          // Exclude users who are already the current user's partner
        )
      )
      .limit(10);

    // Filter out users with partners and current user
    return searchResults
      .filter(user =>
        user.id !== currentUserId &&
        !user.partnerId
      )
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || undefined,
      }));
  }

  // Send partner invitation
  static async invitePartner(fromUserId: string, toUserId: string) {
    // Check if users already have partners
    const users_check = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(or(eq(users.id, fromUserId), eq(users.id, toUserId)));

    const fromUser = users_check.find(u => u.id === fromUserId);
    const toUser = users_check.find(u => u.id === toUserId);

    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }

    if (fromUser.partnerId || toUser.partnerId) {
      throw new Error('One of the users already has a partner');
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .select()
      .from(partnerInvitations)
      .where(
        and(
          or(
            and(eq(partnerInvitations.fromUserId, fromUserId), eq(partnerInvitations.toUserId, toUserId)),
            and(eq(partnerInvitations.fromUserId, toUserId), eq(partnerInvitations.toUserId, fromUserId))
          ),
          eq(partnerInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length) {
      throw new Error('There is already a pending invitation between these users');
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db
      .insert(partnerInvitations)
      .values({
        id: crypto.randomUUID(),
        fromUserId,
        toUserId,
        token,
        expiresAt,
      })
      .returning();

    // Skip email - using in-app notifications instead
    console.log(`Partner invitation created: ${fromUser.name} invited ${toUser.name}`);

    return invitation;
  }

  // Accept partner invitation
  static async acceptInvitation(token: string) {
    const invitation = await db
      .select({
        invitation: partnerInvitations,
        fromUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        toUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(partnerInvitations)
      .leftJoin(users, eq(partnerInvitations.fromUserId, users.id))
      .where(and(
        eq(partnerInvitations.token, token),
        eq(partnerInvitations.status, 'pending')
      ))
      .limit(1);

    if (!invitation.length) {
      throw new Error('Invalid or expired invitation');
    }

    const { invitation: inv, fromUser, toUser } = invitation[0];

    // Check if invitation has expired
    if (new Date() > inv.expiresAt) {
      await db
        .update(partnerInvitations)
        .set({ status: 'expired' })
        .where(eq(partnerInvitations.id, inv.id));

      throw new Error('Invitation has expired');
    }

    // Check if either user already has a partner
    const currentUsers = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(or(eq(users.id, inv.fromUserId), eq(users.id, inv.toUserId)));

    if (currentUsers.some(u => u.partnerId)) {
      throw new Error('One of the users already has a partner');
    }

    // Accept invitation and create partnership
    await db.transaction(async (tx) => {
      // First, clean up any existing accepted invitations between these users
      await tx
        .delete(partnerInvitations)
        .where(
          and(
            or(
              and(eq(partnerInvitations.fromUserId, inv.fromUserId), eq(partnerInvitations.toUserId, inv.toUserId)),
              and(eq(partnerInvitations.fromUserId, inv.toUserId), eq(partnerInvitations.toUserId, inv.fromUserId))
            ),
            eq(partnerInvitations.status, 'accepted')
          )
        );

      // Update invitation status
      await tx
        .update(partnerInvitations)
        .set({ status: 'accepted' })
        .where(eq(partnerInvitations.id, inv.id));

      // Set partners for both users
      await tx
        .update(users)
        .set({ partnerId: inv.toUserId })
        .where(eq(users.id, inv.fromUserId));

      await tx
        .update(users)
        .set({ partnerId: inv.fromUserId })
        .where(eq(users.id, inv.toUserId));

      // Clean up any other pending invitations involving these users
      await tx
        .update(partnerInvitations)
        .set({ status: 'expired' })
        .where(
          and(
            or(
              eq(partnerInvitations.fromUserId, inv.fromUserId),
              eq(partnerInvitations.toUserId, inv.fromUserId),
              eq(partnerInvitations.fromUserId, inv.toUserId),
              eq(partnerInvitations.toUserId, inv.toUserId)
            ),
            eq(partnerInvitations.status, 'pending'),
            not(eq(partnerInvitations.id, inv.id))
          )
        );
    });

    return { fromUser, toUser };
  }

  // Remove partnership
  static async removePartnership(userId: string) {
    const user = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || !user[0].partnerId) {
      throw new Error('User has no partner');
    }

    const partnerId = user[0].partnerId;

    // IMPORTANT: Data preservation strategy
    // When partnership ends, each user keeps their own created data
    // No data is deleted - transactions/categories remain with their creators

    await db.transaction(async (tx) => {
      // Remove partnership relationship for both users
      await tx
        .update(users)
        .set({ partnerId: null })
        .where(eq(users.id, userId));

      await tx
        .update(users)
        .set({ partnerId: null })
        .where(eq(users.id, partnerId));

      // Clean up accepted invitation records between these users
      await tx
        .delete(partnerInvitations)
        .where(
          and(
            or(
              and(eq(partnerInvitations.fromUserId, userId), eq(partnerInvitations.toUserId, partnerId)),
              and(eq(partnerInvitations.fromUserId, partnerId), eq(partnerInvitations.toUserId, userId))
            ),
            eq(partnerInvitations.status, 'accepted')
          )
        );

      // Note: We deliberately DO NOT modify transactions or categories
      // Each user will only see their own created data going forward
      // The createdBy field ensures proper ownership tracking
      // If users want to share specific transactions, they need a new partnership
    });

    return { success: true };
  }

  // Get user's partner info
  static async getPartnerInfo(userId: string) {
    const partner = alias(users, 'partner');

    const result = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          partnerId: users.partnerId,
        },
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          image: partner.image,
        },
      })
      .from(users)
      .leftJoin(partner, eq(users.partnerId, partner.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result.length) {
      throw new Error('User not found');
    }

    return {
      user: result[0].user,
      partner: result[0].partner,
    };
  }
}
