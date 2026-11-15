import * as THREE from 'three';
import { WeaponKey, SurfaceMaterial, detectSurfaceMaterialAt } from './rules';
import { buildProceduralTextures, createGodRayMaterial, enhanceHorrorMaterial } from './shaders';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export interface CollisionBox {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  on: boolean;
}

export function boxGeo(w: number, h: number, d: number, tile = 2): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dm = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dm[f][0]) / tile, (uv.getY(k) * dm[f][1]) / tile);
    }
  }
  return g;
}

export function rbox(
  w: number,
  h: number,
  d: number,
  r: number,
  mat: THREE.Material
): THREE.Mesh {
  const bev = Math.max(0.004, Math.min(r * 0.6, d / 4, w / 4, h / 4));
  const bs = bev * 0.8;
  const sw = w - 2 * bs;
  const sh = h - 2 * bs;
  const rad = Math.max(0.002, Math.min(r, sw / 2 - 0.001, sh / 2 - 0.001));
  const x = -sw / 2;
  const y = -sh / 2;
  const s = new THREE.Shape();
  s.moveTo(x + rad, y);
  s.lineTo(x + sw - rad, y);
  s.quadraticCurveTo(x + sw, y, x + sw, y + rad);
  s.lineTo(x + sw, y + sh - rad);
  s.quadraticCurveTo(x + sw, y + sh, x + sw - rad, y + sh);
  s.lineTo(x + rad, y + sh);
  s.quadraticCurveTo(x, y + sh, x, y + sh - rad);
  s.lineTo(x, y + rad);
  s.quadraticCurveTo(x, y, x + rad, y);
  const dp = Math.max(0.001, d - 2 * bev);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: dp,
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bs,
    bevelSegments: 2,
    curveSegments: 5,
  });
  g.translate(0, 0, -dp / 2);
  return new THREE.Mesh(g, mat);
}

export function cyl(
  r1: number,
  r2: number,
  len: number,
  mat: THREE.Material,
  seg = 16
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, seg), mat);
  m.rotation.x = Math.PI / 2;
  return m;
}

export function put<T extends THREE.Object3D>(
  m: T,
  x: number,
  y: number,
  z: number,
  p?: THREE.Object3D
): T {
  m.position.set(x, y, z);
  if (p) p.add(m);
  return m;
}

