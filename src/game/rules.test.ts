import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialInventory,
  CRAFT_RECIPES,
  canCraft,
  applyCraft,
  stepFlashlightBattery,
  rechargeBattery,
  getDayMaxBatteryCapacity,
  getDayBatteryRechargeGain,
  computeNoiseLevel,
  detectSurfaceMaterialAt,
  formatGameClock,
} from './rules';

test('initial inventory has expected survival items and crafting materials', () => {
  const inv = createInitialInventory('normal');
  assert.equal(inv.batteries, 2);
  assert.equal(inv.traps, 1);
  assert.equal(inv.flares, 1);
  assert.equal(inv.adrenaline, 1);
  assert.ok(inv.scrap >= 3);
  assert.ok(inv.wires >= 2);
});

test('crafting bear trap and crimson flare consumes materials and increments counts', () => {
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

  const flareRecipe = CRAFT_RECIPES.find((r) => r.id === 'flare')!;
  const beforeFlares = inv.flares;
  assert.equal(applyCraft(inv, ammo, flareRecipe), true);
  assert.equal(inv.flares, beforeFlares + 1);
});

test('flashlight battery drains when on and clamps to day-degraded max capacity', () => {
  const step1 = stepFlashlightBattery(50, true, 2.0, 5.0, false, 1);
  assert.equal(step1.battery, 40);
  assert.equal(step1.maxCapacity, 100);
  assert.equal(step1.torchOn, true);
  assert.equal(step1.flickerFactor, 1);

  const stepDay6 = stepFlashlightBattery(85, true, 2.0, 1.0, false, 6);
  assert.equal(stepDay6.maxCapacity, 54);
  assert.equal(stepDay6.battery, 52);

  const stepDead = stepFlashlightBattery(2, true, 5.0, 1.0, false, 1);
  assert.equal(stepDead.battery, 0);
  assert.equal(stepDead.torchOn, false);
});

test('found battery maximum charge capacity and yield decrease by day number', () => {
  assert.equal(getDayMaxBatteryCapacity(1), 100);
  assert.equal(getDayMaxBatteryCapacity(3), 82);
  assert.equal(getDayMaxBatteryCapacity(5), 63);
  assert.equal(getDayMaxBatteryCapacity(7), 45);

  assert.ok(getDayBatteryRechargeGain(1) > getDayBatteryRechargeGain(4));
  assert.ok(getDayBatteryRechargeGain(4) > getDayBatteryRechargeGain(7));

  const inv = createInitialInventory('normal');
  inv.batteries = 3;

  // Day 1 recharge: +55% up to 100%
  const resDay1 = rechargeBattery(25, inv, 1);
  assert.equal(resDay1.recharged, true);
  assert.equal(resDay1.battery, 80);
  assert.equal(resDay1.maxCapacity, 100);

  // Day 6 recharge: capped at 54% max capacity even if starting at 45%
  const resDay6 = rechargeBattery(45, inv, 6);
  assert.equal(resDay6.recharged, true);
  assert.equal(resDay6.battery, 54);
  assert.equal(resDay6.maxCapacity, 54);

  // Day 7 recharge when already at Day 7 ceiling (45%) should not waste a battery
  const resFullEndgame = rechargeBattery(45, inv, 7);
  assert.equal(resFullEndgame.recharged, false);
  assert.equal(inv.batteries, 1);
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
