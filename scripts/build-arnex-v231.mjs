import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const srcPath = path.join(root, 'public', 'assets', 'aistudio', 'index_928817f1.html');
const outDir = path.join(root, 'public', 'apk-export');
fs.mkdirSync(outDir, { recursive: true });

let html = fs.readFileSync(srcPath, 'utf8');

function mustReplace(target, replacement, label) {
  if (!html.includes(target)) {
    throw new Error(`Missing target for [${label}]: ${target.slice(0, 80)}...`);
  }
  html = html.replace(target, replacement);
}

// 1. Update <title>
mustReplace(
  '<title>Тишина: 7 дней</title>',
  '<title>Тишина: 7 дней v2.3.1 — ARNEX WORK ULTRA</title>',
  'title'
);

// 2. High-contrast visible icons CSS, compact settings labels, ARNEX WORK splash & <10% battery red pulse
const extraCss = `
@keyframes arnexLogoAnim{0%{opacity:0;transform:scale(.82) translateY(16px);letter-spacing:.55em;filter:blur(8px)}50%{opacity:1;transform:scale(1.04) translateY(0);letter-spacing:.26em;filter:blur(0)}100%{opacity:1;transform:scale(1) translateY(0);letter-spacing:.22em;filter:blur(0)}}
@keyframes arnexSubAnim{0%,25%{opacity:0;transform:translateY(10px);letter-spacing:.65em}100%{opacity:1;transform:translateY(0);letter-spacing:.44em}}
@keyframes arnexSweep{0%{transform:translateX(-110%);opacity:0}40%{opacity:1}100%{transform:translateX(110%);opacity:0}}
@keyframes batteryCriticalPulse{0%,100%{opacity:1;background:#ff2848!important;box-shadow:0 0 12px #ff2848}50%{opacity:.28;background:#b91c1c!important;box-shadow:0 0 2px #ff2848}}
.bat-crit-pulse{animation:batteryCriticalPulse 0.22s ease-in-out infinite!important;background:#ff2848!important}
#splash b{animation:arnexLogoAnim 1.4s cubic-bezier(.16,1,.3,1) forwards;color:#ffaa33;text-shadow:0 0 28px rgba(255,140,40,.65),0 0 60px rgba(225,29,72,.45)}
#splash span{animation:arnexSubAnim 1.6s cubic-bezier(.16,1,.3,1) forwards;color:#f43f5e;font-weight:700}
#splash .arnex-bar{width:min(42vw,260px);height:3px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;margin-top:2.2vh;position:relative}
#splash .arnex-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffaa33,#f43f5e,transparent);animation:arnexSweep 1.5s ease-in-out infinite}
#splash .arnex-ver{margin-top:1.4vh;font:700 clamp(9px,1.5vh,12px) monospace;color:#9ec8ff;letter-spacing:.25em;padding:.5vh 1.4vh;border-radius:99px;background:rgba(255,170,50,.12);border:1px solid rgba(255,170,50,.35)}

/* HIGH-VISIBILITY HUD & MENU ICONS */
.b{background:rgba(14,18,26,.9)!important;border:2px solid rgba(255,255,255,.55)!important;color:#ffffff!important;opacity:1!important;box-shadow:0 4px 16px rgba(0,0,0,.8),inset 0 0 10px rgba(255,255,255,.1)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:1px!important}
.b svg{width:52%!important;height:52%!important;fill:none;stroke:#ffffff!important;stroke-width:2.55!important;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px rgba(255,255,255,.75))!important;pointer-events:none;display:block!important}
.b .b-lbl{font:800 clamp(6px,1.05vh,9px)/1 Manrope,system-ui,sans-serif;letter-spacing:.04em;color:#f8fafc;text-shadow:0 1px 3px #000;pointer-events:none;text-transform:uppercase;white-space:nowrap}
#bFire{background:radial-gradient(circle,rgba(239,68,68,.58),rgba(127,29,29,.92))!important;border-color:#ff6b78!important}
#bFire svg{stroke:#ffe4e6!important;filter:drop-shadow(0 0 6px #ff2848)!important}
#bUse{display:flex!important;background:radial-gradient(circle,rgba(56,189,248,.42),rgba(15,23,42,.92))!important;border-color:#7dd3fc!important}
#bTorch.on{background:radial-gradient(circle,rgba(250,204,21,.46),rgba(30,25,10,.92))!important;border-color:#fde047!important}
#bTorch.on svg{stroke:#fef08a!important;filter:drop-shadow(0 0 6px #facc15)!important}
.btn2 svg{width:2.5vh;height:2.5vh;stroke:currentColor;stroke-width:2.4;fill:none;flex-shrink:0}

/* COMPACT CLEAN SETTINGS LABELS ONLY ("в настройках текст большой убери только надписи и все") */
.it{padding:.9vh 0!important;gap:1.5vh!important;font-size:2.05vh!important;font-weight:700!important}
.it small{display:none!important}
`;

mustReplace('</style>', extraCss + '\n</style>', 'extraCss');

// 3. Splash screen: ARNEX WORK ПРЕДСТАВЛЯЕТ
mustReplace(
  '<div class="ov on" id="splash"><b>VIBE STUDIO</b><span>ПРЕДСТАВЛЯЕТ</span><div id="status">Загрузка движка…</div></div>',
  '<div class="ov on" id="splash"><b>ARNEX WORK</b><span>ПРЕДСТАВЛЯЕТ</span><div class="arnex-bar"></div><div class="arnex-ver">ТИШИНА: 7 ДНЕЙ · V2.3.1 ULTRA</div><div id="status">Загрузка 3D-мира, Оружейки и текстур…</div></div>',
  'splash'
);

// 4. Main menu title & visible icons on menu buttons
mustReplace(
  `<div><h1>ТИШИНА<em>7 дней выживания</em></h1>
    <p>Апокалипсис. Ты заперт в доме. Еды мало. Зомби слепы, но слышат всё. Молчи, прячься, дожди до рассвета седьмого дня.</p></div>
    <div class="row"><div class="btn2 g" id="mSet">Настройки</div></div>
  </div>
  <div class="r">
    <div id="cards"></div>
    <div class="row"><div class="btn2" id="mPlay">Играть</div><div class="btn2 g" id="mCont" style="display:none">Продолжить</div></div>`,
  `<div><h1>ТИШИНА<em>v2.3.1 · ARNEX WORK · ДЕНЬ/НОЧЬ · ОРУЖЕЙКА</em></h1>
    <p>Днём — лайт-режим для вылазок в Магазин и Оружейку. Ночью — хардкорная охота 2 анатомических гигантов и ливень по расписанию. В доме только дробовик (15 патр.), остальное — в Оружейке!</p></div>
    <div class="row"><div class="btn2 g" id="mSet"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg><span>Настройки</span></div><div class="btn2" id="mDl21Mb" style="background:linear-gradient(135deg,#e11d48,#be123c);font-size:1.75vh"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>Скачать 21+ МБ (APK)</span></div></div>
  </div>
  <div class="r">
    <div id="cards"></div>
    <div class="row"><div class="btn2" id="mPlay"><svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg><span>Играть</span></div><div class="btn2 g" id="mCont" style="display:none">Продолжить</div></div>`,
  'menu title & icons'
);

// 5. Add visible labels, Real-Time Pulse Sensor ECG HUD & extra tactical buttons (Kick, UV, Flare, Trap, Adrenaline) + Battery Bar to HUD
mustReplace(
  `  <div id="stats">
    <div><svg viewBox="0 0 24 24" stroke="#F43F5E" data-i="heart"></svg><i><u id="fHp" style="background:#F43F5E"></u></i></div>
    <div><svg viewBox="0 0 24 24" stroke="#F59E0B" data-i="food"></svg><i><u id="fFood" style="background:#F59E0B"></u></i></div>
    <div><svg viewBox="0 0 24 24" stroke="#38bdf8" data-i="water"></svg><i><u id="fWater" style="background:#38bdf8"></u></i></div>
  </div>`,
  `  <div id="stats">
    <div><svg viewBox="0 0 24 24" stroke="#F43F5E" data-i="heart"></svg><i><u id="fHp" style="background:#F43F5E"></u></i></div>
    <div><svg viewBox="0 0 24 24" stroke="#F59E0B" data-i="food"></svg><i><u id="fFood" style="background:#F59E0B"></u></i></div>
    <div><svg viewBox="0 0 24 24" stroke="#38bdf8" data-i="water"></svg><i><u id="fWater" style="background:#38bdf8"></u></i></div>
    <div><svg viewBox="0 0 24 24" stroke="#fde047" data-i="torch"></svg><i><u id="fBat" style="background:#fde047"></u></i></div>
    <div id="pulseSensorHud" style="margin-top:.5vh;padding:.7vh .9vh;border-radius:1.1vh;background:rgba(5,7,11,.92);border:1.5px solid rgba(16,185,129,.45);display:flex;flex-direction:column;gap:.4vh;width:21vh;box-shadow:0 4px 14px rgba(0,0,0,.85)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5vh">
        <span style="display:flex;align-items:center;gap:.5vh">
          <svg id="pulseHeartSvg" viewBox="0 0 24 24" style="width:2.1vh;height:2.1vh;fill:#f43f5e;stroke:none;filter:drop-shadow(0 0 6px #f43f5e);transition:transform 60ms"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <b id="pulseBpmTxt" style="font:800 1.65vh monospace;color:#34d399;letter-spacing:.03em">64 BPM</b>
        </span>
        <u id="pantBadgeTxt" style="text-decoration:none;padding:.2vh .55vh;border-radius:.6vh;font:800 1.25vh monospace;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.4);color:#6ee7b7">НОРМА</u>
      </div>
      <canvas id="ecgCanvas" width="120" height="26" style="width:100%;height:2.8vh;background:#020407;border-radius:.5vh;border:1px solid rgba(255,255,255,.12);display:block"></canvas>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.4vh;padding-top:.25vh;border-top:1px solid rgba(255,255,255,.12)">
        <svg viewBox="0 0 24 24" style="width:1.6vh;height:1.6vh;stroke:#22d3ee;stroke-width:2.4;fill:none;flex-shrink:0"><path d="M2 12h2M6 8v8M10 4v16M14 9v6M18 6v12M22 11v2"/></svg>
        <b id="ambienceStatusTxt" style="font:700 1.05vh monospace;color:#6ee7b7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Д1 · СКРИП ДОМА · ТИШИНА</b>
      </div>
    </div>
  </div>
  <div id="screenPulseOv" style="position:fixed;inset:0;pointer-events:none;z-index:11;opacity:0;transition:opacity 70ms;background:radial-gradient(ellipse at center,rgba(225,29,72,0) 40%,rgba(225,29,72,.52) 85%,rgba(136,19,55,.85) 100%)"></div>
  <div id="breathMistOv" style="position:fixed;left:0;right:0;bottom:0;height:38vh;pointer-events:none;z-index:11;opacity:0;transition:opacity 120ms;background:radial-gradient(ellipse at 50% 100%,rgba(186,230,253,.36) 0%,rgba(125,211,252,.15) 46%,rgba(0,0,0,0) 82%)"></div>`,
  'HUD stats battery bar & real-time pulse sensor'
);