export function buildGun(kind: WeaponKey): THREE.Group {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.36, metalness: 0.78 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.2, metalness: 0.88 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.86, metalness: 0.08 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4428, roughness: 0.62, metalness: 0.06 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a238, roughness: 0.3, metalness: 0.82 });
  const tritium = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const boreMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

  if (kind === 'deagle') {
    // Heavy triangular Desert Eagle slide & barrel
    put(rbox(0.044, 0.052, 0.275, 0.01, chrome), 0, 0.036, -0.1, g);
    // Slide serrations
    for (let i = 0; i < 6; i++) {
      put(new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.034, 0.004), steel), 0, 0.035, -0.01 + i * 0.009, g);
    }
    // Top picatinny rail slots
    for (let i = 0; i < 5; i++) {
      put(new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.012), steel), 0, 0.063, -0.19 + i * 0.025, g);
    }
    // Barrel muzzle & hollow bore
    put(cyl(0.018, 0.018, 0.055, chrome, 18), 0, 0.032, -0.26, g);
    put(cyl(0.012, 0.012, 0.01, boreMat, 14), 0, 0.032, -0.286, g);
    // Lower receiver frame & trigger guard
    put(rbox(0.036, 0.044, 0.21, 0.008, steel), 0, -0.004, -0.065, g);
    put(rbox(0.018, 0.01, 0.065, 0.003, steel), 0, -0.045, -0.055, g);
    put(rbox(0.018, 0.035, 0.01, 0.003, steel), 0, -0.03, -0.085, g);
    // Curved trigger & hammer
    const trig = put(rbox(0.008, 0.024, 0.01, 0.002, brass), 0, -0.026, -0.048, g);
    trig.rotation.x = 0.35;
    const ham = put(rbox(0.01, 0.024, 0.016, 0.003, steel), 0, 0.025, 0.042, g);
    ham.rotation.x = -0.4;
    // Ergonomic grip + stippled rubber panels + mag baseplate
    const gr = put(rbox(0.038, 0.115, 0.064, 0.01, rubber), 0, -0.075, 0.02, g);
    gr.rotation.x = -0.22;
    put(rbox(0.042, 0.014, 0.07, 0.004, steel), 0, -0.132, 0.033, g);
    // Glowing tritium night sights
    put(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.013, 0.008), steel), 0, 0.066, -0.225, g);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.003, 6, 6), tritium), 0, 0.069, -0.22, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.013, 0.01), steel), 0, 0.066, 0.02, g);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.0028, 6, 6), tritium), -0.005, 0.069, 0.025, g);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.0028, 6, 6), tritium), 0.005, 0.069, 0.025, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.035, -0.3);
  } else if (kind === 'shotgun') {
    // Upper barrel + ventilated top rib
    put(cyl(0.0165, 0.0165, 0.64, steel, 18), 0, 0.032, -0.36, g);
    put(cyl(0.012, 0.012, 0.01, boreMat, 14), 0, 0.032, -0.681, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.006, 0.62), steel), 0, 0.05, -0.35, g);
    // Under-barrel magazine tube & cap
    put(cyl(0.014, 0.014, 0.52, steel, 16), 0, -0.002, -0.31, g);
    put(cyl(0.0155, 0.0155, 0.025, chrome, 14), 0, -0.002, -0.575, g);
    // Receiver & brass shell ejection port
    put(rbox(0.05, 0.078, 0.22, 0.012, steel), 0, 0.006, 0, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.024, 0.075), brass), 0.001, 0.014, -0.02, g);
    // Ribbed wooden pump action forend
    const pump = new THREE.Group();
    pump.name = 'pump';
    pump.position.set(0, -0.022, -0.33);
    put(rbox(0.054, 0.048, 0.17, 0.014, wood), 0, 0, 0, pump);
    for (let i = -3; i <= 3; i++) {
      put(new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.036, 0.006), rubber), 0, 0, i * 0.02, pump);
    }
    g.add(pump);
    // Wooden stock, pistol grip & rubber recoil pad
    const st = put(rbox(0.044, 0.105, 0.31, 0.016, wood), 0, -0.03, 0.26, g);
    st.rotation.x = 0.12;
    const pad = put(rbox(0.045, 0.11, 0.025, 0.008, rubber), 0, -0.048, 0.415, g);
    pad.rotation.x = 0.12;
    const hd = put(rbox(0.036, 0.095, 0.055, 0.01, wood), 0, -0.065, 0.1, g);
    hd.rotation.x = 0.32;
    // Trigger guard & glowing front bead sight
    put(rbox(0.016, 0.025, 0.05, 0.003, steel), 0, -0.042, 0.04, g);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), tritium), 0, 0.056, -0.66, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.032, -0.69);
  } else if (kind === 'sniper') {
    // Heavy fluted barrel & tactical muzzle brake
    put(cyl(0.013, 0.016, 0.82, steel, 18), 0, 0.026, -0.5, g);
    put(rbox(0.028, 0.026, 0.065, 0.004, steel), 0, 0.026, -0.91, g);
    // Receiver & detachable box magazine
    put(rbox(0.048, 0.074, 0.32, 0.01, steel), 0, 0.006, -0.05, g);
    put(rbox(0.032, 0.085, 0.075, 0.006, steel), 0, -0.06, -0.05, g);
    // High-power rifle scope with turrets & glowing lens
    const sc = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.35, metalness: 0.72 });
    const lens = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    put(cyl(0.02, 0.02, 0.25, sc, 18), 0, 0.088, -0.12, g);
    put(cyl(0.032, 0.021, 0.065, sc, 18), 0, 0.088, -0.27, g);
    put(cyl(0.026, 0.02, 0.05, sc, 18), 0, 0.088, 0.025, g);
    put(cyl(0.022, 0.022, 0.005, lens, 14), 0, 0.088, 0.05, g);
    // Scope rings & elevation/windage turrets
    put(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.034, 0.018), steel), 0, 0.06, -0.06, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.034, 0.018), steel), 0, 0.06, -0.18, g);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 12), brass), 0, 0.112, -0.12, g);
    // Folded tactical bipod under forend
    [-0.022, 0.022].forEach((bx) => {
      put(cyl(0.005, 0.005, 0.18, steel, 8), bx, -0.028, -0.32, g);
    });
    // Precision stock with adjustable cheek rest
    const st = put(rbox(0.042, 0.115, 0.35, 0.016, wood), 0, -0.03, 0.3, g);
    st.rotation.x = 0.1;
    put(rbox(0.046, 0.045, 0.16, 0.01, rubber), 0, 0.018, 0.26, g);
    // Bolt handle & knob
    const bo = put(cyl(0.006, 0.006, 0.055, chrome, 10), 0.042, 0.015, 0, g);
    bo.rotation.set(0, 0, Math.PI / 2);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 10), chrome), 0.07, 0.015, 0, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.026, -0.94);
  }
  return g;
}

export function buildBearTrapMesh(): THREE.Group {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x383c42, roughness: 0.45, metalness: 0.82 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x6e3b24, roughness: 0.75, metalness: 0.42 });
  const warn = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.3 });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.024, 10, 24), iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.026;
  g.add(ring);

  // Side leaf springs
  [-0.24, 0.24].forEach((x) => {
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), rust), x, 0.03, 0, g);
  });

  // Central trigger pan
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.02, 16), rust);
  plate.position.y = 0.022;
  g.add(plate);
  const centerDot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.024, 12), warn);
  centerDot.position.y = 0.024;
  g.add(centerDot);

  // Serrated steel jaws
  for (let s = -1; s <= 1; s += 2) {
    for (let i = -3; i <= 3; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.075, 6), iron);
      tooth.position.set(i * 0.052, 0.062, s * 0.165);
      tooth.rotation.x = -s * 0.18;
      g.add(tooth);
    }
  }
  return g;
}

export function buildDecoyMesh(): THREE.Group {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.28, metalness: 0.88 });
  const body = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42, metalness: 0.35 });
  const face = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
  const handMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  put(new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.055, 18), body), 0, 0.095, 0, g).rotation.x =
    Math.PI / 2;
  put(new THREE.Mesh(new THREE.CircleGeometry(0.076, 16), face), 0, 0.095, 0.03, g);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.004), handMat), 0, 0.11, 0.032, g);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.004), handMat), 0.015, 0.095, 0.032, g);
  // Twin brass bells & legs
  put(new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), brass), -0.068, 0.175, 0, g);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), brass), 0.068, 0.175, 0, g);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), brass), -0.05, 0.02, 0, g);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), brass), 0.05, 0.02, 0, g);

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2244 })
  );
  led.position.set(0, 0.195, 0);
  led.name = 'led';
  g.add(led);
  return g;
}

