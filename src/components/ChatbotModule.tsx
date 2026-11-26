import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '../types/tanisae';

const QUICK_TOPICS = [
  'Jadwal & syarat vaksinasi PMK dan Antraks di Kota Batu',
  'Cara mengendalikan kutu sisik dan embun tepung pada Apel Batu',
  'Penanganan kolam lele terkena Aeromonas saat musim hujan',
  'Syarat pengajuan SKKH dan pendaftaran kelompok tani DistanKP',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'model',
  content:
    'Selamat datang di Layanan Asisten Penyuluh 24/7 DistanKP Kota Batu. Silakan ajukan pertanyaan teknis seputar budidaya tanaman dataran tinggi, kesehatan ternak & vaksinasi, perikanan air tawar, maupun prosedur layanan perizinan lapangan.',
  timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
};

export const ChatbotModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: now,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setSending(true);

    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages
            .filter((m) => m.id !== 'welcome-1')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal mendapatkan jawaban dari penyuluh virtual.');
        return;
      }

      const replyMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: json.data.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
      requestAnimationFrame(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch {
      setError('Gagal terhubung ke layanan Penyuluh AI. Periksa koneksi Anda.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#141E17]">
          Asisten Penyuluh Virtual 24/7
        </h1>
        <p className="mt-1 text-sm text-[#526056]">
          Konsultasi interaktif teknis pertanian, peternakan, perikanan air tawar, dan perizinan DistanKP Kota Batu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Quick Prompts Column */}
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 lg:col-span-4">
          <h2 className="font-display text-sm font-bold text-[#141E17]">
            Topik Pertanyaan Cepat
          </h2>
          <p className="text-xs text-[#526056]">
            Pilih salah satu topik lapangan untuk langsung berkonsultasi.
          </p>
          <div className="space-y-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(topic)}
                className="min-h-[48px] w-full rounded-lg border border-stone-200 bg-[#F7F8F6] px-3.5 py-2.5 text-left text-xs font-medium text-[#141E17] transition-colors hover:border-[#15613B] hover:bg-[#EFF2EE] disabled:opacity-60"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="flex h-[560px] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white lg:col-span-8">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#15613B] text-white'
                      : 'border border-stone-200 bg-[#F7F8F6] text-[#141E17]'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-1 px-1 font-mono text-[11px] text-[#526056] tabular-nums">
                  {msg.role === 'user' ? 'Anda' : 'Penyuluh DistanKP'} · {msg.timestamp}
                </span>
              </div>
            ))}
            {sending && (
              <div className="flex items-start">
                <div className="rounded-2xl border border-stone-200 bg-[#F7F8F6] px-4 py-3 text-xs text-[#526056]">
                  Penyuluh sedang menyiapkan jawaban teknis...
                </div>
              </div>
            )}
            <div ref={listEndRef} />
          </div>

          {error && (
            <div role="alert" className="border-t border-red-200 bg-red-50 px-5 py-2 text-xs text-[#B91C1C]">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-stone-200 bg-white p-3 sm:p-4"
          >
            <label htmlFor="penyuluh-chat-input" className="sr-only">
              Tulis pertanyaan untuk Penyuluh Virtual
            </label>
            <input
              id="penyuluh-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan seputar budidaya, hama, ternak, ikan, atau perizinan..."
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 px-3.5 text-sm text-[#141E17] focus:border-[#15613B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Kirim pertanyaan"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
