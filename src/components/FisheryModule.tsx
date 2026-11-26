import React, { useState } from 'react';
import { Droplets, Fish, Pill } from 'lucide-react';
import type { FishSpecies, FisheryDiagnosisResult } from '../types/tanisae';
import { ImageCaptureZone, type SelectedImagePayload } from './ImageCaptureZone';

interface FisheryModuleProps {
  onDiagnosticSaved: () => void;
}

const FISH_SPECIES: FishSpecies[] = ['Nila', 'Lele', 'Patin', 'Gurame', 'Tombro'];
const SAMPLE_FISH_IMAGE = '/src/assets/images/specimen_ikan_nila_1795677286679.jpg';

export const FisheryModule: React.FC<FisheryModuleProps> = ({ onDiagnosticSaved }) => {
  const [spesiesIkan, setSpesiesIkan] = useState<FishSpecies>('Nila');
  const [kondisiAir, setKondisiAir] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImagePayload | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FisheryDiagnosisResult | null>(null);

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Silakan ambil atau unggah foto fisik ikan terlebih dahulu.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/diagnose/fishery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spesiesIkan,
          kondisiAir,
          image: {
            base64Data: selectedImage.base64Data,
            mimeType: selectedImage.mimeType,
            specimenFilename: selectedImage.specimenFilename,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal menganalisis foto ikan.');
        return;
      }
      setResult(json.data);
      onDiagnosticSaved();
    } catch {
      setError('Terjadi kesalahan koneksi saat menghubungi pakar perikanan AI.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#141E17]">
          Pakar Kesehatan Ikan Air Tawar
        </h1>
        <p className="mt-1 text-sm text-[#526056]">
          Deteksi penyakit, parasit, jamur, dan infeksi bakteri pada ikan Nila, Lele, Patin, Gurame, dan Tombro lengkap dengan penanganan kolam.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
          <div>
            <span className="block text-xs font-medium text-[#141E17]">Pilih Spesies Ikan</span>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {FISH_SPECIES.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpesiesIkan(sp)}
                  className={`min-h-[44px] rounded-lg border px-2 text-xs font-semibold transition-colors ${
                    spesiesIkan === sp
                      ? 'border-[#15613B] bg-[#15613B] text-white'
                      : 'border-stone-300 bg-white text-[#141E17] hover:bg-stone-50'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          <ImageCaptureZone
            title="Foto Kondisi Fisik Ikan"
            helperText="Foto tubuh, sisik, sirip, insang, atau bercak luka pada ikan dengan latar bersih dan cahaya terang."
            sampleImageUrl={SAMPLE_FISH_IMAGE}
            sampleFilename="specimen_ikan_nila_1795677286679.jpg"
            sampleLabel="Ikan Nila Merah — Pemeriksaan Tray Kolam"
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            fallbackIcon={<Fish className="h-5 w-5" />}
          />

          <div>
            <label htmlFor="fish-water" className="block text-xs font-medium text-[#141E17]">
              Kondisi Kolam &amp; Air (Opsional)
            </label>
            <textarea
              id="fish-water"
              rows={2}
              value={kondisiAir}
              onChange={(e) => setKondisiAir(e.target.value)}
              placeholder="Misal: air kolam hijau pekat, ikan sering mengapung di permukaan pagi hari..."
              className="mt-1.5 w-full rounded-lg border border-stone-300 p-3 text-sm text-[#141E17]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#B91C1C]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="min-h-[48px] w-full rounded-lg bg-[#15613B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] disabled:opacity-60"
          >
            {analyzing ? 'Menganalisis Kesehatan Ikan...' : 'Diagnosa Kesehatan Ikan (AI)'}
          </button>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-lg font-bold text-[#141E17]">
            Hasil Diagnosa &amp; Manajemen Kolam
          </h2>

          {analyzing ? (
            <div className="mt-6 space-y-4">
              <div className="h-7 w-2/3 animate-pulse rounded bg-stone-200" />
              <div className="h-20 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-28 w-full animate-pulse rounded bg-stone-100" />
            </div>
          ) : result ? (
            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs font-medium text-[#526056]">
                    {result.kategoriAgen} · {result.agensiPenyebab}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#141E17]">
                    {result.namaPenyakit}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    result.tingkatRisiko === 'Rendah'
                      ? 'text-[#15803D]'
                      : result.tingkatRisiko === 'Sedang'
                      ? 'text-[#B45309]'
                      : 'text-[#B91C1C]'
                  }`}
                >
                  Risiko {result.tingkatRisiko}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526056]">
                  Gejala Fisik Teramati
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#141E17]">
                  {result.gejalaTeramati.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-[#F7F8F6] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15613B]">
                    <Droplets className="h-4 w-4" aria-hidden="true" />
                    Penanganan Kualitas Air &amp; Kolam
                  </div>
                  <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-sm text-[#141E17]">
                    {result.penangananKolam.kualitasAir.map((item, i) => (
                      <li key={`air-${i}`}>{item}</li>
                    ))}
                    {result.penangananKolam.manajemenKolam.map((item, i) => (
                      <li key={`kolam-${i}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-stone-200 bg-[#F7F8F6] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#15613B]">
                    <Pill className="h-4 w-4" aria-hidden="true" />
                    Protokol Pengobatan &amp; Karantina
                  </div>
                  <div className="mt-2.5 space-y-2 text-sm text-[#141E17]">
                    <p>
                      <span className="font-semibold">Metode:</span> {result.pengobatan.metode}
                    </p>
                    <p>
                      <span className="font-semibold">Dosis &amp; Durasi:</span>{' '}
                      {result.pengobatan.dosisDanDurasi}
                    </p>
                    <p>
                      <span className="font-semibold">Karantina:</span> {result.pengobatan.karantina}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-stone-200 bg-[#F7F8F6] p-8 text-center">
              <p className="text-sm font-medium text-[#141E17]">
                Menunggu foto fisik ikan untuk diperiksa
              </p>
              <p className="mt-1 text-xs text-[#526056]">
                Pilih spesies (Nila, Lele, Patin, Gurame, atau Tombro) dan unggah foto untuk mendapatkan saran penanganan kolam dan pengobatan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
