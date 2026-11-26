import type {
  HealthStatus,
  LivestockRecord,
  LivestockSpecies,
  MedicalRecordCategory,
  VaccinationType,
} from '../types/tanisae';

export interface LivestockSummary {
  totalTernak: number;
  sehat: number;
  pemantauanAtauTindakan: number;
  totalVaksinasi: number;
  totalIB: number;
  vaksinPMK: number;
}

export function filterLivestock(
  records: LivestockRecord[],
  query: string,
  speciesFilter: LivestockSpecies | 'Semua'
): LivestockRecord[] {
  const normalized = query.trim().toLowerCase();
  return records.filter((item) => {
    const matchesSpecies = speciesFilter === 'Semua' || item.spesies === speciesFilter;
    if (!matchesSpecies) return false;
    if (!normalized) return true;
    const haystack = [
      item.tagId,
      item.nama,
      item.spesies,
      item.ras,
      item.pemilik,
      item.kelompokTani,
      item.kecamatan,
      item.desa,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function parseQrPayload(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  // Handle URL format e.g. https://tanisae.batukota.go.id/?ternak=BTU-SAP-001
  if (trimmed.includes('ternak=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://local.test/${trimmed}`);
      const param = url.searchParams.get('ternak');
      if (param) return param.trim().toUpperCase();
    } catch {
      const match = trimmed.match(/ternak=([A-Za-z0-9-]+)/);
      if (match?.[1]) return match[1].toUpperCase();
    }
  }

  // Handle prefixed QR format e.g. TANISAE:BTU-SAP-001
  if (trimmed.toUpperCase().startsWith('TANISAE:')) {
    return trimmed.slice('TANISAE:'.length).trim().toUpperCase();
  }

  return trimmed.toUpperCase();
}

export function computeLivestockSummary(records: LivestockRecord[]): LivestockSummary {
  let sehat = 0;
  let pemantauanAtauTindakan = 0;
  let totalVaksinasi = 0;
  let totalIB = 0;
  let vaksinPMK = 0;

  for (const record of records) {
    if (record.statusKesehatan === 'Sehat') {
      sehat += 1;
    } else {
      pemantauanAtauTindakan += 1;
    }
    for (const entry of record.rekamMedis) {
      if (entry.kategori === 'Vaksinasi') {
        totalVaksinasi += 1;
        if (entry.jenisVaksin === 'PMK') {
          vaksinPMK += 1;
        }
      } else if (entry.kategori === 'Inseminasi Buatan') {
        totalIB += 1;
      }
    }
  }

  return {
    totalTernak: records.length,
    sehat,
    pemantauanAtauTindakan,
    totalVaksinasi,
    totalIB,
    vaksinPMK,
  };
}

export interface NewLivestockInput {
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

export function validateNewLivestock(input: Partial<NewLivestockInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.tagId || input.tagId.trim().length < 3) {
    errors.tagId = 'ID/Tag ternak wajib diisi (minimal 3 karakter).';
  }
  if (!input.nama || input.nama.trim().length < 2) {
    errors.nama = 'Nama atau panggilan ternak wajib diisi.';
  }
  if (!input.ras || input.ras.trim().length < 2) {
    errors.ras = 'Ras ternak wajib diisi.';
  }
  if (!input.pemilik || input.pemilik.trim().length < 2) {
    errors.pemilik = 'Nama pemilik/peternak wajib diisi.';
  }
  if (!input.desa || input.desa.trim().length < 2) {
    errors.desa = 'Desa/kelurahan di Kota Batu wajib diisi.';
  }
  if (typeof input.umurBulan !== 'number' || Number.isNaN(input.umurBulan) || input.umurBulan < 0) {
    errors.umurBulan = 'Umur (bulan) harus berupa angka 0 atau lebih.';
  }
  if (typeof input.bobotKg !== 'number' || Number.isNaN(input.bobotKg) || input.bobotKg <= 0) {
    errors.bobotKg = 'Bobot (kg) harus lebih besar dari 0.';
  }
  return errors;
}

export interface NewMedicalInput {
  kategori: MedicalRecordCategory;
  jenisVaksin?: VaccinationType;
  dosis?: string;
  kodeStrawIB?: string;
  pejantanIB?: string;
  petugas: string;
  diagnosaAtauCatatan: string;
  jadwalBerikutnya?: string;
}

export function validateMedicalEntry(input: Partial<NewMedicalInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.petugas || input.petugas.trim().length < 2) {
    errors.petugas = 'Nama petugas medis/penyuluh wajib diisi.';
  }
  if (!input.diagnosaAtauCatatan || input.diagnosaAtauCatatan.trim().length < 4) {
    errors.diagnosaAtauCatatan = 'Catatan pemeriksaan atau tindakan wajib diisi.';
  }
  if (input.kategori === 'Inseminasi Buatan' && (!input.kodeStrawIB || input.kodeStrawIB.trim().length < 2)) {
    errors.kodeStrawIB = 'Kode straw IB wajib diisi untuk catatan Inseminasi Buatan.';
  }
  return errors;
}

export interface AttackSeverityInfo {
  percent: number;
  label: 'Sporadis' | 'Ambang Ekonomi' | 'Kritis';
  level: 'low' | 'medium' | 'high';
  formatted: string;
}

export function classifyAttackSeverity(rawPercent: number): AttackSeverityInfo {
  const numeric = Number.isFinite(rawPercent) ? Math.round(rawPercent) : 1;
  const percent = Math.min(100, Math.max(1, numeric));
  if (percent < 25) {
    return {
      percent,
      label: 'Sporadis',
      level: 'low',
      formatted: `${percent}% (Sporadis)`,
    };
  }
  if (percent < 50) {
    return {
      percent,
      label: 'Ambang Ekonomi',
      level: 'medium',
      formatted: `${percent}% (Ambang Ekonomi)`,
    };
  }
  return {
    percent,
    label: 'Kritis',
    level: 'high',
    formatted: `${percent}% (Kritis)`,
  };
}