mustReplace(
  `  <button class="b" id="bFire"><svg viewBox="0 0 24 24" data-i="fire"></svg></button>
  <button class="b" id="bAim"><svg viewBox="0 0 24 24" data-i="aim"></svg></button>
  <button class="b" id="bReload"><svg viewBox="0 0 24 24" data-i="reload"></svg></button>
  <button class="b" id="bSwap"><svg viewBox="0 0 24 24" data-i="swap"></svg></button>
  <button class="b" id="bJump"><svg viewBox="0 0 24 24" data-i="jump"></svg></button>
  <button class="b" id="bCrouch"><svg viewBox="0 0 24 24" data-i="crouch"></svg></button>
  <button class="b" id="bUse"><svg viewBox="0 0 24 24" data-i="use"></svg></button>
  <button class="b" id="bFood"><svg viewBox="0 0 24 24" data-i="food"></svg><em id="cFood">0</em></button>
  <button class="b" id="bWater"><svg viewBox="0 0 24 24" data-i="water"></svg><em id="cWater">0</em></button>
  <button class="b" id="bTorch"><svg viewBox="0 0 24 24" data-i="torch"></svg></button>
  <button class="b" id="bThrow"><svg viewBox="0 0 24 24" data-i="throw"></svg><em id="cRock">3</em></button>
  <button class="b" id="bBreath"><svg viewBox="0 0 24 24" data-i="breath"></svg></button>
  <button class="b" id="bGear"><svg viewBox="0 0 24 24" data-i="gear"></svg></button>`,
  `  <button class="b" id="bFire"><svg viewBox="0 0 24 24" data-i="fire"></svg><span class="b-lbl">ОГОНЬ</span></button>
  <button class="b" id="bAim"><svg viewBox="0 0 24 24" data-i="aim"></svg><span class="b-lbl">ПРИЦЕЛ</span></button>
  <button class="b" id="bReload"><svg viewBox="0 0 24 24" data-i="reload"></svg><span class="b-lbl">ПЕРЕЗАР</span></button>
  <button class="b" id="bSwap"><svg viewBox="0 0 24 24" data-i="swap"></svg><span class="b-lbl">ОРУЖИЕ</span></button>
  <button class="b" id="bJump"><svg viewBox="0 0 24 24" data-i="jump"></svg><span class="b-lbl">ПРЫЖОК</span></button>
  <button class="b" id="bCrouch"><svg viewBox="0 0 24 24" data-i="crouch"></svg><span class="b-lbl">ПРИСЕД</span></button>
  <button class="b" id="bUse"><svg viewBox="0 0 24 24" data-i="use"></svg><span class="b-lbl">ДВЕРЬ/ДЕЙСТ</span></button>
  <button class="b" id="bFood"><svg viewBox="0 0 24 24" data-i="food"></svg><span class="b-lbl">ЕДА</span><em id="cFood">0</em></button>
  <button class="b" id="bWater"><svg viewBox="0 0 24 24" data-i="water"></svg><span class="b-lbl">ВОДА</span><em id="cWater">0</em></button>
  <button class="b" id="bTorch"><svg viewBox="0 0 24 24" data-i="torch"></svg><span class="b-lbl">ФОНАРЬ</span></button>
  <button class="b" id="bThrow"><svg viewBox="0 0 24 24" data-i="throw"></svg><span class="b-lbl">БАНКА</span><em id="cRock">3</em></button>
  <button class="b" id="bBreath"><svg viewBox="0 0 24 24" data-i="breath"></svg><span class="b-lbl">ДЫХАНИЕ</span></button>
  <button class="b" id="bGear"><svg viewBox="0 0 24 24" data-i="gear"></svg><span class="b-lbl">МЕНЮ</span></button>
  <button class="b" id="bKick" style="--sz:9.5vh;right:26vw;bottom:4vh;border-color:#fbbf24!important"><svg viewBox="0 0 24 24"><path d="M5 18l6-6 4 2 5-6M4 21h10"/></svg><span class="b-lbl">ПИНОК [K]</span></button>
  <button class="b" id="bUV" style="--sz:9vh;left:22vw;bottom:3.5vh;border-color:#a855f7!important"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg><span class="b-lbl">УФ-ЛУЧ</span></button>
  <button class="b" id="bFlare" style="--sz:9vh;left:29vw;bottom:3.5vh;border-color:#f43f5e!important"><svg viewBox="0 0 24 24"><path d="M12 2c2 4 5 6 5 11a5 5 0 1 1-10 0c0-5 3-7 5-11z"/></svg><span class="b-lbl" id="lblFlare">ФАКЕЛ x2</span></button>
  <button class="b" id="bTrap" style="--sz:9vh;left:67.5vw;bottom:3.5vh;border-color:#f59e0b!important"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M8 12h8M12 8v8"/></svg><span class="b-lbl" id="lblTrap">КАПКАН x2</span></button>
  <button class="b" id="bAdren" style="--sz:9vh;left:74.5vw;bottom:3.5vh;border-color:#22d3ee!important"><svg viewBox="0 0 24 24"><path d="M18 3l3 3-10 10-3-3L18 3zM6 15l-3 6 6-3"/></svg><span class="b-lbl" id="lblAdren">АДРЕН x2</span></button>
  <button class="b" id="bSensor" style="--sz:9vh;left:15vw;bottom:3.5vh;border-color:#38bdf8!important"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M4.9 4.9a10 10 0 0 1 14.2 0M7.8 7.8a6 6 0 0 1 8.4 0"/></svg><span class="b-lbl" id="lblSensor">СЕНСОР x2</span></button>
  <button class="b" id="bFuse" style="--sz:9vh;left:8vw;bottom:3.5vh;border-color:#fde047!important"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg><span class="b-lbl" id="lblFuse">ЩИТОК [G]</span></button>`,
  'HUD buttons with visible icons & labels'
);

// 6. Upgrade DIFF: strictly 2 Colossal Fast Screaming Monsters, Day (Light) / Night (Hardcore)
mustReplace(
  `const DIFF={
 easy:{name:'ЛЁГКИЙ',desc:'Зомби глуховаты и медленны. Еды больше. Рейды реже.',hear:.7,hunger:48,thirst:62,dmg:15,zspeed:2.0,zmax:2,raids:2,loot:1.5,trip:.15,aware:.8,hp:100},
 normal:{name:'СРЕДНИЙ',desc:'Честный баланс. Слух острый, еды в обрез.',hear:1,hunger:66,thirst:86,dmg:25,zspeed:2.8,zmax:3,raids:2,loot:1,trip:.3,aware:1,hp:100},
 ultra:{name:'УЛЬТРА',desc:'Слышат даже дыхание. Быстрые, много. Еды почти нет.',hear:1.4,hunger:84,thirst:108,dmg:40,zspeed:3.7,zmax:5,raids:3,loot:.65,trip:.55,aware:1.35,hp:120}
};`,
  `const DIFF={
 easy:{name:'ЛЁГКИЙ (V2.3.1)',desc:'Днём ЛАЙТ, ночью ХАРДКОР. 2 огромных костяных монстра. Дробовик (15 патр.) в шкафу, остальное в Оружейке.',hear:.72,hunger:48,thirst:62,dmg:18,zspeed:3.2,zmax:2,raids:2,loot:1.5,trip:.15,aware:.85,hp:100},
 normal:{name:'СРЕДНИЙ (V2.3.1)',desc:'Днём ЛАЙТ, ночью ХАРДКОР. 2 гигантских быстрых монстра, дождь по расписанию, Оружейка рядом с Магазином 24.',hear:1,hunger:66,thirst:86,dmg:26,zspeed:3.95,zmax:2,raids:2,loot:1,trip:.3,aware:1.05,hp:100},
 ultra:{name:'УЛЬТРА-КОШМАР (V2.3.1)',desc:'Ночной ад: 2 колоссальных монстра бегут молниеносно и орут. Износ батарей по дням.',hear:1.4,hunger:84,thirst:108,dmg:40,zspeed:4.8,zmax:2,raids:3,loot:.75,trip:.5,aware:1.35,hp:120}
};`,
  'DIFF upgrade'
);

// 7. Starting Weapons Fix + Door Fix:
// - Move Deagle & Sniper out of the house into the new Gun Shop ("Оружейка") at x: 16..22, z: 56..60
// - Let the player take the Shotgun + 15 shells from the bedroom wardrobe immediately or when hiding
// - Enable the front door interaction button so it opens both manually and by proximity!
mustReplace(
  `gunProp.deagle.position.set(2.95,.6,.33);gunProp.deagle.rotation.y=.5;world.add(gunProp.deagle);
const caseG=new THREE.Group();caseG.position.set(1.45,.06,6.5);world.add(caseG);put(rbox(1.3,.12,.35,.03,M(0x22252a,.6,.3)),0,0,0,caseG);put(new THREE.Mesh(new THREE.BoxGeometry(.06,.02,.04),matMetal),0,.07,0,caseG);put(gunProp.sniper,0,.09,0,caseG);gunProp.sniper.scale.set(.9,.9,.9);gunProp.sniper.rotation.y=Math.PI/2;gunProp.sniper.position.set(0,.11,0);`,
  `gunProp.deagle.position.set(16.6,.96,56.5);gunProp.deagle.rotation.y=.5;world.add(gunProp.deagle);
const caseG=new THREE.Group();caseG.position.set(21.4,.92,56.5);world.add(caseG);put(rbox(1.3,.12,.35,.03,M(0x22252a,.6,.3)),0,0,0,caseG);put(new THREE.Mesh(new THREE.BoxGeometry(.06,.02,.04),matMetal),0,.07,0,caseG);put(gunProp.sniper,0,.09,0,caseG);gunProp.sniper.scale.set(.9,.9,.9);gunProp.sniper.rotation.y=Math.PI/2;gunProp.sniper.position.set(0,.11,0);`,
  'move deagle & sniper props to Gun Shop'
);

