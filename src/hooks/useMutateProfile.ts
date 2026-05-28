import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaxpayerProfile } from '@/types/taxpayer';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { encrypt } from '@/lib/encryption';

export function useMutateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useTaxpayerStore((state) => state.setProfile);

  return useMutation({
    mutationFn: async (profileData: TaxpayerProfile) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Pengguna tidak terautentikasi.');

      // Melakukan upsert data ke tabel public.profiles berbasis user.id (termasuk kolom personalisasi AI baru)
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.fullName,
          taxpayer_type: profileData.taxpayerType,
          nik: '',
          npwp: '',
          nik_encrypted: encrypt(profileData.nik),
          npwp_encrypted: encrypt(profileData.npwp),
          phone_number: profileData.phoneNumber,
          username: profileData.username || null,
          avatar_url: profileData.avatarUrl || null,
          headline: profileData.headline || null,
          about: profileData.about || null,
          domicile: profileData.domicile || null,
          birth_place: profileData.birthPlace || null,
          birth_date: profileData.birthDate || null,
          gender: profileData.gender || null,
          current_company: profileData.currentCompany || null,
          skills: profileData.skills || null,
          hobbies_activities: profileData.hobbiesActivities || null,
          portfolio_url: profileData.portfolioUrl || null,
          certificate_name: profileData.certificateName || null,
          specialization_interests: profileData.specializationInterests || null,
          discovery_source: profileData.discoverySource || null,
          expected_materials: profileData.expectedMaterials || null,
          occupation: profileData.occupation || null,
          education: profileData.education || null,
          marital_status: profileData.maritalStatus || null,
          dependents: profileData.dependents !== undefined ? profileData.dependents : 0,
          hobbies: profileData.hobbies || null,
        })
        .select()
        .single();

      // Jika terjadi error karena kolom AI belum dibuat di database (misal dependents, occupation dll),
      // maka sistem secara otomatis melakukan fallback dengan menyimpan profil dasar saja.
      if (error && (error.message.includes('dependents') || error.message.includes('column'))) {
        console.warn('Failing back to basic profile upsert due to missing columns in DB:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: profileData.fullName,
            taxpayer_type: profileData.taxpayerType,
            nik: '',
            npwp: '',
            nik_encrypted: encrypt(profileData.nik),
            npwp_encrypted: encrypt(profileData.npwp),
            phone_number: profileData.phoneNumber,
          })
          .select()
          .single();

        if (fallbackError) throw new Error(fallbackError.message);
        return fallbackData;
      }

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      // Sinkronisasi data ke Zustand store global secara real-time
      setProfile({
        fullName: profileData.fullName,
        taxpayerType: profileData.taxpayerType,
        nik: profileData.nik,
        npwp: profileData.npwp,
        phoneNumber: data.phone_number,
        username: data.username,
        avatarUrl: data.avatar_url,
        headline: data.headline,
        about: data.about,
        domicile: data.domicile,
        birthPlace: data.birth_place,
        birthDate: data.birth_date,
        gender: data.gender,
        currentCompany: data.current_company,
        skills: data.skills,
        hobbiesActivities: data.hobbies_activities,
        portfolioUrl: data.portfolio_url,
        certificateName: data.certificate_name,
        specializationInterests: data.specialization_interests,
        discoverySource: data.discovery_source,
        expectedMaterials: data.expected_materials,
        occupation: data.occupation,
        education: data.education,
        maritalStatus: data.marital_status,
        dependents: data.dependents,
        hobbies: data.hobbies,
      });
      // Menghapus cache query profil lama agar diperbarui secara otomatis
      queryClient.invalidateQueries({ queryKey: ['taxpayer_profile'] });
    },
  });
}
