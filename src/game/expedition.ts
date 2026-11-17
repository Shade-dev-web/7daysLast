import type { InventoryState } from './rules.ts';

/**
 * Вылазки по району (Expedition System).
 * Чистая логика без Three.js и React: легко тестируется и подключается к App.tsx отдельным шагом.
 *
 * Идея: днём игрок выходит из дома в одну из локаций, обыскивает комнаты,
 * кладёт добычу в рюкзак с лимитом веса и возвращается до ночного штурма.
 * Чем тяжелее рюкзак, тем больше шума он приносит домой.
 */

/** Ключи инвентаря, которые можно найти на вылазке. */
export type LootKey = Extract<
  keyof InventoryState,
  'food' | 'water' | 'batteries' | 'medkits' | 'adrenaline' | 'flares' | 'scrap' | 'wood' | 'wires' | 'cloth' | 'powder'
>;

export type LocationId = 'pharmacy' | 'garage' | 'store' | 'neighbor';

export interface LootEntry {
  /** Относительный шанс выпадения предмета в комнате. */
  weight: number;
  min: number;
  max: number;
}

export interface ExpeditionLocation {
  id: LocationId;
  name: string;
  desc: string;
  /** Дорога в одну сторону, игровых минут. */
  travelMinutes: number;
  /** Сколько комнат можно обыскать. */
  rooms: number;
  /** Базовый шанс встретить тварь в комнате, 0..1. */
  danger: number;
  loot: Partial<Record<LootKey, LootEntry>>;
}

export const LOCATIONS: Record<LocationId, ExpeditionLocation> = {
  pharmacy: {
    id: 'pharmacy',
    name: 'Аптека',
    desc: 'Бинты и адреналин, но витрины разбиты, а внутри эхо.',
    travelMinutes: 25,
    rooms: 3,
    danger: 0.22,
    loot: {
      medkits: { weight: 5, min: 1, max: 2 },
      cloth: { weight: 4, min: 1, max: 3 },
      adrenaline: { weight: 2, min: 1, max: 1 },
      water: { weight: 2, min: 1, max: 1 },
    },
  },
  garage: {
    id: 'garage',
    name: 'Гараж',
    desc: 'Железо, провода и аккумуляторы. Тесно, шумно и нет второго выхода.',
    travelMinutes: 35,
    rooms: 2,
    danger: 0.3,
    loot: {
      scrap: { weight: 6, min: 1, max: 3 },
      wires: { weight: 4, min: 1, max: 2 },
      batteries: { weight: 3, min: 1, max: 2 },
      powder: { weight: 1, min: 1, max: 1 },
    },
  },
  store: {
    id: 'store',
    name: 'Магазин',
    desc: 'Много еды и воды, но это самое людное место района.',
    travelMinutes: 45,
    rooms: 4,
    danger: 0.38,
    loot: {
      food: { weight: 6, min: 1, max: 3 },
      water: { weight: 5, min: 1, max: 3 },
      batteries: { weight: 2, min: 1, max: 1 },
      flares: { weight: 1, min: 1, max: 1 },
    },
  },
  neighbor: {
    id: 'neighbor',
    name: 'Соседний дом',
    desc: 'Близко и тихо, но добычи мало. Подходит для первого дня.',
    travelMinutes: 12,
    rooms: 2,
    danger: 0.14,
    loot: {
      wood: { weight: 4, min: 1, max: 3 },
      cloth: { weight: 3, min: 1, max: 2 },
      food: { weight: 2, min: 1, max: 1 },
      scrap: { weight: 2, min: 1, max: 2 },
    },
  },
};

export const LOCATION_LIST: LocationId[] = ['neighbor', 'pharmacy', 'garage', 'store'];

/** Вес одной единицы предмета в рюкзаке. */
export const ITEM_WEIGHT: Record<LootKey, number> = {
  food: 1,
  water: 1.5,
  batteries: 0.5,
  medkits: 1,
  adrenaline: 0.3,
  flares: 0.5,
  scrap: 1,
  wood: 2,
  wires: 0.4,
  cloth: 0.4,
  powder: 0.5,
};

export const BACKPACK_CAPACITY = 12;

export type Rng = () => number;

/** Детерминированный генератор для тестов и повторяемых сидов. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Loot = Partial<Record<LootKey, number>>;

export function lootWeight(loot: Loot): number {
  let w = 0;
  for (const key of Object.keys(loot) as LootKey[]) {
    w += (loot[key] ?? 0) * ITEM_WEIGHT[key];
  }
  return w;
}

/** Шанс встретить тварь в комнате: растёт с днём, зажат в 5..85%. */
export function encounterChance(baseDanger: number, day: number, dangerMult = 1): number {
  const dayFactor = 1 + 0.1 * (Math.max(1, day) - 1);
  return Math.min(0.85, Math.max(0.05, baseDanger * dayFactor * dangerMult));
}

