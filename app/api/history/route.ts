import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resolveViewer, getRange } from '@/lib/services/budget/budget';
import { currentMonthKey } from '@/lib/services/budget/keys';

const MAX_SPAN = 36;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const monthsParam = parseInt(url.searchParams.get('months') ?? '');
    const months = Number.isInteger(monthsParam) && monthsParam >= 1 && monthsParam <= 24 ? monthsParam : 12;

    // Additive: callers that don't ask for a forecast get exactly the range they always did.
    const futureParam = parseInt(url.searchParams.get('future') ?? '');
    const requestedFuture = Number.isInteger(futureParam) && futureParam >= 0 ? futureParam : 0;
    const future = Math.min(requestedFuture, MAX_SPAN - months);

    const current = currentMonthKey();
    const viewer = await resolveViewer(session.user.id);
    if (!viewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const history = await getRange(viewer, current - (months - 1), current + future);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
