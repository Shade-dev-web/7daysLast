import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_WEIGHT,
  LOCATIONS,
  LOCATION_LIST,
  BACKPACK_CAPACITY,
  applyLoot,
  encounterChance,
  lootWeight,
  mulberry32,
  runExpedition,
  type LootKey,
} from './expedition.ts';

const alwaysLow = () => 0.0; // всегда «встреча», всегда первая запись таблицы
const alwaysHigh = () => 0.999; // никогда нет встречи

test('every location loot key has a weight and a valid range', () => {
  for (const id of LOCATION_LIST) {
    const loc = LOCATIONS[id];
    assert.ok(loc.rooms > 0 && loc.travelMinutes > 0);
    for (const key of Object.keys(loc.loot) as LootKey[]) {
      assert.ok(ITEM_WEIGHT[key] > 0, `${id}/${key} has no item weight`);
      const e = loc.loot[key]!;
      assert.ok(e.weight > 0 && e.min >= 1 && e.max >= e.min, `${id}/${key} range`);
    }
  }
});

test('same seed gives the same expedition', () => {
  const a = runExpedition({ locationId: 'store', day: 3, rng: mulberry32(42) });
  const b = runExpedition({ locationId: 'store', day: 3, rng: mulberry32(42) });
  assert.deepEqual(a, b);
});

test('backpack capacity is never exceeded', () => {
  for (let seed = 1; seed <= 300; seed++) {
    for (const id of LOCATION_LIST) {
      const r = runExpedition({ locationId: id, day: 1, rng: mulberry32(seed), lootMult: 3, dangerMult: 0.1 });
      assert.ok(lootWeight(r.loot) <= BACKPACK_CAPACITY + 1e-9, `seed ${seed} ${id}`);
    }
  }
});

test('small capacity drops items and reports overweight', () => {
  const r = runExpedition({ locationId: 'store', day: 1, rng: alwaysHigh, lootMult: 3, capacity: 2 });
  assert.ok(lootWeight(r.loot) <= 2 + 1e-9);
  assert.ok(r.events.some((e) => e.type === 'overweight'));
});

test('zero loot multiplier brings nothing home', () => {
  const r = runExpedition({ locationId: 'pharmacy', day: 1, rng: alwaysHigh, lootMult: 0 });
  assert.deepEqual(r.loot, {});
});

test('encounter chance grows with day and stays inside 5%..85%', () => {
  assert.ok(encounterChance(0.3, 7) > encounterChance(0.3, 1));
  assert.equal(encounterChance(0, 1), 0.05);
  assert.equal(encounterChance(1, 7, 5), 0.85);
});

test('no encounter: full trip, all rooms searched, no damage', () => {
  const r = runExpedition({ locationId: 'garage', day: 1, rng: alwaysHigh });
  assert.equal(r.hpLost, 0);
  assert.equal(r.cutShort, false);
  assert.equal(r.minutesSpent, LOCATIONS.garage.travelMinutes * 2 + LOCATIONS.garage.rooms * 6);
});

test('constant encounter: damage taken, never negative time', () => {
  const r = runExpedition({ locationId: 'store', day: 7, rng: alwaysLow, dangerMult: 2 });
  assert.ok(r.hpLost > 0);
  assert.ok(r.minutesSpent > 0);
});

test('heavier backpack brings more noise home', () => {
  const light = runExpedition({ locationId: 'neighbor', day: 1, rng: alwaysHigh, lootMult: 0 });
  const heavy = runExpedition({ locationId: 'store', day: 1, rng: alwaysHigh, lootMult: 3 });
  assert.ok(heavy.noiseOnReturn > light.noiseOnReturn);
  assert.ok(heavy.noiseOnReturn <= 100);
});

test('applyLoot adds to inventory without mutating the original', () => {
  const inv = { food: 1, water: 1, batteries: 2, medkits: 1, sedatives: 1, adrenaline: 1, traps: 1, decoys: 1, barricades: 1, shivs: 1, flares: 1, scrap: 3, wood: 2, wires: 2, cloth: 2, powder: 1 };
  const next = applyLoot(inv, { food: 2, scrap: 1 });
  assert.equal(next.food, 3);
  assert.equal(next.scrap, 4);
  assert.equal(inv.food, 1);
});
