import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AgricultureDiagnosisResult,
  FishSpecies,
  FisheryDiagnosisResult,
  LivestockDiagnosisResult,
  LivestockSpecies,
} from '../src/types/tanisae';

const MODEL_NAME = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src/assets/images');

function formatGeminiError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return new Error(
      'Server AI sedang mengalami lonjakan permintaan sementara (503). Silakan klik ulang beberapa saat lagi.'
    );
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return new Error('Batas permintaan AI sementara tercapai (429). Mohon tunggu sebentar sebelum mencoba lagi.');
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return new Error('Kunci API Gemini tidak valid atau belum dikonfigurasi di Settings > Secrets.');
  }
  return err instanceof Error ? err : new Error(raw);
}

async function withRetry<T>(fn: (model: string) => Promise<T>): Promise<T> {
  const attempts = [
    { model: MODEL_NAME, delayMs: 800 },
    { model: MODEL_NAME, delayMs: 1200 },
    { model: FALLBACK_MODEL, delayMs: 0 },
  ];
  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await fn(attempts[i].model);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient || i === attempts.length - 1) {
        throw formatGeminiError(err);
      }
      if (attempts[i].delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempts[i].delayMs));
      }
    }
  }
  throw formatGeminiError(lastError);
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum terkonfigurasi di lingkungan server. Silakan atur melalui Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ImageInput {
  base64Data?: string;
  mimeType?: string;
  specimenFilename?: string;
}

function resolveImagePart(image: ImageInput): { inlineData: { mimeType: string; data: string } } {
  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  if (image.specimenFilename) {
    const cleanName = path.basename(image.specimenFilename);
    const resolvedPath = path.resolve(ASSETS_IMAGES_DIR, cleanName);
    if (!resolvedPath.startsWith(ASSETS_IMAGES_DIR + path.sep) || !fs.existsSync(resolvedPath)) {
      throw new Error('File spesimen contoh tidak ditemukan.');
    }
    const buf = fs.readFileSync(resolvedPath);
    return {
      inlineData: {
        mimeType: cleanName.endsWith('.png') ? 'image/png' : 'image/jpeg',
        data: buf.toString('base64'),
      },
    };
  }

  if (!image.base64Data || !image.mimeType || !allowedMimes.has(image.mimeType)) {
    throw new Error('Format citra tidak valid. Gunakan gambar JPG, PNG, atau WebP.');
  }

  // Strip optional data URL prefix safely
  const rawBase64 = image.base64Data.includes(',')
    ? image.base64Data.split(',')[1]
    : image.base64Data;

  if (!rawBase64 || rawBase64.length > 10 * 1024 * 1024) {
    throw new Error('Ukuran citra terlalu besar (maksimal 7 MB).');
  }

  return {
    inlineData: {
      mimeType: image.mimeType,
      data: rawBase64,
    },
  };
}

export async function analyzeLivestockImage(params: {
  spesies: LivestockSpecies;
  catatanGejala?: string;
  image: ImageInput;
}): Promise<LivestockDiagnosisResult> {
  const ai = getAiClient();
  const imagePart = resolveImagePart(params.image);

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: {
        parts: [
          imagePart,
          {
            text: `Anda adalah Dokter Hewan Ahli dari Dinas Pertanian dan Ketahanan Pangan (DistanKP) Kota Batu.
Analisis citra kondisi fisik hewan ternak berikut:
- Spesies: ${params.spesies}
- Catatan gejala tambahan dari peternak: ${params.catatanGejala || 'Tidak ada catatan tambahan'}

Berikan deteksi dini penyakit atau status kesehatan fisik hewan secara objektif dalam Bahasa Indonesia yang praktis untuk peternak dan petugas Puskeswan Kota Batu.`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaKondisi: { type: Type.STRING, description: 'Nama kondisi atau indikasi awal penyakit' },
            tingkatUrgensi: { type: Type.STRING, description: 'Harus salah satu: Rendah, Sedang, atau Tinggi' },
            gejalaTeramati: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar gejala visual atau fisik yang terlihat pada foto',
            },
            kemungkinanPenyebab: { type: Type.STRING, description: 'Kemungkinan penyebab medis/lingkungan' },
            tindakanSegera: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Langkah pertolongan pertama, biosekuriti, dan isolasi kandang',
            },
            rekomendasiVaksinAtauMedis: {
              type: Type.STRING,
              description: 'Saran vaksinasi (seperti PMK, Antraks, Rabies, ND) atau pemeriksaan dokter hewan',
            },
            catatanDistanKP: {
              type: Type.STRING,
              description: 'Catatan pelaporan ke Puskeswan / DistanKP Kota Batu',
            },
          },
          required: [
            'namaKondisi',
            'tingkatUrgensi',
            'gejalaTeramati',
            'kemungkinanPenyebab',
            'tindakanSegera',
            'rekomendasiVaksinAtauMedis',
            'catatanDistanKP',
          ],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as LivestockDiagnosisResult;
  return parsed;
}

