-- Menambahkan tabel gamification untuk melacak streak & points pengguna
CREATE TABLE IF NOT EXISTS public.gamification (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    points INT DEFAULT 0 NOT NULL,
    current_streak INT DEFAULT 0 NOT NULL,
    max_streak INT DEFAULT 0 NOT NULL,
    last_active_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view their own gamification data" 
    ON public.gamification FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "User can insert their own gamification data" 
    ON public.gamification FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update their own gamification data" 
    ON public.gamification FOR UPDATE 
    USING (auth.uid() = user_id);

-- Fungsi trigger untuk memperbarui updated_at
CREATE OR REPLACE FUNCTION public.update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gamification
    BEFORE UPDATE ON public.gamification
    FOR EACH ROW EXECUTE FUNCTION public.update_gamification_updated_at();

-- Fungsi untuk memastikan entri gamification dibuat saat user dibuat
CREATE OR REPLACE FUNCTION public.create_gamification_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gamification (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Memicu fungsi ketika profil baru dimasukkan
CREATE TRIGGER trigger_create_gamification
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_gamification_on_signup();
