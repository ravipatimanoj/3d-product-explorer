import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { explodedMode } from './explodedView'

interface ExplodedLayerProps {
  name?: string
  offset: readonly [number, number, number]
  children: ReactNode
}

export default function ExplodedLayer({
  name,
  offset,
  children,
}: ExplodedLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const current = useRef(new THREE.Vector3())
  const goal = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) {
      return
    }

    if (explodedMode.current) {
      goal.current.set(offset[0], offset[1], offset[2])
    } else {
      goal.current.set(0, 0, 0)
    }

    const step = 1 - Math.exp(-4.4 * delta)
    current.current.lerp(goal.current, step)
    group.position.copy(current.current)
  })

  return (
    <group ref={groupRef} name={name}>
      {children}
    </group>
  )
}
