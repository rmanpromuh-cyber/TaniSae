import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  addDiagnosticHistory,
  addMedicalRecord,
  createLivestock,
  getLivestockByTag,
  listDiagnostics,
  listLivestock,
} from './server/store';
import {
  analyzeAgricultureImage,
  analyzeFisheryImage,
  analyzeLivestockImage,
  askPenyuluhChat,
} from './server/gemini';
import { validateMedicalEntry, validateNewLivestock } from './src/utils/tanisaeLogic';
import type { FishSpecies, LivestockSpecies } from './src/types/tanisae';

const VALID_LIVESTOCK_SPECIES = new Set<LivestockSpecies>(['Sapi', 'Kambing', 'Ayam', 'Domba', 'Kelinci']);
const VALID_FISH_SPECIES = new Set<FishSpecies>(['Nila', 'Lele', 'Patin', 'Gurame', 'Tombro']);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'TaniSAE by DistanKP Batu' });
  });

  app.get('/api/livestock', (_req, res) => {
    try {
      res.json({ data: listLivestock() });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal memuat data ternak.' });
    }
  });

  app.get('/api/livestock/:tagId', (req, res) => {
    try {
      const record = getLivestockByTag(req.params.tagId);
      if (!record) {
        res.status(404).json({ error: `Ternak dengan ID ${req.params.tagId} tidak ditemukan.` });
        return;
      }
      res.json({ data: record });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal memuat profil ternak.' });
    }
  });

  app.post('/api/livestock', (req, res) => {
    try {
      const body = req.body ?? {};
      const input = {
        tagId: String(body.tagId ?? ''),
        nama: String(body.nama ?? ''),
        spesies: body.spesies as LivestockSpecies,
        ras: String(body.ras ?? ''),
        jenisKelamin: (body.jenisKelamin === 'Jantan' ? 'Jantan' : 'Betina') as 'Jantan' | 'Betina',
        umurBulan: Number(body.umurBulan),
        bobotKg: Number(body.bobotKg),
        pemilik: String(body.pemilik ?? ''),
        kelompokTani: String(body.kelompokTani ?? ''),
        kecamatan: (['Batu', 'Bumiaji', 'Junrejo'].includes(body.kecamatan)
          ? body.kecamatan
          : 'Batu') as 'Batu' | 'Bumiaji' | 'Junrejo',
        desa: String(body.desa ?? ''),
        statusKesehatan: (['Sehat', 'Pemantauan', 'Perlu Tindakan'].includes(body.statusKesehatan)
          ? body.statusKesehatan
          : 'Sehat') as 'Sehat' | 'Pemantauan' | 'Perlu Tindakan',
      };

      if (!VALID_LIVESTOCK_SPECIES.has(input.spesies)) {
        res.status(400).json({ error: 'Spesies ternak tidak valid.' });
        return;
      }

      const errors = validateNewLivestock(input);
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ error: Object.values(errors)[0], fields: errors });
        return;
      }

      const created = createLivestock(input);
      res.status(201).json({ data: created });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Gagal mendaftarkan ternak.' });
    }
  });

  app.post('/api/livestock/:tagId/medical', (req, res) => {
    try {
      const body = req.body ?? {};
      const errors = validateMedicalEntry(body);
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ error: Object.values(errors)[0], fields: errors });
        return;
      }

      const updated = addMedicalRecord(req.params.tagId, {
        kategori: body.kategori,
        jenisVaksin: body.jenisVaksin,
        dosis: body.dosis,
        kodeStrawIB: body.kodeStrawIB,
        pejantanIB: body.pejantanIB,
        petugas: String(body.petugas),
        diagnosaAtauCatatan: String(body.diagnosaAtauCatatan),
        jadwalBerikutnya: body.jadwalBerikutnya,
        statusKesehatanBaru: body.statusKesehatanBaru,
      });

      res.status(201).json({ data: updated });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan rekam medis.' });
    }
  });

  app.get('/api/diagnostics', (_req, res) => {
    try {
      res.json({ data: listDiagnostics() });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal memuat riwayat diagnosa.' });
    }
  });

  app.post('/api/diagnose/livestock', async (req, res) => {
    try {
      const { spesies, catatanGejala, image } = req.body ?? {};
      if (!VALID_LIVESTOCK_SPECIES.has(spesies)) {
        res.status(400).json({ error: 'Pilih spesies ternak yang valid (Sapi, Kambing, Ayam, Domba, Kelinci).' });
        return;
      }
      const result = await analyzeLivestockImage({ spesies, catatanGejala, image: image ?? {} });
      addDiagnosticHistory({
        bidang: 'peternakan',
        subjek: `Ternak ${spesies}`,
        hasilUtama: result.namaKondisi,
        tingkat: result.tingkatUrgensi,
        ringkasan: result.kemungkinanPenyebab,
      });
      res.json({ data: result });
    } catch (error) {
      console.error('Livestock diagnose error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Gagal menganalisis foto ternak.',
      });
    }
  });

  app.post('/api/diagnose/agriculture', async (req, res) => {
    try {
      const { komoditas, fasePertumbuhan, persentaseSerangan, catatanLapangan, image } = req.body ?? {};
      if (!komoditas || typeof komoditas !== 'string' || !komoditas.trim()) {
        res.status(400).json({ error: 'Komoditas tanaman wajib dipilih.' });
        return;
      }
      const cleanFase =
        typeof fasePertumbuhan === 'string' && fasePertumbuhan.trim()
          ? fasePertumbuhan.trim().slice(0, 80)
          : undefined;
      const numericAttack = Number(persentaseSerangan);
      const cleanPersentase =
        Number.isFinite(numericAttack) && persentaseSerangan !== undefined && persentaseSerangan !== null
          ? Math.min(100, Math.max(1, Math.round(numericAttack)))
          : undefined;

      const result = await analyzeAgricultureImage({
        komoditas: komoditas.trim().slice(0, 80),
        fasePertumbuhan: cleanFase,
        persentaseSerangan: cleanPersentase,
        catatanLapangan: typeof catatanLapangan === 'string' ? catatanLapangan.slice(0, 600) : undefined,
        image: image ?? {},
      });
      addDiagnosticHistory({
        bidang: 'pertanian',
        subjek: `Tanaman ${komoditas.trim()}`,
        hasilUtama: result.namaPenyakitAtauHama,
        tingkat: result.tingkatSerangan,
        ringkasan: `Agensi: ${result.agensiPenyebab.namaIlmiah} (${result.agensiPenyebab.kategori})${
          cleanPersentase ? ` · Serangan ${cleanPersentase}%` : ''
        }`,
      });
      res.json({ data: result });
    } catch (error) {
      console.error('Agriculture diagnose error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Gagal menganalisis foto tanaman.',
      });
    }
  });

  app.post('/api/diagnose/fishery', async (req, res) => {
    try {
      const { spesiesIkan, kondisiAir, image } = req.body ?? {};
      if (!VALID_FISH_SPECIES.has(spesiesIkan)) {
        res.status(400).json({ error: 'Pilih spesies ikan air tawar yang valid (Nila, Lele, Patin, Gurame, Tombro).' });
        return;
      }
      const result = await analyzeFisheryImage({ spesiesIkan, kondisiAir, image: image ?? {} });
      addDiagnosticHistory({
        bidang: 'perikanan',
        subjek: `Ikan ${spesiesIkan}`,
        hasilUtama: result.namaPenyakit,
        tingkat: result.tingkatRisiko,
        ringkasan: `${result.kategoriAgen} — ${result.agensiPenyebab}`,
      });
      res.json({ data: result });
    } catch (error) {
      console.error('Fishery diagnose error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Gagal menganalisis foto ikan.',
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body ?? {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Pertanyaan tidak boleh kosong.' });
        return;
      }
      const safeHistory = Array.isArray(history)
        ? history
            .filter(
              (item): item is { role: 'user' | 'model'; content: string } =>
                Boolean(item) &&
                (item.role === 'user' || item.role === 'model') &&
                typeof item.content === 'string'
            )
            .slice(-12)
        : [];

      const reply = await askPenyuluhChat({
        history: safeHistory,
        message: message.trim(),
      });

      res.json({ data: { reply } });
    } catch (error) {
      console.error('Penyuluh chat error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Gagal menghubungi Asisten Penyuluh AI.',
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`TaniSAE by DistanKP Batu server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
