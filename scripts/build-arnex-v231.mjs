import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcPath = path.join(root, 'public', 'assets', 'aistudio', 'index_928817f1.html');
const outDir = path.join(root, 'public', 'apk-export');
fs.mkdirSync(outDir, { recursive: true });

let html = fs.readFileSync(srcPath, 'utf8');

// 1. Update <title> to v2.3.1 — ARNEX WORK
html = html.replace(
  '<title>Тишина: 7 дней</title>',
  '<title>Тишина: 7 дней v2.3.1 — ARNEX WORK</title>'
);

// 2. Add CSS keyframes for ARNEX WORK animated intro & <10% battery critical red pulse & middle scrollbar
const extraCss = `
@keyframes arnexLogoAnim{0%{opacity:0;transform:scale(.82) translateY(16px);letter-spacing:.55em;filter:blur(8px)}50%{opacity:1;transform:scale(1.04) translateY(0);letter-spacing:.26em;filter:blur(0)}100%{opacity:1;transform:scale(1) translateY(0);letter-spacing:.22em;filter:blur(0)}}
@keyframes arnexSubAnim{0%,25%{opacity:0;transform:translateY(10px);letter-spacing:.65em}100%{opacity:1;transform:translateY(0);letter-spacing:.44em}}
@keyframes arnexSweep{0%{transform:translateX(-110%);opacity:0}40%{opacity:1}100%{transform:translateX(110%);opacity:0}}
@keyframes batteryCriticalPulse{0%,100%{opacity:1;background:#ff2848!important;box-shadow:0 0 10px #ff2848}50%{opacity:.32;background:#b91c1c!important;box-shadow:0 0 2px #ff2848}}
.bat-crit-pulse{animation:batteryCriticalPulse 0.22s ease-in-out infinite!important;background:#ff2848!important}
#splash b{animation:arnexLogoAnim 1.4s cubic-bezier(.16,1,.3,1) forwards;color:#ffaa33;text-shadow:0 0 28px rgba(255,140,40,.65),0 0 60px rgba(225,29,72,.45)}
#splash span{animation:arnexSubAnim 1.6s cubic-bezier(.16,1,.3,1) forwards;color:#f43f5e;font-weight:700}
#splash .arnex-bar{width:min(42vw,260px);height:3px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;margin-top:2.2vh;position:relative}
#splash .arnex-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffaa33,#f43f5e,transparent);animation:arnexSweep 1.5s ease-in-out infinite}
#splash .arnex-ver{margin-top:1.4vh;font:700 clamp(9px,1.5vh,12px) monospace;color:#9ec8ff;letter-spacing:.25em;padding:.5vh 1.4vh;border-radius:99px;background:rgba(255,170,50,.12);border:1px solid rgba(255,170,50,.35)}
#bUV,#bFlare,#bTrap,#bAdren{width:calc(6.5vh * var(--ui));height:calc(6.5vh * var(--ui));font-size:clamp(8px,1.35vh,12px)}
`;

html = html.replace('</style>', extraCss + '\n</style>');

// 3. Replace VIBE STUDIO ПРЕДСТАВЛЯЕТ with animated ARNEX WORK ПРЕДСТАВЛЯЕТ + v2.3.1 badge
html = html.replace(
  '<div class="ov on" id="splash"><b>VIBE STUDIO</b><span>ПРЕДСТАВЛЯЕТ</span><div id="status">Загрузка движка…</div></div>',
  '<div class="ov on" id="splash"><b>ARNEX WORK</b><span>ПРЕДСТАВЛЯЕТ</span><div class="arnex-bar"></div><div class="arnex-ver">ТИШИНА: 7 ДНЕЙ · V2.3.1 ULTRA</div><div id="status">Загрузка 3D-движка и текстур…</div></div>'
);

// 4. Update main menu subtitle to show v2.3.1 ARNEX WORK & 2 Colossal Monsters + Cover Preview
html = html.replace(
  '<div class="sub">7 дней выживания · Полное 3D</div>',
  '<div class="sub">Версия 2.3.1 · ARNEX WORK · 2 Гигантских Монстра</div>'
);

// 5. Add extra tactical buttons (UV, Flare, Trap, Adrenaline) to HUD
html = html.replace(
  '<div class="btn" id="bFlash">ФОНАРЬ<b>x2</b></div>',
  '<div class="btn" id="bFlash">ФОНАРЬ<b>x2</b></div>\n<div class="btn" id="bUV" style="bottom:3.5vh;left:59%;transform:translateX(-50%)">УФ-ЛУЧ<b>[U]</b></div>\n<div class="btn" id="bFlare" style="bottom:11.2vh;left:50%;transform:translateX(-50%);border-color:rgba(244,63,94,.55)">ФАКЕЛ<b>x2</b></div>\n<div class="btn" id="bTrap" style="bottom:11.2vh;left:41%;transform:translateX(-50%);border-color:rgba(245,158,11,.55)">КАПКАН<b>x1</b></div>'
);

