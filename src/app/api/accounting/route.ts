import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateFinancialStatements } from '@/lib/accountingEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const report = await generateFinancialStatements(supabase, userId);
    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
