import { CreatePen, INK, ORANGE, PAPER, PEACH, PENCIL, type SketchStroke } from './sketch-pen';

/**
 * The hand-drawn cutaway of a company's stock behind its section: a supplier's truck at the door, goods scanned in,
 * racks of counted shelves, a packing bench, a van going out and a customer. Plain data, so the component only has to
 * paint it and the drawing can be re-laid without touching any React.
 */
export const SKETCH_WIDTH = 1280;
export const SKETCH_HEIGHT = 652;
/** Empty sky above the scene, where the section's text sits. */
export const SKETCH_TOP = -110;

const GROUND = 540;
const TRAIL = 584;
const CAPTION = 632;

export type SketchNote = { x: number; y: number; text: string; size?: number; rotate?: number; color?: string; weight?: number; anchor?: 'start' | 'middle' | 'end' };
/** `at` is when the pen reaches this part, in seconds after the sketch comes into view. */
export type SketchPart = { name: string; at: number; strokes: SketchStroke[]; notes?: SketchNote[] };
/** Where the parcel stops along the trail and what the laptop reports while it's there. */
export type SketchStop = { x: number; caption: string; status: string; detail: string };

export const ACCENT_TEXT = '#b35500';

export const STOPS: SketchStop[] = [
  { x: 160, caption: 'stock arrives', status: 'Delivery due', detail: 'PO-2041 · 24 boxes' },
  { x: 400, caption: 'scanned in', status: 'Received', detail: '+24 · goods in' },
  { x: 646, caption: 'on the shelf', status: 'On hand: 24', detail: 'Aisle B · shelf 3' },
  { x: 884, caption: 'picked & packed', status: 'Order #1042', detail: 'Packed · on hand: 23' },
  { x: 1090, caption: 'out for delivery', status: 'On the road', detail: 'Van 2 · 12 min away' },
  { x: 1226, caption: 'delivered!', status: 'Delivered', detail: 'Order #1042 · done' },
];

const pen = CreatePen();

/** A cardboard box seen from the front, with its strip of tape. */
const box = (x: number, base: number, w: number, h: number, hot = false): SketchStroke[] => [
  ...pen.rect(x, base - h, w, h, hot ? { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 5, roughness: 0.9 } : { back: PAPER, roughness: 0.9 }),
  ...pen.line(x + w / 2, base - h, x + w / 2, base - h * 0.62, { strokeWidth: 1.1, roughness: 0.6 }),
  ...pen.rect(x + w / 2 - 5, base - h, 10, h * 0.34, { strokeWidth: 0.9, roughness: 0.5, stroke: hot ? INK : PENCIL }),
];

/** A carton with depth: top and side faces behind its front. */
const carton = (x: number, base: number, w: number, h: number, depth: number): SketchStroke[] => [
  ...pen.poly([[x, base - h], [x + depth, base - h - depth * 0.6], [x + w + depth, base - h - depth * 0.6], [x + w, base - h]], { back: PEACH, roughness: 0.9 }),
  ...pen.poly([[x + w, base - h], [x + w + depth, base - h - depth * 0.6], [x + w + depth, base - depth * 0.6], [x + w, base]], { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 4, roughness: 0.9 }),
  ...pen.rect(x, base - h, w, h, { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 7, roughness: 0.9 }),
  ...pen.poly([[x + w * 0.42, base - h], [x + w * 0.58, base - h], [x + w * 0.58, base], [x + w * 0.42, base]], { back: PEACH, roughness: 0.7, strokeWidth: 1.1 }),
];

const wheel = (x: number, y: number, size: number): SketchStroke[] => [
  ...pen.circle(x, y, size, { back: PAPER, fill: INK, fillStyle: 'hachure', hachureGap: 3.2, fillWeight: 1.5 }),
  ...pen.circle(x, y, size * 0.42, { back: PAPER, strokeWidth: 1.2 }),
];

