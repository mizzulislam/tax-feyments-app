'use client';

import React from 'react';

export default function BillingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Panduan Pembayaran e-Billing
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed font-medium">
          Pelajari langkah-langkah membuat kode billing dan membayar pajak Anda secara resmi melalui sistem Direktorat Jenderal Pajak (DJP).
        </p>
      </div>

      <div className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="border-l-4 border-blue-500 pl-4 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Penafian Penting</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Aplikasi ini adalah <strong>simulator edukasi</strong> dan tidak terhubung dengan sistem e-Billing DJP. 
            Anda tidak dapat membayar pajak asli melalui aplikasi ini. Pembayaran pajak yang sah hanya dapat dilakukan menggunakan 
            kode billing yang diterbitkan secara resmi oleh DJP.
          </p>
        </div>

        <div className="space-y-8">
          <div className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">1</div>
            <h3 className="text-lg font-bold text-white mb-2">Login ke DJP Online</h3>
            <p className="text-slate-400 text-sm">
              Kunjungi situs resmi DJP Online di <a href="https://djponline.pajak.go.id" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">djponline.pajak.go.id</a>. Masukkan NIK/NPWP, kata sandi, dan kode keamanan.
            </p>
          </div>

          <div className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">2</div>
            <h3 className="text-lg font-bold text-white mb-2">Pilih Menu e-Billing</h3>
            <p className="text-slate-400 text-sm mb-3">
              Setelah berhasil masuk, navigasikan ke menu <strong>Bayar</strong> lalu pilih <strong>e-Billing</strong>.
            </p>
          </div>

          <div className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">3</div>
            <h3 className="text-lg font-bold text-white mb-2">Isi Form Surat Setoran Elektronik (SSE)</h3>
            <p className="text-slate-400 text-sm mb-4">
              Pilih Jenis Pajak dan Jenis Setoran yang sesuai dengan pajak yang ingin Anda bayarkan. Berikut panduan ringkas untuk SPT Tahunan Orang Pribadi:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Jenis Pajak</span>
                <span className="text-white font-mono text-sm">411125 - PPh Pasal 25/29 Orang Pribadi</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Jenis Setoran</span>
                <span className="text-white font-mono text-sm">200 - Tahunan</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase font-bold">Masa Pajak & Tahun</span>
                <span className="text-white text-sm">Des - Des | Tahun bersangkutan</span>
              </div>
            </div>
          </div>

          <div className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">4</div>
            <h3 className="text-lg font-bold text-white mb-2">Buat Kode Billing & Lakukan Pembayaran</h3>
            <p className="text-slate-400 text-sm">
              Klik <strong>Buat Kode Billing</strong>. Anda akan menerima 15 digit angka. Gunakan kode ini untuk membayar melalui ATM, Internet Banking, Mobile Banking, Kantor Pos, atau e-Commerce yang mendukung pembayaran MPN G3.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 italic text-center">
            Pajak yang Anda bayarkan adalah wujud cinta tanah air dan partisipasi langsung dalam pembangunan bangsa.
          </p>
        </div>
      </div>
    </div>
  );
}
