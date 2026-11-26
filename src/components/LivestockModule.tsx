import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  QrCode,
  Search,
  Syringe,
  X,
} from 'lucide-react';
import type {
  HealthStatus,
  LivestockDiagnosisResult,
  LivestockRecord,
  LivestockSpecies,
  MedicalRecordCategory,
  VaccinationType,
} from '../types/tanisae';
import {
  filterLivestock,
  validateMedicalEntry,
  validateNewLivestock,
} from '../utils/tanisaeLogic';
import { ImageCaptureZone, type SelectedImagePayload } from './ImageCaptureZone';

interface LivestockModuleProps {
  livestock: LivestockRecord[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string) => void;
  onOpenQrScanner: () => void;
  onLivestockCreated: (created: LivestockRecord) => void;
  onLivestockUpdated: (updated: LivestockRecord) => void;
  onDiagnosticSaved: () => void;
}

const SPECIES_OPTIONS: Array<LivestockSpecies | 'Semua'> = [
  'Semua',
  'Sapi',
  'Kambing',
  'Ayam',
  'Domba',
  'Kelinci',
];

const SAMPLE_COW_IMAGE = '/src/assets/images/specimen_sapi_batu_1795677285522.jpg';

export const LivestockModule: React.FC<LivestockModuleProps> = ({
  livestock,
  selectedTagId,
  onSelectTag,
  onOpenQrScanner,
  onLivestockCreated,
  onLivestockUpdated,
  onDiagnosticSaved,
}) => {
  const [subTab, setSubTab] = useState<'database' | 'deteksi'>('database');
  const [query, setQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<LivestockSpecies | 'Semua'>('Semua');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // New Livestock Form Modal state
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [animalForm, setAnimalForm] = useState({
    tagId: '',
    nama: '',
    spesies: 'Sapi' as LivestockSpecies,
    ras: '',
    jenisKelamin: 'Betina' as 'Jantan' | 'Betina',
    umurBulan: '24',
    bobotKg: '350',
    pemilik: '',
    kelompokTani: '',
    kecamatan: 'Batu' as 'Batu' | 'Bumiaji' | 'Junrejo',
    desa: '',
    statusKesehatan: 'Sehat' as HealthStatus,
  });
  const [animalErrors, setAnimalErrors] = useState<Record<string, string>>({});
  const [animalSubmitError, setAnimalSubmitError] = useState<string | null>(null);
  const [submittingAnimal, setSubmittingAnimal] = useState(false);

  // Add Medical Record inline state
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    kategori: 'Vaksinasi' as MedicalRecordCategory,
    jenisVaksin: 'PMK' as VaccinationType,
    dosis: '2 ml IM',
    kodeStrawIB: '',
    pejantanIB: '',
    petugas: 'drh. Ratna Dewi',
    diagnosaAtauCatatan: '',
    jadwalBerikutnya: '',
    statusKesehatanBaru: '' as '' | HealthStatus,
  });
  const [medicalErrors, setMedicalErrors] = useState<Record<string, string>>({});
  const [medicalSubmitError, setMedicalSubmitError] = useState<string | null>(null);
  const [submittingMedical, setSubmittingMedical] = useState(false);

  // AI Livestock Early Detection state
  const [detectSpecies, setDetectSpecies] = useState<LivestockSpecies>('Sapi');
  const [detectNotes, setDetectNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImagePayload | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<LivestockDiagnosisResult | null>(null);

  const filtered = filterLivestock(livestock, query, speciesFilter);
  const activeAnimal =
    livestock.find((item) => item.tagId === selectedTagId) ?? filtered[0] ?? livestock[0] ?? null;

  useEffect(() => {
    if (!activeAnimal) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(`TANISAE:${activeAnimal.tagId}`, {
      width: 240,
      margin: 2,
      color: { dark: '#141E17', light: '#FFFFFF' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [activeAnimal]);

  const handleDownloadQr = () => {
    if (!qrDataUrl || !activeAnimal) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${activeAnimal.tagId}.png`;
    link.click();
  };

  const handleCreateAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnimalSubmitError(null);
    const payload = {
      tagId: animalForm.tagId.trim().toUpperCase(),
      nama: animalForm.nama.trim(),
      spesies: animalForm.spesies,
      ras: animalForm.ras.trim(),
      jenisKelamin: animalForm.jenisKelamin,
      umurBulan: Number(animalForm.umurBulan),
      bobotKg: Number(animalForm.bobotKg),
      pemilik: animalForm.pemilik.trim(),
      kelompokTani: animalForm.kelompokTani.trim(),
      kecamatan: animalForm.kecamatan,
      desa: animalForm.desa.trim(),
      statusKesehatan: animalForm.statusKesehatan,
    };

    const validation = validateNewLivestock(payload);
    setAnimalErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmittingAnimal(true);
    try {
      const res = await fetch('/api/livestock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setAnimalSubmitError(json.error || 'Gagal mendaftarkan ternak.');
        return;
      }
      onLivestockCreated(json.data);
      onSelectTag(json.data.tagId);
      setShowAddAnimal(false);
      setAnimalForm({
        tagId: '',
        nama: '',
        spesies: 'Sapi',
        ras: '',
        jenisKelamin: 'Betina',
        umurBulan: '24',
        bobotKg: '350',
        pemilik: '',
        kelompokTani: '',
        kecamatan: 'Batu',
        desa: '',
        statusKesehatan: 'Sehat',
      });
    } catch {
      setAnimalSubmitError('Terjadi gangguan jaringan saat menyimpan data ternak.');
    } finally {
      setSubmittingAnimal(false);
    }
  };

  const handleAddMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnimal) return;
    setMedicalSubmitError(null);
    const validation = validateMedicalEntry({
      kategori: medicalForm.kategori,
      jenisVaksin: medicalForm.kategori === 'Vaksinasi' ? medicalForm.jenisVaksin : undefined,
      dosis: medicalForm.dosis,
      kodeStrawIB: medicalForm.kodeStrawIB,
      pejantanIB: medicalForm.pejantanIB,
      petugas: medicalForm.petugas,
      diagnosaAtauCatatan: medicalForm.diagnosaAtauCatatan,
      jadwalBerikutnya: medicalForm.jadwalBerikutnya,
    });
    setMedicalErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmittingMedical(true);
    try {
      const res = await fetch(`/api/livestock/${encodeURIComponent(activeAnimal.tagId)}/medical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori: medicalForm.kategori,
          jenisVaksin: medicalForm.kategori === 'Vaksinasi' ? medicalForm.jenisVaksin : undefined,
          dosis: medicalForm.kategori === 'Vaksinasi' ? medicalForm.dosis : undefined,
          kodeStrawIB: medicalForm.kategori === 'Inseminasi Buatan' ? medicalForm.kodeStrawIB : undefined,
          pejantanIB: medicalForm.kategori === 'Inseminasi Buatan' ? medicalForm.pejantanIB : undefined,
          petugas: medicalForm.petugas,
          diagnosaAtauCatatan: medicalForm.diagnosaAtauCatatan,
          jadwalBerikutnya: medicalForm.jadwalBerikutnya || undefined,
          statusKesehatanBaru: medicalForm.statusKesehatanBaru || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMedicalSubmitError(json.error || 'Gagal menyimpan rekam medis.');
        return;
      }
      onLivestockUpdated(json.data);
      setShowMedicalForm(false);
      setMedicalForm((prev) => ({
        ...prev,
        kodeStrawIB: '',
        pejantanIB: '',
        diagnosaAtauCatatan: '',
        jadwalBerikutnya: '',
        statusKesehatanBaru: '',
      }));
    } catch {
      setMedicalSubmitError('Gagal terhubung ke server untuk menyimpan rekam medis.');
    } finally {
      setSubmittingMedical(false);
    }
  };

  const handleAnalyzeLivestock = async () => {
    if (!selectedImage) {
      setAnalysisError('Silakan ambil atau unggah foto kondisi fisik hewan ternak terlebih dahulu.');
      return;
    }
    setAnalysisError(null);
    setAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const res = await fetch('/api/diagnose/livestock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spesies: detectSpecies,
          catatanGejala: detectNotes,
          image: {
            base64Data: selectedImage.base64Data,
            mimeType: selectedImage.mimeType,
            specimenFilename: selectedImage.specimenFilename,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAnalysisError(json.error || 'Gagal menganalisis foto ternak.');
        return;
      }
      setDiagnosisResult(json.data);
      onDiagnosticSaved();
    } catch {
      setAnalysisError('Terjadi kesalahan koneksi saat menghubungi layanan analisis citra AI.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Switch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#141E17]">
            Peternakan Pintar &amp; Pelacakan QR
          </h1>
          <p className="mt-1 text-sm text-[#526056]">
            Database ternak terpusat, kartu QR eartag, rekam medis vaksinasi PMK/Rabies/Antraks, IB, dan deteksi dini penyakit berbasis citra.
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-lg bg-[#EFF2EE] p-1">
          <button
            type="button"
            onClick={() => setSubTab('database')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'database'
                ? 'bg-white text-[#141E17] shadow-xs'
                : 'text-[#526056] hover:text-[#141E17]'
            }`}
          >
            Database &amp; Rekam Medis
          </button>
          <button
            type="button"
            onClick={() => setSubTab('deteksi')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'deteksi'
                ? 'bg-white text-[#141E17] shadow-xs'
                : 'text-[#526056] hover:text-[#141E17]'
            }`}
          >
            Deteksi Dini Citra AI
          </button>
        </div>
      </div>

      {subTab === 'database' ? (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526056]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama ternak, ID tag, pemilik, atau desa..."
                  aria-label="Cari ternak"
                  className="min-h-[44px] w-full rounded-lg border border-stone-300 pl-9 pr-3 text-sm text-[#141E17] focus:border-[#15613B] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EFF2EE] p-1">
                {SPECIES_OPTIONS.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeciesFilter(sp)}
                    className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      speciesFilter === sp
                        ? 'bg-white text-[#141E17] shadow-xs'
                        : 'text-[#526056] hover:text-[#141E17]'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenQrScanner}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-[#141E17] hover:bg-stone-50 whitespace-nowrap"
              >
                <QrCode className="h-4 w-4 text-[#15613B]" aria-hidden="true" />
                Pindai QR
              </button>
              <button
                type="button"
                onClick={() => setShowAddAnimal(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F4C2E] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Daftarkan Ternak
              </button>
            </div>
          </div>

          {/* Master-Detail Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* List Column */}
            <div className="rounded-xl border border-stone-200 bg-white lg:col-span-5">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
                <h2 className="font-display text-sm font-bold text-[#141E17]">
                  Daftar Ternak ({filtered.length})
                </h2>
                <span className="text-xs text-[#526056]">Kota Batu</span>
              </div>

              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-[#141E17]">Tidak ada ternak yang cocok</p>
                  <p className="mt-1 text-xs text-[#526056]">
                    Ubah kata kunci pencarian atau daftarkan ternak baru.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filtered.map((item) => {
                    const selected = activeAnimal?.tagId === item.tagId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTag(item.tagId)}
                        className={`flex min-h-[68px] w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors ${
                          selected ? 'bg-[#EFF2EE]' : 'hover:bg-[#F7F8F6]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-display text-sm font-bold text-[#141E17]">
                              {item.nama}
                            </span>
                            <span className="font-mono text-xs text-[#526056] tabular-nums">
                              {item.tagId}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#526056]">
                            {item.spesies} · {item.pemilik} · {item.desa}, {item.kecamatan}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-semibold ${
                            item.statusKesehatan === 'Sehat'
                              ? 'text-[#15803D]'
                              : item.statusKesehatan === 'Pemantauan'
                              ? 'text-[#B45309]'
                              : 'text-[#B91C1C]'
                          }`}
                        >
                          {item.statusKesehatan}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Column */}
            <div className="space-y-6 lg:col-span-7">
              {activeAnimal ? (
                <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
                  {/* Profile Top + QR */}
                  <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-medium text-[#15613B] tabular-nums">
                        ID TERNAK: {activeAnimal.tagId}
                      </p>
                      <h2 className="font-display text-2xl font-bold text-[#141E17]">
                        {activeAnimal.nama}
                      </h2>
                      <p className="text-sm text-[#526056]">
                        {activeAnimal.spesies} · {activeAnimal.ras} · {activeAnimal.jenisKelamin}
                      </p>

                      <div className="pt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                        <div>
                          <span className="text-[#526056]">Umur</span>
                          <p className="font-mono font-semibold text-[#141E17] tabular-nums">
                            {activeAnimal.umurBulan} bulan
                          </p>
                        </div>
                        <div>
                          <span className="text-[#526056]">Bobot</span>
                          <p className="font-mono font-semibold text-[#141E17] tabular-nums">
                            {activeAnimal.bobotKg} kg
                          </p>
                        </div>
                        <div>
                          <span className="text-[#526056]">Status Kesehatan</span>
                          <p
                            className={`font-semibold ${
                              activeAnimal.statusKesehatan === 'Sehat'
                                ? 'text-[#15803D]'
                                : activeAnimal.statusKesehatan === 'Pemantauan'
                                ? 'text-[#B45309]'
                                : 'text-[#B91C1C]'
                            }`}
                          >
                            {activeAnimal.statusKesehatan}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#526056]">Pemilik</span>
                          <p className="font-medium text-[#141E17]">{activeAnimal.pemilik}</p>
                        </div>
                        <div>
                          <span className="text-[#526056]">Kelompok Tani</span>
                          <p className="font-medium text-[#141E17]">{activeAnimal.kelompokTani}</p>
                        </div>
                        <div>
                          <span className="text-[#526056]">Lokasi</span>
                          <p className="font-medium text-[#141E17]">
                            {activeAnimal.desa}, {activeAnimal.kecamatan}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-center rounded-xl border border-stone-200 bg-[#F7F8F6] p-3">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`Kode QR untuk ${activeAnimal.tagId}`}
                          className="h-28 w-28 rounded-md bg-white p-1"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-md bg-white text-xs text-[#526056]">
                          QR Code
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-[#15613B] hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Unduh Tag QR
                      </button>
                    </div>
                  </div>

                  {/* Rekam Medis, Vaksinasi & IB */}
                  <div className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#141E17]">
                          Rekam Medis, Vaksinasi &amp; Inseminasi Buatan
                        </h3>
                        <p className="text-xs text-[#526056]">
                          Riwayat vaksinasi PMK, Rabies, Antraks, pemeriksaan klinis, dan straw IB.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMedicalForm((v) => !v)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#141E17] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#15613B] whitespace-nowrap"
                      >
                        <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
                        {showMedicalForm ? 'Tutup Form' : 'Catat Medis / Vaksin / IB'}
                      </button>
                    </div>

                    {showMedicalForm && (
                      <form
                        onSubmit={handleAddMedical}
                        className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-[#F7F8F6] p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label htmlFor="med-kategori" className="block text-xs font-medium text-[#141E17]">
                              Kategori Tindakan
                            </label>
                            <select
                              id="med-kategori"
                              value={medicalForm.kategori}
                              onChange={(e) =>
                                setMedicalForm({
                                  ...medicalForm,
                                  kategori: e.target.value as MedicalRecordCategory,
                                })
                              }
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                            >
                              <option value="Vaksinasi">Vaksinasi (PMK / Rabies / Antraks)</option>
                              <option value="Inseminasi Buatan">Inseminasi Buatan (IB)</option>
                              <option value="Pemeriksaan Klinis">Pemeriksaan Klinis</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="med-petugas" className="block text-xs font-medium text-[#141E17]">
                              Petugas / Dokter Hewan
                            </label>
                            <input
                              id="med-petugas"
                              type="text"
                              value={medicalForm.petugas}
                              onChange={(e) => setMedicalForm({ ...medicalForm, petugas: e.target.value })}
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                            />
                            {medicalErrors.petugas && (
                              <p className="mt-1 text-xs text-[#B91C1C]">{medicalErrors.petugas}</p>
                            )}
                          </div>

                          {medicalForm.kategori === 'Vaksinasi' && (
                            <>
                              <div>
                                <label htmlFor="med-vaksin" className="block text-xs font-medium text-[#141E17]">
                                  Jenis Vaksin
                                </label>
                                <select
                                  id="med-vaksin"
                                  value={medicalForm.jenisVaksin}
                                  onChange={(e) =>
                                    setMedicalForm({
                                      ...medicalForm,
                                      jenisVaksin: e.target.value as VaccinationType,
                                    })
                                  }
                                  className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                                >
                                  <option value="PMK">Vaksin PMK (Penyakit Mulut &amp; Kuku)</option>
                                  <option value="Antraks">Vaksin Antraks</option>
                                  <option value="Rabies">Vaksin Rabies</option>
                                  <option value="Lainnya">Vaksin Lainnya (ND/SE/LSD)</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="med-dosis" className="block text-xs font-medium text-[#141E17]">
                                  Dosis &amp; Rute
                                </label>
                                <input
                                  id="med-dosis"
                                  type="text"
                                  value={medicalForm.dosis}
                                  onChange={(e) => setMedicalForm({ ...medicalForm, dosis: e.target.value })}
                                  placeholder="Contoh: 2 ml IM"
                                  className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                                />
                              </div>
                            </>
                          )}

                          {medicalForm.kategori === 'Inseminasi Buatan' && (
                            <>
                              <div>
                                <label htmlFor="med-straw" className="block text-xs font-medium text-[#141E17]">
                                  Kode Straw IB
                                </label>
                                <input
                                  id="med-straw"
                                  type="text"
                                  value={medicalForm.kodeStrawIB}
                                  onChange={(e) =>
                                    setMedicalForm({ ...medicalForm, kodeStrawIB: e.target.value })
                                  }
                                  placeholder="Contoh: FH-SIN-9012"
                                  className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 font-mono text-sm text-[#141E17]"
                                />
                                {medicalErrors.kodeStrawIB && (
                                  <p className="mt-1 text-xs text-[#B91C1C]">{medicalErrors.kodeStrawIB}</p>
                                )}
                              </div>
                              <div>
                                <label htmlFor="med-pejantan" className="block text-xs font-medium text-[#141E17]">
                                  Asal / Nama Pejantan
                                </label>
                                <input
                                  id="med-pejantan"
                                  type="text"
                                  value={medicalForm.pejantanIB}
                                  onChange={(e) =>
                                    setMedicalForm({ ...medicalForm, pejantanIB: e.target.value })
                                  }
                                  placeholder="Contoh: BBIB Singosari"
                                  className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label htmlFor="med-jadwal" className="block text-xs font-medium text-[#141E17]">
                              Jadwal Kontrol / Booster Berikutnya
                            </label>
                            <input
                              id="med-jadwal"
                              type="date"
                              value={medicalForm.jadwalBerikutnya}
                              onChange={(e) =>
                                setMedicalForm({ ...medicalForm, jadwalBerikutnya: e.target.value })
                              }
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                            />
                          </div>

                          <div>
                            <label htmlFor="med-status" className="block text-xs font-medium text-[#141E17]">
                              Perbarui Status Kesehatan
                            </label>
                            <select
                              id="med-status"
                              value={medicalForm.statusKesehatanBaru}
                              onChange={(e) =>
                                setMedicalForm({
                                  ...medicalForm,
                                  statusKesehatanBaru: e.target.value as '' | HealthStatus,
                                })
                              }
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                            >
                              <option value="">Tetap ({activeAnimal.statusKesehatan})</option>
                              <option value="Sehat">Sehat</option>
                              <option value="Pemantauan">Pemantauan</option>
                              <option value="Perlu Tindakan">Perlu Tindakan</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="med-catatan" className="block text-xs font-medium text-[#141E17]">
                            Catatan Diagnosa / Tindakan Medis
                          </label>
                          <textarea
                            id="med-catatan"
                            rows={2}
                            value={medicalForm.diagnosaAtauCatatan}
                            onChange={(e) =>
                              setMedicalForm({ ...medicalForm, diagnosaAtauCatatan: e.target.value })
                            }
                            placeholder="Tuliskan hasil pemeriksaan fisik, dosis obat, atau respons ternak..."
                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-3 text-sm text-[#141E17]"
                          />
                          {medicalErrors.diagnosaAtauCatatan && (
                            <p className="mt-1 text-xs text-[#B91C1C]">
                              {medicalErrors.diagnosaAtauCatatan}
                            </p>
                          )}
                        </div>

                        {medicalSubmitError && (
                          <p role="alert" className="text-xs text-[#B91C1C]">
                            {medicalSubmitError}
                          </p>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMedicalForm(false)}
                            className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-[#141E17]"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={submittingMedical}
                            className="min-h-[44px] rounded-lg bg-[#15613B] px-5 text-sm font-semibold text-white hover:bg-[#0F4C2E] disabled:opacity-60"
                          >
                            {submittingMedical ? 'Menyimpan...' : 'Simpan Rekam Medis'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Medical Log Timeline */}
                    <div className="mt-4 divide-y divide-stone-100">
                      {activeAnimal.rekamMedis.length === 0 ? (
                        <p className="py-6 text-sm text-[#526056]">
                          Belum ada riwayat medis, vaksinasi, atau IB tercatat untuk ternak ini.
                        </p>
                      ) : (
                        activeAnimal.rekamMedis.map((entry) => (
                          <div key={entry.id} className="py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-[#15613B]">
                                {entry.kategori}
                                {entry.jenisVaksin ? ` · Vaksin ${entry.jenisVaksin}` : ''}
                                {entry.kodeStrawIB ? ` · Straw ${entry.kodeStrawIB}` : ''}
                              </span>
                              <span className="font-mono text-[#526056] tabular-nums">
                                {entry.tanggal}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-[#141E17]">{entry.diagnosaAtauCatatan}</p>
                            <p className="mt-1 text-xs text-[#526056]">
                              Petugas: {entry.petugas}
                              {entry.dosis ? ` · Dosis: ${entry.dosis}` : ''}
                              {entry.pejantanIB ? ` · Pejantan: ${entry.pejantanIB}` : ''}
                              {entry.jadwalBerikutnya
                                ? ` · Jadwal Berikutnya: ${entry.jadwalBerikutnya}`
                                : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Sub-tab 2: AI Early Livestock Disease Detection */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
            <div>
              <label htmlFor="detect-species" className="block text-xs font-medium text-[#141E17]">
                Pilih Spesies Ternak
              </label>
              <select
                id="detect-species"
                value={detectSpecies}
                onChange={(e) => setDetectSpecies(e.target.value as LivestockSpecies)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
              >
                <option value="Sapi">Sapi (Perah PFH / Potong)</option>
                <option value="Kambing">Kambing (PE / Kacang)</option>
                <option value="Domba">Domba (Texel / Lokal)</option>
                <option value="Ayam">Ayam (Kampung / Petelur / Broiler)</option>
                <option value="Kelinci">Kelinci (Rex / New Zealand)</option>
              </select>
            </div>

            <ImageCaptureZone
              title="Foto Kondisi Fisik Ternak"
              helperText="Fokuskan kamera pada bagian mulut/hidung, kuku, kulit, mata, atau postur tubuh ternak."
              sampleImageUrl={SAMPLE_COW_IMAGE}
              sampleFilename="specimen_sapi_batu_1795677285522.jpg"
              sampleLabel="Sapi Perah PFH — Kandang Rakyat Kota Batu"
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
              fallbackIcon={<Search className="h-5 w-5" />}
            />

            <div>
              <label htmlFor="detect-notes" className="block text-xs font-medium text-[#141E17]">
                Catatan Gejala Tambahan (Opsional)
              </label>
              <textarea
                id="detect-notes"
                rows={2}
                value={detectNotes}
                onChange={(e) => setDetectNotes(e.target.value)}
                placeholder="Misal: air liur berlebih, nafsu makan turun sejak kemarin, atau pincang..."
                className="mt-1.5 w-full rounded-lg border border-stone-300 p-3 text-sm text-[#141E17]"
              />
            </div>

            {analysisError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#B91C1C]">
                {analysisError}
              </p>
            )}

            <button
              type="button"
              onClick={handleAnalyzeLivestock}
              disabled={analyzing}
              className="min-h-[48px] w-full rounded-lg bg-[#15613B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] disabled:opacity-60"
            >
              {analyzing ? 'Menganalisis Citra Hewan Ternak...' : 'Analisis Kondisi Ternak (AI)'}
            </button>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7">
            <h2 className="font-display text-lg font-bold text-[#141E17]">
              Hasil Deteksi Dini Veteriner AI
            </h2>

            {analyzing ? (
              <div className="mt-6 space-y-4">
                <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
                <div className="h-24 w-full animate-pulse rounded bg-stone-100" />
              </div>
            ) : diagnosisResult ? (
              <div className="mt-5 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
                  <div>
                    <p className="text-xs font-medium text-[#526056]">Indikasi Kondisi / Penyakit</p>
                    <h3 className="mt-1 font-display text-xl font-bold text-[#141E17]">
                      {diagnosisResult.namaKondisi}
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    {diagnosisResult.tingkatUrgensi === 'Rendah' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                    ) : (
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          diagnosisResult.tingkatUrgensi === 'Tinggi'
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        diagnosisResult.tingkatUrgensi === 'Rendah'
                          ? 'text-[#15803D]'
                          : diagnosisResult.tingkatUrgensi === 'Tinggi'
                          ? 'text-[#B91C1C]'
                          : 'text-[#B45309]'
                      }
                    >
                      Urgensi {diagnosisResult.tingkatUrgensi}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526056]">
                    Gejala Visual Teramati
                  </h4>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#141E17]">
                    {diagnosisResult.gejalaTeramati.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526056]">
                    Kemungkinan Penyebab
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#141E17]">
                    {diagnosisResult.kemungkinanPenyebab}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526056]">
                    Tindakan Segera &amp; Biosekuriti Kandang
                  </h4>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#141E17]">
                    {diagnosisResult.tindakanSegera.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-stone-200 pt-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[#15613B]">Rekomendasi Vaksin / Medis</h4>
                    <p className="mt-1 text-sm text-[#141E17]">
                      {diagnosisResult.rekomendasiVaksinAtauMedis}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#15613B]">Pelaporan Puskeswan Batu</h4>
                    <p className="mt-1 text-sm text-[#141E17]">{diagnosisResult.catatanDistanKP}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-stone-200 bg-[#F7F8F6] p-8 text-center">
                <p className="text-sm font-medium text-[#141E17]">
                  Belum ada citra ternak yang dianalisis
                </p>
                <p className="mt-1 text-xs text-[#526056]">
                  Pilih spesies ternak dan unggah foto (atau gunakan contoh foto Sapi Batu), lalu tekan Analisis Kondisi Ternak.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Tambah Ternak Baru */}
      {showAddAnimal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-animal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h2 id="add-animal-title" className="font-display text-lg font-bold text-[#141E17]">
                Daftarkan Profil Ternak Baru
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAnimal(false)}
                aria-label="Tutup form pendaftaran ternak"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#526056] hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnimal} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-tag" className="block text-xs font-medium text-[#141E17]">
                    ID / Tag Ternak
                  </label>
                  <input
                    id="new-tag"
                    type="text"
                    value={animalForm.tagId}
                    onChange={(e) => setAnimalForm({ ...animalForm, tagId: e.target.value })}
                    placeholder="BTU-SAP-099"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 font-mono text-sm uppercase text-[#141E17]"
                  />
                  {animalErrors.tagId && <p className="mt-1 text-xs text-[#B91C1C]">{animalErrors.tagId}</p>}
                </div>

                <div>
                  <label htmlFor="new-nama" className="block text-xs font-medium text-[#141E17]">
                    Nama Ternak
                  </label>
                  <input
                    id="new-nama"
                    type="text"
                    value={animalForm.nama}
                    onChange={(e) => setAnimalForm({ ...animalForm, nama: e.target.value })}
                    placeholder="Contoh: Melati"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 text-sm text-[#141E17]"
                  />
                  {animalErrors.nama && <p className="mt-1 text-xs text-[#B91C1C]">{animalErrors.nama}</p>}
                </div>

                <div>
                  <label htmlFor="new-spesies" className="block text-xs font-medium text-[#141E17]">
                    Spesies
                  </label>
                  <select
                    id="new-spesies"
                    value={animalForm.spesies}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, spesies: e.target.value as LivestockSpecies })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                  >
                    <option value="Sapi">Sapi</option>
                    <option value="Kambing">Kambing</option>
                    <option value="Domba">Domba</option>
                    <option value="Ayam">Ayam</option>
                    <option value="Kelinci">Kelinci</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-ras" className="block text-xs font-medium text-[#141E17]">
                    Ras / Bangsa
                  </label>
                  <input
                    id="new-ras"
                    type="text"
                    value={animalForm.ras}
                    onChange={(e) => setAnimalForm({ ...animalForm, ras: e.target.value })}
                    placeholder="Contoh: Friesian Holstein"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 text-sm text-[#141E17]"
                  />
                  {animalErrors.ras && <p className="mt-1 text-xs text-[#B91C1C]">{animalErrors.ras}</p>}
                </div>

                <div>
                  <label htmlFor="new-jk" className="block text-xs font-medium text-[#141E17]">
                    Jenis Kelamin
                  </label>
                  <select
                    id="new-jk"
                    value={animalForm.jenisKelamin}
                    onChange={(e) =>
                      setAnimalForm({
                        ...animalForm,
                        jenisKelamin: e.target.value as 'Jantan' | 'Betina',
                      })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                  >
                    <option value="Betina">Betina</option>
                    <option value="Jantan">Jantan</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="new-umur" className="block text-xs font-medium text-[#141E17]">
                      Umur (Bln)
                    </label>
                    <input
                      id="new-umur"
                      type="number"
                      min="0"
                      value={animalForm.umurBulan}
                      onChange={(e) => setAnimalForm({ ...animalForm, umurBulan: e.target.value })}
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 font-mono text-sm text-[#141E17]"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-bobot" className="block text-xs font-medium text-[#141E17]">
                      Bobot (Kg)
                    </label>
                    <input
                      id="new-bobot"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={animalForm.bobotKg}
                      onChange={(e) => setAnimalForm({ ...animalForm, bobotKg: e.target.value })}
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 font-mono text-sm text-[#141E17]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-pemilik" className="block text-xs font-medium text-[#141E17]">
                    Nama Pemilik
                  </label>
                  <input
                    id="new-pemilik"
                    type="text"
                    value={animalForm.pemilik}
                    onChange={(e) => setAnimalForm({ ...animalForm, pemilik: e.target.value })}
                    placeholder="Contoh: Bpk. Suhartono"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 text-sm text-[#141E17]"
                  />
                  {animalErrors.pemilik && (
                    <p className="mt-1 text-xs text-[#B91C1C]">{animalErrors.pemilik}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="new-kelompok" className="block text-xs font-medium text-[#141E17]">
                    Kelompok Tani / KUD
                  </label>
                  <input
                    id="new-kelompok"
                    type="text"
                    value={animalForm.kelompokTani}
                    onChange={(e) => setAnimalForm({ ...animalForm, kelompokTani: e.target.value })}
                    placeholder="Contoh: KUD Batu Makmur"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 text-sm text-[#141E17]"
                  />
                </div>

                <div>
                  <label htmlFor="new-kecamatan" className="block text-xs font-medium text-[#141E17]">
                    Kecamatan
                  </label>
                  <select
                    id="new-kecamatan"
                    value={animalForm.kecamatan}
                    onChange={(e) =>
                      setAnimalForm({
                        ...animalForm,
                        kecamatan: e.target.value as 'Batu' | 'Bumiaji' | 'Junrejo',
                      })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#141E17]"
                  >
                    <option value="Batu">Batu</option>
                    <option value="Bumiaji">Bumiaji</option>
                    <option value="Junrejo">Junrejo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-desa" className="block text-xs font-medium text-[#141E17]">
                    Desa / Kelurahan
                  </label>
                  <input
                    id="new-desa"
                    type="text"
                    value={animalForm.desa}
                    onChange={(e) => setAnimalForm({ ...animalForm, desa: e.target.value })}
                    placeholder="Contoh: Punten"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 px-3 text-sm text-[#141E17]"
                  />
                  {animalErrors.desa && <p className="mt-1 text-xs text-[#B91C1C]">{animalErrors.desa}</p>}
                </div>
              </div>

              {animalSubmitError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#B91C1C]">
                  {animalSubmitError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAnimal(false)}
                  className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-[#141E17]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAnimal}
                  className="min-h-[44px] rounded-lg bg-[#15613B] px-5 text-sm font-semibold text-white hover:bg-[#0F4C2E] disabled:opacity-60"
                >
                  {submittingAnimal ? 'Mendaftarkan...' : 'Simpan & Buat QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
