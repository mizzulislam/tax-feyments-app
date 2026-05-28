import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { encryptedValue, fieldType, targetUserId } = await request.json();

    // 1. Verifikasi Authentication
    const authHeader = request.headers.get('Authorization');
    // Di aplikasi nyata, kita akan periksa auth token ini
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 2. Verifikasi Otorisasi (Hanya Admin)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // 3. Dekripsi
    const plainText = decrypt(encryptedValue);

    // 4. Catat ke Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: `VIEW_ENCRYPTED_${fieldType.toUpperCase()}`,
      target_user_id: targetUserId,
      severity: 'warning',
      details: { timestamp: new Date().toISOString() }
    });

    return NextResponse.json({ plainText });

  } catch (error: any) {
    console.error('Decryption error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
