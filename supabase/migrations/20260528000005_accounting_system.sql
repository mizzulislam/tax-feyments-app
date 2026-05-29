CREATE TYPE normal_balance_type AS ENUM ('Debit', 'Credit');

CREATE TABLE chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_code VARCHAR(10) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  normal_balance normal_balance_type NOT NULL,
  is_temporary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tambahkan RLS untuk CoA
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own CoA" ON chart_of_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own CoA" ON chart_of_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CoA" ON chart_of_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own CoA" ON chart_of_accounts FOR DELETE USING (auth.uid() = user_id);

-- Kosongkan tabel transactions sebelum alter karena butuh relasi yg mandatory
TRUNCATE TABLE transactions;

ALTER TABLE transactions ADD COLUMN debit_account_id UUID REFERENCES chart_of_accounts(id) NOT NULL;
ALTER TABLE transactions ADD COLUMN credit_account_id UUID REFERENCES chart_of_accounts(id) NOT NULL;
ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR(50) NOT NULL;

-- Trigger untuk membuat default CoA setiap ada user baru
CREATE OR REPLACE FUNCTION seed_default_coa()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chart_of_accounts (user_id, account_code, account_name, normal_balance, is_temporary)
  VALUES
    (NEW.id, '1100', 'Kas & Bank', 'Debit', false),
    (NEW.id, '1200', 'Piutang Usaha', 'Debit', false),
    (NEW.id, '1300', 'Peralatan & Aset', 'Debit', false),
    (NEW.id, '2100', 'Hutang Usaha', 'Credit', false),
    (NEW.id, '3100', 'Modal Pemilik', 'Credit', false),
    (NEW.id, '3200', 'Laba Ditahan', 'Credit', false),
    (NEW.id, '4100', 'Pendapatan Usaha', 'Credit', true),
    (NEW.id, '4200', 'Pendapatan Lainnya', 'Credit', true),
    (NEW.id, '5100', 'Beban Operasional', 'Debit', true),
    (NEW.id, '5200', 'Beban Gaji & Upah', 'Debit', true),
    (NEW.id, '5300', 'Beban Pajak', 'Debit', true),
    (NEW.id, '5900', 'Beban Lainnya', 'Debit', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mencegah duplicate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_coa ON auth.users;
CREATE TRIGGER on_auth_user_created_coa
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_default_coa();

-- Seed untuk users yang sudah ada
INSERT INTO public.chart_of_accounts (user_id, account_code, account_name, normal_balance, is_temporary)
SELECT id, '1100', 'Kas & Bank', 'Debit', false FROM auth.users
UNION ALL SELECT id, '1200', 'Piutang Usaha', 'Debit', false FROM auth.users
UNION ALL SELECT id, '1300', 'Peralatan & Aset', 'Debit', false FROM auth.users
UNION ALL SELECT id, '2100', 'Hutang Usaha', 'Credit', false FROM auth.users
UNION ALL SELECT id, '3100', 'Modal Pemilik', 'Credit', false FROM auth.users
UNION ALL SELECT id, '3200', 'Laba Ditahan', 'Credit', false FROM auth.users
UNION ALL SELECT id, '4100', 'Pendapatan Usaha', 'Credit', true FROM auth.users
UNION ALL SELECT id, '4200', 'Pendapatan Lainnya', 'Credit', true FROM auth.users
UNION ALL SELECT id, '5100', 'Beban Operasional', 'Debit', true FROM auth.users
UNION ALL SELECT id, '5200', 'Beban Gaji & Upah', 'Debit', true FROM auth.users
UNION ALL SELECT id, '5300', 'Beban Pajak', 'Debit', true FROM auth.users
UNION ALL SELECT id, '5900', 'Beban Lainnya', 'Debit', true FROM auth.users;
