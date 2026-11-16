import { WEAPONS, WeaponKey, SurfaceMaterial } from './rules';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

class HorrorAudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  ambientGain: GainNode | null = null;
  lp: BiquadFilterNode | null = null;
  nb: AudioBuffer | null = null;
  distCurve: Float32Array<ArrayBuffer> | null = null;
  vol = 0.9;
  ambientVol = 0.78;
  screamVol = 1.0;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new C();
      this.ctx = c;
      this.master = c.createGain();
      this.master.gain.value = this.vol;

      this.lp = c.createBiquadFilter();
      this.lp.type = 'lowpass';
      this.lp.frequency.value = 18500;

      this.master.connect(this.lp);
      this.lp.connect(c.destination);

      // Brown/pink-weighted dark noise buffer (no harsh toy white-noise hiss)
      const len = c.sampleRate * 2.5;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.08 * white) / 1.08;
        d[i] = clamp(lastOut * 2.6 + white * 0.35, -1, 1);
      }
      this.nb = b;

      // Nonlinear saturation curve for visceral monster screams
      const samples = 4096;
      const curve = new Float32Array(new ArrayBuffer(samples * 4));
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + 28) * x * 20 * (Math.PI / 180)) / (Math.PI + 28 * Math.abs(x));
      }
      this.distCurve = curve;

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

  setScreamVolume(v: number) {
    this.screamVol = clamp(v, 0, 1.5);
  }

  setOcclusion(hidden: boolean, dt: number) {
    if (!this.lp) return;
    const target = hidden ? 620 : 18500;
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
    f.frequency.setValueAtTime(o.f || 700, t);
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

    // Deep oppressive abyssal wind & structural groan
    const s = c.createBufferSource();
    s.buffer = this.nb;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 185;
    f.Q.value = 1.1;
    const g = c.createGain();
    g.gain.value = 0.068;

    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = c.createGain();
    lg.gain.value = 0.042;
    lfo.connect(lg);
    lg.connect(g.gain);

    s.connect(f);
    f.connect(g);
    g.connect(ambRoot);
    s.start();
    lfo.start();

    // Dark sub-bass infrasonic horror drone (31Hz, 31.6Hz, and 46.5Hz tritone)
    [31, 31.6, 46.5].forEach((fr, idx) => {
      const o = c.createOscillator();
      o.type = idx === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = fr;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = idx === 2 ? 95 : 68;
      const gg = c.createGain();
      gg.gain.value = idx === 2 ? 0.028 : 0.058;
      o.connect(lp);
      lp.connect(gg);
      gg.connect(ambRoot);
      o.start();
    });
  }

  shot(k: WeaponKey) {
    if (k === 'deagle') {
      this.nburst({ type: 'bandpass', f: 1650, f2: 380, vol: 0.92, d: 0.25, q: 0.7 });
      this.tone({ f: 145, f2: 34, vol: 1, d: 0.28 });
      this.nburst({ type: 'lowpass', f: 560, vol: 0.34, d: 0.75, delay: 0.08 });
    } else if (k === 'shotgun') {
      this.nburst({ type: 'lowpass', f: 2400, f2: 140, vol: 1, d: 0.52, q: 0.6 });
      this.tone({ f: 108, f2: 25, vol: 1, d: 0.48 });
      this.nburst({ type: 'lowpass', f: 440, vol: 0.45, d: 1.05, delay: 0.1 });
    } else {
      this.nburst({ type: 'highpass', f: 1100, f2: 280, vol: 1, d: 0.48 });
      this.tone({ f: 92, f2: 22, vol: 1, d: 0.65 });
      this.nburst({ type: 'lowpass', f: 520, vol: 0.52, d: 1.65, delay: 0.14 });
    }
  }

  step(v: number, surface: SurfaceMaterial = 'wood', creak = false, pan?: number) {
    if (surface === 'concrete') {
      this.nburst({
        type: 'bandpass',
        f: 1320 + rnd(-100, 100),
        f2: 740,
        vol: 0.13 * v,
        d: 0.065,
        q: 2.2,
        a: 0.002,
        pan,
      });
      this.nburst({
        type: 'highpass',
        f: 2100 + rnd(-150, 150),
        vol: 0.07 * v,
        d: 0.04,
        a: 0.001,
        pan,
      });
      this.nburst({
        type: 'bandpass',
        f: 620,
        vol: 0.045 * v,
        d: 0.09,
        q: 1.4,
        delay: 0.032,
        pan,
      });
    } else if (surface === 'rug') {
      this.nburst({
        type: 'lowpass',
        f: 195 + rnd(-20, 20),
        vol: 0.065 * v,
        d: 0.1,
        a: 0.008,
        pan,
      });
    } else {
      this.nburst({
        type: 'lowpass',
        f: 310 + rnd(-30, 30),
        vol: 0.125 * v,
        d: 0.095,
        a: 0.003,
        pan,
      });
      this.tone({
        type: 'triangle',
        f: 122 + rnd(-10, 10),
        f2: 62,
        vol: 0.08 * v,
        d: 0.085,
        a: 0.002,
        pan,
      });
      if (creak) {
        this.tone({
          type: 'sawtooth',
          f: rnd(195, 255),
          f2: rnd(125, 165),
          vol: 0.06 * v,
          d: 0.22,
          delay: 0.02,
          pan,
        });
      }
    }
  }

  // Deep tactile mechanical click (no high-pitched toy beep)
  click() {
    this.nburst({ type: 'bandpass', f: 680, f2: 320, vol: 0.09, d: 0.028, q: 2.2 });
    this.tone({ type: 'triangle', f: 240, f2: 110, vol: 0.07, d: 0.025 });
  }

  torchToggle(on: boolean) {
    this.nburst({ type: 'bandpass', f: on ? 1150 : 780, vol: 0.14, d: 0.035, q: 1.8 });
    this.tone({ type: 'triangle', f: on ? 320 : 210, f2: on ? 180 : 120, vol: 0.09, d: 0.04 });
  }

  batterySwap() {
    this.nburst({ type: 'bandpass', f: 640, vol: 0.18, d: 0.07 });
    this.tone({ type: 'triangle', f: 180, f2: 290, vol: 0.15, d: 0.12, delay: 0.08 });
  }

  empty() {
    this.nburst({ type: 'bandpass', f: 780, f2: 420, vol: 0.12, d: 0.045 });
    this.tone({ type: 'triangle', f: 280, f2: 140, vol: 0.09, d: 0.05 });
  }

  pickup() {
    this.nburst({ type: 'lowpass', f: 520, vol: 0.2, d: 0.09 });
    this.tone({ type: 'triangle', f: 220, f2: 340, vol: 0.14, d: 0.11, delay: 0.04 });
  }

  craft() {
    this.nburst({ type: 'bandpass', f: 980, f2: 460, vol: 0.24, d: 0.11 });
    this.tone({ type: 'sawtooth', f: 185, f2: 115, vol: 0.18, d: 0.14, delay: 0.07 });
    this.nburst({ type: 'lowpass', f: 640, vol: 0.22, d: 0.14, delay: 0.16 });
  }

  trapPlace() {
    this.tone({ type: 'sawtooth', f: 210, f2: 82, vol: 0.28, d: 0.15 });
    this.nburst({ type: 'bandpass', f: 940, vol: 0.26, d: 0.09, delay: 0.05 });
  }

  trapSnap(pan = 0) {
    this.tone({ type: 'sawtooth', f: 520, f2: 68, vol: 0.88, d: 0.26, pan });
    this.nburst({ type: 'bandpass', f: 1250, f2: 380, vol: 0.78, d: 0.22, pan });
  }

  // Dark metallic acoustic resonator instead of a toy alarm clock
  decoyRing(pan = 0, vol = 0.5) {
    for (let i = 0; i < 3; i++) {
      this.tone({
        type: 'sawtooth',
        f: i % 2 === 0 ? 580 : 430,
        f2: 290,
        vol: 0.24 * vol,
        d: 0.08,
        delay: i * 0.085,
        pan,
      });
      this.nburst({
        type: 'bandpass',
        f: 920,
        vol: 0.16 * vol,
        d: 0.06,
        delay: i * 0.085,
        pan,
      });
    }
  }

  flareHiss(pan = 0) {
    this.nburst({ type: 'bandpass', f: 1150, f2: 680, vol: 0.34, d: 0.55, q: 1.2, pan });
    this.tone({ type: 'sawtooth', f: 145, f2: 78, vol: 0.22, d: 0.35, pan });
  }

  adrenalineInject() {
    this.nburst({ type: 'bandpass', f: 840, f2: 390, vol: 0.25, d: 0.18 });
    this.tone({ type: 'sine', f: 72, f2: 46, vol: 0.45, d: 0.35, delay: 0.08 });
  }

  eat() {
    for (let i = 0; i < 3; i++) {
      this.nburst({ type: 'lowpass', f: 680, vol: 0.22, d: 0.08, delay: i * 0.18 });
    }
  }

  drink() {
    for (let i = 0; i < 3; i++) {
      this.nburst({ type: 'bandpass', f: 420, f2: 260, vol: 0.18, d: 0.14, delay: i * 0.22 });
    }
  }

  reload(k: WeaponKey) {
    this.nburst({ type: 'bandpass', f: 820, vol: 0.14, d: 0.05 });
    if (k === 'shotgun') {
      for (let i = 0; i < 5; i++) {
        this.nburst({ type: 'bandpass', f: 1150, vol: 0.2, d: 0.06, delay: 0.15 + i * 0.3 });
      }
    } else {
      this.nburst({ type: 'bandpass', f: 960, vol: 0.22, d: 0.07, delay: 0.5 });
      this.tone({ type: 'triangle', f: 340, f2: 180, vol: 0.14, d: 0.06, delay: 1.0 });
    }
    this.tone({
      type: 'triangle',
      f: 260,
      f2: 130,
      vol: 0.15,
      d: 0.08,
      delay: Math.max(0.5, WEAPONS[k].reload - 0.25),
    });
  }

  pump() {
    this.nburst({ type: 'bandpass', f: 640, vol: 0.18, d: 0.06 });
    this.nburst({ type: 'bandpass', f: 520, vol: 0.18, d: 0.07, delay: 0.16 });
  }

  hurt() {
    this.nburst({ type: 'lowpass', f: 480, vol: 0.62, d: 0.28 });
    this.tone({ f: 128, f2: 38, vol: 0.68, d: 0.32 });
  }

  gasp() {
    this.nburst({ type: 'bandpass', f: 780, f2: 360, vol: 0.48, d: 0.42, q: 1.6 });
  }

  beat(v: number) {
    this.tone({ f: 54, f2: 34, vol: 0.65 * v, d: 0.15 });
    this.tone({ f: 48, f2: 31, vol: 0.48 * v, d: 0.16, delay: 0.21 });
  }

  // Heavy shortness of breath / panting ("отдышка") with inhalation & exhalation formants
  pant(v: number) {
    const pv = clamp(v, 0.08, 1);
    // Sharp gasping inhalation
    this.nburst({
      type: 'bandpass',
      f: 920,
      f2: 1280,
      vol: 0.22 * pv,
      d: 0.22,
      a: 0.03,
      q: 2.4,
    });
    // Exhausted wheezing exhalation
    this.nburst({
      type: 'bandpass',
      f: 640,
      f2: 340,
      vol: 0.28 * pv,
      d: 0.34,
      a: 0.04,
      q: 1.8,
      delay: 0.27,
    });
  }

  bang() {
    this.tone({ f: 72, f2: 20, vol: 1, d: 0.65 });
    this.nburst({ type: 'lowpass', f: 920, f2: 160, vol: 1, d: 0.45 });
    this.nburst({ type: 'bandpass', f: 1400, vol: 0.45, d: 0.18, delay: 0.04 });
  }

  knock(pan = 0) {
    this.tone({ f: 96, f2: 52, vol: 0.56, d: 0.14, pan });
    this.tone({ f: 88, f2: 48, vol: 0.56, d: 0.14, delay: 0.29, pan });
  }

  thunder() {
    this.nburst({ type: 'lowpass', f: 240, f2: 44, vol: 0.88, d: 2.4, a: 0.04 });
    this.tone({ type: 'triangle', f: 58, f2: 21, vol: 0.75, d: 1.8 });
  }

  whisper(pan = 0) {
    this.nburst({
      type: 'bandpass',
      f: rnd(620, 980),
      f2: rnd(340, 520),
      vol: 0.2,
      d: 0.75,
      a: 0.14,
      q: 3.2,
      pan,
    });
    this.nburst({
      type: 'bandpass',
      f: rnd(720, 1120),
      f2: rnd(380, 580),
      vol: 0.15,
      d: 0.6,
      a: 0.12,
      delay: 0.36,
      q: 3.8,
      pan: -pan,
    });
  }

  hit() {
    this.nburst({ type: 'bandpass', f: 680, f2: 260, vol: 0.24, d: 0.06 });
  }

  groan(pan: number, vol: number, pitchMul = 1) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(rnd(54, 78) * pitchMul, t);
    o.frequency.linearRampToValueAtTime(rnd(36, 56) * pitchMul, t + 1.5);

    const lfo = c.createOscillator();
    lfo.frequency.value = rnd(4.5, 8.5);
    const lg = c.createGain();
    lg.gain.value = 6.5;
    lfo.connect(lg);
    lg.connect(o.frequency);

    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2.8;
    f.frequency.setValueAtTime(rnd(260, 420), t);
    f.frequency.linearRampToValueAtTime(rnd(480, 680), t + 0.7);
    f.frequency.linearRampToValueAtTime(rnd(180, 280), t + 1.5);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, 0.54 * vol), t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.55);

    o.connect(f);
    f.connect(g);
    this.outNode(g, pan);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1.65);
    lfo.stop(t + 1.65);

    this.nburst({ type: 'bandpass', f: 520, vol: 0.16 * vol, d: 0.95, a: 0.28, pan });
  }

  /**
   * Truly terrifying multi-layered vocal-formant monster scream & abyssal roar.
   * Uses 3 vocal tract formant filters + nonlinear saturation + sub-bass chest slam.
   */
  monsterScream(intensity = 1, pan = 0) {
    if (!this.ctx || intensity <= 0 || this.screamVol <= 0) return;
    const c = this.ctx;
    const t = c.currentTime;
    const v = clamp(intensity * this.screamVol, 0.05, 1.6);
    const dur = 1.35;

    // 1. Sub-bass infrasonic dread slam (115Hz -> 24Hz)
    this.tone({
      type: 'sine',
      f: 115,
      f2: 24,
      vol: Math.min(1, 0.92 * v),
      d: 1.15,
      a: 0.004,
      pan,
    });

    // 2. Vocal tract formant synthesis with nonlinear wave-shaper distortion
    const screamMix = c.createGain();
    screamMix.gain.setValueAtTime(0.0001, t);
    screamMix.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.42 * v), t + 0.035);
    screamMix.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.28 * v), t + 0.65);
    screamMix.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const shaper = c.createWaveShaper();
    if (this.distCurve) {
      shaper.curve = this.distCurve;
      shaper.oversample = '2x';
    }

    // 3 parallel vocal formants (throated pharyngeal + nasal + raspy shriek)
    const formants = [
      { fStart: 420, fPeak: 580, fEnd: 270, q: 4.2 },
      { fStart: 1150, fPeak: 1480, fEnd: 740, q: 5.0 },
      { fStart: 2550, fPeak: 3100, fEnd: 1380, q: 6.0 },
    ];

    const formantBus = c.createGain();
    formantBus.gain.value = 0.7;

    formants.forEach((fm) => {
      const bf = c.createBiquadFilter();
      bf.type = 'bandpass';
      bf.Q.value = fm.q;
      bf.frequency.setValueAtTime(fm.fStart, t);
      bf.frequency.linearRampToValueAtTime(fm.fPeak, t + 0.18);
      bf.frequency.exponentialRampToValueAtTime(fm.fEnd, t + dur);
      formantBus.connect(bf);
      bf.connect(shaper);
    });

    // Rapid guttural throat-flutter LFO (21 Hz)
    const throatLfo = c.createOscillator();
    throatLfo.type = 'sawtooth';
    throatLfo.frequency.value = 21;
    const throatGain = c.createGain();
    throatGain.gain.value = 26;
    throatLfo.connect(throatGain);

    // Detuned vocal cord oscillators (guttural base + dissonant shriek harmonics)
    const cordFreqs = [94, 188, 197, 284, 398];
    cordFreqs.forEach((baseF, idx) => {
      const osc = c.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(baseF * 0.92, t);
      osc.frequency.linearRampToValueAtTime(baseF * 1.34, t + 0.14);
      osc.frequency.exponentialRampToValueAtTime(baseF * 0.62, t + dur);
      throatGain.connect(osc.frequency);
      osc.connect(formantBus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });

    throatLfo.start(t);
    throatLfo.stop(t + dur + 0.05);

    shaper.connect(screamMix);
    this.outNode(screamMix, pan);

    // 3. Torn raspy breath & guttural air roar
    this.nburst({
      type: 'bandpass',
      f: 1420,
      f2: 460,
      vol: Math.min(0.95, 0.65 * v),
      d: dur,
      q: 1.5,
      a: 0.015,
      pan,
    });
  }

  scream() {
    this.monsterScream(0.85, 0);
  }

  /**
   * Dark atmospheric terror sting + monster scream (replaces cheap pop-up jumpscare noises)
   */
  jumpscareSting(intensity = 1) {
    if (!this.ctx || intensity <= 0 || this.screamVol <= 0) return;
    this.monsterScream(intensity, 0);
  }
}

export const sfx = new HorrorAudioEngine();
