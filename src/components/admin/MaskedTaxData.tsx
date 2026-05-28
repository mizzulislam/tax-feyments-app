import React, { useState } from 'react';

interface MaskedTaxDataProps {
  encryptedValue: string | null | undefined;
  type: 'nik' | 'npwp';
  userId: string;
}

export const MaskedTaxData: React.FC<MaskedTaxDataProps> = ({ encryptedValue, type, userId }) => {
  const [revealedText, setRevealedText] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    setLoading(true);
    try {
      // Panggil Secured Server Endpoint untuk mendekripsi data secara aman
      const response = await fetch('/api/admin/decrypt-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          encryptedValue, 
          fieldType: type,
          targetUserId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mendekripsi data. Periksa hak akses Anda.');
      }

      const data = await response.json();
      setRevealedText(data.plainText);
      setIsRevealed(true);
    } catch (err: any) {
      console.error(err.message);
      alert('Gagal membuka data. Anda mungkin tidak memiliki izin.');
    } finally {
      setLoading(false);
    }
  };

  const getMaskedPlaceholder = () => {
    if (!encryptedValue) return 'Belum diisi';
    return type === 'nik' 
      ? '3273***********' 
      : '01.***.***.*-***.***';
  };

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
        {isRevealed ? revealedText : getMaskedPlaceholder()}
      </span>
      {encryptedValue && (
        <button
          onClick={handleToggleReveal}
          disabled={loading}
          className="px-2 py-1 text-xs rounded font-sans transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
        >
          {loading ? '...' : isRevealed ? 'Tutup' : 'Lihat'}
        </button>
      )}
    </div>
  );
};
