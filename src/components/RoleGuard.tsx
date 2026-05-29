'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { decrypt } from '@/lib/encryption';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('user' | 'consultant' | 'admin')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const setProfile = useTaxpayerStore((state) => state.setProfile);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        // Ambil data profil dari database untuk memverifikasi role terkini
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !profile) {
          router.replace('/login');
          return;
        }

        const userRole = (profile.role as 'user' | 'consultant' | 'admin') || 'user';

        let nikDecrypted = profile.nik || '';
        if (profile.nik_encrypted) {
          nikDecrypted = decrypt(profile.nik_encrypted) || nikDecrypted;
        }

        let npwpDecrypted = profile.npwp || '';
        if (profile.npwp_encrypted) {
          npwpDecrypted = decrypt(profile.npwp_encrypted) || npwpDecrypted;
        }

        // Update Zustand store secara real-time agar sinkron
        setProfile({
          fullName: profile.full_name,
          taxpayerType: profile.taxpayer_type as 'pribadi' | 'badan',
          nik: nikDecrypted,
          npwp: npwpDecrypted,
          phoneNumber: profile.phone_number,
          occupation: profile.occupation,
          education: profile.education,
          maritalStatus: profile.marital_status,
          dependents: profile.dependents,
          hobbies: profile.hobbies,
          role: userRole, // Field role baru ditambahkan ke global store
        });

        if (!allowedRoles.includes(userRole)) {
          // Arahkan kembali ke /dashboard dengan menyertakan parameter error
          router.replace('/dashboard?error=Akses%20Ditolak:%20Hak%2520akses%2520terbatas%2520untuk%2520Admin!');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error('Error during role verification:', err);
        router.replace('/dashboard?error=Gagal%20memverifikasi%20hak%20akses.');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [router, allowedRoles, setProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500/20"></div>
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
