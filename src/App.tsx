import React, { useCallback, useEffect, useState } from 'react';
import { AgricultureModule } from './components/AgricultureModule';
import { ChatbotModule } from './components/ChatbotModule';
import { Ci3BlueprintModal } from './components/Ci3BlueprintModal';
import { FisheryModule } from './components/FisheryModule';
import { HomeView } from './components/HomeView';
import { LivestockModule } from './components/LivestockModule';
import { Navbar } from './components/Navbar';
import { QrScannerModal } from './components/QrScannerModal';
import type { AppTab, DiagnosticHistoryItem, LivestockRecord } from './types/tanisae';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('beranda');
  const [livestock, setLivestock] = useState<LivestockRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticHistoryItem[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrNotFoundNotice, setQrNotFoundNotice] = useState<string | null>(null);
  const [ci3ModalOpen, setCi3ModalOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const [livRes, diagRes] = await Promise.all([
        fetch('/api/livestock'),
        fetch('/api/diagnostics'),
      ]);
      const livJson = await livRes.json();
      const diagJson = await diagRes.json();
      if (livRes.ok && Array.isArray(livJson.data)) {
        setLivestock(livJson.data);
        setSelectedTagId((prev) => prev ?? livJson.data[0]?.tagId ?? null);
      }
      if (diagRes.ok && Array.isArray(diagJson.data)) {
        setDiagnostics(diagJson.data);
      }
      setLoadError(null);
    } catch {
      setLoadError('Gagal memuat data awal dari server TaniSAE.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Support deep link ?ternak=BTU-SAP-001
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('ternak');
    if (tagParam) {
      setSelectedTagId(tagParam.toUpperCase());
      setActiveTab('peternakan');
    }
  }, []);

  const handleQrDetected = (tagId: string) => {
    const found = livestock.find((item) => item.tagId.toUpperCase() === tagId.toUpperCase());
    if (found) {
      setQrNotFoundNotice(null);
      setSelectedTagId(found.tagId);
      setActiveTab('peternakan');
    } else {
      setQrNotFoundNotice(`Ternak dengan ID "${tagId}" tidak ditemukan di database Kota Batu.`);
      setActiveTab('peternakan');
    }
  };

  const handleSelectLivestockFromHome = (tagId: string) => {
    setQrNotFoundNotice(null);
    setSelectedTagId(tagId);
    setActiveTab('peternakan');
  };

  const handleLivestockCreated = (created: LivestockRecord) => {
    setLivestock((prev) => [created, ...prev]);
  };

  const handleLivestockUpdated = (updated: LivestockRecord) => {
    setLivestock((prev) => prev.map((item) => (item.tagId === updated.tagId ? updated : item)));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F6] text-[#141E17]">
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setQrNotFoundNotice(null);
          setActiveTab(tab);
        }}
        onOpenQrScanner={() => setQrModalOpen(true)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
        {loadError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
            {loadError}
          </div>
        )}

        {qrNotFoundNotice && (
          <div role="status" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{qrNotFoundNotice}</span>
            <button
              type="button"
              onClick={() => setQrNotFoundNotice(null)}
              className="text-xs font-semibold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-64 w-full animate-pulse rounded-2xl bg-stone-200" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="h-28 animate-pulse rounded-xl bg-stone-200" />
              <div className="h-28 animate-pulse rounded-xl bg-stone-200" />
              <div className="h-28 animate-pulse rounded-xl bg-stone-200" />
              <div className="h-28 animate-pulse rounded-xl bg-stone-200" />
            </div>
          </div>
        ) : activeTab === 'beranda' ? (
          <HomeView
            livestock={livestock}
            diagnostics={diagnostics}
            onNavigate={setActiveTab}
            onSelectLivestockTag={handleSelectLivestockFromHome}
          />
        ) : activeTab === 'peternakan' ? (
          <LivestockModule
            livestock={livestock}
            selectedTagId={selectedTagId}
            onSelectTag={setSelectedTagId}
            onOpenQrScanner={() => setQrModalOpen(true)}
            onLivestockCreated={handleLivestockCreated}
            onLivestockUpdated={handleLivestockUpdated}
            onDiagnosticSaved={fetchAllData}
          />
        ) : activeTab === 'pertanian' ? (
          <AgricultureModule onDiagnosticSaved={fetchAllData} />
        ) : activeTab === 'perikanan' ? (
          <FisheryModule onDiagnosticSaved={fetchAllData} />
        ) : (
          <ChatbotModule />
        )}
      </main>

      <footer className="hidden border-t border-stone-200 bg-white py-6 md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-[#526056] lg:px-8">
          <p>
            TaniSAE by Dinas Pertanian dan Ketahanan Pangan (DistanKP) Kota Batu · Jawa Timur
          </p>
          <button
            type="button"
            onClick={() => setCi3ModalOpen(true)}
            className="font-medium text-[#15613B] hover:underline"
          >
            Dokumentasi Arsitektur CodeIgniter 3 &amp; MySQL
          </button>
        </div>
      </footer>

      <QrScannerModal
        isOpen={qrModalOpen}
        livestock={livestock}
        onClose={() => setQrModalOpen(false)}
        onDetectedTag={handleQrDetected}
      />

      <Ci3BlueprintModal isOpen={ci3ModalOpen} onClose={() => setCi3ModalOpen(false)} />
    </div>
  );
}
