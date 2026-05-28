# Admin Panel, RBAC & Audit Log

Dokumen ini menjelaskan perbaikan role-based access control agar Tax Feyments aman untuk data pajak sensitif.

---

## Masalah Utama

Admin panel dalam aplikasi pajak tidak boleh dirancang seperti admin panel biasa. Data pengguna bersifat sensitif, sehingga akses admin harus dibatasi.

Risiko:

- admin bebas melihat data pajak pengguna;
- konsultan melihat data tanpa izin;
- tidak ada audit log;
- permission terlalu luas;
- role hanya formalitas.

---

## Recommended Roles

| Role | Description |
|---|---|
| user | Pengguna biasa, hanya mengakses data sendiri |
| consultant | Pihak yang diberi izin oleh user untuk membantu review |
| support_admin | Membantu masalah teknis, akses data terbatas/masked |
| system_admin | Mengelola sistem, tidak otomatis melihat data pajak detail |
| auditor | Melihat audit log sesuai kebutuhan internal |

---

## Permission Matrix

| Action | User | Consultant | Support Admin | System Admin | Auditor |
|---|---:|---:|---:|---:|---:|
| View own data | Yes | No | No | No | No |
| Edit own data | Yes | No | No | No | No |
| View assigned client | No | With consent | No | No | No |
| View masked technical data | No | No | Yes | Yes | No |
| Manage users | No | No | No | Yes | No |
| Manage tax rules | No | No | No | Yes | No |
| View audit logs | Own logs | Assigned logs | Limited | Yes | Yes |
| Export user tax report | Yes | With consent | No | No | No |

---

## Consultant Consent Flow

Jika ada role consultant, alurnya harus:

1. User mengundang consultant melalui email.
2. Consultant menerima undangan.
3. User memilih cakupan akses.
4. Semua akses tercatat di audit log.
5. User dapat mencabut akses kapan saja.

Cakupan akses:

- profil saja;
- dokumen saja;
- hasil kalkulasi saja;
- semua data pajak;
- read-only;
- edit allowed.

---

## Admin Access Rules

Admin tidak boleh:

- melihat dokumen pajak tanpa alasan dan izin;
- mengunduh laporan pajak pengguna;
- membaca chat AI pengguna tanpa kebutuhan eksplisit;
- mengubah data pajak pengguna diam-diam.

Admin boleh:

- melihat status akun;
- melihat error teknis;
- melihat data masked;
- membantu reset konfigurasi;
- mengelola rule version.

---

## Audit Log Requirement

Simpan aktivitas:

- login;
- logout;
- create/update/delete tax profile;
- upload/delete document;
- view sensitive document;
- export PDF;
- AI processing with personal data;
- role change;
- consultant access granted/revoked;
- admin access to user account.

---

## Data Model Suggestion

```ts
interface UserRole {
  userId: string;
  role: 'user' | 'consultant' | 'support_admin' | 'system_admin' | 'auditor';
  createdAt: string;
}

interface AccessGrant {
  id: string;
  ownerUserId: string;
  grantedToUserId: string;
  scope: string[];
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  revokedAt?: string;
}
```

