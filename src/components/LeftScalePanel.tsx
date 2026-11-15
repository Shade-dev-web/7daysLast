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
      className="fixed left-3 top-3 z-30 flex items-stretch gap-2.5 pointer-events-auto select-none"
    >
      {/* Vertical Precision Acoustic dB Column (Always Left) */}
      <div
        className="w-9 rounded-xl bg-[#0A0C10]/90 border border-white/15 p-1.5 flex flex-col items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
        title="Вертикальная шкала шума (дБ)"
      >
        <span className="text-[9px] font-mono font-bold tracking-tighter text-rose-400">100</span>
        <div className="relative w-3.5 flex-1 my-1 rounded-full overflow-hidden bg-black/80 border border-white/15 flex flex-col">
          {/* Top 40%: Red danger zone (60-100 dB) */}
          <div className="h-[40%] w-full bg-rose-950/80 border-b border-rose-500/30" />
          {/* Middle 30%: Amber caution zone (30-60 dB) */}
          <div className="h-[30%] w-full bg-amber-950/80 border-b border-amber-500/30" />
          {/* Bottom 30%: Green safe zone (0-30 dB) */}
          <div className="h-[30%] w-full bg-emerald-950/80" />

          {/* Live vertical fill from bottom */}
          <div
            ref={(el) => {
              scaleRefs.current.vertNoiseFill = el;
            }}
            className="absolute bottom-0 left-0 right-0 bg-emerald-400/80 transition-[height,background-color] duration-75"
            style={{ height: '5%' }}
          />
          {/* Live horizontal needle on vertical bar */}
          <div
            ref={(el) => {
              scaleRefs.current.vertNoiseMarker = el;
            }}
            className="absolute left-0 right-0 h-1 bg-white shadow-[0_0_8px_#fff] transition-[bottom] duration-75"
            style={{ bottom: '5%' }}
          />
        </div>
        <span className="text-[9px] font-mono font-bold tracking-tighter text-emerald-400">дБ</span>
      </div>

      {/* Main Left Survival & Acoustic Telemetry Stack */}
      <div className="w-56 sm:w-64 rounded-xl bg-[#0A0C10]/90 border border-white/15 p-3 flex flex-col gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
        {/* 1. Primary Acoustic Noise Meter */}
        <div className="flex flex-col gap-1 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
              </svg>
              ШКАЛА ШУМА
              {micActive && <span className="text-[10px] text-rose-400 font-mono">· МИК</span>}
            </span>
            <span
              ref={(el) => {
                scaleRefs.current.noiseVal = el;
              }}
              className="font-mono font-bold text-xs tabular-nums text-emerald-400"
            >
              5 дБ
            </span>
          </div>

          {/* 3-Zone Segmented Horizontal Bar */}
          <div className="relative h-2.5 w-full rounded-full bg-black/80 border border-white/20 flex overflow-visible">
            <div className="w-[30%] h-full bg-emerald-700/75 rounded-l-full" />
            <div className="w-[30%] h-full bg-amber-600/75" />
            <div className="w-[40%] h-full bg-rose-700/80 rounded-r-full" />
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
              className="absolute -top-1 w-1.5 h-4 rounded-sm bg-white shadow-[0_0_10px_#fff] -translate-x-1/2 transition-[left] duration-75"
              style={{ left: '5%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#9499A3]">
            <span>Тихо &lt;30</span>
            <span
              ref={(el) => {
                scaleRefs.current.noiseZoneBadge = el;
              }}
              className="font-mono font-semibold text-emerald-400"
            >
              БЕЗОПАСНО
            </span>
            <span>Охота 60+</span>
          </div>
        </div>

        {/* 2. Flashlight Battery & Controls */}
        <div className="flex flex-col gap-1 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTorch();
              }}
              className="font-semibold text-left text-amber-300 hover:text-amber-200 flex items-center gap-1.5 cursor-pointer"
              aria-label="Переключить фонарик"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3h8l-1 5H9zM9 8h6v3l-1 2v8h-4v-8l-1-2z" />
              </svg>
              <span>ФОНАРИК [{torchOn ? 'ВКЛ' : 'ВЫКЛ'}]</span>
            </button>
            <span
              ref={(el) => {
                scaleRefs.current.batteryVal = el;
              }}
              className="font-mono font-bold text-xs tabular-nums text-amber-400"
            >
              100%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              ref={(el) => {
                scaleRefs.current.batteryBar = el;
              }}
              className="h-full bg-amber-400 transition-[width] duration-150"
              style={{ width: '100%' }}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-[#9499A3] font-mono tabular-nums">
              Батарейки: <strong className="text-white">{batteriesCount}</strong> шт.
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onRechargeBattery();
              }}
              disabled={batteriesCount <= 0}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 disabled:opacity-40 border border-amber-400/40 text-[10px] font-bold text-amber-300 cursor-pointer"
            >
              +Зарядить [V]
            </button>
          </div>
        </div>

        {/* 3. Vitality Scales: HP, Hunger, Thirst, Breath, Door */}
        <div className="flex flex-col gap-1.5 text-[11px]">
          {/* Health */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-rose-400 font-semibold shrink-0">ЗДОРОВЬЕ</span>
            <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.hpGhost = el;
                }}
                className="absolute inset-y-0 left-0 bg-rose-300/40 transition-[width] duration-500"
                style={{ width: '100%' }}
              />
              <div
                ref={(el) => {
                  scaleRefs.current.hpBar = el;
                }}
                className="relative h-full bg-rose-500 transition-[width] duration-150"
                style={{ width: '100%' }}
              />
            </div>
            <span
              ref={(el) => {
                scaleRefs.current.hpVal = el;
              }}
              className="w-8 text-right font-mono font-bold tabular-nums text-white"
            >
              100
            </span>
          </div>

          {/* Food */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-amber-400 font-semibold shrink-0">СЫТОСТЬ</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.foodBar = el;
                }}
                className="h-full bg-amber-500 transition-[width] duration-200"
                style={{ width: '85%' }}
              />
            </div>
            <span
              ref={(el) => {
                scaleRefs.current.foodVal = el;
              }}
              className="w-8 text-right font-mono tabular-nums text-[#9499A3]"
            >
              85%
            </span>
          </div>

          {/* Water */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-sky-400 font-semibold shrink-0">ЖАЖДА</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.waterBar = el;
                }}
                className="h-full bg-sky-400 transition-[width] duration-200"
                style={{ width: '85%' }}
              />
            </div>
            <span
              ref={(el) => {
                scaleRefs.current.waterVal = el;
              }}
              className="w-8 text-right font-mono tabular-nums text-[#9499A3]"
            >
              85%
            </span>
          </div>

          {/* Breath & Pulse */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-cyan-300 font-semibold shrink-0">ДЫХАНИЕ</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.breathBar = el;
                }}
                className="h-full bg-cyan-300 transition-[width] duration-100"
                style={{ width: '100%' }}
              />
            </div>
            <span
              ref={(el) => {
                scaleRefs.current.pulseVal = el;
              }}
              className="w-12 text-right font-mono text-[10px] tabular-nums text-rose-300"
              title="Пульс выжившего (уд/мин)"
            >
              68 BPM
            </span>
          </div>

          {/* Door Barricade Integrity */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-emerald-400 font-semibold shrink-0">ДВЕРЬ</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={(el) => {
                  scaleRefs.current.doorBar = el;
                }}
                className="h-full bg-emerald-500 transition-[width] duration-200"
                style={{ width: '100%' }}
              />
            </div>
            <span
              ref={(el) => {
                scaleRefs.current.doorVal = el;
              }}
              className="w-8 text-right font-mono tabular-nums text-[#9499A3]"
            >
              100%
            </span>
          </div>
        </div>

        {/* 4. Quick Open Inventory & Crafting Workshop Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenInventory();
          }}
          data-testid="open-inventory-btn"
          className="mt-0.5 w-full py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between transition-transform active:scale-95 cursor-pointer"
        >
          <span>ИНВЕНТАРЬ И КРАФТ</span>
          <span className="font-mono text-[10px] text-amber-200">[I / C]</span>
        </button>
      </div>
    </aside>
  );
};
