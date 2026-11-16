export type DifficultyKey = 'easy' | 'normal' | 'ultra';

export interface DifficultyConfig {
  name: string;
  desc: string;
  hear: number;
  hunger: number;
  thirst: number;
  dmg: number;
  zspeed: number;
  zmax: number;
  raids: number;
  loot: number;
  trip: number;
  aware: number;
  hp: number;
  batteryDrain: number;
  scareFreq: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  easy: {
    name: 'ЛЁГКИЙ',
    desc: '2 огромных слепых монстра. Батарея фонарика держит дольше, больше ресурсов и выше шанс редкого лута.',
    hear: 0.75,
    hunger: 44,
    thirst: 58,
    dmg: 20,
    zspeed: 3.5,
    zmax: 2,
    raids: 2,
    loot: 1.5,
    trip: 0.15,
    aware: 0.85,
    hp: 100,
    batteryDrain: 1.4,
    scareFreq: 0.7,
  },
  normal: {
    name: 'СРЕДНИЙ',
    desc: '2 гигантских быстрых монстра с жутким криком, деградация батарей по дням и шансовые события.',
    hear: 1.0,
    hunger: 64,
    thirst: 82,
    dmg: 28,
    zspeed: 4.3,
    zmax: 2,
    raids: 2,
    loot: 1.0,
    trip: 0.3,
    aware: 1.05,
    hp: 100,
    batteryDrain: 2.2,
    scareFreq: 1.0,
  },
  ultra: {
    name: 'УЛЬТРА-КОШМАР',
    desc: 'Полная тьма. 2 колоссальных стремительных монстра слышат каждый вдох, быстрый износ батарей.',
    hear: 1.4,
    hunger: 82,
    thirst: 104,
    dmg: 42,
    zspeed: 5.1,
    zmax: 2,
    raids: 3,
    loot: 0.75,
    trip: 0.45,
    aware: 1.35,
    hp: 120,
    batteryDrain: 3.2,
    scareFreq: 1.45,
  },
};

export type WeaponKey = 'deagle' | 'shotgun' | 'sniper';

export interface WeaponSpec {
  name: string;
  mag: number;
  rate: number;
  dmg: number;
  pellets: number;
  spread: number;
  recoil: number;
  noise: number;
  reload: number;
  scope?: boolean;
}

export const WEAPONS: Record<WeaponKey, WeaponSpec> = {
  deagle: {
    name: 'DESERT EAGLE .50 AE',
    mag: 7,
    rate: 0.32,
    dmg: 62,
    pellets: 1,
    spread: 0.006,
    recoil: 0.05,
    noise: 92,
    reload: 1.5,
  },
  shotgun: {
    name: 'REMINGTON M870 TACTICAL',
    mag: 6,
    rate: 0.9,
    dmg: 19,
    pellets: 8,
    spread: 0.048,
    recoil: 0.085,
    noise: 100,
    reload: 2.2,
  },
  sniper: {
    name: 'AWM MAGNUM SNIPER',
    mag: 5,
    rate: 1.25,
    dmg: 260,
    pellets: 1,
    spread: 0.001,
    recoil: 0.075,
    noise: 98,
    reload: 2.2,
    scope: true,
  },
};

export const WEAPON_LIST: WeaponKey[] = ['deagle', 'shotgun', 'sniper'];

export interface InventoryState {
  // Consumables
  food: number;
  water: number;
  batteries: number;
  medkits: number;
  sedatives: number;
  adrenaline: number;
  // Defense Tools
  traps: number;
  decoys: number;
  barricades: number;
  shivs: number;
  flares: number;
  // Crafting Materials
  scrap: number;
  wood: number;
  wires: number;
  cloth: number;
  powder: number;
}

export type CraftRecipeId =
  | 'trap'
  | 'decoy'
  | 'barricade'
  | 'battery'
  | 'medkit'
  | 'shiv'
  | 'flare'
  | 'adrenaline'
  | 'ammo_pack';