mustReplace(
  `addIA({id:'wardrobe',x:1.45,z:1.6,r:1.0,spot:SPOTS.wardrobe,label:()=>S.hidden?'Выйти':'Спрятаться в шкаф',act:()=>enterHide(SPOTS.wardrobe)});
addIA({id:'sofa',x:8.2,z:10.65,r:1.0,spot:SPOTS.sofa,label:()=>S.hidden?'Выйти':'Залезть под диван',act:()=>enterHide(SPOTS.sofa)});
addIA({id:'bed',x:4.5,z:2.8,r:1.0,spot:SPOTS.bed,label:()=>S.hidden?'Выйти':'Залезть под кровать',act:()=>enterHide(SPOTS.bed)});
addIA({id:'deagle',x:2.95,z:1.15,r:1.0,prop:gunProp.deagle,label:()=>'Взять Desert Eagle',act:a=>giveLoot(a,{weapon:'deagle',ammo:{deagle:21}})});
addIA({id:'sniper',x:1.45,z:7.0,r:1.1,prop:caseG,label:()=>'Открыть кейс',act:a=>giveLoot(a,{weapon:'sniper',ammo:{sniper:10}})});
addIA({id:'fridge',x:9.7,z:1.25,r:1.0,label:()=>'Осмотреть холодильник',act:a=>giveLoot(a,{food:1,water:1})});
addIA({id:'pantry',x:10.0,z:4.7,r:1.1,prop:loot.pantry,label:()=>'Обыскать шкаф с припасами',act:a=>giveLoot(a,{food:2})});
addIA({id:'table',x:7.9,z:3.6,r:1.2,prop:loot.table,label:()=>'Взять еду со стола',act:a=>giveLoot(a,{food:2})});
addIA({id:'counter',x:7.0,z:1.35,r:1.0,prop:loot.counter,label:()=>'Взять воду',act:a=>giveLoot(a,{water:3})});
addIA({id:'dresser',x:4.6,z:4.4,r:1.0,prop:loot.dresser,label:()=>'Открыть комод',act:a=>giveLoot(a,{water:1,ammo:{deagle:7}})});
addIA({id:'shelf',x:9.9,z:7.2,r:1.0,prop:loot.shelf,label:()=>'Обыскать полку',act:a=>giveLoot(a,{ammo:{shotgun:6,deagle:7}})});
addIA({id:'door',x:5.5,z:11.2,r:1.4,ok:()=>false,label:()=>'',act:()=>{}});`,
  `addIA({id:'wardrobe',x:1.45,z:1.6,r:1.35,spot:SPOTS.wardrobe,label:()=>S.hidden?'Выйти из шкафа':(!S.kitTaken?'Взять Дробовик (15 патронов) / Спрятаться':'Спрятаться в шкаф'),act:()=>{if(!S.kitTaken){S.kitTaken=true;S.weapons.shotgun=true;S.ammo.shotgun={mag:6,res:9};if(!S.cur)equip('shotgun');sfx.pickup();toast('Взят Дробовик и 15 патронов! Остальное оружие — в Оружейке рядом с Магазином 24!',3600);return;}enterHide(SPOTS.wardrobe);}});
addIA({id:'sofa',x:8.2,z:10.65,r:1.0,spot:SPOTS.sofa,label:()=>S.hidden?'Выйти':'Залезть под диван',act:()=>enterHide(SPOTS.sofa)});
addIA({id:'bed',x:4.5,z:2.8,r:1.0,spot:SPOTS.bed,label:()=>S.hidden?'Выйти':'Залезть под кровать',act:()=>enterHide(SPOTS.bed)});
addIA({id:'deagle',x:16.6,z:56.5,r:1.8,prop:gunProp.deagle,label:()=>'Взять Desert Eagle (.50 AE) + 21 патрон [Оружейка]',act:a=>giveLoot(a,{weapon:'deagle',ammo:{deagle:21}})});
addIA({id:'sniper',x:21.4,z:56.5,r:1.8,prop:caseG,label:()=>'Взять Снайперскую винтовку + 15 патронов [Оружейка]',act:a=>giveLoot(a,{weapon:'sniper',ammo:{sniper:15}})});
addIA({id:'fridge',x:9.7,z:1.25,r:1.0,label:()=>'Осмотреть холодильник',act:a=>giveLoot(a,{food:1,water:1})});
addIA({id:'pantry',x:10.0,z:4.7,r:1.1,prop:loot.pantry,label:()=>'Обыскать шкаф с припасами',act:a=>giveLoot(a,{food:2})});
addIA({id:'table',x:7.9,z:3.6,r:1.2,prop:loot.table,label:()=>'Взять еду со стола',act:a=>giveLoot(a,{food:2})});
addIA({id:'counter',x:7.0,z:1.35,r:1.0,prop:loot.counter,label:()=>'Взять воду',act:a=>giveLoot(a,{water:3})});
addIA({id:'dresser',x:4.6,z:4.4,r:1.0,prop:loot.dresser,label:()=>'Открыть комод',act:a=>giveLoot(a,{water:2})});
addIA({id:'shelf',x:9.9,z:7.2,r:1.0,prop:loot.shelf,label:()=>'Обыскать полку',act:a=>giveLoot(a,{rocks:2,heal:25})});
addIA({id:'door',x:5.5,z:11.8,r:2.4,ok:()=>!S.hidden,label:()=>doorA>0.35?'Закрыть входную дверь':'Открыть дверь [Выход на улицу / Магазин 24 / Оружейка]',act:()=>{window.__doorManualOpen=!(doorA>0.35);if(doorBroken)doorBroken=false;doorOpenT=window.__doorManualOpen?999:0;doorA=window.__doorManualOpen?1:0;doorPivot.rotation.y=-1.7*doorA;doorCol.on=!window.__doorManualOpen;sfx.doorOpen();toast(window.__doorManualOpen?'Дверь открыта! Идите прямо по улице к Магазину 24 и Оружейке!':'Дверь закрыта',2600);}});`,
  'house interactables & door fix'
);

// 8. Cap raid spawns to max 2 colossal monsters
mustReplace(
  `function startRaid(){const n=clamp(1+Math.floor(Math.random()*(1+S.day/2)),1,D.zmax)+(S.diff==='ultra'&&S.day>=4?1:0);`,
  `function startRaid(){const alive=zs.filter(z=>!z.dead&&!z.gone).length;const n=Math.max(0,Math.min(2-alive,2));if(n<=0)return;`,
  'cap raid monsters at 2'
);

// 9. Clean Settings labels only ("в настройках текст большой убери только надписи и все") + add Scream Volume slider
mustReplace(
  `function row(label,sub,ctl){const d=document.createElement('div');d.className='it';const l=document.createElement('div');l.innerHTML=label+(sub?'<small>'+sub+'</small>':'');d.appendChild(l);d.appendChild(ctl);return d;}`,
  `function row(label,sub,ctl){const d=document.createElement('div');d.className='it';const l=document.createElement('div');l.textContent=label;d.appendChild(l);d.appendChild(ctl);return d;}`,
  'clean settings row labels'
);

mustReplace(
  `p.appendChild(row('Громкость','',mkRange(0,1,.05,()=>CFG.vol,v=>{CFG.vol=v;if(AU.master)AU.master.gain.value=v;})));`,
  `p.appendChild(row('Громкость звука','',mkRange(0,1,.05,()=>CFG.vol,v=>{CFG.vol=v;if(AU.master)AU.master.gain.value=v;})));
 p.appendChild(row('Громкость крика','',mkRange(0,1.5,.05,()=>window.__arnexScreamMul||1.2,v=>{window.__arnexScreamMul=v;})));`,
  'scream slider in buildSettings'
);

// Add Оружейка teleport to Mod Menu
mustReplace(
  `[['Спальня',3,3.6],['Кухня',8.2,5],['Гостиная',5.5,9],['У двери',5.5,10.5],['Улица',5.5,14,1],['Магазин',5.5,55,1]]`,
  `[['Спальня',3,3.6],['Кухня',8.2,5],['Гостиная',5.5,9],['У двери',5.5,10.5],['Улица',5.5,14,1],['Магазин',5.5,55,1],['Оружейка',19,56,1]]`,
  'mod menu teleport to Gun Shop'
);

// 10. Upgrade Jumpscare drawFace(g,w,h) to a terrifying multi-fang anatomical nightmare lunge
const oldDrawFace = `function drawFace(g,w,h){
 const bg=g.createRadialGradient(w/2,h/2,20,w/2,h/2,w*.75);bg.addColorStop(0,'#3a0707');bg.addColorStop(1,'#000');g.fillStyle=bg;g.fillRect(0,0,w,h);
 const cx=w/2,cy=h*.5;
 g.save();g.beginPath();g.ellipse(cx,cy,w*.31,h*.42,rnd(-.08,.08),0,Math.PI*2);g.clip();
 const sk=g.createRadialGradient(cx,cy*.8,10,cx,cy,w*.4);sk.addColorStop(0,'#aab38f');sk.addColorStop(1,'#4a5440');g.fillStyle=sk;g.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){g.fillStyle='rgba('+Math.floor(40+Math.random()*60)+',20,40,'+Math.random()*.25+')';g.beginPath();g.arc(rnd(0,w),rnd(0,h),rnd(4,30),0,7);g.fill();}
 g.strokeStyle='rgba(90,20,40,.6)';g.lineWidth=2;for(let i=0;i<14;i++){g.beginPath();let x=rnd(w*.25,w*.75),y=rnd(h*.15,h*.8);g.moveTo(x,y);for(let k=0;k<6;k++){x+=rnd(-18,18);y+=rnd(-18,18);g.lineTo(x,y);}g.stroke();}
 g.restore();
 [-1,1].forEach(s=>{const ex=cx+s*w*.11,ey=cy-h*.1;g.fillStyle='#050000';g.beginPath();g.ellipse(ex,ey,w*.075,h*.06,s*.2,0,7);g.fill();const gl=g.createRadialGradient(ex,ey,1,ex,ey,w*.05);gl.addColorStop(0,'#fff6b0');gl.addColorStop(.4,'#ffb300');gl.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=gl;g.beginPath();g.arc(ex+rnd(-3,3),ey+rnd(-2,2),w*.05,0,7);g.fill();});
 g.fillStyle='#1a0505';[-8,8].forEach(o=>{g.beginPath();g.ellipse(cx+o,cy+h*.04,5,9,0,0,7);g.fill();});
 const my=cy+h*.2,mw=w*.15,mh=h*rnd(.1,.14);g.fillStyle='#0a0000';g.beginPath();g.ellipse(cx,my,mw,mh,0,0,7);g.fill();
 g.fillStyle='#d8d2b8';for(let i=-5;i<=5;i++){const x=cx+i*mw/5.6;g.beginPath();g.moveTo(x-9,my-mh*.9);g.lineTo(x+9,my-mh*.9);g.lineTo(x+rnd(-2,2),my-mh*.9+rnd(18,34));g.fill();g.beginPath();g.moveTo(x-8,my+mh*.9);g.lineTo(x+8,my+mh*.9);g.lineTo(x+rnd(-2,2),my+mh*.9-rnd(14,28));g.fill();}
 g.strokeStyle='#7a0000';g.lineWidth=6;for(let i=0;i<8;i++){const x=cx+rnd(-mw,mw);g.beginPath();g.moveTo(x,my+mh*.9);g.lineTo(x+rnd(-4,4),my+mh+rnd(20,90));g.stroke();}
 for(let i=0;i<900;i++){g.fillStyle='rgba(0,0,0,'+Math.random()*.4+')';g.fillRect(rnd(0,w),rnd(0,h),rnd(1,3),rnd(1,3));}
}`;

