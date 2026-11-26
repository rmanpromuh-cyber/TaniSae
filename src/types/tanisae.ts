export type AppTab = 'beranda' | 'peternakan' | 'pertanian' | 'perikanan' | 'penyuluh';

export type LivestockSpecies = 'Sapi' | 'Kambing' | 'Ayam' | 'Domba' | 'Kelinci';

export type FishSpecies = 'Nila' | 'Lele' | 'Patin' | 'Gurame' | 'Tombro';

export type MedicalRecordCategory = 'Vaksinasi' | 'Inseminasi Buatan' | 'Pemeriksaan Klinis';

export type VaccinationType = 'PMK' | 'Rabies' | 'Antraks' | 'Lainnya';

export type HealthStatus = 'Sehat' | 'Pemantauan' | 'Perlu Tindakan';

export interface MedicalEntry {
  id: string;
  tanggal: string;
  kategori: MedicalRecordCategory;
  jenisVaksin?: VaccinationType;
  dosis?: string;
  kodeStrawIB?: string;
  pejantanIB?: string;
  petugas: string;
  diagnosaAtauCatatan: string;
  jadwalBerikutnya?: string;
}

export interface LivestockRecord {
  id: string;
  tagId: string;
  nama: string;
  spesies: LivestockSpecies;
  ras: string;
  jenisKelamin: 'Jantan' | 'Betina';
  umurBulan: number;
  bobotKg: number;
  pemilik: string;
  kelompokTani: string;
  kecamatan: 'Batu' | 'Bumiaji' | 'Junrejo';
  desa: string;
  statusKesehatan: HealthStatus;
  terakhirDiperiksa: string;
  rekamMedis: MedicalEntry[];
}

export interface LivestockDiagnosisResult {
  namaKondisi: string;
  tingkatUrgensi: 'Rendah' | 'Sedang' | 'Tinggi';
  gejalaTeramati: string[];
  kemungkinanPenyebab: string;
  tindakanSegera: string[];
  rekomendasiVaksinAtauMedis: string;
  catatanDistanKP: string;
}

export interface AgricultureDiagnosisResult {
  namaPenyakitAtauHama: string;
  tingkatSerangan: 'Ringan' | 'Sedang' | 'Berat';
  agensiPenyebab: {
    kategori: 'Jamur' | 'Bakteri' | 'Virus' | 'Serangga' | 'Nematoda' | 'Tungau / Lainnya';
    namaIlmiah: string;
    namaLokal: string;
    deskripsiSingkat: string;
  };
  gejalaKlinis: string[];
  pengendalian: {
    pestisidaKimia: {
      bahanAktif: string;
      dosisAnjuran: string;
      caraAplikasi: string;
      intervalPanen: string;
    };
    pestisidaNabati: {
      bahanAlami: string;
      caraPembuatan: string;
      caraAplikasi: string;
    };
    kulturTeknis: string[];
  };
}

export interface FisheryDiagnosisResult {
  namaPenyakit: string;
  kategoriAgen: 'Parasit' | 'Jamur' | 'Bakteri' | 'Virus' | 'Gangguan Lingkungan';
  agensiPenyebab: string;
  tingkatRisiko: 'Rendah' | 'Sedang' | 'Tinggi';
  gejalaTeramati: string[];
  penangananKolam: {
    kualitasAir: string[];
    manajemenKolam: string[];
  };
  pengobatan: {
    metode: string;
    dosisDanDurasi: string;
    karantina: string;
  };
}

export interface DiagnosticHistoryItem {
  id: string;
  bidang: 'peternakan' | 'pertanian' | 'perikanan';
  subjek: string;
  hasilUtama: string;
  tingkat: string;
  tanggal: string;
  ringkasan: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