export interface CraftRecipe {
  id: CraftRecipeId;
  name: string;
  category: 'defense' | 'survival';
  desc: string;
  noiseOnCraft: number;
  cost: Partial<Record<keyof InventoryState, number>>;
  output: Partial<Record<keyof InventoryState, number>>;
  ammoGrant?: { deagle: number; shotgun: number };
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'trap',
    name: 'Медвежий капкан',
    category: 'defense',
    desc: 'Ставится на пол [T]. Стальные зубья наносят 85 урона твари и зажимают её на 4 секунды.',
    noiseOnCraft: 18,
    cost: { scrap: 2, wires: 1 },
    output: { traps: 1 },
  },
  {
    id: 'decoy',
    name: 'Шумовой маяк',
    category: 'defense',
    desc: 'Бросок приманки [Z]. Издаёт резкий акустический сигнал 6 секунд (85 дБ), уводя слепых тварей.',
    noiseOnCraft: 14,
    cost: { scrap: 1, wires: 1 },
    output: { decoys: 1 },
  },
  {
    id: 'flare',
    name: 'Багровый фальшфейер',
    category: 'defense',
    desc: 'Бросок фальшфейера [X]. Горит 18 секунд ярким багровым светом без траты батареи и отпугивает тварей.',
    noiseOnCraft: 10,
    cost: { powder: 1, scrap: 1 },
    output: { flares: 1 },
  },
  {
    id: 'barricade',
    name: 'Баррикадный щит',
    category: 'defense',
    desc: 'Укрепляет входную дверь (+100% прочности), задерживая взлом во время ночного штурма.',
    noiseOnCraft: 24,
    cost: { wood: 2, scrap: 1 },
    output: { barricades: 1 },
  },
  {
    id: 'shiv',
    name: 'Заточка выжившего',
    category: 'defense',
    desc: 'Автоматически пробивает шею твари при захвате в ближнем бою и спасает от гибели.',
    noiseOnCraft: 12,
    cost: { scrap: 1, cloth: 1 },
    output: { shivs: 1 },
  },
  {
    id: 'battery',
    name: 'Аккумулятор фонаря',
    category: 'survival',
    desc: 'Кустарная пересборка ячейки питания. Восстанавливает заряд с учётом износа текущего дня.',
    noiseOnCraft: 10,
    cost: { wires: 1, scrap: 1 },
    output: { batteries: 1 },
  },
  {
    id: 'medkit',
    name: 'Перевязочный пакет',
    category: 'survival',
    desc: 'Останавливает кровавый след и восстанавливает +45 здоровья.',
    noiseOnCraft: 8,
    cost: { cloth: 2 },
    output: { medkits: 1 },
  },
  {
    id: 'adrenaline',
    name: 'Инъектор адреналина',
    category: 'survival',
    desc: 'Мгновенно гасит панику, даёт 100% дыхания и ускоряет движение на 12 секунд.',
    noiseOnCraft: 6,
    cost: { powder: 1, cloth: 1 },
    output: { adrenaline: 1 },
  },
  {
    id: 'ammo_pack',
    name: 'Пачка патронов',
    category: 'defense',
    desc: 'Оружейная сборка: +7 патронов .50 AE и +4 картечи 12-го калибра.',
    noiseOnCraft: 16,
    cost: { scrap: 1, powder: 1 },
    output: {},
    ammoGrant: { deagle: 7, shotgun: 4 },
  },
];

export function createInitialInventory(diff: DifficultyKey): InventoryState {
  const mult = diff === 'easy' ? 2 : diff === 'normal' ? 1 : 0;
  return {
    food: 1 + (diff === 'easy' ? 1 : 0),
    water: 1 + (diff === 'easy' ? 1 : 0),
    batteries: 2 + (diff === 'easy' ? 1 : 0),
    medkits: 1,
    sedatives: 1,
    adrenaline: 1,
    traps: 1,
    decoys: 1,
    barricades: 1,
    shivs: diff === 'ultra' ? 0 : 1,
    flares: 1 + (diff === 'easy' ? 1 : 0),
    scrap: 3 + mult,
    wood: 2 + mult,
    wires: 2 + mult,
    cloth: 2 + mult,
    powder: 1 + mult,
  };
}

export function canCraft(inv: InventoryState, recipe: CraftRecipe): boolean {
  for (const [k, req] of Object.entries(recipe.cost)) {
    const key = k as keyof InventoryState;
    if ((inv[key] || 0) < (req || 0)) {
      return false;
    }
  }
  return true;
}

