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

export const EXPLODED_CAMERA = { x: 2.15, y: 2.55, z: 8.65 }
export const EXPLODED_TARGET = { x: 0.05, y: 0.38, z: -0.22 }

export const EXPLODED_OFFSETS = {
  frame: [0, 0, 0],
  display: [0, 1.15, 0.95],
  internals: [1.22, 0.48, -0.05],
  battery: [-1.18, 0.32, 0.18],
  backGlass: [0, -0.55, -1.35],
  camera: [0.22, 1.08, -2.05],
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
  processor: { x: 1.82, y: 0.88, z: -1.72 },
  battery: { x: -1.85, y: 0.82, z: -1.65 },
  camera: { x: 1.48, y: 0.42, z: -1.58 },
  flash: { x: 0.68, y: -0.05, z: -0.45 },
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
