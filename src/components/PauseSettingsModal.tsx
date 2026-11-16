import React, { useEffect, useRef, useState } from 'react';
import { SaveSlotMeta } from '../game/saveSystem';
import { TEN_HORROR_IDEAS } from '../game/horrorIdeas';

export interface GameSettings {
  sens: number;
  uiScale: number;
  uiOpacity: number;
  quality: number; // 0: Low, 1: Medium, 2: Ultra Shaders
  targetFps: 60 | 90 | 120 | 240;
  showFps: boolean;
  dynamicLights: boolean;
  customShaders: boolean;
  shadows: boolean;
  jumpscareIntensity: number; // 0, 0.6, 1.0, 1.4
  screamVol: number; // 0.0 - 1.5
  darknessLevel: number; // 0.2 - 1.0
  graphicsModIntensity: number; // 0.0 - 1.0
  vib: boolean;
  fov: number;
  vol: number;
  ambientVol: number;
}

export interface ModMenuState {
  god: boolean;
  infAmmo: boolean;
  infBattery: boolean;
  noHunger: boolean;
  silent: boolean;
  blind: boolean;
  esp: boolean;
  nightVision: boolean;
  slowMo: boolean;
  speedMul: number;
  timeScale: number;
}

interface PauseSettingsModalProps {
  open: boolean;
  initialTab?: number;
  isFromMainMenu: boolean;
  cfg: GameSettings;
  mod: ModMenuState;
  micOn: boolean;
  slots: SaveSlotMeta[];
  onClose: () => void;
  onReturnToMenu: () => void;
  onUpdateCfg: (partial: Partial<GameSettings>) => void;
  onUpdateMod: (partial: Partial<ModMenuState>) => void;
  onToggleMic: (on: boolean) => void;
  onSaveSlot: (slotId: string) => void;
  onLoadSlot: (slotId: string) => void;
  onModAction: (action: string) => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  open,
  initialTab = 0,
  isFromMainMenu,
  cfg,
  mod,
  micOn,
  slots,
  onClose,
  onReturnToMenu,
  onUpdateCfg,
  onUpdateMod,
  onToggleMic,
  onSaveSlot,
  onLoadSlot,
  onModAction,
}) => {
  const [tab, setTab] = useState<number>(initialTab);
  const [scrollPct, setScrollPct] = useState<number>(0);
  const leftPaneRef = useRef<HTMLDivElement | null>(null);
  const rightPaneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setScrollPct(0);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const handleMiddleScrollSlider = (pct: number) => {
    setScrollPct(pct);
    if (leftPaneRef.current) {
      const maxL = Math.max(0, leftPaneRef.current.scrollHeight - leftPaneRef.current.clientHeight);
      leftPaneRef.current.scrollTop = (pct / 100) * maxL;
    }
    if (rightPaneRef.current) {
      const maxR = Math.max(0, rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight);
      rightPaneRef.current.scrollTop = (pct / 100) * maxR;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Меню паузы, сохранений, настроек и Graphics Mod"
      data-testid="pause-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-2 sm:p-4 select-none"
    >
      <div className="w-full max-w-5xl h-[94vh] sm:h-[90vh] rounded-2xl bg-[#0B0D12] border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b border-white/10 bg-[#07080C]">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            {[
              { id: 0, label: 'Пауза и Справка' },
              { id: 1, label: 'Ключевые Точки' },
              { id: 2, label: 'Настройки и Graphics Mod' },
              { id: 3, label: '10 Идей и Мод-меню' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setScrollPct(0);
                }}
                data-testid={`pause-tab-${t.id}`}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  tab === t.id
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-[#9499A3] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="resume-btn"
            className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFromMainMenu ? 'Назад' : 'В игру [Esc]'}
          </button>
        </div>

        {/* Main Body with Central Scrollbar Right in the Middle of the Screen */}
        <div className="flex-1 grid grid-cols-[1fr_36px_1fr] min-h-0 overflow-hidden text-sm">
          {/* LEFT PANE (Scrollable with scrollbar right along the middle divider) */}
          <div
            ref={leftPaneRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const max = Math.max(1, el.scrollHeight - el.clientHeight);
              setScrollPct(Math.round((el.scrollTop / max) * 100));
            }}
            data-testid="settings-left-pane"
            className="custom-scrollbar overflow-y-scroll p-3 sm:p-4 space-y-4 border-r border-white/10"
          >
            {tab === 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    Вернуться в игру
                  </button>
                  {!isFromMainMenu && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTab(1)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        Сохранить точку
                      </button>
                      <button
                        type="button"
                        onClick={onReturnToMenu}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        В главное меню
                      </button>
                    </>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/35">
                  <h3 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                    Деградация ёмкости батарей по дням
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    С каждым прожитым днём химические ячейки найденных батарей окисляются: в День 1 максимальный заряд составляет 100% (+55% за батарейку), а к 7-му дню потолок падает до 45% (+25% за замену). Используйте багровые фальшфейеры [X] и УФ-режим [U] для экономии света!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">
                    Постоянная шкала шума слева
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Слева всегда видна акустическая шкала. В зелёной зоне (&lt;30 дБ) твари вас не слышат. Бег, прыжки и выстрелы мгновенно поднимают шум в красную зону и вызывают охоту.
                  </p>
                </div>
              </div>
            )}

            {tab === 1 && (
              <div className="space-y-3">
                <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Слоты ключевых точек (1–2)
                </h3>
                {slots.slice(0, 2).map((slot) => {
                  const d = slot.data;
                  return (
                    <div
                      key={slot.slotId}
                      data-testid={`save-slot-${slot.slotId}`}
                      className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-amber-400">{slot.label}</span>
                        <span className="font-mono text-[11px] text-[#9499A3]">
                          {d ? d.savedAt : 'Пусто'}
                        </span>
                      </div>
                      {d ? (
                        <div className="text-xs text-white/90 font-mono tabular-nums space-y-0.5">
                          <div>Точка: {d.title}</div>
                          <div>
                            День {d.day} ({d.clock}) · HP: {Math.round(d.hp)} · Заряд:{' '}
                            {Math.round(d.battery)}%
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9499A3]">Слот свободен для записи.</p>
                      )}
                      <div className="flex items-center gap-2">
                        {!isFromMainMenu && slot.slotId !== 'auto' && (
                          <button
                            type="button"
                            data-testid={`save-btn-${slot.slotId}`}
                            onClick={() => onSaveSlot(slot.slotId)}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                          >
                            Сохранить
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!d}
                          data-testid={`load-btn-${slot.slotId}`}
                          onClick={() => onLoadSlot(slot.slotId)}
                          className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white font-bold text-xs cursor-pointer"
                        >
                          Загрузить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Ползунки Звука Ужаса, Крика и Мрака
                </h3>

                {/* Slider 1: Monster Scream Volume + Instant Test Button */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/35 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">
                        Громкость жуткого крика тварей
                      </div>
                      <div className="text-[11px] text-[#9499A3]">
                        Многослойный формантный рёв ({Math.round((cfg.screamVol ?? 1) * 100)}%)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onModAction('scream_roar')}
                      data-testid="test-scream-btn"
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Тест крика
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={cfg.screamVol ?? 1.0}
                    onChange={(e) => onUpdateCfg({ screamVol: Number(e.target.value) })}
                    data-testid="slider-scream-vol"
                    aria-label="Громкость жуткого крика тварей"
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Slider 2: Graphics Mod Intensity */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Интенсивность Graphics Mod (PBR + Контраст)
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {Math.round((cfg.graphicsModIntensity ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={cfg.graphicsModIntensity ?? 0.85}
                    onChange={(e) => onUpdateCfg({ graphicsModIntensity: Number(e.target.value) })}
                    data-testid="slider-graphics-mod"
                    aria-label="Интенсивность Graphics Mod"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Slider 3: Darkness & Abyssal Atmosphere */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Уровень темноты и густоты мрака
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {Math.round((cfg.darknessLevel ?? 0.65) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.0}
                    step={0.05}
                    value={cfg.darknessLevel ?? 0.65}
                    onChange={(e) => onUpdateCfg({ darknessLevel: Number(e.target.value) })}
                    data-testid="slider-darkness"
                    aria-label="Уровень темноты"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Slider 4: Master Volume */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">Общая громкость</span>
                    <span className="font-mono text-xs text-[#9499A3]">
                      {Math.round(cfg.vol * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={cfg.vol}
                    onChange={(e) => onUpdateCfg({ vol: Number(e.target.value) })}
                    aria-label="Общая громкость"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Slider 5: Ambient Dread Drone Volume */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Громкость инфразвукового гула
                    </span>
                    <span className="font-mono text-xs text-[#9499A3]">
                      {Math.round(cfg.ambientVol * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={cfg.ambientVol}
                    onChange={(e) => onUpdateCfg({ ambientVol: Number(e.target.value) })}
                    aria-label="Громкость эмбиента"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {tab === 3 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  10 Новых Хоррор-Идей и Механик (Идеи 1–5)
                </h3>
                {TEN_HORROR_IDEAS.slice(0, 5).map((idea) => (
                  <div
                    key={idea.id}
                    data-testid={`horror-idea-${idea.number}`}
                    className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">
                        #{idea.number}. {idea.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                        АКТИВНО
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-400">{idea.subtitle}</div>
                    <p className="text-xs text-[#9499A3] leading-relaxed">{idea.description}</p>
                    {idea.actionId && (
                      <button
                        type="button"
                        onClick={() => onModAction(idea.actionId!)}
                        className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {idea.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CENTER COLUMN: PROMINENT INTERACTIVE SCROLLBAR IN THE EXACT MIDDLE OF THE SCREEN */}
          <div
            data-testid="settings-middle-scroll"
            className="flex flex-col items-center justify-between py-3 px-1 bg-[#06070A] border-x border-white/15 select-none"
          >
            <span className="font-mono text-[9px] text-amber-400 font-bold tracking-tighter">
              СКРОЛЛ
            </span>
            <div className="relative flex-1 w-full flex items-center justify-center my-2">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={scrollPct}
                onChange={(e) => handleMiddleScrollSlider(Number(e.target.value))}
                data-testid="middle-scrollbar-slider"
                aria-label="Центральная полоса прокрутки настроек"
                className="w-[32vh] h-3 accent-amber-500 -rotate-90 cursor-pointer"
              />
            </div>
            <span className="font-mono text-[10px] text-white/80 tabular-nums">{scrollPct}%</span>
          </div>

          {/* RIGHT PANE (Scrollable Camera/HUD Sliders, Graphics Mod & Ideas 6–10) */}
          <div
            ref={rightPaneRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const max = Math.max(1, el.scrollHeight - el.clientHeight);
              setScrollPct(Math.round((el.scrollTop / max) * 100));
            }}
            data-testid="settings-right-pane"
            className="custom-scrollbar overflow-y-scroll p-3 sm:p-4 space-y-4 border-l border-white/10"
          >
            {tab === 0 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">
                    Удобное расположение кнопок и управление
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    • Слева: постоянная шкала шума, индикатор износа батареи по дням и кнопка УФ-луча [UV]. Вся левая часть экрана свободна для плавного джойстика ходьбы.
                    <br />• Внизу по центру: быстрый пояс выживания (Еда, Вода, Фонарь, Фальшфейер, Капкан, Маяк, Адреналин).
                    <br />• Справа: эргономичная боевая дуга под большой палец (Огонь, Прицел, Смена оружия, Перезарядка, Присед, Прыжок).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">
                    Улучшенные 3D-модели оружия и монстров
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Оружие оснащено планками Пикатинни, затворными рамами, тритиевыми прицелами и оптикой. Твари имеют анатомический скелет с рёбрами, позвоночником, рассечённой челюстью и длинными когтями.
                  </p>
                </div>
              </div>
            )}

            {tab === 1 && (
              <div className="space-y-3">
                <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Слоты ключевых точек (3–4)
                </h3>
                {slots.slice(2).map((slot) => {
                  const d = slot.data;
                  return (
                    <div
                      key={slot.slotId}
                      data-testid={`save-slot-${slot.slotId}`}
                      className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-amber-400">{slot.label}</span>
                        <span className="font-mono text-[11px] text-[#9499A3]">
                          {d ? d.savedAt : 'Пусто'}
                        </span>
                      </div>
                      {d ? (
                        <div className="text-xs text-white/90 font-mono tabular-nums space-y-0.5">
                          <div>Точка: {d.title}</div>
                          <div>
                            День {d.day} ({d.clock}) · HP: {Math.round(d.hp)} · Заряд:{' '}
                            {Math.round(d.battery)}%
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9499A3]">Слот свободен для записи.</p>
                      )}
                      <div className="flex items-center gap-2">
                        {!isFromMainMenu && slot.slotId !== 'auto' && (
                          <button
                            type="button"
                            data-testid={`save-btn-${slot.slotId}`}
                            onClick={() => onSaveSlot(slot.slotId)}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                          >
                            Сохранить
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!d}
                          data-testid={`load-btn-${slot.slotId}`}
                          onClick={() => onLoadSlot(slot.slotId)}
                          className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white font-bold text-xs cursor-pointer"
                        >
                          Загрузить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Камера, Кнопки HUD и 120 FPS Графика
                </h3>

                {/* Camera Sensitivity Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Чувствительность камеры
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {cfg.sens.toFixed(2)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    value={cfg.sens}
                    onChange={(e) => onUpdateCfg({ sens: Number(e.target.value) })}
                    aria-label="Чувствительность"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* FOV Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Угол обзора камеры (FOV)
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">{cfg.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min={55}
                    max={100}
                    step={1}
                    value={cfg.fov}
                    onChange={(e) => onUpdateCfg({ fov: Number(e.target.value) })}
                    aria-label="Угол обзора FOV"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Button Size Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Масштаб удобных кнопок HUD
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {Math.round(cfg.uiScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.45}
                    step={0.05}
                    value={cfg.uiScale}
                    onChange={(e) => onUpdateCfg({ uiScale: Number(e.target.value) })}
                    aria-label="Размер кнопок"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Render Quality Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Качество рендера (0-Эконом, 1-Баланс, 2-Ультра)
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {cfg.quality}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={cfg.quality}
                    onChange={(e) => onUpdateCfg({ quality: Number(e.target.value) })}
                    aria-label="Качество рендера"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Graphics Toggles */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-white">
                      Современные GLSL-шейдеры и лучи
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.customShaders}
                      onChange={(e) => onUpdateCfg({ customShaders: e.target.checked })}
                      aria-label="Современные шейдеры"
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-white">
                      Динамическое хоррор-освещение
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.dynamicLights}
                      onChange={(e) => onUpdateCfg({ dynamicLights: e.target.checked })}
                      aria-label="Динамическое освещение"
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-white">
                      Детектор реального микрофона
                    </span>
                    <input
                      type="checkbox"
                      checked={micOn}
                      onChange={(e) => onToggleMic(e.target.checked)}
                      aria-label="Режим микрофона"
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {tab === 3 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  10 Новых Хоррор-Идей и Graphics Mod (Идеи 6–10)
                </h3>
                {TEN_HORROR_IDEAS.slice(5, 10).map((idea) => (
                  <div
                    key={idea.id}
                    data-testid={`horror-idea-${idea.number}`}
                    className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">
                        #{idea.number}. {idea.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                        АКТИВНО
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-400">{idea.subtitle}</div>
                    <p className="text-xs text-[#9499A3] leading-relaxed">{idea.description}</p>
                    {idea.actionId && (
                      <button
                        type="button"
                        onClick={() => onModAction(idea.actionId!)}
                        className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {idea.actionLabel}
                      </button>
                    )}
                  </div>
                ))}

                {/* Director Mod Toggles */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Режиссёрские читы и спавн
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'god', label: 'Бессмертие' },
                      { key: 'infAmmo', label: 'Беск. патроны' },
                      { key: 'infBattery', label: 'Без износа батарей' },
                      { key: 'silent', label: 'Тишина 0 дБ' },
                      { key: 'esp', label: 'ESP-радар тварей' },
                      { key: 'nightVision', label: 'ПНВ-режим' },
                    ].map((item) => {
                      const k = item.key as keyof ModMenuState;
                      return (
                        <label
                          key={item.key}
                          className="p-2 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-[11px] font-bold text-white">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(mod[k])}
                            onChange={(e) => onUpdateMod({ [k]: e.target.checked })}
                            className="w-4 h-4 accent-amber-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: 'resources', label: '+10 ресурсов' },
                      { id: 'next_day', label: '+1 День (Тест износа батарей)' },
                      { id: 'spawn_brute', label: 'Спавн: Громила' },
                      { id: 'raid', label: 'Начать штурм' },
                      { id: 'clear_zombies', label: 'Убрать тварей' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => onModAction(act.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-black text-[11px] font-bold text-white cursor-pointer"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
