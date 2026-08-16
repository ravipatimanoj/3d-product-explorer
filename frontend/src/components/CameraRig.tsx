import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Position } from '../types/product'
import { OVERVIEW_CAMERA, OVERVIEW_TARGET } from './cameraOverview'

interface CameraRigProps {
  cameraPosition: Position | null
  lookAt: Position | null
  focusNonce: number
}

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

export default function CameraRig({
  cameraPosition,
  lookAt,
  focusNonce,
}: CameraRigProps) {
  const { camera, controls } = useThree()
  const goalPosition = useRef(new THREE.Vector3())
  const goalTarget = useRef(new THREE.Vector3())
  const animating = useRef(false)

  const overviewApplied = useRef(false)

  useEffect(() => {
    if (focusNonce === 0) {
      if (overviewApplied.current) {
        return
      }

      goalPosition.current.set(
        OVERVIEW_CAMERA.x,
        OVERVIEW_CAMERA.y,
        OVERVIEW_CAMERA.z,
      )
      goalTarget.current.set(
        OVERVIEW_TARGET.x,
        OVERVIEW_TARGET.y,
        OVERVIEW_TARGET.z,
      )
      camera.position.copy(goalPosition.current)
      const orbit = controls as OrbitLike | null
      if (orbit?.target) {
        orbit.target.copy(goalTarget.current)
        orbit.update()
        overviewApplied.current = true
      }
      animating.current = false
      return
    }

    if (!cameraPosition || !lookAt) {
      return
    }

    overviewApplied.current = false
    goalPosition.current.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    goalTarget.current.set(lookAt.x, lookAt.y, lookAt.z)
    animating.current = true
  }, [camera, cameraPosition, controls, lookAt, focusNonce])

  useFrame((_, delta) => {
    if (!animating.current) {
      return
    }

    const step = 1 - Math.exp(-3.4 * delta)
    camera.position.lerp(goalPosition.current, step)

    const orbit = controls as OrbitLike | null
    if (orbit?.target) {
      orbit.target.lerp(goalTarget.current, step)
      orbit.update()
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
