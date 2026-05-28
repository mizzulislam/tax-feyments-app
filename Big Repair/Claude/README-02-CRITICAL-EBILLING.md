# 🔴 README-02: Masalah Kritis — e-Billing Mock

**Prioritas: KRITIS — Hapus atau redesign total sebelum go-live**

---

## Masalah

Halaman `src/app/dashboard/billing/page.tsx` mensimulasikan proses e-Billing resmi DJP, termasuk:
- Tampilan QR Code mirip sistem resmi
- Kode billing berformat mirip kode billing DJP asli
- Status "paid" / konfirmasi pembayaran

```tsx
// ❌ INI BERBAHAYA
<h1>e-Billing <span className="text-blue-500 font-extrabold">Mock</span></h1>
```

Kata "Mock" hanya muncul sebagai label kecil. Pengguna awam yang tidak membaca dengan teliti bisa mengira mereka **sudah membayar pajak ke negara**, padahal belum. Akibatnya: kena sanksi pajak karena tidak bayar ke DJP sungguhan.

**Ini bukan bug — ini potensi masalah hukum dan kerugian nyata bagi pengguna.**

---

## Opsi Perbaikan (Pilih Salah Satu)

### Opsi A: Hapus Fitur (Direkomendasikan untuk Jangka Pendek)

Hapus halaman billing sepenuhnya dan ganti dengan halaman redirect ke sistem resmi:

```tsx
// src/app/dashboard/billing/page.tsx — versi baru

export default function BillingPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="text-6xl mb-4">🏛️</div>
      <h1 className="text-2xl font-bold mb-2">Pembayaran Pajak</h1>
      <p className="text-gray-600 mb-8">
        Pembayaran pajak resmi hanya dapat dilakukan melalui sistem e-Billing DJP. 
        Kami tidak memproses atau menerima pembayaran pajak.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-left mb-6">
        <h2 className="font-semibold text-blue-900 mb-3">
          🔗 Cara Bayar Pajak Resmi
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>Login ke <strong>djponline.pajak.go.id</strong></li>
          <li>Pilih menu <strong>Bayar → e-Billing</strong></li>
          <li>Isi formulir Surat Setoran Elektronik (SSE)</li>
          <li>Dapatkan kode billing 15 digit</li>
          <li>Bayar via bank/ATM/mobile banking dengan kode tersebut</li>
        </ol>
      </div>

      <a
        href="https://sse.pajak.go.id"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Buka e-Billing DJP Resmi →
      </a>

      <p className="text-xs text-gray-400 mt-6">
        Anda akan diarahkan ke situs resmi Direktorat Jenderal Pajak (djponline.pajak.go.id)
      </p>
    </div>
  );
}
```

---

### Opsi B: Ubah Menjadi Halaman Edukasi (Jangka Menengah)

Jika ingin tetap memiliki konten terkait billing, ubah menjadi **panduan edukasi interaktif** yang jelas tidak memproses pembayaran apapun:

```tsx
// src/app/dashboard/billing/page.tsx — versi edukasi

export default function BillingEducationPage() {
  const steps = [
    {
      step: 1,
      title: "Login DJP Online",
      description: "Buka djponline.pajak.go.id dan login dengan NPWP + EFIN Anda.",
      url: "https://djponline.pajak.go.id",
      icon: "🌐"
    },
    {
      step: 2,
      title: "Buat Kode Billing",
      description: "Pilih menu Bayar → e-Billing → isi jenis pajak, masa pajak, dan jumlah.",
      icon: "📝"
    },
    {
      step: 3,
      title: "Catat Kode Billing",
      description: "Sistem DJP akan menghasilkan kode billing 15 digit yang berlaku 2 jam.",
      icon: "🔢"
    },
    {
      step: 4,
      title: "Bayar via Bank/ATM",
      description: "Gunakan kode billing di ATM, mobile banking, atau teller bank persepsi.",
      icon: "🏦"
    },
    {
      step: 5,
      title: "Simpan BPN",
      description: "Setelah bayar, simpan Bukti Penerimaan Negara (BPN) sebagai tanda terima resmi.",
      icon: "✅"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Banner penjelasan yang sangat jelas */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-8">
        <p className="font-bold text-amber-800">
          ℹ️ Halaman ini adalah panduan edukasi saja.
        </p>
        <p className="text-amber-700 text-sm mt-1">
          My Tax App <strong>tidak memproses pembayaran pajak apapun</strong>. 
          Semua pembayaran wajib dilakukan langsung di sistem resmi DJP.
        </p>
      </div>

      <h1 className="text-2xl font-bold mb-6">Cara Bayar Pajak dengan e-Billing DJP</h1>

      <div className="space-y-4">
        {steps.map((item) => (
          <div key={item.step} className="flex gap-4 p-4 border rounded-lg">
            <div className="text-3xl">{item.icon}</div>
            <div>
              <p className="font-semibold">
                Langkah {item.step}: {item.title}
              </p>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 text-sm underline mt-1 inline-block">
                  Buka {item.url} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a href="https://sse.pajak.go.id" target="_blank" rel="noopener noreferrer"
           className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg">
          Mulai di e-Billing DJP Resmi →
        </a>
      </div>
    </div>
  );
}
```

---

## Yang HARUS Dihapus / Diubah

| Elemen | Tindakan |
|--------|----------|
| QR Code simulasi pembayaran | ❌ Hapus |
| Kode billing format mirip resmi DJP | ❌ Hapus |
| Tombol/status "konfirmasi bayar" / "paid" | ❌ Hapus |
| Status pembayaran (pending/success/failed) | ❌ Hapus |
| Form input jumlah yang akan "dibayar" | ❌ Hapus |

---

## Checklist Perbaikan

- [ ] Halaman e-Billing Mock dihapus atau di-redesign total
- [ ] Tidak ada elemen UI yang menyerupai sistem pembayaran resmi
- [ ] Banner/disclaimer "ini bukan pembayaran nyata" ditampilkan dengan jelas dan mencolok
- [ ] Link ke `sse.pajak.go.id` dan `djponline.pajak.go.id` tersedia
- [ ] Tester awam (non-tech) diminta konfirmasi bahwa mereka tidak bingung dengan proses pembayaran nyata

---

## Referensi

- Sistem e-Billing DJP resmi: https://sse.pajak.go.id
- DJP Online: https://djponline.pajak.go.id
- Panduan e-Billing DJP: https://www.pajak.go.id/id/e-billing
