import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resolveViewer, getMonth } from '@/lib/services/budget/budget';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const monthParam = parseInt(url.searchParams.get('month') ?? '');
    const yearParam = parseInt(url.searchParams.get('year') ?? '');
    const month = Number.isInteger(monthParam) && monthParam >= 0 && monthParam <= 11 ? monthParam : now.getMonth();
    const year = Number.isInteger(yearParam) && yearParam >= 1970 && yearParam <= 9999 ? yearParam : now.getFullYear();

    const viewer = await resolveViewer(session.user.id);
    if (!viewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(await getMonth(viewer, year, month));
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
