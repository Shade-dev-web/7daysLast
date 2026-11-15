import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialInventory,
  CRAFT_RECIPES,
  canCraft,
  applyCraft,
  stepFlashlightBattery,
  rechargeBattery,
  computeNoiseLevel,
  detectSurfaceMaterialAt,
  formatGameClock,
} from './rules';

test('initial inventory has expected survival items and crafting materials', () => {
  const inv = createInitialInventory('normal');
  assert.equal(inv.batteries, 2);
  assert.equal(inv.traps, 1);
  assert.ok(inv.scrap >= 3);
  assert.ok(inv.wires >= 2);
});

test('crafting bear trap consumes scrap and wires and increments traps count', () => {
  const inv = createInitialInventory('normal');
  const ammo = {
    deagle: { mag: 7, res: 7 },
    shotgun: { mag: 6, res: 6 },
    sniper: { mag: 5, res: 5 },
  };
  const trapRecipe = CRAFT_RECIPES.find((r) => r.id === 'trap')!;
  const beforeTraps = inv.traps;
  const beforeScrap = inv.scrap;
  const beforeWires = inv.wires;

  assert.equal(canCraft(inv, trapRecipe), true);
  const ok = applyCraft(inv, ammo, trapRecipe);
  assert.equal(ok, true);
  assert.equal(inv.traps, beforeTraps + 1);
  assert.equal(inv.scrap, beforeScrap - 2);
  assert.equal(inv.wires, beforeWires - 1);
});

test('flashlight battery drains when on and shuts off at 0%', () => {
  const step1 = stepFlashlightBattery(50, true, 2.0, 5.0, false);
  assert.equal(step1.battery, 40);
  assert.equal(step1.torchOn, true);
  assert.equal(step1.flickerFactor, 1);

  const stepLow = stepFlashlightBattery(11, true, 1.0, 1.0, false);
  assert.equal(stepLow.battery, 10);
  assert.equal(stepLow.torchOn, true);
  assert.ok(stepLow.flickerFactor < 1);

  const stepDead = stepFlashlightBattery(2, true, 5.0, 1.0, false);
  assert.equal(stepDead.battery, 0);
  assert.equal(stepDead.torchOn, false);
});

test('recharging battery consumes 1 battery item and adds +55% charge', () => {
  const inv = createInitialInventory('normal');
  const prevBattCount = inv.batteries;
  const res = rechargeBattery(25, inv);
  assert.equal(res.recharged, true);
  assert.equal(res.battery, 80);
  assert.equal(inv.batteries, prevBattCount - 1);
});

test('noise scale computes green, yellow, and red acoustic zones accurately', () => {
  const quiet = computeNoiseLevel({
    hidden: false,
    holdingBreath: false,
    moving: true,
    running: false,
    crouching: true,
    onGround: true,
    panic: 0,
    burst: 0,
    silentMod: false,
  });
  assert.equal(quiet.zone, 'green');
  assert.ok(quiet.db < 30);

  const walk = computeNoiseLevel({
    hidden: false,
    holdingBreath: false,
    moving: true,
    running: false,
    crouching: false,
    onGround: true,
    panic: 0,
    burst: 0,
    silentMod: false,
  });
  assert.equal(walk.zone, 'yellow');
  assert.equal(walk.db, 30);

  const sprint = computeNoiseLevel({
    hidden: false,
    holdingBreath: false,
    moving: true,
    running: true,
    crouching: false,
    onGround: true,
    panic: 0,
    burst: 0,
    silentMod: false,
  });
  assert.equal(sprint.zone, 'red');
  assert.ok(sprint.db >= 60);
});

test('surface material detection distinguishes wood, concrete, and rug and modulates noise', () => {
  assert.equal(detectSurfaceMaterialAt(1.8, 1.8), 'wood');
  assert.equal(detectSurfaceMaterialAt(8.5, 3.0), 'concrete');
  assert.equal(detectSurfaceMaterialAt(5.5, 11.2), 'concrete');
  assert.equal(detectSurfaceMaterialAt(6.8, 9.4), 'rug');

  const concreteWalk = computeNoiseLevel({
    hidden: false,
    holdingBreath: false,
    moving: true,
    running: false,
    crouching: false,
    onGround: true,
    panic: 0,
    burst: 0,
    silentMod: false,
    surface: 'concrete',
  });
  const rugWalk = computeNoiseLevel({
    hidden: false,
    holdingBreath: false,
    moving: true,
    running: false,
    crouching: false,
    onGround: true,
    panic: 0,
    burst: 0,
    silentMod: false,
    surface: 'rug',
  });
  assert.ok(concreteWalk.db > rugWalk.db);
});

test('formatGameClock formats elapsed hours starting from 06:00', () => {
  assert.equal(formatGameClock(0), '06:00');
  assert.equal(formatGameClock(6.5), '12:30');
  assert.equal(formatGameClock(18), '00:00');
});
