import type { DINComponent } from '../../types/types';

export const CANVAS_FRAME_MIN_WIDTH = 860;
export const CANVAS_EXTRA_SCENE_WIDTH = 320;
export const CANVAS_FRAME_PADDING_X = 48;
export const CANVAS_FRAME_PADDING_TOP = 80;
export const CANVAS_FRAME_PADDING_BOTTOM = 112;
export const CANVAS_INNER_OFFSET_X = 64;
export const CANVAS_ROW_GAP = 16;
export const CANVAS_COMPONENT_GAP = 8;
export const CANVAS_MAIN_BREAKER_WIDTH = 80;
export const CANVAS_EARTH_BAR_X = 32;
export const CANVAS_NEUTRAL_BAR_OFFSET = 48;
export const CANVAS_STREET_INPUT_Y = -20;
export const CANVAS_PHASE_BUSBAR_Y = 115;
export const CANVAS_COMPONENTS_TOP_Y = 138;
export const CANVAS_COMPONENTS_BOTTOM_Y = 264;

interface ComponentMetric {
  width: number;
  bottomY: number;
  getTerminalX: (x: number, index: number) => number;
}

export interface CanvasComponentLayout {
  component: DINComponent;
  x: number;
  width: number;
  bottomY: number;
  getTerminalX: (index: number) => number;
}

export interface CanvasScene {
  frameWidth: number;
  mainBreakerCenterX: number;
  componentsStartX: number;
  streetInputY: number;
  phaseBusbarY: number;
  componentsTopY: number;
  componentsBottomY: number;
  earthBarX: number;
  neutralBarX: number;
  lastPhaseX: number;
  componentLayouts: CanvasComponentLayout[];
}

function getComponentMetric(component: DINComponent): ComponentMetric {
  if (component.type === 'idr') {
    return {
      width: 56,
      bottomY: 264,
      getTerminalX: (x, index) => x + 18 + index * 20,
    };
  }

  if (component.type === 'dps') {
    return {
      width: 32,
      bottomY: 254,
      getTerminalX: (x) => x + 16,
    };
  }

  const poles = component.poles || 1;
  const componentWidth = poles * 28 + (poles - 1) * 4 + 16;
  const terminalWidth = poles * 12 + (poles - 1) * 4;
  const startX = (componentWidth - terminalWidth) / 2;

  return {
    width: componentWidth,
    bottomY: component.type === 'mainBreaker' ? 268 : 254,
    getTerminalX: (x, index) => x + startX + index * 16 + 6,
  };
}

export function buildCanvasScene(canvasWidth: number, components: DINComponent[]): CanvasScene {
  const frameWidth = Math.max(CANVAS_FRAME_MIN_WIDTH, canvasWidth + CANVAS_EXTRA_SCENE_WIDTH);
  const mainBreakerCenterX =
    CANVAS_FRAME_PADDING_X + CANVAS_INNER_OFFSET_X + CANVAS_MAIN_BREAKER_WIDTH / 2;
  const componentsStartX =
    CANVAS_FRAME_PADDING_X + CANVAS_INNER_OFFSET_X + CANVAS_MAIN_BREAKER_WIDTH + CANVAS_ROW_GAP;

  let currentX = componentsStartX;
  let lastPhaseX = mainBreakerCenterX;

  const componentLayouts = components.map((component) => {
    const metric = getComponentMetric(component);
    const layout: CanvasComponentLayout = {
      component,
      x: currentX,
      width: metric.width,
      bottomY: metric.bottomY,
      getTerminalX: (index: number) => metric.getTerminalX(currentX, index),
    };

    const poles = component.poles || 1;
    for (let index = 0; index < poles; index += 1) {
      const terminalX = layout.getTerminalX(index);
      const isNeutralPole = component.type === 'idr' && index === poles - 1;
      if (!isNeutralPole && terminalX > lastPhaseX) {
        lastPhaseX = terminalX;
      }
    }

    currentX += metric.width + CANVAS_COMPONENT_GAP;
    return layout;
  });

  return {
    frameWidth,
    mainBreakerCenterX,
    componentsStartX,
    streetInputY: CANVAS_STREET_INPUT_Y,
    phaseBusbarY: CANVAS_PHASE_BUSBAR_Y,
    componentsTopY: CANVAS_COMPONENTS_TOP_Y,
    componentsBottomY: CANVAS_COMPONENTS_BOTTOM_Y,
    earthBarX: CANVAS_EARTH_BAR_X,
    neutralBarX: frameWidth - CANVAS_NEUTRAL_BAR_OFFSET,
    lastPhaseX,
    componentLayouts,
  };
}
