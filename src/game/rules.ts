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
    desc: 'Зомби глуховаты и медленны. Батарея фонарика держит дольше, больше ресурсов для крафта.',
    hear: 0.7,
    hunger: 44,
    thirst: 58,
    dmg: 15,
    zspeed: 2.0,
    zmax: 2,
    raids: 2,
    loot: 1.5,
    trip: 0.15,
    aware: 0.8,
    hp: 100,
    batteryDrain: 1.4,
    scareFreq: 0.6,
  },
  normal: {
    name: 'СРЕДНИЙ',
    desc: 'Честный хоррор-баланс. Острый слух монстров, ограниченный заряд фонарика и ресурсы в обрез.',
    hear: 1.0,
    hunger: 64,
    thirst: 82,
    dmg: 25,
    zspeed: 2.8,
    zmax: 3,
    raids: 2,
    loot: 1.0,
    trip: 0.3,
    aware: 1.0,
    hp: 100,
    batteryDrain: 2.2,
    scareFreq: 1.0,
  },
  ultra: {
    name: 'УЛЬТРА-КОШМАР',
    desc: 'Слышат даже сбивчивое дыхание. Фонарик быстро садится, частые скримеры и агрессивная охота.',
    hear: 1.4,
    hunger: 82,
    thirst: 104,
    dmg: 38,
    zspeed: 3.6,
    zmax: 5,
    raids: 3,
    loot: 0.7,
    trip: 0.5,
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
    name: 'DESERT EAGLE',
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
    name: 'ДРОБОВИК M870',
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
    name: 'СНАЙПЕРКА AWP',
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
  // Defense Tools
  traps: number;
  decoys: number;
  barricades: number;
  shivs: number;
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
    desc: 'Ставится на пол [T]. Наносит 85 урона зомби и оглушает его на 4 секунды.',
    noiseOnCraft: 18,
    cost: { scrap: 2, wires: 1 },
    output: { traps: 1 },
  },
  {
    id: 'decoy',
    name: 'Шумовой будильник',
    category: 'defense',
    desc: 'Бросок приманки [Z]. Звенит 6 секунд (85 дБ), уводя слепых монстров прочь.',
    noiseOnCraft: 14,
    cost: { scrap: 1, wires: 1 },
    output: { decoys: 1 },
  },
  {
    id: 'barricade',
    name: 'Баррикадный щит',
    category: 'defense',
    desc: 'Укрепляет входную дверь (+100% прочности), задерживая взлом во время рейда.',
    noiseOnCraft: 24,
    cost: { wood: 2, scrap: 1 },
    output: { barricades: 1 },
  },
  {
    id: 'shiv',
    name: 'Заточка выжившего',
    category: 'defense',
    desc: 'Автоматически отбивает захват монстра в ближнем бою и спасает от гибели.',
    noiseOnCraft: 12,
    cost: { scrap: 1, cloth: 1 },
    output: { shivs: 1 },
  },
  {
    id: 'battery',
    name: 'Аккумулятор фонаря',
    category: 'survival',
    desc: 'Самодельный элемент питания. Заряжает фонарик на +55% энергии.',
    noiseOnCraft: 10,
    cost: { wires: 1, scrap: 1 },
    output: { batteries: 1 },
  },
  {
    id: 'medkit',
    name: 'Перевязочный пакет',
    category: 'survival',
    desc: 'Останавливает кровотечение и восстанавливает +45 здоровья.',
    noiseOnCraft: 8,
    cost: { cloth: 2 },
    output: { medkits: 1 },
  },
  {
    id: 'ammo_pack',
    name: 'Пачка патронов',
    category: 'defense',
    desc: 'Сборка боеприпасов: +7 патронов Deagle и +4 картечи дробовика.',
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
    traps: 1,
    decoys: 1,
    barricades: 1,
    shivs: diff === 'ultra' ? 0 : 1,
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

export function stepFlashlightBattery(
  currentBattery: number,
  torchOn: boolean,
  drainPerSec: number,
  dt: number,
  infiniteBattery = false
): { battery: number; torchOn: boolean; flickerFactor: number } {
  if (!torchOn) {
    return { battery: currentBattery, torchOn: false, flickerFactor: 1 };
  }
  if (infiniteBattery) {
    return { battery: 100, torchOn: true, flickerFactor: 1 };
  }
  const next = Math.max(0, currentBattery - drainPerSec * dt);
  if (next <= 0) {
    return { battery: 0, torchOn: false, flickerFactor: 0 };
  }
  let flickerFactor = 1;
  if (next < 22) {
    const ratio = next / 22;
    flickerFactor = Math.max(0.15, ratio);
  }
  return { battery: next, torchOn: true, flickerFactor };
}

export function rechargeBattery(
  currentBattery: number,
  inv: InventoryState
): { battery: number; recharged: boolean } {
  if (inv.batteries <= 0 || currentBattery >= 99) {
    return { battery: currentBattery, recharged: false };
  }
  inv.batteries -= 1;
  return {
    battery: Math.min(100, currentBattery + 55),
    recharged: true,
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
