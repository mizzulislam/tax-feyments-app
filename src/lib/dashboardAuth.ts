import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

type DashboardProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type DashboardSession = {
  userId: string;
  email: string | null;
  profile: DashboardProfile;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Konfigurasi Supabase publik belum lengkap.');
  }

  return { supabaseUrl, supabaseAnonKey };
}

export const createDashboardServerClient = cache(async () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write refreshed cookies.
          // Route handlers/API calls still validate auth at data boundaries.
        }
      },
    },
  });
});

export const getDashboardSession = cache(async (): Promise<DashboardSession | null> => {
  const cookieStore = await cookies();
  if (cookieStore.get('demo_mode')?.value === 'true') {
    return {
      userId: 'demo-user-id',
      email: null,
      profile: {
        id: 'demo-user-id',
        full_name: null,
        username: null,
        avatar_url: null,
        role: 'user',
      },
    };
  }

  const supabase = await createDashboardServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle<DashboardProfile>();

  if (profileError) {
    return null;
  }

  if (!profile) {
    return {
      userId: user.id,
      email: user.email || null,
      profile: {
        id: user.id,
        full_name: null,
        username: null,
        avatar_url: null,
        role: null,
      },
    };
  }

  return {
    userId: user.id,
    email: user.email || null,
    profile,
  };
});

export async function requireDashboardSession() {
  const session = await getDashboardSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}
