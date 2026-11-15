import * as THREE from 'three';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const horrorShaderUniforms = {
  uTime: { value: 0 },
  uFear: { value: 0 },
  uShaderQuality: { value: 1 },
};

export function createVolumetricBeamMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: horrorShaderUniforms.uTime,
      uColor: { value: new THREE.Color(0xfff1d0) },
      uIntensity: { value: 0.24 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 viewDir = normalize(-vViewPos);
        float fresnel = pow(abs(dot(viewDir, vNormal)), 1.65);
        float fadeLen = smoothstep(0.0, 0.15, vUv.y) * pow(1.0 - vUv.y, 1.45);
        float dust = 0.78 + 0.22 * noise(vUv * vec2(9.0, 14.0) + vec2(uTime * 0.35, -uTime * 0.6));
        float alpha = fresnel * fadeLen * dust * uIntensity;
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.45));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function createGodRayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: horrorShaderUniforms.uTime,
      uColor: { value: new THREE.Color(0xc8dcff) },
      uOpacity: { value: 0.14 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.1, 289.7))) * 43758.5453);
      }

      void main() {
        float edgeX = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float edgeY = pow(vUv.y, 1.35) * smoothstep(1.0, 0.88, vUv.y);
        float rays = 0.75 + 0.25 * sin(vUv.x * 26.0 + uTime * 0.45);
        float alpha = edgeX * edgeY * rays * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function enhanceHorrorMaterial(mat: THREE.MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = horrorShaderUniforms.uTime;
    shader.uniforms.uFear = horrorShaderUniforms.uFear;
    shader.uniforms.uShaderQuality = horrorShaderUniforms.uShaderQuality;

    shader.vertexShader =
      `varying vec3 vHorrorWorldPos;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vHorrorWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader =
      `uniform float uTime;\nuniform float uFear;\nuniform float uShaderQuality;\nvarying vec3 vHorrorWorldPos;\n` +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         if (uShaderQuality > 0.5) {
           float heightDamp = smoothstep(0.0, 0.85, vHorrorWorldPos.y);
           diffuseColor.rgb *= mix(0.62, 1.0, heightDamp);
           float ceilingDamp = smoothstep(2.8, 2.25, vHorrorWorldPos.y);
           diffuseColor.rgb *= mix(0.75, 1.0, ceilingDamp);
           if (uFear > 0.15) {
             float pulse = sin(vHorrorWorldPos.x * 3.5 + vHorrorWorldPos.z * 3.5 + uTime * 4.2) * 0.5 + 0.5;
             diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 0.78, 0.78), uFear * pulse * 0.28);
           }
         }`
      );
  };
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
  const canvasTex = (
    w: number,
    h: number,
    fn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    rx?: number,
    ry?: number,
    isData = false
  ) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    fn(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rx && ry) t.repeat.set(rx, ry);
    if (!isData) {
      t.colorSpace = THREE.SRGBColorSpace;
    }
    t.anisotropy = Math.min(maxAnisotropy, 4);
    return t;
  };

  const wallTex = (hh: number, s: number, l: number, kind: string) =>
    canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = `hsl(${hh},${s}%,${l}%)`;
      g.fillRect(0, 0, w, h);
      if (kind === 'stripe') {
        for (let x = 0; x < w; x += 32) {
          g.fillStyle = 'rgba(0,0,0,.08)';
          g.fillRect(x, 0, 16, h);
        }
      }
      if (kind === 'tile') {
        g.strokeStyle = 'rgba(0,0,0,.24)';
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
      stains(g, w, h, 16);
      stains(g, w, h, 5, '65,12,14');
      speckle(g, w, h, 3000, 0.35);
      const gr = g.createLinearGradient(0, h * 0.68, 0, h);
      gr.addColorStop(0, 'rgba(18,10,5,0)');
      gr.addColorStop(1, 'rgba(18,10,5,.56)');
      g.fillStyle = gr;
      g.fillRect(0, h * 0.68, w, h * 0.32);
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(0, h - 26, w, 26);
      g.strokeStyle = 'rgba(0,0,0,.38)';
      g.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
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

  const bumpWood = canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 80; i++) {
        g.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)';
        g.beginPath();
        const y = Math.random() * h;
        g.moveTo(0, y);
        g.lineTo(w, y + rnd(-3, 3));
        g.stroke();
      }
      speckle(g, w, h, 1400, 0.25);
    },
    4,
    4,
    true
  );

  return {
    bumpWood,
    floor: canvasTex(
      512,
      512,
      (g, w, h) => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const pw = w / n;
          g.fillStyle = `hsl(${24 + Math.random() * 8},${28 + Math.random() * 10}%,${22 + Math.random() * 9}%)`;
          g.fillRect(i * pw, 0, pw, h);
          for (let k = 0; k < 30; k++) {
            g.strokeStyle = `rgba(0,0,0,${Math.random() * 0.18})`;
            g.beginPath();
            const x = i * pw + Math.random() * pw;
            g.moveTo(x, 0);
            g.lineTo(x + (Math.random() - 0.5) * 6, h);
            g.stroke();
          }
          g.fillStyle = 'rgba(0,0,0,.6)';
          g.fillRect(i * pw, 0, 2, h);
          g.fillRect(i * pw, Math.random() * h, pw, 2);
        }
        stains(g, w, h, 12);
        stains(g, w, h, 4, '75,10,12');
        speckle(g, w, h, 2500, 0.4);
      },
      5.5,
      6
    ),
    wallL: wallTex(36, 16, 42, 'stripe'),
    wallB: wallTex(185, 12, 36, 'stripe'),
    wallK: wallTex(46, 22, 50, 'tile'),
    ceil: canvasTex(
      256,
      256,
      (g, w, h) => {
        g.fillStyle = '#a8a296';
        g.fillRect(0, 0, w, h);
        stains(g, w, h, 14, '50,36,18');
        speckle(g, w, h, 1500, 0.3);
      },
      5.5,
      6
    ),
    wood: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#543721';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        g.strokeStyle = `rgba(20,10,4,${Math.random() * 0.38})`;
        g.beginPath();
        const y = Math.random() * h;
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + rnd(-6, 6), w * 0.6, y + rnd(-6, 6), w, y + rnd(-4, 4));
        g.stroke();
      }
      speckle(g, w, h, 800, 0.3);
    }),
    fabric: canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#624d3f';
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) {
        g.fillStyle = 'rgba(0,0,0,.09)';
        g.fillRect(0, y, w, 1);
      }
      for (let x = 0; x < w; x += 3) {
        g.fillStyle = 'rgba(255,255,255,.04)';
        g.fillRect(x, 0, 1, h);
      }
      stains(g, w, h, 6);
      speckle(g, w, h, 600, 0.3);
    }),
    skin: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#9aa486';
      g.fillRect(0, 0, w, h);
      stains(g, w, h, 26, '75,20,30');
      stains(g, w, h, 12, '25,50,25');
      g.strokeStyle = 'rgba(85,15,25,.48)';
      for (let i = 0; i < 16; i++) {
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
      speckle(g, w, h, 1400, 0.45);
    }),
    cloth: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#a8a8a8';
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 4) {
        g.fillStyle = 'rgba(0,0,0,.08)';
        g.fillRect(0, y, w, 2);
      }
      stains(g, w, h, 18, '65,10,10');
      stains(g, w, h, 10, '20,15,10');
      for (let i = 0; i < 14; i++) {
        g.fillStyle = 'rgba(0,0,0,.45)';
        g.fillRect(Math.random() * w, Math.random() * h, rnd(2, 14), rnd(1, 3));
      }
    }),
    dirt: canvasTex(
      256,
      256,
      (g, w, h) => {
        g.fillStyle = '#2d2a23';
        g.fillRect(0, 0, w, h);
        stains(g, w, h, 30, '10,10,5');
        speckle(g, w, h, 3000, 0.5);
      },
      50,
      50
    ),
    rug: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#522222';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b8945c';
      g.lineWidth = 6;
      g.strokeRect(14, 14, w - 28, h - 28);
      g.lineWidth = 2;
      g.strokeRect(30, 30, w - 60, h - 60);
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.arc(w / 2, h / 2, 18 + i * 14, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(201,164,106,.45)';
        g.stroke();
      }
      stains(g, w, h, 10);
      speckle(g, w, h, 1500, 0.4);
    }),
  };
}
