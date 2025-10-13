# HANURA SK Pro

Sistem Pengajuan SK dan Laporan MUSDA untuk Partai Hati Nurani Rakyat (HANURA).

## Deskripsi

HANURA SK Pro adalah aplikasi web untuk mengelola pengajuan Surat Keputusan (SK) Kepengurusan DPD dan laporan hasil Musyawarah Daerah (MUSDA). Aplikasi ini memudahkan proses pengajuan, verifikasi, dan persetujuan SK dari DPD hingga Ketua Umum.

## Fitur Utama

### Untuk DPD
- **Upload Laporan MUSDA** - Upload file PDF laporan hasil MUSDA dengan informasi tanggal dan lokasi
- **Input Data Pengurus** - Input data lengkap pengurus DPD dengan validasi keterwakilan perempuan minimal 30%
- **Tracking Progress SK** - Pantau status persetujuan SK secara real-time

### Untuk Admin (OKK, Sekjend, Ketum)
- **Dashboard Admin** - Lihat semua pengajuan dari seluruh DPD
- **Verifikasi Dokumen** - Verifikasi dan review dokumen pengajuan
- **Approval System** - Setujui atau tolak pengajuan dengan catatan revisi
- **PDF Viewer** - Lihat dokumen langsung tanpa download

## Struktur Project

```
src/
├── pages/
│   ├── Auth.tsx                    # Halaman login/register
│   ├── Index.tsx                   # Landing page
│   ├── DashboardDPD.tsx           # Dashboard untuk DPD
│   ├── UploadLaporanMusda.tsx     # Form upload laporan MUSDA
│   ├── InputDataPengurus.tsx      # Form input data pengurus
│   ├── ProgressPengajuanSK.tsx    # Halaman tracking progress
│   ├── DashboardAdmin.tsx         # Dashboard untuk Admin
│   └── DetailPengajuan.tsx        # Detail & verifikasi pengajuan
├── components/ui/                  # Komponen UI dari shadcn
├── integrations/supabase/          # Konfigurasi Supabase
└── lib/
    ├── utils.ts                    # Utility functions
    └── storage.ts                  # Storage helper functions

supabase/
└── migrations/                     # Database migrations
```

## Database Schema

### Tables
- `profiles` - Data user dan role
- `user_roles` - Manajemen role user
- `pengajuan_sk` - Data pengajuan SK dari DPD
- `pengurus` - Data pengurus DPD

### Storage Buckets
- `laporan-musda` - File PDF laporan MUSDA (max 10MB)
- `ktp-pengurus` - File KTP pengurus (max 5MB, JPG/PNG/PDF)

## Role & Permission

### DPD
- Upload laporan MUSDA
- Input data pengurus
- Lihat progress pengajuan sendiri
- Revisi pengajuan yang ditolak

### OKK
- Verifikasi dokumen pengajuan
- Setujui/tolak pengajuan
- Beri catatan revisi

### Sekjend
- Approve pengajuan yang sudah diverifikasi OKK
- Setujui/tolak pengajuan
- Beri catatan revisi

### Ketum
- Final approval pengajuan
- Terbitkan SK
- Setujui/tolak pengajuan

## Project info

**URL**: https://lovable.dev/projects/b11078da-52d2-4bfb-afc0-09ee52981165

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b11078da-52d2-4bfb-afc0-09ee52981165) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b11078da-52d2-4bfb-afc0-09ee52981165) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
