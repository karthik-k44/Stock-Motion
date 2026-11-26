/**
 * Renders the landing page's scenario illustrations to public/landing/scenarios/<id>.jpg (1600×1000).
 *
 *   npm run illustrations
 *
 * Each scene (scenes.ts) is drawn by the live world's isometric renderer into a standalone HTML page with its
 * tags, pin and notification, then photographed with the installed Chrome (playwright-core, no browser download).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PrepareScene } from '../../src/frontend/features/world/lib/iso/prepare';
import { ILLUSTRATIONS, type IllustrationType, type NoteIconType, type ToneType } from './scenes';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CACHE = `${ROOT}.cache/illustrations/`;
const OUT = `${ROOT}public/landing/scenarios/`;
const FONT = pathToFileURL(`${ROOT}node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2`).href;
const W = 1600;
const H = 1000;

const TONE: Record<ToneType, { solid: string; ink: string; soft: string; text: string }> = {
  primary: { solid: '#ff7900', ink: '#111', soft: '#fff5eb', text: '#b35500' },
  danger: { solid: '#c42b2b', ink: '#fff', soft: '#fdecec', text: '#c42b2b' },
  warning: { solid: '#a16207', ink: '#fff', soft: '#fef6d6', text: '#a16207' },
  success: { solid: '#15803d', ink: '#fff', soft: '#e8f6ed', text: '#15803d' },
  neutral: { solid: '#57534e', ink: '#fff', soft: '#f1eeeb', text: '#57534e' },
};

const ICON: Record<NoteIconType, string> = {
  alert: 'M12 3l10 18H2zM12 10v4M12 17.5v.5',
  truck: 'M2 7h11v9H2zM13 10h4l4 4v2h-8M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
  coffee: 'M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h1.5a2.5 2.5 0 010 5H17M8 2v3M12 2v3',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  check: 'M5 12l5 5L20 7',
};

const icon = (name: NoteIconType, color: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[name]}"/></svg>`;

const PANELS = {
  history: `
    <div class="panel" style="right:70px;top:150px;width:470px">
      <div class="panel-eyebrow">Stock history</div>
      <div class="panel-title">Bluetooth Speaker Mini</div>
      ${[
        ['−2', 'danger', 'Damaged in the aisle', 'Sam K.', '10:42'],
        ['+120', 'success', 'Received · DLV-2041', 'Priya M.', '09:15'],
        ['−6', 'primary', 'Picked · SO-10231', 'Alex R.', 'Yesterday'],
        ['+4', 'neutral', 'Stock count · A-1-4', 'Sam K.', 'Mon'],
      ]
        .map(([delta, tone, why, who, when]) => {
          const t = TONE[tone as ToneType];
          return `<div class="row"><span class="delta" style="background:${t.soft};color:${t.text}">${delta}</span><div class="row-main"><div class="row-why">${why}</div><div class="row-who">${who}</div></div><span class="row-when">${when}</span></div>`;
        })
        .join('')}
    </div>`,
  dashboard: `
    <div class="panel" style="right:70px;top:120px;width:500px">
      <div class="panel-eyebrow">Today</div>
      <div class="kpis">
        ${[
          ['Revenue', '$2,480', '+12% vs last Tue', 'success'],
          ['Orders shipped', '18', '4 left to pack', 'primary'],
          ['Low stock', '3', '1 out · reorders booked', 'danger'],
          ['Arriving', '384', 'units on 2 trucks', 'neutral'],
        ]
          .map(([label, value, sub, tone]) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub" style="color:${TONE[tone as ToneType].text}">${sub}</div></div>`)
          .join('')}
      </div>
      <div class="bars">${[38, 52, 44, 70, 58, 86, 74].map((h, i) => `<span style="height:${h}%;background:${i === 5 ? '#ff7900' : '#ffd2ad'}"></span>`).join('')}</div>
      <div class="bars-label"><span>Mon</span><span>Sun</span></div>
    </div>`,
};

const page = (il: IllustrationType) => {
  const prepared = PrepareScene({ size: il.size, label: il.id, ground: il.ground, groups: il.groups, movers: [], hotspots: [], pins: [], links: {}, owners: {} }, 0);
  const { proj } = prepared;
  // The set fills the free area (left of a panel when there is one), letterboxed to keep its proportions.
  const stage = il.panel ? { l: 30, t: 60, w: 1010, h: 880 } : { l: 70, t: 50, w: 1460, h: 900 };
  const fit = Math.min(stage.w / proj.W, stage.h / proj.H);
  const box = { w: proj.W * fit, h: proj.H * fit, l: stage.l + (stage.w - proj.W * fit) / 2, t: stage.t + (stage.h - proj.H * fit) / 2 };
  const at = ([x, z, y]: [number, number, number]) => {
    const [px, py] = proj.pt(x, z, y);
    return { left: box.l + px * fit, top: box.t + py * fit };
  };
  const polys = [...prepared.ground, ...prepared.groups.flatMap((g) => g.polys)]
    .map((p) => `<polygon points="${p.points}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="0.6" stroke-linejoin="round"/>`)
    .join('');
  const tags = il.tags
    .map((t) => {
      const p = at(t.at);
      const c = TONE[t.tone];
      return `<div class="tag" style="left:${p.left}px;top:${p.top}px"><span class="pill"><span class="chip" style="background:${c.solid};color:${c.ink}">${t.chip}</span>${t.text}</span><span class="stem"></span></div>`;
    })
    .join('');
  const pins = il.pins
    .map((pin) => {
      const p = at(pin.at);
      const color = pin.tone === 'danger' ? '#c42b2b' : '#ff7900';
      return `<svg class="pin" style="left:${p.left}px;top:${p.top}px" width="44" height="58" viewBox="0 0 34 44"><path d="M17 43c0 0 15-15.5 15-26.5A15 15 0 0 0 2 16.5C2 27.5 17 43 17 43z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="16.5" r="5.5" fill="#fff"/></svg>`;
    })
    .join('');
  const corner = { tl: 'left:70px;top:70px', tr: 'right:70px;top:70px', bl: 'left:70px;bottom:70px', br: 'right:70px;bottom:70px' };
  const note = il.note
    ? (() => {
        const c = TONE[il.note.tone];
        return `<div class="note" style="${corner[il.note.corner]}"><span class="note-icon" style="background:${c.soft}">${icon(il.note.icon, c.text)}</span><div class="note-main"><div class="note-title">${il.note.title}</div><div class="note-body">${il.note.body}</div></div><span class="note-time">${il.note.time}</span></div>`;
      })()
    : '';
  const [a, b] = il.tint;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url("${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; }
body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; font-family: Inter, sans-serif; color: #1c1917;
  background: radial-gradient(70% 70% at 15% 0%, ${a} 0%, rgb(255 255 255 / 0) 70%), radial-gradient(65% 70% at 100% 100%, ${b} 0%, rgb(255 255 255 / 0) 70%), linear-gradient(160deg, #fffaf4 0%, #fff4ea 100%); }
.scene { position: absolute; left: ${box.l}px; top: ${box.t}px; width: ${box.w}px; height: ${box.h}px; filter: drop-shadow(0 30px 40px rgb(107 51 0 / 0.14)); }
.tag { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; }
.pill { display: flex; align-items: center; gap: 9px; padding: 6px 16px 6px 6px; border-radius: 999px; background: #fff; border: 1px solid #ebe6e1; font-size: 19px; font-weight: 600; white-space: nowrap; box-shadow: 0 10px 26px rgb(107 51 0 / 0.2); }
.chip { padding: 4px 11px; border-radius: 999px; font-size: 17px; font-weight: 700; }
.stem { width: 3px; height: 18px; background: rgb(255 121 0 / 0.6); }
.pin { position: absolute; transform: translate(-50%, -100%); filter: drop-shadow(0 6px 8px rgb(28 25 23 / 0.3)); }
.note { position: absolute; display: flex; align-items: center; gap: 16px; width: 520px; padding: 18px 22px; border-radius: 22px; background: rgb(255 255 255 / 0.96); box-shadow: 0 28px 60px -18px rgb(107 51 0 / 0.35), 0 0 0 1px rgb(28 25 23 / 0.05); }
.note-icon { display: grid; place-items: center; width: 52px; height: 52px; flex: none; border-radius: 15px; }
.note-main { flex: 1; min-width: 0; }
.note-title { font-size: 21px; font-weight: 700; letter-spacing: -0.01em; }
.note-body { margin-top: 3px; font-size: 16.5px; color: #6f6862; }
.note-time { align-self: flex-start; font-size: 14px; color: #8a827b; white-space: nowrap; }
.panel { position: absolute; padding: 28px; border-radius: 26px; background: #fff; box-shadow: 0 40px 80px -30px rgb(107 51 0 / 0.4), 0 0 0 1px rgb(28 25 23 / 0.05); }
.panel-eyebrow { font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b35500; }
.panel-title { margin-top: 6px; font-size: 25px; font-weight: 700; letter-spacing: -0.01em; }
.row { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid #f1ece7; }
.row:last-child { border-bottom: 0; }
.delta { min-width: 66px; padding: 7px 0; border-radius: 12px; text-align: center; font-size: 19px; font-weight: 700; }
.row-main { flex: 1; }
.row-why { font-size: 18px; font-weight: 600; }
.row-who { margin-top: 2px; font-size: 15px; color: #6f6862; }
.row-when { font-size: 15px; color: #8a827b; }
.kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 18px; }
.kpi { padding: 16px; border-radius: 16px; background: #faf6f2; }
.kpi-label { font-size: 15px; color: #6f6862; font-weight: 600; }
.kpi-value { margin-top: 4px; font-size: 34px; font-weight: 800; letter-spacing: -0.02em; }
.kpi-sub { margin-top: 2px; font-size: 14px; font-weight: 600; }
.bars { display: flex; align-items: flex-end; gap: 12px; height: 120px; margin-top: 22px; }
.bars span { flex: 1; border-radius: 8px 8px 4px 4px; }
.bars-label { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #8a827b; }
</style></head><body>
<svg class="scene" viewBox="0 0 ${proj.W} ${proj.H}">${polys}</svg>
${pins}${tags}${note}${il.panel ? PANELS[il.panel] : ''}
</body></html>`;
};

const main = async () => {
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  const files = ILLUSTRATIONS.map((il) => {
    const file = `${CACHE}${il.id}.html`;
    writeFileSync(file, page(il));
    return { id: il.id, file };
  });

  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const f of files) {
    await tab.goto(pathToFileURL(f.file).href);
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: `${OUT}${f.id}.jpg`, type: 'jpeg', quality: 84 });
    console.log(`rendered ${f.id}.jpg`);
  }
  await browser.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
