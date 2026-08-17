import type { Position, ProductFeature } from '../types/product'
import {
  offsetExplodedPosition,
  resolveExplodedCamera,
} from './explodedView'

export const OVERVIEW_CAMERA = { x: 1.55, y: 0.38, z: 5.15 }
export const OVERVIEW_TARGET = { x: 0, y: 0.12, z: 0 }
export const OVERVIEW_FOV = 30

const FEATURE_FOCUS_OVERRIDES: Record<
  string,
  { camera: Position; lookAt: Position }
> = {
  display: {
    camera: { x: 0.22, y: 0.18, z: 2.55 },
    lookAt: { x: 0.0, y: 0.12, z: 0.05 },
  },
  camera: {
    camera: { x: 0.62, y: 1.16, z: -0.95 },
    lookAt: { x: 0.16, y: 0.9, z: -0.05 },
  },
  flash: {
    camera: { x: 0.58, y: 0.76, z: -0.48 },
    lookAt: { x: 0.28, y: 0.81, z: -0.064 },
  },
  battery: {
    camera: { x: 0.28, y: 0.18, z: -2.95 },
    lookAt: { x: 0.0, y: 0.04, z: 0.0 },
  },
  processor: {
    camera: { x: 0.32, y: 0.42, z: -2.65 },
    lookAt: { x: 0.0, y: 0.22, z: 0.0 },
  },
  frame: {
    camera: { x: 2.15, y: 0.38, z: 2.55 },
    lookAt: { x: 0.0, y: 0.12, z: 0.0 },
  },
  'action-button': {
    camera: { x: -1.12, y: 0.92, z: 0.32 },
    lookAt: { x: -0.43, y: 0.9, z: 0.0 },
  },
  'volume-buttons': {
    camera: { x: -1.12, y: 0.62, z: 0.32 },
    lookAt: { x: -0.43, y: 0.6, z: 0.0 },
  },
  'power-button': {
    camera: { x: 1.12, y: 0.72, z: 0.32 },
    lookAt: { x: 0.43, y: 0.7, z: 0.0 },
  },
  'usb-c': {
    camera: { x: 0.06, y: -1.48, z: 0.52 },
    lookAt: { x: 0.0, y: -0.93, z: 0.0 },
  },
  speaker: {
    camera: { x: 0.38, y: -1.28, z: 0.78 },
    lookAt: { x: 0.2, y: -0.885, z: 0.05 },
  },
  microphone: {
    camera: { x: -0.38, y: -1.28, z: 0.78 },
    lookAt: { x: -0.2, y: -0.885, z: 0.05 },
  },
}

export function resolveHotspotPosition(feature: ProductFeature): Position {
  const override =
    FEATURE_FOCUS_OVERRIDES[feature.modelNodeName] ??
    FEATURE_FOCUS_OVERRIDES[feature.id]

  return override?.lookAt ?? feature.position
}

export function resolveFeatureFocus(
  feature: ProductFeature | null,
  exploded = false,
): {
  cameraPosition: Position | null
  lookAt: Position | null
} {
  if (!feature) {
    return { cameraPosition: null, lookAt: null }
  }

  const override =
    FEATURE_FOCUS_OVERRIDES[feature.modelNodeName] ??
    FEATURE_FOCUS_OVERRIDES[feature.id]

  const cameraPosition = override?.camera ?? feature.cameraPosition
  const lookAt = override?.lookAt ?? feature.position

  if (!exploded) {
    return { cameraPosition, lookAt }
  }

  const explodedLookAt = offsetExplodedPosition(lookAt, feature.modelNodeName)
  return {
    cameraPosition: resolveExplodedCamera(
      feature.modelNodeName,
      cameraPosition,
      explodedLookAt,
    ),
    lookAt: explodedLookAt,
  }
}