export function applyCraft(
  inv: InventoryState,
  ammo: Record<WeaponKey, { mag: number; res: number }>,
  recipe: CraftRecipe
): boolean {
  if (!canCraft(inv, recipe)) return false;
  for (const [k, req] of Object.entries(recipe.cost)) {
    const key = k as keyof InventoryState;
    inv[key] -= req || 0;
  }
  for (const [k, gain] of Object.entries(recipe.output)) {
    const key = k as keyof InventoryState;
    inv[key] = (inv[key] || 0) + (gain || 0);
  }
  if (recipe.ammoGrant) {
    ammo.deagle.res += recipe.ammoGrant.deagle;
    ammo.shotgun.res += recipe.ammoGrant.shotgun;
  }
  return true;
}

/**
 * Maximum charge capacity of found/active batteries decreases each day due to chemical oxidation
 * and cold-drain degradation, making late-game light management much more intense:
 * Day 1: 100%, Day 2: 91%, Day 3: 82%, Day 4: 73%, Day 5: 64%, Day 6: 54%, Day 7+: 45%
 */
export function getDayMaxBatteryCapacity(day: number): number {
  const safeDay = Math.max(1, Math.floor(day || 1));
  return Math.max(45, Math.min(100, Math.round(100 - (safeDay - 1) * 9.15)));
}

/**
 * Amount of charge restored by a single found battery also degrades with the day number:
 * Day 1: +55%, Day 2: +50%, Day 3: +45%, Day 4: +40%, Day 5: +35%, Day 6: +30%, Day 7+: +25%
 */
export function getDayBatteryRechargeGain(day: number): number {
  const safeDay = Math.max(1, Math.floor(day || 1));
  return Math.max(25, Math.min(55, 55 - (safeDay - 1) * 5));
}

export function stepFlashlightBattery(
  currentBattery: number,
  torchOn: boolean,
  drainPerSec: number,
  dt: number,
  infiniteBattery = false,
  day = 1
): { battery: number; torchOn: boolean; flickerFactor: number; maxCapacity: number } {
  const maxCapacity = getDayMaxBatteryCapacity(day);
  const clampedCurrent = infiniteBattery ? 100 : Math.min(maxCapacity, currentBattery);

  if (!torchOn) {
    return { battery: clampedCurrent, torchOn: false, flickerFactor: 1, maxCapacity };
  }
  if (infiniteBattery) {
    return { battery: 100, torchOn: true, flickerFactor: 1, maxCapacity: 100 };
  }
  const next = Math.max(0, clampedCurrent - drainPerSec * dt);
  if (next <= 0) {
    return { battery: 0, torchOn: false, flickerFactor: 0, maxCapacity };
  }
  let flickerFactor = 1;
  if (next < 22) {
    const ratio = next / 22;
    flickerFactor = Math.max(0.15, ratio);
  }
  return { battery: next, torchOn: true, flickerFactor, maxCapacity };
}

export function rechargeBattery(
  currentBattery: number,
  inv: InventoryState,
  day = 1
): { battery: number; recharged: boolean; maxCapacity: number; gain: number } {
  const maxCapacity = getDayMaxBatteryCapacity(day);
  const gain = getDayBatteryRechargeGain(day);
  if (inv.batteries <= 0 || currentBattery >= maxCapacity - 0.5) {
    return {
      battery: Math.min(maxCapacity, currentBattery),
      recharged: false,
      maxCapacity,
      gain: 0,
    };
  }
  inv.batteries -= 1;
  const next = Math.min(maxCapacity, currentBattery + gain);
  return {
    battery: next,
    recharged: true,
    maxCapacity,
    gain: Math.round(next - currentBattery),
  };
}

export type SurfaceMaterial = 'wood' | 'concrete' | 'rug';

export function detectSurfaceMaterialAt(x: number, z: number): SurfaceMaterial {
  // Living room rug or bedroom rug
  if (
    (x > 5.2 && x < 8.4 && z > 8.3 && z < 10.5) ||
    (x > 2.4 && x < 4.0 && z > 2.65 && z < 3.75)
  ) {
    return 'rug';
  }
  // Kitchen concrete floor (x >= 6, z < 6) or Entrance threshold concrete slab
  if ((x >= 6.0 && z < 6.0) || (x >= 4.4 && x <= 6.6 && z >= 10.6)) {
    return 'concrete';
  }
  return 'wood';
}

