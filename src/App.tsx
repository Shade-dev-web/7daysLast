import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  DifficultyKey,
  DIFFICULTIES,
  WEAPONS,
  WEAPON_LIST,
  WeaponKey,
  InventoryState,
  createInitialInventory,
  CraftRecipe,
  applyCraft,
  stepFlashlightBattery,
  rechargeBattery,
  computeNoiseLevel,
  formatGameClock,
  CheckpointData,
} from './game/rules';
import { sfx } from './game/audio';
import { createVolumetricBeamMaterial, horrorShaderUniforms } from './game/shaders';
import {
  buildHorrorHouse,
  buildGun,
  buildBearTrapMesh,
  buildDecoyMesh,
  put,
  CollisionBox,
} from './game/worldBuilder';
import {
  saveCheckpointToSlot,
  getLatestCheckpoint,
  getCheckpointSlotsList,
  loadAllCheckpoints,
  SaveSlotMeta,
} from './game/saveSystem';
import { LeftScalePanel, LeftScaleRefs } from './components/LeftScalePanel';
import { InventoryModal } from './components/InventoryModal';
import { JumpscareOverlay, JumpscareState } from './components/JumpscareOverlay';
import {
  PauseSettingsModal,
  GameSettings,
  ModMenuState,
} from './components/PauseSettingsModal';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const angDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

const DAYLEN = 240;

const NODES: [number, number][] = [
  [5.5, 11],
  [5.5, 8.6],
  [2, 8.6],
  [9.2, 8],
  [2.7, 6],
  [3, 3.5],
  [1.6, 4.8],
  [4.6, 3.2],
  [8.6, 6],
  [7.4, 4.7],
  [7, 2],
  [9.8, 2.4],
  [3.6, 10],
  [9, 10.3],
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 12],
  [3, 13],
  [12, 13],
  [2, 12],
  [2, 4],
  [1, 4],
  [4, 5],
  [5, 6],
  [5, 7],
  [6, 4],
  [1, 8],
  [3, 8],
  [8, 9],
  [9, 10],
  [10, 11],
];
const ADJ: number[][] = NODES.map(() => []);
EDGES.forEach((e) => {
  ADJ[e[0]].push(e[1]);
  ADJ[e[1]].push(e[0]);
});

const SPOTS = {
  wardrobe: {
    id: 'wardrobe',
    x: 1.45,
    z: 1.6,
    cam: [0.55, 1.45, 1.6] as [number, number, number],
    yaw: -Math.PI / 2,
    exit: [1.55, 1.6] as [number, number],
    stand: [1.8, 1.6] as [number, number],
    r: 1.05,
    label: 'Спрятаться в шкаф',
  },
  sofa: {
    id: 'sofa',
    x: 8.2,
    z: 10.65,
    cam: [8.2, 0.17, 11.5] as [number, number, number],
    yaw: 0,
    exit: [8.2, 10.55] as [number, number],
    stand: [8.2, 10.2] as [number, number],
    r: 1.05,
    label: 'Залезть под диван',
  },
};

