import type { Position } from '../types/product'

export const explodedMode = { current: false }
export const flashLit = { current: false }

export const cameraCommand: {
  focusNonce: number
  overviewNonce: number
  featureId: string | null
  cameraPosition: Position | null
  lookAt: Position | null
} = {
  focusNonce: 0,
  overviewNonce: 0,
  featureId: null,
  cameraPosition: null,
  lookAt: null,
}

export const EXPLODED_CAMERA = { x: 4.15, y: 1.32, z: 4.35 }
export const EXPLODED_TARGET = { x: 0.0, y: 0.18, z: -0.06 }

export const EXPLODED_OFFSETS = {
  frame: [0, 0, 0],
  display: [0, 0.08, 0.62],
  internals: [0.82, 0.2, -0.06],
  battery: [-0.82, 0.1, 0.12],
  backGlass: [0, -0.1, -0.95],
  camera: [0.12, 0.18, -0.92],
} as const

export const EXPLODED_HOTSPOT_NODES = new Set([
  'display',
  'battery',
  'processor',
  'frame',
  'camera',
  'flash',
])

type ExplodedLayerName = keyof typeof EXPLODED_OFFSETS

const NODE_LAYER: Record<string, ExplodedLayerName> = {
  frame: 'frame',
  'action-button': 'frame',
  'volume-buttons': 'frame',
  'power-button': 'frame',
  'usb-c': 'frame',
  speaker: 'frame',
  microphone: 'frame',
  display: 'display',
  processor: 'internals',
  battery: 'battery',
  camera: 'camera',
  flash: 'camera',
}

export function getExplodedOffset(
  nodeName: string,
): readonly [number, number, number] {
  const layer = NODE_LAYER[nodeName] ?? 'frame'
  return EXPLODED_OFFSETS[layer]
}

export function offsetExplodedPosition(
  position: Position,
  nodeName: string,
): Position {
  const offset = getExplodedOffset(nodeName)
  return {
    x: position.x + offset[0],
    y: position.y + offset[1],
    z: position.z + offset[2],
  }
}

const EXPLODED_EYE_FROM_LOOKAT: Record<string, Position> = {
  display: { x: 0.18, y: 0.04, z: 2.35 },
  processor: { x: 0.72, y: 0.18, z: -1.45 },
  battery: { x: -1.05, y: 0.38, z: -0.92 },
  camera: { x: 0.68, y: 0.16, z: -0.78 },
  flash: { x: 0.34, y: 0.02, z: -0.36 },
  frame: { x: 2.05, y: 0.35, z: 2.45 },
}

export function resolveExplodedCamera(
  nodeName: string,
  assembledCamera: Position,
  explodedLookAt: Position,
): Position {
  const eye = EXPLODED_EYE_FROM_LOOKAT[nodeName]
  if (eye) {
    return {
      x: explodedLookAt.x + eye.x,
      y: explodedLookAt.y + eye.y,
      z: explodedLookAt.z + eye.z,
    }
  }

  return offsetExplodedPosition(assembledCamera, nodeName)
}
