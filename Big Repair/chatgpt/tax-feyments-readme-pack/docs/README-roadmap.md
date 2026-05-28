# Improvement Roadmap

Dokumen ini merangkum roadmap perbaikan Tax Feyments berdasarkan kritik produk, perpajakan, UX, keamanan, dan teknis.

---

## 30-Day Roadmap

Fokus: membuat project lebih jelas, aman, dan kredibel.

### Week 1: Product Clarity

- Rewrite README utama.
- Tambahkan positioning produk.
- Tambahkan tax disclaimer.
- Definisikan target user utama.
- Rapikan dokumentasi ke folder `/docs`.

### Week 2: Tax Calculation Trust

- Tambahkan calculation breakdown.
- Tambahkan assumption panel.
- Tambahkan rule version pada hasil kalkulasi.
- Tambahkan warning jika input belum lengkap.
- Tambahkan unit test untuk edge cases tax engine.

### Week 3: SPT Readiness

- Buat readiness score.
- Buat missing document checklist.
- Buat next best action.
- Tambahkan risk warning panel.
- Ubah dashboard menjadi action-oriented.

### Week 4: Security & AI Safety

- Tambahkan privacy policy page.
- Tambahkan AI disclaimer dan consent.
- Masking data sensitif.
- Tambahkan audit log awal.
- Review RLS dan API authorization.

---

## 60-Day Roadmap

Fokus: meningkatkan kualitas fitur dan kesiapan demo.

- Perbaiki UX onboarding.
- Buat export PDF yang rapi.
- Tambahkan document verification flow.
- Tambahkan tax glossary yang lebih terstruktur.
- Tambahkan AI missing-data checker.
- Tambahkan admin permission matrix.
- Tambahkan `.env.example`.
- Tambahkan screenshot/gif demo ke README.
- Tambahkan seed data/demo mode.

---

## 90-Day Roadmap

Fokus: membuat aplikasi layak menjadi portofolio tax-tech serius.

- Tambahkan regulation versioning dashboard.
- Tambahkan changelog tax rules.
- Tambahkan consultant consent flow.
- Tambahkan signed URL untuk dokumen.
- Tambahkan user data export/delete.
- Tambahkan end-to-end test untuk core flow.
- Tambahkan deployment guide.
- Tambahkan demo production link.

---

## Priority Matrix

| Priority | Task | Impact | Effort |
|---|---|---:|---:|
| P0 | Rewrite README | High | Low |
| P0 | Add tax disclaimer | High | Low |
| P0 | Define primary persona | High | Low |
| P1 | Calculation breakdown | High | Medium |
| P1 | SPT readiness score | High | Medium |
| P1 | Missing document checklist | High | Medium |
| P1 | AI guardrails | High | Medium |
| P2 | Privacy policy | Medium | Low |
| P2 | Audit log | High | Medium |
| P2 | Document verification | High | Medium |
| P3 | OCR improvement | Medium | High |
| P3 | Advanced analytics | Low | Medium |
| P3 | Consultant role | Medium | High |

---

## Recommended Next Commit Sequence

```text
commit 1: docs: rewrite README and add product positioning docs
commit 2: feat: add global tax disclaimer component
commit 3: feat: add calculation breakdown structure
commit 4: feat: add SPT readiness score
commit 5: feat: add missing document checklist
commit 6: feat: add AI consent and safety disclaimer
commit 7: security: add privacy page and data masking
commit 8: test: add tax engine edge case tests
```

---

## Final Direction

Tax Feyments sebaiknya tidak mengejar jumlah fitur, tetapi mengejar:

- kejelasan produk;
- kepercayaan pengguna;
- akurasi estimasi;
- keamanan data;
- relevansi nyata dengan proses persiapan pajak.