export type ExpeditionEventType = 'loot' | 'empty' | 'fled' | 'bitten' | 'overweight';

export interface ExpeditionEvent {
  type: ExpeditionEventType;
  room: number;
  loot?: Loot;
  hpLost?: number;
}

export interface ExpeditionOptions {
  locationId: LocationId;
  day: number;
  rng: Rng;
  /** Множитель добычи (DifficultyConfig.loot). */
  lootMult?: number;
  /** Множитель опасности (DifficultyConfig.aware подходит). */
  dangerMult?: number;
  capacity?: number;
}

export interface ExpeditionResult {
  locationId: LocationId;
  events: ExpeditionEvent[];
  loot: Loot;
  hpLost: number;
  /** Туда и обратно, игровых минут. Укорачивается, если вылазка прервана раньше. */
  minutesSpent: number;
  /** Шум, который игрок приносит домой (привлекает ночной штурм), 0..100. */
  noiseOnReturn: number;
  /** true, если укус прервал вылазку. */
  cutShort: boolean;
}

function pickEntry(table: Partial<Record<LootKey, LootEntry>>, rng: Rng): LootKey | null {
  const keys = Object.keys(table) as LootKey[];
  let total = 0;
  for (const k of keys) total += table[k]!.weight;
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const k of keys) {
    roll -= table[k]!.weight;
    if (roll < 0) return k;
  }
  return keys[keys.length - 1] ?? null;
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function runExpedition(opts: ExpeditionOptions): ExpeditionResult {
  const loc = LOCATIONS[opts.locationId];
  const capacity = opts.capacity ?? BACKPACK_CAPACITY;
  const lootMult = opts.lootMult ?? 1;
  const chance = encounterChance(loc.danger, opts.day, opts.dangerMult ?? 1);
  const rng = opts.rng;

  const events: ExpeditionEvent[] = [];
  const loot: Loot = {};
  let hpLost = 0;
  let roomsSearched = 0;
  let cutShort = false;

  for (let room = 1; room <= loc.rooms; room++) {
    roomsSearched = room;

    // Бросок встречи делаем до добычи: так «бегство» теряет добычу этой комнаты.
    const met = rng() < chance;
    const key = pickEntry(loc.loot, rng);
    const entry = key ? loc.loot[key]! : null;
    let found: Loot | null = null;
    if (key && entry) {
      const amount = Math.max(0, Math.round(randInt(entry.min, entry.max, rng) * lootMult));
      if (amount > 0) found = { [key]: amount };
    }

    if (met) {
      if (rng() < 0.6) {
        const lost = randInt(8, 14, rng);
        hpLost += lost;
        events.push({ type: 'fled', room, hpLost: lost });
        continue;
      }
      const lost = randInt(18, 30, rng);
      hpLost += lost;
      events.push({ type: 'bitten', room, hpLost: lost });
      cutShort = true;
      if (found) addWithinCapacity(loot, found, capacity, events, room);
      break;
    }

    if (!found) {
      events.push({ type: 'empty', room });
      continue;
    }
    const kept = addWithinCapacity(loot, found, capacity, events, room);
    if (kept) events.push({ type: 'loot', room, loot: kept });
  }

  const fullTrip = loc.travelMinutes * 2;
  const searchMinutes = roomsSearched * 6;
  const minutesSpent = cutShort ? loc.travelMinutes + searchMinutes + Math.round(loc.travelMinutes * 0.5) : fullTrip + searchMinutes;
  const noiseOnReturn = Math.min(100, Math.round(10 + lootWeight(loot) * 3));

  return { locationId: loc.id, events, loot, hpLost, minutesSpent, noiseOnReturn, cutShort };
}

/** Кладёт предмет в рюкзак, пока хватает веса. Лишнее выбрасывается, возвращает то, что вошло. */
function addWithinCapacity(
  loot: Loot,
  found: Loot,
  capacity: number,
  events: ExpeditionEvent[],
  room: number,
): Loot | null {
  const kept: Loot = {};
  let any = false;
  let dropped = false;
  for (const key of Object.keys(found) as LootKey[]) {
    const want = found[key] ?? 0;
    for (let i = 0; i < want; i++) {
      if (lootWeight(loot) + ITEM_WEIGHT[key] > capacity + 1e-9) {
        dropped = true;
        break;
      }
      loot[key] = (loot[key] ?? 0) + 1;
      kept[key] = (kept[key] ?? 0) + 1;
      any = true;
    }
  }
  if (dropped) events.push({ type: 'overweight', room });
  return any ? kept : null;
}

/** Переносит добычу в инвентарь. Возвращает новый объект, исходный не меняется. */
export function applyLoot(inv: InventoryState, loot: Loot): InventoryState {
  const next: InventoryState = { ...inv };
  for (const key of Object.keys(loot) as LootKey[]) {
    next[key] = (next[key] ?? 0) + (loot[key] ?? 0);
  }
  return next;
}