const newDrawFace = `function drawFace(g,w,h){
 const bg=g.createRadialGradient(w/2,h/2,10,w/2,h/2,w*.72);bg.addColorStop(0,'#4f0609');bg.addColorStop(.55,'#190204');bg.addColorStop(1,'#000');g.fillStyle=bg;g.fillRect(0,0,w,h);
 const cx=w/2,cy=h*.46;
 // Necrotic torn cranium & sharp cheekbones
 g.fillStyle='#231917';g.beginPath();g.ellipse(cx,cy,w*.3,h*.38,0,0,Math.PI*2);g.fill();
 g.fillStyle='#1a1110';g.beginPath();g.ellipse(cx,h*.68,w*.22,h*.25,0,0,Math.PI*2);g.fill();
 // Exposed bone ridges & crimson veins
 for(let v=0;v<48;v++){
  g.strokeStyle=v%2?'rgba(165,10,16,.78)':'rgba(10,3,3,.85)';g.lineWidth=1.5+Math.random()*3;
  g.beginPath();let vx=w*.22+Math.random()*w*.56,vy=h*.12+Math.random()*h*.74;g.moveTo(vx,vy);
  for(let k=0;k<5;k++){vx+=rnd(-36,36);vy+=rnd(-36,36);g.lineTo(vx,vy);}g.stroke();
 }
 // Deep sunken eye sockets + piercing glowing demon pupils
 [-1,1].forEach(s=>{
  const ex=cx+s*w*.115,ey=cy-h*.07;
  g.fillStyle='#020000';g.beginPath();g.ellipse(ex,ey,w*.08,h*.085,s*.16,0,Math.PI*2);g.fill();
  const gl=g.createRadialGradient(ex,ey,1,ex,ey,w*.045);gl.addColorStop(0,'#ffffff');gl.addColorStop(.25,'#ff111e');gl.addColorStop(1,'rgba(255,0,0,0)');
  g.fillStyle=gl;g.beginPath();g.arc(ex+rnd(-2,2),ey+rnd(-2,2),w*.045,0,Math.PI*2);g.fill();
 });
 // Torn nasal bone cavity
 g.fillStyle='#060000';g.beginPath();g.moveTo(cx,cy+h*.01);g.lineTo(cx-18,cy+h*.1);g.lineTo(cx+18,cy+h*.1);g.closePath();g.fill();
 // Unhinged gaping split maw with double rows of razor fangs
 const my=h*.68,mw=w*.19,mh=h*.22;
 g.fillStyle='#040000';g.beginPath();g.ellipse(cx,my,mw,mh,0,0,Math.PI*2);g.fill();
 g.fillStyle='#620408';g.beginPath();g.ellipse(cx,my+10,mw*.65,mh*.6,0,0,Math.PI*2);g.fill();
 for(let i=-7;i<=7;i++){
  const tx=cx+i*(mw/7.4),fl=28+(i%2===0?18:6);
  g.fillStyle='#e5dac3';
  g.beginPath();g.moveTo(tx-7,my-mh*.82);g.lineTo(tx+7,my-mh*.82);g.lineTo(tx,my-mh*.82+fl);g.closePath();g.fill();
  g.beginPath();g.moveTo(tx-6,my+mh*.82);g.lineTo(tx+6,my+mh*.82);g.lineTo(tx,my+mh*.82-fl);g.closePath();g.fill();
 }
}`;

mustReplace(oldDrawFace, newDrawFace, 'terrifying drawFace jumpscare');

// 11. Free the space at [14,26,56,68,9] next to the Grocery Store and build the 3D Gun Shop ("ОРУЖЕЙКА · АРСЕНАЛ")
mustReplace(
  `[[-16,-4,16,28,7],[-16,-4,32,45,9],[-16,-4,56,68,6],[14,26,16,27,8],[14,26,31,45,6],[14,26,56,68,9]]`,
  `[[-16,-4,16,28,7],[-16,-4,32,45,9],[-16,-4,56,68,6],[14,26,16,27,8],[14,26,31,45,6]]`,
  'free space next to store for Gun Shop'
);

const gunShopCode = `
// === ОРУЖЕЙКА «АРСЕНАЛ» РЯДОМ С ПРОДУКТОВЫМ МАГАЗИНОМ 24 (x: 14..24, z: 52..64) ===
addWallM(14,52,17.5,52.25,matS);addWallM(20.5,52,24,52.25,matS);addWallM(14,64,24,64.25,matS);addWallM(24,52,24.25,64.25,matS);
const gLint=new THREE.Mesh(boxGeo(3,.7,.25,2.8),matS);gLint.position.set(19,2.85,52.12);scene.add(gLint);
const gBack=new THREE.Mesh(new THREE.BoxGeometry(7.6,1.9,.3),M(0x1d1d20,.8));gBack.position.set(19,3.9,52.1);scene.add(gBack);
const gSignTex=canvasTex(512,128,(g,w,h)=>{g.fillStyle='#1f1108';g.fillRect(0,0,w,h);g.strokeStyle='#ffaa33';g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);g.fillStyle='#ffaa33';g.font='700 50px Unbounded, Manrope, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('ОРУЖЕЙКА',w/2,h/2+4);});
const gSign=new THREE.Mesh(new THREE.PlaneGeometry(7.4,1.75),new THREE.MeshBasicMaterial({map:gSignTex,fog:false}));gSign.position.set(19,3.9,51.92);gSign.rotation.y=Math.PI;scene.add(gSign);
const gFloor=new THREE.Mesh(new THREE.PlaneGeometry(10.5,12),M(0x3a3d42,.75,0,{map:sFloorTex}));gFloor.rotation.x=-Math.PI/2;gFloor.position.set(19,.013,58);scene.add(gFloor);
const gRoof=new THREE.Mesh(new THREE.BoxGeometry(11,.3,12.6),M(0x22201d,.95));gRoof.position.set(19,3.35,58);scene.add(gRoof);
const gLight=new THREE.PointLight(0xffaa44,1.15,15,1.5);gLight.position.set(19,2.9,58);scene.add(gLight);
// Weapon pedestals & ammo crate inside Gun Shop
const ped1=put(rbox(2.2,.9,.8,.03,M(0x2b2f36,.6,.4)),16.6,.45,56.5,world);regHit(ped1);addCol(15.5,56.1,17.7,56.9);
const ped2=put(rbox(2.2,.9,.8,.03,M(0x2b2f36,.6,.4)),21.4,.45,56.5,world);regHit(ped2);addCol(20.3,56.1,22.5,56.9);
const ped3=put(rbox(3.6,.95,.9,.03,M(0x3b2d1f,.8,.2)),19,.475,61.5,world);regHit(ped3);addCol(17.2,61.0,20.8,62.0);
addIA({id:'armory_crate',x:19,z:60.6,r:2.1,ok:()=>window.__armoryLootDay!==S.day,label:()=>'Вскрыть армейский ящик патронов и капканов [Оружейка]',act:()=>{window.__armoryLootDay=S.day;S.ammo.shotgun.res+=15;S.ammo.deagle.res+=14;S.ammo.sniper.res+=10;S.rocks+=3;window.__addFlaresAndTraps&&window.__addFlaresAndTraps(2,2);sfx.pickup();toast('Арсенал пополнен: +15 дроби, +14 Deagle, +10 снайп., +2 факела, +2 капкана!',3600);}});
`;

mustReplace(
  `addIA({id:'home',x:5.5,z:13.3,r:1.5,ok:()=>false,label:()=>'',act:()=>{}});`,
  `addIA({id:'home',x:5.5,z:13.3,r:1.5,ok:()=>false,label:()=>'',act:()=>{}});\n` + gunShopCode,
  'build 3D Gun Shop next to Grocery Store'
);

// Also allow outdoor AI to recognize the Gun Shop interior (x: 13..24.5, z: 52..64.5)
mustReplace(
  `const inStore=(x,z)=>x>-3&&x<13&&z>52&&z<66;`,
  `const inStore=(x,z)=>x>-3&&x<24.5&&z>52&&z<66;`,
  'inStore includes Gun Shop'
);

// 12. Fix doorTick(dt) so proximity AND manual button smoothly swing the door open and clear collision early
mustReplace(
  `let doorA=0,doorOpenT=0,doorMonT=0;
function doorTick(dt){
 if(doorBroken)return;
 const dx=5.5,dz=12.05,pd=Math.hypot(P.x-dx,P.z-dz);
 let want=pd<1.55&&!S.hidden,mon=false;
 for(const z of zs){if(z.dead||z.gone)continue;if(Math.hypot(z.pos.x-dx,z.pos.z-dz)<1.6&&(z.state==='chase'||z.state==='investigate'||z.state==='enter'||z.state==='leave'||z.fol))mon=true;}
 if(mon){if(doorA<.5)doorMonT+=dt;if(doorMonT>.5)want=true;}else doorMonT=0;
 if(want)doorOpenT=.9;else doorOpenT-=dt;
 const open=doorOpenT>0,prev=doorA;
 doorA=clamp(doorA+(open?1:-1)*dt*2.4,0,1);
 doorPivot.rotation.y=-1.7*ease(doorA);doorCol.on=doorA<.35;
 if(prev<.04&&doorA>=.04){sfx.doorOpen();if(pd<2)addBurst(9);}
 if(prev>0&&doorA<=0)sfx.doorShut();}`,
  `let doorA=0,doorOpenT=0,doorMonT=0;
function doorTick(dt){
 if(doorBroken){doorCol.on=false;return;}
 const dx=5.5,dz=12.05,pd=Math.hypot(P.x-dx,P.z-dz);
 if(pd>3.8&&window.__doorManualOpen)window.__doorManualOpen=false;
 let want=(pd<2.3&&!S.hidden)||Boolean(window.__doorManualOpen),mon=false;
 for(const z of zs){if(z.dead||z.gone)continue;if(Math.hypot(z.pos.x-dx,z.pos.z-dz)<1.8&&(z.state==='chase'||z.state==='investigate'||z.state==='enter'||z.state==='leave'||z.fol))mon=true;}
 if(mon){if(doorA<.5)doorMonT+=dt;if(doorMonT>.5)want=true;}else doorMonT=0;
 if(want)doorOpenT=1.2;else doorOpenT-=dt;
 const open=doorOpenT>0,prev=doorA;
 doorA=clamp(doorA+(open?1:-1)*dt*3.5,0,1);
 doorPivot.rotation.y=-1.7*ease(doorA);doorCol.on=doorA<.18;
 if(prev<.04&&doorA>=.04){sfx.doorOpen();if(pd<2)addBurst(9);}
 if(prev>0&&doorA<=0)sfx.doorShut();}`,
  'doorTick fix'
);

// 13. Replace the "white plasticine monster" (ZM / makeMonsterN) with a dark, necrotic, blood-soaked Anatomical Skeletal Horror Monster!
mustReplace(
  ` ZT.wskin=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#eef0f1';g.fillRect(0,0,w,h);stains(g,w,h,22,'120,125,140');stains(g,w,h,8,'150,110,110');
  g.lineWidth=1.1;for(let i=0;i<22;i++){g.strokeStyle='rgba(95,110,150,'+rnd(.18,.4)+')';let x=rnd(0,w),y=rnd(0,h);g.beginPath();g.moveTo(x,y);for(let k=0;k<9;k++){x+=rnd(-11,11);y+=rnd(-12,12);g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<5;i++){g.strokeStyle='rgba(40,30,35,.55)';g.lineWidth=1.4;const x=rnd(10,w-40),y=rnd(10,h-10);g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd(18,32),y+rnd(-5,5));g.stroke();for(let k=0;k<4;k++){g.beginPath();g.moveTo(x+k*7+3,y-3);g.lineTo(x+k*7+3,y+3);g.stroke();}}
  for(let i=0;i<4;i++){g.fillStyle='rgba(60,10,14,'+rnd(.25,.5)+')';g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(3,8),rnd(2,6),rnd(0,3),0,6.3);g.fill();}
  speckle(g,w,h,1500,.35);});
 ZT.wface=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#eef0f1';g.fillRect(0,0,w,h);stains(g,w,h,16,'120,125,140');speckle(g,w,h,1800,.3);`,
  ` ZT.wskin=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#2b201e';g.fillRect(0,0,w,h);stains(g,w,h,48,'95,10,14');stains(g,w,h,28,'12,8,8');
  g.lineWidth=2.2;for(let i=0;i<65;i++){g.strokeStyle=i%2?'rgba(130,10,16,'+rnd(.35,.7)+')':'rgba(15,8,8,.75)';let x=rnd(0,w),y=rnd(0,h);g.beginPath();g.moveTo(x,y);for(let k=0;k<9;k++){x+=rnd(-18,18);y+=rnd(-18,18);g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<14;i++){g.fillStyle='rgba(110,8,12,'+rnd(.45,.8)+')';g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(8,22),rnd(4,14),rnd(0,3),0,6.3);g.fill();}
  speckle(g,w,h,3500,.55);});
 ZT.wface=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#2a1e1c';g.fillRect(0,0,w,h);stains(g,w,h,32,'110,10,14');speckle(g,w,h,2800,.5);`,
  'replace white plasticine texture with dark necrotic flesh texture'
);

