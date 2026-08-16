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
  camera: {
    camera: { x: 1.72, y: 1.28, z: -2.48 },
    lookAt: { x: 0.16, y: 0.9, z: -0.05 },
  },
  flash: {
    camera: { x: 1.58, y: 1.12, z: -2.22 },
    lookAt: { x: 0.28, y: 0.81, z: -0.06 },
  },
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