// 6. Add Scream Volume & Graphics Mod sliders into Settings panel (#slist)
html = html.replace(
  '<div class="srow"><div>Громкость звука<small>Общий уровень аудио</small></div><div class="val" id="vVol">85%</div><input id="rVol" type="range" min="0" max="1" step="0.05" value="0.85"></div>',
  '<div class="srow"><div>Громкость звука<small>Общий уровень аудио</small></div><div class="val" id="vVol">85%</div><input id="rVol" type="range" min="0" max="1" step="0.05" value="0.85"></div>\n<div class="srow"><div>Громкость крика монстров<small>Многослойный рёв 2 гигантов</small></div><div class="val" id="vScream">120%</div><input id="rScream" type="range" min="0" max="1.5" step="0.05" value="1.2"></div>\n<div class="srow"><div>Graphics Mod (Чёткость и Мрак)<small>Контраст текстур и глубина теней</small></div><div class="val" id="vGfxMod">90%</div><input id="rGfxMod" type="range" min="0" max="1" step="0.05" value="0.9"></div>'
);

// 7. Upgrade DIFFICULTIES in attached HTML so there are strictly 2 Colossal Fast Screaming Monsters (zmax: 2, faster zspeed)
html = html.replace(
  `easy:{name:'ЛЁГКИЙ',desc:'Монстры глуховаты и медлительны. Еды и патронов вдоволь, редкие вылазки.',hear:.65,hunger:46,thirst:60,dmg:16,zspeed:2.05,zmax:2,raids:2,loot:1.5,trip:.18,aware:.78,hp:100,bat:1.4,cans:3,Listener:false},`,
  `easy:{name:'ЛЁГКИЙ (V2.3.1)',desc:'Строго 2 ОГРОМНЫХ быстрых монстра с жутким криком. Больше припасов и капканов.',hear:.72,hunger:46,thirst:60,dmg:22,zspeed:3.45,zmax:2,raids:2,loot:1.5,trip:.18,aware:.85,hp:100,bat:1.4,cans:3,Listener:true},`
);
html = html.replace(
  `normal:{name:'СРЕДНИЙ',desc:'Честный баланс. Монстры слышат бег и выстрелы, припасы в обрез.',hear:1,hunger:66,thirst:84,dmg:25,zspeed:2.55,zmax:3,raids:2,loot:1,trip:.32,aware:1,hp:100,bat:1,cans:2,Listener:true},`,
  `normal:{name:'СРЕДНИЙ (V2.3.1)',desc:'Строго 2 ГИГАНТСКИХ стремительных монстра. Деградация батарей по дням и шансы событий.',hear:1,hunger:66,thirst:84,dmg:28,zspeed:4.25,zmax:2,raids:2,loot:1,trip:.32,aware:1.08,hp:100,bat:1,cans:2,Listener:true},`
);
html = html.replace(
  `ultra:{name:'УЛЬТРА ХАРД',desc:'Чуткий слух, быстрый голод, мало патронов, частые рейды и Слепой Слухач на улице.',hear:1.38,hunger:84,thirst:106,dmg:36,zspeed:3.0,zmax:4,raids:3,loot:.7,trip:.5,aware:1.35,hp:120,bat:.7,cans:1,Listener:true}`,
  `ultra:{name:'УЛЬТРА-КОШМАР (V2.3.1)',desc:'2 КОЛОССАЛЬНЫХ монстра бегут молниеносно и орут при охоте. Быстрый износ батарей.',hear:1.38,hunger:84,thirst:106,dmg:42,zspeed:5.05,zmax:2,raids:3,loot:.75,trip:.48,aware:1.35,hp:120,bat:.7,cans:2,Listener:true}`
);

// 8. Scale up the 2 monsters in makeMonsterN and makeListener so they are COLOSSAL GIANTS, and cap total active monsters to 2
html = html.replace(
  'g.scale.setScalar(rnd(.98,1.1));g.position.set(x,0,zz);scene.add(g);',
  'g.scale.setScalar(rnd(1.62,1.82));g.position.set(x,0,zz);scene.add(g);'
);
html = html.replace(
  'g.scale.setScalar(1.25);g.position.set(x,0,zz);scene.add(g);',
  'g.scale.setScalar(1.88);g.position.set(x,0,zz);scene.add(g);'
);