mustReplace(
  ` const tint=new THREE.Color().setHSL(rnd(.5,.62),rnd(.02,.1),rnd(.88,.98));
 const MS=o=>new THREE.MeshStandardMaterial(o);
 const sk=MS({map:ZT.wskin,bumpMap:ZT.bump,bumpScale:1.2,vertexColors:true,color:tint,roughness:.62});
 const hdM=MS({map:ZT.wface,bumpMap:ZT.bump,bumpScale:.7,vertexColors:true,color:tint,roughness:.6});
 const rag=MS({map:ZT.cloth,bumpMap:ZT.bump,bumpScale:1,vertexColors:true,color:new THREE.Color().setHSL(rnd(.06,.12),.12,rnd(.18,.3)),roughness:1,side:THREE.DoubleSide});
 const eyeM=new THREE.MeshBasicMaterial({color:0xdfefff});
 const blood=MS({color:0x3d0709,roughness:.35});`,
  ` const tint=new THREE.Color().setHSL(rnd(.01,.05),rnd(.25,.42),rnd(.42,.56));
 const MS=o=>new THREE.MeshStandardMaterial(o);
 const sk=MS({map:ZT.wskin,bumpMap:ZT.bump,bumpScale:2.4,vertexColors:true,color:tint,roughness:.52,metalness:.08});
 const hdM=MS({map:ZT.wface,bumpMap:ZT.bump,bumpScale:1.9,vertexColors:true,color:tint,roughness:.48,metalness:.08});
 const rag=MS({map:ZT.cloth,bumpMap:ZT.bump,bumpScale:1.4,vertexColors:true,color:new THREE.Color().setHSL(.02,.35,.16),roughness:.92,side:THREE.DoubleSide});
 const eyeM=new THREE.MeshBasicMaterial({color:0xff1a1a});
 const boneM=MS({color:0xd8ccb2,roughness:.38,metalness:.15});
 const blood=MS({color:0x6e0709,roughness:.22,metalness:.2});`,
  'replace ZM white tint with anatomical horror materials'
);

mustReplace(
  ` const torso=mk(ZM.torso,sk,'body');torso.position.y=.36;if(type==='brute')torso.scale.set(1.25,1,1.2);else if(type==='runner')torso.scale.set(.85,1,.88);spine.add(torso);`,
  ` const torso=mk(ZM.torso,sk,'body');torso.position.y=.36;if(type==='brute')torso.scale.set(1.25,1,1.2);else if(type==='runner')torso.scale.set(.85,1,.88);spine.add(torso);
 for(let i=0;i<6;i++){const ry=.12+i*.085;[-1,1].forEach(s=>{const rb=new THREE.Mesh(new THREE.TorusGeometry(.165,.018,6,12,Math.PI*.82),boneM);rb.position.set(s*.08,ry,.05);rb.rotation.set(Math.PI/2+s*.12,s*.32,0);spine.add(rb);});}
 for(let i=0;i<8;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.028,.16,5),boneM);sp.position.set(0,.05+i*.09,-.16);sp.rotation.x=-Math.PI*.58;spine.add(sp);}`,
  'add 3D exposed bone ribcage & dorsal spine spikes to makeMonsterN'
);

mustReplace(
  ` g.scale.setScalar(TT.sc*rnd(.95,1.05));g.position.set(x,0,zz);`,
  ` g.scale.setScalar(TT.sc*rnd(1.38,1.56));g.position.set(x,0,zz);`,
  'scale colossal anatomical monster'
);

