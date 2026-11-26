import React, { useState } from 'react';
import { ArrowRight, Beef, Fish, MessageSquareText, Sprout } from 'lucide-react';
import type { AppTab, DiagnosticHistoryItem, LivestockRecord } from '../types/tanisae';
import { computeLivestockSummary } from '../utils/tanisaeLogic';

interface HomeViewProps {
  livestock: LivestockRecord[];
  diagnostics: DiagnosticHistoryItem[];
  onNavigate: (tab: AppTab) => void;
  onSelectLivestockTag: (tagId: string) => void;
}

const HERO_IMG_URL = '/src/assets/images/hero_batu_agritech_1795677285553.jpg';

export const HomeView: React.FC<HomeViewProps> = ({
  livestock,
  diagnostics,
  onNavigate,
  onSelectLivestockTag,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);
  const summary = computeLivestockSummary(livestock);

  const services: Array<{
    tab: AppTab;
    title: string;
    subtitle: string;
    description: string;
    actionLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      tab: 'peternakan',
      title: 'Peternakan & QR Tracking',
      subtitle: 'Sapi · Kambing · Domba · Ayam · Kelinci',
      description:
        'Deteksi dini penyakit ternak berbasis citra AI, kartu eartag QR, jadwal vaksinasi PMK/Rabies/Antraks, serta catatan Inseminasi Buatan.',
      actionLabel: 'Buka Data Ternak',
      icon: Beef,
    },
    {
      tab: 'pertanian',
      title: 'Pakar OPT Pertanian',
      subtitle: 'Apel Batu · Jeruk · Kentang · Kubis · Stroberi',
      description:
        'Identifikasi hama dan penyakit tanaman hingga agensi penyebab spesifik (jamur, bakteri, virus, serangga) lengkap dengan 3 jalur pengendalian.',
      actionLabel: 'Diagnosa Tanaman',
      icon: Sprout,
    },
    {
      tab: 'perikanan',
      title: 'Kesehatan Ikan Air Tawar',
      subtitle: 'Nila · Lele · Patin · Gurame · Tombro',
      description:
        'Analisis visual gejala parasit, jamur, dan infeksi bakteri pada ikan budidaya beserta rekomendasi manajemen kualitas air kolam dan pengobatan.',
      actionLabel: 'Periksa Ikan',
      icon: Fish,
    },
    {
      tab: 'penyuluh',
      title: 'Penyuluh Virtual 24/7',
      subtitle: 'Konsultasi Budidaya · SKKH · Perizinan',
      description:
        'Tanya jawab interaktif seputar teknik budidaya dataran tinggi Kota Batu, penanganan kasus darurat lapangan, dan layanan perizinan DistanKP.',
      actionLabel: 'Mulai Konsultasi',
      icon: MessageSquareText,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Editorial Split Hero */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6 lg:p-10">
            <div>
              <p className="text-xs font-medium text-[#15613B]">
                Dinas Pertanian dan Ketahanan Pangan · Kota Batu
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#141E17] text-balance sm:text-4xl">
                Layanan Terpadu Pertanian, Peternakan &amp; Perikanan Kota Batu
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#526056]">
                Platform kerja lapangan untuk petugas dinas, penyuluh, peternak, petani, dan pembudidaya ikan di Kecamatan Batu, Bumiaji, dan Junrejo.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('pertanian')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] whitespace-nowrap"
              >
                Mulai Diagnosa OPT
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('penyuluh')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-[#141E17] transition-colors hover:bg-stone-50 whitespace-nowrap"
              >
                <MessageSquareText className="h-4 w-4 text-[#15613B]" aria-hidden="true" />
                Tanya Penyuluh AI
              </button>
            </div>
          </div>

          <div className="relative min-h-[240px] bg-[#132219] lg:col-span-6">
            {heroImgError ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center bg-gradient-to-br from-[#132219] to-[#15613B] p-8 text-center text-white">
                <Sprout className="h-10 w-10 text-emerald-200" aria-hidden="true" />
                <p className="mt-3 font-display text-lg font-semibold">Lanskap Agroekologi Kota Batu</p>
                <p className="mt-1 text-xs text-emerald-100/80">Kecamatan Batu · Bumiaji · Junrejo</p>
              </div>
            ) : (
              <img
                src={HERO_IMG_URL}
                alt="Lahan pertanian terasering dan kebun apel di dataran tinggi Kota Batu berlatar Gunung Arjuno"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="h-full w-full object-cover lg:h-full"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              <span className="font-medium">Wilayah Kerja: Batu · Bumiaji · Junrejo</span>
              <span className="text-white/85">Puskeswan &amp; Balai Penyuluhan Terintegrasi</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Summary Strip directly below hero */}
      <section aria-label="Ringkasan data terpadu" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-[#526056]">Ternak Terdaftar QR</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#141E17] tabular-nums">
            {summary.totalTernak}
          </p>
          <p className="mt-1 text-xs text-[#526056]">
            {summary.sehat} sehat · {summary.pemantauanAtauTindakan} pantauan
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-[#526056]">Rekam Vaksinasi</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#141E17] tabular-nums">
            {summary.totalVaksinasi}
          </p>
          <p className="mt-1 text-xs text-[#526056]">
            {summary.vaksinPMK} dosis PMK tercatat
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-[#526056]">Inseminasi Buatan</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#141E17] tabular-nums">
            {summary.totalIB}
          </p>
          <p className="mt-1 text-xs text-[#526056]">Akseptor sapi &amp; kambing</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-[#526056]">Diagnosa Lapangan AI</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#141E17] tabular-nums">
            {diagnostics.length}
          </p>
          <p className="mt-1 text-xs text-[#526056]">Laporan OPT, ikan &amp; ternak</p>
        </div>
      </section>

      {/* 4 Core Field Modules */}
      <section aria-labelledby="layanan-utama-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="layanan-utama-heading" className="font-display text-xl font-bold text-[#141E17]">
              Empat Bidang Layanan Utama
            </h2>
            <p className="mt-1 text-sm text-[#526056]">
              Pilih modul sesuai kebutuhan pemeriksaan atau pencatatan di lapangan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.tab}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 transition-colors hover:border-stone-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#526056]">{svc.subtitle}</p>
                      <h3 className="mt-1 font-display text-lg font-bold text-[#141E17]">
                        {svc.title}
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF2EE] text-[#15613B]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#526056]">{svc.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onNavigate(svc.tab)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#15613B] hover:text-[#0F4C2E]"
                  >
                    {svc.actionLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Field Snapshot: Livestock & Recent AI Diagnostics */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#141E17]">
                Populasi Ternak Terpantau
              </h2>
              <p className="text-xs text-[#526056]">Ketuk baris untuk membuka profil &amp; QR Code</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('peternakan')}
              className="min-h-[40px] text-xs font-semibold text-[#15613B] hover:underline whitespace-nowrap"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {livestock.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectLivestockTag(item.tagId)}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-[#F7F8F6] px-2 -mx-2 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#141E17]">{item.nama}</p>
                  <p className="truncate text-xs text-[#526056]">
                    <span className="font-mono tabular-nums">{item.tagId}</span>
                    {' · '}
                    {item.spesies}
                    {' · '}
                    {item.kecamatan}
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
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#141E17]">
                Riwayat Diagnosa Citra Terbaru
              </h2>
              <p className="text-xs text-[#526056]">Hasil analisis OPT, ikan, dan kesehatan ternak</p>
            </div>
          </div>

          {diagnostics.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#526056]">
              Belum ada diagnosa citra tersimpan.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {diagnostics.slice(0, 4).map((diag) => (
                <div key={diag.id} className="py-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#526056]">
                    <span className="capitalize font-medium text-[#15613B]">{diag.bidang}</span>
                    <span className="font-mono tabular-nums">{diag.tanggal}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#141E17]">{diag.hasilUtama}</p>
                  <p className="mt-0.5 text-xs text-[#526056]">
                    {diag.subjek} · Tingkat: {diag.tingkat}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
