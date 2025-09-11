import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PartnerService } from '@/lib/services/partner';
import { z } from 'zod';

const inviteSchema = z.object({
  toUserId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = inviteSchema.parse(body);

    const invitation = await PartnerService.invitePartner(session.user.id, validatedData.toUserId);
    
    return NextResponse.json({ 
      message: 'Partner invitation sent successfully',
      invitation: {
        id: invitation.id,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Error sending partner invitation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}