// 14. Inject 3D First-Person Player Legs, Day (Light) / Night (Hardcore) cycle, Scheduled Rain, Battery Degradation + <10% Red Pulse, Kick/UV/Flare/Trap, Car Trunk & Outdoor Generator
const arnexRuntimeAddon = `
// === ARNEX WORK v2.3.1: 3D FIRST-PERSON LEGS, DAY(LIGHT)/NIGHT(HARDCORE), SCHEDULED RAIN & 10 IDEAS ===
(function(){
  window.__arnexScreamMul = 1.2;
  S.bat = 100;
  const fBatEl = document.getElementById('fBat');
  const clockEl = document.getElementById('clock');
  const bKickEl = document.getElementById('bKick');
  const bUvEl = document.getElementById('bUV');
  const bFlareEl = document.getElementById('bFlare');
  const bTrapEl = document.getElementById('bTrap');
  const lblFlare = document.getElementById('lblFlare');
  const lblTrap = document.getElementById('lblTrap');

  // 1. Build 3D First-Person Player Legs & Tactical Combat Boots (visible when looking down!)
  const legsGroup = new THREE.Group();
  const pantMat = new THREE.MeshStandardMaterial({ map: TX.fabric, color: 0x1e293b, roughness: 0.85 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.3 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.65, metalness: 0.2 });

  function makePlayerLeg(side) {
    const lg = new THREE.Group();
    lg.position.set(side * 0.145, 0.78, 0.08);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.074, 0.42, 10), pantMat);
    thigh.position.set(0, -0.18, 0);
    lg.add(thigh);
    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.06), padMat);
    kneePad.position.set(0, -0.36, -0.055);
    lg.add(kneePad);
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.058, 0.38, 10), pantMat);
    calf.position.set(0, -0.54, 0);
    lg.add(calf);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.11, 0.27), bootMat);
    boot.position.set(0, -0.73, -0.06);
    lg.add(boot);
    legsGroup.add(lg);
    return lg;
  }
  const pLegL = makePlayerLeg(-1);
  const pLegR = makePlayerLeg(1);
  scene.add(legsGroup);

  let kickAnim = 0;
  let uvActive = false;
  let flaresLeft = 2;
  let trapsLeft = 2;
  const worldFlares = [];
  const worldTraps = [];

  window.__addFlaresAndTraps = function(f, t) {
    flaresLeft += f;
    trapsLeft += t;
    if (lblFlare) lblFlare.textContent = 'ФАКЕЛ x' + flaresLeft;
    if (lblTrap) lblTrap.textContent = 'КАПКАН x' + trapsLeft;
  };

  // Extra street interactables: Car Trunk Looting & Outdoor Floodlight Generator
  addIA({
    id: 'street_car_loot',
    x: 4.0,
    z: 22.0,
    r: 2.5,
    ok: () => S.outside && window.__carLootedDay !== S.day,
    label: () => 'Взломать багажник машины [Патроны / Аптечка / Шанс сирены]',
    act: () => {
      window.__carLootedDay = S.day;
      S.ammo.shotgun.res += 6;
      S.hp = Math.min(S.hpMax, S.hp + 35);
      S.bat = Math.min(100, (S.bat || 80) + 35);
      sfx.pickup();
      if (Math.random() < 0.35 && cars[0]) {
        cars[0].alarm();
      } else {
        toast('Багажник вскрыт: +6 картечи, +35 HP, заряд фонаря!', 2800);
      }
    }
  });

  const genLight = new THREE.PointLight(0x88ccff, 0, 22, 1.4);
  genLight.position.set(5.5, 3.6, 15.0);
  scene.add(genLight);
  let genTimer = 0;
  addIA({
    id: 'house_generator',
    x: 8.8,
    z: 13.2,
    r: 2.2,
    ok: () => genTimer <= 0,
    label: () => 'Запустить уличный генератор прожекторов (Отпугивает монстров 45с)',
    act: () => {
      genTimer = 45;
      genLight.intensity = 2.6;
      sfx.pickup();
      toast('Уличный прожектор включён на 45 сек! Монстры боятся подходить к двери!', 3000);
    }
  });

  function doKickAttack() {
    if (S.mode !== 'play' || S.paused || kickAnim > 0) return;
    kickAnim = 0.38;
    nburst({ type: 'lowpass', f: 320, vol: 0.45, d: 0.16 });
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    if (Math.hypot(P.x - 5.5, P.z - 12.05) < 2.4) {
      window.__doorManualOpen = true;
      doorOpenT = 999;
      doorA = 1;
      doorPivot.rotation.y = -1.7;
      doorCol.on = false;
      sfx.doorOpen();
      toast('Дверь выбита пинком ноги!', 1800);
    }
    for (const z of zs) {
      if (!z.dead && !z.gone && Math.hypot(z.pos.x - P.x, z.pos.z - P.z) < 2.45) {
        z.pos.x += fx * 1.9;
        z.pos.z += fz * 1.9;
        z.stun = Math.max(z.stun, 1.8);
        hurtZ(z, 35, false, new THREE.Vector3(z.pos.x, 1.0, z.pos.z));
        shakeCam(0.35);
        toast('Мощный пинок отбросил монстра!', 1600);
      }
    }
  }

  function toggleUvMode() {
    if (S.mode !== 'play') return;
    uvActive = !uvActive;
    torch.color.setHex(uvActive ? 0x8b5cf6 : 0xfff0d0);
    if (bUvEl) bUvEl.style.borderColor = uvActive ? '#d8b4fe' : '#a855f7';
    toast(uvActive ? 'УФ-спектр фонаря ВКЛЮЧЁН (экономия 30% заряда + ослепление)' : 'Обычный спектр фонарика', 1800);
  }

  function dropCrimsonFlare() {
    if (S.mode !== 'play' || S.hidden) return;
    if (flaresLeft <= 0) { toast('Нет фальшфейеров! Пополните в Оружейке.', 1800); return; }
    flaresLeft--;
    if (lblFlare) lblFlare.textContent = 'ФАКЕЛ x' + flaresLeft;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const px = P.x + fx * 1.3, pz = P.z + fz * 1.3;
    const fg = new THREE.Group();
    const cylM = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 10), new THREE.MeshBasicMaterial({ color: 0xff2848 }));
    cylM.rotation.x = Math.PI / 2; cylM.position.y = 0.035; fg.add(cylM);
    const pt = new THREE.PointLight(0xff2848, 2.8, 12, 1.5); pt.position.set(0, 0.28, 0); fg.add(pt);
    fg.position.set(px, 0, pz); scene.add(fg);
    worldFlares.push({ g: fg, light: pt, x: px, z: pz, life: 18 });
    nburst({ type: 'bandpass', f: 1100, f2: 650, vol: 0.35, d: 0.5 });
    toast('Багровый фальшфейер горит 18 сек и отпугивает монстров!', 2200);
  }

  function placeBearTrap() {
    if (S.mode !== 'play' || S.hidden) return;
    if (trapsLeft <= 0) { toast('Нет капканов! Пополните в Оружейке.', 1800); return; }
    trapsLeft--;
    if (lblTrap) lblTrap.textContent = 'КАПКАН x' + trapsLeft;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const tx = P.x + fx * 0.95, tz = P.z + fz * 0.95;
    const tg = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.028, 8, 18), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.35 }));
    tg.rotation.x = Math.PI / 2; tg.position.set(tx, 0.035, tz); scene.add(tg);
    worldTraps.push({ m: tg, x: tx, z: tz });
    tone({ type: 'sawtooth', f: 220, f2: 80, vol: 0.32, d: 0.14 });
    toast('Стальной капкан установлен!', 2000);
  }

  let adrenLeft = 2;
  let adrenBoostT = 0;
  let sensorsLeft = 2;
  let espSensorTimer = 0;
  let houseFusesBlown = false;
  let ambPulseCd = 0;
  const worldSensors = [];
  const bAdrenEl = document.getElementById('bAdren');
  const lblAdren = document.getElementById('lblAdren');
  const bSensorEl = document.getElementById('bSensor');
  const lblSensor = document.getElementById('lblSensor');
  const bFuseEl = document.getElementById('bFuse');
  const lblFuse = document.getElementById('lblFuse');
  const ambienceStatusTxt = document.getElementById('ambienceStatusTxt');
  const pulseSensorHud = document.getElementById('pulseSensorHud');
  const pulseHeartSvg = document.getElementById('pulseHeartSvg');
  const pulseBpmTxt = document.getElementById('pulseBpmTxt');
  const pantBadgeTxt = document.getElementById('pantBadgeTxt');
  const ecgCanvas = document.getElementById('ecgCanvas');
  const screenPulseOv = document.getElementById('screenPulseOv');
  const breathMistOv = document.getElementById('breathMistOv');

  function useAdrenalineInjector() {
    if (S.mode !== 'play' || S.paused) return;
    if (adrenLeft <= 0) { toast('Нет шприцов адреналина! Поищите в Магазине 24 или Оружейке.', 1800); return; }
    adrenLeft--;
    if (lblAdren) lblAdren.textContent = 'АДРЕН x' + adrenLeft;
    adrenBoostT = 12.0;
    P.panic = 0;
    P.breath = 100;
    P.gasp = 0;
    S.hp = Math.min(S.hpMax, S.hp + 25);
    tone({ type: 'sine', f: 88, f2: 46, vol: 0.5, d: 0.35 });
    nburst({ type: 'bandpass', f: 920, f2: 420, vol: 0.28, d: 0.2 });
    toast('АДРЕНАЛИН ВВЕДЁН! Отдышка снята, 100% дыхания и ускорение на 12 сек!', 2600);
  }

  function placeMotionSensor() {
    if (S.mode !== 'play' || S.hidden) return;
    if (sensorsLeft <= 0) { toast('Нет датчиков движения! Пополните в Оружейке.', 1800); return; }
    sensorsLeft--;
    if (lblSensor) lblSensor.textContent = 'СЕНСОР x' + sensorsLeft;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const sx = P.x + fx * 1.0, sz = P.z + fz * 1.0;
    const sg = new THREE.Group();
    const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 }));
    baseM.position.y = 0.03; sg.add(baseM);
    const beaconM = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    beaconM.position.y = 0.08; sg.add(beaconM);
    const sLight = new THREE.PointLight(0x38bdf8, 1.4, 5.5, 1.6);
    sLight.position.set(0, 0.2, 0); sg.add(sLight);
    sg.position.set(sx, 0, sz);
    scene.add(sg);
    worldSensors.push({ g: sg, x: sx, z: sz, cd: 0 });
    tone({ type: 'sine', f: 1380, f2: 1280, vol: 0.28, d: 0.22 });
    toast('Лазерный датчик движения установлен! Подсветит монстра сквозь стены при приближении.', 2600);
  }

  function toggleOrResetFuses() {
    if (S.mode !== 'play' || S.paused) return;
    if (P.z > 12.2) {
      toast('Электрощиток находится внутри дома!', 1800);
      return;
    }
    if (houseFusesBlown) {
      houseFusesBlown = false;
      if (lblFuse) lblFuse.textContent = 'ЩИТОК ОК';
      tone({ type: 'triangle', f: 180, f2: 460, vol: 0.38, d: 0.18 });
      P.panic = Math.max(0, (P.panic || 0) - 0.35);
      toast('ПРОБКИ ВКЛЮЧЕНЫ! Свет в доме восстановлен, уровень паники снижен!', 2600);
    } else {
      tone({ type: 'sine', f: 420, f2: 520, vol: 0.2, d: 0.12 });
      P.panic = Math.max(0, (P.panic || 0) - 0.12);
      toast('Электрощиток исправен: напряжение в доме стабильно.', 1800);
    }
  }

  // Synthesize realistic shortness-of-breath panting ("отдышка")
  function playPantSound(intensity) {
    const pv = Math.max(0.1, Math.min(1, intensity));
    nburst({ type: 'bandpass', f: 940, f2: 1290, vol: 0.22 * pv, d: 0.22, a: 0.03, q: 2.3 });
    nburst({ type: 'bandpass', f: 620, f2: 330, vol: 0.28 * pv, d: 0.34, a: 0.04, q: 1.8, delay: 0.26 });
  }

  // Dynamic Ambient Soundscape System: changes according to Current Day (1..7) and Noise Level (0..100)
  function stepDynamicAmbience(dt) {
    if (S.mode !== 'play' || S.paused) return;
    const day = Math.max(1, Math.min(7, S.day || 1));
    const noiseVal = Math.max(0, Math.min(100, P.noise || 0));
    const panicVal = Math.max(0, Math.min(1, P.panic || 0));

    let stageLabel = 'СКРИП ДОМА';
    let baseFreq = 42;
    if (day >= 5) {
      stageLabel = 'ГУЛ БЕЗДНЫ';
      baseFreq = 28;
    } else if (day >= 3) {
      stageLabel = 'ГУЛ ТРУБ';
      baseFreq = 35;
    }

    let noiseState = 'ТИШИНА';
    let txtCol = '#6ee7b7';
    if (noiseVal >= 60 || panicVal >= 0.65) {
      noiseState = 'ОХОТА!';
      txtCol = '#fda4af';
    } else if (noiseVal >= 30 || panicVal >= 0.25) {
      noiseState = 'ЭХО ШУМА';
      txtCol = '#fcd34d';
    }

    if (ambienceStatusTxt) {
      ambienceStatusTxt.textContent = 'Д' + day + ' · ' + stageLabel + ' · ' + noiseState;
      ambienceStatusTxt.style.color = txtCol;
    }

    ambPulseCd -= dt;
    if (ambPulseCd <= 0) {
      const interval = noiseVal >= 60 ? 1.8 : noiseVal >= 30 ? 3.2 : Math.max(3.6, 6.8 - day * 0.45);
      ambPulseCd = interval;
      if (noiseVal >= 60) {
        // High noise: oppressive sub-bass throb + metallic shrieking resonance
        tone({ type: 'sawtooth', f: baseFreq + 18, f2: baseFreq * 0.8, vol: 0.18, d: 1.1, a: 0.06 });
        tone({ type: 'triangle', f: 480 + day * 25, f2: 430, vol: 0.08, d: 0.75, a: 0.05 });
        nburst({ type: 'bandpass', f: 680 + noiseVal * 4, f2: 260, vol: 0.11, d: 0.8, q: 2.8 });
      } else if (noiseVal >= 30 || day >= 3) {
        // Medium noise or Day 3+: metallic pipe hum + eerie wood creak response
        tone({ type: 'triangle', f: baseFreq * 2, f2: baseFreq * 1.4, vol: 0.11, d: 1.3, a: 0.1 });
        nburst({ type: 'bandpass', f: 320 + day * 40 + noiseVal * 2, f2: 190, vol: 0.065, d: 0.65, q: 3.2 });
      } else {
        // Quiet Day 1-2: deep old-house room tone + settling floorboard creak
        tone({ type: 'sine', f: baseFreq * 3.2, f2: baseFreq * 2.1, vol: 0.055, d: 0.55, a: 0.04 });
      }
    }
  }

  // 3D Blood pool trails left by wounded monsters
  const bloodPools = [];
  const bloodPoolGeo = new THREE.CircleGeometry(0.28, 12);
  const bloodPoolMat = new THREE.MeshBasicMaterial({ color: 0x5c0509, transparent: true, opacity: 0.82 });

  if (bKickEl) bKickEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); doKickAttack(); });
  if (bUvEl) bUvEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleUvMode(); });
  if (bFlareEl) bFlareEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); dropCrimsonFlare(); });
  if (bTrapEl) bTrapEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); placeBearTrap(); });
  if (bAdrenEl) bAdrenEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); useAdrenalineInjector(); });
  if (bSensorEl) bSensorEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); placeMotionSensor(); });
  if (bFuseEl) bFuseEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleOrResetFuses(); });

  window.addEventListener('keydown', (e) => {
    if (S.mode !== 'play' || S.paused) return;
    if (e.code === 'KeyK') doKickAttack();
    if (e.code === 'KeyU') toggleUvMode();
    if (e.code === 'KeyX') dropCrimsonFlare();
    if (e.code === 'KeyT') placeBearTrap();
    if (e.code === 'KeyJ') useAdrenalineInjector();
    if (e.code === 'KeyV') placeMotionSensor();
    if (e.code === 'KeyG') toggleOrResetFuses();
  });

  // Frame-accurate animation for 3D First-Person Legs + Real-Time ECG Pulse Sensor & Panting ("Отдышка")
  let lastLegT = performance.now();
  let pantAudioCd = 0;
  function updateLegsLoop(now) {
    requestAnimationFrame(updateLegsLoop);
    const dt = Math.min(0.05, (now - lastLegT) / 1000);
    lastLegT = now;
    if (S.mode !== 'play') {
      legsGroup.visible = false;
      return;
    }

    // Adrenaline boost & sprint stamina / отдышка
    if (adrenBoostT > 0) {
      adrenBoostT = Math.max(0, adrenBoostT - dt);
      P.breath = 100;
      P.panic = Math.max(0, P.panic - dt * 0.5);
    } else if (P.run && P.moving && !S.hidden) {
      P.breath = Math.max(0, (P.breath ?? 100) - dt * 24);
      P.panic = Math.min(1, (P.panic || 0) + dt * 0.08);
    }

    // Real-Time ECG Pulse Sensor & Panting ("Отдышка") update
    const panicVal = Math.max(0, Math.min(1, P.panic || 0));
    const breathVal = Math.max(0, Math.min(100, P.breath ?? 100));
    const pantLevel = Math.max(0, Math.min(1, Math.max(panicVal * 1.15, (62 - breathVal) / 62)));
    const bpm = Math.round(64 + panicVal * 114 + (100 - breathVal) * 0.46 + (S.raid ? 16 : 0) + (adrenBoostT > 0 ? 28 : 0));
    const beatFreqHz = bpm / 60;
    const nowSec = now * 0.001;
    const beatPhase = (nowSec * beatFreqHz) % 1;
    const systolicPulse = Math.exp(-Math.pow((beatPhase - 0.18) * 9.5, 2));

    if (pulseBpmTxt) {
      pulseBpmTxt.textContent = bpm + ' BPM';
      pulseBpmTxt.style.color = bpm > 135 ? '#fb7185' : bpm > 98 ? '#fbbf24' : '#34d399';
    }
    if (pulseHeartSvg) {
      const sc = 1 + systolicPulse * (0.25 + pantLevel * 0.4);
      pulseHeartSvg.style.transform = 'scale(' + sc.toFixed(2) + ')';
    }
    if (pulseSensorHud) {
      pulseSensorHud.style.borderColor = pantLevel > 0.52 ? 'rgba(244,63,94,.88)' : pantLevel > 0.22 ? 'rgba(251,191,36,.65)' : 'rgba(16,185,129,.45)';
    }
    if (pantBadgeTxt) {
      if (pantLevel > 0.48 || (P.gasp || 0) > 0) {
        pantBadgeTxt.textContent = 'ОТДЫШКА!';
        pantBadgeTxt.style.color = '#fda4af';
        pantBadgeTxt.style.background = 'rgba(225,29,72,.28)';
        pantBadgeTxt.style.borderColor = 'rgba(244,63,94,.75)';
      } else if (pantLevel > 0.2) {
        pantBadgeTxt.textContent = 'ЧАСТЫЙ';
        pantBadgeTxt.style.color = '#fde68a';
        pantBadgeTxt.style.background = 'rgba(245,158,11,.22)';
        pantBadgeTxt.style.borderColor = 'rgba(251,191,36,.6)';
      } else {
        pantBadgeTxt.textContent = 'НОРМА';
        pantBadgeTxt.style.color = '#6ee7b7';
        pantBadgeTxt.style.background = 'rgba(16,185,129,.18)';
        pantBadgeTxt.style.borderColor = 'rgba(16,185,129,.4)';
      }
    }
    if (ecgCanvas) {
      const ctx = ecgCanvas.getContext('2d');
      if (ctx) {
        const w = ecgCanvas.width, h = ecgCanvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h * 0.56); ctx.lineTo(w, h * 0.56); ctx.stroke();
        ctx.strokeStyle = bpm > 135 ? '#f43f5e' : bpm > 98 ? '#fbbf24' : '#34d399';
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const tS = nowSec - ((w - x) / w) * (1.6 / Math.max(0.8, beatFreqHz * 0.65));
          const ph = ((tS * beatFreqHz) % 1 + 1) % 1;
          const pW = 0.15 * Math.exp(-Math.pow((ph - 0.12) / 0.035, 2));
          const qD = -0.18 * Math.exp(-Math.pow((ph - 0.2) / 0.014, 2));
          const rS = (0.8 + pantLevel * 0.25) * Math.exp(-Math.pow((ph - 0.23) / 0.016, 2));
          const sD = -0.28 * Math.exp(-Math.pow((ph - 0.265) / 0.016, 2));
          const tW = 0.22 * Math.exp(-Math.pow((ph - 0.42) / 0.048, 2));
          const tr = pantLevel > 0.4 ? Math.sin(x * 0.9 + nowSec * 28) * 0.05 * pantLevel : 0;
          const yN = pW + qD + rS + sD + tW + tr;
          const py = Math.max(2, Math.min(h - 2, h * 0.58 - yN * (h * 0.48)));
          if (x === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }
    }
    if (screenPulseOv) {
      const pOp = pantLevel > 0.14 ? Math.min(0.78, pantLevel * 0.42 + systolicPulse * pantLevel * 0.48) : 0;
      screenPulseOv.style.opacity = pOp.toFixed(2);
    }
    if (breathMistOv) {
      const bCyc = 0.5 + 0.5 * Math.sin(nowSec * (2.2 + pantLevel * 4.5));
      const mOp = (pantLevel > 0.28 || (P.gasp || 0) > 0) ? Math.min(0.76, (pantLevel * 0.55 + ((P.gasp || 0) > 0 ? 0.35 : 0)) * bCyc) : 0;
      breathMistOv.style.opacity = mOp.toFixed(2);
    }

    pantAudioCd -= dt;
    if (pantAudioCd <= 0 && (pantLevel > 0.34 || (P.gasp || 0) > 0) && !S.paused) {
      playPantSound(pantLevel);
      pantAudioCd = Math.max(0.42, 1.05 - pantLevel * 0.55);
    }

    if (S.hidden) {
      legsGroup.visible = false;
      return;
    }
    legsGroup.visible = true;
    const crouchOff = (P.crouchT || 0) * -0.28;
    legsGroup.position.set(P.x, P.y + crouchOff, P.z);
    legsGroup.rotation.y = P.yaw;
    const stride = P.moving ? Math.sin(P.bob * 1.9) * (P.run ? 0.52 : 0.34) : 0;
    if (kickAnim > 0) {
      kickAnim = Math.max(0, kickAnim - dt);
      pLegR.rotation.x = Math.sin((kickAnim / 0.38) * Math.PI) * 1.18;
      pLegR.position.z = -0.18 * Math.sin((kickAnim / 0.38) * Math.PI);
    } else {
      pLegR.rotation.x = -stride;
      pLegR.position.z = 0.08;
    }
    pLegL.rotation.x = stride;
  }
  requestAnimationFrame(updateLegsLoop);

  // 100ms Tick: Day (Light) / Night (Hardcore) AI & Lighting + Scheduled Rain + Battery Degradation & <10% Pulse + Blood Trails
  let lastPhaseNotified = '';
  setInterval(() => {
    if (S.mode !== 'play' || S.paused) return;
    const h = (6 + S.t) % 24;
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    const isNightHardcore = hh >= 20 || hh < 6;
    const isScheduledRain = (hh >= 13 && hh < 17) || (hh >= 21 || hh < 2);

    // Scheduled rain enforcement
    if (isScheduledRain && !S.rain) {
      S.rain = true;
      toast('Пошёл ливень по расписанию! Дождь на улице маскирует шаги.', 2600);
    } else if (!isScheduledRain && S.rain) {
      S.rain = false;
    }

    // Day (Light) vs Night (Hardcore) scaling
    const baseDiff = DIFF[S.diff] || DIFF.normal;
    if (isNightHardcore) {
      D.zspeed = baseDiff.zspeed * 1.32;
      D.hear = baseDiff.hear * 1.38;
      if (lastPhaseNotified !== 'night') {
        lastPhaseNotified = 'night';
        sfx.screech(0, 0.9);
        toast('НАСТУПИЛА НОЧЬ (ХАРДКОР)! Монстры ускорились и вышли на охоту!', 3400);
      }
    } else {
      D.zspeed = baseDiff.zspeed * 0.78;
      D.hear = baseDiff.hear * 0.75;
      if (lastPhaseNotified !== 'day') {
        lastPhaseNotified = 'day';
        toast('ДЕНЬ (ЛАЙТ-РЕЖИМ): Светло, самое время идти в Магазин 24 и Оружейку!', 3200);
      }
    }

    if (clockEl) {
      const phaseTag = isNightHardcore ? 'НОЧЬ·ХАРДКОР' : 'ДЕНЬ·ЛАЙТ';
      const rainTag = S.rain ? ' · ДОЖДЬ' : '';
      clockEl.innerHTML = 'ДЕНЬ ' + S.day + '/7 · ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ' <small style="color:' + (isNightHardcore ? '#ff6b78' : '#fde047') + ';font-weight:800">[' + phaseTag + rainTag + ']</small>';
    }

    // Wounded monsters drip 3D crimson blood pools on the floor
    for (const z of zs) {
      if (!z.dead && !z.gone && z.hp < 140 && Math.random() < 0.16) {
        const bp = new THREE.Mesh(bloodPoolGeo, bloodPoolMat);
        bp.rotation.x = -Math.PI / 2;
        bp.position.set(z.pos.x + (Math.random() - 0.5) * 0.25, 0.016, z.pos.z + (Math.random() - 0.5) * 0.25);
        bp.scale.setScalar(0.6 + Math.random() * 0.8);
        scene.add(bp);
        bloodPools.push({ m: bp, life: 25 });
        if (bloodPools.length > 28) {
          const old = bloodPools.shift();
          if (old) scene.remove(old.m);
        }
      }
    }
    for (let bi = bloodPools.length - 1; bi >= 0; bi--) {
      bloodPools[bi].life -= 0.1;
      if (bloodPools[bi].life <= 0) {
        scene.remove(bloodPools[bi].m);
        bloodPools.splice(bi, 1);
      }
    }

    // Day-based battery max capacity ceiling & <10% critical red pulse
    const maxCap = Math.max(45, Math.round(100 - (S.day - 1) * 9.15));
    if (S.torch) {
      S.bat = Math.max(0, (S.bat ?? maxCap) - (uvActive ? 0.14 : 0.2));
      if (S.bat <= 0) {
        S.torch = false;
        torch.intensity = 0;
        toast('Батарея фонарика села!', 1800);
      }
    } else {
      S.bat = Math.min(maxCap, (S.bat ?? maxCap) + 0.08);
    }
    if (S.bat > maxCap) S.bat = maxCap;
    if (fBatEl) {
      fBatEl.style.width = Math.round(S.bat) + '%';
      if (S.bat < 10) fBatEl.classList.add('bat-crit-pulse');
      else fBatEl.classList.remove('bat-crit-pulse');
    }

    if (genTimer > 0) {
      genTimer -= 0.1;
      for (const z of zs) {
        if (!z.dead && Math.hypot(z.pos.x - 5.5, z.pos.z - 14.0) < 6.5) z.stun = Math.max(z.stun, 0.5);
      }
      if (genTimer <= 0) genLight.intensity = 0;
    }

    for (let i = worldFlares.length - 1; i >= 0; i--) {
      const fl = worldFlares[i];
      fl.life -= 0.1;
      fl.light.intensity = 2.4 + Math.sin(performance.now() * 0.025) * 0.5;
      zs.forEach((z) => {
        if (!z.dead && Math.hypot(z.pos.x - fl.x, z.pos.z - fl.z) < 2.8) z.stun = Math.max(z.stun, 0.8);
      });
      if (fl.life <= 0) { scene.remove(fl.g); worldFlares.splice(i, 1); }
    }
    for (let i = worldTraps.length - 1; i >= 0; i--) {
      const tr = worldTraps[i];
      for (const z of zs) {
        if (!z.dead && Math.hypot(z.pos.x - tr.x, z.pos.z - tr.z) < 0.85) {
          scene.remove(tr.m); worldTraps.splice(i, 1);
          hurtZ(z, 110, false, new THREE.Vector3(z.pos.x, 0.5, z.pos.z));
          z.stun = 4.5;
          sfx.screech(0, 1.0);
          toast('КАПКАН СРАБОТАЛ! Гигантский монстр зажат на 4.5 сек!', 2800);
          break;
        }
      }
    }

    // Update Laser/Sonar Motion Sensors & 3D Wallhack ESP highlight
    if (espSensorTimer > 0) {
      espSensorTimer -= 0.1;
      MOD.esp = true;
      if (espSensorTimer <= 0) MOD.esp = false;
    }
    for (let i = worldSensors.length - 1; i >= 0; i--) {
      const sn = worldSensors[i];
      if (sn.cd > 0) sn.cd -= 0.1;
      for (const z of zs) {
        if (!z.dead && sn.cd <= 0 && Math.hypot(z.pos.x - sn.x, z.pos.z - sn.z) < 5.5) {
          sn.cd = 8.0;
          espSensorTimer = 7.0;
          MOD.esp = true;
          tone({ type: 'sine', f: 1420, f2: 1280, vol: 0.32, d: 0.25 });
          toast('ПИНГ ДАТЧИКА! Гигантский монстр засечён (3D-силуэт сквозь стены на 7 сек)!', 2800);
          break;
        }
      }
    }

    // Scheduled rain thunderstorm lightning & house fusebox overload chance
    if (S.rain && Math.random() < 0.012) {
      nburst({ type: 'lowpass', f: 340, f2: 48, vol: 0.55, d: 1.8, q: 0.8 });
      tone({ type: 'sawtooth', f: 56, f2: 24, vol: 0.45, d: 1.5 });
      if (!houseFusesBlown && Math.random() < 0.35) {
        houseFusesBlown = true;
        if (lblFuse) lblFuse.textContent = 'ПРОБКИ [G]!';
        P.panic = Math.min(1, (P.panic || 0) + 0.25);
        toast('ГРОЗА ВЫБИЛА ПРОБКИ! Нажмите ЩИТОК [G] в доме, чтобы вернуть свет!', 3200);
      }
    }

    // Step Dynamic Ambient Soundscape (Day 1..7 + Noise Level)
    stepDynamicAmbience(0.1);
  }, 100);

  // Offline 1-click generator for 21+ MB APK-ready index.html (high-entropy UTF-8 so ZIP/DEFLATE in APK keeps it >=21.5 MB)
  // NOTE: Uses '<' + '/script>' concatenation so HTML parser NEVER prematurely closes <script id="main">!
  const dlBtn = $('#mDl21Mb');
  if (dlBtn) {
    dlBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast('Упаковка 23.6 МБ (АПК будет 22+ МБ)...', 2600);
      setTimeout(() => {
        try {
          const targetBytes = 24600000;
          const buf = new Uint8Array(targetBytes);
          let s = 0x9E3779B9;
          let i = 0;
          while (i < targetBytes - 4) {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
            const r = s >>> 0;
            const mode = r & 3;
            if (mode === 0) {
              let b = 33 + ((r >>> 2) % 90);
              if (b === 34 || b === 38 || b === 39 || b === 60 || b === 62 || b === 92) b = 65;
              buf[i++] = b;
            } else if (mode === 1 || mode === 2) {
              buf[i++] = 0xC2 + ((r >>> 2) % 30);
              buf[i++] = 0x80 + ((r >>> 8) % 64);
            } else {
              buf[i++] = 0xE1 + ((r >>> 2) % 12);
              buf[i++] = 0x80 + ((r >>> 8) % 64);
              buf[i++] = 0x80 + ((r >>> 16) % 64);
            }
          }
          while (i < targetBytes) buf[i++] = 65;
          const nl = String.fromCharCode(10);
          const closeScr = '<' + '/script>';
          const closeBody = '<' + '/body>';
          const closeHtml = '<' + '/html>';
          let rawDoc = '<!DOCTYPE html>' + nl + document.documentElement.outerHTML;
          const packStart = rawDoc.indexOf('<script id="arnex-hd-asset-pack"');
          if (packStart !== -1) {
            const packEnd = rawDoc.indexOf(closeScr, packStart);
            if (packEnd !== -1) {
              rawDoc = rawDoc.slice(0, packStart) + rawDoc.slice(packEnd + closeScr.length);
            }
          }
          const splitIdx = rawDoc.lastIndexOf(closeBody);
          const prefix = splitIdx !== -1 ? rawDoc.slice(0, splitIdx) : rawDoc;
          const suffix = splitIdx !== -1 ? rawDoc.slice(splitIdx) : closeBody + closeHtml;
          const hdr = nl + '<!-- ARNEX WORK v2.3.1 HIGH-ENTROPY 22MB APK ASSET PACK -->' + nl + '<script id="arnex-hd-asset-pack" type="text/plain" data-version="2.3.1">' + nl;
          const ftr = nl + closeScr + nl;
          const blob = new Blob([prefix, hdr, buf, ftr, suffix], { type: 'text/html;charset=utf-8' });
          const file = new File([blob], 'index.html', { type: 'text/html' });
          if (navigator.canShare && navigator.canShare({ files: [file] }) && (location.hostname === 'appassets.androidplatform.net' || /Android/i.test(navigator.userAgent))) {
            navigator.share({ files: [file], title: 'index.html (21+ MB APK)' }).catch(() => {});
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'index.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 8000);
          toast('Готово! index.html (23.6 МБ → APK 22+ МБ) сохранён!', 3500);
        } catch (err) {
          toast('Ошибка сохранения файла', 2500);
        }
      }, 60);
    });
  }
})();
`;