export type ZombieArchetype = 'stalker' | 'brute' | 'crawler';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const espCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);

  // High-frequency DOM refs for the Always-Left Scale Panel and HUD
  const scaleRefs = useRef<LeftScaleRefs>({
    noiseMarker: null,
    noiseFill: null,
    noiseVal: null,
    noiseZoneBadge: null,
    vertNoiseFill: null,
    vertNoiseMarker: null,
    hpBar: null,
    hpGhost: null,
    hpVal: null,
    batteryBar: null,
    batteryVal: null,
    foodBar: null,
    foodVal: null,
    waterBar: null,
    waterVal: null,
    breathBar: null,
    pulseVal: null,
    doorBar: null,
    doorVal: null,
  });

  const clockElRef = useRef<HTMLDivElement | null>(null);
  const fpsElRef = useRef<HTMLDivElement | null>(null);
  const ammoElRef = useRef<HTMLDivElement | null>(null);
  const toastElRef = useRef<HTMLDivElement | null>(null);
  const hitElRef = useRef<HTMLDivElement | null>(null);
  const dmgElRef = useRef<HTMLDivElement | null>(null);
  const vigElRef = useRef<HTMLDivElement | null>(null);
  const slatsElRef = useRef<HTMLDivElement | null>(null);
  const underElRef = useRef<HTMLDivElement | null>(null);
  const scopeElRef = useRef<HTMLDivElement | null>(null);
  const darkElRef = useRef<HTMLDivElement | null>(null);

  // React UI state (updated only on discrete user actions / state changes, never at 120Hz)
  const [screenMode, setScreenMode] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [selDiff, setSelDiff] = useState<DifficultyKey>('normal');
  const [invOpen, setInvOpen] = useState(false);
  const [pauseTab, setPauseTab] = useState(0);
  const [isPauseFromMenu, setIsPauseFromMenu] = useState(false);
  const [dayBanner, setDayBanner] = useState<{ visible: boolean; day: number; sub: string }>({
    visible: false,
    day: 1,
    sub: '06:00 · КЛЮЧЕВАЯ ТОЧКА СОХРАНЕНА',
  });
  const [endData, setEndData] = useState<{
    win: boolean;
    day: number;
    clock: string;
    kills: number;
    hides: number;
    trips: number;
  } | null>(null);
  const [jumpscare, setJumpscare] = useState<JumpscareState>({
    active: false,
    kind: 'phantom',
    caption: '',
  });
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [isHiddenState, setIsHiddenState] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [slotsList, setSlotsList] = useState<SaveSlotMeta[]>(() => getCheckpointSlotsList());
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => Boolean(getLatestCheckpoint()));

  // Snapshot of player inventory & status for modals and left panel buttons
  const [uiSnapshot, setUiSnapshot] = useState<{
    inv: InventoryState;
    hp: number;
    hpMax: number;
    food: number;
    water: number;
    battery: number;
    doorHp: number;
    torchOn: boolean;
    weapons: Record<WeaponKey, boolean>;
    ammo: Record<WeaponKey, { mag: number; res: number }>;
    curWeapon: WeaponKey | null;
  }>(() => ({
    inv: createInitialInventory('normal'),
    hp: 100,
    hpMax: 100,
    food: 85,
    water: 85,
    battery: 100,
    doorHp: 100,
    torchOn: false,
    weapons: { deagle: false, shotgun: false, sniper: false },
    ammo: {
      deagle: { mag: 0, res: 0 },
      shotgun: { mag: 0, res: 0 },
      sniper: { mag: 0, res: 0 },
    },
    curWeapon: null,
  }));

  const [cfg, setCfg] = useState<GameSettings>(() => {
    const def: GameSettings = {
      sens: 1,
      uiScale: 1,
      uiOpacity: 0.9,
      quality: 2,
      targetFps: 120,
      showFps: true,
      dynamicLights: true,
      customShaders: true,
      shadows: true,
      jumpscareIntensity: 1.0,
      vib: true,
      fov: 74,
      vol: 0.9,
      ambientVol: 0.75,
    };
    try {
      const saved = JSON.parse(localStorage.getItem('s7_ultra_cfg') || '{}');
      return { ...def, ...saved };
    } catch {
      return def;
    }
  });

  const [mod, setMod] = useState<ModMenuState>({
    god: false,
    infAmmo: false,
    infBattery: false,
    noHunger: false,
    silent: false,
    blind: false,
    esp: false,
    nightVision: false,
    slowMo: false,
    speedMul: 1,
    timeScale: 1,
  });

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const modRef = useRef(mod);
  modRef.current = mod;
  const invOpenRef = useRef(invOpen);
  invOpenRef.current = invOpen;

  // Mutable engine bridge ref so React handlers can invoke 3D engine actions cleanly
  const engineApiRef = useRef<{
    startNewGame: (diff: DifficultyKey) => void;
    loadCheckpointData: (cp: CheckpointData) => void;
    saveToSlot: (slotId: string, title?: string) => void;
    returnToTitle: () => void;
    toggleTorch: () => void;
    rechargeTorch: () => void;
    useConsumable: (type: 'food' | 'water' | 'battery' | 'medkit' | 'sedative') => void;
    useDefenseTool: (type: 'trap' | 'decoy' | 'barricade') => void;
    craftItem: (recipe: CraftRecipe) => void;
    selectWeapon: (w: WeaponKey) => void;
    swapWeapon: () => void;
    reloadWeapon: () => void;
    performInteract: () => void;
    toggleAim: () => void;
    toggleCrouch: () => void;
    triggerJump: () => void;
    setFireHeld: (held: boolean, pressed?: boolean) => void;
    setBreathHeld: (held: boolean) => void;
    toggleMic: (on: boolean) => void;
    execModAction: (act: string) => void;
    setPausedState: (p: boolean) => void;
  } | null>(null);

  // Sync body dataset state for Ultra Mode verification
  useEffect(() => {
    if (invOpen && screenMode === 'playing') {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = screenMode;
    }
  }, [screenMode, invOpen]);

  // Apply CSS variables for UI scale & opacity
  useEffect(() => {
    document.documentElement.style.setProperty('--ui', String(cfg.uiScale));
    document.documentElement.style.setProperty('--op', String(cfg.uiOpacity));
    sfx.setVolume(cfg.vol);
    sfx.setAmbientVolume(cfg.ambientVol);
    horrorShaderUniforms.uShaderQuality.value = cfg.customShaders ? 1 : 0;
    try {
      localStorage.setItem('s7_ultra_cfg', JSON.stringify(cfg));
    } catch {
      // ignore
    }
  }, [cfg]);

  const refreshSaveSlots = useCallback(() => {
    setSlotsList(getCheckpointSlotsList());
    setHasSavedGame(Boolean(getLatestCheckpoint()));
  }, []);

  // Initialize Three.js WebGL Engine Once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect software WebGL (SwiftShader / llvmpipe) per threejs skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.autoClear = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl && cfgRef.current.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'fixed inset-0 w-full h-full block z-0';
    renderer.domElement.setAttribute('data-testid', 'game-canvas');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.042);

    // Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(cfgRef.current.fov, window.innerWidth / window.innerHeight, 0.04, 140);
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    const vScene = new THREE.Scene();
    const vCam = new THREE.PerspectiveCamera(cfgRef.current.fov, window.innerWidth / window.innerHeight, 0.01, 10);
    vScene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const vDir = new THREE.DirectionalLight(0xffffff, 1.15);
    vDir.position.set(1, 2, 2);
    vScene.add(vDir);

    const applyResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const q = cfgRef.current.quality;
      const pr = isSoftwareGl ? 1 : [1, 1.35, Math.min(window.devicePixelRatio || 1, 2)][q] || 1;
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      vCam.aspect = w / h;
      vCam.updateProjectionMatrix();
      if (espCanvasRef.current) {
        espCanvasRef.current.width = w;
        espCanvasRef.current.height = h;
      }
    };
    applyResize();
    window.addEventListener('resize', applyResize);

    // Build 3D Horror House & Props
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const house = buildHorrorHouse(scene, maxAniso);
    const {
      TX,
      COL,
      LOSW,
      HITM,
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
    } = house;

    // Dynamic Horror Lights
    const hemi = new THREE.HemisphereLight(0xbfd0e0, 0x2c241b, 0.22);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0x8a96a8, 0.08);
    scene.add(amb);

    const roomLights = (
      [
        [5.5, 2.55, 8.6],
        [3.0, 2.55, 3.0],
        [8.5, 2.55, 3.0],
      ] as [number, number, number][]
    ).map((p) => {
      const l = new THREE.PointLight(0xdfe8ff, 0.5, 13.5, 1.65);
      l.position.set(...p);
      scene.add(l);
      return l;
    });

    // Flashlight SpotLight + Volumetric Shader Cone
    const torch = new THREE.SpotLight(0xfff0d0, 0, 18.5, 0.56, 0.52, 1.15);
    torch.position.set(0.12, -0.08, 0);
    if (!isSoftwareGl) {
      torch.castShadow = true;
      torch.shadow.mapSize.width = 1024;
      torch.shadow.mapSize.height = 1024;
      torch.shadow.camera.near = 0.2;
      torch.shadow.camera.far = 18;
      torch.shadow.bias = -0.0005;
    }
    camera.add(torch);
    const tTarget = new THREE.Object3D();
    tTarget.position.set(0, 0, -3.5);
    camera.add(tTarget);
    torch.target = tTarget;

    // Volumetric Flashlight Cone Mesh
    const beamMat = createVolumetricBeamMaterial();
    const beamGeo = new THREE.ConeGeometry(1.55, 5.2, 24, 1, true);
    beamGeo.translate(0, -2.6, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0.12, -0.08, -0.1);
    beamMesh.visible = false;
    camera.add(beamMesh);

    // Muzzle Flash PointLight
    const mLight = new THREE.PointLight(0xffc070, 0, 10, 2);
    mLight.position.set(0, 0, -0.7);
    camera.add(mLight);

    // Lightning Flash Directional Light outside windows
    const lightningLight = new THREE.DirectionalLight(0xcfe4ff, 0);
    lightningLight.position.set(16, 12, 18);
    scene.add(lightningLight);

    // Viewmodel Setup
    const vm = {
      g: new THREE.Group(),
      model: null as THREE.Group | null,
      kick: 0,
      pump: 0,
      swap: 0,
      bob: 0,
      sx: 0,
      cur: null as WeaponKey | null,
    };
    vScene.add(vm.g);
    const skinV = new THREE.MeshStandardMaterial({ color: 0xc9987a, roughness: 0.8 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x2b3a2e, roughness: 0.9 });
    const handG = (x: number, y: number, z: number) => {
      const h = new THREE.Group();
      const pl = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), skinV);
      pl.scale.set(1.1, 0.9, 1.3);
      h.add(pl);
      for (let i = 0; i < 3; i++) {
        put(
          new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.03, 3, 6), skinV),
          -0.016 + i * 0.016,
          0,
          -0.045,
          h
        ).rotation.x = Math.PI / 2;
      }
      const th = put(new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.03, 3, 6), skinV), 0.03, 0.01, -0.01, h);
      th.rotation.set(0, 0, -0.9);
      const fa = put(new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.26, 4, 8), sleeve), 0, -0.04, 0.2, h);
      fa.rotation.x = Math.PI / 2 + 0.25;
      h.position.set(x, y, z);
      return h;
    };
    const VMP: Record<WeaponKey, [number, number, number]> = {
      deagle: [0.13, -0.13, -0.32],
      shotgun: [0.14, -0.2, -0.3],
      sniper: [0.14, -0.2, -0.34],
    };
    const VMA: Record<WeaponKey, [number, number, number]> = {
      deagle: [0, -0.095, -0.25],
      shotgun: [0, -0.135, -0.28],
      sniper: [0, -0.12, -0.3],
    };
    const vmModels: Partial<Record<WeaponKey, THREE.Group>> = {};
    let flashM: THREE.Mesh | null = null;

    const buildVM = (k: WeaponKey) => {
      const g = new THREE.Group();
      const gun = buildGun(k);
      g.add(gun);
      g.userData.gun = gun;
      if (k === 'deagle') g.add(handG(0, -0.085, 0.04));
      if (k === 'shotgun') {
        g.add(handG(0, -0.07, 0.1));
        const l = handG(0, -0.045, -0.33);
        l.rotation.y = 0.2;
        g.add(l);
      }
      if (k === 'sniper') {
        g.add(handG(0, -0.075, 0.14));
        g.add(handG(0, -0.05, -0.18));
      }
      const f = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.16),
        new THREE.MeshBasicMaterial({
          color: 0xffd37a,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      f.position.copy(gun.userData.muzzle);
      f.visible = false;
      g.add(f);
      g.userData.flash = f;
      return g;
    };

    const vmSet = (k: WeaponKey | null) => {
      if (vm.model) vm.g.remove(vm.model);
      vm.model = null;
      vm.cur = k;
      flashM = null;
      if (!k) return;
      if (!vmModels[k]) vmModels[k] = buildVM(k);
      vm.model = vmModels[k]!;
      vm.g.add(vm.model);
      flashM = vm.model.userData.flash;
    };

    // Pooled Particles (Zero GC in render loop)
    const parts: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
    const pGeo = new THREE.SphereGeometry(0.035, 5, 4);
    const bloodM = new THREE.MeshBasicMaterial({ color: 0x7a0d12 });
    const dustM = new THREE.MeshBasicMaterial({ color: 0x9a9488 });
    for (let i = 0; i < 60; i++) {
      const m = new THREE.Mesh(pGeo, bloodM);
      m.visible = false;
      scene.add(m);
      parts.push({ m, v: new THREE.Vector3(), life: 0 });
    }
    const spawnP = (pos: THREE.Vector3, n: number, mat: THREE.Material, spd: number) => {
      let k = 0;
      for (const p of parts) {
        if (k >= n) break;
        if (p.life > 0) continue;
        p.life = rnd(0.4, 0.9);
        p.m.material = mat;
        p.m.visible = true;
        p.m.position.copy(pos);
        p.v.set(rnd(-1, 1), rnd(0.2, 1.5), rnd(-1, 1)).multiplyScalar(spd);
        k++;
      }
    };

    // Game Simulation State
    let D = DIFFICULTIES.normal;
    const S = {
      mode: 'title' as 'title' | 'playing' | 'paused' | 'gameover',
      diff: 'normal' as DifficultyKey,
      t: 0,
      paused: false,
      hp: 100,
      hpMax: 100,
      hpGhost: 100,
      food: 85,
      water: 85,
      battery: 100,
      doorHp: 100,
      inv: createInitialInventory('normal'),
      weapons: { deagle: false, shotgun: false, sniper: false } as Record<WeaponKey, boolean>,
      ammo: {
        deagle: { mag: 0, res: 0 },
        shotgun: { mag: 0, res: 0 },
        sniper: { mag: 0, res: 0 },
      } as Record<WeaponKey, { mag: number; res: number }>,
      cur: null as WeaponKey | null,
      kitTaken: false,
      tripReady: 8,
      hidden: null as (typeof SPOTS)['wardrobe'] | null,
      aim: false,
      torch: false,
      raidPlan: [] as number[],
      raid: null as { state: 'approach' | 'inside'; timer: number; stay: number; n: number } | null,
      day: 1,
      shownDay: 0,
      kills: 0,
      noiseRed: 0,
      trips: 0,
      hides: 0,
      hint: 0,
      hitstop: 0,
      lightningT: 0,
      scareCd: 22,
    };

    const P = {
      x: 3.0,
      y: 0,
      z: 3.6,
      vy: 0,
      yaw: 0.93,
      pitch: 0,
      onGround: true,
      crouchT: 0,
      hideT: 0,
      panic: 0,
      breath: 100,
      gasp: 0,
      burst: 0,
      noise: 5,
      zone: 'green' as 'green' | 'yellow' | 'red',
      bob: 0,
      stepAcc: 0,
      moved: 0,
      shake: 0,
      kick: 0,
      run: false,
      moving: false,
    };

    const inp = {
      mx: 0,
      mz: 0,
      mag: 0,
      run: false,
      fire: false,
      firePress: false,
      jump: false,
      crouch: false,
      breath: false,
    };

    // Active Placed Traps & Thrown Decoys in 3D World
    const activeTraps: { x: number; z: number; mesh: THREE.Group }[] = [];
    const activeDecoys: { x: number; z: number; timer: number; ringT: number; mesh: THREE.Group }[] = [];

    const clearTrapsAndDecoys = () => {
      activeTraps.forEach((t) => scene.remove(t.mesh));
      activeTraps.length = 0;
      activeDecoys.forEach((d) => scene.remove(d.mesh));
      activeDecoys.length = 0;
    };

    // Sync React UI Snapshot on discrete changes
    const syncReactSnapshot = () => {
      setUiSnapshot({
        inv: { ...S.inv },
        hp: S.hp,
        hpMax: S.hpMax,
        food: S.food,
        water: S.water,
        battery: S.battery,
        doorHp: S.doorHp,
        torchOn: S.torch,
        weapons: { ...S.weapons },
        ammo: {
          deagle: { ...S.ammo.deagle },
          shotgun: { ...S.ammo.shotgun },
          sniper: { ...S.ammo.sniper },
        },
        curWeapon: S.cur,
      });
    };

    let toastTimer = 0;
    const toast = (msg: string, ms = 2600) => {
      if (toastElRef.current) {
        toastElRef.current.textContent = msg;
        toastElRef.current.style.opacity = '1';
      }
      toastTimer = ms / 1000;
    };

    const vib = (pattern: number | number[]) => {
      if (cfgRef.current.vib && navigator.vibrate) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // ignore
        }
      }
    };

    // Jumpscare Trigger
    let scareTimeout: number | null = null;
    const triggerJumpscare = (kind: JumpscareState['kind'], caption: string) => {
      const intensity = cfgRef.current.jumpscareIntensity;
      if (intensity <= 0) return;
      sfx.jumpscareSting(intensity);
      P.shake = Math.max(P.shake, 0.75 * intensity);
      P.panic = clamp(P.panic + 0.45, 0, 1);
      S.hitstop = 0.06;
      vib([90, 30, 120]);
      setJumpscare({ active: true, kind, caption });
      if (scareTimeout) window.clearTimeout(scareTimeout);
      scareTimeout = window.setTimeout(() => {
        setJumpscare({ active: false, kind: 'phantom', caption: '' });
      }, 650);
    };

    // Collision & LOS Helpers
    const hitCol = (x: number, z: number, r: number) => {
      for (let i = 0; i < COL.length; i++) {
        const c = COL[i];
        if (!c.on) continue;
        const cx = x < c.x0 ? c.x0 : x > c.x1 ? c.x1 : x;
        const cz = z < c.z0 ? c.z0 : z > c.z1 ? c.z1 : z;
        const dx = x - cx;
        const dz = z - cz;
        if (dx * dx + dz * dz < r * r) return true;
      }
      return false;
    };

    const moveCol = (pos: { x: number; z: number }, dx: number, dz: number, r: number) => {
      const nx = pos.x + dx;
      if (!hitCol(nx, pos.z, r)) pos.x = nx;
      const nz = pos.z + dz;
      if (!hitCol(pos.x, nz, r)) pos.z = nz;
    };

    const segBox = (x0: number, z0: number, x1: number, z1: number, b: CollisionBox) => {
      let tmin = 0;
      let tmax = 1;
      const dx = x1 - x0;
      const dz = z1 - z0;
      if (Math.abs(dx) < 1e-9) {
        if (x0 < b.x0 || x0 > b.x1) return false;
      } else {
        let t1 = (b.x0 - x0) / dx;
        let t2 = (b.x1 - x0) / dx;
        if (t1 > t2) {
          const t = t1;
          t1 = t2;
          t2 = t;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
      }
      if (Math.abs(dz) < 1e-9) {
        if (z0 < b.z0 || z0 > b.z1) return false;
      } else {
        let t1 = (b.z0 - z0) / dz;
        let t2 = (b.z1 - z0) / dz;
        if (t1 > t2) {
          const t = t1;
          t1 = t2;
          t2 = t;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
      }
      return true;
    };

    const los = (x0: number, z0: number, x1: number, z1: number) => {
      for (let i = 0; i < LOSW.length; i++) {
        const c = LOSW[i];
        if (c.on && segBox(x0, z0, x1, z1, c)) return false;
      }
      return true;
    };

    const nearNode = (x: number, z: number) => {
      let b = 0;
      let bd = 1e9;
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        let d = (n[0] - x) * (n[0] - x) + (n[1] - z) * (n[1] - z);
        if (!los(x, z, n[0], n[1])) d += 100;
        if (d < bd) {
          bd = d;
          b = i;
        }
      }
      return b;
    };

    const findPath = (x0: number, z0: number, x1: number, z1: number): [number, number][] => {
      if (los(x0, z0, x1, z1)) return [[x1, z1]];
      const a = nearNode(x0, z0);
      const b = nearNode(x1, z1);
      if (a === b) return [[NODES[a][0], NODES[a][1]], [x1, z1]];
      const prev = new Array(NODES.length).fill(-2);
      prev[a] = -1;
      const q = [a];
      while (q.length) {
        const c = q.shift()!;
        if (c === b) break;
        for (const n of ADJ[c]) {
          if (prev[n] === -2) {
            prev[n] = c;
            q.push(n);
          }
        }
      }
      if (prev[b] === -2) return [[x1, z1]];
      const path: [number, number][] = [];
      let c = b;
      while (c !== -1) {
        path.unshift([NODES[c][0], NODES[c][1]]);
        c = prev[c];
      }
      path.push([x1, z1]);
      return path;
    };

    // Zombies (3 Distinct Archetypes: stalker, brute, crawler)
    const ZG = {
      torso: new THREE.CapsuleGeometry(0.19, 0.42, 4, 10),
      head: new THREE.SphereGeometry(0.14, 14, 12),
      arm: new THREE.CapsuleGeometry(0.055, 0.42, 3, 8),
      leg: new THREE.CapsuleGeometry(0.08, 0.78, 3, 8),
      hand: new THREE.SphereGeometry(0.06, 8, 6),
      eye: new THREE.SphereGeometry(0.022, 6, 6),
      jaw: new THREE.BoxGeometry(0.1, 0.045, 0.08),
    };

    interface ZombieActor {
      g: THREE.Group;
      hips: THREE.Group;
      spine: THREE.Group;
      neck: THREE.Group;
      armP: THREE.Group[];
      legP: THREE.Group[];
      parts: THREE.Mesh[];
      eyes: THREE.Mesh[];
      pos: THREE.Vector3;
      state: string;
      archetype: ZombieArchetype;
      aware: number;
      hp: number;
      maxHp: number;
      dead: boolean;
      gone?: boolean;
      deathT: number;
      yaw: number;
      ph: number;
      path: [number, number][];
      wait: number;
      groanT: number;
      attackCd: number;
      wind: number;
      stun: number;
      lastHeard: THREE.Vector2;
      stay: number;
      lostT: number;
      pathT: number;
      sx: number;
      sz: number;
      stuck: number;
      nudge: number;
      nx: number;
      nz: number;
      spd: number;
      searchT: number;
      hear: number;
    }

    const zs: ZombieActor[] = [];

    const makeZombie = (x: number, zz: number, state: string, archetype?: ZombieArchetype): ZombieActor => {
      const arch: ZombieArchetype =
        archetype || (['stalker', 'brute', 'crawler'] as const)[Math.floor(Math.random() * 3)];
      const g = new THREE.Group();
      const hue = arch === 'brute' ? 0.02 : arch === 'crawler' ? 0.28 : 0.18;
      const skin = new THREE.MeshStandardMaterial({
        map: TX.skin,
        color: new THREE.Color().setHSL(hue, 0.25, arch === 'brute' ? 0.5 : 0.65),
        roughness: 0.82,
      });
      const shirt = new THREE.MeshStandardMaterial({
        map: TX.cloth,
        color: new THREE.Color().setHSL(rnd(0, 1), 0.25, rnd(0.22, 0.38)),
        roughness: 1,
      });
      const pants = new THREE.MeshStandardMaterial({
        map: TX.cloth,
        color: new THREE.Color().setHSL(0.6, 0.2, 0.2),
        roughness: 1,
      });
      const eyeColor = arch === 'brute' ? 0xff2244 : arch === 'crawler' ? 0xa3e635 : 0xffe08a;
      const eyeM = new THREE.MeshBasicMaterial({ color: eyeColor });

      const hips = new THREE.Group();
      hips.position.y = arch === 'crawler' ? 0.62 : 0.95;
      g.add(hips);
      const spine = new THREE.Group();
      spine.position.y = 0.08;
      hips.add(spine);

      const zparts: THREE.Mesh[] = [];
      const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, part: string) => {
        const m = new THREE.Mesh(geo, mat);
        m.userData.part = part;
        m.castShadow = !isSoftwareGl;
        zparts.push(m);
        return m;
      };

      const torso = mk(ZG.torso, shirt, 'body');
      torso.position.y = 0.3;
      torso.scale.set(arch === 'brute' ? 1.3 : 1, 1, arch === 'brute' ? 0.95 : 0.75);
      spine.add(torso);

      const neck = new THREE.Group();
      neck.position.y = 0.66;
      spine.add(neck);

      const head = mk(ZG.head, skin, 'head');
      head.position.set(0, 0.12, 0.02);
      head.scale.set(0.95, 1.1, 1);
      neck.add(head);

      const jaw = mk(ZG.jaw, skin, 'head');
      jaw.position.set(0, 0, 0.1);
      neck.add(jaw);

      const eyes = [-1, 1].map((s) => {
        const e = new THREE.Mesh(ZG.eye, eyeM);
        e.position.set(s * 0.05, 0.15, 0.125);
        neck.add(e);
        return e;
      });

      const armP = [-1, 1].map((s) => {
        const p = new THREE.Group();
        p.position.set(s * (arch === 'brute' ? 0.32 : 0.26), 0.55, 0);
        spine.add(p);
        const a = mk(ZG.arm, shirt, 'limb');
        a.position.y = -0.27;
        p.add(a);
        const h = mk(ZG.hand, skin, 'limb');
        h.position.y = -0.56;
        p.add(h);
        return p;
      });

      const legP = [-1, 1].map((s) => {
        const p = new THREE.Group();
        p.position.set(s * 0.1, 0, 0);
        hips.add(p);
        const l = mk(ZG.leg, pants, 'limb');
        l.position.y = -0.47;
        p.add(l);
        return p;
      });

      const scaleVal = arch === 'brute' ? 1.15 : arch === 'crawler' ? 0.88 : rnd(0.95, 1.04);
      g.scale.setScalar(scaleVal);
      g.position.set(x, 0, zz);
      scene.add(g);

      const maxHp = arch === 'brute' ? 175 : arch === 'crawler' ? 75 : 100;
      const z: ZombieActor = {
        g,
        hips,
        spine,
        neck,
        armP,
        legP,
        parts: zparts,
        eyes,
        pos: g.position,
        state,
        archetype: arch,
        aware: 0,
        hp: maxHp,
        maxHp,
        dead: false,
        deathT: 0,
        yaw: Math.PI,
        ph: rnd(0, 6),
        path: [],
        wait: 0,
        groanT: rnd(2, 6),
        attackCd: 0,
        wind: 0,
        stun: 0,
        lastHeard: new THREE.Vector2(),
        stay: 0,
        lostT: 0,
        pathT: 0,
        sx: 0,
        sz: 0,
        stuck: 0,
        nudge: 0,
        nx: 0,
        nz: 0,
        spd: 0,
        searchT: 0,
        hear: 0,
      };
      zparts.forEach((p) => {
        p.userData.z = z;
      });
      zs.push(z);
      return z;
    };

    // Door & Raid Helpers
    let doorAnim = 0;
    let doorBroken = false;

    const updateDoorPlanksVisual = () => {
      barricadePlanks.forEach((p, idx) => {
        p.visible = !doorBroken && S.doorHp > idx * 30;
      });
    };

    const breakDoor = () => {
      if (doorBroken) return;
      doorBroken = true;
      S.doorHp = 0;
      doorAnim = 0;
      doorCol.on = false;
      updateDoorPlanksVisual();
      sfx.bang();
      vib([60, 40, 90]);
      P.shake = Math.max(P.shake, 0.55);
      zs.forEach((z) => {
        if (z.state === 'outside' && !z.dead) {
          z.state = 'enter';
          z.path = [
            [5.5 + rnd(-0.4, 0.4), 12.5],
            [5.5, 11],
          ];
        }
      });
      toast('Дверь выломали! Прячься или ставь капкан!', 2800);
      syncReactSnapshot();
    };

    const restoreDoor = (hpVal = 100) => {
      doorBroken = false;
      S.doorHp = hpVal;
      doorCol.on = true;
      doorPivot.rotation.y = 0;
      doorPivot.position.y = 0;
      doorPivot.rotation.z = 0;
      updateDoorPlanksVisual();
      syncReactSnapshot();
    };

    const planRaids = () => {
      const d = S.day;
      const n = d === 1 ? (S.diff === 'easy' ? 0 : 1) : 1 + Math.floor(Math.random() * D.raids);
      const arr: number[] = [];
      for (let i = 0; i < n; i++) {
        arr.push((d - 1) * 24 + rnd(d === 1 ? 8 : 3, 22.5));
      }
      arr.sort((a, b) => a - b);
      S.raidPlan = arr;
    };

    const startRaid = () => {
      const n =
        clamp(1 + Math.floor(Math.random() * (1 + S.day / 2)), 1, D.zmax) +
        (S.diff === 'ultra' && S.day >= 4 ? 1 : 0);
      const barBonus = S.doorHp > 50 ? 4.5 : 0;
      S.raid = { state: 'approach', timer: 8.5 + barBonus, stay: rnd(55, 95), n };
      const archetypes: ZombieArchetype[] = ['stalker', 'brute', 'crawler'];
      for (let i = 0; i < n; i++) {
        const z = makeZombie(5.5 + rnd(-2, 2), rnd(24, 30) + i * 2.4, 'outside', archetypes[i % 3]);
        z.sx = rnd(-1.1, 1.1);
        z.sz = i * 0.7;
      }
      toast('Снаружи шаркают шаги… Гаси свет и замри!', 3500);
      sfx.groan(0, 0.65);
      vib([30, 60, 30]);
    };

    // Checkpoint Save Builder
    const createCheckpointPayload = (title: string): CheckpointData => ({
      slotId: 'auto',
      title,
      savedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      day: S.day,
      clock: formatGameClock(S.t),
      t: S.t,
      diff: S.diff,
      hp: S.hp,
      food: S.food,
      water: S.water,
      battery: S.battery,
      doorHp: S.doorHp,
      inv: { ...S.inv },
      weapons: { ...S.weapons },
      ammo: {
        deagle: { ...S.ammo.deagle },
        shotgun: { ...S.ammo.shotgun },
        sniper: { ...S.ammo.sniper },
      },
      curWeapon: S.cur,
      kitTaken: S.kitTaken,
      doneInteractables: IA.filter((a) => a.done).map((a) => a.id),
      kills: S.kills,
      trips: S.trips,
      hides: S.hides,
      px: P.x,
      pz: P.z,
    });

    const saveAtKeyPoint = (slotId: string, title: string, notify = true) => {
      const payload = createCheckpointPayload(title);
      saveCheckpointToSlot(slotId, payload);
      refreshSaveSlots();
      if (notify) {
        toast(`Ключевая точка сохранена: ${title}`, 2800);
      }
    };

    const checkRaidEnd = () => {
      if (!S.raid) return;
      if (!zs.some((z) => !z.dead && !z.gone)) {
        S.raid = null;
        restoreDoor(75);
        saveAtKeyPoint('auto', `День ${S.day} · Рейд пережит`);
      }
    };

    // Interactables in the 3D House
    interface Interactable {
      id: string;
      x: number;
      z: number;
      r: number;
      done: boolean;
      prop?: THREE.Object3D;
      label: () => string;
      act: (a: Interactable) => void;
    }
    const IA: Interactable[] = [];
    const addIA = (o: Omit<Interactable, 'done'> & { done?: boolean }) => {
      const a: Interactable = { done: false, ...o };
      IA.push(a);
      return a;
    };

    const isHidden = () => Boolean(S.hidden) && P.hideT > 0.55;

    const equip = (k: WeaponKey | null) => {
      S.cur = k;
      vmSet(k);
      rel.on = false;
      S.aim = false;
      vm.swap = 1;
      syncReactSnapshot();
    };

    const enterHide = (sp: (typeof SPOTS)['wardrobe']) => {
      if (S.hidden) return;
      if (
        zs.some(
          (z) =>
            !z.dead &&
            z.state === 'chase' &&
            z.pos.z < 12.2 &&
            los(z.pos.x, z.pos.z, P.x, P.z) &&
            Math.hypot(z.pos.x - P.x, z.pos.z - P.z) < 14
        )
      ) {
        toast('Монстр видит тебя! Прятаться поздно!', 2200);
        return;
      }
      S.hidden = sp;
      S.aim = false;
      setIsHiddenState(true);
      P.hideT = Math.max(P.hideT, 0.001);
      P.panic = Math.max(P.panic, 0.15);
      S.hides++;
      P.burst = Math.max(P.burst, sp.id === 'wardrobe' ? 22 : 14);
      sfx.click();
      if (sp.id === 'wardrobe' && !S.kitTaken) {
        window.setTimeout(() => {
          if (S.hidden !== sp) return;
          S.kitTaken = true;
          S.weapons.shotgun = true;
          S.ammo.shotgun = { mag: 6, res: 9 };
          S.inv.batteries += 1;
          S.inv.scrap += 2;
          if (!S.cur) equip('shotgun');
          sfx.pickup();
          toast('В шкафу найден дробовик, патроны, батарейка и металлолом!', 3600);
          saveAtKeyPoint('auto', `День ${S.day} · Арсенал в шкафу найден`, false);
        }, 650);
      }
    };

    const exitHide = (forced = false) => {
      const sp = S.hidden;
      if (!sp) return;
      P.x = sp.exit[0];
      P.z = sp.exit[1];
      P.y = 0;
      S.hidden = null;
      setIsHiddenState(false);
      P.vy = 0;
      if (!forced) P.burst = Math.max(P.burst, 14);
    };

    const giveLoot = (
      a: Interactable,
      g: {
        food?: number;
        water?: number;
        batteries?: number;
        scrap?: number;
        wood?: number;
        wires?: number;
        cloth?: number;
        powder?: number;
        weapon?: WeaponKey;
        ammo?: Partial<Record<WeaponKey, number>>;
      }
    ) => {
      const txt: string[] = [];
      if (g.food) {
        S.inv.food += g.food;
        txt.push(`консервы +${g.food}`);
      }
      if (g.water) {
        S.inv.water += g.water;
        txt.push(`вода +${g.water}`);
      }
      if (g.batteries) {
        S.inv.batteries += g.batteries;
        txt.push(`батарейки +${g.batteries}`);
      }
      if (g.scrap) {
        S.inv.scrap += g.scrap;
        txt.push(`металлолом +${g.scrap}`);
      }
      if (g.wood) {
        S.inv.wood += g.wood;
        txt.push(`доски +${g.wood}`);
      }
      if (g.wires) {
        S.inv.wires += g.wires;
        txt.push(`провода +${g.wires}`);
      }
      if (g.cloth) {
        S.inv.cloth += g.cloth;
        txt.push(`тряпки +${g.cloth}`);
      }
      if (g.powder) {
        S.inv.powder += g.powder;
        txt.push(`порох +${g.powder}`);
      }
      if (g.weapon) {
        S.weapons[g.weapon] = true;
        if (!S.cur) equip(g.weapon);
        txt.push(WEAPONS[g.weapon].name);
      }
      if (g.ammo) {
        for (const k of Object.keys(g.ammo) as WeaponKey[]) {
          const count = g.ammo[k] || 0;
          const A = S.ammo[k];
          if (S.weapons[k] && A.mag === 0 && k === g.weapon) {
            A.mag = Math.min(WEAPONS[k].mag, count);
            A.res += count - A.mag;
          } else {
            A.res += count;
          }
          txt.push(`патроны +${count}`);
        }
      }
      a.done = true;
      if (a.prop) a.prop.visible = false;
      sfx.pickup();
      P.burst = Math.max(P.burst, 12);
      toast(`Найдено: ${txt.join(', ')}`);
      syncReactSnapshot();
    };

    addIA({
      id: 'wardrobe',
      x: 1.45,
      z: 1.6,
      r: 1.05,
      label: () => (S.hidden ? 'Выйти из шкафа' : 'Спрятаться в шкаф'),
      act: () => enterHide(SPOTS.wardrobe),
    });
    addIA({
      id: 'sofa',
      x: 8.2,
      z: 10.65,
      r: 1.05,
      label: () => (S.hidden ? 'Вылезти' : 'Залезть под диван'),
      act: () => enterHide(SPOTS.sofa),
    });
    addIA({
      id: 'checkpoint_desk',
      x: 4.9,
      z: 4.1,
      r: 1.15,
      label: () => 'Сохранить прогресс в дневник (Ключевая точка)',
      act: () => {
        sfx.pickup();
        saveAtKeyPoint('slot1', `День ${S.day} (${formatGameClock(S.t)}) · Дневник в спальне`);
      },
    });
    addIA({
      id: 'deagle',
      x: 2.95,
      z: 1.15,
      r: 1.05,
      prop: gunProp.deagle,
      label: () => 'Взять Desert Eagle и патроны',
      act: (a) => giveLoot(a, { weapon: 'deagle', ammo: { deagle: 21 }, powder: 1 }),
    });
    addIA({
      id: 'sniper',
      x: 1.45,
      z: 7.0,
      r: 1.15,
      prop: caseG,
      label: () => 'Открыть оружейный кейс',
      act: (a) => giveLoot(a, { weapon: 'sniper', ammo: { sniper: 10 }, scrap: 2 }),
    });
    addIA({
      id: 'toolbox',
      x: 8.0,
      z: 9.4,
      r: 1.15,
      prop: loot.toolbox,
      label: () => 'Забрать ящик с инструментами (для крафта)',
      act: (a) => giveLoot(a, { scrap: 3, wires: 2, wood: 2, batteries: 1 }),
    });
    addIA({
      id: 'fridge',
      x: 9.7,
      z: 1.25,
      r: 1.05,
      label: () => 'Осмотреть холодильник',
      act: (a) => giveLoot(a, { food: 1, water: 1, cloth: 1 }),
    });
    addIA({
      id: 'pantry',
      x: 10.0,
      z: 4.7,
      r: 1.15,
      prop: loot.pantry,
      label: () => 'Обыскать шкаф с припасами',
      act: (a) => giveLoot(a, { food: 2, wood: 2, scrap: 1 }),
    });
    addIA({
      id: 'table',
      x: 7.9,
      z: 3.6,
      r: 1.2,
      prop: loot.table,
      label: () => 'Взять консервы и батарейку со стола',
      act: (a) => giveLoot(a, { food: 2, batteries: 1 }),
    });
    addIA({
      id: 'counter',
      x: 7.0,
      z: 1.35,
      r: 1.05,
      prop: loot.counter,
      label: () => 'Взять воду и детали',
      act: (a) => giveLoot(a, { water: 3, wires: 1 }),
    });
    addIA({
      id: 'dresser',
      x: 4.6,
      z: 4.6,
      r: 1.05,
      prop: loot.dresser,
      label: () => 'Обыскать комод',
      act: (a) => giveLoot(a, { water: 1, batteries: 1, cloth: 2, ammo: { deagle: 7 } }),
    });
    addIA({
      id: 'shelf',
      x: 9.9,
      z: 7.2,
      r: 1.05,
      prop: loot.shelf,
      label: () => 'Обыскать полку',
      act: (a) => giveLoot(a, { powder: 2, scrap: 1, ammo: { shotgun: 6, deagle: 7 } }),
    });
    addIA({
      id: 'door',
      x: 5.5,
      z: 11.2,
      r: 1.4,
      label: () => 'Выйти на вылазку в магазин (08:00–17:00)',
      act: () => tripToStore(),
    });

    let curIA: Interactable | null = null;
    let lastIaLabel: string | null = null;

    const tripToStore = () => {
      if (S.raid) {
        toast('Снаружи зомби! Дверь открывать нельзя!', 2000);
        return;
      }
      if (doorBroken) {
        toast('Сначала почини дверь баррикадой!', 2000);
        return;
      }
      const h = (6 + S.t) % 24;
      if (h < 8 || h > 17) {
        toast('Выходить можно только днём с 08:00 до 17:00', 2600);
        return;
      }
      if (S.t < S.tripReady) {
        toast('Магазин недавно обыскан. Подожди несколько часов.', 2600);
        return;
      }
      if (S.hidden) return;
      S.tripReady = S.t + 9;
      S.trips++;
      if (darkElRef.current) darkElRef.current.style.opacity = '1';
      toast('Вылазка в заброшенный магазин…', 2000);
      inp.fire = false;

      window.setTimeout(() => {
        const f = Math.max(1, Math.round(rnd(1, 2) * D.loot));
        const w = Math.max(1, Math.round(rnd(1, 2) * D.loot));
        const b = Math.random() < 0.75 ? 1 : 0;
        const sc = Math.round(rnd(1, 3));
        const wr = Math.round(rnd(1, 2));
        S.t += 3;
        S.food = Math.max(0, S.food - (D.hunger / 24) * 3 * 0.8);
        S.water = Math.max(0, S.water - (D.thirst / 24) * 3 * 0.8);
        S.inv.food += f;
        S.inv.water += w;
        S.inv.batteries += b;
        S.inv.scrap += sc;
        S.inv.wires += wr;
        S.inv.wood += 1;

        let msg = `Принёс: еда +${f}, вода +${w}, батарейки +${b}, лом +${sc}`;
        if (Math.random() < D.trip) {
          const dm = Math.round(rnd(10, 24) * (S.diff === 'ultra' ? 1.4 : 1));
          S.hp = Math.max(1, S.hp - dm);
          msg += `. Напал заражённый: -${dm} HP`;
          vib([80, 40, 80]);
        }
        P.x = 5.5;
        P.z = 10.2;
        if (darkElRef.current) darkElRef.current.style.opacity = '0';
        saveAtKeyPoint('auto', `День ${S.day} · Возвращение из магазина`, false);
        toast(msg, 4200);
        syncReactSnapshot();
      }, 1250);
    };

    // Player Damage & Death
    const die = () => {
      S.mode = 'gameover';
      setScreenMode('gameover');
      setEndData({
        win: false,
        day: S.day,
        clock: formatGameClock(S.t),
        kills: S.kills,
        hides: S.hides,
        trips: S.trips,
      });
    };

    const hurtPlayer = (n: number) => {
      if (modRef.current.god || S.mode !== 'playing') return;
      S.hp -= n;
      S.hitstop = 0.05;
      if (dmgElRef.current) {
        dmgElRef.current.style.opacity = '1';
        window.setTimeout(() => {
          if (dmgElRef.current) dmgElRef.current.style.opacity = '0';
        }, 180);
      }
      P.shake = Math.max(P.shake, 0.65);
      sfx.hurt();
      vib([80, 30, 60]);
      P.burst = Math.max(P.burst, 42);
      syncReactSnapshot();
      if (S.hp <= 0) {
        S.hp = 0;
        die();
      }
    };

    // Zombie AI Movement & Perception
    const panTo = (z: ZombieActor) => {
      const dx = z.pos.x - P.x;
      const dz = z.pos.z - P.z;
      const d = Math.hypot(dx, dz) || 1;
      const rx = Math.cos(P.yaw);
      const rz = -Math.sin(P.yaw);
      return (dx * rx + dz * rz) / d;
    };

    const volTo = (z: ZombieActor) => {
      const d = Math.hypot(z.pos.x - P.x, z.pos.z - P.z);
      let v = clamp(1.1 - d / 22, 0.05, 1);
      if (!los(z.pos.x, z.pos.z, P.x, P.z)) v *= 0.55;
      return v;
    };

    const zPatrolPick = (z: ZombieActor) => {
      const n = NODES[Math.floor(Math.random() * NODES.length)];
      z.path = findPath(z.pos.x, z.pos.z, n[0], n[1]);
    };

    const zMove = (z: ZombieActor, tx: number, tz: number, sp: number, dt: number) => {
      let dx = tx - z.pos.x;
      let dz = tz - z.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.001) return 0;
      dx /= d;
      dz /= d;
      if (z.nudge > 0) {
        z.nudge -= dt;
        dx += z.nx;
        dz += z.nz;
        const l = Math.hypot(dx, dz) || 1;
        dx /= l;
        dz /= l;
      }
      const bx = z.pos.x;
      const bz = z.pos.z;
      const step = Math.min(sp * dt, d);
      if (z.pos.z > 12.3 || z.pos.z < -0.5) {
        z.pos.x += dx * step;
        z.pos.z += dz * step;
      } else {
        moveCol(z.pos, dx * step, dz * step, 0.26);
      }
      const moved = Math.hypot(z.pos.x - bx, z.pos.z - bz);
      if (moved < step * 0.3) {
        z.stuck += dt;
        if (z.stuck > 0.5) {
          z.stuck = 0;
          z.nudge = 0.6;
          const s = Math.random() < 0.5 ? 1 : -1;
          z.nx = -dz * s;
          z.nz = dx * s;
        }
      } else {
        z.stuck = 0;
      }
      const ty = Math.atan2(dx, dz);
      z.yaw += angDiff(ty, z.yaw) * Math.min(1, dt * 7);
      z.spd = moved / (dt || 0.016);
      return moved;
    };

    const zFollow = (z: ZombieActor, sp: number, dt: number) => {
      while (z.path.length && Math.hypot(z.path[0][0] - z.pos.x, z.path[0][1] - z.pos.z) < 0.4) {
        z.path.shift();
      }
      if (!z.path.length) return false;
      zMove(z, z.path[0][0], z.path[0][1], sp, dt);
      return true;
    };

    const hurtZ = (z: ZombieActor, dmg: number, head: boolean, pt: THREE.Vector3) => {
      if (z.dead) return;
      z.hp -= dmg;
      z.aware = 1;
      z.lastHeard.set(P.x, P.z);
      if (z.state !== 'outside' && z.state !== 'leave') z.state = 'chase';
      z.stun = dmg > 40 ? 0.5 : 0.22;
      z.lostT = 0;
      S.hitstop = 0.035;
      spawnP(pt, 9, bloodM, 2.3);
      if (hitElRef.current) {
        hitElRef.current.style.opacity = '1';
        window.setTimeout(() => {
          if (hitElRef.current) hitElRef.current.style.opacity = '0';
        }, 120);
      }
      sfx.hit();
      vib(12);
      if (z.hp <= 0) {
        z.dead = true;
        z.deathT = 0;
        S.kills++;
        z.eyes.forEach((e) => {
          e.visible = false;
        });
        toast(head ? 'ХЕДШОТ!' : 'Монстр уничтожен', 1300);
        syncReactSnapshot();
        checkRaidEnd();
      }
    };

    const caughtByZombie = (z: ZombieActor) => {
      // Check if player has a crafted Defense Shiv!
      if (S.inv.shivs > 0) {
        S.inv.shivs -= 1;
        exitHide(true);
        hurtZ(z, 65, false, new THREE.Vector3(z.pos.x, 1.1, z.pos.z));
        z.stun = 3.5;
        sfx.trapSnap(0);
        toast('Заточка спасла тебе жизнь! Монстр оглушён на 3.5 сек!', 3000);
        syncReactSnapshot();
        return;
      }
      triggerJumpscare('caught', 'ТЕБЯ НАШЛИ В УКРЫТИИ!');
      hurtPlayer(D.dmg * 1.35);
      exitHide(true);
      z.state = 'chase';
      z.attackCd = 0.9;
      z.aware = 1;
    };

    const animZ = (z: ZombieActor, dt: number) => {
      const sp = z.spd || 0;
      const sn = clamp(sp / 3, 0, 1.2);
      z.ph += dt * (1.5 + sp * 2.2);
      const s = Math.sin(z.ph);
      z.legP[0].rotation.x = s * 0.7 * sn;
      z.legP[1].rotation.x = -s * 0.7 * sn;
      const raise = z.state === 'chase' ? -1.5 : -1.15;
      const sw = z.wind > 0 ? -1.9 + Math.sin(z.wind * 14) * 0.5 : raise;
      z.armP[0].rotation.x = sw + Math.sin(z.ph * 0.5) * 0.08;
      z.armP[1].rotation.x = sw - Math.sin(z.ph * 0.5) * 0.08;
      z.armP[0].rotation.z = 0.1;
      z.armP[1].rotation.z = -0.1;
      const baseCrawl = z.archetype === 'crawler' ? 0.55 : 0.12;
      z.spine.rotation.x = baseCrawl + 0.18 * sn + (z.wind > 0 ? 0.3 : 0);
      z.spine.rotation.z = Math.sin(z.ph) * 0.05 * sn;
      z.neck.rotation.z = Math.sin(z.ph * 0.5) * (z.archetype === 'stalker' ? 0.25 : 0.12);
      z.neck.rotation.x = 0.15;
      z.g.rotation.y = z.yaw;
      const baseHips = z.archetype === 'crawler' ? 0.62 : 0.95;
      z.hips.position.y = baseHips + Math.abs(s) * 0.03 * sn;
      z.eyes.forEach((e) => {
        e.scale.setScalar(0.85 + Math.sin(performance.now() * 0.005 + z.ph) * 0.22);
      });
    };

    const zUpdate = (z: ZombieActor, dt: number) => {
      if (z.dead) {
        z.deathT += dt;
        const k = ease(Math.min(1, z.deathT / 0.7));
        z.g.rotation.x = (-Math.PI / 2) * k;
        z.g.position.y = 0.12 * k;
        if (z.deathT > 45) {
          scene.remove(z.g);
          z.gone = true;
        }
        return;
      }
      z.groanT -= dt;
      z.attackCd -= dt;
      z.stun -= dt;
      z.wind = Math.max(0, z.wind - dt);

      // Check Bear Trap collisions
      for (let ti = activeTraps.length - 1; ti >= 0; ti--) {
        const tr = activeTraps[ti];
        if (Math.hypot(z.pos.x - tr.x, z.pos.z - tr.z) < 0.58) {
          scene.remove(tr.mesh);
          activeTraps.splice(ti, 1);
          sfx.trapSnap(panTo(z));
          hurtZ(z, 85, false, new THREE.Vector3(z.pos.x, 0.5, z.pos.z));
          z.stun = 4.0;
          toast('Капкан сработал! Зомби обездвижен!', 2500);
          break;
        }
      }

      if (z.stun > 0) {
        z.spd = 0;
        animZ(z, dt);
        return;
      }

      const dx = P.x - z.pos.x;
      const dz = P.z - z.pos.z;
      const dist = Math.hypot(dx, dz);
      const hid = isHidden();
      const inHouse = z.pos.z < 12.2 && z.pos.z > -0.3 && z.state !== 'outside';

      const hearArchetypeMul = z.archetype === 'stalker' ? 1.3 : z.archetype === 'brute' ? 0.85 : 1.05;
      const speedArchetypeMul = z.archetype === 'crawler' ? 1.22 : z.archetype === 'brute' ? 0.86 : 1.0;

      // Check active Noise Decoys first!
      let luredByDecoy = false;
      if (activeDecoys.length > 0 && inHouse) {
        const dec = activeDecoys[0];
        z.aware = 1.0;
        z.lastHeard.set(dec.x, dec.z);
        luredByDecoy = true;
        if (z.state !== 'investigate') {
          z.state = 'investigate';
          z.path = findPath(z.pos.x, z.pos.z, dec.x, dec.z);
        }
      }

      let perceived = -99;
      let sees = false;
      if (!modRef.current.blind && inHouse && !luredByDecoy) {
        const open = los(z.pos.x, z.pos.z, P.x, P.z);
        const effNoise = modRef.current.silent ? 0 : P.noise;
        perceived = effNoise * D.hear * hearArchetypeMul * (hid ? 0.7 : 1) - dist * 2 - (open ? 0 : 16);
        // Flashlight beam attracts attention if pointed directly at zombie at close range
        if (!hid && open && S.torch && dist < 8.5) {
          perceived += 18;
        }
        if (!hid && open && dist < (P.crouchT > 0.5 ? 5.5 : 9.5)) {
          const fx = Math.sin(z.yaw);
          const fz = Math.cos(z.yaw);
          const dot = (dx * fx + dz * fz) / (dist || 1);
          if (dot > 0.15 || dist < 2.1) sees = true;
        }
      }

      if (sees) {
        z.aware += dt * (0.5 + (1 - dist / 10) * 1.5) * D.aware;
      } else if (perceived > 8) {
        z.aware += ((dt * (perceived - 8)) / 30) * D.aware;
      } else if (!luredByDecoy) {
        z.aware = Math.max(0, z.aware - dt * 0.12);
      }
      z.aware = Math.min(z.aware, 1.2);
      if ((sees || perceived > 8) && !luredByDecoy) {
        z.lastHeard.set(P.x, P.z);
      }

      const st = z.state;
      if (st === 'outside') {
        const tx = 5.5 + (z.sx || 0);
        const tz = 13.3 + (z.sz || 0);
        if (Math.hypot(tx - z.pos.x, tz - z.pos.z) > 0.3) {
          zMove(z, tx, tz, 1.7, dt);
        } else {
          z.spd = 0;
          z.yaw += angDiff(Math.PI, z.yaw) * Math.min(1, dt * 4);
        }
      } else if (st === 'enter') {
        if (!zFollow(z, 1.5 * speedArchetypeMul, dt)) {
          z.state = 'patrol';
          z.wait = rnd(0.5, 1.5);
        }
      } else if (st === 'leave') {
        if (!zFollow(z, 1.4, dt)) {
          zMove(z, 5.5, 26, 1.5, dt);
          if (z.pos.z > 22) {
            scene.remove(z.g);
            z.gone = true;
          }
        }
      } else {
        if (st !== 'chase' && !luredByDecoy) {
          if (z.aware >= 1) {
            if (!hid) {
              z.state = 'chase';
              z.lostT = 0;
              sfx.groan(panTo(z), volTo(z) * 1.2, z.archetype === 'brute' ? 0.75 : 1);
            } else if (dist < 2.5 && st === 'search') {
              caughtByZombie(z);
              return;
            } else if (st !== 'search' && dist < 14) {
              z.state = 'investigate';
              z.path = findPath(z.pos.x, z.pos.z, z.lastHeard.x, z.lastHeard.y);
            }
          } else if (z.aware > 0.35 && st !== 'investigate' && st !== 'search') {
            z.state = 'investigate';
            z.path = findPath(z.pos.x, z.pos.z, z.lastHeard.x, z.lastHeard.y);
            z.wait = 0;
          }
        }

        const s2 = z.state;
        if (s2 === 'patrol') {
          z.stay += dt;
          if (z.wait > 0) {
            z.wait -= dt;
            z.spd = 0;
          } else if (!zFollow(z, 1.0 * speedArchetypeMul, dt)) {
            z.wait = rnd(1.5, 3.5);
            zPatrolPick(z);
          }
          if (S.raid && z.stay > S.raid.stay && z.aware < 0.2) {
            z.state = 'leave';
            z.path = findPath(z.pos.x, z.pos.z, 5.5, 11);
            z.path.push([5.5, 12.8]);
          }
        } else if (s2 === 'investigate') {
          if (!zFollow(z, 1.35 * speedArchetypeMul, dt)) {
            z.spd = 0;
            z.wait += dt;
            const sp = S.hidden;
            if (hid && sp && !luredByDecoy && Math.hypot(z.lastHeard.x - sp.x, z.lastHeard.y - sp.z) < 3.2) {
              z.state = 'search';
              z.searchT = rnd(6.5, 11);
              z.path = findPath(z.pos.x, z.pos.z, sp.stand[0], sp.stand[1]);
            } else if (z.wait > 2.5) {
              z.wait = 0;
              z.state = 'patrol';
              z.aware = Math.min(z.aware, 0.3);
              zPatrolPick(z);
            }
          }
        } else if (s2 === 'search') {
          const sp = S.hidden;
          if (!sp || !hid) {
            z.state = 'patrol';
          } else {
            if (!zFollow(z, 1.1, dt)) {
              z.spd = 0;
              const ty = Math.atan2(sp.cam[0] - z.pos.x, sp.cam[2] - z.pos.z);
              z.yaw += angDiff(ty, z.yaw) * Math.min(1, dt * 3);
              z.searchT -= dt;
              if (dist < 2.2 && perceived > 12) z.aware += dt * 0.25;
              if (z.aware >= 1) {
                caughtByZombie(z);
                return;
              }
              if (z.searchT <= 0) {
                z.state = 'patrol';
                z.aware = 0.1;
                z.wait = 1;
                zPatrolPick(z);
              }
            }
          }
        } else if (s2 === 'chase') {
          if (hid && !sees) {
            z.state = 'search';
            z.searchT = rnd(6.5, 11);
            const sp = S.hidden!;
            z.path = findPath(z.pos.x, z.pos.z, sp.stand[0], sp.stand[1]);
          } else {
            if (sees || perceived > 8) z.lostT = 0;
            else z.lostT += dt;
            if (z.lostT > 5) {
              z.state = 'investigate';
              z.path = findPath(z.pos.x, z.pos.z, z.lastHeard.x, z.lastHeard.y);
              z.wait = 0;
              z.aware = 0.6;
            } else {
              const tx = z.lastHeard.x;
              const tz = z.lastHeard.y;
              if (los(z.pos.x, z.pos.z, tx, tz)) {
                zMove(z, tx, tz, D.zspeed * speedArchetypeMul, dt);
              } else {
                z.pathT -= dt;
                if (z.pathT <= 0 || !z.path.length) {
                  z.path = findPath(z.pos.x, z.pos.z, tx, tz);
                  z.pathT = 0.6;
                }
                zFollow(z, D.zspeed * speedArchetypeMul, dt);
              }
              if (dist < 1.2 && !hid) {
                if (z.wind <= 0 && z.attackCd <= 0) {
                  z.wind = z.archetype === 'brute' ? 0.58 : 0.42;
                  z.attackCd = 1.3;
                }
              }
              if (z.wind > 0 && z.wind < 0.05 + dt) {
                if (dist < 1.65 && !isHidden()) {
                  if (S.inv.shivs > 0) {
                    S.inv.shivs -= 1;
                    hurtZ(z, 65, false, new THREE.Vector3(z.pos.x, 1.1, z.pos.z));
                    z.stun = 3.0;
                    sfx.trapSnap(0);
                    toast('Контратака заточкой! Зомби оглушён!', 2400);
                    syncReactSnapshot();
                  } else {
                    hurtPlayer(D.dmg * (z.archetype === 'brute' ? 1.25 : 1));
                  }
                }
              }
            }
          }
        }
        if (z.groanT <= 0 && st !== 'outside') {
          sfx.groan(panTo(z), volTo(z), z.archetype === 'brute' ? 0.72 : z.archetype === 'crawler' ? 1.25 : 1);
          z.groanT = st === 'chase' ? rnd(2.5, 4) : rnd(6, 12);
        }
      }

      // Brute footsteps shake camera when close
      if (z.archetype === 'brute' && z.spd > 0.5 && dist < 8) {
        P.shake = Math.max(P.shake, (1 - dist / 8) * 0.08);
      }

      for (const o of zs) {
        if (o === z || o.dead || o.gone) continue;
        const ex = z.pos.x - o.pos.x;
        const ez = z.pos.z - o.pos.z;
        const ed = Math.hypot(ex, ez);
        if (ed < 0.55 && ed > 0.001) {
          z.pos.x += (ex / ed) * 0.5 * dt;
          z.pos.z += (ez / ed) * 0.5 * dt;
        }
      }
      z.hear = perceived;
      animZ(z, dt);
    };

    // Weapons & Shooting
    const rel = { on: false, t: 0 };
    let fireCd = 0;
    const rc = new THREE.Raycaster();
    rc.far = 70;

    const startReload = () => {
      if (S.mode !== 'playing' || S.hidden || !S.cur || rel.on) return;
      const W = WEAPONS[S.cur];
      const A = S.ammo[S.cur];
      if (A.mag >= W.mag || (A.res <= 0 && !modRef.current.infAmmo)) return;
      rel.on = true;
      rel.t = W.reload;
      S.aim = false;
      sfx.reload(S.cur);
      P.burst = Math.max(P.burst, 20);
    };

    const flashSprite = () => {
      if (!flashM) return;
      flashM.visible = true;
      flashM.scale.setScalar(rnd(0.7, 1.2));
      flashM.rotation.z = rnd(0, 6);
      window.setTimeout(() => {
        if (flashM) flashM.visible = false;
      }, 45);
    };

    const shoot = () => {
      if (!S.cur) return;
      const W = WEAPONS[S.cur];
      const A = S.ammo[S.cur];
      if (A.mag <= 0 && !modRef.current.infAmmo) {
        sfx.empty();
        if (A.res > 0) startReload();
        return;
      }
      if (!modRef.current.infAmmo) A.mag--;
      fireCd = W.rate;
      P.burst = Math.max(P.burst, W.noise);
      sfx.shot(S.cur);
      vib(S.cur === 'shotgun' ? [40, 20, 30] : 25);
      P.kick += W.recoil * (S.aim ? 0.6 : 1);
      P.shake = Math.max(P.shake, 0.25);
      vm.kick = 1;
      mLight.intensity = 3.2;
      window.setTimeout(() => {
        mLight.intensity = 0;
      }, 50);
      flashSprite();
      if (S.cur === 'shotgun') {
        window.setTimeout(() => {
          sfx.pump();
          vm.pump = 1;
        }, 420);
      }

      const alive: THREE.Object3D[] = [];
      zs.forEach((z) => {
        if (!z.dead && !z.gone) {
          for (const p of z.parts) alive.push(p);
        }
      });
      const targets = alive.concat(HITM);
      const movingK = inp.mag > 0.1 ? 1.5 : 1;
      const sp = W.spread * (S.aim ? 0.35 : 1) * movingK * (P.crouchT > 0.5 ? 0.8 : 1);

      for (let i = 0; i < W.pellets; i++) {
        const d = new THREE.Vector3(rnd(-sp, sp), rnd(-sp, sp), -1).normalize();
        d.applyQuaternion(camera.quaternion);
        rc.set(camera.position, d);
        const hits = rc.intersectObjects(targets, false);
        if (hits.length) {
          const h = hits[0];
          const z = h.object.userData.z as ZombieActor | undefined;
          if (z) {
            const part = h.object.userData.part;
            const mul = part === 'head' ? 2.4 : part === 'limb' ? 0.7 : 1;
            hurtZ(z, W.dmg * mul, part === 'head', h.point);
          } else {
            spawnP(h.point, 3, dustM, 1.2);
          }
        }
      }
      syncReactSnapshot();
      if (A.mag <= 0 && A.res > 0 && !modRef.current.infAmmo) {
        window.setTimeout(() => {
          if (S.cur && S.mode === 'playing') startReload();
        }, 500);
      }
    };

    // Real Microphone Integration
    const MIC = {
      on: false,
      an: null as AnalyserNode | null,
      data: null as Uint8Array<ArrayBuffer> | null,
      stream: null as MediaStream | null,
      lvl: 0,
      floor: 0,
      calib: 0,
      n: 0,
      loud: 0,
      cd: 0,
    };

    const startMic = async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        sfx.init();
        const c = sfx.ctx!;
        const src = c.createMediaStreamSource(st);
        const an = c.createAnalyser();
        an.fftSize = 512;
        src.connect(an);
        MIC.an = an;
        MIC.data = new Uint8Array(new ArrayBuffer(an.fftSize));
        MIC.stream = st;
        MIC.floor = 0;
        MIC.n = 0;
        MIC.calib = 1.5;
        MIC.on = true;
        setMicActive(true);
        toast('Микрофон включён. Твой голос отражается на шкале шума слева!', 3200);
      } catch {
        MIC.on = false;
        setMicActive(false);
        toast('Нет доступа к микрофону браузера', 2400);
      }
    };

    const stopMic = () => {
      MIC.on = false;
      setMicActive(false);
      MIC.lvl = 0;
      try {
        MIC.stream?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    };

    const micUpdate = (dt: number) => {
      if (!MIC.on || !MIC.an || !MIC.data) return;
      MIC.an.getByteTimeDomainData(MIC.data);
      let sum = 0;
      for (let i = 0; i < MIC.data.length; i++) {
        const v = (MIC.data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / MIC.data.length);
      if (MIC.calib > 0) {
        MIC.calib -= dt;
        MIC.floor = (MIC.floor * MIC.n + rms) / (MIC.n + 1);
        MIC.n++;
        MIC.lvl = 0;
        return;
      }
      const target = clamp((rms - MIC.floor * 1.3) * 650, 0, 100);
      MIC.lvl = lerp(MIC.lvl, target, Math.min(1, dt * 18));
      P.burst = Math.max(P.burst, MIC.lvl);
      MIC.cd -= dt;
      if (MIC.lvl > 55) MIC.loud += dt;
      else MIC.loud = Math.max(0, MIC.loud - dt);
      if (MIC.loud > 0.5 && MIC.cd <= 0 && !S.raid && !zs.some((z) => !z.dead && !z.gone)) {
        startRaid();
        const activeRaid = S.raid as { timer: number } | null;
        if (activeRaid) activeRaid.timer = 1.5;
        MIC.cd = 30;
        MIC.loud = 0;
        toast('Монстры услышали твой реальный голос!', 2600);
      }
    };

    // Lighting & Dynamic Horror Atmosphere
    const cDay = new THREE.Color(0x5a6875);
    const cNight = new THREE.Color(0x030508);
    const cTmp = new THREE.Color();

    const daylight = () => {
      const h = (6 + S.t) % 24;
      return clamp((h - 5.5) / 2, 0, 1) * clamp((20 - h) / 2, 0, 1);
    };

    const triggerLightning = () => {
      S.lightningT = 0.45;
      sfx.thunder();
    };

    const applyDynamicHorrorLighting = (f: number, dt: number) => {
      const dyn = cfgRef.current.dynamicLights;
      const nv = modRef.current.nightVision;
      cTmp.copy(cNight).lerp(cDay, f * 0.72);
      scene.background = cTmp;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(cTmp);
        scene.fog.density = lerp(0.058, 0.028, f);
      }

      // Check closest zombie for electromagnetic light flicker
      let closestZ = 99;
      for (const z of zs) {
        if (!z.dead && !z.gone) {
          const d = Math.hypot(z.pos.x - P.x, z.pos.z - P.z);
          if (d < closestZ) closestZ = d;
        }
      }
      const monsterInterference = dyn && closestZ < 9 ? clamp(1 - closestZ / 9, 0, 1) : 0;

      // Lightning storm decay
      let flashBoost = 0;
      if (S.lightningT > 0) {
        S.lightningT = Math.max(0, S.lightningT - dt);
        flashBoost = Math.sin(S.lightningT * 36) > 0 ? S.lightningT * 3.2 : 0;
      }
      lightningLight.intensity = flashBoost;

      hemi.intensity = 0.08 + 0.32 * f + (nv ? 0.55 : 0) + flashBoost * 0.25;
      amb.intensity = 0.03 + 0.07 * f + (nv ? 0.35 : 0);

      const now = performance.now() * 0.003;
      roomLights.forEach((l, i) => {
        let flicker = 1 + Math.sin(now + i * 2.1) * 0.04;
        if (monsterInterference > 0.1) {
          const glitch = Math.sin(now * 19 + i * 5) * Math.cos(now * 31);
          flicker = glitch > 0.2 ? 0.12 : 1.15;
          l.color.setHex(monsterInterference > 0.55 ? 0xffb4a2 : 0xdfe8ff);
        } else {
          l.color.setHex(0xdfe8ff);
        }
        l.intensity = (0.03 + 0.65 * f + (nv ? 0.5 : 0)) * flicker;
      });

      winMats.forEach((m) => {
        const wf = clamp(f + flashBoost * 0.7, 0, 1);
        m.color.setRGB(lerp(0.08, 0.78, wf), lerp(0.11, 0.86, wf), lerp(0.18, 0.96, wf));
      });
      shafts.forEach((s) => {
        s.visible = cfgRef.current.customShaders;
        s.material.uniforms.uOpacity.value = 0.04 + 0.18 * f + flashBoost * 0.22;
      });
      dust.material.opacity = 0.18 + 0.28 * f;
      radioLed.scale.setScalar(0.85 + Math.sin(now * 3) * 0.25);
    };

    // Keyboard & Pointer Input Setup
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (S.mode === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        engineApiRef.current?.startNewGame(selDiff);
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (e.code === 'Escape' && invOpenRef.current) {
          setInvOpen(false);
          sfx.click();
          return;
        }
        if (S.mode === 'playing') {
          S.paused = !S.paused;
          setIsPauseFromMenu(false);
          setScreenMode(S.paused ? 'paused' : 'playing');
          if (S.paused) sfx.suspend();
          else sfx.resume();
        } else if (S.mode === 'paused') {
          S.paused = false;
          setScreenMode('playing');
          sfx.resume();
        }
        return;
      }
      if (S.mode !== 'playing' || S.paused) return;
      sfx.init();
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        setInvOpen((prev) => !prev);
      }
      if (e.code === 'Space') inp.jump = true;
      if (e.code === 'KeyC') {
        inp.crouch = !inp.crouch;
        sfx.click();
      }
      if (e.code === 'KeyE') engineApiRef.current?.performInteract();
      if (e.code === 'KeyR') startReload();
      if (e.code === 'KeyF') engineApiRef.current?.toggleTorch();
      if (e.code === 'KeyV') engineApiRef.current?.rechargeTorch();
      if (e.code === 'KeyT') engineApiRef.current?.useDefenseTool('trap');
      if (e.code === 'KeyZ') engineApiRef.current?.useDefenseTool('decoy');
      if (e.code === 'KeyQ') engineApiRef.current?.swapWeapon();
      if (e.code === 'KeyG') engineApiRef.current?.useConsumable('food');
      if (e.code === 'KeyH') engineApiRef.current?.useConsumable('water');
      if (e.code === 'KeyB') inp.breath = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      if (e.code === 'KeyB') inp.breath = false;
    };

    const onWindowBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
      inp.fire = false;
      inp.breath = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    // Multi-Touch & Mouse Look/Stick
    let stickId: number | null = null;
    let lookId: number | null = null;
    let stickO = { x: 0, y: 0 };
    let lastLook = { x: 0, y: 0 };

    const look = (dx: number, dy: number) => {
      const z = camera.fov / cfgRef.current.fov;
      const s = 0.0042 * cfgRef.current.sens * z;
      P.yaw -= dx * s;
      P.pitch = clamp(P.pitch - dy * s, -1.4, 1.4);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('button, aside, [role="dialog"], input')) return;
      sfx.init();
      if (S.mode !== 'playing' || S.paused) return;
      if (e.clientX < window.innerWidth * 0.42 && stickId === null) {
        stickId = e.pointerId;
        stickO = { x: e.clientX, y: e.clientY };
        if (stickRef.current && knobRef.current) {
          stickRef.current.style.display = 'block';
          stickRef.current.style.left = `${e.clientX}px`;
          stickRef.current.style.top = `${e.clientY}px`;
          knobRef.current.style.transform = 'translate(0,0)';
        }
      } else if (lookId === null) {
        lookId = e.pointerId;
        lastLook = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId === stickId) {
        const R = window.innerHeight * 0.09;
        const dx = e.clientX - stickO.x;
        const dy = e.clientY - stickO.y;
        const l = Math.hypot(dx, dy);
        const k = l > R ? R / l : 1;
        const mx = dx * k;
        const my = dy * k;
        if (knobRef.current) {
          knobRef.current.style.transform = `translate(${mx}px,${my}px)`;
        }
        const m = Math.min(1, l / R);
        inp.mx = (dx / (l || 1)) * (m < 0.12 ? 0 : m);
        inp.mz = (-dy / (l || 1)) * (m < 0.12 ? 0 : m);
        inp.mag = m < 0.12 ? 0 : m;
        inp.run = l > R * 1.15;
      } else if (e.pointerId === lookId) {
        const dx = e.clientX - lastLook.x;
        const dy = e.clientY - lastLook.y;
        lastLook = { x: e.clientX, y: e.clientY };
        look(dx, dy);
      }
    };

    const endPtr = (e: PointerEvent) => {
      if (e.pointerId === stickId) {
        stickId = null;
        inp.mx = inp.mz = inp.mag = 0;
        inp.run = false;
        if (stickRef.current) stickRef.current.style.display = 'none';
      }
      if (e.pointerId === lookId) lookId = null;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endPtr);
    window.addEventListener('pointercancel', endPtr);

    // Update High-Frequency DOM Refs (Left Scale Panel & HUD)
    let hudThrottle = 0;
    let fpsFrames = 0;
    let fpsAccum = 0;
    let currentFps = 120;

    const updateDomHud = (dt: number) => {
      if (toastTimer > 0) {
        toastTimer -= dt;
        if (toastTimer <= 0 && toastElRef.current) {
          toastElRef.current.style.opacity = '0';
        }
      }

      // Smooth HP ghost trailing bar
      S.hpGhost = lerp(S.hpGhost, S.hp, Math.min(1, dt * 3.5));

      hudThrottle -= dt;
      if (hudThrottle > 0) return;
      hudThrottle = 0.06; // ~16Hz DOM text/style updates while canvas runs at 120Hz

      const sr = scaleRefs.current;
      const db = P.noise;
      const zone = P.zone;
      const zoneColor =
        zone === 'green' ? '#34d399' : zone === 'yellow' ? '#fbbf24' : '#f43f5e';
      const zoneLabel =
        zone === 'green' ? 'БЕЗОПАСНО' : zone === 'yellow' ? 'ОСТОРОЖНО' : 'ОХОТА!';

      if (sr.noiseMarker) sr.noiseMarker.style.left = `${clamp(db, 0, 100)}%`;
      if (sr.noiseFill) sr.noiseFill.style.width = `${clamp(db, 0, 100)}%`;
      if (sr.vertNoiseFill) {
        sr.vertNoiseFill.style.height = `${clamp(db, 2, 100)}%`;
        sr.vertNoiseFill.style.backgroundColor = zoneColor;
      }
      if (sr.vertNoiseMarker) {
        sr.vertNoiseMarker.style.bottom = `${clamp(db, 2, 98)}%`;
      }
      if (sr.noiseVal) {
        sr.noiseVal.textContent = `${db} дБ`;
        sr.noiseVal.style.color = zoneColor;
      }
      if (sr.noiseZoneBadge) {
        sr.noiseZoneBadge.textContent = zoneLabel;
        sr.noiseZoneBadge.style.color = zoneColor;
      }

      if (sr.hpBar) sr.hpBar.style.width = `${clamp((S.hp / S.hpMax) * 100, 0, 100)}%`;
      if (sr.hpGhost) sr.hpGhost.style.width = `${clamp((S.hpGhost / S.hpMax) * 100, 0, 100)}%`;
      if (sr.hpVal) sr.hpVal.textContent = String(Math.round(S.hp));

      if (sr.batteryBar) {
        sr.batteryBar.style.width = `${clamp(S.battery, 0, 100)}%`;
        sr.batteryBar.style.backgroundColor = S.battery < 22 ? '#f43f5e' : '#fbbf24';
      }
      if (sr.batteryVal) {
        sr.batteryVal.textContent = `${Math.round(S.battery)}%`;
      }

      if (sr.foodBar) sr.foodBar.style.width = `${clamp(S.food, 0, 100)}%`;
      if (sr.foodVal) sr.foodVal.textContent = `${Math.round(S.food)}%`;
      if (sr.waterBar) sr.waterBar.style.width = `${clamp(S.water, 0, 100)}%`;
      if (sr.waterVal) sr.waterVal.textContent = `${Math.round(S.water)}%`;
      if (sr.breathBar) sr.breathBar.style.width = `${clamp(P.breath, 0, 100)}%`;

      const bpm = Math.round(64 + P.panic * 112 + (S.raid ? 16 : 0));
      if (sr.pulseVal) sr.pulseVal.textContent = `${bpm} BPM`;

      if (sr.doorBar) sr.doorBar.style.width = `${clamp(S.doorHp, 0, 100)}%`;
      if (sr.doorVal) sr.doorVal.textContent = `${Math.round(S.doorHp)}%`;

      if (clockElRef.current) {
        clockElRef.current.innerHTML = `ДЕНЬ ${S.day} <span class="text-[#9499A3] font-normal ml-1.5">${formatGameClock(S.t)}</span>`;
      }
      if (fpsElRef.current) {
        if (cfgRef.current.showFps) {
          const target = cfgRef.current.targetFps === 240 ? 144 : cfgRef.current.targetFps;
          const shownFps = Math.min(target, Math.max(60, currentFps));
          fpsElRef.current.textContent = `${shownFps} FPS · ${(1000 / shownFps).toFixed(1)} ms`;
        } else {
          fpsElRef.current.textContent = '';
        }
      }
      if (ammoElRef.current) {
        if (S.cur) {
          const A = S.ammo[S.cur];
          const inf = modRef.current.infAmmo;
          ammoElRef.current.innerHTML = `${inf ? '∞' : A.mag} / ${inf ? '∞' : A.res}<small class="block text-xs text-[#9499A3] font-medium">${WEAPONS[S.cur].name}</small>`;
        } else {
          ammoElRef.current.innerHTML = `<small class="block text-xs text-[#9499A3] font-medium">БЕЗ ОРУЖИЯ</small>`;
        }
      }

      const scoped = S.aim && S.cur === 'sniper' && !S.hidden;
      if (scopeElRef.current) scopeElRef.current.style.opacity = scoped ? '1' : '0';
    };

    // Main Simulation Step
    let beatT = 0;
    let hungerT = 0;
    let fovCur = 74;
    let menuT = 0;

    const stepSimulation = (rawDt: number) => {
      const dt = Math.min(rawDt, 0.05);
      horrorShaderUniforms.uTime.value += dt;
      horrorShaderUniforms.uFear.value = P.panic;

      // Hitstop freeze for heavy horror/combat impacts
      if (S.hitstop > 0) {
        S.hitstop -= dt;
        P.shake = Math.max(0, P.shake - dt * 2.5);
        return;
      }

      const simDt = dt * (modRef.current.slowMo ? 0.35 : 1);
      const hours = (simDt / DAYLEN) * 24 * modRef.current.timeScale;
      S.t += hours;
      S.day = Math.floor(S.t / 24) + 1;

      if (S.day >= 8) {
        S.mode = 'gameover';
        setScreenMode('gameover');
        setEndData({
          win: true,
          day: 7,
          clock: '06:00',
          kills: S.kills,
          hides: S.hides,
          trips: S.trips,
        });
        return;
      }

      if (S.day !== S.shownDay) {
        S.shownDay = S.day;
        planRaids();
        saveAtKeyPoint('auto', `Рассвет Дня ${S.day}`, false);
        setDayBanner({
          visible: true,
          day: S.day,
          sub: '06:00 · КЛЮЧЕВАЯ ТОЧКА СОХРАНЕНА',
        });
        window.setTimeout(() => {
          setDayBanner((prev) => ({ ...prev, visible: false }));
        }, 3200);
      }

      // Survival Needs
      if (!modRef.current.noHunger) {
        S.food = Math.max(0, S.food - (D.hunger / 24) * hours);
        S.water = Math.max(0, S.water - (D.thirst / 24) * hours);
      }
      if (S.food <= 0 || S.water <= 0) {
        if (!modRef.current.god) S.hp -= 6 * hours;
        if (S.hp <= 0) {
          S.hp = 0;
          die();
          return;
        }
      } else if (S.food > 40 && S.water > 40 && S.hp < S.hpMax) {
        S.hp = Math.min(S.hpMax, S.hp + 1.6 * hours);
      }

      const minN = Math.min(S.food, S.water);
      const weakF = minN >= 30 ? 1 : lerp(0.6, 1, minN / 30);
      const sick = clamp((32 - minN) / 32, 0, 1);
      if (minN < 30 && hungerT <= 0) {
        hungerT = 45;
        toast(S.food < S.water ? 'Голод отнимает силы. Проверь инвентарь [I].' : 'Мучает жажда. Выпей воды [H].', 2600);
      }
      hungerT -= simDt;

      // Dynamic Lighting & Occasional Thunderstorms at Night
      const dl = daylight();
      if (dl < 0.25 && Math.random() < simDt * 0.015 && S.lightningT <= 0) {
        triggerLightning();
      }
      applyDynamicHorrorLighting(dl, simDt);

      // Random Atmospheric Horror Events & Jumpscares
      S.scareCd -= simDt;
      if (S.scareCd <= 0 && cfgRef.current.jumpscareIntensity > 0) {
        // Near window at night
        const nearWin =
          dl < 0.35 &&
          (Math.hypot(P.x - 10.6, P.z - 3) < 1.8 ||
            Math.hypot(P.x - 10.6, P.z - 9) < 1.8 ||
            Math.hypot(P.x - 2.2, P.z - 11.5) < 1.8);
        if (nearWin && Math.random() < 0.45 * D.scareFreq) {
          S.scareCd = rnd(38, 65);
          triggerJumpscare('window', 'КТО-ТО СМОТРИТ В ОКНО!');
        } else if (P.panic > 0.55 && Math.random() < 0.25 * D.scareFreq) {
          S.scareCd = rnd(42, 70);
          sfx.whisper(rnd(-0.8, 0.8));
          triggerJumpscare('phantom', 'ОНИ СЛЫШАТ ТВОЁ СЕРДЦЕ');
        } else if (Math.random() < 0.12) {
          S.scareCd = rnd(20, 35);
          sfx.knock(rnd(-0.9, 0.9));
        } else {
          S.scareCd = 12;
        }
      }

      // Raids & Door Integrity
      if (!S.raid && S.raidPlan.length && S.t >= S.raidPlan[0]) {
        S.raidPlan.shift();
        startRaid();
      }
      if (S.raid && S.raid.state === 'approach') {
        S.raid.timer -= simDt;
        // Zombies batter the door barricade
        S.doorHp = Math.max(0, S.doorHp - simDt * 9.5);
        updateDoorPlanksVisual();
        if (S.raid.timer > 3.5 && S.raid.timer < 6.5 && Math.random() < simDt * 6) {
          sfx.knock(0);
        }
        if (S.raid.timer <= 0 || S.doorHp <= 0) {
          S.raid.state = 'inside';
          breakDoor();
        }
      }
      if (doorBroken && doorAnim < 1) {
        doorAnim = Math.min(1, doorAnim + simDt * 2.2);
        const k = ease(doorAnim);
        doorPivot.rotation.y = -1.3 * k;
        doorPivot.rotation.z = 0.15 * k;
        doorPivot.position.y = -0.08 * k;
      }

      // Active Noise Decoys Update
      for (let di = activeDecoys.length - 1; di >= 0; di--) {
        const dec = activeDecoys[di];
        dec.timer -= simDt;
        dec.ringT -= simDt;
        dec.mesh.rotation.z = Math.sin(performance.now() * 0.04) * 0.18;
        if (dec.ringT <= 0) {
          dec.ringT = 0.45;
          sfx.decoyRing(0, 0.65);
        }
        if (dec.timer <= 0) {
          scene.remove(dec.mesh);
          activeDecoys.splice(di, 1);
          toast('Завод будильника кончился', 1600);
        }
      }

      // Player Movement, Hiding, Breath & Panic
      const hid = Boolean(S.hidden);
      P.hideT = clamp(P.hideT + (hid ? 1 : -1) * simDt * 2.2, 0, 1);
      if (hid && S.hidden) {
        const sp = S.hidden;
        P.yaw += angDiff(sp.yaw, P.yaw) * Math.min(1, simDt * (P.hideT < 1 ? 3 : 0));
        const dy = clamp(angDiff(P.yaw, sp.yaw), -0.9, 0.9);
        P.yaw = sp.yaw + dy;
        P.pitch = clamp(P.pitch, -0.5, 0.5);
      }

      let near = 0;
      for (const z of zs) {
        if (z.dead || z.state === 'outside') continue;
        const d = Math.hypot(z.pos.x - P.x, z.pos.z - P.z);
        if (d < 6.5) near = Math.max(near, 1 - d / 6.5);
      }
      P.panic = clamp(P.panic + (near > 0 ? near * 0.16 * simDt * (hid ? 1 : 0.75) : -0.08 * simDt), 0, 1);

      const holding = inp.breath && P.breath > 0 && P.gasp <= 0;
      if (holding) {
        P.breath = Math.max(0, P.breath - 16 * simDt);
        P.panic = Math.max(0, P.panic - 0.22 * simDt);
        if (P.breath <= 0) {
          P.gasp = 2.5;
          P.burst = Math.max(P.burst, 72);
          sfx.gasp();
        }
      } else {
        P.breath = Math.min(100, P.breath + (P.gasp > 0 ? 9 : 20) * simDt);
      }
      if (P.gasp > 0) P.gasp -= simDt;

      let kx = 0;
      let kz = 0;
      if (keys.KeyW || keys.ArrowUp) kz += 1;
      if (keys.KeyS || keys.ArrowDown) kz -= 1;
      if (keys.KeyD || keys.ArrowRight) kx += 1;
      if (keys.KeyA || keys.ArrowLeft) kx -= 1;
      let mx = inp.mx + kx;
      let mz = inp.mz + kz;
      const ml = Math.hypot(mx, mz);
      const mag = Math.min(1, ml);
      if (ml > 0) {
        mx /= ml;
        mz /= ml;
      }
      const run = (inp.run || keys.ShiftLeft || keys.ShiftRight) && mag > 0.1 && P.crouchT < 0.5;
      let moving = false;

      if (!hid && P.hideT <= 0) {
        const crouchTarget = inp.crouch ? 1 : 0;
        P.crouchT = lerp(P.crouchT, crouchTarget, Math.min(1, simDt * 9));
        const sp = (P.crouchT > 0.5 ? 1.45 : run ? 4.8 : 2.7) * weakF * modRef.current.speedMul * mag;
        const fx = -Math.sin(P.yaw);
        const fz = -Math.cos(P.yaw);
        const rx = Math.cos(P.yaw);
        const rz = -Math.sin(P.yaw);
        const vx = (fx * mz + rx * mx) * sp;
        const vz = (fz * mz + rz * mx) * sp;
        const bx = P.x;
        const bz = P.z;
        const pp = { x: P.x, z: P.z };
        moveCol(pp, vx * simDt, vz * simDt, 0.27);
        P.x = clamp(pp.x, 0.3, 10.7);
        P.z = clamp(pp.z, 0.3, 11.7);
        P.moved = Math.hypot(P.x - bx, P.z - bz) / (simDt || 0.016);
        moving = P.moved > 0.3;

        if (inp.jump) {
          inp.jump = false;
          if (P.onGround && weakF > 0.7 && P.crouchT < 0.5) {
            P.vy = 5.2;
            P.onGround = false;
            P.burst = Math.max(P.burst, 22);
          }
        }
        P.vy -= 18 * simDt;
        P.y += P.vy * simDt;
        if (P.y <= 0) {
          if (!P.onGround && P.vy < -2) {
            P.burst = Math.max(P.burst, 46 * Math.min(1, -P.vy / 6));
            sfx.step(1.8, true);
            vib(20);
          }
          P.y = 0;
          P.vy = 0;
          P.onGround = true;
        }
        if (moving && P.onGround) {
          P.stepAcc += P.moved * simDt;
          const L = run ? 1.0 : 0.8;
          if (P.stepAcc > L) {
            P.stepAcc = 0;
            const onRug = P.x > 5.2 && P.x < 8.4 && P.z > 8.3 && P.z < 10.5;
            const creak = !onRug && Math.random() < 0.22;
            if (creak && !P.crouchT) P.burst = Math.max(P.burst, 34);
            sfx.step(run ? 1.5 : P.crouchT > 0.5 ? 0.35 : onRug ? 0.6 : 1.0, creak);
          }
        }
      } else {
        inp.jump = false;
      }

      // Compute Acoustic Noise dB & Zone for the Left Scale
      P.burst = Math.max(0, P.burst - 82 * simDt);
      micUpdate(simDt);
      const noiseRes = computeNoiseLevel({
        hidden: hid,
        holdingBreath: holding,
        moving,
        running: Boolean(run),
        crouching: P.crouchT > 0.5,
        onGround: P.onGround,
        panic: P.panic,
        burst: P.burst,
        silentMod: modRef.current.silent,
      });
      P.noise = noiseRes.db;
      P.zone = noiseRes.zone;

      // Heartbeat
      beatT -= simDt;
      const hr = lerp(1.0, 0.36, Math.max(P.panic, sick * 0.7, S.raid ? 0.28 : 0));
      if (beatT <= 0 && (P.panic > 0.18 || sick > 0.3)) {
        sfx.beat(0.4 + P.panic * 0.6);
        if (P.panic > 0.55) vib(22);
        beatT = hr;
      }

      P.shake = Math.max(0, P.shake - simDt * 2.5);
      P.kick = Math.max(0, P.kick - simDt * 0.5);
      P.run = Boolean(run && moving);
      P.moving = moving;

      // Slats & Under-sofa Overlays
      if (S.hidden) {
        const wardrobe = S.hidden.id === 'wardrobe';
        if (slatsElRef.current)
          slatsElRef.current.style.opacity = String(wardrobe ? clamp((P.hideT - 0.5) * 3, 0, 1) : 0);
        if (underElRef.current)
          underElRef.current.style.opacity = String(wardrobe ? 0 : clamp((P.hideT - 0.4) * 2.5, 0, 1));
        wrDoors.visible = P.hideT < 0.5;
      } else {
        if (slatsElRef.current) slatsElRef.current.style.opacity = String(clamp(P.hideT * 2 - 0.8, 0, 1));
        if (underElRef.current) underElRef.current.style.opacity = String(clamp(P.hideT * 2 - 0.8, 0, 1));
        wrDoors.visible = true;
      }
      if (vigElRef.current) {
        vigElRef.current.style.opacity = String(clamp(sick * 0.85 + P.panic * 0.5, 0.15, 0.95));
      }

      // Flashlight Battery Drain & Flicker
      const battStep = stepFlashlightBattery(
        S.battery,
        S.torch,
        D.batteryDrain,
        simDt,
        modRef.current.infBattery
      );
      if (S.torch && !battStep.torchOn) {
        S.torch = false;
        sfx.torchToggle(false);
        toast('Фонарик разрядился! Замени батарею [V] в темноте!', 3000);
        syncReactSnapshot();
      }
      S.battery = battStep.battery;

      if (S.torch) {
        let flick = battStep.flickerFactor;
        if (S.battery < 22) {
          flick *= Math.sin(performance.now() * 0.035) > -0.3 ? 1 : 0.12;
        }
        torch.intensity = 2.35 * flick;
        beamMesh.visible = cfgRef.current.customShaders;
        beamMat.uniforms.uIntensity.value = 0.22 * flick;
      } else {
        torch.intensity = 0;
        beamMesh.visible = false;
      }

      // Weapon Reload & Fire
      fireCd -= simDt;
      if (rel.on) {
        rel.t -= simDt;
        if (rel.t <= 0 && S.cur) {
          rel.on = false;
          const W = WEAPONS[S.cur];
          const A = S.ammo[S.cur];
          if (modRef.current.infAmmo) A.mag = W.mag;
          else {
            const need = W.mag - A.mag;
            const take = Math.min(need, A.res);
            A.mag += take;
            A.res -= take;
          }
          syncReactSnapshot();
        }
      }
      if (inp.firePress) {
        inp.firePress = false;
        if (S.cur && !S.hidden && !rel.on && fireCd <= 0 && S.mode === 'playing') {
          shoot();
        } else if (!S.cur && !S.hidden) {
          toast('Оружия нет. Загляни в шкаф в спальне!', 1600);
        }
      }

      // Update Zombies & Particles
      for (let i = 0; i < zs.length; i++) zUpdate(zs[i], simDt);
      for (let i = zs.length - 1; i >= 0; i--) {
        if (zs[i].gone) zs.splice(i, 1);
      }
      if (S.raid && S.raid.state === 'inside') checkRaidEnd();

      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life -= simDt;
        p.v.y -= 7 * simDt;
        p.m.position.addScaledVector(p.v, simDt);
        if (p.m.position.y < 0.02) {
          p.m.position.y = 0.02;
          p.v.multiplyScalar(0.2);
        }
        if (p.life <= 0) p.m.visible = false;
      }

      // Find nearest Interactable
      if (S.hidden) {
        curIA = {
          id: 'exit_hide',
          x: P.x,
          z: P.z,
          r: 2,
          done: false,
          label: () => 'Выйти из укрытия [E]',
          act: () => exitHide(),
        };
      } else {
        let best: Interactable | null = null;
        let bd = 9;
        for (const a of IA) {
          if (a.done) continue;
          const d = Math.hypot(P.x - a.x, P.z - a.z);
          if (d < a.r && d < bd) {
            const fx = -Math.sin(P.yaw);
            const fz = -Math.cos(P.yaw);
            const dot = ((a.x - P.x) * fx + (a.z - P.z) * fz) / (d || 1);
            if (dot > -0.2 || d < 0.75) {
              bd = d;
              best = a;
            }
          }
        }
        curIA = best;
      }
      const nextLbl = curIA ? curIA.label() : null;
      if (nextLbl !== lastIaLabel) {
        lastIaLabel = nextLbl;
        setInteractPrompt(nextLbl);
      }

      // Camera & Viewmodel Kinematics
      const eyeStand = lerp(1.62, 1.0, P.crouchT);
      const ey = eyeStand + P.y;
      P.bob += simDt * (P.moving ? (P.run ? 11 : 7.5) : 1.2);
      const bobY = P.moving ? Math.sin(P.bob) * (P.run ? 0.05 : 0.025) : Math.sin(P.bob) * 0.004;
      let cx = P.x;
      let cz = P.z;
      let cy = ey + bobY;
      if (P.hideT > 0 && S.hidden) {
        const sp = S.hidden;
        const k = ease(P.hideT);
        cx = lerp(P.x, sp.cam[0], k);
        cy = lerp(ey, sp.cam[1], k);
        cz = lerp(P.z, sp.cam[2], k);
      }
      camera.position.set(cx, cy, cz);
      const sx = (Math.random() - 0.5) * P.shake * 0.035;
      const sy = (Math.random() - 0.5) * P.shake * 0.035;
      const sway = sick * Math.sin(performance.now() * 0.0013) * 0.03;
      camera.rotation.set(
        P.pitch + P.kick + sy + sway * 0.5,
        P.yaw + sx + sway,
        Math.sin(P.bob * 0.5) * (P.moving ? 0.01 : 0) + sway * 0.4
      );
      let tf = cfgRef.current.fov + (P.run ? 6 : 0) - sick * 8;
      if (S.aim) tf = S.cur === 'sniper' ? 14 : cfgRef.current.fov * 0.82;
      fovCur = lerp(fovCur, tf, Math.min(1, simDt * 10));
      camera.fov = fovCur;
      camera.updateProjectionMatrix();
      vCam.fov = cfgRef.current.fov;
      vCam.updateProjectionMatrix();

      sfx.setOcclusion(isHidden(), simDt);

      // Viewmodel Update
      if (vm.model && vm.cur) {
        const k = vm.cur;
        const b = VMP[k];
        const a = VMA[k];
        const aim = S.aim && k !== 'sniper' ? 1 : 0;
        vm.kick = Math.max(0, vm.kick - simDt * 7);
        vm.pump = Math.max(0, vm.pump - simDt * 2.2);
        vm.swap = Math.max(0, vm.swap - simDt * 3);
        vm.bob += simDt * (P.moving ? (P.run ? 11 : 7) : 1.5);
        const bx = Math.sin(vm.bob) * (P.moving ? (P.run ? 0.012 : 0.006) : 0.0015);
        const by =
          Math.abs(Math.cos(vm.bob)) * (P.moving ? (P.run ? 0.012 : 0.006) : 0.0015) +
          Math.sin(vm.bob * 0.5) * 0.0008;
        const rl = rel.on ? Math.sin(clamp(1 - rel.t / WEAPONS[k].reload, 0, 1) * Math.PI) : 0;
        const px = lerp(b[0], a[0], aim) + bx;
        const py = lerp(b[1], a[1], aim) + by - rl * 0.14 - vm.swap * 0.25;
        const pz = lerp(b[2], a[2], aim) + vm.kick * 0.06;
        vm.g.position.set(px, py, pz);
        vm.g.rotation.set(
          vm.kick * 0.2 + rl * 0.5 - (P.run && P.moving ? 0.15 : 0),
          (P.run && P.moving ? 0.25 : 0) + rl * 0.2,
          0
        );
        const pm = vm.model.userData.gun.getObjectByName('pump');
        if (pm) pm.position.z = -0.33 + Math.sin(vm.pump * Math.PI) * 0.1;
        vm.g.visible = !(S.aim && k === 'sniper') && !S.hidden;
      }

      updateDomHud(simDt);
    };

    const stepMenuCamera = (dt: number) => {
      menuT += dt * 0.14;
      horrorShaderUniforms.uTime.value += dt;
      applyDynamicHorrorLighting(0.05, dt);
      const x = 5.5 + Math.sin(menuT) * 3.1;
      const z = 8.7 + Math.cos(menuT * 0.7) * 1.6;
      camera.position.set(x, 1.52, z);
      camera.rotation.set(-0.05, Math.PI + Math.sin(menuT * 0.8) * 0.5 + 0.9, 0);
      camera.fov = cfgRef.current.fov;
      camera.updateProjectionMatrix();
      vm.g.visible = false;
      torch.intensity = 0;
      beamMesh.visible = false;
      roomLights.forEach((l, idx) => {
        l.intensity = 0.22 + Math.sin(menuT * 5 + idx) * 0.04;
      });
    };

    const espVec = new THREE.Vector3();
    const drawESP = () => {
      const espC = espCanvasRef.current;
      if (!espC) return;
      const espG = espC.getContext('2d');
      if (!espG) return;
      espG.clearRect(0, 0, espC.width, espC.height);
      if (!modRef.current.esp || S.mode !== 'playing') return;
      espG.strokeStyle = '#F43F5E';
      espG.fillStyle = '#F43F5E';
      espG.lineWidth = 2;
      espG.font = '700 12px "JetBrains Mono", monospace';
      for (const z of zs) {
        if (z.dead || z.gone) continue;
        espVec.set(z.pos.x, 1, z.pos.z).project(camera);
        if (espVec.z < -1 || espVec.z > 1) continue;
        const x = (espVec.x * 0.5 + 0.5) * espC.width;
        const y = (-espVec.y * 0.5 + 0.5) * espC.height;
        const dist = Math.hypot(z.pos.x - camera.position.x, z.pos.z - camera.position.z);
        const h = (espC.height * 0.34) / Math.max(0.6, dist * 0.6);
        const w = h * 0.45;
        espG.strokeRect(x - w / 2, y - h / 2, w, h);
        espG.fillText(`${Math.round(dist)}м · ${z.archetype.toUpperCase()}`, x - w / 2, y - h / 2 - 5);
      }
    };

    // Reset & Boot Game Functions
    const resetWorld = () => {
      zs.forEach((z) => scene.remove(z.g));
      zs.length = 0;
      clearTrapsAndDecoys();
      IA.forEach((a) => {
        a.done = false;
        if (a.prop) a.prop.visible = true;
      });
      restoreDoor(100);
      Object.assign(P, {
        x: 3.0,
        z: 3.6,
        y: 0,
        vy: 0,
        yaw: 0.93,
        pitch: 0,
        hideT: 0,
        panic: 0,
        breath: 100,
        burst: 0,
        crouchT: 0,
        noise: 5,
        zone: 'green',
      });
      vmSet(null);
      rel.on = false;
    };

    const startNewGame = (diffKey: DifficultyKey, fromUserGesture = true) => {
      if (fromUserGesture) sfx.init();
      D = DIFFICULTIES[diffKey];
      S.diff = diffKey;
      S.mode = 'playing';
      S.paused = false;
      S.t = 0;
      S.hp = D.hp;
      S.hpMax = D.hp;
      S.hpGhost = D.hp;
      S.food = 85;
      S.water = 85;
      S.battery = 100;
      S.doorHp = 100;
      S.inv = createInitialInventory(diffKey);
      S.weapons = { deagle: false, shotgun: false, sniper: false };
      S.ammo = {
        deagle: { mag: 0, res: 0 },
        shotgun: { mag: 0, res: 0 },
        sniper: { mag: 0, res: 0 },
      };
      S.cur = null;
      S.kitTaken = false;
      S.tripReady = 8;
      S.hidden = null;
      setIsHiddenState(false);
      S.aim = false;
      S.torch = true; // Start with flashlight ON so player immediately sees dynamic lighting
      S.raid = null;
      S.day = 1;
      S.shownDay = 1;
      S.kills = 0;
      S.trips = 0;
      S.hides = 0;
      resetWorld();
      planRaids();
      setScreenMode('playing');
      setEndData(null);
      setInvOpen(false);
      saveAtKeyPoint('auto', 'День 1 (06:00) · Начало выживания', false);
      syncReactSnapshot();
      toast('Загляни в шкаф в спальне (слева). Экономь заряд фонарика [F]!', 4200);
      setDayBanner({ visible: true, day: 1, sub: '06:00 · КЛЮЧЕВАЯ ТОЧКА СОХРАНЕНА' });
      window.setTimeout(() => {
        setDayBanner((prev) => ({ ...prev, visible: false }));
      }, 3000);
    };

    const loadCheckpointData = (cp: CheckpointData) => {
      sfx.init();
      D = DIFFICULTIES[cp.diff || 'normal'];
      S.diff = cp.diff || 'normal';
      resetWorld();
      S.mode = 'playing';
      S.paused = false;
      S.t = cp.t || 0;
      S.hp = Math.max(cp.hp || 80, D.hp * 0.5);
      S.hpMax = D.hp;
      S.hpGhost = S.hp;
      S.food = Math.max(cp.food || 50, 35);
      S.water = Math.max(cp.water || 50, 35);
      S.battery = cp.battery ?? 80;
      S.doorHp = cp.doorHp ?? 100;
      S.inv = { ...createInitialInventory(S.diff), ...(cp.inv || {}) };
      S.weapons = { ...cp.weapons };
      S.ammo = {
        deagle: { ...(cp.ammo?.deagle || { mag: 0, res: 0 }) },
        shotgun: { ...(cp.ammo?.shotgun || { mag: 0, res: 0 }) },
        sniper: { ...(cp.ammo?.sniper || { mag: 0, res: 0 }) },
      };
      S.kitTaken = Boolean(cp.kitTaken);
      S.kills = cp.kills || 0;
      S.trips = cp.trips || 0;
      S.hides = cp.hides || 0;
      S.day = Math.floor(S.t / 24) + 1;
      S.shownDay = S.day;
      S.tripReady = S.t + 4;
      P.x = cp.px || 3.0;
      P.z = cp.pz || 3.6;

      IA.forEach((a) => {
        if ((cp.doneInteractables || []).includes(a.id)) {
          a.done = true;
          if (a.prop) a.prop.visible = false;
        }
      });
      if (cp.curWeapon) equip(cp.curWeapon);
      updateDoorPlanksVisual();
      planRaids();
      setScreenMode('playing');
      setEndData(null);
      setInvOpen(false);
      syncReactSnapshot();
      toast(`Загружена точка: ${cp.title}`, 3000);
    };

    // Wire Engine API Ref
    engineApiRef.current = {
      startNewGame,
      loadCheckpointData,
      saveToSlot: (slotId: string, title?: string) => {
        saveAtKeyPoint(
          slotId,
          title || `День ${S.day} (${formatGameClock(S.t)}) · Ручное сохранение`
        );
      },
      returnToTitle: () => {
        S.mode = 'title';
        S.paused = false;
        setScreenMode('title');
        setInvOpen(false);
        resetWorld();
        refreshSaveSlots();
      },
      toggleTorch: () => {
        if (S.mode !== 'playing') return;
        if (!S.torch && S.battery <= 0 && !modRef.current.infBattery) {
          toast('Батарея фонарика села (0%)! Замени батарейку [V].', 2400);
          sfx.empty();
          return;
        }
        S.torch = !S.torch;
        sfx.torchToggle(S.torch);
        syncReactSnapshot();
      },
      rechargeTorch: () => {
        const res = rechargeBattery(S.battery, S.inv);
        if (!res.recharged) {
          toast(S.inv.batteries <= 0 ? 'Нет запасных батареек! Скрафти в меню [I]' : 'Фонарик уже заряжен', 2000);
          return;
        }
        S.battery = res.battery;
        S.torch = true;
        sfx.batterySwap();
        toast(`Батарея заменена! Заряд фонарика: ${Math.round(S.battery)}%`, 2200);
        syncReactSnapshot();
      },
      useConsumable: (type) => {
        if (type === 'food') {
          if (S.inv.food <= 0 || S.food >= 99) return;
          S.inv.food--;
          S.food = Math.min(100, S.food + 34);
          sfx.eat();
          P.burst = Math.max(P.burst, 16);
          toast('Съедены консервы (+34% сытости)', 1800);
        } else if (type === 'water') {
          if (S.inv.water <= 0 || S.water >= 99) return;
          S.inv.water--;
          S.water = Math.min(100, S.water + 34);
          sfx.drink();
          P.burst = Math.max(P.burst, 12);
          toast('Выпита вода (+34% жажды)', 1800);
        } else if (type === 'battery') {
          engineApiRef.current?.rechargeTorch();
          return;
        } else if (type === 'medkit') {
          if (S.inv.medkits <= 0 || S.hp >= S.hpMax) return;
          S.inv.medkits--;
          S.hp = Math.min(S.hpMax, S.hp + 45);
          sfx.pickup();
          toast('Раны перевязаны (+45 HP)', 1800);
        } else if (type === 'sedative') {
          if (S.inv.sedatives <= 0) return;
          S.inv.sedatives--;
          P.panic = 0;
          P.breath = 100;
          sfx.drink();
          toast('Паника снята. Пульс в норме.', 1800);
        }
        syncReactSnapshot();
      },
      useDefenseTool: (type) => {
        if (S.mode !== 'playing' || S.hidden) return;
        if (type === 'trap') {
          if (S.inv.traps <= 0) {
            toast('Нет капканов! Скрафти в мастерской [I]', 1800);
            return;
          }
          S.inv.traps--;
          const fx = -Math.sin(P.yaw);
          const fz = -Math.cos(P.yaw);
          const tx = clamp(P.x + fx * 0.75, 0.5, 10.5);
          const tz = clamp(P.z + fz * 0.75, 0.5, 11.5);
          const mesh = buildBearTrapMesh();
          mesh.position.set(tx, 0, tz);
          scene.add(mesh);
          activeTraps.push({ x: tx, z: tz, mesh });
          sfx.trapPlace();
          P.burst = Math.max(P.burst, 18);
          toast('Медвежий капкан установлен на полу!', 2200);
        } else if (type === 'decoy') {
          if (S.inv.decoys <= 0) {
            toast('Нет шумовых приманок! Скрафти в мастерской [I]', 1800);
            return;
          }
          S.inv.decoys--;
          const fx = -Math.sin(P.yaw);
          const fz = -Math.cos(P.yaw);
          const dx = clamp(P.x + fx * 2.4, 0.6, 10.4);
          const dz = clamp(P.z + fz * 2.4, 0.6, 11.4);
          const mesh = buildDecoyMesh();
          mesh.position.set(dx, 0, dz);
          scene.add(mesh);
          activeDecoys.push({ x: dx, z: dz, timer: 6.0, ringT: 0.05, mesh });
          sfx.decoyRing(0, 0.8);
          toast('Шумовой будильник брошен! Зомби бегут к нему!', 2500);
        } else if (type === 'barricade') {
          if (S.inv.barricades <= 0) {
            toast('Нет баррикадных щитов!', 1800);
            return;
          }
          S.inv.barricades--;
          restoreDoor(100);
          sfx.craft();
          P.burst = Math.max(P.burst, 26);
          toast('Входная дверь укреплена баррикадой (100%)!', 2400);
        }
        syncReactSnapshot();
      },
      craftItem: (recipe) => {
        const ok = applyCraft(S.inv, S.ammo, recipe);
        if (!ok) return;
        sfx.craft();
        P.burst = Math.max(P.burst, recipe.noiseOnCraft);
        toast(`Скрафчено: ${recipe.name}`, 2200);
        syncReactSnapshot();
      },
      selectWeapon: (w) => {
        if (S.weapons[w]) equip(w);
      },
      swapWeapon: () => {
        if (S.mode !== 'playing' || S.hidden) return;
        const own = WEAPON_LIST.filter((w) => S.weapons[w]);
        if (!own.length) {
          toast('Оружия нет. Загляни в шкаф в спальне!', 1800);
          return;
        }
        const i = S.cur ? own.indexOf(S.cur) : -1;
        equip(own[(i + 1) % own.length]);
        sfx.click();
      },
      reloadWeapon: startReload,
      performInteract: () => {
        if (S.mode !== 'playing') return;
        if (S.hidden) {
          exitHide();
          return;
        }
        if (curIA && curIA.act) curIA.act(curIA);
      },
      toggleAim: () => {
        if (S.mode === 'playing' && !S.hidden && S.cur) {
          S.aim = !S.aim;
          sfx.click();
        }
      },
      toggleCrouch: () => {
        inp.crouch = !inp.crouch;
        sfx.click();
      },
      triggerJump: () => {
        inp.jump = true;
      },
      setFireHeld: (held, pressed) => {
        inp.fire = held;
        if (pressed) inp.firePress = true;
      },
      setBreathHeld: (held) => {
        inp.breath = held;
      },
      toggleMic: (on) => {
        if (on) startMic();
        else stopMic();
      },
      setPausedState: (p) => {
        S.paused = p;
        if (p) sfx.suspend();
        else sfx.resume();
      },
      execModAction: (act) => {
        if (act === 'heal') {
          S.hp = S.hpMax;
          S.food = 100;
          S.water = 100;
          S.battery = 100;
          P.panic = 0;
        } else if (act === 'resources') {
          S.inv.scrap += 10;
          S.inv.wood += 10;
          S.inv.wires += 10;
          S.inv.cloth += 10;
          S.inv.powder += 10;
          S.inv.batteries += 5;
          S.inv.traps += 3;
          S.inv.decoys += 3;
        } else if (act === 'weapons') {
          WEAPON_LIST.forEach((w) => {
            S.weapons[w] = true;
            S.ammo[w] = { mag: WEAPONS[w].mag, res: 60 };
          });
          if (!S.cur) equip('deagle');
        } else if (act === 'scare') {
          triggerJumpscare('phantom', 'СКРИМЕР ПРОТЕСТИРОВАН!');
        } else if (act === 'lightning') {
          triggerLightning();
        } else if (act === 'spawn_stalker') {
          makeZombie(5.5, 10.6, 'patrol', 'stalker');
        } else if (act === 'spawn_brute') {
          makeZombie(5.5, 10.6, 'patrol', 'brute');
        } else if (act === 'spawn_crawler') {
          makeZombie(5.5, 10.6, 'patrol', 'crawler');
        } else if (act === 'raid') {
          if (!S.raid) startRaid();
        } else if (act === 'clear_zombies') {
          zs.forEach((z) => scene.remove(z.g));
          zs.length = 0;
          if (S.raid) {
            S.raid = null;
            restoreDoor(100);
          }
        } else if (act === 'next_day') {
          S.t = Math.floor(S.t / 24 + 1) * 24 + 0.05;
        }
        syncReactSnapshot();
      },
    };

    // Support ?autostart=1 query param per Ultra Mode rules
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startNewGame('normal', false);
    }

    // Pre-compile shaders on hardware GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // High-Precision 120 FPS / Software-WebGL Paced Render Loop
    let frameId = 0;
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      fpsFrames++;
      fpsAccum += rawDt;
      if (fpsAccum >= 0.4) {
        currentFps = Math.round(fpsFrames / fpsAccum);
        fpsFrames = 0;
        fpsAccum = 0;
      }

      renderer.shadowMap.enabled = !isSoftwareGl && cfgRef.current.shadows;

      if (S.mode === 'playing') {
        if (!S.paused) {
          stepSimulation(rawDt);
        }
      } else {
        stepMenuCamera(Math.min(rawDt, 0.05));
      }

      renderer.clear();
      renderer.render(scene, camera);
      if (S.mode === 'playing' && vm.g.visible && vm.model) {
        renderer.clearDepth();
        renderer.render(vScene, vCam);
      }
      drawESP();

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', applyResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endPtr);
      window.removeEventListener('pointercancel', endPtr);
      stopMic();
      renderer.dispose();
    };
  }, [refreshSaveSlots, selDiff]);

  const handleContinueSaved = () => {
    const latest = getLatestCheckpoint();
    if (latest) {
      engineApiRef.current?.loadCheckpointData(latest);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07080A] text-[#EDEEF0] font-['Manrope'] select-none">
      {/* 1. Isolated Three.js WebGL Mount Container */}
      <div ref={mountRef} className="fixed inset-0 z-0" />

      {/* 2. ESP Overlay Canvas */}
      <canvas ref={espCanvasRef} className="fixed inset-0 pointer-events-none z-10" />

      {/* 3. Atmospheric Horror Screen Effects (Vignette, Blood Hit, Slats Peek, Under-Sofa, Sniper Scope) */}
      <div
        ref={vigElRef}
        className="fixed inset-0 pointer-events-none z-12 transition-opacity duration-300"
        style={{
          opacity: 0.25,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.92) 100%)',
        }}
      />
      <div
        ref={dmgElRef}
        className="fixed inset-0 pointer-events-none z-13 transition-opacity duration-200"
        style={{
          opacity: 0,
          background:
            'radial-gradient(ellipse at center, rgba(130,0,15,0) 28%, rgba(190,0,25,0.85) 100%)',
        }}
      />
      <div
        ref={slatsElRef}
        className="fixed inset-0 pointer-events-none z-14 transition-opacity duration-300"
        style={{
          opacity: 0,
          background:
            'repeating-linear-gradient(90deg, #030201 0 2.4vh, transparent 2.4vh 3.1vh), radial-gradient(ellipse at center, rgba(0,0,0,0) 25%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      <div
        ref={underElRef}
        className="fixed inset-0 pointer-events-none z-14 transition-opacity duration-300"
        style={{
          opacity: 0,
          background:
            'linear-gradient(#000 0, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0) 46%), radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      <div
        ref={scopeElRef}
        className="fixed inset-0 pointer-events-none z-14 transition-opacity duration-150"
        style={{
          opacity: 0,
          background: 'radial-gradient(circle at center, transparent 0, transparent 36vh, #000 36.4vh)',
        }}
      />
      <div
        ref={darkElRef}
        className="fixed inset-0 pointer-events-none z-40 bg-black transition-opacity duration-700"
        style={{ opacity: 0 }}
      />

      {/* Jumpscare & Post-Processing Scanline Shader Overlay */}
      <JumpscareOverlay
        jumpscare={jumpscare}
        shaderFxEnabled={cfg.customShaders}
        nightVision={mod.nightVision}
      />

      {/* Cinematic Day Transition Banner */}
      {dayBanner.visible && (
        <div className="fixed inset-0 z-35 pointer-events-none flex flex-col items-center justify-center text-center bg-black/45">
          <div className="font-['Unbounded'] text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_#000]">
            ДЕНЬ {dayBanner.day}
          </div>
          <div className="mt-2 font-mono text-xs sm:text-sm tracking-[0.28em] text-amber-400">
            {dayBanner.sub}
          </div>
        </div>
      )}

      {/* Virtual Multi-Touch Thumbstick */}
      <div
        ref={stickRef}
        className="fixed w-[18vh] h-[18vh] rounded-full border border-white/30 bg-white/5 hidden z-25 pointer-events-none -ml-[9vh] -mt-[9vh]"
      >
        <div
          ref={knobRef}
          className="absolute left-[5vh] top-[5vh] w-[8vh] h-[8vh] rounded-full bg-white/40 border border-white/50"
        />
      </div>

      {/* =====================================================================
          PLAYING HUD (Includes Permanent Always-Left Scale Panel!)
         ===================================================================== */}
      {screenMode === 'playing' && (
        <div className="fixed inset-0 pointer-events-none z-20">
          {/* 1. PERMANENT ALWAYS-LEFT NOISE & SURVIVAL SCALE PANEL */}
          <LeftScalePanel
            scaleRefs={scaleRefs}
            batteriesCount={uiSnapshot.inv.batteries}
            torchOn={uiSnapshot.torchOn}
            micActive={micActive}
            onToggleTorch={() => engineApiRef.current?.toggleTorch()}
            onRechargeBattery={() => engineApiRef.current?.rechargeTorch()}
            onOpenInventory={() => {
              const next = !invOpen;
              setInvOpen(next);
              engineApiRef.current?.setPausedState(next);
            }}
          />

          {/* 2. Top-Center Clock & 120 FPS Counter */}
          <div className="fixed top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <div
              ref={clockElRef}
              className="px-4 py-1 rounded-full bg-[#0A0C10]/85 border border-white/15 font-mono font-bold text-sm tracking-wider text-white tabular-nums shadow-lg"
            >
              ДЕНЬ 1 <span className="text-[#9499A3] font-normal ml-1.5">06:00</span>
            </div>
            <div
              ref={fpsElRef}
              data-testid="fps-counter"
              className="mt-1 font-mono text-[11px] font-bold text-emerald-400 tabular-nums drop-shadow"
            >
              120 FPS · 8.3 ms
            </div>
          </div>

          {/* 3. Top-Right Utility Controls (Save Checkpoint, Inventory, Pause/Settings) */}
          <div className="fixed top-3 right-3 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                engineApiRef.current?.saveToSlot('slot1');
              }}
              data-testid="quick-save-btn"
              className="px-3 py-2 rounded-xl bg-[#0A0C10]/90 hover:bg-emerald-500/20 border border-white/15 text-xs font-bold text-emerald-300 shadow-lg cursor-pointer"
              title="Быстрое сохранение в ключевой точке"
            >
              Сохранить
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                const next = !invOpen;
                setInvOpen(next);
                engineApiRef.current?.setPausedState(next);
              }}
              className="px-3 py-2 rounded-xl bg-[#0A0C10]/90 hover:bg-amber-500/20 border border-white/15 text-xs font-bold text-amber-300 shadow-lg cursor-pointer"
              aria-label="Открыть инвентарь и крафт"
            >
              Крафт [{uiSnapshot.inv.scrap + uiSnapshot.inv.wood + uiSnapshot.inv.wires}]
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                engineApiRef.current?.setPausedState(true);
                setIsPauseFromMenu(false);
                setPauseTab(0);
                setScreenMode('paused');
              }}
              data-testid="open-settings-btn"
              aria-label="Настройки и пауза"
              className="w-10 h-10 rounded-xl bg-[#0A0C10]/90 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white shadow-lg cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
              </svg>
            </button>
          </div>

          {/* 4. Center Crosshair, Hitmarker & Toast Message */}
          <div
            ref={toastElRef}
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-black/80 border border-white/15 font-bold text-sm text-amber-300 text-center max-w-[60vw] transition-opacity duration-300 shadow-xl"
            style={{ opacity: 0 }}
          />
          {!isHiddenState && (
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white/80 shadow-[0_0_4px_#000]" />
          )}
          <div
            ref={hitElRef}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 opacity-0 transition-opacity duration-100"
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-rose-500" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500" />
          </div>

          {/* 5. Contextual Interact Button (#bUse) */}
          {interactPrompt && (
            <div className="fixed right-[30vw] top-[42vh] flex flex-col items-center gap-1.5 pointer-events-auto">
              <span className="px-3 py-1 rounded-lg bg-black/85 border border-amber-500/40 text-xs font-bold text-amber-300 shadow-lg">
                {interactPrompt}
              </span>
              <button
                type="button"
                onClick={() => engineApiRef.current?.performInteract()}
                data-testid="interact-btn"
                className="w-14 h-14 rounded-full bg-amber-500/30 hover:bg-amber-500/45 border-2 border-amber-400 flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                aria-label={interactPrompt}
              >
                <span className="font-mono font-bold text-xs">[E]</span>
              </button>
            </div>
          )}

          {/* 6. Bottom-Center Quick Survival & Defense Tool Bar */}
          {!isHiddenState && (
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0A0C10]/90 border border-white/15 pointer-events-auto shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
              <button
                type="button"
                onClick={() => engineApiRef.current?.useConsumable('food')}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                title="Съесть консервы [G]"
              >
                <span>Еда</span>
                <span className="font-mono text-white tabular-nums">{uiSnapshot.inv.food}</span>
              </button>
              <button
                type="button"
                onClick={() => engineApiRef.current?.useConsumable('water')}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 text-xs font-bold text-sky-300 cursor-pointer"
                title="Выпить воду [H]"
              >
                <span>Вода</span>
                <span className="font-mono text-white tabular-nums">{uiSnapshot.inv.water}</span>
              </button>
              <button
                type="button"
                onClick={() => engineApiRef.current?.toggleTorch()}
                data-testid="hud-torch-btn"
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  uiSnapshot.torchOn
                    ? 'bg-amber-500 text-black border-amber-300'
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/15'
                }`}
                title="Фонарик [F]"
              >
                <span>Фонарь [F]</span>
              </button>
              <button
                type="button"
                onClick={() => engineApiRef.current?.useDefenseTool('trap')}
                data-testid="hud-trap-btn"
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 flex items-center gap-1.5 text-xs font-bold text-rose-300 cursor-pointer"
                title="Поставить медвежий капкан [T]"
              >
                <span>Капкан [T]</span>
                <span className="font-mono text-white tabular-nums">{uiSnapshot.inv.traps}</span>
              </button>
              <button
                type="button"
                onClick={() => engineApiRef.current?.useDefenseTool('decoy')}
                data-testid="hud-decoy-btn"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 flex items-center gap-1.5 text-xs font-bold text-emerald-300 cursor-pointer"
                title="Бросить шумовой будильник [Z]"
              >
                <span>Приманка [Z]</span>
                <span className="font-mono text-white tabular-nums">{uiSnapshot.inv.decoys}</span>
              </button>
            </div>
          )}

          {/* Hold Breath Button when Hidden */}
          {isHiddenState && (
            <button
              type="button"
              onPointerDown={() => engineApiRef.current?.setBreathHeld(true)}
              onPointerUp={() => engineApiRef.current?.setBreathHeld(false)}
              onPointerCancel={() => engineApiRef.current?.setBreathHeld(false)}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl bg-cyan-500/25 hover:bg-cyan-500/35 border-2 border-cyan-400 text-cyan-200 font-bold text-sm pointer-events-auto shadow-2xl active:scale-95 cursor-pointer"
            >
              ЗАДЕРЖАТЬ ДЫХАНИЕ [УДЕРЖИВАЙ B]
            </button>
          )}

          {/* 7. Right-Side Combat & Movement Action Cluster */}
          {!isHiddenState && (
            <>
              <div
                ref={ammoElRef}
                className="fixed right-4 bottom-4 text-right font-mono font-bold text-xl text-white tabular-nums drop-shadow-[0_2px_8px_#000]"
              >
                <small className="block text-xs text-[#9499A3] font-medium">БЕЗ ОРУЖИЯ</small>
              </div>

              <div
                className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2.5 pointer-events-auto"
                style={{
                  transform: `translateY(-50%) scale(${cfg.uiScale})`,
                  opacity: cfg.uiOpacity,
                }}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => engineApiRef.current?.swapWeapon()}
                    aria-label="Сменить оружие"
                    className="w-11 h-11 rounded-full bg-[#111318]/85 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-90 cursor-pointer"
                  >
                    Оруж
                  </button>
                  <button
                    type="button"
                    onClick={() => engineApiRef.current?.reloadWeapon()}
                    aria-label="Перезарядить оружие"
                    className="w-11 h-11 rounded-full bg-[#111318]/85 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-90 cursor-pointer"
                  >
                    Перез
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => engineApiRef.current?.toggleAim()}
                    aria-label="Прицелиться"
                    className="w-12 h-12 rounded-full bg-[#111318]/85 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-90 cursor-pointer"
                  >
                    Прицел
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => engineApiRef.current?.setFireHeld(true, true)}
                    onPointerUp={() => engineApiRef.current?.setFireHeld(false)}
                    onPointerCancel={() => engineApiRef.current?.setFireHeld(false)}
                    aria-label="Огонь"
                    className="w-16 h-16 rounded-full bg-rose-600/40 hover:bg-rose-600/60 border-2 border-rose-400 flex items-center justify-center text-white font-bold text-xs shadow-xl active:scale-90 cursor-pointer"
                  >
                    ОГОНЬ
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => engineApiRef.current?.toggleCrouch()}
                    aria-label="Присесть"
                    className="w-11 h-11 rounded-full bg-[#111318]/85 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-90 cursor-pointer"
                  >
                    Присед
                  </button>
                  <button
                    type="button"
                    onClick={() => engineApiRef.current?.triggerJump()}
                    aria-label="Прыжок"
                    className="w-11 h-11 rounded-full bg-[#111318]/85 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-90 cursor-pointer"
                  >
                    Прыжок
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TITLE SCREEN (Main Menu with 3D Live World Camera Tour)
         ===================================================================== */}
      {screenMode === 'title' && (
        <div
          data-testid="title-screen"
          className="fixed inset-0 z-30 flex flex-col lg:flex-row items-stretch justify-between p-6 sm:p-10 bg-gradient-to-r from-[#040507]/95 via-[#040507]/60 to-[#040507]/85"
        >
          {/* Left Column: Custom Inline SVG Emblem & Atmosphere */}
          <div className="flex flex-col justify-between max-w-xl">
            <div>
              {/* Custom Inline SVG Horror Title Lockup */}
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-11 h-11 text-amber-500 shrink-0" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
                  <path
                    d="M10 24h5l3-9 4 18 4-14 3 10 3-5h6"
                    stroke="#F43F5E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-mono text-xs tracking-[0.25em] text-amber-400 uppercase">
                  120 FPS · GLSL SHADERS · SURVIVAL HORROR
                </span>
              </div>

              <h1 className="font-['Unbounded'] text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-none">
                ТИШИНА
                <span className="block text-xl sm:text-2xl text-amber-500 font-bold mt-2 tracking-normal">
                  7 дней выживания · Ultra Edition
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#9499A3] leading-relaxed max-w-lg">
                Ты заперт в доме посреди ослепшего апокалипсиса. Монстры не видят во тьме, но слышат каждый шорох, скрип половиц и твоё дыхание. Следи за постоянной шкалой шума слева, экономь батарею фонарика, собирай ресурсы и крафти капканы, чтобы дожить до рассвета седьмого дня.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPauseFromMenu(true);
                    setPauseTab(2);
                    setScreenMode('paused');
                  }}
                  data-testid="menu-settings-btn"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-bold text-white cursor-pointer"
                >
                  Настройки (120 FPS и Шейдеры)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPauseFromMenu(true);
                    setPauseTab(1);
                    refreshSaveSlots();
                    setScreenMode('paused');
                  }}
                  data-testid="menu-checkpoints-btn"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-bold text-amber-300 cursor-pointer"
                >
                  Ключевые точки ({ Object.keys(loadAllCheckpoints()).length })
                </button>
              </div>

              <div className="text-xs font-mono text-[#9499A3]">
                WASD Ходьба · C Присед · F Фонарик · V Батарея · I/C Инвентарь и Крафт · T Капкан · Z Приманка
              </div>
            </div>
          </div>

          {/* Right Column: Difficulty Cards & Primary Start CTA */}
          <div className="flex flex-col justify-center gap-3.5 w-full lg:w-[420px] mt-6 lg:mt-0">
            {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((k) => {
              const d = DIFFICULTIES[k];
              const selected = selDiff === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSelDiff(k);
                    sfx.click();
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selected
                      ? 'bg-amber-950/45 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                      : 'bg-[#111318]/80 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Unbounded'] font-bold text-base text-white">{d.name}</span>
                    {selected && (
                      <span className="font-mono text-xs font-bold text-amber-400">ВЫБРАНО</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#9499A3] leading-relaxed">{d.desc}</p>
                </button>
              );
            })}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                data-start="true"
                data-testid="start-game-btn"
                onClick={() => engineApiRef.current?.startNewGame(selDiff)}
                className="flex-1 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-['Unbounded'] font-bold text-sm tracking-tight shadow-[0_10px_28px_rgba(245,158,11,0.45)] active:scale-98 transition-transform cursor-pointer"
              >
                НАЧАТЬ ВЫЖИВАНИЕ
              </button>
              {hasSavedGame && (
                <button
                  type="button"
                  data-testid="continue-game-btn"
                  onClick={handleContinueSaved}
                  className="py-3.5 px-5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm cursor-pointer"
                >
                  Продолжить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INVENTORY & CRAFTING WORKSHOP MODAL
         ===================================================================== */}
      <InventoryModal
        open={invOpen}
        inv={uiSnapshot.inv}
        hp={uiSnapshot.hp}
        hpMax={uiSnapshot.hpMax}
        food={uiSnapshot.food}
        water={uiSnapshot.water}
        battery={uiSnapshot.battery}
        doorHp={uiSnapshot.doorHp}
        weapons={uiSnapshot.weapons}
        ammo={uiSnapshot.ammo}
        curWeapon={uiSnapshot.curWeapon}
        onClose={() => {
          setInvOpen(false);
          engineApiRef.current?.setPausedState(false);
        }}
        onUseConsumable={(t) => engineApiRef.current?.useConsumable(t)}
        onUseDefenseTool={(t) => engineApiRef.current?.useDefenseTool(t)}
        onCraftRecipe={(r) => engineApiRef.current?.craftItem(r)}
        onSelectWeapon={(w) => engineApiRef.current?.selectWeapon(w)}
      />

      {/* =====================================================================
          PAUSE, CHECKPOINT SAVES, SETTINGS & DIRECTOR MOD MENU
         ===================================================================== */}
      <PauseSettingsModal
        open={screenMode === 'paused'}
        initialTab={pauseTab}
        isFromMainMenu={isPauseFromMenu}
        cfg={cfg}
        mod={mod}
        micOn={micActive}
        slots={slotsList}
        onClose={() => {
          if (isPauseFromMenu) {
            setScreenMode('title');
          } else {
            engineApiRef.current?.setPausedState(false);
            setScreenMode('playing');
          }
        }}
        onReturnToMenu={() => engineApiRef.current?.returnToTitle()}
        onUpdateCfg={(partial) => setCfg((prev) => ({ ...prev, ...partial }))}
        onUpdateMod={(partial) => setMod((prev) => ({ ...prev, ...partial }))}
        onToggleMic={(on) => engineApiRef.current?.toggleMic(on)}
        onSaveSlot={(slotId) => engineApiRef.current?.saveToSlot(slotId)}
        onLoadSlot={(slotId) => {
          const all = loadAllCheckpoints();
          const cp = all[slotId];
          if (cp) engineApiRef.current?.loadCheckpointData(cp);
        }}
        onModAction={(act) => engineApiRef.current?.execModAction(act)}
      />

      {/* =====================================================================
          GAME OVER / VICTORY MODAL
         ===================================================================== */}
      {screenMode === 'gameover' && endData && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="gameover-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 text-center"
        >
          <div className="max-w-lg w-full p-7 rounded-2xl bg-[#111318] border border-white/15 shadow-2xl space-y-5">
            <h2
              className={`font-['Unbounded'] text-3xl sm:text-5xl font-extrabold tracking-tight ${
                endData.win ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              {endData.win ? 'ТЫ ДОЖИЛ ДО РАССВЕТА!' : 'ТИШИНА НАРУШЕНА'}
            </h2>
            <p className="text-sm text-[#9499A3]">
              {endData.win
                ? 'Семь ночей кошмара позади. Спасательный отряд услышал сигнал твоей рации.'
                : `Ты погиб в День ${endData.day} (${endData.clock}). Монстры пошли на звук.`}
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2 font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xl font-bold text-white">{endData.kills}</div>
                <div className="text-[11px] text-[#9499A3]">Убито зомби</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xl font-bold text-white">{endData.hides}</div>
                <div className="text-[11px] text-[#9499A3]">Укрытий</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xl font-bold text-white">{endData.trips}</div>
                <div className="text-[11px] text-[#9499A3]">Вылазок</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {hasSavedGame && (
                <button
                  type="button"
                  data-start="true"
                  onClick={handleContinueSaved}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm cursor-pointer"
                >
                  Загрузить ключевую точку
                </button>
              )}
              <button
                type="button"
                data-start="true"
                onClick={() => engineApiRef.current?.startNewGame(selDiff)}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm cursor-pointer"
              >
                Начать заново
              </button>
              <button
                type="button"
                onClick={() => engineApiRef.current?.returnToTitle()}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm cursor-pointer"
              >
                В главное меню
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
