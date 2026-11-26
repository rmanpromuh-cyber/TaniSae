import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Upload, X } from 'lucide-react';

export interface SelectedImagePayload {
  previewUrl: string;
  base64Data?: string;
  mimeType?: string;
  specimenFilename?: string;
  label: string;
}

interface ImageCaptureZoneProps {
  title: string;
  helperText: string;
  sampleImageUrl: string;
  sampleFilename: string;
  sampleLabel: string;
  selectedImage: SelectedImagePayload | null;
  onSelectImage: (image: SelectedImagePayload | null) => void;
  fallbackIcon: React.ReactNode;
  stepNumber?: number;
}

export const ImageCaptureZone: React.FC<ImageCaptureZoneProps> = ({
  title,
  helperText,
  sampleImageUrl,
  sampleFilename,
  sampleLabel,
  selectedImage,
  onSelectImage,
  fallbackIcon,
  stepNumber,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sampleImgFailed, setSampleImgFailed] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      onSelectImage({
        previewUrl: result,
        base64Data: result,
        mimeType: file.type || 'image/jpeg',
        label: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError('Kamera browser tidak tersedia atau izin ditolak. Gunakan unggah foto dari galeri.');
      cameraInputRef.current?.click();
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    onSelectImage({
      previewUrl: dataUrl,
      base64Data: dataUrl,
      mimeType: 'image/jpeg',
      label: `Foto Kamera (${new Date().toLocaleTimeString('id-ID')})`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2.5 font-display text-base font-bold text-[#141E17]">
            {typeof stepNumber === 'number' && (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#15613B] text-xs font-bold text-white">
                {stepNumber}
              </span>
            )}
            <span>{title}</span>
          </h3>
          <p className="mt-1 text-sm text-[#526056]">{helperText}</p>
        </div>
        {selectedImage && (
          <button
            type="button"
            onClick={() => onSelectImage(null)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-[#526056] transition-colors hover:bg-stone-100 hover:text-[#141E17] whitespace-nowrap shrink-0"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Ganti Foto
          </button>
        )}
      </div>

      {cameraOpen ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#132219]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-video w-full object-cover"
          />
          <div className="flex items-center justify-between gap-3 bg-[#132219] p-3">
            <button
              type="button"
              onClick={stopCamera}
              className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={captureFromVideo}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F4C2E]"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Ambil Gambar
            </button>
          </div>
        </div>
      ) : selectedImage ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="relative aspect-[4/3] w-full bg-[#EFF2EE]">
            <img
              src={selectedImage.previewUrl}
              alt={selectedImage.label}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2.5 text-xs text-[#526056]">
            <span className="truncate font-medium text-[#141E17]">{selectedImage.label}</span>
            <span>Siap dianalisis AI</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-[#F7F8F6] p-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF2EE] text-[#15613B]">
              {fallbackIcon}
            </div>
            <p className="mt-3 text-sm font-medium text-[#141E17]">
              Ambil foto langsung di lapangan atau unggah dari galeri
            </p>
            <p className="mt-1 text-xs text-[#526056]">
              Mendukung JPG, PNG, atau WebP dengan pencahayaan terang dan fokus pada gejala.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={openLiveCamera}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] whitespace-nowrap"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Buka Kamera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-[#141E17] transition-colors hover:bg-stone-50 whitespace-nowrap"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Unggah Foto
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-[#EFF2EE]">
                  {sampleImgFailed ? (
                    <div className="flex h-full w-full items-center justify-center text-[#526056]">
                      <ImageIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  ) : (
                    <img
                      src={sampleImageUrl}
                      alt={sampleLabel}
                      referrerPolicy="no-referrer"
                      onError={() => setSampleImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-medium text-[#141E17] truncate">Uji Cepat Foto Spesimen Lapangan</p>
                  <p className="text-xs text-[#526056] truncate">{sampleLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSelectImage({
                    previewUrl: sampleImageUrl,
                    specimenFilename: sampleFilename,
                    label: sampleLabel,
                  })
                }
                className="min-h-[44px] shrink-0 rounded-lg border border-[#15613B]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#15613B] transition-colors hover:bg-[#15613B]/5 whitespace-nowrap"
              >
                Gunakan Contoh
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <p role="alert" className="text-xs text-[#B91C1C]">
          {cameraError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Unggah berkas foto"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Ambil foto kamera perangkat"
      />
    </div>
  );
};
