Tugas: Buatlah sebuah modul "Sistem Pencatatan Akuntansi Terpadu" (Single-Page Transaction Input) untuk aplikasi perpajakan dan keuangan bernama "My Tax". Saya ingin pendekatan double-entry accounting automation di mana 1 input formulir otomatis diolah menjadi siklus akuntansi lengkap (Journal \-\> Ledger \-\> Trial Balance \-\> Adjustments \-\> Financial Statements \-\> Closing).  
Konteks & Referensi Referensi Logika: Sebelumnya, saya menggunakan Google Apps Script dengan alur kerja berikut (adopsi logika ini ke dalam struktur backend dan database aplikasi modern kita):  
Input Form mencatat: Date, Description, Amount, Debit\_Account (Category), Credit\_Account (Wallet/Source), dan Transaction\_Type (Income/Expense/Transfer/Adjustment).  
Data ini di-append ke satu tabel master "Transactions Database".  
Fungsi agregasi (reduce/group by) memisahkan data menjadi General Ledger, lalu menghitung Trial Balance.  
Laporan keuangan di-generate secara on-the-fly berdasarkan pemetaan awalan Chart of Accounts (CoA): Awalan 1 (Aset), 2 (Kewajiban), 3 (Ekuitas), 4 (Pendapatan), 5 (Beban).  
Spesifikasi UI (Frontend): Buat sebuah halaman React/Next.js (atau sesuai stack yang kita gunakan) dengan komponen formulir yang rapi dan responsif.  
Field 1: Transaction Date (Date picker)  
Field 2: Description (Text input)  
Field 3: Transaction Type (Dropdown: Revenue, Expense, Asset Transfer, Liability/Debt, Adjustment)  
Field 4: Amount (Number/Currency input)  
Field 5: Debit Account (Dropdown dari CoA) \-\> Jika Transaction Type \= Expense, filter akun yang berawalan 5xxx.  
Field 6: Credit Account (Dropdown dari CoA) \-\> Jika Transaction Type \= Expense, filter akun yang berawalan 1xxx (Cash/Bank).  
Tampilkan rangkuman ringkas (Preview Jurnal) di bawah form sebelum disubmit, misalnya: "Debit: \[Nama Akun\] Rp X | Credit: \[Nama Akun\] Rp X".  
Spesifikasi Backend & Database Schema:  
Buat skema tabel Transactions: id, date, description, amount, debit\_account\_id, credit\_account\_id, transaction\_type, created\_at.  
Buat skema tabel ChartOfAccounts: id, account\_code (1xxx, 2xxx, dll), account\_name, normal\_balance (Debit/Credit), is\_temporary (Boolean, true untuk pendapatan & beban).  
Fungsi & Layanan Inti (Core Logic) yang Harus Dibuat: Buat service atau utilitas untuk mengotomatiskan langkah siklus akuntansi berikut dari tabel Transactions:  
generateLedger(accountId, startDate, endDate): Ambil semua transaksi di mana debit\_account\_id atau credit\_account\_id adalah akun tersebut. Hitung running balance berdasarkan saldo normal akun (Debit/Credit).  
getTrialBalance(startDate, endDate, includeAdjustments \= true): Hitung saldo akhir seluruh CoA. Pastikan Total Debit \= Total Kredit.  
generateFinancialStatements(period):  
Income Statement: Ambil saldo CoA 4xxx (Revenue) dikurangi CoA 5xxx (Expense) \= Net Income.  
Balance Sheet: Ambil CoA 1xxx (Assets) vs 2xxx (Liab) \+ 3xxx (Equity \+ Net Income/Retained Earnings).  
generateClosingEntries(year/month): Buat script/function yang menstimulasikan "Closing the Books". Buat entri pembalik otomatis yang men-nol-kan akun sementara (Pendapatan & Beban) dan memasukkan selisihnya ke akun Retained Earnings (3200).  
Aturan Penting:  
Ikuti standar akuntansi GAAP/IFRS. Jangan izinkan transaksi dengan Nominal Debit \!= Kredit. (Dalam form ini otomatis sama karena hanya ada 1 input Amount).  
Gunakan arsitektur modular sehingga saya bisa memanggil fungsi getTrialBalance atau generateFinancialStatements dari berbagai dashboard component nantinya.  
Tambahkan validasi error jika akun Debit dan Kredit yang dipilih sama (Self-transfer error).  
Silakan buat struktur database/schema, komponen UI Formulir, dan fungsi logic backend-nya. Berikan kodenya secara berurutan.