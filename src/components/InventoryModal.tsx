import React, { useState } from 'react';
import {
  InventoryState,
  CRAFT_RECIPES,
  CraftRecipe,
  canCraft,
  WeaponKey,
  WEAPONS,
} from '../game/rules';

interface InventoryModalProps {
  open: boolean;
  inv: InventoryState;
  hp: number;
  hpMax: number;
  food: number;
  water: number;
  battery: number;
  doorHp: number;
  weapons: Record<WeaponKey, boolean>;
  ammo: Record<WeaponKey, { mag: number; res: number }>;
  curWeapon: WeaponKey | null;
  onClose: () => void;
  onUseConsumable: (type: 'food' | 'water' | 'battery' | 'medkit' | 'sedative') => void;
  onUseDefenseTool: (type: 'trap' | 'decoy' | 'barricade') => void;
  onCraftRecipe: (recipe: CraftRecipe) => void;
  onSelectWeapon: (w: WeaponKey) => void;
}

const MATERIAL_LABELS: Record<string, string> = {
  scrap: 'Металлолом',
  wood: 'Доски / Дерево',
  wires: 'Провода и схемы',
  cloth: 'Тряпки и бинт',
  powder: 'Порох / Химия',
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  open,
  inv,
  hp,
  hpMax,
  food,
  water,
  battery,
  doorHp,
  weapons,
  ammo,
  curWeapon,
  onClose,
  onUseConsumable,
  onUseDefenseTool,
  onCraftRecipe,
  onSelectWeapon,
}) => {
  const [tab, setTab] = useState<'bag' | 'craft'>('bag');

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Инвентарь и мастерская крафта"
      data-testid="inventory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none"
    >
      <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#111318] border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0B0D11]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-white font-['Unbounded']">
              СУМКА ВЫЖИВШЕГО И КРАФТ
            </h2>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setTab('bag')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  tab === 'bag'
                    ? 'bg-amber-500 text-black'
                    : 'text-[#9499A3] hover:text-white'
                }`}
              >
                Инвентарь и Ресурсы
              </button>
              <button
                type="button"
                onClick={() => setTab('craft')}
                data-testid="tab-craft-btn"
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  tab === 'craft'
                    ? 'bg-amber-500 text-black'
                    : 'text-[#9499A3] hover:text-white'
                }`}
              >
                Мастерская Крафта ({CRAFT_RECIPES.length})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть инвентарь"
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
          >
            Закрыть [Esc / I]
          </button>
        </div>

        {/* Materials Strip (Always visible at top of modal) */}
        <div className="px-5 py-2.5 bg-[#0D1016] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#9499A3] font-semibold">Детали для крафта:</span>
          <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
            <span>
              Металлолом: <strong className="text-amber-400">{inv.scrap}</strong>
            </span>
            <span>·</span>
            <span>
              Доски: <strong className="text-amber-400">{inv.wood}</strong>
            </span>
            <span>·</span>
            <span>
              Провода: <strong className="text-amber-400">{inv.wires}</strong>
            </span>
            <span>·</span>
            <span>
              Тряпки: <strong className="text-amber-400">{inv.cloth}</strong>
            </span>
            <span>·</span>
            <span>
              Порох: <strong className="text-amber-400">{inv.powder}</strong>
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'bag' ? (
            <>
              {/* Section 1: Consumables */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                  Припасы и Медикаменты
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Canned Food */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Консервы</span>
                        <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                          {inv.food} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Восстанавливает +34% сытости. Сейчас: {Math.round(food)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.food <= 0 || food >= 99}
                      onClick={() => onUseConsumable('food')}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      Съесть консервы [G]
                    </button>
                  </div>

                  {/* Water Bottle */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Питьевая вода</span>
                        <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                          {inv.water} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Утоляет жажду на +34%. Сейчас: {Math.round(water)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.water <= 0 || water >= 99}
                      onClick={() => onUseConsumable('water')}
                      className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 border border-sky-500/40 text-xs font-bold text-sky-300 cursor-pointer"
                    >
                      Выпить воды [H]
                    </button>
                  </div>

                  {/* Flashlight Battery */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Батарея фонарика</span>
                        <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                          {inv.batteries} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Заряжает фонарик на +55%. Заряд: {Math.round(battery)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.batteries <= 0 || battery >= 99}
                      onClick={() => onUseConsumable('battery')}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      Заменить батарею [V]
                    </button>
                  </div>

                  {/* Medkit */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Перевязочный пакет</span>
                        <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
                          {inv.medkits} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Восстанавливает +45 HP. Здоровье: {Math.round(hp)}/{hpMax}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.medkits <= 0 || hp >= hpMax}
                      onClick={() => onUseConsumable('medkit')}
                      className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 border border-rose-500/40 text-xs font-bold text-rose-300 cursor-pointer"
                    >
                      Перевязать раны
                    </button>
                  </div>

                  {/* Sedatives */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Успокоительное</span>
                        <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                          {inv.sedatives} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Снимает панику, выравнивает пульс и дыхание, убирает галлюцинации.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.sedatives <= 0}
                      onClick={() => onUseConsumable('sedative')}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-500/40 text-xs font-bold text-emerald-300 cursor-pointer"
                    >
                      Принять таблетку
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Crafted Defense Tools */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                  Инструменты Защиты и Ловушки
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Bear Trap */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Капкан</span>
                        <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                          {inv.traps} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Ставится под ноги. Наносит 85 урона и держит монстра 4 сек.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.traps <= 0}
                      onClick={() => {
                        onUseDefenseTool('trap');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      Поставить на пол [T]
                    </button>
                  </div>

                  {/* Noise Decoy */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Будильник</span>
                        <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                          {inv.decoys} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Бросок вперёд. Звенит 6 сек (85 дБ), отвлекая всех зомби.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.decoys <= 0}
                      onClick={() => {
                        onUseDefenseTool('decoy');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-xs font-bold text-amber-300 cursor-pointer"
                    >
                      Бросить приманку [Z]
                    </button>
                  </div>

                  {/* Door Barricade */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Баррикада</span>
                        <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                          {inv.barricades} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Чинит и укрепляет входную дверь (сейчас {Math.round(doorHp)}%).
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={inv.barricades <= 0 && doorHp >= 100}
                      onClick={() => onUseDefenseTool('barricade')}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-500/40 text-xs font-bold text-emerald-300 cursor-pointer"
                    >
                      Укрепить дверь
                    </button>
                  </div>

                  {/* Defense Shiv */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Заточка</span>
                        <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
                          {inv.shivs} шт.
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">
                        Срабатывает автоматически при захвате зомби, оглушая врага.
                      </p>
                    </div>
                    <div className="py-1.5 text-center rounded-lg bg-white/5 text-[11px] font-mono text-[#9499A3]">
                      Авто-защита в бою
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Arsenal */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                  Огнестрельное Оружие
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['deagle', 'shotgun', 'sniper'] as WeaponKey[]).map((wk) => {
                    const owned = weapons[wk];
                    const spec = WEAPONS[wk];
                    const a = ammo[wk];
                    const active = curWeapon === wk;
                    return (
                      <div
                        key={wk}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                          active
                            ? 'bg-amber-500/15 border-amber-500/60'
                            : 'bg-white/[0.03] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{spec.name}</span>
                            <span className="font-mono text-xs text-[#9499A3] tabular-nums">
                              {owned ? `${a.mag} / ${a.res}` : 'Не найдено'}
                            </span>
                          </div>
                          <p className="text-xs text-[#9499A3] mt-1">
                            Урон: {spec.dmg * spec.pellets} · Шум выстрела: {spec.noise} дБ
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!owned}
                          onClick={() => onSelectWeapon(wk)}
                          className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold text-white cursor-pointer"
                        >
                          {active ? 'В руках' : owned ? 'Взять в руки' : 'Обыщите дом'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Crafting Workshop Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {CRAFT_RECIPES.map((rec) => {
                const craftable = canCraft(inv, rec);
                return (
                  <div
                    key={rec.id}
                    data-testid={`recipe-card-${rec.id}`}
                    className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{rec.name}</span>
                        <span className="text-[11px] font-mono text-[#9499A3]">
                          Шум сборки: {rec.noiseOnCraft} дБ
                        </span>
                      </div>
                      <p className="text-xs text-[#9499A3] mt-1">{rec.desc}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono">
                        {Object.entries(rec.cost).map(([k, req]) => {
                          const have = inv[k as keyof InventoryState] || 0;
                          const enough = have >= (req || 0);
                          return (
                            <span
                              key={k}
                              className={enough ? 'text-emerald-400' : 'text-rose-400'}
                            >
                              {MATERIAL_LABELS[k] || k}: {have}/{req}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!craftable}
                      data-testid={`craft-btn-${rec.id}`}
                      onClick={() => onCraftRecipe(rec)}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/40 text-black font-bold text-xs transition-transform active:scale-98 cursor-pointer"
                    >
                      {craftable ? `Скрафтить: ${rec.name}` : 'Недостаточно материалов'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