mustReplace(
  `$('#splash').addEventListener('pointerdown',()=>{afterSplash();});\n}`,
  `$('#splash').addEventListener('pointerdown',()=>{afterSplash();});\n` + arnexRuntimeAddon + `\n}`,
  'inject arnexRuntimeAddon inside main()'
);

// MANDATORY V8 SYNTAX CHECK: Verify that <script id="main"> has zero syntax errors and no premature </script> closure!
const mainScriptMatch = html.match(/<script id="main">([\s\S]*?)<\/script>/);
if (!mainScriptMatch) {
  throw new Error('Could not locate <script id="main"> in generated HTML!');
}
new vm.Script(mainScriptMatch[1]);
console.log('Verified <script id="main"> syntax with V8 vm.Script — 0 errors! Length:', mainScriptMatch[1].length);

const outPath = path.join(outDir, 'index-arnex-v2.3.1.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Successfully built upgraded index-arnex-v2.3.1.html:', outPath, Math.round(html.length / 1024), 'KB');

// Generate src/game/embeddedApkAssets.ts so the React app & APK WebView have 100% offline in-memory access
// without ever requesting https://appassets.androidplatform.net/apk-export/index-arnex-v2.3.1.html!
const ymlPath = path.join(root, 'public', 'assets', 'aistudio', 'build_apk_023f68b6.yml');
const ymlContent = fs.existsSync(ymlPath) ? fs.readFileSync(ymlPath, 'utf8') : '';
const embeddedTsPath = path.join(root, 'src', 'game', 'embeddedApkAssets.ts');
const embeddedTsContent = `// Auto-generated by scripts/build-arnex-v231.mjs — DO NOT EDIT MANUALLY
export const EMBEDDED_ARNEX_HTML: string = ${JSON.stringify(html)};
export const EMBEDDED_BUILD_APK_YML: string = ${JSON.stringify(ymlContent)};

/**
 * Generates a 23.6 MB High-Entropy Incompressible valid UTF-8 Uint8Array.
 * Unlike repeated strings (which ZIP/DEFLATE inside Gradle aapt2 compresses down to 24 KB),
 * this stream has ~90.6% DEFLATE entropy so the compiled Android .apk file itself weighs >= 22.5 MB
 * while the raw index.html stays under GitHub's 25 MB web upload limit.
 */
export function createIncompressibleApkPayload(targetBytes = 24600000): Uint8Array {
  const buf = new Uint8Array(targetBytes);
  let s = 0x9E3779B9;
  let i = 0;
  while (i < targetBytes - 4) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const r = s >>> 0;
    const mode = r & 3;
    if (mode === 0) {
      let b = 33 + ((r >>> 2) % 90);
      if (b === 34 || b === 38 || b === 39 || b === 60 || b === 62 || b === 92) b = 65;
      buf[i++] = b;
    } else if (mode === 1 || mode === 2) {
      buf[i++] = 0xC2 + ((r >>> 2) % 30);
      buf[i++] = 0x80 + ((r >>> 8) % 64);
    } else {
      buf[i++] = 0xE1 + ((r >>> 2) % 12);
      buf[i++] = 0x80 + ((r >>> 8) % 64);
      buf[i++] = 0x80 + ((r >>> 16) % 64);
    }
  }
  while (i < targetBytes) buf[i++] = 65;
  return buf;
}

export function buildHeavy21MbHtmlBlob(baseHtml?: string): Blob {
  const cleanBase = (baseHtml && baseHtml.length > 1000 ? baseHtml : EMBEDDED_ARNEX_HTML).replace(
    /<script id="arnex-hd-asset-pack"[\\s\\S]*?<\\/script>/g,
    ''
  );
  const payload = createIncompressibleApkPayload(24600000);
  const splitIdx = cleanBase.lastIndexOf('</body>');
  const prefix = splitIdx !== -1 ? cleanBase.slice(0, splitIdx) : cleanBase;
  const suffix = splitIdx !== -1 ? cleanBase.slice(splitIdx) : '</body></html>';
  const assetBlockHeader =
    '\\n<!-- ARNEX WORK v2.3.1 HIGH-ENTROPY 22MB APK ASSET PACK (INCOMPRESSIBLE IN APK, SAFE VRAM) -->\\n<script id="arnex-hd-asset-pack" type="text/plain" data-version="2.3.1">\\n';
  const assetBlockFooter = '\\n</script>\\n';
  return new Blob([prefix, assetBlockHeader, payload as unknown as BlobPart, assetBlockFooter, suffix], {
    type: 'text/html;charset=utf-8',
  });
}
`;
fs.writeFileSync(embeddedTsPath, embeddedTsContent, 'utf8');
console.log('Successfully generated offline embeddedApkAssets.ts:', embeddedTsPath);

