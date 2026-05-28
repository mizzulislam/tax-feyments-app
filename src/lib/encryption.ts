import CryptoJS from 'crypto-js';

// Gunakan key statis untuk keperluan demo MVP jika env tidak ada
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'MY_TAX_SECURE_PASSPHRASE_KEY_2026_CLIENT';

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return ciphertext; // Fallback jika gagal dekrip
  }
}

export function maskNIK(nik: string): string {
  if (!nik) return '';
  if (nik.length !== 16) return '****************';
  return `${nik.slice(0, 4)}********${nik.slice(-4)}`;
}

export function maskNPWP(npwp: string): string {
  if (!npwp) return '';
  const clean = npwp.replace(/\D/g, '');
  if (clean.length < 9) return npwp;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.***.*-***.***`;
}
