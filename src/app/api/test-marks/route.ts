import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== TEST MARKS ROUTE CALLED ===');
  return NextResponse.json({ message: 'Test route works!' });
}