/** A stick figure in a hard hat. `hands` are where its two arms end. */
const worker = (x: number, foot: number, hands: [[number, number], [number, number]]): SketchStroke[] => {
  const head = foot - 104;
  const hip = foot - 44;
  const shoulder = foot - 80;
  return [
    ...pen.line(x, hip, x - 13, foot, { strokeWidth: 2 }),
    ...pen.line(x, hip, x + 13, foot, { strokeWidth: 2 }),
    ...pen.line(x, shoulder - 8, x, hip, { strokeWidth: 2 }),
    ...pen.line(x, shoulder, hands[0][0], hands[0][1], { strokeWidth: 2 }),
    ...pen.line(x, shoulder, hands[1][0], hands[1][1], { strokeWidth: 2 }),
    ...pen.circle(x, head, 26, { back: PAPER, strokeWidth: 1.8 }),
    ...pen.path(`M ${x - 15} ${head - 4} Q ${x} ${head - 28} ${x + 15} ${head - 4} Z`, { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 3, strokeWidth: 1.6 }),
    ...pen.line(x - 18, head - 4, x + 18, head - 4, { strokeWidth: 2.2 }),
  ];
};

/** A far-off shed and tree in pencil: past the scene's edges, so the background keeps going on a wide screen. */
const shed = (x: number, w: number, h: number): SketchStroke[] => [
  ...pen.rect(x, GROUND - h, w, h, { back: PAPER, stroke: PENCIL, strokeWidth: 1.2 }),
  ...pen.poly([[x - 9, GROUND - h], [x + w / 2, GROUND - h * 1.42], [x + w + 9, GROUND - h]], { back: PAPER, stroke: PENCIL, strokeWidth: 1.2 }),
  ...pen.rect(x + w * 0.36, GROUND - h * 0.5, w * 0.28, h * 0.5, { stroke: PENCIL, strokeWidth: 1 }),
];

const tree = (x: number, size: number): SketchStroke[] => [
  ...pen.line(x, GROUND, x, GROUND - size * 1.1, { stroke: PENCIL, strokeWidth: 1.4 }),
  ...pen.circle(x, GROUND - size * 1.5, size, { back: PAPER, stroke: PENCIL, strokeWidth: 1.2, fill: PENCIL, fillStyle: 'hachure', hachureGap: 7, fillWeight: 0.7 }),
];

const cloud = (x: number, y: number, scale: number): SketchStroke[] =>
  pen.path(
    `M ${x} ${y} q ${-30 * scale} ${-2 * scale} ${-26 * scale} ${-24 * scale} q ${4 * scale} ${-22 * scale} ${30 * scale} ${-16 * scale} q ${14 * scale} ${-30 * scale} ${50 * scale} ${-14 * scale} q ${34 * scale} ${-4 * scale} ${32 * scale} ${26 * scale} q ${16 * scale} ${28 * scale} ${-24 * scale} ${28 * scale} Z`,
    { stroke: PENCIL, strokeWidth: 1.3 },
  );

/* Shelves: each tier lists its boxes as [x, width, height, highlighted]. */
const TIERS = [320, 390, 460, 530];
const SHELF_BOXES: [number, number, number, boolean?][][] = [
  [[518, 42, 44], [564, 34, 34], [602, 30, 46]],
  [[516, 52, 52, true], [572, 58, 42]],
  [[520, 36, 38], [560, 38, 54], [602, 32, 30, true]],
  [[516, 56, 56], [576, 56, 48]],
  [[658, 44, 36], [706, 62, 50]],
  [],
  [[656, 50, 46], [710, 60, 56, true]],
  [[660, 54, 52], [718, 54, 44]],
];

const rack = (left: number, right: number): SketchStroke[] => [
  ...pen.line(left, 262, left, GROUND, { strokeWidth: 2.4 }),
  ...pen.line(right, 262, right, GROUND, { strokeWidth: 2.4 }),
  ...TIERS.flatMap((y) => pen.line(left - 5, y, right + 5, y, { strokeWidth: 2.4 })),
];