export function computeNoiseLevel(params: {
  hidden: boolean;
  holdingBreath: boolean;
  moving: boolean;
  running: boolean;
  crouching: boolean;
  onGround: boolean;
  panic: number;
  burst: number;
  silentMod: boolean;
  surface?: SurfaceMaterial;
}): { db: number; zone: 'green' | 'yellow' | 'red' } {
  if (params.silentMod) {
    return { db: 0, zone: 'green' };
  }
  let base = 4;
  if (params.hidden) {
    base = (3 + params.panic * 25) * (params.holdingBreath ? 0 : 1);
  } else if (!params.moving) {
    base = params.crouching ? 2 : 5;
  } else if (params.running) {
    base = 68;
  } else if (params.crouching) {
    base = 10;
  } else {
    base = 30;
  }
  if (!params.hidden && params.moving && params.surface) {
    if (params.surface === 'concrete') {
      base += 4;
    } else if (params.surface === 'rug') {
      base = Math.max(4, base - 6);
    }
  }
  if (!params.hidden && !params.onGround) {
    base = Math.max(base, 40);
  }
  const db = Math.min(100, Math.max(0, Math.round(Math.max(base, params.burst))));
  const zone = db < 30 ? 'green' : db < 60 ? 'yellow' : 'red';
  return { db, zone };
}

export interface CheckpointData {
  slotId: string;
  title: string;
  savedAt: string;
  day: number;
  clock: string;
  t: number;
  diff: DifficultyKey;
  hp: number;
  food: number;
  water: number;
  battery: number;
  doorHp: number;
  inv: InventoryState;
  weapons: Record<WeaponKey, boolean>;
  ammo: Record<WeaponKey, { mag: number; res: number }>;
  curWeapon: WeaponKey | null;
  kitTaken: boolean;
  doneInteractables: string[];
  kills: number;
  trips: number;
  hides: number;
  px: number;
  pz: number;
}

export function formatGameClock(tHours: number): string {
  const h = (6 + tHours) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export interface DynamicAmbienceProfile {
  dayStage: 1 | 2 | 3;
  stageLabel: string;
  noiseLabel: string;
  hudSummary: string;
  baseDroneHz: [number, number, number];
  windCutoffHz: number;
  tensionGain: number;
  tensionFreqHz: number;
  colorZone: 'emerald' | 'amber' | 'rose';
}

/**
 * Computes the dynamic ambient soundscape parameters based on the current day (1..7)
 * and real-time player noise level (0..100) + panic (0..1).
 */
export function describeDynamicAmbience(
  day: number,
  noiseDb: number,
  panic = 0
): DynamicAmbienceProfile {
  const clampedDay = Math.max(1, Math.min(7, Math.round(day || 1)));
  const clampedNoise = Math.max(0, Math.min(100, noiseDb || 0));
  const clampedPanic = Math.max(0, Math.min(1, panic || 0));

  let dayStage: 1 | 2 | 3 = 1;
  let stageLabel = 'СКРИП ДОМА';
  let baseDroneHz: [number, number, number] = [42, 42.6, 63];

  if (clampedDay >= 5) {
    dayStage = 3;
    stageLabel = 'ГУЛ БЕЗДНЫ';
    baseDroneHz = [28, 39.6, 55.8]; // Deep abyssal sub-bass + tritone dissonance
  } else if (clampedDay >= 3) {
    dayStage = 2;
    stageLabel = 'ГУЛ ТРУБ';
    baseDroneHz = [35, 52.5, 74.2]; // Metallic pipe resonance
  }

  const effectiveTension = Math.min(
    1,
    Math.max(clampedNoise / 100, clampedPanic * 0.85) + (clampedDay - 1) * 0.04
  );

  let noiseLabel = 'ТИШИНА';
  let colorZone: 'emerald' | 'amber' | 'rose' = 'emerald';
  if (clampedNoise >= 60 || clampedPanic >= 0.65) {
    noiseLabel = 'ОХОТА!';
    colorZone = 'rose';
  } else if (clampedNoise >= 30 || clampedPanic >= 0.25) {
    noiseLabel = 'ЭХО ШУМА';
    colorZone = 'amber';
  }

  const windCutoffHz = Math.round(
    145 + (clampedDay - 1) * 22 + clampedNoise * 5.2 + clampedPanic * 180
  );
  const tensionGain = Number((0.008 + effectiveTension * 0.085).toFixed(4));
  const tensionFreqHz = Math.round(165 + dayStage * 38 + clampedNoise * 2.4);

  return {
    dayStage,
    stageLabel,
    noiseLabel,
    hudSummary: `Д${clampedDay} · ${stageLabel} · ${noiseLabel}`,
    baseDroneHz,
    windCutoffHz,
    tensionGain,
    tensionFreqHz,
    colorZone,
  };
}

