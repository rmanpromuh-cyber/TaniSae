import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAttackSeverity,
  computeLivestockSummary,
  filterLivestock,
  parseQrPayload,
  validateMedicalEntry,
  validateNewLivestock,
} from './tanisaeLogic';
import type { LivestockRecord } from '../types/tanisae';

const SAMPLE_RECORDS: LivestockRecord[] = [
  {
    id: '1',
    tagId: 'BTU-SAP-001',
    nama: 'Srikandi',
    spesies: 'Sapi',
    ras: 'Friesian Holstein (PFH)',
    jenisKelamin: 'Betina',
    umurBulan: 38,
    bobotKg: 465,
    pemilik: 'H. Sutrisno',
    kelompokTani: 'KUD Batu Makmur',
    kecamatan: 'Bumiaji',
    desa: 'Gunungsari',
    statusKesehatan: 'Sehat',
    terakhirDiperiksa: '2026-11-12',
    rekamMedis: [
      {
        id: 'm1',
        tanggal: '2026-10-05',
        kategori: 'Vaksinasi',
        jenisVaksin: 'PMK',
        dosis: '2 ml IM',
        petugas: 'drh. Ratna Dewi',
        diagnosaAtauCatatan: 'Booster vaksin PMK dosis kedua',
      },
      {
        id: 'm2',
        tanggal: '2026-11-01',
        kategori: 'Inseminasi Buatan',
        kodeStrawIB: 'FH-SIN-8841',
        pejantanIB: 'Pejantan Unggul Singosari',
        petugas: 'Wahyu Pratama, S.Pt',
        diagnosaAtauCatatan: 'IB pertama pada siklus birahi normal',
      },
    ],
  },
  {
    id: '2',
    tagId: 'BTU-KMB-014',
    nama: 'Bima',
    spesies: 'Kambing',
    ras: 'Peranakan Etawa',
    jenisKelamin: 'Jantan',
    umurBulan: 22,
    bobotKg: 58,
    pemilik: 'Slamet Riyadi',
    kelompokTani: 'Ternak Maju Junrejo',
    kecamatan: 'Junrejo',
    desa: 'Beji',
    statusKesehatan: 'Pemantauan',
    terakhirDiperiksa: '2026-11-20',
    rekamMedis: [
      {
        id: 'm3',
        tanggal: '2026-09-14',
        kategori: 'Vaksinasi',
        jenisVaksin: 'Antraks',
        dosis: '1 ml SC',
        petugas: 'drh. Hendra Kusuma',
        diagnosaAtauCatatan: 'Vaksinasi rutin kawasan rawan',
      },
    ],
  },
];

test('parseQrPayload extracts livestock tag from prefixed, URL, or raw QR text', () => {
  assert.equal(parseQrPayload('TANISAE:btu-sap-001'), 'BTU-SAP-001');
  assert.equal(parseQrPayload('https://tanisae.batukota.go.id/?ternak=btu-kmb-014'), 'BTU-KMB-014');
  assert.equal(parseQrPayload('  btu-dom-007 '), 'BTU-DOM-007');
  assert.equal(parseQrPayload('   '), '');
});

test('filterLivestock filters accurately by species and keyword', () => {
  assert.equal(filterLivestock(SAMPLE_RECORDS, '', 'Semua').length, 2);
  assert.equal(filterLivestock(SAMPLE_RECORDS, '', 'Sapi').length, 1);
  assert.equal(filterLivestock(SAMPLE_RECORDS, 'Beji', 'Semua')[0].tagId, 'BTU-KMB-014');
  assert.equal(filterLivestock(SAMPLE_RECORDS, 'srikandi', 'Sapi').length, 1);
  assert.equal(filterLivestock(SAMPLE_RECORDS, 'srikandi', 'Kambing').length, 0);
});

test('computeLivestockSummary counts health status, vaccinations, PMK, and IB records', () => {
  const summary = computeLivestockSummary(SAMPLE_RECORDS);
  assert.deepEqual(summary, {
    totalTernak: 2,
    sehat: 1,
    pemantauanAtauTindakan: 1,
    totalVaksinasi: 2,
    totalIB: 1,
    vaksinPMK: 1,
  });
});

test('validateNewLivestock rejects missing required fields and invalid numbers', () => {
  const invalid = validateNewLivestock({
    tagId: 'A',
    nama: '',
    ras: '',
    pemilik: '',
    desa: '',
    umurBulan: -2,
    bobotKg: 0,
  });
  assert.ok(invalid.tagId);
  assert.ok(invalid.nama);
  assert.ok(invalid.ras);
  assert.ok(invalid.pemilik);
  assert.ok(invalid.desa);
  assert.ok(invalid.umurBulan);
  assert.ok(invalid.bobotKg);

  const valid = validateNewLivestock({
    tagId: 'BTU-KEL-005',
    nama: 'Putih',
    spesies: 'Kelinci',
    ras: 'Rex Batu',
    jenisKelamin: 'Betina',
    umurBulan: 8,
    bobotKg: 3.5,
    pemilik: 'Budi Santoso',
    kelompokTani: 'Kelinci Sumberbrantas',
    kecamatan: 'Bumiaji',
    desa: 'Sumberbrantas',
    statusKesehatan: 'Sehat',
  });
  assert.deepEqual(valid, {});
});

test('validateMedicalEntry enforces IB straw code when kategori is Inseminasi Buatan', () => {
  const missingStraw = validateMedicalEntry({
    kategori: 'Inseminasi Buatan',
    petugas: 'Wahyu S.Pt',
    diagnosaAtauCatatan: 'IB siklus ke-2',
    kodeStrawIB: '',
  });
  assert.ok(missingStraw.kodeStrawIB);

  const validVacc = validateMedicalEntry({
    kategori: 'Vaksinasi',
    jenisVaksin: 'Rabies',
    petugas: 'drh. Ratna Dewi',
    diagnosaAtauCatatan: 'Vaksinasi rabies tahunan',
  });
  assert.deepEqual(validVacc, {});
});

test('classifyAttackSeverity classifies and clamps field attack percentage', () => {
  assert.deepEqual(classifyAttackSeverity(0), {
    percent: 1,
    label: 'Sporadis',
    level: 'low',
    formatted: '1% (Sporadis)',
  });
  assert.deepEqual(classifyAttackSeverity(25), {
    percent: 25,
    label: 'Ambang Ekonomi',
    level: 'medium',
    formatted: '25% (Ambang Ekonomi)',
  });
  assert.deepEqual(classifyAttackSeverity(68), {
    percent: 68,
    label: 'Kritis',
    level: 'high',
    formatted: '68% (Kritis)',
  });
  assert.equal(classifyAttackSeverity(140).percent, 100);
});
