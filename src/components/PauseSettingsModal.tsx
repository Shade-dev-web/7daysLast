import React, { useEffect, useState } from 'react';
import { SaveSlotMeta } from '../game/saveSystem';

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

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Меню паузы, сохранений и настроек"
      data-testid="pause-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-5 select-none"
    >
      <div className="w-full max-w-4xl h-[88vh] rounded-2xl bg-[#111318] border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-[#0B0D11]">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 0, label: 'Пауза и Справка' },
              { id: 1, label: 'Ключевые Точки' },
              { id: 2, label: 'Настройки (120 FPS и Шейдеры)' },
              { id: 3, label: 'Мод-меню Режиссёра' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-testid={`pause-tab-${t.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
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
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFromMainMenu ? 'Назад в меню' : 'Продолжить [Esc]'}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* TAB 0: OVERVIEW & GUIDE */}
          {tab === 0 && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm cursor-pointer"
                >
                  Вернуться в игру
                </button>
                {!isFromMainMenu && (
                  <>
                    <button
                      type="button"
                      onClick={() => setTab(1)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm cursor-pointer"
                    >
                      Сохранить в ключевой точке
                    </button>
                    <button
                      type="button"
                      onClick={onReturnToMenu}
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm cursor-pointer"
                    >
                      Выйти в главное меню
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1.5">
                    1. Постоянная шкала шума слева
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Слева всегда видна вертикальная и горизонтальная акустическая шкала в децибелах (дБ). Держись в зелёной зоне (&lt;30 дБ), передвигаясь шагом или в приседе [C]. Бег и стрельба мгновенно выводят шум в красную зону (60+ дБ).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1.5">
                    2. Экономия заряда фонарика
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Фонарик [F] освещает темные углы объёмным лучом, но расходует батарею. При заряде ниже 22% свет начинает тревожно мерцать. Меняй батарейки [V] или крафти новые из проводов и металлолома.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1.5">
                    3. Инвентарь и Крафт защиты
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Собирай металлолом, доски, провода и тряпки по всему дому. В меню [I / C] создавай медвежьи капканы [T], шумовые будильники [Z], баррикады для двери и заточки для защиты от захвата.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1.5">
                    4. Укрытия, Дыхание и Сохранения
                  </h3>
                  <p className="text-xs text-[#9499A3] leading-relaxed">
                    Прячься в шкафу или под диваном [E]. Когда монстр подходит вплотную и всматривается в щели — зажми «Не дышать» [B]. Сохраняйся у рации/дневника на столе в спальне или через вкладку «Ключевые Точки».
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: KEY-POINT CHECKPOINT SAVES */}
          {tab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Система сохранений в ключевых точках
                  </h3>
                  <p className="text-xs text-[#9499A3]">
                    Игра автоматически сохраняется на рассвете каждого дня, после отражения рейда и возвращения из магазина. Вы также можете сохранить прогресс вручную в любой слот.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {slots.map((slot) => {
                  const d = slot.data;
                  return (
                    <div
                      key={slot.slotId}
                      data-testid={`save-slot-${slot.slotId}`}
                      className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-amber-400">{slot.label}</span>
                          <span className="font-mono text-xs text-[#9499A3]">
                            {d ? d.savedAt : 'Пусто'}
                          </span>
                        </div>
                        {d ? (
                          <div className="mt-2 space-y-1 text-xs text-white/90 font-mono tabular-nums">
                            <div>
                              Точка: <strong>{d.title}</strong>
                            </div>
                            <div>
                              День {d.day} ({d.clock}) · HP: {Math.round(d.hp)} · Фонарь:{' '}
                              {Math.round(d.battery)}%
                            </div>
                            <div className="text-[#9499A3]">
                              Капканы: {d.inv.traps} · Батарейки: {d.inv.batteries} · Убито:{' '}
                              {d.kills}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-[#9499A3]">
                            Слот свободен. Сохраните текущую ключевую точку выживания.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isFromMainMenu && slot.slotId !== 'auto' && (
                          <button
                            type="button"
                            data-testid={`save-btn-${slot.slotId}`}
                            onClick={() => onSaveSlot(slot.slotId)}
                            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                          >
                            Сохранить сюда
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!d}
                          data-testid={`load-btn-${slot.slotId}`}
                          onClick={() => onLoadSlot(slot.slotId)}
                          className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white font-bold text-xs cursor-pointer"
                        >
                          Загрузить точку
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INTUITIVE SETTINGS (120 FPS, SHADERS, LIGHTING, AUDIO, HUD) */}
          {tab === 2 && (
            <div className="space-y-6">
              {/* Performance & 120 FPS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Экран, 120 FPS и Современные Шейдеры
                </h3>
                <div className="space-y-3 bg-white/[0.03] p-4 rounded-xl border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">Целевая частота кадров (FPS)</div>
                      <div className="text-xs text-[#9499A3]">
                        Режим 120 FPS обеспечивает максимальную плавность управления и камеры
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {([60, 90, 120, 240] as const).map((fps) => (
                        <button
                          key={fps}
                          type="button"
                          onClick={() => onUpdateCfg({ targetFps: fps })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                            cfg.targetFps === fps
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/10 text-white hover:bg-white/15'
                          }`}
                        >
                          {fps === 240 ? 'MAX' : `${fps} FPS`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Показать счётчик FPS и кадра (мс)</div>
                      <div className="text-xs text-[#9499A3]">Индикатор плавности в верхнем углу</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.showFps}
                      onChange={(e) => onUpdateCfg({ showFps: e.target.checked })}
                      aria-label="Показать счётчик FPS"
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Современные GLSL-шейдеры и объёмный свет</div>
                      <div className="text-xs text-[#9499A3]">
                        Объёмный конус фонарика с пылью, лучи луны из окон и шейдеры стен
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.customShaders}
                      onChange={(e) => onUpdateCfg({ customShaders: e.target.checked })}
                      aria-label="Современные шейдеры"
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Динамическое хоррор-освещение</div>
                      <div className="text-xs text-[#9499A3]">
                        Мерцание ламп при приближении монстров, грозовые разряды и реалистичный спад света
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.dynamicLights}
                      onChange={(e) => onUpdateCfg({ dynamicLights: e.target.checked })}
                      aria-label="Динамическое освещение"
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Динамические мягкие тени (PCFSoft)</div>
                      <div className="text-xs text-[#9499A3]">
                        Честные тени от фонарика и объектов (требует мощный GPU)
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.shadows}
                      onChange={(e) => onUpdateCfg({ shadows: e.target.checked })}
                      aria-label="Динамические тени"
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Качество рендера и разрешения</div>
                      <div className="text-xs text-[#9499A3]">0 — Эконом, 1 — Баланс, 2 — Ультра</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={1}
                      value={cfg.quality}
                      onChange={(e) => onUpdateCfg({ quality: Number(e.target.value) })}
                      aria-label="Качество рендера"
                      className="w-40 accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Horror, Jumpscares & Audio */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Атмосфера Хоррора, Скримеры и Звук
                </h3>
                <div className="space-y-3 bg-white/[0.03] p-4 rounded-xl border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">Случайные и контекстные скримеры</div>
                      <div className="text-xs text-[#9499A3]">
                        Настройка интенсивности пугающих событий и звуковых ударов
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { val: 0, label: 'Без скримеров' },
                        { val: 0.6, label: 'Умеренно' },
                        { val: 1.0, label: 'Страшно' },
                        { val: 1.4, label: 'Кошмар' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => onUpdateCfg({ jumpscareIntensity: opt.val })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                            Math.abs(cfg.jumpscareIntensity - opt.val) < 0.1
                              ? 'bg-rose-600 text-white'
                              : 'bg-white/10 text-[#9499A3] hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Общая громкость звука</div>
                      <div className="text-xs text-[#9499A3]">{Math.round(cfg.vol * 100)}%</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={cfg.vol}
                      onChange={(e) => onUpdateCfg({ vol: Number(e.target.value) })}
                      aria-label="Общая громкость"
                      className="w-44 accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Громкость давящего хоррор-эмбиента</div>
                      <div className="text-xs text-[#9499A3]">{Math.round(cfg.ambientVol * 100)}%</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={cfg.ambientVol}
                      onChange={(e) => onUpdateCfg({ ambientVol: Number(e.target.value) })}
                      aria-label="Громкость эмбиента"
                      className="w-44 accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Детектор реального микрофона</div>
                      <div className="text-xs text-[#9499A3]">
                        Зомби в игре реагируют на ваш реальный голос и шорохи в комнате
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={micOn}
                      onChange={(e) => onToggleMic(e.target.checked)}
                      aria-label="Режим микрофона"
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Controls & HUD Customization */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Управление и Настройка HUD
                </h3>
                <div className="space-y-3 bg-white/[0.03] p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Чувствительность обзора</div>
                      <div className="text-xs text-[#9499A3]">{cfg.sens.toFixed(2)}×</div>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={2.5}
                      step={0.05}
                      value={cfg.sens}
                      onChange={(e) => onUpdateCfg({ sens: Number(e.target.value) })}
                      aria-label="Чувствительность"
                      className="w-44 accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Угол обзора камеры (FOV)</div>
                      <div className="text-xs text-[#9499A3]">{cfg.fov}°</div>
                    </div>
                    <input
                      type="range"
                      min={55}
                      max={100}
                      step={1}
                      value={cfg.fov}
                      onChange={(e) => onUpdateCfg({ fov: Number(e.target.value) })}
                      aria-label="Угол обзора FOV"
                      className="w-44 accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Размер экранных кнопок</div>
                      <div className="text-xs text-[#9499A3]">{Math.round(cfg.uiScale * 100)}%</div>
                    </div>
                    <input
                      type="range"
                      min={0.65}
                      max={1.45}
                      step={0.05}
                      value={cfg.uiScale}
                      onChange={(e) => onUpdateCfg({ uiScale: Number(e.target.value) })}
                      aria-label="Размер кнопок"
                      className="w-44 accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <div className="font-semibold text-white">Прозрачность кнопок HUD</div>
                      <div className="text-xs text-[#9499A3]">{Math.round(cfg.uiOpacity * 100)}%</div>
                    </div>
                    <input
                      type="range"
                      min={0.25}
                      max={1.0}
                      step={0.05}
                      value={cfg.uiOpacity}
                      onChange={(e) => onUpdateCfg({ uiOpacity: Number(e.target.value) })}
                      aria-label="Прозрачность кнопок"
                      className="w-44 accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECTOR & MOD MENU */}
          {tab === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'god', label: 'Бессмертие (God Mode)' },
                  { key: 'infAmmo', label: 'Бесконечные патроны' },
                  { key: 'infBattery', label: 'Бесконечный заряд фонарика' },
                  { key: 'noHunger', label: 'Без голода и жажды' },
                  { key: 'silent', label: 'Полная тишина (0 дБ)' },
                  { key: 'blind', label: 'Монстры слепы и глухи' },
                  { key: 'esp', label: 'ESP-радар монстров сквозь стены' },
                  { key: 'nightVision', label: 'Прибор ночного видения (ПНВ)' },
                ].map((item) => {
                  const k = item.key as keyof ModMenuState;
                  return (
                    <label
                      key={item.key}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white">{item.label}</span>
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

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Мгновенные действия и тест хоррор-событий
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'heal', label: 'Полное здоровье и сытость' },
                    { id: 'resources', label: '+10 всех ресурсов для крафта' },
                    { id: 'weapons', label: 'Выдать всё оружие и патроны' },
                    { id: 'scare', label: 'Тест скримера сейчас!' },
                    { id: 'lightning', label: 'Вспышка молнии и гром' },
                    { id: 'spawn_stalker', label: 'Спавн: Щелкун-Слухач' },
                    { id: 'spawn_brute', label: 'Спавн: Громила' },
                    { id: 'spawn_crawler', label: 'Спавн: Ползун' },
                    { id: 'raid', label: 'Начать рейд зомби' },
                    { id: 'clear_zombies', label: 'Убрать всех зомби' },
                    { id: 'next_day', label: 'Следующий день (+сохранение)' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => onModAction(act.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-black text-xs font-bold text-white transition-colors cursor-pointer"
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
  );
};