export const SCENE: SketchPart[] = [
  {
    name: 'ground',
    at: 0,
    strokes: [
      ...pen.line(-1000, GROUND, 2280, GROUND, { strokeWidth: 2, roughness: 1.2, bowing: 0.25 }),
      ...pen.line(30, GROUND + 7, 300, GROUND + 6, { stroke: PENCIL, strokeWidth: 1 }),
      ...pen.line(990, GROUND + 6, 1250, GROUND + 7, { stroke: PENCIL, strokeWidth: 1 }),
    ],
  },
  {
    name: 'sky',
    at: 0.2,
    strokes: [
      ...pen.circle(86, 78, 58, { fill: ORANGE, fillStyle: 'hachure', hachureGap: 5, stroke: ORANGE, strokeWidth: 1.6 }),
      ...[0, 45, 90, 135, 180, 225, 270, 315].flatMap((deg) => {
        const a = (deg * Math.PI) / 180;
        return pen.line(86 + Math.cos(a) * 40, 78 + Math.sin(a) * 40, 86 + Math.cos(a) * 54, 78 + Math.sin(a) * 54, { stroke: ORANGE, strokeWidth: 1.6 });
      }),
      ...cloud(226, 96, 1),
      ...cloud(-360, 118, 1.1),
      ...cloud(1560, 84, 1.2),
      ...[tree(-44, 46), shed(-236, 136, 92), tree(-292, 60), shed(-490, 170, 118), tree(-548, 42), shed(-730, 124, 80), tree(-790, 56)].flat(),
      ...[tree(1324, 52), shed(1372, 150, 100), tree(1572, 42), shed(1622, 130, 84), tree(1800, 58), shed(1850, 172, 118), tree(2070, 46)].flat(),
    ],
  },
  {
    name: 'truck',
    at: 0.35,
    strokes: [
      ...pen.poly([[34, 508], [290, 508], [270, 520], [54, 520]], { stroke: PENCIL, strokeWidth: 1, fill: PENCIL, fillStyle: 'hachure', hachureGap: 5 }),
      ...pen.rect(114, 366, 172, 136, { back: PAPER, strokeWidth: 2 }),
      ...[140, 168, 196, 224, 252].flatMap((x) => pen.line(x, 372, x, 496, { stroke: PENCIL, strokeWidth: 1 })),
      ...pen.poly([[114, 412], [72, 412], [36, 460], [36, 502], [114, 502]], { back: PAPER, strokeWidth: 2 }),
      ...pen.poly([[104, 422], [78, 422], [54, 456], [104, 456]], { back: PEACH, strokeWidth: 1.4 }),
      ...pen.circle(42, 478, 11, { fill: ORANGE, fillStyle: 'solid', strokeWidth: 1.2 }),
      ...pen.line(30, 503, 292, 503, { strokeWidth: 2.6 }),
      ...wheel(82, 512, 52),
      ...wheel(236, 512, 52),
      ...pen.line(286, 503, 316, GROUND - 2, { strokeWidth: 2 }),
    ],
    notes: [{ x: 200, y: 430, text: 'SUPPLIER', size: 30, weight: 700, rotate: -2, anchor: 'middle' }],
  },
  {
    name: 'building',
    at: 0.85,
    strokes: [
      ...pen.poly([[282, 230], [640, 118], [998, 230]], { strokeWidth: 2.4, back: PAPER }),
      ...pen.line(300, 222, 980, 222, { strokeWidth: 2 }),
      ...pen.line(300, 222, 300, 338, { strokeWidth: 2.2 }),
      ...pen.line(314, 222, 314, 338, { strokeWidth: 1.6 }),
      ...pen.line(980, 222, 980, 338, { strokeWidth: 2.2 }),
      ...pen.line(966, 222, 966, 338, { strokeWidth: 1.6 }),
      ...pen.rect(296, 338, 22, 12, { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 3 }),
      ...pen.rect(962, 338, 22, 12, { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 3 }),
      ...pen.line(342, 212, 420, 186, { stroke: PENCIL, strokeWidth: 1 }),
      ...pen.line(860, 186, 938, 212, { stroke: PENCIL, strokeWidth: 1 }),
      ...pen.rect(556, 160, 168, 44, { back: PAPER, strokeWidth: 1.6 }),
    ],
    notes: [{ x: 640, y: 190, text: 'your stock room', size: 27, weight: 700, anchor: 'middle' }],
  },
  {
    name: 'goods-in',
    at: 1.2,
    strokes: [
      ...pen.line(330, 532, 456, 532, { strokeWidth: 2.2 }),
      ...pen.line(330, 539, 456, 539, { strokeWidth: 1.4 }),
      ...[338, 392, 448].flatMap((x) => pen.line(x, 532, x, 539, { strokeWidth: 1.4 })),
      ...box(336, 532, 56, 56),
      ...box(394, 532, 50, 46),
      ...box(354, 476, 52, 48, true),
      ...worker(486, GROUND - 1, [[456, 438], [464, 472]]),
      ...pen.rect(444, 432, 14, 9, { fill: INK, fillStyle: 'solid' }),
      ...pen.line(444, 438, 404, 444, { stroke: ORANGE, strokeWidth: 1.8, dash: '5 5' }),
      ...pen.line(444, 438, 404, 462, { stroke: ORANGE, strokeWidth: 1.8, dash: '5 5' }),
    ],
    notes: [{ x: 400, y: 402, text: 'beep! +24 counted', size: 25, rotate: -3, anchor: 'middle' }],
  },
  {
    name: 'shelves',
    at: 1.6,
    strokes: [
      ...rack(510, 640),
      ...rack(650, 780),
      ...SHELF_BOXES.flatMap((row, i) => {
        const tier = TIERS[i % 4];
        return row.flatMap(([x, w, h, hot]) => box(x, tier, w, h, hot));
      }),
      ...box(658, 390, 28, 24),
      ...pen.rect(694, 340, 80, 46, { back: PEACH, stroke: ORANGE, strokeWidth: 1.6, roughness: 1.4 }),
    ],
    notes: [
      { x: 734, y: 361, text: 'only 3 left!', size: 20, weight: 700, color: ACCENT_TEXT, rotate: -3, anchor: 'middle' },
      { x: 734, y: 379, text: 'reorder', size: 17, color: ACCENT_TEXT, rotate: -3, anchor: 'middle' },
    ],
  },
  {
    name: 'bench',
    at: 2,
    strokes: [
      ...pen.path('M 800 262 Q 880 280 958 262', { strokeWidth: 1.2 }),
      ...pen.rect(812, 272, 42, 56, { back: PAPER, strokeWidth: 1.2, roughness: 1.4 }),
      ...pen.rect(866, 276, 42, 56, { back: PEACH, stroke: ORANGE, strokeWidth: 1.4, roughness: 1.4 }),
      ...pen.rect(918, 270, 34, 50, { back: PAPER, strokeWidth: 1.2, roughness: 1.4 }),
      ...[286, 298, 310].flatMap((y) => pen.line(818, y, 846, y, { stroke: PENCIL, strokeWidth: 1 })),
      ...[286, 298, 310].flatMap((y) => pen.line(924, y, 944, y, { stroke: PENCIL, strokeWidth: 1 })),
      ...worker(934, 470, [[900, 414], [906, 430]]),
      ...carton(824, 444, 66, 50, 18),
      ...pen.rect(804, 444, 156, 10, { back: PAPER, strokeWidth: 2 }),
      ...pen.line(816, 454, 816, GROUND, { strokeWidth: 2.4 }),
      ...pen.line(948, 454, 948, GROUND, { strokeWidth: 2.4 }),
      ...box(834, GROUND - 2, 46, 40),
      ...box(884, GROUND - 2, 38, 30, true),
    ],
    notes: [{ x: 887, y: 306, text: '#1042', size: 16, weight: 700, color: ACCENT_TEXT, rotate: 2, anchor: 'middle' }],
  },
  {
    name: 'van',
    at: 2.4,
    strokes: [
      ...pen.poly([[1000, 512], [1176, 512], [1158, 524], [1020, 524]], { stroke: PENCIL, strokeWidth: 1, fill: PENCIL, fillStyle: 'hachure', hachureGap: 5 }),
      ...pen.path('M 1006 506 L 1006 400 Q 1006 388 1018 388 L 1110 388 Q 1124 390 1136 424 L 1168 442 Q 1176 448 1176 462 L 1176 506 Z', { back: PAPER, strokeWidth: 2 }),
      ...pen.path('M 1112 400 Q 1120 402 1128 430 L 1092 430 L 1092 400 Z', { back: PEACH, strokeWidth: 1.4 }),
      ...pen.poly([[1006, 452], [1176, 452], [1176, 470], [1006, 470]], { fill: ORANGE, fillStyle: 'hachure', hachureGap: 4, strokeWidth: 1.2 }),
      ...pen.line(1000, 506, 1182, 506, { strokeWidth: 2.6 }),
      ...wheel(1044, 514, 46),
      ...wheel(1142, 514, 46),
      ...[[974, 420, 998], [964, 444, 998], [976, 468, 998]].flatMap(([x1, y, x2]) => pen.line(x1, y, x2, y, { stroke: PENCIL, strokeWidth: 1.4 })),
    ],
    notes: [{ x: 1046, y: 434, text: '#1042', size: 26, weight: 700, rotate: -2, anchor: 'middle' }],
  },
  {
    name: 'customer',
    at: 2.75,
    strokes: [
      ...pen.rect(1192, 424, 78, 116, { back: PAPER, strokeWidth: 2 }),
      ...pen.poly([[1184, 424], [1278, 424], [1268, 400], [1194, 400]], { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 4, strokeWidth: 1.6 }),
      ...pen.rect(1204, 474, 26, 66, { back: PEACH, strokeWidth: 1.4 }),
      ...pen.rect(1238, 444, 22, 28, { back: PAPER, strokeWidth: 1.2 }),
      ...pen.path('M 1232 338 C 1212 338 1206 358 1216 370 L 1232 392 L 1248 370 C 1258 358 1252 338 1232 338 Z', { back: PAPER, fill: ORANGE, fillStyle: 'hachure', hachureGap: 3.4, strokeWidth: 1.8 }),
      ...pen.circle(1232, 358, 13, { back: PAPER, strokeWidth: 1.3 }),
    ],
  },
  {
    name: 'screens',
    at: 3,
    strokes: [
      ...pen.rect(1058, 34, 176, 116, { back: PAPER, strokeWidth: 2 }),
      ...pen.poly([[1058, 150], [1234, 150], [1254, 172], [1038, 172]], { back: PAPER, strokeWidth: 2 }),
      ...pen.line(1126, 161, 1166, 161, { stroke: PENCIL, strokeWidth: 1.4 }),
      ...pen.line(1072, 62, 1220, 62, { stroke: PENCIL, strokeWidth: 1 }),
      ...pen.circle(1212, 50, 9, { fill: ORANGE, fillStyle: 'solid', stroke: ORANGE }),
      ...pen.curve([[1040, 176], [1000, 190], [960, 214], [900, 214]], { stroke: ORANGE, strokeWidth: 1.6, dash: '6 7', roughness: 0.7 }),
      ...pen.curve([[1160, 176], [1172, 240], [1136, 330], [1120, 384]], { stroke: ORANGE, strokeWidth: 1.6, dash: '6 7', roughness: 0.7 }),
    ],
    notes: [
      { x: 1072, y: 54, text: 'StockMotion', size: 19, weight: 700 },
      { x: 1030, y: 104, text: 'everyone sees', size: 25, anchor: 'end', rotate: -2 },
      { x: 1030, y: 130, text: 'the same numbers', size: 25, anchor: 'end', rotate: -2 },
    ],
  },
  {
    name: 'reorder',
    at: 3.3,
    strokes: [
      ...pen.curve([[726, 336], [770, 240], [700, 104], [470, 76], [290, 180], [206, 356]], { stroke: ORANGE, strokeWidth: 1.8, dash: '9 9', roughness: 0.6 }),
      ...pen.line(206, 356, 196, 334, { stroke: ORANGE, strokeWidth: 2.2 }),
      ...pen.line(206, 356, 226, 342, { stroke: ORANGE, strokeWidth: 2.2 }),
    ],
    notes: [
      { x: 126, y: 226, text: 'running low?', size: 26, weight: 600, color: ACCENT_TEXT, rotate: -2, anchor: 'middle' },
      { x: 126, y: 254, text: 'reorder in one go', size: 26, weight: 600, color: ACCENT_TEXT, rotate: -2, anchor: 'middle' },
    ],
  },
  {
    name: 'trail',
    at: 3.5,
    strokes: pen.line(STOPS[0].x, TRAIL, STOPS[STOPS.length - 1].x, TRAIL, { stroke: ORANGE, strokeWidth: 1.6, dash: '3 9', roughness: 0.5 }),
  },
];

export const SKETCH_PARCEL = {
  y: TRAIL,
  caption: CAPTION,
  strokes: [
    ...pen.rect(-14, -26, 28, 24, { back: PEACH, fill: ORANGE, fillStyle: 'hachure', hachureGap: 3.2, strokeWidth: 1.5, roughness: 0.8 }),
    ...pen.line(0, -26, 0, -2, { strokeWidth: 1.4, roughness: 0.4 }),
  ],
};

/** The hand-circled number beside each caption. */
export const SKETCH_MARKS: SketchStroke[][] = STOPS.map((stop) => pen.circle(stop.x, TRAIL, 24, { back: PAPER, stroke: ORANGE, strokeWidth: 1.5, roughness: 0.9 }));
