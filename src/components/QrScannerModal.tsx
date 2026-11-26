import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, QrCode, Search, Upload, X } from 'lucide-react';
import type { LivestockRecord } from '../types/tanisae';
import { parseQrPayload } from '../utils/tanisaeLogic';

interface QrScannerModalProps {
  isOpen: boolean;
  livestock: LivestockRecord[];
  onClose: () => void;
  onDetectedTag: (tagId: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  livestock,
  onClose,
  onDetectedTag,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanningCamera, setScanningCamera] = useState(false);
  const [manualTag, setManualTag] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanningCamera(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStatusMessage(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const handleDecodedString = (raw: string) => {
    const tag = parseQrPayload(raw);
    if (!tag) return;
    stopCamera();
    onDetectedTag(tag);
    onClose();
  };

  const startLiveScanner = async () => {
    setStatusMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatusMessage('Kamera browser tidak tersedia pada perangkat ini. Gunakan unggah gambar QR atau masukkan ID Tag.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setScanningCamera(true);

      const scanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            if (code?.data) {
              handleDecodedString(code.data);
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            rafRef.current = requestAnimationFrame(scanFrame);
          }).catch(() => undefined);
        }
      });
    } catch {
      setStatusMessage('Izin kamera ditolak atau tidak ada kamera aktif. Anda dapat mengunggah foto QR atau memilih tag ternak di bawah.');
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code?.data) {
          handleDecodedString(code.data);
        } else {
          setStatusMessage('Kode QR tidak terbaca pada gambar tersebut. Pastikan QR terlihat jelas dan tidak buram.');
        }
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseQrPayload(manualTag);
    if (!parsed) {
      setStatusMessage('Masukkan ID/Tag ternak terlebih dahulu.');
      return;
    }
    onDetectedTag(parsed);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-stone-200 bg-white p-5 sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 id="qr-modal-title" className="font-display text-lg font-bold text-[#141E17]">
              Pindai QR Ternak
            </h2>
            <p className="mt-0.5 text-xs text-[#526056]">
              Arahkan kamera ke eartag QR atau cari berdasarkan ID ternak Kota Batu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemindai QR"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#526056] hover:bg-stone-100 hover:text-[#141E17]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {scanningCamera ? (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#132219]">
              <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex items-center justify-between px-4 py-3 text-xs text-white">
                <span>Memindai kode QR secara langsung...</span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="min-h-[40px] rounded-lg border border-white/25 px-3 py-1.5 font-medium text-white hover:bg-white/10"
                >
                  Hentikan Kamera
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startLiveScanner}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#15613B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E]"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Aktifkan Kamera QR
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-[#141E17] transition-colors hover:bg-stone-50"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Unggah Foto QR
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleQrFileUpload}
                className="hidden"
                aria-label="Unggah foto kode QR"
              />
            </div>
          )}

          {statusMessage && (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {statusMessage}
            </p>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label htmlFor="manual-qr-tag" className="block text-xs font-medium text-[#141E17]">
              Atau masukkan ID / Tag Ternak secara manual
            </label>
            <div className="flex gap-2">
              <input
                id="manual-qr-tag"
                type="text"
                value={manualTag}
                onChange={(e) => setManualTag(e.target.value)}
                placeholder="Contoh: BTU-SAP-001"
                className="min-h-[44px] flex-1 rounded-lg border border-stone-300 px-3 text-sm font-mono uppercase text-[#141E17] focus:border-[#15613B] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#141E17] px-4 text-sm font-medium text-white hover:bg-[#15613B]"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Cari
              </button>
            </div>
          </form>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-xs font-medium text-[#526056]">Akses cepat tag QR ternak terdaftar:</p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {livestock.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDecodedString(`TANISAE:${item.tagId}`)}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-left transition-colors hover:border-[#15613B] hover:bg-[#EFF2EE]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#141E17]">{item.nama}</p>
                    <p className="font-mono text-[11px] text-[#526056] tabular-nums">{item.tagId}</p>
                  </div>
                  <QrCode className="h-4 w-4 shrink-0 text-[#15613B]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
