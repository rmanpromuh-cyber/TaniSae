import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

interface Ci3BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SNIPPETS = {
  schema: `-- Skema Database MySQL (InnoDB, utf8mb4) untuk TaniSAE DistanKP Kota Batu
CREATE TABLE ternak (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tag_id VARCHAR(32) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  spesies ENUM('Sapi','Kambing','Ayam','Domba','Kelinci') NOT NULL,
  ras VARCHAR(100) NOT NULL,
  jenis_kelamin ENUM('Jantan','Betina') NOT NULL,
  umur_bulan SMALLINT UNSIGNED NOT NULL,
  bobot_kg DECIMAL(6,2) NOT NULL,
  pemilik VARCHAR(120) NOT NULL,
  kelompok_tani VARCHAR(120) DEFAULT NULL,
  kecamatan ENUM('Batu','Bumiaji','Junrejo') NOT NULL,
  desa VARCHAR(80) NOT NULL,
  status_kesehatan ENUM('Sehat','Pemantauan','Perlu Tindakan') DEFAULT 'Sehat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rekam_medis_ternak (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ternak_id INT UNSIGNED NOT NULL,
  tanggal DATE NOT NULL,
  kategori ENUM('Vaksinasi','Inseminasi Buatan','Pemeriksaan Klinis') NOT NULL,
  jenis_vaksin ENUM('PMK','Rabies','Antraks','Lainnya') DEFAULT NULL,
  dosis VARCHAR(60) DEFAULT NULL,
  kode_straw_ib VARCHAR(64) DEFAULT NULL,
  pejantan_ib VARCHAR(120) DEFAULT NULL,
  petugas VARCHAR(120) NOT NULL,
  catatan TEXT NOT NULL,
  jadwal_berikutnya DATE DEFAULT NULL,
  CONSTRAINT fk_medis_ternak FOREIGN KEY (ternak_id) REFERENCES ternak(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  controller: `<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Peternakan extends CI_Controller {
    public function __construct() {
        parent::__construct();
        $this->load->model('Ternak_model');
        $this->load->library(['form_validation', 'gemini_ai']);
        $this->load->helper(['security', 'url']);
    }

    public function profil_qr($tag_id = '') {
        $clean_tag = strtoupper(trim($this->security->xss_clean($tag_id)));
        $data['ternak'] = $this->Ternak_model->get_by_tag_with_medis($clean_tag);
        if (!$data['ternak']) show_404();
        $this->load->view('peternakan/detail_qr', $data);
    }

    public function simpan_medis($tag_id) {
        $this->form_validation->set_rules('petugas', 'Petugas', 'required|trim|max_length[120]');
        $this->form_validation->set_rules('catatan', 'Catatan', 'required|trim');
        if ($this->form_validation->run() === FALSE) {
            return $this->output->set_status_header(400)
                ->set_content_type('application/json')
                ->set_output(json_encode(['error' => validation_errors()]));
        }
        $payload = [
            'kategori' => $this->input->post('kategori', TRUE),
            'jenis_vaksin' => $this->input->post('jenis_vaksin', TRUE),
            'kode_straw_ib' => $this->input->post('kode_straw_ib', TRUE),
            'petugas' => $this->input->post('petugas', TRUE),
            'catatan' => $this->input->post('catatan', TRUE),
        ];
        $this->Ternak_model->insert_medical_record($tag_id, $payload);
        return $this->output->set_content_type('application/json')
            ->set_output(json_encode(['status' => 'ok']));
    }
}`,
  model: `<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Ternak_model extends CI_Model {
    // Query Binding mencegah SQL Injection sepenuhnya
    public function get_by_tag_with_medis($tag_id) {
        $sql = "SELECT * FROM ternak WHERE tag_id = ? LIMIT 1";
        $ternak = $this->db->query($sql, [$tag_id])->row_array();
        if (!$ternak) return null;

        $med_sql = "SELECT * FROM rekam_medis_ternak WHERE ternak_id = ? ORDER BY tanggal DESC";
        $ternak['rekam_medis'] = $this->db->query($med_sql, [$ternak['id']])->result_array();
        return $ternak;
    }

    public function insert_medical_record($tag_id, array $data) {
        $ternak = $this->db->get_where('ternak', ['tag_id' => $tag_id])->row_array();
        if (!$ternak) throw new RuntimeException('Ternak tidak ditemukan.');
        $data['ternak_id'] = $ternak['id'];
        $data['tanggal'] = date('Y-m-d');
        return $this->db->insert('rekam_medis_ternak', $data);
    }
}`,
};

export const Ci3BlueprintModal: React.FC<Ci3BlueprintModalProps> = ({ isOpen, onClose }) => {
  const [activeCode, setActiveCode] = useState<'schema' | 'controller' | 'model'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(SNIPPETS[activeCode]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ci3-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 id="ci3-modal-title" className="font-display text-lg font-bold text-[#141E17]">
              Cetak Biru MVC CodeIgniter 3 & Skema MySQL
            </h2>
            <p className="text-xs text-[#526056]">
              Referensi struktur PHP CI3 aman (CSRF, XSS Clean, Query Binding) untuk implementasi server dinas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup cetak biru CI3"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#526056] hover:bg-stone-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-stone-200 bg-[#F7F8F6] px-6 py-2.5">
          <div className="flex gap-1">
            {(
              [
                ['schema', 'MySQL Schema (DDL)'],
                ['controller', 'Controller Peternakan.php'],
                ['model', 'Model Ternak_model.php'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCode(key)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCode === key
                    ? 'bg-white text-[#141E17] shadow-xs'
                    : 'text-[#526056] hover:text-[#141E17]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-[#141E17] hover:bg-stone-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin Kode'}
          </button>
        </div>

        <div className="overflow-auto bg-[#132219] p-5 text-xs leading-relaxed text-emerald-50">
          <pre className="font-mono whitespace-pre-wrap">{SNIPPETS[activeCode]}</pre>
        </div>
      </div>
    </div>
  );
};
