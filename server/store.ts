import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  DiagnosticHistoryItem,
  HealthStatus,
  LivestockRecord,
  LivestockSpecies,
  MedicalEntry,
} from '../src/types/tanisae';

interface DatabaseState {
  livestock: LivestockRecord[];
  diagnostics: DiagnosticHistoryItem[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'tanisae-db.json');

const SEED_DATA: DatabaseState = {
  livestock: [
    {
      id: 'liv-001',
      tagId: 'BTU-SAP-001',
      nama: 'Srikandi',
      spesies: 'Sapi',
      ras: 'Friesian Holstein (PFH)',
      jenisKelamin: 'Betina',
      umurBulan: 38,
      bobotKg: 470,
      pemilik: 'H. Sutrisno',
      kelompokTani: 'KUD Batu Makmur',
      kecamatan: 'Bumiaji',
      desa: 'Gunungsari',
      statusKesehatan: 'Sehat',
      terakhirDiperiksa: '2026-11-18',
      rekamMedis: [
        {
          id: 'med-101',
          tanggal: '2026-10-12',
          kategori: 'Vaksinasi',
          jenisVaksin: 'PMK',
          dosis: '2 ml IM',
          petugas: 'drh. Ratna Dewi',
          diagnosaAtauCatatan: 'Vaksinasi booster PMK tahap II. Kondisi fisik prima, suhu 38.5°C.',
          jadwalBerikutnya: '2027-04-12',
        },
        {
          id: 'med-102',
          tanggal: '2026-11-04',
          kategori: 'Inseminasi Buatan',
          kodeStrawIB: 'FH-SIN-8841',
          pejantanIB: 'BBIB Singosari — Hols 019',
          petugas: 'Wahyu Pratama, S.Pt',
          diagnosaAtauCatatan: 'IB pertama pada siklus birahi normal, serviks terbuka baik.',
          jadwalBerikutnya: '2027-01-05',
        },
      ],
    },
    {
      id: 'liv-002',
      tagId: 'BTU-SAP-002',
      nama: 'Bromo Putra',
      spesies: 'Sapi',
      ras: 'Limosin Silangan',
      jenisKelamin: 'Jantan',
      umurBulan: 26,
      bobotKg: 520,
      pemilik: 'Slamet Santoso',
      kelompokTani: 'Surya Ternak Oro-Oro Ombo',
      kecamatan: 'Batu',
      desa: 'Oro-Oro Ombo',
      statusKesehatan: 'Pemantauan',
      terakhirDiperiksa: '2026-11-22',
      rekamMedis: [
        {
          id: 'med-103',
          tanggal: '2026-09-28',
          kategori: 'Vaksinasi',
          jenisVaksin: 'Antraks',
          dosis: '1 ml SC',
          petugas: 'drh. Hendra Kusuma',
          diagnosaAtauCatatan: 'Vaksinasi pencegahan Antraks rutin zona perbatasan.',
          jadwalBerikutnya: '2027-09-28',
        },
        {
          id: 'med-104',
          tanggal: '2026-11-22',
          kategori: 'Pemeriksaan Klinis',
          petugas: 'drh. Ratna Dewi',
          diagnosaAtauCatatan: 'Nafsu makan menurun ringan pasca hujan deras; diberi vitamin B-kompleks.',
          jadwalBerikutnya: '2026-11-29',
        },
      ],
    },
    {
      id: 'liv-003',
      tagId: 'BTU-KMB-014',
      nama: 'Kencana Etawa',
      spesies: 'Kambing',
      ras: 'Peranakan Etawa (PE)',
      jenisKelamin: 'Betina',
      umurBulan: 20,
      bobotKg: 49,
      pemilik: 'Siti Aminah',
      kelompokTani: 'Tunas Karya Beji',
      kecamatan: 'Junrejo',
      desa: 'Beji',
      statusKesehatan: 'Sehat',
      terakhirDiperiksa: '2026-11-15',
      rekamMedis: [
        {
          id: 'med-105',
          tanggal: '2026-10-20',
          kategori: 'Vaksinasi',
          jenisVaksin: 'PMK',
          dosis: '1 ml IM',
          petugas: 'drh. Hendra Kusuma',
          diagnosaAtauCatatan: 'Vaksinasi PMK ruminansia kecil berjalan lancar tanpa reaksi alergi.',
          jadwalBerikutnya: '2027-04-20',
        },
        {
          id: 'med-106',
          tanggal: '2026-11-15',
          kategori: 'Inseminasi Buatan',
          kodeStrawIB: 'PE-KLR-204',
          pejantanIB: 'Etawa Kaligesing Unggul',
          petugas: 'Bagus Setiawan, S.Pt',
          diagnosaAtauCatatan: 'Inseminasi Buatan berhasil dilakukan pukul 07.30 WIB.',
          jadwalBerikutnya: '2026-12-20',
        },
      ],
    },
    {
      id: 'liv-004',
      tagId: 'BTU-DOM-008',
      nama: 'Arjuno Wool',
      spesies: 'Domba',
      ras: 'Texel Wonosobo',
      jenisKelamin: 'Jantan',
      umurBulan: 16,
      bobotKg: 44,
      pemilik: 'Mulyono',
      kelompokTani: 'Gema Tani Tulungrejo',
      kecamatan: 'Bumiaji',
      desa: 'Tulungrejo',
      statusKesehatan: 'Sehat',
      terakhirDiperiksa: '2026-11-10',
      rekamMedis: [
        {
          id: 'med-107',
          tanggal: '2026-08-30',
          kategori: 'Vaksinasi',
          jenisVaksin: 'Antraks',
          dosis: '0.5 ml SC',
          petugas: 'drh. Ratna Dewi',
          diagnosaAtauCatatan: 'Vaksinasi Antraks tahunan dan pemberian obat cacing albendazole.',
          jadwalBerikutnya: '2027-08-30',
        },
      ],
    },
    {
      id: 'liv-005',
      tagId: 'BTU-KEL-021',
      nama: 'Salju Batu',
      spesies: 'Kelinci',
      ras: 'Rex & New Zealand White',
      jenisKelamin: 'Betina',
      umurBulan: 9,
      bobotKg: 3.8,
      pemilik: 'Ahmad Fauzi',
      kelompokTani: 'Asosiasi Kelinci Pandanrejo',
      kecamatan: 'Bumiaji',
      desa: 'Pandanrejo',
      statusKesehatan: 'Perlu Tindakan',
      terakhirDiperiksa: '2026-11-24',
      rekamMedis: [
        {
          id: 'med-108',
          tanggal: '2026-11-24',
          kategori: 'Pemeriksaan Klinis',
          petugas: 'drh. Hendra Kusuma',
          diagnosaAtauCatatan: 'Gejala ringan scabies pada tepi telinga; diisolasi dan diberi ivermectin.',
          jadwalBerikutnya: '2026-12-01',
        },
      ],
    },
    {
      id: 'liv-006',
      tagId: 'BTU-AYM-032',
      nama: 'Flock Joper Torongrejo',
      spesies: 'Ayam',
      ras: 'Ayam Kampung Unggul Balitbangtan (KUB)',
      jenisKelamin: 'Betina',
      umurBulan: 5,
      bobotKg: 1.6,
      pemilik: 'Ibu Rina Wati',
      kelompokTani: 'KWT Mandiri Torongrejo',
      kecamatan: 'Junrejo',
      desa: 'Torongrejo',
      statusKesehatan: 'Sehat',
      terakhirDiperiksa: '2026-11-19',
      rekamMedis: [
        {
          id: 'med-109',
          tanggal: '2026-10-10',
          kategori: 'Vaksinasi',
          jenisVaksin: 'Lainnya',
          dosis: 'Tetes mata ND-IB',
          petugas: 'Wahyu Pratama, S.Pt',
          diagnosaAtauCatatan: 'Vaksinasi ND-IB massal kandang kelompok (120 ekor).',
          jadwalBerikutnya: '2027-01-10',
        },
      ],
    },
  ],
  diagnostics: [
    {
      id: 'diag-001',
      bidang: 'pertanian',
      subjek: 'Apel Manalagi — Desa Tulungrejo',
      hasilUtama: 'Embun Tepung (Powdery Mildew) & Bercak Daun',
      tingkat: 'Sedang',
      tanggal: '2026-11-24',
      ringkasan: 'Agensi: Podosphaera leucotricha (Jamur). Disarankan pangkas tunas terinfeksi & semprot fungisida nabati belerang.',
    },
    {
      id: 'diag-002',
      bidang: 'perikanan',
      subjek: 'Ikan Nila Merah — Pokdakan Junrejo',
      hasilUtama: 'Pemeriksaan Awal Sehat / Pencegahan Aeromonas',
      tingkat: 'Rendah',
      tanggal: '2026-11-23',
      ringkasan: 'Insang merah cerah, tidak ada luka borok; pertahankan aerasi dan pergantian air 20% per minggu.',
    },
  ],
};

function ensureDb(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
    return structuredClone(SEED_DATA);
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as DatabaseState;
}

function saveDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function listLivestock(): LivestockRecord[] {
  return ensureDb().livestock;
}

export function getLivestockByTag(tagId: string): LivestockRecord | undefined {
  const normalized = tagId.trim().toUpperCase();
  return ensureDb().livestock.find((item) => item.tagId.toUpperCase() === normalized);
}

export interface CreateLivestockPayload {
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
}

export function createLivestock(payload: CreateLivestockPayload): LivestockRecord {
  const db = ensureDb();
  const normalizedTag = payload.tagId.trim().toUpperCase();
  if (db.livestock.some((item) => item.tagId.toUpperCase() === normalizedTag)) {
    throw new Error(`Tag ternak ${normalizedTag} sudah terdaftar di database.`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const created: LivestockRecord = {
    id: `liv-${crypto.randomUUID().slice(0, 8)}`,
    tagId: normalizedTag,
    nama: payload.nama.trim(),
    spesies: payload.spesies,
    ras: payload.ras.trim(),
    jenisKelamin: payload.jenisKelamin,
    umurBulan: payload.umurBulan,
    bobotKg: payload.bobotKg,
    pemilik: payload.pemilik.trim(),
    kelompokTani: payload.kelompokTani.trim() || 'Peternak Mandiri Kota Batu',
    kecamatan: payload.kecamatan,
    desa: payload.desa.trim(),
    statusKesehatan: payload.statusKesehatan,
    terakhirDiperiksa: today,
    rekamMedis: [],
  };
  db.livestock.unshift(created);
  saveDb(db);
  return created;
}

export function addMedicalRecord(
  tagId: string,
  entry: Omit<MedicalEntry, 'id' | 'tanggal'> & { tanggal?: string; statusKesehatanBaru?: HealthStatus }
): LivestockRecord {
  const db = ensureDb();
  const normalized = tagId.trim().toUpperCase();
  const index = db.livestock.findIndex((item) => item.tagId.toUpperCase() === normalized);
  if (index === -1) {
    throw new Error(`Ternak dengan ID ${normalized} tidak ditemukan.`);
  }
  const tanggal = entry.tanggal || new Date().toISOString().slice(0, 10);
  const newEntry: MedicalEntry = {
    id: `med-${crypto.randomUUID().slice(0, 8)}`,
    tanggal,
    kategori: entry.kategori,
    jenisVaksin: entry.jenisVaksin,
    dosis: entry.dosis?.trim() || undefined,
    kodeStrawIB: entry.kodeStrawIB?.trim() || undefined,
    pejantanIB: entry.pejantanIB?.trim() || undefined,
    petugas: entry.petugas.trim(),
    diagnosaAtauCatatan: entry.diagnosaAtauCatatan.trim(),
    jadwalBerikutnya: entry.jadwalBerikutnya || undefined,
  };
  db.livestock[index].rekamMedis.unshift(newEntry);
  db.livestock[index].terakhirDiperiksa = tanggal;
  if (entry.statusKesehatanBaru) {
    db.livestock[index].statusKesehatan = entry.statusKesehatanBaru;
  }
  saveDb(db);
  return db.livestock[index];
}

export function listDiagnostics(): DiagnosticHistoryItem[] {
  return ensureDb().diagnostics;
}

export function addDiagnosticHistory(item: Omit<DiagnosticHistoryItem, 'id' | 'tanggal'>): DiagnosticHistoryItem {
  const db = ensureDb();
  const created: DiagnosticHistoryItem = {
    ...item,
    id: `diag-${crypto.randomUUID().slice(0, 8)}`,
    tanggal: new Date().toISOString().slice(0, 10),
  };
  db.diagnostics.unshift(created);
  if (db.diagnostics.length > 24) {
    db.diagnostics = db.diagnostics.slice(0, 24);
  }
  saveDb(db);
  return created;
}