export async function analyzeAgricultureImage(params: {
  komoditas: string;
  fasePertumbuhan?: string;
  persentaseSerangan?: number;
  catatanLapangan?: string;
  image: ImageInput;
}): Promise<AgricultureDiagnosisResult> {
  const ai = getAiClient();
  const imagePart = resolveImagePart(params.image);

  const attackContext =
    typeof params.persentaseSerangan === 'number'
      ? `${params.persentaseSerangan}% (${
          params.persentaseSerangan < 25
            ? 'Sporadis'
            : params.persentaseSerangan < 50
            ? 'Ambang Ekonomi'
            : 'Kritis / Endemik Berat'
        })`
      : 'Tidak disebutkan';

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: {
        parts: [
          imagePart,
          {
            text: `Anda adalah Pakar Pengendalian Organisme Pengganggu Tumbuhan (OPT) dari DistanKP Kota Batu (ahli komoditas dataran tinggi seperti Apel Batu, Cabai Merah, Jeruk Keprok, Kentang, Kubis, Stroberi, Wortel, Tomat).
Analisis foto bagian tanaman berikut:
- Komoditas tanaman: ${params.komoditas}
- Fase pertumbuhan tanaman: ${params.fasePertumbuhan || 'Tidak disebutkan'}
- Estimasi persentase serangan lahan: ${attackContext}
- Catatan lapangan petani: ${params.catatanLapangan || 'Tidak ada catatan tambahan'}

Sesuaikan intensitas rekomendasi (terutama prioritas tindakan cepat pada serangan Ambang Ekonomi/Kritis dan keamanan Interval Aman Panen / PHI bila fase Generatif atau Menjelang Panen).
WAJIB mengidentifikasi:
1. Nama penyakit atau jenis hama secara jelas.
2. Agensi penyebab spesifik (kategori: Jamur/Bakteri/Virus/Serangga/Nematoda/Tungau / Lainnya, nama ilmiah Latin yang akurat, dan nama lokal).
3. Rekomendasi pengendalian yang terbagi tegas ke dalam 3 pilar: Pestisida Kimia, Pestisida Nabati/Organik, dan Kultur Teknis/Perlakuan Khusus.
Gunakan Bahasa Indonesia yang jelas dan aplikatif bagi petani Kota Batu.`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaPenyakitAtauHama: { type: Type.STRING },
            tingkatSerangan: { type: Type.STRING, description: 'Harus salah satu: Ringan, Sedang, atau Berat' },
            agensiPenyebab: {
              type: Type.OBJECT,
              properties: {
                kategori: {
                  type: Type.STRING,
                  description: 'Salah satu: Jamur, Bakteri, Virus, Serangga, Nematoda, Tungau / Lainnya',
                },
                namaIlmiah: { type: Type.STRING },
                namaLokal: { type: Type.STRING },
                deskripsiSingkat: { type: Type.STRING },
              },
              required: ['kategori', 'namaIlmiah', 'namaLokal', 'deskripsiSingkat'],
            },
            gejalaKlinis: { type: Type.ARRAY, items: { type: Type.STRING } },
            pengendalian: {
              type: Type.OBJECT,
              properties: {
                pestisidaKimia: {
                  type: Type.OBJECT,
                  properties: {
                    bahanAktif: { type: Type.STRING },
                    dosisAnjuran: { type: Type.STRING },
                    caraAplikasi: { type: Type.STRING },
                    intervalPanen: { type: Type.STRING },
                  },
                  required: ['bahanAktif', 'dosisAnjuran', 'caraAplikasi', 'intervalPanen'],
                },
                pestisidaNabati: {
                  type: Type.OBJECT,
                  properties: {
                    bahanAlami: { type: Type.STRING },
                    caraPembuatan: { type: Type.STRING },
                    caraAplikasi: { type: Type.STRING },
                  },
                  required: ['bahanAlami', 'caraPembuatan', 'caraAplikasi'],
                },
                kulturTeknis: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['pestisidaKimia', 'pestisidaNabati', 'kulturTeknis'],
            },
          },
          required: [
            'namaPenyakitAtauHama',
            'tingkatSerangan',
            'agensiPenyebab',
            'gejalaKlinis',
            'pengendalian',
          ],
        },
      },
    })
  );

  return JSON.parse((response.text ?? '{}').trim()) as AgricultureDiagnosisResult;
}

