import { Clamp } from '@/frontend/lib/utils';
import type { CameraCommandType, ViewType } from '../types';

export const HOME_VIEW: ViewType = { zoom: 1, turns: 0, pan: [0, 0] };
export const MAX_ZOOM = 3;
const STEP = 1.3;

/** The view after a toolbar button: zoom in steps (back to centre at 1×), turn a quarter, or start over. */
export const ApplyCommand = (view: ViewType, command: CameraCommandType): ViewType => {
  switch (command) {
    case 'zoomIn':
      return { ...view, zoom: Clamp(view.zoom * STEP, 1, MAX_ZOOM) };
    case 'zoomOut': {
      const zoom = Clamp(view.zoom / STEP, 1, MAX_ZOOM);
      return { ...view, zoom, pan: zoom === 1 ? [0, 0] : [view.pan[0] / STEP, view.pan[1] / STEP] };
    }
    case 'rotateLeft':
      return { ...view, turns: (view.turns + 3) % 4, pan: [0, 0] };
    case 'rotateRight':
      return { ...view, turns: (view.turns + 1) % 4, pan: [0, 0] };
    case 'reset':
      return HOME_VIEW;
  }
};
