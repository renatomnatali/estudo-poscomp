import { NextResponse } from 'next/server';

import { getDashboardSummary } from '@/lib/study-data';

export async function GET() {
  return NextResponse.json(getDashboardSummary());
}