export async function analyzeFisheryImage(params: {
  spesiesIkan: FishSpecies;
  kondisiAir?: string;
  image: ImageInput;
}): Promise<FisheryDiagnosisResult> {
  const ai = getAiClient();
  const imagePart = resolveImagePart(params.image);

  const response = await withRetry((model) =>
    ai.models.generateContent({
      model,
      contents: {
        parts: [
          imagePart,
          {
            text: `Anda adalah Pakar Kesehatan Ikan & Lingkungan Budidaya Air Tawar dari DistanKP Kota Batu.
Analisis foto kondisi fisik ikan berikut:
- Spesies Ikan: ${params.spesiesIkan}
- Info kondisi kolam/air: ${params.kondisiAir || 'Kolam air tawar dataran tinggi Kota Batu'}

Deteksi potensi penyakit, parasit (seperti Ichthyophthirius, Argulus, Dactylogyrus), jamur (Saprolegnia), atau infeksi bakteri (Aeromonas, Streptococcus) beserta gejala yang terlihat, saran penanganan kolam & kualitas air, serta langkah pengobatan/karantina ikan.`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaPenyakit: { type: Type.STRING },
            kategoriAgen: {
              type: Type.STRING,
              description: 'Salah satu: Parasit, Jamur, Bakteri, Virus, Gangguan Lingkungan',
            },
            agensiPenyebab: { type: Type.STRING },
            tingkatRisiko: { type: Type.STRING, description: 'Salah satu: Rendah, Sedang, Tinggi' },
            gejalaTeramati: { type: Type.ARRAY, items: { type: Type.STRING } },
            penangananKolam: {
              type: Type.OBJECT,
              properties: {
                kualitasAir: { type: Type.ARRAY, items: { type: Type.STRING } },
                manajemenKolam: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['kualitasAir', 'manajemenKolam'],
            },
            pengobatan: {
              type: Type.OBJECT,
              properties: {
                metode: { type: Type.STRING },
                dosisDanDurasi: { type: Type.STRING },
                karantina: { type: Type.STRING },
              },
              required: ['metode', 'dosisDanDurasi', 'karantina'],
            },
          },
          required: [
            'namaPenyakit',
            'kategoriAgen',
            'agensiPenyebab',
            'tingkatRisiko',
            'gejalaTeramati',
            'penangananKolam',
            'pengobatan',
          ],
        },
      },
    })
  );

  return JSON.parse((response.text ?? '{}').trim()) as FisheryDiagnosisResult;
}

export async function askPenyuluhChat(params: {
  history: Array<{ role: 'user' | 'model'; content: string }>;
  message: string;
}): Promise<string> {
  const ai = getAiClient();

  const response = await withRetry(async (model) => {
    const chat = ai.chats.create({
      model,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `Anda adalah Asisten Penyuluh Virtual 24/7 resmi dari Dinas Pertanian dan Ketahanan Pangan (DistanKP) Kota Batu, Jawa Timur.
Keahlian Anda mencakup:
1. Pertanian dataran tinggi khas Kota Batu (Apel Batu, Jeruk Keprok, Kentang, Kubis, Stroberi, Bunga Hias, Sayuran Organik) serta Pengendalian Hama Terpadu (PHT/OPT).
2. Peternakan (Sapi Perah PFH, Kambing PE, Domba, Kelinci, Ayam) termasuk vaksinasi wajib (PMK, Rabies, Antraks), Inseminasi Buatan (IB), pakan hijauan, dan SKKH (Surat Keterangan Kesehatan Hewan).
3. Perikanan air tawar (Nila, Lele, Patin, Gurame, Tombro) termasuk manajemen kualitas air kolam, bioflok, dan pencegahan penyakit ikan.
4. Perizinan & layanan DistanKP Kota Batu (OSS RBA usaha tani/ternak/budidaya, pendaftaran kelompok tani/Pokdakan, sertifikasi Prima/Organik, serta pengajuan bantuan benih/vaksin).

Jawab dengan Bahasa Indonesia yang ramah, profesional, terstruktur dengan poin-poin ringkas dan angka teknis yang jelas, tanpa basa-basi berlebihan.`,
      },
      history: params.history.slice(-10).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    return chat.sendMessage({
      message: params.message,
    });
  });

  return (response.text ?? '').trim() || 'Maaf, sistem penyuluh tidak menerima respons. Silakan coba lagi.';
}
