'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Tooltip from '@/components/Tooltip';
import { useAlert } from '@/contexts/AlertContext';
import { ModernSelect } from '@/components/ui/ModernSelect';
import { useAccounting } from '@/hooks/useAccounting';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  tax_type: string;
  transaction_type?: string;
  debit_account_id?: string;
  credit_account_id?: string;
}

const CATEGORY_TAX_MAPPING: Record<
  string,
  { defaultTax: string; tooltip: string; badgeColor: string }
> = {
  'Gaji / Upah Karyawan': {
    defaultTax: 'PPh Pasal 21 (Non-Final)',
    tooltip: 'Sesuai UU HPP, gaji karyawan dipotong PPh Pasal 21 secara berkala menggunakan tarif progresif Pasal 17 setelah dikurangi PTKP.',
    badgeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  'Honorarium Pembicara / Jasa Profesional': {
    defaultTax: 'PPh Pasal 21 (Bukan Pegawai)',
    tooltip: 'Imbalan bagi tenaga ahli / bukan pegawai dipotong PPh 21 sebesar 50% dari penghasilan bruto dikalikan tarif progresif UU HPP.',
    badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  },
  'Penjualan Toko Online / Omzet UMKM': {
    defaultTax: 'PPh Final PP 23 (0.5%)',
    tooltip: 'UMKM dengan omzet di bawah Rp 4,8 Miliar/tahun dikenakan PPh Final 0.5%. Khusus Orang Pribadi, omzet s.d Rp 500 Juta setahun BEBAS pajak!',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  'Sewa Gedung / Kantor': {
    defaultTax: 'PPh Pasal 4 ayat (2) Final (10%)',
    tooltip: 'Penghasilan sewa tanah dan/atau bangunan dikenakan PPh Final 10% dari nilai sewa bruto, wajib dipotong atau disetor sendiri.',
    badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  'Dividen Saham': {
    defaultTax: 'PPh Pasal 4 (2) Final Dividen (10%)',
    tooltip: 'Dividen dalam negeri untuk Orang Pribadi dikenakan PPh Final 10%, namun BEBAS pajak jika diinvestasikan kembali di NKRI dalam 3 tahun.',
    badgeColor: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  },
  'Bunga Obligasi / Deposito': {
    defaultTax: 'PPh Pasal 4 ayat (2) Final (20%)',
    tooltip: 'Bunga simpanan deposito atau tabungan bank dikenakan potongan PPh Final 20% secara langsung oleh lembaga bank terkait.',
    badgeColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  },
  'Royalti / Hak Cipta': {
    defaultTax: 'PPh Pasal 23 (Non-Final 15%)',
    tooltip: 'Penghasilan royalti atas penggunaan hak cipta dipotong PPh Pasal 23 sebesar 15% dari bruto dan dapat menjadi kredit pajak.',
    badgeColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  },
  'Lainnya': {
    defaultTax: 'PPh Umum Progresif',
    tooltip: 'Pendapatan umum lainnya yang tidak dikenakan tarif final akan digabungkan pada SPT Tahunan menggunakan tarif progresif umum UU HPP.',
    badgeColor: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
  },
};



export default function TransactionsPage() {
  const { showConfirm } = useAlert();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTableMissing, setIsTableMissing] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Gaji / Upah Karyawan');
  const [description, setDescription] = useState<string>('');
  const [taxType, setTaxType] = useState<string>('PPh Pasal 21 (Non-Final)');

  // Accounting States
  const [transactionType, setTransactionType] = useState<string>('Income');
  const [debitAccountId, setDebitAccountId] = useState<string>('');
  const [creditAccountId, setCreditAccountId] = useState<string>('');
  const { accounts } = useAccounting();

  const debitOptions = useMemo(() => {
    let filtered = accounts;
    if (transactionType === 'Cost' || transactionType === 'Expense') filtered = accounts.filter(a => a.account_code.startsWith('5') || a.account_code.startsWith('1'));
    if (transactionType === 'Income' || transactionType === 'Revenue') filtered = accounts.filter(a => a.account_code.startsWith('1')); 
    return filtered.map(a => ({ value: a.id, label: `${a.account_code} - ${a.account_name}` }));
  }, [accounts, transactionType]);

  const creditOptions = useMemo(() => {
    let filtered = accounts;
    if (transactionType === 'Cost' || transactionType === 'Expense') filtered = accounts.filter(a => a.account_code.startsWith('1') || a.account_code.startsWith('2'));
    if (transactionType === 'Income' || transactionType === 'Revenue') filtered = accounts.filter(a => a.account_code.startsWith('4')); 
    return filtered.map(a => ({ value: a.id, label: `${a.account_code} - ${a.account_name}` }));
  }, [accounts, transactionType]);

  useEffect(() => {
    if (debitOptions.length > 0 && !debitOptions.find(o => o.value === debitAccountId)) setDebitAccountId(debitOptions[0].value);
    if (creditOptions.length > 0 && !creditOptions.find(o => o.value === creditAccountId)) setCreditAccountId(creditOptions[0].value);
  }, [debitOptions, creditOptions, debitAccountId, creditAccountId]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');

  // OCR Mock Scanner States (FR-07)
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Klasifikasi Semi-Otomatis (FR-08) ketika kategori berubah
  useEffect(() => {
    if (CATEGORY_TAX_MAPPING[category]) {
      setTaxType(CATEGORY_TAX_MAPPING[category].defaultTax);
    }
  }, [category]);

  // Ambil Data Transaksi
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIsTableMissing(false);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        if (error.message.includes('Could not find') || error.code === 'PGRST205') {
          setIsTableMissing(true);
          setTransactions([]);
          return;
        }
        throw error;
      }
      setTransactions(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat transaksi.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handler File Drag-and-Drop Mock OCR
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrSuccess(false);

    // Jalankan Simulasi Mesin OCR (2.5 detik)
    setTimeout(() => {
      setOcrLoading(false);
      setOcrSuccess(true);
      
      // Auto pre-fill kolom formulir dengan data dummy hasil ekstraksi nota
      setAmount('12500000'); // Nominal Rp 12.500.000
      setDate('2026-05-12');
      setCategory('Penjualan Toko Online / Omzet UMKM');
      setDescription('Ekstraksi OCR: Nota Penjualan E-Commerce Shopee Mall #INV/2026/05/8821');

      setTimeout(() => setOcrSuccess(false), 6000);
    }, 2500);
  };

  // Submit Transaksi Baru (FR-04)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Nominal transaksi harus berupa angka positif.');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terautentikasi.');

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          date,
          amount: parsedAmount,
          category,
          description,
          tax_type: taxType,
          transaction_type: transactionType,
          debit_account_id: debitAccountId || null,
          credit_account_id: creditAccountId || null,
        });

      if (error) throw error;

      setSuccessMsg('Transaksi digital berhasil dicatat!');
      setAmount('');
      setDescription('');
      fetchTransactions();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan transaksi.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Transaksi
  const handleDelete = async (id: string) => {
    if (!(await showConfirm('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini?', 'Ya, Hapus', 'Batal'))) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg('Transaksi berhasil dihapus.');
      fetchTransactions();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus transaksi.';
      setErrorMsg(message);
    }
  };

  // Filter & Search Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.tax_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua Kategori' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Transaksi <span className="text-blue-500">Digital</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed">
          FR-04, FR-08 & FR-07: Kelola pencatatan keuangan digital Anda secara semi-otomatis dengan klasifikasi PPh dan ekstraksi nota berbasis AI OCR.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 rounded-2xl backdrop-blur-md animate-in fade-in duration-300 shadow-lg shadow-emerald-500/5">
          {successMsg}
        </div>
      )}

      {ocrSuccess && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 rounded-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-300 flex items-center gap-3 shadow-lg shadow-blue-500/5">
          <svg className="w-5 h-5 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="font-semibold">Pemindaian AI OCR Berhasil! Data nominal, tanggal, dan deskripsi nota telah terisi otomatis.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-sm text-red-400 rounded-2xl backdrop-blur-md">
          {errorMsg}
        </div>
      )}


        <div className="flex flex-col gap-8 items-stretch">
          
          {/* FORM INPUT TRANSAKSI (FR-04) & REKOMENDASI KLASIFIKASI (FR-08) */}
          <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight border-b border-slate-800/80 pb-4">
              Catat Transaksi Baru
            </h3>

            {/* DRAG AND DROP MOCK AI OCR SCANNER (FR-07) */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 text-center transition-all bg-slate-950/40 group overflow-hidden">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleOcrUpload}
                disabled={ocrLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Unggah Nota Belanja"
              />

              {ocrLoading ? (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3.5 z-20">
                  {/* Glowing Green/Blue Scanning Laser Line */}
                  <div className="relative w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_#3b82f6] animate-[bounce_2s_infinite]"></div>
                  <span className="text-[11px] font-bold text-blue-400 tracking-widest uppercase animate-pulse">
                    Mengekstraksi Data dengan AI OCR...
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 group-hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2a2 2 0 002-2v-5a2 2 0 00-2-2l-2-3H8L6 8a2 2 0 00-2 2v5a2 2 0 002 2h2m4 0h2m-6 4h8m-8-10h8m-8 4h8"></path></svg>
                  </div>
                  <p className="text-xs font-bold text-slate-300">Pindai Bukti Transaksi (AI OCR)</p>
                  <p className="text-[10px] text-slate-500">Tarik & lepas file gambar / PDF nota belanja Anda ke sini</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                    Tanggal Transaksi
                    <Tooltip content="Tanggal terjadinya transaksi penerimaan atau pengeluaran finansial Anda." />
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                    Nominal Transaksi (Gross)
                    <Tooltip content="Jumlah nominal uang bruto (kotor) dari transaksi ini sebelum dipotong PPh." />
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                    Kategori Finansial
                    <Tooltip content="Pilih kategori aktivitas. Sistem akan langsung mencocokkan jenis PPh yang paling relevan secara semi-otomatis!" />
                  </label>
                  <ModernSelect
                    value={category}
                    onChange={setCategory}
                    className="z-50"
                    options={Object.keys(CATEGORY_TAX_MAPPING).map((cat) => ({ value: cat, label: cat }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                    Keterangan / Deskripsi
                    <Tooltip content="Tuliskan detail penerima/sumber dana atau nama kegiatan untuk mempermudah pencarian audit trail." />
                  </label>
                  <textarea
                    placeholder="Tuliskan keterangan detail transaksi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full h-[116px] bg-slate-950/60 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                  />
                </div>

                {/* SEKSI KLASIFIKASI SEMI-OTOMATIS (FR-08) & TOOLTIP EDUKATIF (FR-12) */}
                <div className="md:col-span-1 space-y-2.5 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase flex items-center">
                      Rekomendasi Pajak
                    </span>
                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase">Semi-Auto</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/80 text-blue-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500/40 outline-none transition-all"
                  />
                  
                  {/* Tooltip Explainer FR-12 */}
                  <div className="pt-2 border-t border-slate-800/80 mt-auto">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">UU HPP:</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2" title={CATEGORY_TAX_MAPPING[category]?.tooltip}>
                      {CATEGORY_TAX_MAPPING[category]?.tooltip}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                  Keterangan / Deskripsi
                  <Tooltip content="Tuliskan detail penerima/sumber dana atau nama kegiatan untuk mempermudah pencarian audit trail." />
                </label>
                <textarea
                  placeholder="Tuliskan keterangan detail transaksi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* ACCOUNTING SECTION */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center">
                  Jurnal Akuntansi Otomatis
                  <Tooltip content="Sistem Double-Entry terotomatisasi. Tipe dan akun akan menyesuaikan." />
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Tipe Transaksi</label>
                    <ModernSelect
                      value={transactionType}
                      onChange={setTransactionType}
                      className="z-40"
                      options={[
                        { value: 'Income', label: 'Income (Pendapatan)' },
                        { value: 'Cost', label: 'Cost/Expense (Beban)' },
                        { value: 'Transfer', label: 'Transfer Aset' },
                        { value: 'Receivable', label: 'Piutang' },
                        { value: 'Payable', label: 'Hutang' },
                        { value: 'Adjustment', label: 'Penyesuaian' }
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Akun Debit</label>
                    <ModernSelect
                      value={debitAccountId}
                      onChange={setDebitAccountId}
                      className="z-30"
                      options={debitOptions.length > 0 ? debitOptions : [{ value: '', label: 'Belum ada akun' }]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Akun Kredit</label>
                    <ModernSelect
                      value={creditAccountId}
                      onChange={setCreditAccountId}
                      className="z-30"
                      options={creditOptions.length > 0 ? creditOptions : [{ value: '', label: 'Belum ada akun' }]}
                    />
                  </div>
                </div>

                {/* Journal Preview */}
                <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-[10px] space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>(Dr) {accounts.find(a => a.id === debitAccountId)?.account_name || '...'}</span>
                    <span className="text-emerald-400 font-bold">Rp {amount ? parseFloat(amount).toLocaleString('id-ID') : '0'}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>(Cr) {accounts.find(a => a.id === creditAccountId)?.account_name || '...'}</span>
                    <span className="text-blue-400 font-bold">Rp {amount ? parseFloat(amount).toLocaleString('id-ID') : '0'}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="relative w-full overflow-hidden rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 outline-none group/btn text-xs uppercase tracking-wider"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                {submitting ? 'Sedang Mencatat...' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>

          {/* DATA TABLE & FILTER PENGELOLAAN TRANSAKSI (FR-04) */}
          <div className="w-full space-y-6">
            
            {/* Bar Filter dan Pencarian */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari transaksi / keterangan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="w-full sm:w-auto">
                <ModernSelect
                  value={filterCategory}
                  onChange={setFilterCategory}
                  className="sm:w-[200px]"
                  options={[
                    { value: 'Semua Kategori', label: 'Semua Kategori' },
                    ...Object.keys(CATEGORY_TAX_MAPPING).map((cat) => ({ value: cat, label: cat }))
                  ]}
                />
              </div>
            </div>

            {/* List/Tabel Transaksi */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Deskripsi / Kategori</th>
                      <th className="py-4 px-6">Nominal</th>
                      <th className="py-4 px-6">Jenis Pajak</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                          <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2"></div>
                          Memuat data transaksi...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-medium leading-relaxed">
                          Belum ada pencatatan transaksi digital.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900/20 transition-all duration-150">
                          <td className="py-4.5 px-6 font-mono text-slate-300 whitespace-nowrap">
                            {new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className="font-bold text-white block mb-0.5">{t.description || '-'}</span>
                            <span className="text-[10px] font-semibold text-slate-500 block uppercase">{t.category}</span>
                          </td>
                          <td className="py-4.5 px-6 font-bold text-white font-mono whitespace-nowrap">
                            Rp {t.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${CATEGORY_TAX_MAPPING[t.category]?.badgeColor || 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
                              {t.tax_type}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/20"
                              title="Hapus Transaksi"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Footer Banner */}
              <div className="p-5 border-t border-slate-800 bg-slate-950/20 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Nominal Transaksi Tercatat:</span>
                <span className="text-md font-black text-blue-400 font-mono">
                  Rp {filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

          </div>

        </div>


    </div>
  );
}
