import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PartnerService } from '@/lib/services/partner';
import { ServiceError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await PartnerService.removePartnership(session.user.id);
    
    return NextResponse.json({ 
      message: 'Partnership removed successfully'
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error removing partnership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}