/* eslint-disable */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json(
    { success: true, data: { id: 'mock-id' } },
    { status: 201 }
  );
}