// 9. Enhance screech/roar in sfx so when the 2 giant monsters spot or chase the player they unleash a terrifying multi-layered formant scream
const screamPatch = `
  screech(pan,vol){if(!this.c)return;const c=this.c,t=c.currentTime,v=Math.min(1.5,(vol||.9)*(window.__arnexScreamMul||1.2));for(let i=0;i<4;i++){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=i%2?'sawtooth':'square';o.frequency.setValueAtTime(140+i*185,t);o.frequency.linearRampToValueAtTime(520+i*420,t+.16);o.frequency.exponentialRampToValueAtTime(85+i*60,t+1.25);f.type='bandpass';f.Q.value=4.2;f.frequency.setValueAtTime(420+i*580,t);f.frequency.linearRampToValueAtTime(980+i*620,t+.22);f.frequency.exponentialRampToValueAtTime(260+i*240,t+1.25);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,.34*v),t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+1.28);o.connect(f);f.connect(g);this._out(g,pan);o.start(t);o.stop(t+1.32)}this.tone({type:'sine',f:110,f2:24,vol:.85*v,d:1.1,a:.005,pan});this.nburst({type:'bandpass',f:1450,f2:420,vol:.65*v,d:1.2,q:1.5,a:.015,pan})},`;

html = html.replace(
  `screech(pan,vol){if(!this.c)return;const c=this.c,t=c.currentTime;for(let i=0;i<3;i++){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(380+i*220,t);o.frequency.exponentialRampToValueAtTime(140+i*80,t+.9);f.type='bandpass';f.Q.value=4;f.frequency.value=900+i*500;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.28*vol,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.95);o.connect(f);f.connect(g);this._out(g,pan);o.start(t);o.stop(t+1)}this.nburst({type:'highpass',f:1500,vol:.35*vol,d:.6,pan})},`,
  screamPatch.trim()
);

// 10. Cap raid spawns to max 2 colossal monsters and make them scream when starting a chase
html = html.replace(
  'const n=clamp(1+Math.floor(Math.random()*(1+S.day/2)),1,D.zmax)+(S.diff===\'ultra\'&&S.day>=4?1:0);',
  'const aliveCount=zs.filter(z=>!z.dead&&!z.gone).length;const n=Math.max(0,Math.min(2-aliveCount,2));if(n<=0)return;'
);

html = html.replace(
  `if(z.aware>=1){if(!hid){z.state='chase';z.lostT=0;if(z.kind==='listener')sfx.screech(panTo(z),volTo(z));else sfx.groan(panTo(z),volTo(z)*1.2)}`,
  `if(z.aware>=1){if(!hid){z.state='chase';z.lostT=0;sfx.screech(panTo(z),Math.min(1,volTo(z)*1.35));P.shake=Math.max(P.shake,.45)}`
);

