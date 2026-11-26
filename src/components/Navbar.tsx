import React from 'react';
import { Beef, Fish, Home, MessageSquareText, QrCode, Sprout } from 'lucide-react';
import type { AppTab } from '../types/tanisae';

interface NavbarProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenQrScanner: () => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; mobileLabel: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'beranda', label: 'Beranda', mobileLabel: 'Beranda', icon: Home },
  { id: 'peternakan', label: 'Peternakan', mobileLabel: 'Ternak', icon: Beef },
  { id: 'pertanian', label: 'Pertanian', mobileLabel: 'Tani', icon: Sprout },
  { id: 'perikanan', label: 'Perikanan', mobileLabel: 'Ikan', icon: Fish },
  { id: 'penyuluh', label: 'Penyuluh AI', mobileLabel: 'Penyuluh', icon: MessageSquareText },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate, onOpenQrScanner }) => {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:h-16 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="font-display text-lg font-bold tracking-tight text-[#141E17] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15613B]"
          >
            TaniSAE
          </button>

          {/* Zone 2: 5 concise single-line text links */}
          <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15613B] ${
                    active ? 'text-[#15613B]' : 'text-[#526056] hover:text-[#141E17]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#15613B]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#15613B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C2E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15613B]"
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              <span>Scan QR Ternak</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Thumb Navigation (< 15% viewport height combined with header) */}
      <nav
        aria-label="Navigasi seluler"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-md md:hidden pb-safe"
      >
        <div className="grid h-16 grid-cols-5 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  active ? 'text-[#15613B]' : 'text-[#526056]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
