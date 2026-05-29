import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChartOfAccount, Transaction } from '@/lib/accountingEngine';

export function useAccounting() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('account_code', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet (migration not run)
          setAccounts([]);
          return;
        }
        throw error;
      }
      setAccounts(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat akun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, loading, error, refetch: fetchAccounts };
}
