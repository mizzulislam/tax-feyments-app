# **🔒 Keamanan Data Sensitif Finansial & Enkripsi (UU PDP)**

## **Tingkat Keparahan: Tinggi (Pelanggaran Kepatuhan Regulasi Data Pribadi)**

### **🚨 Potensi Bahaya (Exploit Scenario)**

Data wajib pajak seperti Nomor Induk Kependudukan (NIK) dan Nomor Pokok Wajib Pajak (NPWP) saat ini disimpan di database dalam bentuk teks biasa. Jika panel admin (/admin) langsung menampilkan string mentah ini, maka:

1. Administrator internal yang tidak berkepentingan dapat melihat data finansial rahasia pengguna secara ilegal.  
2. Kebocoran kredensial admin akan mengekspos data pribadi seluruh pengguna, yang melanggar ketentuan hukum **UU Pelindungan Data Pribadi (UU PDP)** dengan ancaman denda berat.

### **🛠️ Solusi Arsitektural & Perbaikan Skema**

Kita harus menerapkan strategi pengamanan ganda:

1. **At-Rest Encryption:** Mengenkripsi data langsung di tingkat database PostgreSQL menggunakan modul pgcrypto sehingga data yang disimpan di disk berupa *ciphertext*.  
2. **UI Masking:** Data disamarkan pada antarmuka admin dan hanya didekripsi via token otorisasi aman (Secured Server Action/API) jika dibutuhkan untuk proses verifikasi dokumen.

#### **Langkah 1: Jalankan Script Migrasi Database di Supabase SQL Editor**

Jalankan script database DDL berikut untuk memasang enkripsi otomatis berbasis kunci simetris rahasia (*symmetric key encryption*):

\-- Mengaktifkan ekstensi kriptografi bawaan Postgres jika belum ada  
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\-- Fungsi trigger untuk enkripsi otomatis saat data dimasukkan atau diubah  
CREATE OR REPLACE FUNCTION public.encrypt\_taxpayer\_identifiers()  
RETURNS TRIGGER AS $$  
DECLARE  
    \-- Kunci enkripsi aplikasi yang aman. Di lingkungan produksi sesungguhnya,  
    \-- kunci ini harus diakses secara aman lewat Vault atau environment variable.  
    crypto\_secret TEXT := 'MY\_TAX\_SECURE\_PASSPHRASE\_KEY\_2026';  
BEGIN  
    \-- Enkripsi kolom NIK jika diisi dan belum dalam bentuk terenkripsi  
    IF NEW.nik IS NOT NULL AND NEW.nik \<\> '' AND NOT NEW.nik STARTS WITH '\\x' THEN  
        NEW.nik := encode(pgp\_sym\_encrypt(NEW.nik, crypto\_secret), 'hex');  
    END IF;

    \-- Enkripsi kolom NPWP jika diisi dan belum dalam bentuk terenkripsi  
    IF NEW.npwp IS NOT NULL AND NEW.npwp \<\> '' AND NOT NEW.npwp STARTS WITH '\\x' THEN  
        NEW.npwp := encode(pgp\_sym\_encrypt(NEW.npwp, crypto\_secret), 'hex');  
    END IF;

    RETURN NEW;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;

\-- Memasang trigger pada tabel profiles  
DROP TRIGGER IF EXISTS trigger\_encrypt\_profiles ON public.profiles;  
CREATE TRIGGER trigger\_encrypt\_profiles  
    BEFORE INSERT OR UPDATE ON public.profiles  
    FOR EACH ROW EXECUTE FUNCTION public.encrypt\_taxpayer\_identifiers();

Fungsi dekripsi di database yang hanya bisa diakses oleh fungsi berkewenangan SECURITY DEFINER:

CREATE OR REPLACE FUNCTION public.decrypt\_tax\_data(encrypted\_hex TEXT)  
RETURNS TEXT AS $$  
DECLARE  
    crypto\_secret TEXT := 'MY\_TAX\_SECURE\_PASSPHRASE\_KEY\_2026';  
BEGIN  
    IF encrypted\_hex IS NULL OR encrypted\_hex \= '' THEN  
        RETURN '';  
    END IF;  
      
    RETURN pgp\_sym\_decrypt(decode(encrypted\_hex, 'hex'), crypto\_secret);  
EXCEPTION  
    WHEN OTHERS THEN  
        \-- Jika gagal dekrip (misal bukan hex valid), kembalikan data apa adanya untuk kompatibilitas retroaktif  
        RETURN encrypted\_hex;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;

#### **Langkah 2: Buat Komponen Proteksi Masking UI di Frontend Admin Panel**

Kita buat komponen React fungsional baru untuk dipasang di tabel Admin Panel (src/app/admin/page.tsx) guna mengamankan render visual data NIK/NPWP:

// src/components/admin/MaskedTaxData.tsx  
import React, { useState } from 'react';

interface MaskedTaxDataProps {  
  encryptedValue: string;  
  type: 'nik' | 'npwp';  
  userId: string;  
}

export const MaskedTaxData: React.FC\<MaskedTaxDataProps\> \= ({ encryptedValue, type, userId }) \=\> {  
  const \[revealedText, setRevealedText\] \= useState\<string\>('');  
  const \[isRevealed, setIsRevealed\] \= useState\<boolean\>(false);  
  const \[loading, setLoading\] \= useState\<boolean\>(false);

  const handleToggleReveal \= async () \=\> {  
    if (isRevealed) {  
      setIsRevealed(false);  
      return;  
    }

    setLoading(true);  
    try {  
      // Panggil Secured Server Endpoint untuk mendekripsi data secara aman  
      const response \= await fetch('/api/admin/decrypt-field', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({   
          encryptedValue,   
          fieldType: type,  
          targetUserId: userId  
        }),  
      });

      if (\!response.ok) {  
        throw new Error('Gagal mendekripsi data. Periksa hak akses Anda.');  
      }

      const data \= await response.json();  
      setRevealedText(data.plainText);  
      setIsRevealed(true);  
    } catch (err: any) {  
      console.error(err.message);  
    } finally {  
      setLoading(false);  
    }  
  };

  const getMaskedPlaceholder \= () \=\> {  
    return type \=== 'nik'   
      ? '3273\*\*\*\*\*\*\*\*\*\*\*'   
      : '01.\*\*\*.\*\*\*.\*-\*\*\*.\*\*\*';  
  };

  return (  
    \<div className="flex items-center gap-2 font-mono text-sm"\>  
      \<span className="tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded"\>  
        {isRevealed ? revealedText : getMaskedPlaceholder()}  
      \</span\>  
      \<button  
        onClick={handleToggleReveal}  
        disabled={loading}  
        className="px-2 py-1 text-xs rounded font-sans transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"  
      \>  
        {loading ? 'Memproses...' : isRevealed ? 'Sembunyikan' : 'Lihat'}  
      \</button\>  
    \</div\>  
  );  
};

### **✅ Kriteria Kelulusan Keamanan:**

* \[ \] Database profiles menyimpan string hex hasil sandi pgcrypto dan tidak menyimpan teks mentah untuk entri NIK/NPWP baru.  
* \[ \] Admin Panel tidak pernah me-render nilai NIK/NPWP asli secara langsung di HTML source code tanpa interaksi klik dari admin yang memiliki kredensial valid.  
* \[ \] Endpoint /api/admin/decrypt-field memiliki pengamanan RoleGuard yang memvalidasi bahwa aktor pemanggil adalah user dengan status role "admin".