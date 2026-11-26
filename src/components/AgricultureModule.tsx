import React, { useState } from 'react';
import { Bug, ChevronDown, FlaskConical, Leaf, Shovel, Sprout } from 'lucide-react';
import type { AgricultureDiagnosisResult } from '../types/tanisae';
import { classifyAttackSeverity } from '../utils/tanisaeLogic';
import { ImageCaptureZone, type SelectedImagePayload } from './ImageCaptureZone';

interface AgricultureModuleProps {
  onDiagnosticSaved: () => void;
}

const KOMODITAS_BATU = [
  'Apel Batu (Manalagi / Rome Beauty)',
  'Cabai Merah',
  'Jeruk Keprok Batu 55',
  'Kentang (Granola)',
  'Kubis / Brokoli',
  'Stroberi',
  'Wortel',
  'Tomat',
];

const FASE_PERTUMBUHAN = [
  'Persemaian / Bibit',
  'Vegetatif (Pertumbuhan Tunas & Daun)',
  'Generatif Awal (Pembungaan)',
  'Pembuahan / Pengisian Umbi',
  'Menjelang Panen',
];

const SAMPLE_APPLE_IMAGE = '/src/assets/images/specimen_daun_apel_1795677285975.jpg';

export const AgricultureModule: React.FC<AgricultureModuleProps> = ({ onDiagnosticSaved }) => {
  const [komoditas, setKomoditas] = useState(KOMODITAS_BATU[0]);
  const [fasePertumbuhan, setFasePertumbuhan] = useState(FASE_PERTUMBUHAN[1]);
  const [persentaseSerangan, setPersentaseSerangan] = useState(25);
  const [catatanLapangan, setCatatanLapangan] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImagePayload | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgricultureDiagnosisResult | null>(null);
  const [analyzedContext, setAnalyzedContext] = useState<{
    komoditas: string;
    fasePertumbuhan: string;
    severityText: string;
  } | null>(null);
  const [controlTab, setControlTab] = useState<'kimia' | 'nabati' | 'kultur'>('kimia');

  const severityInfo = classifyAttackSeverity(persentaseSerangan);

  const severityBadgeClass =
    severityInfo.level === 'low'
      ? 'border-emerald-200 bg-emerald-50 text-[#15803D]'
      : severityInfo.level === 'medium'
      ? 'border-amber-200 bg-amber-50 text-[#B45309]'
      : 'border-red-200 bg-red-50 text-[#B91C1C]';

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Silakan ambil atau unggah foto bagian tanaman yang terserang terlebih dahulu.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/diagnose/agriculture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          komoditas,
          fasePertumbuhan,
          persentaseSerangan,
          catatanLapangan,
          image: {
            base64Data: selectedImage.base64Data,
            mimeType: selectedImage.mimeType,
            specimenFilename: selectedImage.specimenFilename,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal menganalisis foto tanaman.');
        return;
      }
      setResult(json.data);
      setAnalyzedContext({
        komoditas,
        fasePertumbuhan,
        severityText: severityInfo.formatted,
      });
      onDiagnosticSaved();
    } catch {
      setError('Terjadi kesalahan jaringan saat menghubungi pakar OPT AI.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#141E17]">
          Pakar Hama &amp; Penyakit Tanaman (OPT)
        </h1>
        <p className="mt-1 text-sm text-[#526056]">
          Diagnosa awal serangan hama maupun penyakit tanaman berbasis citra lengkap dengan agensi penyebab ilmiah dan tiga jalur pengendalian terpadu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Input Column */}
        <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
          <ImageCaptureZone
            stepNumber={1}
            title="Foto Bagian Tanaman Terserang"
            helperText="Foto jarak dekat daun, batang, buah, atau perakaran yang menunjukkan gejala bercak, layu, atau gigitan hama."
            sampleImageUrl={SAMPLE_APPLE_IMAGE}
            sampleFilename="specimen_daun_apel_1795677285975.jpg"
            sampleLabel="Daun Apel Batu — Bercak & Embun Tepung"
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            fallbackIcon={<Sprout className="h-5 w-5" />}
          />

          <div className="space-y-4 border-t border-stone-200 pt-5">
            <h2 className="flex items-center gap-2.5 font-display text-base font-bold text-[#141E17]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#15613B] text-xs font-bold text-white">
                2
              </span>
              <span>Parameter Agronomi Lahan</span>
            </h2>

            <div>
              <label htmlFor="opt-komoditas" className="block text-xs font-semibold text-[#526056]">
                Komoditas Unggulan / Tanaman
              </label>
              <div className="relative mt-1.5">
                <select
                  id="opt-komoditas"
                  value={komoditas}
                  onChange={(e) => setKomoditas(e.target.value)}
                  className="min-h-[46px] w-full appearance-none rounded-xl border border-stone-300 bg-white pl-3.5 pr-10 text-sm font-medium text-[#141E17] focus:border-[#15613B] focus:outline-none"
                >
                  {KOMODITAS_BATU.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526056]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="opt-fase" className="block text-xs font-semibold text-[#526056]">
                Fase Pertumbuhan Tanaman
              </label>
              <div className="relative mt-1.5">
                <select
                  id="opt-fase"
                  value={fasePertumbuhan}
                  onChange={(e) => setFasePertumbuhan(e.target.value)}
                  className="min-h-[46px] w-full appearance-none rounded-xl border border-stone-300 bg-white pl-3.5 pr-10 text-sm font-medium text-[#141E17] focus:border-[#15613B] focus:outline-none"
                >
                  {FASE_PERTUMBUHAN.map((fase) => (
                    <option key={fase} value={fase}>
                      {fase}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526056]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="opt-attack-percent" className="text-xs font-semibold text-[#141E17]">
                  Estimasi Persentase Serangan Lahan
                </label>
                <span
                  data-testid="attack-severity-badge"
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${severityBadgeClass}`}
                >
                  {severityInfo.formatted}
                </span>
              </div>

              <div className="mt-2 flex min-h-[44px] items-center">
                <input
                  id="opt-attack-percent"
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={persentaseSerangan}
                  onChange={(e) => setPersentaseSerangan(Number(e.target.value))}
                  aria-label="Estimasi Persentase Serangan Lahan"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-[#15613B] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#15613B] [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#15613B] [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#64748B]">
                <span>1% (Sporadis)</span>
                <span>25% (Ambang Ekonomi)</span>
                <span>100% (Endemik Berat)</span>
              </div>
            </div>

            <div>
              <label htmlFor="opt-notes" className="block text-xs font-semibold text-[#526056]">
                Catatan Lapangan (Opsional)
              </label>
              <textarea
                id="opt-notes"
                rows={2}
                value={catatanLapangan}
                onChange={(e) => setCatatanLapangan(e.target.value)}
                placeholder="Misal: daun menggulung sejak hujan lebat, muncul serbuk putih di permukaan daun..."
                className="mt-1.5 w-full rounded-xl border border-stone-300 p-3 text-sm text-[#141E17] focus:border-[#15613B] focus:outline-none"
              />
            </div>
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
            className="min-h-[48px] w-full rounded-xl bg-[#15613B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] disabled:opacity-60"
          >
            {analyzing ? 'Mengidentifikasi Penyakit & Agensi OPT...' : 'Analisa Hama & Penyakit (AI)'}
          </button>
        </div>

        {/* Output Column */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-lg font-bold text-[#141E17]">
            Hasil Diagnosa Komprehensif OPT
          </h2>

          {analyzing ? (
            <div className="mt-6 space-y-4">
              <div className="h-7 w-3/4 animate-pulse rounded bg-stone-200" />
              <div className="h-20 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-32 w-full animate-pulse rounded bg-stone-100" />
            </div>
          ) : result ? (
            <div className="mt-5 space-y-6">
              {/* 1. Nama Penyakit / Hama */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs font-medium text-[#526056]">Nama Penyakit / Jenis Hama</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#141E17]">
                    {result.namaPenyakitAtauHama}
                  </h3>
                  {analyzedContext && (
                    <p className="mt-1 text-xs text-[#526056]">
                      {analyzedContext.komoditas} · {analyzedContext.fasePertumbuhan} · Serangan Lahan{' '}
                      <span className="font-semibold text-[#141E17]">{analyzedContext.severityText}</span>
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    result.tingkatSerangan === 'Ringan'
                      ? 'text-[#15803D]'
                      : result.tingkatSerangan === 'Sedang'
                      ? 'text-[#B45309]'
                      : 'text-[#B91C1C]'
                  }`}
                >
                  Serangan {result.tingkatSerangan}
                </span>
              </div>

              {/* 2. Identifikasi Agensi Penyebab Spesifik */}
              <div className="rounded-xl border border-stone-200 bg-[#F7F8F6] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15613B]">
                  <Bug className="h-4 w-4" aria-hidden="true" />
                  Agensi Penyebab Spesifik · {result.agensiPenyebab.kategori}
                </div>
                <p className="mt-2 text-base font-bold text-[#141E17]">
                  <span className="italic">{result.agensiPenyebab.namaIlmiah}</span>
                  {' — '}
                  <span className="font-semibold">{result.agensiPenyebab.namaLokal}</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#526056]">
                  {result.agensiPenyebab.deskripsiSingkat}
                </p>
              </div>

              {/* Gejala Klinis */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526056]">
                  Gejala Klinis Teramati
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#141E17]">
                  {result.gejalaKlinis.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>

              {/* 3. Rekomendasi Pengendalian 3 Pilar */}
              <div className="space-y-4 border-t border-stone-200 pt-5">
                <div className="space-y-3">
                  <h4 className="font-display text-base font-bold text-[#141E17]">
                    Rekomendasi Pengendalian Terpadu
                  </h4>
                  <div className="inline-flex flex-wrap gap-1 rounded-lg bg-[#EFF2EE] p-1">
                    <button
                      type="button"
                      onClick={() => setControlTab('kimia')}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        controlTab === 'kimia'
                          ? 'bg-white text-[#141E17] shadow-xs'
                          : 'text-[#526056] hover:text-[#141E17]'
                      }`}
                    >
                      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                      Pestisida Kimia
                    </button>
                    <button
                      type="button"
                      onClick={() => setControlTab('nabati')}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        controlTab === 'nabati'
                          ? 'bg-white text-[#141E17] shadow-xs'
                          : 'text-[#526056] hover:text-[#141E17]'
                      }`}
                    >
                      <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                      Nabati / Organik
                    </button>
                    <button
                      type="button"
                      onClick={() => setControlTab('kultur')}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        controlTab === 'kultur'
                          ? 'bg-white text-[#141E17] shadow-xs'
                          : 'text-[#526056] hover:text-[#141E17]'
                      }`}
                    >
                      <Shovel className="h-3.5 w-3.5" aria-hidden="true" />
                      Kultur Teknis
                    </button>
                  </div>
                </div>

                {controlTab === 'kimia' && (
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Bahan Aktif Anjuran</p>
                      <p className="mt-1 text-sm font-semibold text-[#141E17]">
                        {result.pengendalian.pestisidaKimia.bahanAktif}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Dosis &amp; Konsentrasi</p>
                      <p className="mt-1 text-sm font-semibold text-[#141E17]">
                        {result.pengendalian.pestisidaKimia.dosisAnjuran}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Cara Aplikasi</p>
                      <p className="mt-1 text-sm text-[#141E17]">
                        {result.pengendalian.pestisidaKimia.caraAplikasi}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Interval Aman Panen (PHI)</p>
                      <p className="mt-1 text-sm text-[#141E17]">
                        {result.pengendalian.pestisidaKimia.intervalPanen}
                      </p>
                    </div>
                  </div>
                )}

                {controlTab === 'nabati' && (
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Bahan Alami / Agen Hayati</p>
                      <p className="mt-1 text-sm font-semibold text-[#141E17]">
                        {result.pengendalian.pestisidaNabati.bahanAlami}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Cara Pembuatan / Persiapan</p>
                      <p className="mt-1 text-sm text-[#141E17]">
                        {result.pengendalian.pestisidaNabati.caraPembuatan}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#526056]">Cara Aplikasi Lapangan</p>
                      <p className="mt-1 text-sm text-[#141E17]">
                        {result.pengendalian.pestisidaNabati.caraAplikasi}
                      </p>
                    </div>
                  </div>
                )}

                {controlTab === 'kultur' && (
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-xs font-medium text-[#526056]">
                      Perlakuan Khusus &amp; Kultur Teknis
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#141E17]">
                      {result.pengendalian.kulturTeknis.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-stone-200 bg-[#F7F8F6] p-8 text-center">
              <p className="text-sm font-medium text-[#141E17]">
                Menunggu foto tanaman untuk didiagnosa
              </p>
              <p className="mt-1 text-xs text-[#526056]">
                Hasil akan menampilkan nama penyakit/hama, agensi penyebab ilmiah, serta pengendalian kimia, nabati, dan kultur teknis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
