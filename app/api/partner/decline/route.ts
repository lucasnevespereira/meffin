import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { partnerInvitations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const declineSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = declineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { token } = validation.data;

    // Update invitation status to declined
    const result = await db
      .update(partnerInvitations)
      .set({ status: 'declined' })
      .where(and(
        eq(partnerInvitations.token, token),
        eq(partnerInvitations.toUserId, session.user.id),
        eq(partnerInvitations.status, 'pending')
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({
        error: 'Invitation not found or already processed'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
