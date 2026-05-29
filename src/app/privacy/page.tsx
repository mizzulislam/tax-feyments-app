export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 md:px-10">
      <section className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">My Tax</p>
          <h1 className="text-4xl font-black tracking-tight text-white">Kebijakan Privasi</h1>
          <p className="text-sm leading-6 text-slate-400">
            Halaman ini menjelaskan cara aplikasi mengelola data pajak, profil, dokumen, dan riwayat penggunaan untuk membantu persiapan administrasi pajak pribadi dan UMKM.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <section className="space-y-2">
            <h2 className="text-lg font-black text-white">Data Yang Diproses</h2>
            <p className="text-sm leading-6 text-slate-400">
              Aplikasi dapat menyimpan data profil, NPWP/NIK, sumber penghasilan, aset, dokumen pendukung, riwayat laporan, draft pembayaran, dan percakapan asisten edukasi pajak sesuai fitur yang digunakan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-white">Tujuan Penggunaan</h2>
            <p className="text-sm leading-6 text-slate-400">
              Data digunakan untuk kalkulasi, checklist kesiapan, simulasi, penyusunan ringkasan, riwayat, dan personalisasi edukasi pajak. My Tax tidak menerbitkan kode billing resmi, tidak menerima pembayaran pajak, dan tidak menggantikan kanal DJP.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-white">Keamanan Dan Akses Admin</h2>
            <p className="text-sm leading-6 text-slate-400">
              Data sensitif ditampilkan secara terbatas. Akses admin ke data lengkap sementara dinonaktifkan sampai mekanisme consent, audit trail, dan pembatasan akses siap digunakan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-white">Asisten AI</h2>
            <p className="text-sm leading-6 text-slate-400">
              Asisten AI bersifat edukatif. Jangan memasukkan rahasia, password, atau dokumen yang tidak relevan. Untuk sengketa, pidana, pemeriksaan, atau keputusan hukum konkret, gunakan konsultan pajak bersertifikat atau penasihat hukum.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-white">Hak Pengguna</h2>
            <p className="text-sm leading-6 text-slate-400">
              Pengguna dapat memperbarui data, menghapus catatan yang tersedia di fitur aplikasi, dan meminta peninjauan akses data melalui pengelola sistem.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
