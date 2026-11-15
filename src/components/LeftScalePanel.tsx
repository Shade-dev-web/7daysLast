import React from 'react';

export interface LeftScaleRefs {
  noiseMarker: HTMLDivElement | null;
  noiseFill: HTMLDivElement | null;
  noiseVal: HTMLSpanElement | null;
  noiseZoneBadge: HTMLSpanElement | null;
  vertNoiseFill: HTMLDivElement | null;
  vertNoiseMarker: HTMLDivElement | null;
  hpBar: HTMLDivElement | null;
  hpGhost: HTMLDivElement | null;
  hpVal: HTMLSpanElement | null;
  batteryBar: HTMLDivElement | null;
  batteryVal: HTMLSpanElement | null;
  foodBar: HTMLDivElement | null;
  foodVal: HTMLSpanElement | null;
  waterBar: HTMLDivElement | null;
  waterVal: HTMLSpanElement | null;
  breathBar: HTMLDivElement | null;
  pulseVal: HTMLSpanElement | null;
  doorBar: HTMLDivElement | null;
  doorVal: HTMLSpanElement | null;
}

interface LeftScalePanelProps {
  scaleRefs: React.MutableRefObject<LeftScaleRefs>;
  batteriesCount: number;
  torchOn: boolean;
  micActive: boolean;
  onToggleTorch: () => void;
  onRechargeBattery: () => void;
  onOpenInventory: () => void;
}

export const LeftScalePanel: React.FC<LeftScalePanelProps> = ({
  scaleRefs,
  batteriesCount,
  torchOn,
  micActive,
  onToggleTorch,
  onRechargeBattery,
  onOpenInventory,
}) => {
  return (
    <aside
      aria-label="Шкала выживания и уровня шума"
      data-testid="left-scale-panel"
      className="fixed left-2 top-2 z-30 flex items-stretch gap-1.5 pointer-events-none select-none"
    >
      {/* 1. Vertical Acoustic Noise Scale Column (Always Left, Zero Text Clutter) */}
      <div
        className="w-6 rounded-xl bg-[#0A0C10]/85 border border-white/15 py-1.5 px-1 flex flex-col items-center justify-between"
        title="Шкала шума"
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 ${micActive ? 'text-rose-400' : 'text-amber-400'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
        </svg>

        <div className="relative w-2.5 flex-1 my-1 rounded-full overflow-hidden bg-black/85 border border-white/15 flex flex-col">
          {/* Top 40%: Red danger zone */}
          <div className="h-[40%] w-full bg-rose-950/80 border-b border-rose-500/30" />
          {/* Middle 30%: Amber caution zone */}
          <div className="h-[30%] w-full bg-amber-950/80 border-b border-amber-500/30" />
          {/* Bottom 30%: Green safe zone */}
          <div className="h-[30%] w-full bg-emerald-950/80" />

          {/* Live vertical fill from bottom */}
          <div
            ref={(el) => {
              scaleRefs.current.vertNoiseFill = el;
            }}
            className="absolute bottom-0 left-0 right-0 bg-emerald-400/85"
            style={{ height: '5%' }}
          />
          {/* Live horizontal needle */}
          <div
            ref={(el) => {
              scaleRefs.current.vertNoiseMarker = el;
            }}
            className="absolute left-0 right-0 h-1 bg-white"
            style={{ bottom: '5%' }}
          />
        </div>
      </div>

      {/* 2. Ultra-Clean Icon-Only Visual Scales & Quick Action Buttons */}
      <div className="w-[88px] rounded-xl bg-[#0A0C10]/85 border border-white/15 p-1.5 flex flex-col gap-1.5">
        {/* Horizontal 3-Zone Noise Scale Bar */}
        <div className="relative h-2 w-full rounded-full bg-black/85 border border-white/20 flex overflow-visible">
          <div className="w-[30%] h-full bg-emerald-700/80 rounded-l-full" />
          <div className="w-[30%] h-full bg-amber-600/80" />
          <div className="w-[40%] h-full bg-rose-700/85 rounded-r-full" />
          <div
            ref={(el) => {
              scaleRefs.current.noiseFill = el;
            }}
            className="absolute left-0 top-0 bottom-0 rounded-l-full bg-white/25 pointer-events-none"
            style={{ width: '5%' }}
          />
          <div
            ref={(el) => {
              scaleRefs.current.noiseMarker = el;
            }}
            className="absolute -top-0.5 w-1.5 h-3 rounded-sm bg-white -translate-x-1/2"
            style={{ left: '5%' }}
          />
        </div>

        {/* Flashlight Toggle + Battery Bar + Recharge Icon Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleTorch();
            }}
            aria-label="Переключить фонарик"
            className={`pointer-events-auto w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border cursor-pointer ${
              torchOn
                ? 'bg-amber-500 text-black border-amber-300'
                : 'bg-white/10 text-amber-300 border-white/15'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 3h8l-1 5H9zM9 8h6v3l-1 2v8h-4v-8l-1-2z" />
            </svg>
          </button>

          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              ref={(el) => {
                scaleRefs.current.batteryBar = el;
              }}
              className="h-full bg-amber-400"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onRechargeBattery();
            }}
            disabled={batteriesCount <= 0}
            aria-label="Зарядить фонарик"
            className="pointer-events-auto w-6 h-6 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 disabled:opacity-30 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </button>
        </div>

        {/* Vitality Icon Bars (HP, Food, Water, Breath, Door) */}
        <div className="flex flex-col gap-1">
          {/* HP */}
          <div className="flex items-center gap-1.5" title="Здоровье">
            <svg className="w-3 h-3 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="relative flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.hpGhost = el;
                }}
                className="absolute inset-y-0 left-0 bg-rose-300/40"
                style={{ width: '100%' }}
              />
              <div
                ref={(el) => {
                  scaleRefs.current.hpBar = el;
                }}
                className="relative h-full bg-rose-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Food */}
          <div className="flex items-center gap-1.5" title="Сытость">
            <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="5" y="4" width="14" height="16" rx="2" />
              <line x1="5" y1="9" x2="19" y2="9" />
            </svg>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.foodBar = el;
                }}
                className="h-full bg-amber-500"
                style={{ width: '85%' }}
              />
            </div>
          </div>

          {/* Water */}
          <div className="flex items-center gap-1.5" title="Жажда">
            <svg className="w-3 h-3 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.waterBar = el;
                }}
                className="h-full bg-sky-400"
                style={{ width: '85%' }}
              />
            </div>
          </div>

          {/* Breath */}
          <div className="flex items-center gap-1.5" title="Дыхание">
            <svg className="w-3 h-3 text-cyan-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
            </svg>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.breathBar = el;
                }}
                className="h-full bg-cyan-300"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Door Barricade */}
          <div className="flex items-center gap-1.5" title="Прочность двери">
            <svg className="w-3 h-3 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.doorBar = el;
                }}
                className="h-full bg-emerald-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Quick Inventory & Crafting Icon Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenInventory();
          }}
          data-testid="open-inventory-btn"
          aria-label="Инвентарь и крафт"
          className="pointer-events-auto w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/45 text-amber-300 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="7" width="16" height="14" rx="2" />
            <path d="M8 7V5a4 4 0 0 1 8 0v2" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
