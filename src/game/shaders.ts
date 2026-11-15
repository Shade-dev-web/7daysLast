import * as THREE from 'three';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const horrorShaderUniforms = {
  uTime: { value: 0 },
  uFear: { value: 0 },
  uShaderQuality: { value: 1 },
};

export function createVolumetricBeamMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xfff1d0,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function createGodRayMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xcfe0ff,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
}

export function enhanceHorrorMaterial(mat: THREE.MeshStandardMaterial) {
  return mat;
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number) {
  for (let i = 0; i < n; i++) {
    const v = Math.random() * 70;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function stains(g: CanvasRenderingContext2D, w: number, h: number, n: number, col?: string) {
  const c = col || '30,20,10';
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 20 + Math.random() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${c},${0.06 + Math.random() * 0.15})`);
    gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export function buildProceduralTextures(maxAnisotropy: number) {
  const aniso = Math.min(maxAnisotropy || 1, 2);
  const canvasTex = (
    w: number,
    h: number,
    fn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    rx?: number,
    ry?: number
  ) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    fn(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rx && ry) t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  };

  const wallTex = (hh: number, s: number, l: number, kind: string) =>
    canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = `hsl(${hh},${s}%,${l}%)`;
      g.fillRect(0, 0, w, h);
      if (kind === 'stripe') {
        for (let x = 0; x < w; x += 32) {
          g.fillStyle = 'rgba(0,0,0,.07)';
          g.fillRect(x, 0, 16, h);
        }
      }
      if (kind === 'tile') {
        g.strokeStyle = 'rgba(0,0,0,.22)';
        g.lineWidth = 2;
        for (let x = 0; x < w; x += 64) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, h);
          g.stroke();
        }
        for (let y = 0; y < h; y += 64) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(w, y);
          g.stroke();
        }
      }
      stains(g, w, h, 14);
      speckle(g, w, h, 2400, 0.35);
      const gr = g.createLinearGradient(0, h * 0.7, 0, h);
      gr.addColorStop(0, 'rgba(20,12,6,0)');
      gr.addColorStop(1, 'rgba(20,12,6,.5)');
      g.fillStyle = gr;
      g.fillRect(0, h * 0.7, w, h * 0.3);
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(0, h - 26, w, 26);
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        let x = Math.random() * w;
        let y = Math.random() * h * 0.5;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 8; k++) {
          x += (Math.random() - 0.5) * 30;
          y += 10 + Math.random() * 25;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    });

  const shaft = canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    const gx = g.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, 'rgba(0,0,0,.9)');
    gx.addColorStop(0.3, 'rgba(0,0,0,0)');
    gx.addColorStop(0.7, 'rgba(0,0,0,0)');
    gx.addColorStop(1, 'rgba(0,0,0,.9)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = gx;
    g.fillRect(0, 0, w, h);
  });
  shaft.wrapS = shaft.wrapT = THREE.ClampToEdgeWrapping;

  return {
    shaft,
    floor: canvasTex(
      512,
      512,
      (g, w, h) => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const pw = w / n;
          g.fillStyle = `hsl(${24 + Math.random() * 8},${30 + Math.random() * 10}%,${26 + Math.random() * 10}%)`;
          g.fillRect(i * pw, 0, pw, h);
          for (let k = 0; k < 28; k++) {
            g.strokeStyle = `rgba(0,0,0,${Math.random() * 0.16})`;
            g.beginPath();
            const x = i * pw + Math.random() * pw;
            g.moveTo(x, 0);
            g.lineTo(x + (Math.random() - 0.5) * 6, h);
            g.stroke();
          }
          g.fillStyle = 'rgba(0,0,0,.55)';
          g.fillRect(i * pw, 0, 2, h);
          g.fillRect(i * pw, Math.random() * h, pw, 2);
        }
        stains(g, w, h, 10);
        speckle(g, w, h, 2200, 0.4);
      },
      5.5,
      6
    ),
    concrete: canvasTex(
      256,
      256,
      (g, w, h) => {
        g.fillStyle = '#3a3e44';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(12,14,18,0.6)';
        g.lineWidth = 2;
        for (let x = 0; x <= w; x += 64) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, h);
          g.stroke();
        }
        for (let y = 0; y <= h; y += 64) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(w, y);
          g.stroke();
        }
        stains(g, w, h, 10, '20,24,28');
        speckle(g, w, h, 1500, 0.4);
      },
      3,
      3.5
    ),
    wallL: wallTex(38, 18, 46, 'stripe'),
    wallB: wallTex(180, 12, 40, 'stripe'),
    wallK: wallTex(48, 25, 56, 'tile'),
    ceil: canvasTex(
      256,
      256,
      (g, w, h) => {
        g.fillStyle = '#b9b4a8';
        g.fillRect(0, 0, w, h);
        stains(g, w, h, 12, '60,45,20');
        speckle(g, w, h, 1400, 0.3);
      },
      5.5,
      6
    ),
    wood: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#5b3d26';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 55; i++) {
        g.strokeStyle = `rgba(20,10,4,${Math.random() * 0.35})`;
        g.beginPath();
        const y = Math.random() * h;
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + rnd(-6, 6), w * 0.6, y + rnd(-6, 6), w, y + rnd(-4, 4));
        g.stroke();
      }
      speckle(g, w, h, 800, 0.3);
    }),
    fabric: canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#6a5546';
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) {
        g.fillStyle = 'rgba(0,0,0,.08)';
        g.fillRect(0, y, w, 1);
      }
      for (let x = 0; x < w; x += 3) {
        g.fillStyle = 'rgba(255,255,255,.04)';
        g.fillRect(x, 0, 1, h);
      }
      stains(g, w, h, 5);
      speckle(g, w, h, 600, 0.3);
    }),
    skin: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#b8c0a0';
      g.fillRect(0, 0, w, h);
      stains(g, w, h, 24, '70,40,50');
      stains(g, w, h, 10, '30,60,30');
      g.strokeStyle = 'rgba(90,30,60,.4)';
      for (let i = 0; i < 12; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += rnd(-14, 14);
          y += rnd(-14, 14);
          g.lineTo(x, y);
        }
        g.stroke();
      }
      speckle(g, w, h, 1200, 0.4);
    }),
    cloth: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#bdbdbd';
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 4) {
        g.fillStyle = 'rgba(0,0,0,.07)';
        g.fillRect(0, y, w, 2);
      }
      stains(g, w, h, 16, '60,10,10');
      stains(g, w, h, 10, '20,15,10');
      for (let i = 0; i < 14; i++) {
        g.fillStyle = 'rgba(0,0,0,.4)';
        g.fillRect(Math.random() * w, Math.random() * h, rnd(2, 14), rnd(1, 3));
      }
    }),
    dirt: canvasTex(
      256,
      256,
      (g, w, h) => {
        g.fillStyle = '#3a362e';
        g.fillRect(0, 0, w, h);
        stains(g, w, h, 30, '10,10,5');
        speckle(g, w, h, 2500, 0.5);
      },
      50,
      50
    ),
    rug: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#5b2a2a';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c9a46a';
      g.lineWidth = 6;
      g.strokeRect(14, 14, w - 28, h - 28);
      g.lineWidth = 2;
      g.strokeRect(30, 30, w - 60, h - 60);
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.arc(w / 2, h / 2, 18 + i * 14, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(201,164,106,.5)';
        g.stroke();
      }
      stains(g, w, h, 8);
      speckle(g, w, h, 1500, 0.4);
    }),
  };
}
