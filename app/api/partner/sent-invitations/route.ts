import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { partnerInvitations, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending invitations sent by this user
    const invitations = await db
      .select({
        id: partnerInvitations.id,
        token: partnerInvitations.token,
        status: partnerInvitations.status,
        createdAt: partnerInvitations.createdAt,
        expiresAt: partnerInvitations.expiresAt,
        toUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(partnerInvitations)
      .innerJoin(users, eq(partnerInvitations.toUserId, users.id))
      .where(and(
        eq(partnerInvitations.fromUserId, session.user.id),
        eq(partnerInvitations.status, 'pending')
      ))
      .orderBy(partnerInvitations.createdAt);

    // Filter out expired invitations and mark them as expired
    const now = new Date();
    const expiredIds: string[] = [];
    const validInvitations = invitations.filter(inv => {
      if (inv.expiresAt <= now) {
        expiredIds.push(inv.id);
        return false;
      }
      return true;
    });

    // Update expired invitations in batch
    if (expiredIds.length > 0) {
      await Promise.all(expiredIds.map(id => 
        db
          .update(partnerInvitations)
          .set({ status: 'expired' })
          .where(eq(partnerInvitations.id, id))
      ));
    }

    return NextResponse.json({ invitations: validInvitations });

  } catch (error) {
    console.error('Error fetching sent invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}