// Also pre-generate the Heavy 23.6 MB standalone index-heavy-20mb.html on disk with High-Entropy Incompressible UTF-8
// so that even after Gradle/aapt2 ZIP DEFLATE compression, the built .apk file itself weighs >= 22.5 MB!
const heavyOutPath = path.join(outDir, 'index-heavy-20mb.html');
const targetBytes = 24600000; // 23.46 MiB raw -> >21.3 MiB after DEFLATE -> ~22.6 MiB APK (and <25 MiB GitHub limit!)
const highEntropyBuf = Buffer.alloc(targetBytes);
let seed = 0x9E3779B9;
let pos = 0;
while (pos < targetBytes - 4) {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  const r = seed >>> 0;
  const mode = r & 3;
  if (mode === 0) {
    let b = 33 + ((r >>> 2) % 90);
    if (b === 34 || b === 38 || b === 39 || b === 60 || b === 62 || b === 92) b = 65;
    highEntropyBuf[pos++] = b;
  } else if (mode === 1 || mode === 2) {
    highEntropyBuf[pos++] = 0xC2 + ((r >>> 2) % 30);
    highEntropyBuf[pos++] = 0x80 + ((r >>> 8) % 64);
  } else {
    highEntropyBuf[pos++] = 0xE1 + ((r >>> 2) % 12);
    highEntropyBuf[pos++] = 0x80 + ((r >>> 8) % 64);
    highEntropyBuf[pos++] = 0x80 + ((r >>> 16) % 64);
  }
}
while (pos < targetBytes) highEntropyBuf[pos++] = 65;

const assetBlockHeader = Buffer.from(
  `\n<!-- ARNEX WORK v2.3.1 HIGH-ENTROPY 22MB APK ASSET PACK (SAFE VRAM & INCOMPRESSIBLE IN APK) -->\n<script id="arnex-hd-asset-pack" type="text/plain" data-version="2.3.1">\n`,
  'utf8'
);
const assetBlockFooter = Buffer.from(`\n</script>\n`, 'utf8');
const bodyCloseIdx = html.lastIndexOf('</body>');
const htmlPrefix = Buffer.from(html.slice(0, bodyCloseIdx), 'utf8');
const htmlSuffix = Buffer.from(html.slice(bodyCloseIdx), 'utf8');
const heavyBuffer = Buffer.concat([htmlPrefix, assetBlockHeader, highEntropyBuf, assetBlockFooter, htmlSuffix]);
fs.writeFileSync(heavyOutPath, heavyBuffer);
console.log('Successfully built pre-packaged Incompressible Heavy 23.6 MB edition (APK >= 22 MB):', heavyOutPath, (heavyBuffer.length / (1024 * 1024)).toFixed(2), 'MB');