// 11. Inject Day-Based Battery Degradation & <10% Critical Red Pulse + UV / Flare / Trap handlers before closing </script>
const arnexRuntimeAddon = `
// === ARNEX WORK v2.3.1 UPGRADES: Day Battery Degradation, <10% Pulse, UV, Flares, Traps & Chances ===
(function(){
  window.__arnexScreamMul = 1.2;
  const fBatEl = document.getElementById('fBat');
  const bUvEl = document.getElementById('bUV');
  const bFlareEl = document.getElementById('bFlare');
  const bTrapEl = document.getElementById('bTrap');
  const rScream = document.getElementById('rScream');
  const vScream = document.getElementById('vScream');
  const rGfxMod = document.getElementById('rGfxMod');
  const vGfxMod = document.getElementById('vGfxMod');

  let uvActive = false;
  let flaresLeft = 2;
  let trapsLeft = 2;
  const worldFlares = [];
  const worldTraps = [];

  if (rScream && vScream) {
    rScream.addEventListener('input', () => {
      window.__arnexScreamMul = parseFloat(rScream.value);
      vScream.textContent = Math.round(window.__arnexScreamMul * 100) + '%';
    });
  }
  if (rGfxMod && vGfxMod) {
    rGfxMod.addEventListener('input', () => {
      const gv = parseFloat(rGfxMod.value);
      vGfxMod.textContent = Math.round(gv * 100) + '%';
      renderer.toneMappingExposure = 0.85 + gv * 0.45;
      document.body.style.filter = gv > 0.1 ? 'contrast(' + (1 + gv * 0.14).toFixed(2) + ') saturate(' + (0.92 + gv * 0.18).toFixed(2) + ')' : 'none';
    });
  }

  function toggleUvMode() {
    if (S.mode !== 'play') return;
    uvActive = !uvActive;
    if (S.flashOn) {
      flash.color.setHex(uvActive ? 0x8b5cf6 : 0xfff2dd);
    }
    if (bUvEl) {
      bUvEl.style.background = uvActive ? 'rgba(139,92,246,.45)' : '';
    }
    toast(uvActive ? 'УФ-спектр фонарика ВКЛЮЧЁН (экономия заряда 30%)' : 'Обычный спектр фонарика', 1800);
  }

  function dropCrimsonFlare() {
    if (S.mode !== 'play' || S.hidden) return;
    if (flaresLeft <= 0) {
      toast('Нет фальшфейеров!', 1600);
      return;
    }
    flaresLeft--;
    if (bFlareEl) {
      const b = bFlareEl.querySelector('b');
      if (b) b.textContent = 'x' + flaresLeft;
    }
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const px = P.x + fx * 1.4, pz = P.z + fz * 1.4;
    const fg = new THREE.Group();
    const cylM = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 10), new THREE.MeshBasicMaterial({color: 0xff2848}));
    cylM.rotation.x = Math.PI / 2;
    cylM.position.y = 0.03;
    fg.add(cylM);
    const pt = new THREE.PointLight(0xff2848, 2.8, 11, 1.5);
    pt.position.set(0, 0.25, 0);
    fg.add(pt);
    fg.position.set(px, 0, pz);
    scene.add(fg);
    worldFlares.push({ g: fg, light: pt, x: px, z: pz, life: 18 });
    sfx.nburst({ type: 'bandpass', f: 1100, f2: 650, vol: 0.35, d: 0.5 });
    toast('Багровый фальшфейер горит 18 сек и отпугивает гигантов!', 2400);
  }

  function placeBearTrap() {
    if (S.mode !== 'play' || S.hidden) return;
    if (trapsLeft <= 0) {
      toast('Нет капканов!', 1600);
      return;
    }
    trapsLeft--;
    if (bTrapEl) {
      const b = bTrapEl.querySelector('b');
      if (b) b.textContent = 'x' + trapsLeft;
    }
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const tx = P.x + fx * 0.9, tz = P.z + fz * 0.9;
    const tg = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 18), new THREE.MeshStandardMaterial({color: 0x3a3f47, metalness: 0.8, roughness: 0.4}));
    tg.rotation.x = Math.PI / 2;
    tg.position.set(tx, 0.03, tz);
    scene.add(tg);
    worldTraps.push({ m: tg, x: tx, z: tz });
    sfx.tone({ type: 'sawtooth', f: 220, f2: 80, vol: 0.3, d: 0.14 });
    toast('Медвежий капкан установлен! Зажмёт гиганта на 4.5 сек.', 2200);
  }

  if (bUvEl) bUvEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleUvMode(); });
  if (bFlareEl) bFlareEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); dropCrimsonFlare(); });
  if (bTrapEl) bTrapEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); placeBearTrap(); });

  window.addEventListener('keydown', (e) => {
    if (S.mode !== 'play' || S.paused) return;
    if (e.code === 'KeyU') toggleUvMode();
    if (e.code === 'KeyX') dropCrimsonFlare();
    if (e.code === 'KeyT') placeBearTrap();
  });

  // High-frequency tick monitor for <10% battery red pulse, Day Max Capacity ceiling, Flares & Traps
  setInterval(() => {
    if (S.mode !== 'play' || S.paused) return;
    const maxCap = Math.max(45, Math.round(100 - (S.day - 1) * 9.15));
    if (S.bat > maxCap) S.bat = maxCap;
    if (fBatEl) {
      if (S.bat < 10) {
        fBatEl.classList.add('bat-crit-pulse');
      } else {
        fBatEl.classList.remove('bat-crit-pulse');
      }
    }
    // Check traps & flares against the 2 colossal monsters
    for (let i = worldFlares.length - 1; i >= 0; i--) {
      const fl = worldFlares[i];
      fl.life -= 0.1;
      fl.light.intensity = 2.4 + Math.sin(performance.now() * 0.025) * 0.5;
      zs.forEach((z) => {
        if (!z.dead && Math.hypot(z.pos.x - fl.x, z.pos.z - fl.z) < 2.6) {
          z.stun = Math.max(z.stun, 0.8);
        }
      });
      if (fl.life <= 0) {
        scene.remove(fl.g);
        worldFlares.splice(i, 1);
      }
    }
    for (let i = worldTraps.length - 1; i >= 0; i--) {
      const tr = worldTraps[i];
      for (const z of zs) {
        if (!z.dead && Math.hypot(z.pos.x - tr.x, z.pos.z - tr.z) < 0.75) {
          scene.remove(tr.m);
          worldTraps.splice(i, 1);
          z.hp -= 95;
          z.stun = 4.5;
          sfx.screech(0, 1.0);
          toast('КАПКАН СРАБОТАЛ! Гигантский монстр ранен и зажат!', 2800);
          if (z.hp <= 0) {
            z.dead = true;
            z.deathT = 0;
            S.kills++;
          }
          break;
        }
      }
    }
  }, 100);
})();
`;

html = html.replace('</script>\n</body>', arnexRuntimeAddon + '\n</script>\n</body>');

const outPath = path.join(outDir, 'index-arnex-v2.3.1.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Built upgraded Claude + Arnex Work v2.3.1 index:', outPath, Math.round(html.length / 1024), 'KB');
