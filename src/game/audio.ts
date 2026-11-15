import { WEAPONS, WeaponKey } from './rules';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

class HorrorAudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  ambientGain: GainNode | null = null;
  lp: BiquadFilterNode | null = null;
  nb: AudioBuffer | null = null;
  vol = 0.9;
  ambientVol = 0.75;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new C();
      this.ctx = c;
      this.master = c.createGain();
      this.master.gain.value = this.vol;

      this.lp = c.createBiquadFilter();
      this.lp.type = 'lowpass';
      this.lp.frequency.value = 20000;

      this.master.connect(this.lp);
      this.lp.connect(c.destination);

      const len = c.sampleRate * 2;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = Math.random() * 2 - 1;
      }
      this.nb = b;
      this.startAmbience();
    } catch {
      this.ctx = null;
    }
  }

  setVolume(v: number) {
    this.vol = v;
    if (this.master) this.master.gain.value = v;
  }

  setAmbientVolume(v: number) {
    this.ambientVol = v;
    if (this.ambientGain) this.ambientGain.gain.value = v;
  }

  setOcclusion(hidden: boolean, dt: number) {
    if (!this.lp) return;
    const target = hidden ? 720 : 20000;
    this.lp.frequency.value += (target - this.lp.frequency.value) * Math.min(1, dt * 6);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private outNode(n: AudioNode, pan?: number) {
    if (!this.ctx || !this.master) return;
    if (typeof pan === 'number' && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      n.connect(p);
      p.connect(this.master);
    } else {
      n.connect(this.master);
    }
  }

  nburst(o: {
    type?: BiquadFilterType;
    f?: number;
    f2?: number;
    vol?: number;
    d?: number;
    q?: number;
    a?: number;
    delay?: number;
    pan?: number;
  }) {
    if (!this.ctx || !this.nb) return;
    const c = this.ctx;
    const t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource();
    s.buffer = this.nb;
    s.loop = true;

    const f = c.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 800, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.d || 0.2));
    f.Q.value = o.q || 1;

    const g = c.createGain();
    const a = o.a || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol || 0.5), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (o.d || 0.2));

    s.connect(f);
    f.connect(g);
    this.outNode(g, o.pan);
    s.start(t, Math.random());
    s.stop(t + a + (o.d || 0.2) + 0.05);
  }

  tone(o: {
    type?: OscillatorType;
    f?: number;
    f2?: number;
    vol?: number;
    d?: number;
    a?: number;
    delay?: number;
    pan?: number;
  }) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + (o.delay || 0);
    const os = c.createOscillator();
    os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f || 100, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.d || 0.2));

    const g = c.createGain();
    const a = o.a || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol || 0.4), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (o.d || 0.2));

    os.connect(g);
    this.outNode(g, o.pan);
    os.start(t);
    os.stop(t + a + (o.d || 0.2) + 0.05);
  }

  private startAmbience() {
    if (!this.ctx || !this.nb || !this.master) return;
    const c = this.ctx;
    const ambRoot = c.createGain();
    ambRoot.gain.value = this.ambientVol;
    ambRoot.connect(this.master);
    this.ambientGain = ambRoot;

    // Eerie wind & room tone
    const s = c.createBufferSource();
    s.buffer = this.nb;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 320;
    f.Q.value = 0.85;
    const g = c.createGain();
    g.gain.value = 0.055;

    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lg = c.createGain();
    lg.gain.value = 0.038;
    lfo.connect(lg);
    lg.connect(g.gain);

    s.connect(f);
    f.connect(g);
    g.connect(ambRoot);
    s.start();
    lfo.start();

    // Detuned sub-bass horror drone (37Hz & 37.7Hz) + dissonant minor 2nd ghostly harmonic
    [37, 37.7, 55.5].forEach((fr, idx) => {
      const o = c.createOscillator();
      o.type = idx === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = fr;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = idx === 2 ? 120 : 82;
      const gg = c.createGain();
      gg.gain.value = idx === 2 ? 0.025 : 0.052;
      o.connect(lp);
      lp.connect(gg);
      gg.connect(ambRoot);
      o.start();
    });
  }

  shot(k: WeaponKey) {
    if (k === 'deagle') {
      this.nburst({ type: 'bandpass', f: 2200, f2: 500, vol: 0.9, d: 0.22, q: 0.6 });
      this.tone({ f: 170, f2: 40, vol: 1, d: 0.25 });
      this.nburst({ type: 'lowpass', f: 700, vol: 0.28, d: 0.7, delay: 0.1 });
    } else if (k === 'shotgun') {
      this.nburst({ type: 'lowpass', f: 3200, f2: 180, vol: 1, d: 0.5, q: 0.5 });
      this.tone({ f: 120, f2: 28, vol: 1, d: 0.45 });
      this.nburst({ type: 'lowpass', f: 500, vol: 0.4, d: 1.0, delay: 0.12 });
    } else {
      this.nburst({ type: 'highpass', f: 1500, f2: 400, vol: 1, d: 0.45 });
      this.tone({ f: 100, f2: 26, vol: 1, d: 0.6 });
      this.nburst({ type: 'lowpass', f: 600, vol: 0.5, d: 1.6, delay: 0.15 });
    }
  }

  step(v: number, creak = false) {
    this.nburst({ type: 'lowpass', f: 390 + rnd(-40, 40), vol: 0.12 * v, d: 0.09, a: 0.003 });
    if (creak) {
      this.tone({ type: 'sawtooth', f: rnd(260, 340), f2: rnd(180, 220), vol: 0.06 * v, d: 0.18, delay: 0.02 });
    }
  }

  click() {
    this.tone({ type: 'square', f: 1700, vol: 0.07, d: 0.03 });
  }

  torchToggle(on: boolean) {
    this.tone({ type: 'square', f: on ? 1950 : 1350, vol: 0.09, d: 0.035 });
    this.nburst({ type: 'bandpass', f: 3400, vol: 0.12, d: 0.03 });
  }

  batterySwap() {
    this.tone({ type: 'triangle', f: 520, f2: 880, vol: 0.16, d: 0.1 });
    this.tone({ type: 'sine', f: 1040, f2: 1480, vol: 0.14, d: 0.14, delay: 0.1 });
  }

  empty() {
    this.tone({ type: 'square', f: 900, f2: 500, vol: 0.1, d: 0.05 });
  }

  pickup() {
    this.tone({ type: 'triangle', f: 560, f2: 900, vol: 0.18, d: 0.12 });
    this.tone({ type: 'triangle', f: 900, f2: 1200, vol: 0.12, d: 0.1, delay: 0.08 });
  }

  craft() {
    this.nburst({ type: 'bandpass', f: 2100, vol: 0.22, d: 0.08 });
    this.tone({ type: 'triangle', f: 420, f2: 680, vol: 0.18, d: 0.12, delay: 0.07 });
    this.tone({ type: 'triangle', f: 740, f2: 1120, vol: 0.18, d: 0.15, delay: 0.16 });
  }

  trapPlace() {
    this.tone({ type: 'sawtooth', f: 320, f2: 140, vol: 0.24, d: 0.12 });
    this.nburst({ type: 'bandpass', f: 1800, vol: 0.25, d: 0.08, delay: 0.05 });
  }

  trapSnap(pan = 0) {
    this.tone({ type: 'sawtooth', f: 920, f2: 110, vol: 0.85, d: 0.22, pan });
    this.nburst({ type: 'highpass', f: 1800, vol: 0.7, d: 0.18, pan });
  }

  decoyRing(pan = 0, vol = 0.5) {
    for (let i = 0; i < 4; i++) {
      this.tone({
        type: 'square',
        f: i % 2 === 0 ? 2400 : 2850,
        vol: 0.22 * vol,
        d: 0.045,
        delay: i * 0.055,
        pan,
      });
    }
  }

  eat() {
    for (let i = 0; i < 4; i++) {
      this.nburst({ type: 'bandpass', f: 2400, vol: 0.25, d: 0.07, delay: i * 0.16 });
    }
  }

  drink() {
    for (let i = 0; i < 3; i++) {
      this.tone({ f: 320, f2: 720, vol: 0.16, d: 0.12, delay: i * 0.22 });
    }
    this.nburst({ type: 'bandpass', f: 1500, vol: 0.08, d: 0.6 });
  }

  reload(k: WeaponKey) {
    this.tone({ type: 'square', f: 1400, vol: 0.07, d: 0.04 });
    if (k === 'shotgun') {
      for (let i = 0; i < 5; i++) {
        this.nburst({ type: 'bandpass', f: 3000, vol: 0.2, d: 0.05, delay: 0.15 + i * 0.3 });
      }
    } else {
      this.nburst({ type: 'bandpass', f: 2500, vol: 0.2, d: 0.06, delay: 0.5 });
      this.tone({ type: 'square', f: 1100, vol: 0.09, d: 0.05, delay: 1.0 });
    }
    this.tone({
      type: 'square',
      f: 700,
      vol: 0.09,
      d: 0.06,
      delay: Math.max(0.5, WEAPONS[k].reload - 0.25),
    });
  }

  pump() {
    this.tone({ type: 'square', f: 600, vol: 0.1, d: 0.05 });
    this.tone({ type: 'square', f: 420, vol: 0.1, d: 0.06, delay: 0.18 });
  }

  hurt() {
    this.nburst({ type: 'lowpass', f: 600, vol: 0.55, d: 0.25 });
    this.tone({ f: 150, f2: 52, vol: 0.6, d: 0.28 });
  }

  gasp() {
    this.nburst({ type: 'bandpass', f: 1300, f2: 700, vol: 0.55, d: 0.35, q: 1.5 });
  }

  beat(v: number) {
    this.tone({ f: 58, f2: 38, vol: 0.6 * v, d: 0.14 });
    this.tone({ f: 52, f2: 36, vol: 0.45 * v, d: 0.14, delay: 0.2 });
  }

  bang() {
    this.tone({ f: 75, f2: 22, vol: 1, d: 0.6 });
    this.nburst({ type: 'lowpass', f: 1200, f2: 200, vol: 1, d: 0.4 });
    this.nburst({ type: 'highpass', f: 2500, vol: 0.5, d: 0.15, delay: 0.05 });
  }

  knock(pan = 0) {
    this.tone({ f: 110, f2: 70, vol: 0.52, d: 0.12, pan });
    this.tone({ f: 105, f2: 65, vol: 0.52, d: 0.12, delay: 0.28, pan });
  }

  thunder() {
    this.nburst({ type: 'lowpass', f: 280, f2: 55, vol: 0.85, d: 2.2, a: 0.04 });
    this.tone({ type: 'triangle', f: 64, f2: 24, vol: 0.7, d: 1.6 });
  }

  whisper(pan = 0) {
    this.nburst({ type: 'bandpass', f: rnd(1600, 2600), f2: rnd(900, 1400), vol: 0.18, d: 0.65, a: 0.12, q: 3.5, pan });
    this.nburst({ type: 'bandpass', f: rnd(1900, 2900), f2: rnd(1100, 1500), vol: 0.14, d: 0.5, a: 0.1, delay: 0.35, q: 4, pan: -pan });
  }

  hit() {
    this.tone({ type: 'square', f: 1900, vol: 0.12, d: 0.04 });
  }

  groan(pan: number, vol: number, pitchMul = 1) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(rnd(64, 90) * pitchMul, t);
    o.frequency.linearRampToValueAtTime(rnd(44, 68) * pitchMul, t + 1.4);

    const lfo = c.createOscillator();
    lfo.frequency.value = rnd(4, 7.5);
    const lg = c.createGain();
    lg.gain.value = 7;
    lfo.connect(lg);
    lg.connect(o.frequency);

    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(rnd(350, 500), t);
    f.frequency.linearRampToValueAtTime(rnd(600, 820), t + 0.7);
    f.frequency.linearRampToValueAtTime(rnd(240, 340), t + 1.4);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, 0.52 * vol), t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

    o.connect(f);
    f.connect(g);
    this.outNode(g, pan);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1.6);
    lfo.stop(t + 1.6);

    this.nburst({ type: 'bandpass', f: 900, vol: 0.14 * vol, d: 0.9, a: 0.3, pan });
  }

  scream() {
    this.nburst({ type: 'bandpass', f: 1850, f2: 880, vol: 0.65, d: 0.75, q: 2 });
    this.tone({ type: 'sawtooth', f: 410, f2: 210, vol: 0.4, d: 0.75 });
  }

  /**
   * Terrifying multi-layer horror jumpscare sting:
   * Dissonant shrieking cluster + metallic noise burst + sub-bass heart stop
   */
  jumpscareSting(intensity = 1) {
    if (!this.ctx || intensity <= 0) return;
    const v = clamp(intensity, 0.2, 1.3);
    // Sub-bass slam
    this.tone({ type: 'sine', f: 135, f2: 24, vol: 0.95 * v, d: 0.85, a: 0.002 });
    // Metallic screech noise
    this.nburst({ type: 'bandpass', f: 2800, f2: 720, vol: 0.75 * v, d: 0.7, q: 2.2, a: 0.003 });
    // Dissonant horror chord (minor 2nds & tritones sliding down)
    const freqs = [587.3, 622.2, 830.6, 1174.6, 1244.5];
    freqs.forEach((fr, i) => {
      this.tone({
        type: 'sawtooth',
        f: fr,
        f2: fr * (i % 2 === 0 ? 0.72 : 1.18),
        vol: 0.24 * v,
        d: 0.78,
        a: 0.005,
        pan: (i - 2) * 0.35,
      });
    });
  }
}

export const sfx = new HorrorAudioEngine();
