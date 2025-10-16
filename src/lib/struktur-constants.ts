export interface Pengurus {
  id?: string;
  jenis_struktur: string;
  bidang_struktur?: string;
  jabatan: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  file_ktp: File | string | null;
  urutan: number;
}

export interface CustomJabatan {
  id?: string;
  dpd_id?: string;
  jenis_struktur: string;
  nama_jabatan: string;
  created_at?: string;
}

export const JENIS_STRUKTUR = [
  "Dewan Penasehat",
  "Dewan Pakar",
  "Dewan Pengurus Harian",
  "Biro-Biro",
  "Koordinator Cabang",
] as const;

export type JenisStruktur = typeof JENIS_STRUKTUR[number];

export const JABATAN_DEWAN_PENASEHAT = [
  "Ketua",
  "Wakil Ketua",
  "Sekretaris",
  "Anggota 1",
  "Anggota 2",
];

export const JABATAN_DEWAN_PAKAR = [
  "Ketua",
  "Wakil Ketua",
  "Sekretaris",
  "Anggota 1",
  "Anggota 2",
];

export const JABATAN_DEWAN_PENGURUS_HARIAN = [
  "Ketua DPD",
  "Wakil Ketua Bid. Organisasi, Kaderisasi dan Keanggotaan",
  "Wakil Ketua Bid. Pemenangan Pemilu",
  "Wakil Ketua Bid. Perencanaan Kebijakan Strategis",
  "Wakil Ketua Bid. Hukum, HAM dan Advokasi Rakyat",
  "Wakil Ketua Bid. Peradaban & Kebudayaan",
  "Wakil Ketua Bid. Ekonomi Sosial & Kesejahteraan Rakyat",
  "Wakil Ketua Bid. Pemberdayaan Perempuan dan Perlindungan Anak",
  "Wakil Ketua Bid. Penggalangan Kelompok Profesi & Komunitas",
  "Wakil Ketua Bid. Sumber Daya Alam, Agraria & Lingkungan Hidup",
  "Wakil Ketua Bid. Kepemudaan & Penggalangan Pemilih Pemula",
  "Wakil Ketua Bid. Keagamaan",
  "Wakil Ketua Bid. Hubungan Antar Lembaga",
  "Wakil Ketua Bid. IT, Cyber dan Media Sosial",
  "Sekretaris DPD",
  "Wakil Sekretaris Bid. Internal / Kepala Sekretariat",
  "Wakil Sekretaris Bid. Organisasi, Kaderisasi dan Keanggotaan",
  "Wakil Sekretaris Bid. Pemenangan Pemilu",
  "Wakil Sekretaris Bid. Perencanaan Kebijakan Strategis",
  "Wakil Sekretaris Bid. Hukum, HAM dan Advokasi Rakyat",
  "Wakil Sekretaris Bid. Peradaban & Kebudayaan",
  "Wakil Sekretaris Bid. Ekonomi Sosial & Kesejahteraan Rakyat",
  "Wakil Sekretaris Bid. Pemberdayaan Perempuan dan Perlindungan Anak",
  "Wakil Sekretaris Bid. Penggalangan Kelompok Profesi & Komunitas",
  "Wakil Sekretaris Bid. Sumber Daya Alam, Agraria & Lingkungan Hidup",
  "Wakil Sekretaris Bid. Kepemudaan & Penggalangan Pemilih Pemula",
  "Wakil Sekretaris Bid. Keagamaan",
  "Wakil Sekretaris Bid. Hubungan Antar Lembaga",
  "Wakil Sekretaris Bid. IT, Cyber dan Media Sosial",
  "Bendahara DPD",
  "Wakil Bendahara Bid. Pembelanjaan Aset Partai",
  "Wakil Bendahara Bid. Pembiayaan Kegiatan Partai",
  "Wakil Bendahara Bid. Pembiayaan Operasional Sekretariat Partai",
];

export const BIRO_LIST = [
  "Biro Organisasi, Kaderisasi dan Keanggotaan",
  "Biro Pendidikan dan Agama",
  "Biro Hukum, HAM & Advokasi",
  "Biro Peradaban & Kebudayaan",
  "Biro Milenial, Pemuda, Olahraga dan Seni",
  "Biro Ketenagakerjaan dan Pekerja Migran Indonesia",
  "Biro Perempuan dan Anak",
  "Biro Penggalangan Kelompok Profesi dan Komunitas",
  "Biro IT, Cyber & Media Publikasi",
  "Biro Pemberdayaan Ekonomi, Koperasi dan UMKM",
  "Biro Lingkungan Hidup",
  "Biro Agraria, Pertanian dan Nelayan",
];

export const JABATAN_BIRO = ["Ketua", "Sekretaris", "Anggota 1", "Anggota 2"];

export const generateKoordinatorCabang = (count: number = 5): string[] => {
  return Array.from({ length: count }, (_, i) => `Koordinator Cabang ${i + 1}`);
};

export const getJabatanByStruktur = (
  jenisStruktur: string,
  bidangStruktur?: string
): string[] => {
  switch (jenisStruktur) {
    case "Dewan Penasehat":
      return JABATAN_DEWAN_PENASEHAT;
    case "Dewan Pakar":
      return JABATAN_DEWAN_PAKAR;
    case "Dewan Pengurus Harian":
      return JABATAN_DEWAN_PENGURUS_HARIAN;
    case "Biro-Biro":
      return JABATAN_BIRO;
    case "Koordinator Cabang":
      return generateKoordinatorCabang(10);
    default:
      return [];
  }
};
