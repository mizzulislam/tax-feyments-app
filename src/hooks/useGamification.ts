import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GamificationData {
  user_id: string;
  points: number;
  current_streak: number;
  max_streak: number;
  last_active_date: string | null;
}

export function useGamification() {
  return useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data as GamificationData | null;
    },
  });
}

export function useUpdateStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // In real scenario, this would be an RPC call to update the streak atomically based on current date
      // For now, let's just do a basic fetch and update logic
      const { data: currentData } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      
      let newStreak = 1;
      let newMax = 1;

      if (currentData) {
        if (currentData.last_active_date === today) {
          return currentData; // already checked in
        }

        const lastDate = new Date(currentData.last_active_date || '');
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = currentData.current_streak + 1;
        }
        
        newMax = Math.max(currentData.max_streak, newStreak);
      }

      const { data, error } = await supabase
        .from('gamification')
        .upsert({
          user_id: user.id,
          current_streak: newStreak,
          max_streak: newMax,
          last_active_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    }
  });
}