export function buildHorrorHouse(
  scene: THREE.Scene,
  maxAnisotropy: number
) {
  const TX = buildProceduralTextures(maxAnisotropy);
  const COL: CollisionBox[] = [];
  const LOSW: CollisionBox[] = [];
  const HITM: THREE.Object3D[] = [];

  const addCol = (x0: number, z0: number, x1: number, z1: number, los = false) => {
    const c: CollisionBox = { x0, z0, x1, z1, on: true };
    COL.push(c);
    if (los) LOSW.push(c);
    return c;
  };

  const world = new THREE.Group();
  scene.add(world);

  const M = (
    c: number | THREE.Color,
    r = 0.85,
    m = 0,
    ex?: THREE.MeshStandardMaterialParameters
  ) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, ex || {}));

  const matL = enhanceHorrorMaterial(M(0xffffff, 0.88, 0, { map: TX.wallL, bumpMap: TX.bumpWood, bumpScale: 0.018 }));
  const matB = enhanceHorrorMaterial(M(0xffffff, 0.88, 0, { map: TX.wallB, bumpMap: TX.bumpWood, bumpScale: 0.018 }));
  const matK = enhanceHorrorMaterial(M(0xffffff, 0.82, 0.06, { map: TX.wallK }));
  const matWood = M(0xffffff, 0.68, 0.06, { map: TX.wood, bumpMap: TX.bumpWood, bumpScale: 0.022 });
  const matWoodDark = M(0x3b2616, 0.72, 0.08, { map: TX.wood });
  const matFab = M(0xd6c7b8, 0.88, 0, { map: TX.fabric, bumpMap: TX.bumpWood, bumpScale: 0.012 });
  const matFabGreen = M(0x6b8270, 0.85, 0.02, { map: TX.fabric, bumpMap: TX.bumpWood, bumpScale: 0.012 });
  const matTrim = M(0x9a8468, 0.75, 0.1);
  const matMetal = M(0x68707a, 0.35, 0.78);
  const matBrass = M(0xc8963e, 0.32, 0.82);
  const matDark = M(0x1c1e22, 0.58, 0.28);

  const regHit = (o: THREE.Object3D) => {
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) HITM.push(m);
    });
  };

  const addWall = (x0: number, z0: number, x1: number, z1: number) => {
    const w = x1 - x0;
    const d = z1 - z0;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const mat = cz > 6 ? matL : cx < 6 ? matB : matK;
    const m = new THREE.Mesh(boxGeo(w, 2.8, d, 2.8), mat);
    m.position.set(cx, 1.4, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    world.add(m);
    HITM.push(m);
    addCol(x0, z0, x1, z1, true);
    return m;
  };

  const addLintel = (x0: number, x1: number, z: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(boxGeo(x1 - x0, 0.7, 0.2, 2.8), mat);
    m.position.set((x0 + x1) / 2, 2.45, z);
    world.add(m);
    // Doorframe side casings
    put(new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 0.24), matWoodDark), x0, 1.05, z, world);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 0.24), matWoodDark), x1, 1.05, z, world);
  };

  // Floor & Ceiling (Wood floorboards base + Concrete slabs in Kitchen & Entrance)
  const surfaceMeshes: THREE.Mesh[] = [];
  const floorMat = enhanceHorrorMaterial(
    M(0xffffff, 0.72, 0.05, { map: TX.floor, bumpMap: TX.bumpWood, bumpScale: 0.025 })
  );
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(5.5, 0, 6);
  floor.receiveShadow = true;
  floor.userData.surfaceMaterial = 'wood' as SurfaceMaterial;
  world.add(floor);
  surfaceMeshes.push(floor);

  const concreteMat = enhanceHorrorMaterial(
    M(0xffffff, 0.8, 0.1, { map: TX.concrete, bumpMap: TX.bumpWood, bumpScale: 0.018 })
  );
  // Kitchen concrete floor slab (x: 6..11, z: 0..6)
  const kitchenFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 6.0), concreteMat);
  kitchenFloor.rotation.x = -Math.PI / 2;
  kitchenFloor.position.set(8.5, 0.008, 3.0);
  kitchenFloor.receiveShadow = true;
  kitchenFloor.userData.surfaceMaterial = 'concrete' as SurfaceMaterial;
  world.add(kitchenFloor);
  surfaceMeshes.push(kitchenFloor);

  // Entrance threshold concrete slab (x: 4.4..6.6, z: 10.6..12.0)
  const entranceFloor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), concreteMat);
  entranceFloor.rotation.x = -Math.PI / 2;
  entranceFloor.position.set(5.5, 0.008, 11.3);
  entranceFloor.receiveShadow = true;
  entranceFloor.userData.surfaceMaterial = 'concrete' as SurfaceMaterial;
  world.add(entranceFloor);
  surfaceMeshes.push(entranceFloor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(11, 12), M(0xffffff, 0.92, 0, { map: TX.ceil }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(5.5, 2.8, 6);
  world.add(ceil);

  // 3D Ceiling Lamp Fixtures at Room Light Positions
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff3d1 });
  [
    [5.5, 8.6],
    [3.0, 3.0],
    [8.5, 3.0],
  ].forEach(([lx, lz]) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 2.8, lz);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 14), matDark), 0, -0.02, 0, lamp);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), matDark), 0, -0.1, 0, lamp);
    put(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 16, 1, true), matMetal), 0, -0.18, 0, lamp);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), bulbMat), 0, -0.22, 0, lamp);
    world.add(lamp);
  });

  // Walls
  addWall(-0.2, -0.2, 11.2, 0);
  addWall(-0.2, 0, 0, 12.2);
  addWall(11, 0, 11.2, 12.2);
  addWall(0, 12, 4.7, 12.2);
  addWall(6.3, 12, 11, 12.2);
  addLintel(4.7, 6.3, 12.1, matL);
  addWall(0, 5.9, 2, 6.1);
  addWall(3.4, 5.9, 7.8, 6.1);
  addWall(9.4, 5.9, 11, 6.1);
  addLintel(2, 3.4, 6, matB);
  addLintel(7.8, 9.4, 6, matK);
  addWall(5.9, 0, 6.1, 5.9);

  // Front Door & Detailed Barricade Planks
  const doorPivot = new THREE.Group();
  doorPivot.position.set(6.3, 0, 12.02);
  world.add(doorPivot);
  const doorM = put(rbox(1.6, 2.1, 0.07, 0.01, matWood), -0.8, 1.05, 0, doorPivot);
  // Recessed door panels
  [-0.45, -1.15].forEach((dx) => {
    put(rbox(0.52, 0.72, 0.085, 0.008, matWoodDark), dx, 1.48, 0, doorPivot);
    put(rbox(0.52, 0.72, 0.085, 0.008, matWoodDark), dx, 0.58, 0, doorPivot);
  });
  const barricadePlanks: THREE.Mesh[] = [];
  [0.5, 1.1, 1.7].forEach((y) => {
    const p = put(
      rbox(1.72, 0.15, 0.048, 0.008, matWoodDark),
      -0.8,
      y,
      -0.058,
      doorPivot
    );
    p.rotation.z = rnd(-0.06, 0.06);
    barricadePlanks.push(p);
  });
  put(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), matBrass), -1.45, 1.0, -0.06, doorPivot);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), matBrass), -1.45, 1.0, 0.06, doorPivot);
  const doorCol = addCol(4.7, 11.95, 6.3, 12.15, true);
  HITM.push(doorM);

  // Windows with Pleated Curtains, Curtain Rods, Muntin Bars & God-Ray Shafts
  const winMats: THREE.MeshBasicMaterial[] = [];
  const shafts: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const curtainMat = M(0x6e3b3b, 0.88, 0.02, { map: TX.fabric, side: THREE.DoubleSide });
  const addWindow = (cx: number, cz: number, fx: number, fz: number) => {
    const g = new THREE.Group();
    g.position.set(cx + fx * 0.02, 1.55, cz + fz * 0.02);
    g.rotation.y = Math.atan2(fx, fz);
    world.add(g);

    const pm = new THREE.MeshBasicMaterial({ color: 0x1c2838 });
    winMats.push(pm);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.04), pm), 0, 0, 0, g);

    // Window frame & cross muntins
    put(rbox(1.36, 0.07, 0.06, 0.01, matWoodDark), 0, 0.55, 0.02, g);
    put(rbox(1.38, 0.08, 0.09, 0.01, matWoodDark), 0, -0.55, 0.03, g);
    put(rbox(0.06, 1.14, 0.06, 0.01, matWoodDark), -0.64, 0, 0.02, g);
    put(rbox(0.06, 1.14, 0.06, 0.01, matWoodDark), 0.64, 0, 0.02, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.04, 0.03), matWoodDark), 0, 0, 0.015, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.03, 0.03), matWoodDark), 0, 0, 0.015, g);

    // Nailed barricade boards
    for (let i = 0; i < 4; i++) {
      const b = put(
        rbox(1.52, 0.13, 0.04, 0.008, matWood),
        rnd(-0.04, 0.04),
        -0.4 + i * 0.27,
        0.04,
        g
      );
      b.rotation.z = rnd(-0.08, 0.08);
    }

    // Brass curtain rod + sculpted pleated drapes
    const rod = put(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.85, 10), matBrass), 0, 0.68, 0.07, g);
    rod.rotation.z = Math.PI / 2;
    [-1, 1].forEach((s) => {
      put(new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), matBrass), s * 0.94, 0.68, 0.07, g);
      for (let p = 0; p < 3; p++) {
        const pleat = put(
          rbox(0.12, 1.48, 0.045, 0.015, curtainMat),
          s * (0.64 + p * 0.1),
          -0.05,
          0.065 + (p % 2) * 0.015,
          g
        );
        pleat.rotation.z = s * 0.04;
      }
    });

    const rayGeo = new THREE.PlaneGeometry(1.15, 3.5);
    rayGeo.translate(0, -1.75, 0);
    const sh = new THREE.Mesh(rayGeo, createGodRayMaterial());
    sh.rotation.x = -1.0;
    sh.position.set(0, 0.4, 0.1);
    g.add(sh);
    shafts.push(sh);
  };
  addWindow(11, 3, -1, 0);
  addWindow(11, 9, -1, 0);
  addWindow(2.2, 12, 0, -1);
  addWindow(0, 4.2, 1, 0);

  // Outside Ground & Trees
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0xffffff, 1, 0, { map: TX.dirt }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(5.5, -0.02, 6);
  scene.add(ground);

  const treeM = M(0x161310, 1);
  for (let i = 0; i < 24; i++) {
    const x = rnd(-55, 65);
    const z = rnd(18, 85);
    if (Math.abs(x - 5.5) < 4 && z < 40) continue;
    const t = new THREE.Group();
    const h = rnd(4, 9);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h, 6), treeM), 0, h / 2, 0, t);
    for (let k = 0; k < 4; k++) {
      const b = put(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 2.5, 5), treeM), 0, h * 0.6 + k * 0.6, 0, t);
      b.rotation.z = rnd(-1.2, 1.2);
      b.rotation.y = rnd(0, 6);
    }
    t.position.set(x, 0, z);
    scene.add(t);
  }

  // Dust Motes in Air
  const dustG = new THREE.BufferGeometry();
  const dN = 160;
  const dP = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) {
    dP[i * 3] = rnd(0.5, 10.5);
    dP[i * 3 + 1] = rnd(0.3, 2.6);
    dP[i * 3 + 2] = rnd(0.5, 11.5);
  }
  dustG.setAttribute('position', new THREE.BufferAttribute(dP, 3));
  const dust = new THREE.Points(
    dustG,
    new THREE.PointsMaterial({
      size: 0.026,
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  scene.add(dust);

  // ============================================================================
  // HIGH-DETAIL SCULPTED FURNITURE
  // ============================================================================

  // 1. Living Room Sofa (with wooden legs, brass ferrules, piped cushions & throw pillows)
  const sofa = new THREE.Group();
  sofa.position.set(8.2, 0, 11.5);
  world.add(sofa);
  [
    [-1.05, -0.35],
    [1.05, -0.35],
    [-1.05, 0.3],
    [1.05, 0.3],
  ].forEach((p) => {
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.024, 0.22, 10), matWoodDark), p[0], 0.11, p[1], sofa);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.025, 0.04, 10), matBrass), p[0], 0.02, p[1], sofa);
  });
  put(rbox(2.34, 0.22, 0.88, 0.05, matWoodDark), 0, 0.28, 0, sofa);
  put(rbox(2.3, 0.18, 0.85, 0.05, matFab), 0, 0.35, 0, sofa);
  [-0.76, 0, 0.76].forEach((x) => {
    put(rbox(0.73, 0.17, 0.7, 0.05, matFab), x, 0.5, 0.06, sofa);
    const bk = put(rbox(0.72, 0.44, 0.18, 0.05, matFab), x, 0.8, -0.18, sofa);
    bk.rotation.x = -0.14;
    // Cushion button tufts
    [-0.14, 0.14].forEach((tx) => {
      put(new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), matTrim), x + tx, 0.82, -0.09, sofa);
    });
  });
  put(rbox(2.32, 0.64, 0.2, 0.06, matFab), 0, 0.73, -0.34, sofa);
  [-1.17, 1.17].forEach((x) => {
    put(rbox(0.22, 0.48, 0.88, 0.06, matFab), x, 0.52, 0, sofa);
    put(rbox(0.24, 0.12, 0.9, 0.05, matTrim), x, 0.74, 0.01, sofa);
  });
  const throwPillow = put(rbox(0.46, 0.36, 0.14, 0.05, matFabGreen), 0.72, 0.68, 0.08, sofa);
  throwPillow.rotation.set(-0.25, -0.35, 0.15);
  regHit(sofa);
  addCol(7.0, 11.05, 9.4, 11.95);

  // 2. Sculpted Club Armchair (with warm contrast piping, wooden legs, and cushion detail)
  const arm = new THREE.Group();
  arm.position.set(2.4, 0, 11.3);
  world.add(arm);
  [
    [-0.38, -0.35],
    [0.38, -0.35],
    [-0.38, 0.35],
    [0.38, 0.35],
  ].forEach((p) => {
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.2, 10), matWoodDark), p[0], 0.1, p[1], arm);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.023, 0.035, 10), matBrass), p[0], 0.02, p[1], arm);
  });
  put(rbox(0.96, 0.14, 0.92, 0.04, matWoodDark), 0, 0.22, 0, arm);
  put(rbox(0.92, 0.24, 0.88, 0.06, matFabGreen), 0, 0.34, 0, arm);
  put(rbox(0.68, 0.16, 0.68, 0.05, matFab), 0, 0.5, 0.05, arm);
  const armBack = put(rbox(0.88, 0.62, 0.22, 0.06, matFabGreen), 0, 0.76, -0.32, arm);
  armBack.rotation.x = -0.1;
  put(rbox(0.62, 0.42, 0.12, 0.04, matFab), 0, 0.76, -0.2, arm).rotation.x = -0.1;
  [-0.44, 0.44].forEach((x) => {
    put(rbox(0.18, 0.44, 0.86, 0.06, matFabGreen), x, 0.5, 0, arm);
    put(rbox(0.2, 0.1, 0.88, 0.04, matTrim), x, 0.7, 0.02, arm);
  });
  regHit(arm);
  addCol(1.95, 10.85, 2.85, 11.75);

  // 3. Coffee Table with Lower Shelf
  const ct = new THREE.Group();
  ct.position.set(8.0, 0, 9.4);
  world.add(ct);
  put(rbox(1.34, 0.06, 0.68, 0.02, matWood), 0, 0.42, 0, ct);
  put(rbox(1.18, 0.035, 0.54, 0.01, matWoodDark), 0, 0.16, 0, ct);
  [
    [-0.56, -0.26],
    [0.56, -0.26],
    [-0.56, 0.26],
    [0.56, 0.26],
  ].forEach((p) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.4, 10), matWoodDark), p[0], 0.2, p[1], ct)
  );
  regHit(ct);
  addCol(7.35, 9.07, 8.65, 9.73);

  // Rugs (offset on Y to prevent Z-fighting and tagged for surface detection)
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), M(0xffffff, 0.92, 0, { map: TX.rug }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.8, 0.02, 9.4);
  rug.userData.surfaceMaterial = 'rug' as SurfaceMaterial;
  world.add(rug);
  surfaceMeshes.push(rug);

  const bedroomRug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), M(0x3a4a5a, 0.92, 0, { map: TX.fabric }));
  bedroomRug.rotation.x = -Math.PI / 2;
  bedroomRug.position.set(3.2, 0.015, 3.2);
  bedroomRug.userData.surfaceMaterial = 'rug' as SurfaceMaterial;
  world.add(bedroomRug);
  surfaceMeshes.push(bedroomRug);

  // 4. TV Unit, Retro CRT Television & VCR Deck
  const tv = new THREE.Group();
  tv.position.set(0.35, 0, 9.2);
  world.add(tv);
  put(rbox(0.52, 0.52, 1.82, 0.025, matWood), 0, 0.26, 0, tv);
  [-0.55, 0.55].forEach((z) => {
    put(rbox(0.03, 0.42, 0.52, 0.01, matWoodDark), 0.26, 0.26, z, tv);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), matBrass), 0.28, 0.26, z + (z < 0 ? 0.18 : -0.18), tv);
  });
  // VCR Player inside shelf
  put(rbox(0.32, 0.08, 0.44, 0.01, matDark), 0.06, 0.56, 0, tv);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.08), new THREE.MeshBasicMaterial({ color: 0x34d399 })), 0.225, 0.56, 0.1, tv);
  // CRT Television Set
  put(rbox(0.38, 0.58, 0.86, 0.03, matDark), 0.02, 0.88, 0, tv);
  const tvScreen = new THREE.MeshStandardMaterial({ color: 0x16202a, roughness: 0.15, metalness: 0.35 });
  put(rbox(0.04, 0.46, 0.64, 0.02, tvScreen), 0.2, 0.89, -0.06, tv);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf43f5e })), 0.21, 0.68, 0.32, tv);
  // Rabbit-ear dipole antennas
  const ant1 = put(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.45, 6), matMetal), 0.05, 1.32, -0.1, tv);
  ant1.rotation.x = -0.35;
  const ant2 = put(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.45, 6), matMetal), 0.05, 1.32, 0.1, tv);
  ant2.rotation.x = 0.35;
  regHit(tv);
  addCol(0.1, 8.3, 0.6, 10.1);

  // 5. Bookshelf
  const bs = new THREE.Group();
  bs.position.set(10.72, 0, 7.4);
  world.add(bs);
  put(rbox(0.42, 1.94, 1.62, 0.02, matWood), 0, 0.97, 0, bs);
  for (let s = 0; s < 5; s++) {
    put(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 1.54), matWoodDark), -0.02, 0.18 + s * 0.36, 0, bs);
    let z = -0.7;
    while (z < 0.65) {
      const w = rnd(0.04, 0.09);
      const h = rnd(0.18, 0.3);
      const b = put(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.24, h, w),
          M(new THREE.Color().setHSL(rnd(0, 1), 0.42, 0.32), 0.8)
        ),
        -0.12,
        0.2 + s * 0.36 + h / 2,
        z + w / 2,
        bs
      );
      b.rotation.z = Math.random() < 0.15 ? rnd(-0.28, 0.28) : 0;
      z += w + 0.005;
    }
  }
  regHit(bs);
  addCol(10.5, 6.6, 10.95, 8.2);

  // 6. Kitchen Counter, Sink with Gooseneck Faucet, Stove, Fridge, Pantry & Table
  const kc = new THREE.Group();
  kc.position.set(8.15, 0, 0.42);
  world.add(kc);
  put(rbox(3.9, 0.88, 0.65, 0.02, M(0xb8b2a2, 0.78)), 0, 0.44, 0, kc);
  put(rbox(3.96, 0.055, 0.72, 0.015, M(0x282a2e, 0.42, 0.25)), 0, 0.9, 0, kc);
  for (let i = 0; i < 5; i++) {
    put(rbox(0.7, 0.7, 0.025, 0.01, M(0x948e7e, 0.82)), -1.5 + i * 0.75, 0.45, 0.33, kc);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), matBrass), -1.5 + i * 0.75, 0.72, 0.35, kc);
  }
  // Stainless steel sink & curved faucet
  put(rbox(0.74, 0.035, 0.48, 0.01, matMetal), 0.9, 0.925, 0, kc);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.24, 10), matMetal), 0.9, 1.04, -0.18, kc);
  put(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 14, Math.PI), matMetal), 0.9, 1.15, -0.11, kc).rotation.y = Math.PI / 2;
  // 4-burner stove top
  put(rbox(0.78, 0.03, 0.52, 0.01, matDark), -0.8, 0.925, 0, kc);
  [
    [-0.98, -0.12],
    [-0.62, -0.12],
    [-0.98, 0.12],
    [-0.62, 0.12],
  ].forEach(([bx, bz]) => {
    const burner = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 16), matMetal);
    burner.rotation.x = Math.PI / 2;
    put(burner, bx, 0.945, bz, kc);
  });
  for (let i = 0; i < 4; i++) {
    put(rbox(0.82, 0.62, 0.36, 0.02, M(0x9e9884, 0.82)), -1.45 + i * 0.95, 1.85, -0.15, kc);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), matBrass), -1.45 + i * 0.95, 1.62, 0.04, kc);
  }
  regHit(kc);
  addCol(6.2, 0.1, 10.1, 0.75);

  // Two-door Refrigerator
  const fr = new THREE.Group();
  fr.position.set(10.55, 0, 1.15);
  world.add(fr);
  put(rbox(0.72, 1.94, 0.72, 0.04, M(0xd2d4d0, 0.38, 0.25)), 0, 0.97, 0, fr);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.018, 0.74), matDark), 0, 1.35, 0, fr);
  put(rbox(0.035, 0.42, 0.045, 0.008, matMetal), -0.37, 1.62, 0.24, fr);
  put(rbox(0.035, 0.65, 0.045, 0.008, matMetal), -0.37, 0.92, 0.24, fr);
  regHit(fr);
  addCol(10.2, 0.8, 10.9, 1.5);

  const pan = new THREE.Group();
  pan.position.set(10.72, 0, 4.7);
  world.add(pan);
  put(rbox(0.42, 2.02, 1.42, 0.02, matWood), 0, 1.01, 0, pan);
  for (let s = 0; s < 4; s++) {
    put(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 1.32), matWoodDark), -0.01, 0.35 + s * 0.45, 0, pan);
  }
  regHit(pan);
  addCol(10.5, 4.0, 10.95, 5.4);

  const kt = new THREE.Group();
  kt.position.set(9.2, 0, 3.6);
  world.add(kt);
  put(rbox(1.34, 0.065, 0.88, 0.02, matWood), 0, 0.75, 0, kt);
  [
    [-0.55, -0.35],
    [0.55, -0.35],
    [-0.55, 0.35],
    [0.55, 0.35],
  ].forEach((p) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.028, 0.74, 10), matWoodDark), p[0], 0.37, p[1], kt)
  );
  regHit(kt);
  addCol(8.55, 3.17, 9.85, 4.03);

  // 7. Bedroom Bed, Nightstand with Lamp, Dresser & Military Transceiver Radio
  const bed = new THREE.Group();
  bed.position.set(4.5, 0, 1.15);
  world.add(bed);
  put(rbox(2.24, 0.32, 2.02, 0.04, matWood), 0, 0.25, 0, bed);
  put(rbox(2.12, 0.22, 1.92, 0.06, M(0x9ca3af, 0.9)), 0, 0.48, 0, bed);
  put(rbox(2.32, 0.96, 0.09, 0.03, matWoodDark), 0, 0.72, -0.98, bed);
  [-1.12, 1.12].forEach((px) => {
    put(new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), matBrass), px, 1.24, -0.98, bed);
  });
  [-0.52, 0.52].forEach((x) => put(rbox(0.74, 0.15, 0.42, 0.06, M(0xd6d1c4, 0.9)), x, 0.64, -0.68, bed));
  put(rbox(2.14, 0.12, 1.26, 0.05, matFabGreen), 0, 0.62, 0.36, bed);
  regHit(bed);
  addCol(3.3, 0.1, 5.7, 2.2);

  const ns = new THREE.Group();
  ns.position.set(2.95, 0, 0.35);
  world.add(ns);
  put(rbox(0.52, 0.56, 0.46, 0.02, matWood), 0, 0.28, 0, ns);
  put(rbox(0.44, 0.18, 0.025, 0.008, matWoodDark), 0, 0.4, 0.23, ns);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), matBrass), 0, 0.4, 0.25, ns);
  regHit(ns);
  addCol(2.7, 0.1, 3.2, 0.6);

  // Checkpoint Survivor Radio & Journal Desk on Dresser
  const dr = new THREE.Group();
  dr.position.set(5.5, 0, 4.4);
  world.add(dr);
  put(rbox(0.76, 0.92, 1.62, 0.03, matWood), 0, 0.46, 0, dr);
  for (let i = 0; i < 3; i++) {
    put(rbox(0.025, 0.24, 1.44, 0.01, matWoodDark), -0.38, 0.2 + i * 0.28, 0, dr);
    put(rbox(0.035, 0.03, 0.22, 0.006, matBrass), -0.4, 0.2 + i * 0.28, 0, dr);
  }
  // Detailed Military Transceiver Radio + Whip Antenna + Survivor Journal
  put(rbox(0.24, 0.16, 0.36, 0.02, M(0x283038, 0.42, 0.68)), 0, 0.99, -0.35, dr);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.18), new THREE.MeshBasicMaterial({ color: 0xfde68a })), -0.125, 1.01, -0.38, dr);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), matBrass), -0.13, 0.96, -0.25, dr).rotation.z = Math.PI / 2;
  const antWhip = put(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.55, 8), matMetal), 0.06, 1.32, -0.48, dr);
  antWhip.rotation.z = 0.15;
  const radioLed = put(
    new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 })),
    -0.125,
    1.03,
    -0.24,
    dr
  );
  // Leather Survivor Journal with bookmark ribbon
  put(rbox(0.26, 0.038, 0.32, 0.008, M(0x7c2d12, 0.8)), -0.1, 0.93, 0.35, dr);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.028, 0.3), M(0xfef3c7, 0.9)), -0.09, 0.93, 0.35, dr);
  regHit(dr);
  addCol(5.1, 3.6, 5.85, 5.2);

  // 8. Detailed Bedroom Wardrobe
  const wr = new THREE.Group();
  wr.position.set(0.55, 0, 1.6);
  world.add(wr);
  const wrBody = new THREE.Group();
  wr.add(wrBody);
  put(rbox(0.04, 2.1, 1.6, 0.01, matWood), -0.4, 1.05, 0, wrBody);
  put(rbox(0.94, 0.06, 1.64, 0.015, matWoodDark), 0, 2.09, 0, wrBody);
  put(rbox(0.9, 0.04, 1.6, 0.01, matWood), 0, 0.04, 0, wrBody);
  put(rbox(0.9, 2.1, 0.04, 0.01, matWood), 0, 1.05, -0.78, wrBody);
  put(rbox(0.9, 2.1, 0.04, 0.01, matWood), 0, 1.05, 0.78, wrBody);
  // Interior hanger rod & hanging coats
  put(cyl(0.012, 0.012, 1.5, matMetal, 10), 0, 1.82, 0, wrBody);
  for (let i = 0; i < 5; i++) {
    const coat = put(
      rbox(0.05, 0.72, 0.22, 0.04, M(new THREE.Color().setHSL(rnd(0, 1), 0.22, 0.28), 0.9)),
      0,
      1.42,
      -0.6 + i * 0.3,
      wrBody
    );
    coat.rotation.z = rnd(-0.06, 0.06);
  }
  const wrDoors = new THREE.Group();
  wr.add(wrDoors);
  [-1, 1].forEach((s) => {
    put(rbox(0.04, 2.04, 0.78, 0.01, matWood), 0.44, 1.05, s * 0.4, wrDoors);
    for (let i = 0; i < 14; i++) {
      const sl = put(
        new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.66), matWoodDark),
        0.47,
        0.3 + i * 0.12,
        s * 0.4,
        wrDoors
      );
      sl.rotation.z = 0.5;
    }
    put(rbox(0.035, 0.16, 0.03, 0.006, matBrass), 0.5, 1.05, s * 0.06, wrDoors);
  });
  regHit(wr);
  addCol(0.1, 0.8, 1.0, 2.4);

  // Loot & Crafting Material Props
  const canM = [M(0xb5472b, 0.38, 0.62), M(0x4b8f3a, 0.38, 0.62), M(0xc0a030, 0.38, 0.62)];
  const mkCan = (i: number) => {
    const cg = new THREE.Group();
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.11, 14), canM[i % 3]), 0, 0, 0, cg);
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.01, 14), matMetal), 0, 0.052, 0, cg);
    return cg;
  };
  const mkBottle = () => {
    const g = new THREE.Group();
    put(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.2, 12),
        M(0x9cc8e8, 0.18, 0.1, { transparent: true, opacity: 0.78 })
      ),
      0,
      0.1,
      0,
      g
    );
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.018, 0.05, 10), M(0x2a6fb0, 0.4)), 0, 0.225, 0, g);
    return g;
  };

  const propGroup = (y: number, x: number, z: number, fn: (g: THREE.Group) => void) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    world.add(g);
    fn(g);
    return g;
  };

  const loot = {
    table: propGroup(0.78, 9.1, 3.5, (g) => {
      put(mkCan(0), -0.3, 0.055, 0.1, g);
      put(mkCan(1), -0.18, 0.055, -0.1, g);
      put(rbox(0.2, 0.07, 0.1, 0.02, M(0xc99a5a, 0.85)), 0.2, 0.04, 0.05, g);
    }),
    counter: propGroup(0.92, 6.8, 0.42, (g) => {
      [0, 0.12].forEach((x) => put(mkBottle(), x, 0, 0, g));
      put(mkBottle(), 0.5, 0, 0.1, g);
    }),
    pantry: propGroup(0.35, 10.72, 4.2, (g) => {
      [0, 0.1, 0.2].forEach((x, i) => put(mkCan(i), -0.05, 0.055, x - 0.05, g));
      put(mkCan(1), -0.05, 0.5, 0.1, g);
    }),
    dresser: propGroup(0.92, 5.5, 4.1, (g) => {
      put(mkBottle(), 0, 0, 0.1, g);
    }),
    shelf: propGroup(0.8, 10.62, 7.1, (g) => {
      put(rbox(0.12, 0.08, 0.2, 0.01, M(0x5a6a3a, 0.65)), 0, 0.04, 0, g);
      put(rbox(0.12, 0.08, 0.2, 0.01, M(0x8a5a2a, 0.65)), 0, 0.04, 0.3, g);
    }),
    toolbox: propGroup(0.45, 8.0, 9.4, (g) => {
      put(rbox(0.34, 0.16, 0.19, 0.02, M(0xb91c1c, 0.38, 0.65)), 0, 0.08, 0, g);
      put(rbox(0.18, 0.03, 0.03, 0.005, matMetal), 0, 0.18, 0, g);
      put(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), matBrass), -0.09, 0.1, 0, g);
      put(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), matBrass), 0.09, 0.1, 0, g);
    }),
  };

  const gunProp = {
    deagle: buildGun('deagle'),
    sniper: buildGun('sniper'),
  };
  gunProp.deagle.position.set(2.95, 0.6, 0.33);
  gunProp.deagle.rotation.y = 0.5;
  world.add(gunProp.deagle);

  const caseG = new THREE.Group();
  caseG.position.set(1.45, 0.06, 6.5);
  world.add(caseG);
  put(rbox(1.34, 0.13, 0.38, 0.03, M(0x22252a, 0.5, 0.45)), 0, 0, 0, caseG);
  [-0.4, 0.4].forEach((cx) => {
    put(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.4), matBrass), cx, 0.05, 0, caseG);
  });
  put(gunProp.sniper, 0, 0.11, 0, caseG);
  gunProp.sniper.scale.set(0.9, 0.9, 0.9);
  gunProp.sniper.rotation.y = Math.PI / 2;

  const surfaceRay = new THREE.Raycaster(
    new THREE.Vector3(0, 1.2, 0),
    new THREE.Vector3(0, -1, 0),
    0,
    2.0
  );
  const detectSurface = (x: number, z: number): SurfaceMaterial => {
    surfaceRay.ray.origin.set(x, 1.2, z);
    const hits = surfaceRay.intersectObjects(surfaceMeshes, false);
    if (hits.length > 0) {
      let topHit = hits[0];
      for (let i = 1; i < hits.length; i++) {
        if (hits[i].point.y > topHit.point.y) {
          topHit = hits[i];
        }
      }
      const mat = topHit.object.userData?.surfaceMaterial as SurfaceMaterial | undefined;
      if (mat) return mat;
    }
    return detectSurfaceMaterialAt(x, z);
  };

  return {
    TX,
    COL,
    LOSW,
    HITM,
    world,
    doorPivot,
    doorCol,
    barricadePlanks,
    winMats,
    shafts,
    dust,
    wrDoors,
    loot,
    gunProp,
    caseG,
    radioLed,
    surfaceMeshes,
    detectSurface,
  };
}
