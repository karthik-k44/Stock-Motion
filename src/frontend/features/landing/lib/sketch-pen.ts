import rough from 'roughjs';
import type { Drawable, Options } from 'roughjs/bin/core';

export const INK = '#1f1a17';
export const PENCIL = '#b9bbc6';
export const ORANGE = '#ff7900';
export const PEACH = '#ffe3c8';
/** The page the sketch is drawn on: shapes fill with it, so the drawing sits straight on the background. */
export const PAPER = '#ffffff';

/** One SVG path of the sketch. `draws` strokes are inked in by the pen; the rest (fills, dashes) fade in behind them. */
export type SketchStroke = { d: string; stroke: string; width: number; fill: string; draws: boolean; dash?: string };

type PenOptions = Options & {
  /** Paints this colour under the shape, so it hides what it stands in front of */
  back?: string;
  dash?: string;
};

type Point = [number, number];

const generator = rough.generator();

const BASE: Options = { stroke: INK, strokeWidth: 1.5, roughness: 1.1, bowing: 1.1, hachureGap: 6, fillWeight: 1.1, hachureAngle: -48 };

/** rough.js with a running seed: the wobble looks hand-drawn but is the same on every load. */
export const CreatePen = () => {
  let seed = 1;

  const ink = (draw: (o: Options) => Drawable, { back, dash, ...options }: PenOptions): SketchStroke[] => {
    const merged: Options = { ...BASE, ...options, seed: seed++ };
    const under = back ? draw({ ...merged, stroke: 'none', fill: back, fillStyle: 'solid', roughness: 0.4 }) : null;
    const paths = [...(under ? generator.toPaths(under) : []), ...generator.toPaths(draw(merged))];
    return paths.map((p) => ({
      d: p.d,
      stroke: p.stroke,
      width: p.strokeWidth,
      fill: p.fill ?? 'none',
      draws: !dash && p.stroke === merged.stroke && p.stroke !== 'none',
      dash,
    }));
  };

  return {
    rect: (x: number, y: number, w: number, h: number, o: PenOptions = {}) => ink((m) => generator.rectangle(x, y, w, h, m), o),
    line: (x1: number, y1: number, x2: number, y2: number, o: PenOptions = {}) => ink((m) => generator.line(x1, y1, x2, y2, m), o),
    circle: (x: number, y: number, diameter: number, o: PenOptions = {}) => ink((m) => generator.circle(x, y, diameter, m), o),
    ellipse: (x: number, y: number, w: number, h: number, o: PenOptions = {}) => ink((m) => generator.ellipse(x, y, w, h, m), o),
    poly: (points: Point[], o: PenOptions = {}) => ink((m) => generator.polygon(points, m), o),
    curve: (points: Point[], o: PenOptions = {}) => ink((m) => generator.curve(points, m), o),
    path: (d: string, o: PenOptions = {}) => ink((m) => generator.path(d, m), o),
  };
};
