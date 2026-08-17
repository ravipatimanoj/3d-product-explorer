import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OVERVIEW_CAMERA, OVERVIEW_TARGET } from './cameraOverview'
import { EXPLODED_CAMERA, EXPLODED_TARGET, cameraCommand, explodedMode } from './explodedView'

interface OrbitLike {
  target: THREE.Vector3
  minDistance?: number
  update: () => void
}

function setOverviewGoal(
  goalPosition: THREE.Vector3,
  goalTarget: THREE.Vector3,
  exploded: boolean,
) {
  if (exploded) {
    goalPosition.set(EXPLODED_CAMERA.x, EXPLODED_CAMERA.y, EXPLODED_CAMERA.z)
    goalTarget.set(EXPLODED_TARGET.x, EXPLODED_TARGET.y, EXPLODED_TARGET.z)
    return
  }

  goalPosition.set(OVERVIEW_CAMERA.x, OVERVIEW_CAMERA.y, OVERVIEW_CAMERA.z)
  goalTarget.set(OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z)
}

export default function CameraRig() {
  const { camera, controls } = useThree()
  const goalPosition = useRef(new THREE.Vector3())
  const goalTarget = useRef(new THREE.Vector3())
  const animating = useRef(false)
  const overviewApplied = useRef(false)
  const lastFocusNonce = useRef(-1)
  const lastOverviewNonce = useRef(-1)
  const lastFeatureId = useRef<string | null>(null)
  const lastExploded = useRef(false)

  useEffect(() => {
    if (overviewApplied.current) {
      return
    }

    setOverviewGoal(
      goalPosition.current,
      goalTarget.current,
      explodedMode.current,
    )
    camera.position.copy(goalPosition.current)
    const orbit = controls as OrbitLike | null
    if (orbit?.target) {
      orbit.target.copy(goalTarget.current)
      orbit.update()
      overviewApplied.current = true
    }
    animating.current = false
  }, [camera, controls])

  useFrame((_, delta) => {
    let skipFeatureFocus = false

    if (explodedMode.current !== lastExploded.current) {
      lastExploded.current = explodedMode.current
      if (
        cameraCommand.featureId &&
        cameraCommand.cameraPosition &&
        cameraCommand.lookAt
      ) {
        lastFocusNonce.current = cameraCommand.focusNonce
        lastFeatureId.current = cameraCommand.featureId
        overviewApplied.current = false
        goalPosition.current.set(
          cameraCommand.cameraPosition.x,
          cameraCommand.cameraPosition.y,
          cameraCommand.cameraPosition.z,
        )
        goalTarget.current.set(
          cameraCommand.lookAt.x,
          cameraCommand.lookAt.y,
          cameraCommand.lookAt.z,
        )
      } else {
        setOverviewGoal(
          goalPosition.current,
          goalTarget.current,
          explodedMode.current,
        )
        overviewApplied.current = true
      }
      animating.current = true
      skipFeatureFocus = true
    }

    if (cameraCommand.overviewNonce !== lastOverviewNonce.current) {
      lastOverviewNonce.current = cameraCommand.overviewNonce
      if (cameraCommand.overviewNonce > 0) {
        setOverviewGoal(
          goalPosition.current,
          goalTarget.current,
          explodedMode.current,
        )
        overviewApplied.current = true
        animating.current = true
        skipFeatureFocus = true
      }
    }

    const featureChanged =
      cameraCommand.focusNonce !== lastFocusNonce.current ||
      cameraCommand.featureId !== lastFeatureId.current

    if (featureChanged) {
      lastFocusNonce.current = cameraCommand.focusNonce
      lastFeatureId.current = cameraCommand.featureId
      if (
        !skipFeatureFocus &&
        cameraCommand.featureId &&
        cameraCommand.cameraPosition &&
        cameraCommand.lookAt &&
        cameraCommand.focusNonce > 0
      ) {
        overviewApplied.current = false
        goalPosition.current.set(
          cameraCommand.cameraPosition.x,
          cameraCommand.cameraPosition.y,
          cameraCommand.cameraPosition.z,
        )
        goalTarget.current.set(
          cameraCommand.lookAt.x,
          cameraCommand.lookAt.y,
          cameraCommand.lookAt.z,
        )
        animating.current = true
      }
    }

    if (!animating.current) {
      return
    }

    const step = 1 - Math.exp(-3.4 * delta)
    camera.position.lerp(goalPosition.current, step)

    const orbit = controls as OrbitLike | null
    if (orbit?.target) {
      orbit.target.lerp(goalTarget.current, step)
      if (typeof orbit.minDistance === 'number') {
        orbit.minDistance = Math.min(orbit.minDistance, 0.35)
      }
      const nextPosition = camera.position.clone()
      orbit.update()
      camera.position.copy(nextPosition)
      camera.lookAt(orbit.target)
    } else {
      camera.lookAt(goalTarget.current)
    }

    const positionReached =
      camera.position.distanceTo(goalPosition.current) < 0.03
    const targetReached =
      !orbit?.target || orbit.target.distanceTo(goalTarget.current) < 0.03

    if (positionReached && targetReached) {
      animating.current = false
    }
  })

  return null
}
