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
    bevelSegments: 1,
    curveSegments: 3,
  });
  g.translate(0, 0, -dp / 2);
  return new THREE.Mesh(g, mat);
}

export function cyl(
  r1: number,
  r2: number,
  len: number,
  mat: THREE.Material,
  seg = 14
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
  const steel = new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.42, metalness: 0.65 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.25, metalness: 0.78 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.88, metalness: 0.05 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5e3d24, roughness: 0.72, metalness: 0.05 });

  if (kind === 'deagle') {
    put(rbox(0.042, 0.05, 0.27, 0.012, chrome), 0, 0.035, -0.1, g);
    put(cyl(0.017, 0.017, 0.05, chrome), 0, 0.03, -0.26, g);
    put(rbox(0.036, 0.045, 0.2, 0.01, steel), 0, -0.005, -0.06, g);
    const gr = put(rbox(0.038, 0.11, 0.062, 0.012, rubber), 0, -0.075, 0.02, g);
    gr.rotation.x = -0.2;
    put(rbox(0.02, 0.02, 0.06, 0.006, steel), 0, -0.04, -0.08, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.006), steel), 0, 0.065, -0.22, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, 0.006), steel), 0, 0.065, 0.02, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.035, -0.3);
  } else if (kind === 'shotgun') {
    put(cyl(0.016, 0.016, 0.62, steel), 0, 0.03, -0.36, g);
    put(cyl(0.013, 0.013, 0.48, steel), 0, -0.002, -0.3, g);
    put(rbox(0.048, 0.075, 0.2, 0.015, steel), 0, 0.005, 0, g);
    const pump = put(rbox(0.05, 0.045, 0.15, 0.015, wood), 0, -0.022, -0.33, g);
    pump.name = 'pump';
    const st = put(rbox(0.042, 0.1, 0.3, 0.02, wood), 0, -0.03, 0.26, g);
    st.rotation.x = 0.12;
    const hd = put(rbox(0.035, 0.09, 0.05, 0.01, wood), 0, -0.065, 0.1, g);
    hd.rotation.x = 0.3;
    put(new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), chrome), 0, 0.052, -0.66, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.03, -0.68);
  } else if (kind === 'sniper') {
    put(cyl(0.012, 0.014, 0.8, steel), 0, 0.025, -0.5, g);
    put(rbox(0.045, 0.07, 0.3, 0.012, steel), 0, 0.005, -0.05, g);
    const sc = new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.45, metalness: 0.55 });
    put(cyl(0.02, 0.02, 0.24, sc), 0, 0.085, -0.12, g);
    put(cyl(0.03, 0.02, 0.05, sc), 0, 0.085, -0.26, g);
    put(cyl(0.025, 0.02, 0.04, sc), 0, 0.085, 0.02, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), steel), 0, 0.06, -0.06, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), steel), 0, 0.06, -0.18, g);
    const st = put(rbox(0.04, 0.11, 0.34, 0.02, wood), 0, -0.03, 0.3, g);
    st.rotation.x = 0.1;
    put(rbox(0.03, 0.07, 0.05, 0.01, steel), 0, -0.055, -0.04, g);
    const bo = put(cyl(0.006, 0.006, 0.05, chrome), 0.04, 0.015, 0, g);
    bo.rotation.set(0, 0, Math.PI / 2);
    put(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), chrome), 0.065, 0.015, 0, g);
    g.userData.muzzle = new THREE.Vector3(0, 0.025, -0.92);
  }
  return g;
}

export function buildBearTrapMesh(): THREE.Group {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x32353a, roughness: 0.55, metalness: 0.75 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x5c3422, roughness: 0.8, metalness: 0.35 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 8, 18), iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.025;
  g.add(ring);

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.018, 12), rust);
  plate.position.y = 0.02;
  g.add(plate);

  // Jaws with teeth
  for (let s = -1; s <= 1; s += 2) {
    for (let i = -2; i <= 2; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.065, 5), iron);
      tooth.position.set(i * 0.065, 0.055, s * 0.16);
      g.add(tooth);
    }
  }
  return g;
}

