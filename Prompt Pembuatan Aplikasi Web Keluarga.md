**# Prompt Pembuatan Aplikasi Web "KeluargaKu"**



**\*\*Role:\*\* Senior Full-Stack Web Developer**

**\*\*Tugas:\*\* Membuat kode lengkap untuk Progressive Web App (PWA) pencatatan keluarga bernama "KeluargaKu".**



**## Spesifikasi Teknologi**

**Teknologi berikut HARUS digunakan dalam pengembangan aplikasi ini:**

**- \*\*Frontend Framework:\*\* React (Fungsional Komponen \& Hooks) dengan Vite. (Akan di-deploy ke Vercel).**

**- \*\*UI Components \& Styling:\*\* Tailwind CSS dan `shadcn/ui`. (Asumsikan saya sudah menginisialisasi shadcn/ui. Gunakan komponen standar mereka seperti Card, Button, Input, Table, Dialog, Select, dan Sonner).**

**- \*\*Icons:\*\* `lucide-react`.**

**- \*\*Backend/Database:\*\* Backendless (menggunakan Backendless JavaScript SDK `backendless`).**



**## Deskripsi Aplikasi \& Fitur Utama**

**Aplikasi ini adalah Single Page Application (SPA) responsif (Mobile-First) dengan 4 halaman/tab utama:**



**1. \*\*Dashboard:\*\* Ringkasan saldo, pratinjau acara terdekat, peringatan tagihan, dan status sinkronisasi sistem.**

**2. \*\*Agenda:\*\* CRUD kalender acara keluarga (ulang tahun, liburan, dll).**

**3. \*\*Anggota Keluarga:\*\* CRUD data profil anggota keluarga.**

**4. \*\*Keuangan \& Forecasting (Komprehensif):\*\***

&#x20;  **- CRUD catatan pemasukan dan pengeluaran reguler.**

&#x20;  **- \*\*Fitur Forecasting:\*\* Analisis rata-rata pengeluaran bulan-bulan sebelumnya untuk menyarankan target pendapatan bulan depan.**

&#x20;  **- \*\*Pengeluaran Rutin (Recurring):\*\* Menu khusus untuk mencatat pengeluaran pasti tiap bulan (contoh: Listrik, Cicilan) beserta `dateSet` (tanggal jatuh tempo 1-31).** 

&#x20;  **- \*\*Otomatisasi Rutin (Auto-Sync):\*\* Buat logika `useEffect` di layout utama yang berjalan saat aplikasi dimuat. Jika `dateSet` pengeluaran rutin sudah terlewati di bulan berjalan dan belum ada di tabel Keuangan bulan ini, sistem OTOMATIS mencatatnya sebagai pengeluaran baru, lalu men-trigger notifikasi.**



**## Skema Database (Backendless Tables)**

**Gunakan asumsi skema tabel berikut untuk fungsi CRUD:**

**1. `Members`: `name` (STRING), `role` (STRING), `birthDate` (DATETIME).**

**2. `Finances`: `description` (STRING), `amount` (INT), `type` (STRING: 'income'/'expense'), `date` (DATETIME), `isRecurring` (BOOLEAN).**

**3. `RecurringExpenses`: `description` (STRING), `amount` (INT), `dateSet` (INT).**

**4. `Events`: `title` (STRING), `date` (DATETIME), `type` (STRING).**



**## Strategi Notifikasi**

**- Buat sebuah file utilitas/hook kustom bernama `useAppNotification.js`.**

**- Fungsi ini harus melakukan 2 hal secara bersamaan:**

&#x20; **1. Memanggil `toast()` dari `sonner` (komponen bawaan shadcn/ui) untuk in-app notification.**

&#x20; **2. Memanggil `new Notification()` (Web API) untuk push notifikasi ke OS (setelah mengecek dan meminta `Notification.requestPermission()`).**

**- Panggil utilitas ini setiap kali ada operasi CRUD yang berhasil, atau saat sistem berhasil melakukan Auto-Sync tagihan rutin.**



**## Struktur Kode yang Diharapkan**

**Berikan kode secara bertahap:**

**1. `src/hooks/useAppNotification.js`: Logika gabungan Sonner dan Web Notification.**

**2. `src/services/api.js`: Abstraksi operasi CRUD Backendless (termasuk logika forecasting).**

**3. `src/App.jsx`: Layout utama, integrasi `<Toaster />` dari komponen Sonner shadcn, routing/tab state, dan logika Auto-Sync tagihan rutin.**

**4. \*\*Komponen Halaman:\*\* Berikan kode lengkap untuk halaman Keuangan (termasuk UI forecasting menggunakan shadcn Card/Table) dan halaman Dashboard.**

