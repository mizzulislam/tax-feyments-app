-- Mengaktifkan ekstensi kriptografi bawaan Postgres jika belum ada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tambah kolom baru untuk data terenkripsi
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nik_encrypted text,
ADD COLUMN IF NOT EXISTS npwp_encrypted text;

-- Fungsi trigger untuk enkripsi otomatis saat data dimasukkan atau diubah
CREATE OR REPLACE FUNCTION public.encrypt_taxpayer_identifiers()
RETURNS TRIGGER AS $$
DECLARE
    -- Kunci enkripsi aplikasi yang aman
    crypto_secret TEXT := current_setting('app.settings.crypto_secret', true);
BEGIN
    IF crypto_secret IS NULL THEN
        crypto_secret := 'MY_TAX_SECURE_PASSPHRASE_KEY_2026'; -- Fallback
    END IF;

    -- Enkripsi kolom NIK jika diisi
    IF NEW.nik IS NOT NULL AND NEW.nik <> '' THEN
        NEW.nik_encrypted := encode(pgp_sym_encrypt(NEW.nik, crypto_secret), 'hex');
    END IF;

    -- Enkripsi kolom NPWP jika diisi
    IF NEW.npwp IS NOT NULL AND NEW.npwp <> '' THEN
        NEW.npwp_encrypted := encode(pgp_sym_encrypt(NEW.npwp, crypto_secret), 'hex');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Memasang trigger pada tabel profiles
DROP TRIGGER IF EXISTS trigger_encrypt_profiles ON public.profiles;
CREATE TRIGGER trigger_encrypt_profiles
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.encrypt_taxpayer_identifiers();

CREATE OR REPLACE FUNCTION public.decrypt_tax_data(encrypted_hex TEXT)
RETURNS TEXT AS $$
DECLARE
    crypto_secret TEXT := current_setting('app.settings.crypto_secret', true);
BEGIN
    IF crypto_secret IS NULL THEN
        crypto_secret := 'MY_TAX_SECURE_PASSPHRASE_KEY_2026';
    END IF;

    IF encrypted_hex IS NULL OR encrypted_hex = '' THEN
        RETURN '';
    END IF;
    
    RETURN pgp_sym_decrypt(decode(encrypted_hex, 'hex'), crypto_secret);
EXCEPTION
    WHEN OTHERS THEN
        RETURN encrypted_hex;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