export function buildDecoyMesh(): THREE.Group {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.35, metalness: 0.8 });
  const body = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5, metalness: 0.3 });
  const face = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14), body), 0, 0.09, 0, g).rotation.x =
    Math.PI / 2;
  put(new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), face), 0, 0.09, 0.028, g);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), brass), -0.065, 0.17, 0, g);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), brass), 0.065, 0.17, 0, g);
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2244 })
  );
  led.position.set(0, 0.19, 0);
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

  const matL = enhanceHorrorMaterial(M(0xffffff, 0.92, 0, { map: TX.wallL, bumpMap: TX.bumpWood, bumpScale: 0.015 }));
  const matB = enhanceHorrorMaterial(M(0xffffff, 0.92, 0, { map: TX.wallB, bumpMap: TX.bumpWood, bumpScale: 0.015 }));
  const matK = enhanceHorrorMaterial(M(0xffffff, 0.88, 0.05, { map: TX.wallK }));
  const matWood = M(0xffffff, 0.76, 0.05, { map: TX.wood, bumpMap: TX.bumpWood, bumpScale: 0.02 });
  const matFab = M(0xffffff, 0.95, 0, { map: TX.fabric });
  const matMetal = M(0x555a60, 0.42, 0.68);
  const matDark = M(0x1a1b1e, 0.68, 0.22);

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
  };

  // Floor & Ceiling (Wood floorboards base + Concrete slabs in Kitchen & Entrance)
  const surfaceMeshes: THREE.Mesh[] = [];
  const floorMat = enhanceHorrorMaterial(
    M(0xffffff, 0.76, 0.04, { map: TX.floor, bumpMap: TX.bumpWood, bumpScale: 0.025 })
  );
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(5.5, 0, 6);
  floor.receiveShadow = true;
  floor.userData.surfaceMaterial = 'wood' as SurfaceMaterial;
  world.add(floor);
  surfaceMeshes.push(floor);

  const concreteMat = enhanceHorrorMaterial(
    M(0xffffff, 0.84, 0.08, { map: TX.concrete, bumpMap: TX.bumpWood, bumpScale: 0.018 })
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

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(11, 12), M(0xffffff, 0.95, 0, { map: TX.ceil }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(5.5, 2.8, 6);
  world.add(ceil);

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

  // Front Door & Barricade Planks
  const doorPivot = new THREE.Group();
  doorPivot.position.set(6.3, 0, 12.02);
  world.add(doorPivot);
  const doorM = put(new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.07), matWood), -0.8, 1.05, 0, doorPivot);
  const barricadePlanks: THREE.Mesh[] = [];
  [0.5, 1.1, 1.7].forEach((y) => {
    const p = put(
      new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.045), M(0x3b2a1b, 0.9)),
      -0.8,
      y,
      -0.055,
      doorPivot
    );
    p.rotation.z = rnd(-0.08, 0.08);
    barricadePlanks.push(p);
  });
  put(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), matMetal), -1.45, 1.0, 0.06, doorPivot);
  const doorCol = addCol(4.7, 11.95, 6.3, 12.15, true);
  HITM.push(doorM);

  // Windows with Custom GLSL God-Ray Shafts
  const winMats: THREE.MeshBasicMaterial[] = [];
  const shafts: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const addWindow = (cx: number, cz: number, fx: number, fz: number) => {
    const g = new THREE.Group();
    g.position.set(cx + fx * 0.02, 1.55, cz + fz * 0.02);
    g.rotation.y = Math.atan2(fx, fz);
    world.add(g);

    const pm = new THREE.MeshBasicMaterial({ color: 0x1a2433 });
    winMats.push(pm);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), pm), 0, 0, 0, g);

    const wm = M(0x3a2a1c, 0.9);
    for (let i = 0; i < 4; i++) {
      const b = put(
        new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.13, 0.035), wm),
        rnd(-0.05, 0.05),
        -0.4 + i * 0.27,
        0.03,
        g
      );
      b.rotation.z = rnd(-0.1, 0.1);
    }
    put(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), wm), 0, 0.55, 0.02, g);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), wm), 0, -0.55, 0.02, g);
    [-1, 1].forEach((s) => {
      const c = put(
        new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.4), M(0x523939, 1, 0, { side: THREE.DoubleSide })),
        s * 0.72,
        -0.1,
        0.05,
        g
      );
      c.rotation.z = s * 0.05;
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

  // Furniture
  const fabG = M(0x4b5a4c, 0.95, 0, { map: TX.fabric });

  // Sofa
  const sofa = new THREE.Group();
  sofa.position.set(8.2, 0, 11.5);
  world.add(sofa);
  [
    [-1.05, -0.35],
    [1.05, -0.35],
    [-1.05, 0.3],
    [1.05, 0.3],
  ].forEach((p) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.22, 8), matDark), p[0], 0.11, p[1], sofa)
  );
  put(rbox(2.3, 0.2, 0.85, 0.05, matFab), 0, 0.32, 0, sofa);
  [-0.76, 0, 0.76].forEach((x) => {
    put(rbox(0.74, 0.16, 0.68, 0.06, matFab), x, 0.5, 0.06, sofa);
    const bk = put(rbox(0.72, 0.42, 0.17, 0.06, matFab), x, 0.8, -0.18, sofa);
    bk.rotation.x = -0.14;
  });
  put(rbox(2.3, 0.6, 0.2, 0.07, matFab), 0, 0.72, -0.34, sofa);
  [-1.17, 1.17].forEach((x) => put(rbox(0.2, 0.46, 0.85, 0.07, matFab), x, 0.5, 0, sofa));
  put(rbox(0.5, 0.1, 0.4, 0.04, fabG), 0.6, 0.62, 0.1, sofa).rotation.y = 0.4;
  regHit(sofa);
  addCol(7.0, 11.05, 9.4, 11.95);

  // Armchair
  const arm = new THREE.Group();
  arm.position.set(2.4, 0, 11.3);
  world.add(arm);
  put(rbox(0.9, 0.3, 0.9, 0.06, fabG), 0, 0.28, 0, arm);
  put(rbox(0.7, 0.14, 0.65, 0.05, fabG), 0, 0.48, 0.05, arm);
  put(rbox(0.9, 0.6, 0.2, 0.07, fabG), 0, 0.7, -0.34, arm);
  [-0.45, 0.45].forEach((x) => put(rbox(0.15, 0.42, 0.8, 0.06, fabG), x, 0.46, 0, arm));
  regHit(arm);
  addCol(1.95, 10.85, 2.85, 11.75);

  // Coffee table
  const ct = new THREE.Group();
  ct.position.set(8.0, 0, 9.4);
  world.add(ct);
  put(rbox(1.3, 0.06, 0.65, 0.02, matWood), 0, 0.42, 0, ct);
  [
    [-0.55, -0.25],
    [0.55, -0.25],
    [-0.55, 0.25],
    [0.55, 0.25],
  ].forEach((p) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.4, 8), matWood), p[0], 0.2, p[1], ct)
  );
  regHit(ct);
  addCol(7.35, 9.07, 8.65, 9.73);

  // Rugs (offset on Y to prevent Z-fighting and tagged for surface detection)
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), M(0xffffff, 1, 0, { map: TX.rug }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.8, 0.02, 9.4);
  rug.userData.surfaceMaterial = 'rug' as SurfaceMaterial;
  world.add(rug);
  surfaceMeshes.push(rug);

  const bedroomRug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), M(0x3a4a5a, 0.95));
  bedroomRug.rotation.x = -Math.PI / 2;
  bedroomRug.position.set(3.2, 0.015, 3.2);
  bedroomRug.userData.surfaceMaterial = 'rug' as SurfaceMaterial;
  world.add(bedroomRug);
  surfaceMeshes.push(bedroomRug);

  // TV Unit
  const tv = new THREE.Group();
  tv.position.set(0.35, 0, 9.2);
  world.add(tv);
  put(rbox(0.5, 0.5, 1.8, 0.03, matWood), 0, 0.25, 0, tv);
  put(rbox(0.07, 0.55, 0.98, 0.02, matDark), 0.05, 0.8, 0, tv);
  regHit(tv);
  addCol(0.1, 8.3, 0.6, 10.1);

  // Bookshelf
  const bs = new THREE.Group();
  bs.position.set(10.72, 0, 7.4);
  world.add(bs);
  put(rbox(0.4, 1.9, 1.6, 0.02, matWood), 0, 0.95, 0, bs);
  for (let s = 0; s < 5; s++) {
    let z = -0.7;
    while (z < 0.65) {
      const w = rnd(0.04, 0.09);
      const h = rnd(0.18, 0.3);
      const b = put(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.24, h, w),
          M(new THREE.Color().setHSL(rnd(0, 1), 0.35, 0.28), 0.9)
        ),
        -0.12,
        0.2 + s * 0.36 + h / 2,
        z + w / 2,
        bs
      );
      b.rotation.z = Math.random() < 0.15 ? rnd(-0.3, 0.3) : 0;
      z += w + 0.005;
    }
  }
  regHit(bs);
  addCol(10.5, 6.6, 10.95, 8.2);

  // Kitchen Counter, Fridge, Pantry, Table
  const kc = new THREE.Group();
  kc.position.set(8.15, 0, 0.42);
  world.add(kc);
  put(rbox(3.9, 0.88, 0.65, 0.02, M(0xb3ad9d, 0.8)), 0, 0.44, 0, kc);
  put(rbox(3.95, 0.05, 0.7, 0.01, M(0x30302f, 0.5, 0.2)), 0, 0.9, 0, kc);
  for (let i = 0; i < 5; i++) {
    put(rbox(0.7, 0.7, 0.02, 0.01, M(0x8f897a, 0.85)), -1.5 + i * 0.75, 0.45, 0.33, kc);
  }
  put(rbox(0.7, 0.03, 0.45, 0.01, matMetal), 0.9, 0.92, 0, kc);
  for (let i = 0; i < 4; i++) {
    put(rbox(0.8, 0.6, 0.35, 0.02, M(0x9a947f, 0.85)), -1.45 + i * 0.95, 1.85, -0.15, kc);
  }
  regHit(kc);
  addCol(6.2, 0.1, 10.1, 0.75);

  const fr = new THREE.Group();
  fr.position.set(10.55, 0, 1.15);
  world.add(fr);
  put(rbox(0.7, 1.9, 0.7, 0.04, M(0xc9c9c4, 0.45, 0.18)), 0, 0.95, 0, fr);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.04), matMetal), -0.36, 1.25, 0.22, fr);
  regHit(fr);
  addCol(10.2, 0.8, 10.9, 1.5);

  const pan = new THREE.Group();
  pan.position.set(10.72, 0, 4.7);
  world.add(pan);
  put(rbox(0.4, 2.0, 1.4, 0.02, matWood), 0, 1, 0, pan);
  for (let s = 0; s < 4; s++) {
    put(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 1.3), M(0x241a12)), -0.01, 0.35 + s * 0.45, 0, pan);
  }
  regHit(pan);
  addCol(10.5, 4.0, 10.95, 5.4);

  const kt = new THREE.Group();
  kt.position.set(9.2, 0, 3.6);
  world.add(kt);
  put(rbox(1.3, 0.06, 0.85, 0.02, matWood), 0, 0.75, 0, kt);
  [
    [-0.55, -0.35],
    [0.55, -0.35],
    [-0.55, 0.35],
    [0.55, 0.35],
  ].forEach((p) =>
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.74, 8), matWood), p[0], 0.37, p[1], kt)
  );
  regHit(kt);
  addCol(8.55, 3.17, 9.85, 4.03);

  // Bedroom Bed, Nightstand, Dresser, Wardrobe & Checkpoint Radio Desk
  const bed = new THREE.Group();
  bed.position.set(4.5, 0, 1.15);
  world.add(bed);
  put(rbox(2.2, 0.3, 2.0, 0.04, matWood), 0, 0.25, 0, bed);
  put(rbox(2.1, 0.2, 1.9, 0.07, M(0x8a8f96, 0.95)), 0, 0.47, 0, bed);
  put(rbox(2.3, 0.9, 0.08, 0.03, matWood), 0, 0.7, -0.98, bed);
  [-0.5, 0.5].forEach((x) => put(rbox(0.7, 0.14, 0.4, 0.06, M(0xb8b2a4, 0.95)), x, 0.62, -0.7, bed));
  put(rbox(2.1, 0.1, 1.2, 0.05, M(0x4a5a4b, 0.95)), 0, 0.62, 0.4, bed);
  regHit(bed);
  addCol(3.3, 0.1, 5.7, 2.2);

  const ns = new THREE.Group();
  ns.position.set(2.95, 0, 0.35);
  world.add(ns);
  put(rbox(0.5, 0.55, 0.45, 0.02, matWood), 0, 0.28, 0, ns);
  regHit(ns);
  addCol(2.7, 0.1, 3.2, 0.6);

  // Checkpoint Survivor Radio & Journal Desk on Dresser
  const dr = new THREE.Group();
  dr.position.set(5.5, 0, 4.4);
  world.add(dr);
  put(rbox(0.75, 0.9, 1.6, 0.03, matWood), 0, 0.45, 0, dr);
  // Radio + Survivor Journal (Key-Point Save Station)
  put(rbox(0.22, 0.14, 0.32, 0.02, M(0x23282e, 0.5, 0.6)), 0, 0.97, -0.35, dr);
  const radioLed = put(
    new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: 0x10b981 })),
    -0.12,
    1.0,
    -0.25,
    dr
  );
  put(rbox(0.24, 0.03, 0.3, 0.008, M(0x7c2d12, 0.85)), -0.1, 0.92, 0.35, dr);
  regHit(dr);
  addCol(5.1, 3.6, 5.85, 5.2);

  // Wardrobe
  const wr = new THREE.Group();
  wr.position.set(0.55, 0, 1.6);
  world.add(wr);
  const wrBody = new THREE.Group();
  wr.add(wrBody);
  put(rbox(0.04, 2.1, 1.6, 0.01, matWood), -0.4, 1.05, 0, wrBody);
  put(rbox(0.9, 0.04, 1.6, 0.01, matWood), 0, 2.08, 0, wrBody);
  put(rbox(0.9, 0.04, 1.6, 0.01, matWood), 0, 0.04, 0, wrBody);
  put(rbox(0.9, 2.1, 0.04, 0.01, matWood), 0, 1.05, -0.78, wrBody);
  put(rbox(0.9, 2.1, 0.04, 0.01, matWood), 0, 1.05, 0.78, wrBody);
  const wrDoors = new THREE.Group();
  wr.add(wrDoors);
  [-1, 1].forEach((s) => {
    put(rbox(0.04, 2.04, 0.78, 0.01, matWood), 0.44, 1.05, s * 0.4, wrDoors);
    for (let i = 0; i < 14; i++) {
      const sl = put(
        new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.66), M(0x3a2616, 0.9)),
        0.47,
        0.3 + i * 0.12,
        s * 0.4,
        wrDoors
      );
      sl.rotation.z = 0.5;
    }
    put(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.025), matMetal), 0.5, 1.05, s * 0.06, wrDoors);
  });
  regHit(wr);
  addCol(0.1, 0.8, 1.0, 2.4);

  // Loot & Crafting Material Props
  const canM = [M(0xb5472b, 0.45, 0.55), M(0x4b8f3a, 0.45, 0.55), M(0xc0a030, 0.45, 0.55)];
  const mkCan = (i: number) => new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 12), canM[i % 3]);
  const mkBottle = () => {
    const g = new THREE.Group();
    put(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.2, 10),
        M(0x9cc8e8, 0.2, 0, { transparent: true, opacity: 0.72 })
      ),
      0,
      0.1,
      0,
      g
    );
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.05, 8), M(0x2a6fb0)), 0, 0.225, 0, g);
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
      put(rbox(0.2, 0.07, 0.1, 0.03, M(0xc99a5a, 0.9)), 0.2, 0.04, 0.05, g);
    }),
    counter: propGroup(0.92, 6.8, 0.42, (g) => {
      [0, 0.12].forEach((x) => put(mkBottle(), x, 0, 0, g));
      put(mkBottle(), 0.5, 0, 0.1, g);
    }),
    pantry: propGroup(0.35, 10.72, 4.2, (g) => {
      [0, 0.1, 0.2].forEach((x, i) => put(mkCan(i), -0.05, 0.055, x - 0.05, g));
      put(mkCan(1), -0.05, 0.5, 0.1, g);
    }),
    dresser: propGroup(0.9, 5.5, 4.1, (g) => {
      put(mkBottle(), 0, 0, 0.1, g);
    }),
    shelf: propGroup(0.8, 10.62, 7.1, (g) => {
      put(rbox(0.12, 0.08, 0.2, 0.01, M(0x5a6a3a, 0.7)), 0, 0.04, 0, g);
      put(rbox(0.12, 0.08, 0.2, 0.01, M(0x8a5a2a, 0.7)), 0, 0.04, 0.3, g);
    }),
    // New Crafting Toolbox & Materials Cache on Coffee Table / TV
    toolbox: propGroup(0.45, 8.0, 9.4, (g) => {
      put(rbox(0.32, 0.16, 0.18, 0.02, M(0x991b1b, 0.45, 0.6)), 0, 0.08, 0, g);
      put(rbox(0.18, 0.03, 0.03, 0.005, matMetal), 0, 0.18, 0, g);
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
  put(rbox(1.3, 0.12, 0.35, 0.03, M(0x22252a, 0.6, 0.3)), 0, 0, 0, caseG);
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
      // Pick the topmost floor layer (highest point.y)
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
