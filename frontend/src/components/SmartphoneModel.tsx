import { useMemo, type ReactNode } from 'react'
import { Outlines, RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

const PHONE = {
  width: 0.86,
  height: 2.12,
  depth: 0.092,
  radius: 0.08,
  centerY: 0.12,
} as const

const FRAME_COLOR = '#efe6db'
const GLASS_COLOR = '#10141b'
const BACK_GLASS_COLOR = '#8fa0b3'
const ISLAND_COLOR = '#2f3642'
const ACCENT_EMISSIVE = '#3b82f6'

interface SmartphoneModelProps {
  selectedNodeName: string | null
  onSelectNode: (nodeName: string) => void
}

export default function SmartphoneModel({
  selectedNodeName,
  onSelectNode,
}: SmartphoneModelProps) {
  const internalsOpen =
    selectedNodeName === 'battery' || selectedNodeName === 'processor'

  return (
    <group>
      <Frame selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Display selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <BackGlass internalsOpen={internalsOpen} />
      <CameraModule selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Flash selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <ActionButton selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <VolumeButtons selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <PowerButton selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <UsbCPort selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Speaker selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Microphone selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Battery selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
      <Processor selectedNodeName={selectedNodeName} onSelectNode={onSelectNode} />
    </group>
  )
}

interface PartProps {
  selectedNodeName: string | null
  onSelectNode: (nodeName: string) => void
}

function Frame({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('frame', selectedNodeName, FRAME_COLOR)

  return (
    <SelectablePart nodeName="frame" onSelectNode={onSelectNode}>
      <RoundedBox
        args={[PHONE.width, PHONE.height, PHONE.depth]}
        radius={PHONE.radius}
        smoothness={8}
        position={[0, PHONE.centerY, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={look.color}
          metalness={0.88}
          roughness={0.26}
          clearcoat={0.35}
          clearcoatRoughness={0.28}
          emissive={look.emissive}
          emissiveIntensity={look.emissiveIntensity}
        />
        <SelectionOutline selected={look.selected} />
      </RoundedBox>
    </SelectablePart>
  )
}

function Display({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('display', selectedNodeName, GLASS_COLOR)

  return (
    <SelectablePart nodeName="display" onSelectNode={onSelectNode}>
      <RoundedBox
        args={[PHONE.width - 0.1, PHONE.height - 0.12, 0.008]}
        radius={0.055}
        smoothness={4}
        position={[0, PHONE.centerY, PHONE.depth / 2 + 0.001]}
      >
        <meshPhysicalMaterial
          color={look.color}
          metalness={0.18}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={look.selected ? ACCENT_EMISSIVE : '#152033'}
          emissiveIntensity={look.selected ? 0.28 : 0.08}
        />
        <SelectionOutline selected={look.selected} />
      </RoundedBox>
      <mesh position={[0, 1.04, PHONE.depth / 2 + 0.007]}>
        <boxGeometry args={[0.18, 0.01, 0.004]} />
        <meshStandardMaterial color="#1c2128" metalness={0.7} roughness={0.28} />
      </mesh>
    </SelectablePart>
  )
}

function BackGlass({ internalsOpen }: { internalsOpen: boolean }) {
  return (
    <RoundedBox
      args={[PHONE.width - 0.05, PHONE.height - 0.07, 0.006]}
      radius={0.06}
      smoothness={4}
      position={[0, PHONE.centerY, -PHONE.depth / 2 + 0.004]}
    >
      <meshPhysicalMaterial
        color={BACK_GLASS_COLOR}
        metalness={0.22}
        roughness={internalsOpen ? 0.08 : 0.16}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transparent
        opacity={internalsOpen ? 0.28 : 0.94}
        transmission={internalsOpen ? 0.22 : 0.04}
        thickness={0.03}
      />
    </RoundedBox>
  )
}

function CameraModule({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('camera', selectedNodeName, ISLAND_COLOR)

  return (
    <SelectablePart nodeName="camera" onSelectNode={onSelectNode}>
      <group position={[0.16, 0.9, -PHONE.depth / 2 - 0.01]}>
        <RoundedBox args={[0.38, 0.42, 0.012]} radius={0.07} smoothness={4}>
          <meshStandardMaterial
            color="#b7c0cb"
            metalness={0.7}
            roughness={0.22}
          />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.4, 0.03]} radius={0.06} smoothness={4} castShadow>
          <meshStandardMaterial
            color={look.color}
            metalness={0.62}
            roughness={0.24}
            emissive={look.emissive}
            emissiveIntensity={look.emissiveIntensity}
          />
          <SelectionOutline selected={look.selected} />
        </RoundedBox>
        <Lens position={[-0.08, 0.08, 0.02]} radius={0.058} selected={look.selected} />
        <Lens position={[0.08, 0.08, 0.02]} radius={0.046} selected={look.selected} />
        <Lens position={[-0.08, -0.09, 0.02]} radius={0.04} selected={look.selected} />
      </group>
    </SelectablePart>
  )
}

function Flash({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('flash', selectedNodeName, '#f4efe4')

  return (
    <SelectablePart nodeName="flash" onSelectNode={onSelectNode}>
      <mesh position={[0.28, 0.81, -PHONE.depth / 2 - 0.018]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 24]} />
        <meshStandardMaterial
          color={look.color}
          emissive={look.selected ? '#fff3c4' : '#f7f1d8'}
          emissiveIntensity={look.selected ? 1.4 : 0.35}
          metalness={0.2}
          roughness={0.18}
        />
        <SelectionOutline selected={look.selected} />
      </mesh>
    </SelectablePart>
  )
}

function ActionButton({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('action-button', selectedNodeName, FRAME_COLOR)

  return (
    <SelectablePart nodeName="action-button" onSelectNode={onSelectNode}>
      <mesh position={[-PHONE.width / 2 - 0.008, 0.9, 0]}>
        <boxGeometry args={[0.018, 0.09, 0.042]} />
        <meshStandardMaterial
          color={look.color}
          metalness={0.86}
          roughness={0.22}
          emissive={look.emissive}
          emissiveIntensity={look.emissiveIntensity}
        />
        <SelectionOutline selected={look.selected} />
      </mesh>
    </SelectablePart>
  )
}

function VolumeButtons({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('volume-buttons', selectedNodeName, FRAME_COLOR)

  return (
    <SelectablePart nodeName="volume-buttons" onSelectNode={onSelectNode}>
      <group position={[-PHONE.width / 2 - 0.008, 0.6, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.018, 0.07, 0.042]} />
          <meshStandardMaterial
            color={look.color}
            metalness={0.9}
            roughness={0.24}
            emissive={look.emissive}
            emissiveIntensity={look.emissiveIntensity}
          />
          <SelectionOutline selected={look.selected} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[0.018, 0.07, 0.042]} />
          <meshStandardMaterial
            color={look.color}
            metalness={0.9}
            roughness={0.24}
            emissive={look.emissive}
            emissiveIntensity={look.emissiveIntensity}
          />
        </mesh>
      </group>
    </SelectablePart>
  )
}

function PowerButton({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('power-button', selectedNodeName, FRAME_COLOR)

  return (
    <SelectablePart nodeName="power-button" onSelectNode={onSelectNode}>
      <mesh position={[PHONE.width / 2 + 0.008, 0.7, 0]}>
        <boxGeometry args={[0.018, 0.12, 0.042]} />
        <meshStandardMaterial
          color={look.color}
          metalness={0.86}
          roughness={0.22}
          emissive={look.emissive}
          emissiveIntensity={look.emissiveIntensity}
        />
        <SelectionOutline selected={look.selected} />
      </mesh>
    </SelectablePart>
  )
}

function UsbCPort({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('usb-c', selectedNodeName, '#111318')
  const bottomY = PHONE.centerY - PHONE.height / 2

  return (
    <SelectablePart nodeName="usb-c" onSelectNode={onSelectNode}>
      <mesh position={[0, bottomY + 0.006, 0]}>
        <boxGeometry args={[0.092, 0.016, 0.03]} />
        <meshStandardMaterial
          color={look.color}
          metalness={0.85}
          roughness={0.28}
          emissive={look.emissive}
          emissiveIntensity={look.emissiveIntensity}
        />
        <SelectionOutline selected={look.selected} />
      </mesh>
    </SelectablePart>
  )
}

function Speaker({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('speaker', selectedNodeName, '#1a1d22')
  const bottomY = PHONE.centerY - PHONE.height / 2 + 0.055

  return (
    <SelectablePart nodeName="speaker" onSelectNode={onSelectNode}>
      <group position={[0.2, bottomY, PHONE.depth / 2 + 0.003]}>
        {[-0.04, -0.02, 0, 0.02, 0.04].map((offset) => (
          <mesh key={offset} position={[offset, 0, 0]}>
            <boxGeometry args={[0.01, 0.028, 0.004]} />
            <meshStandardMaterial
              color={look.color}
              metalness={0.4}
              roughness={0.4}
              emissive={look.emissive}
              emissiveIntensity={look.emissiveIntensity}
            />
          </mesh>
        ))}
        {look.selected && (
          <mesh position={[0, 0, 0.002]}>
            <boxGeometry args={[0.11, 0.04, 0.002]} />
            <meshStandardMaterial
              color="#4ea2ff"
              emissive={ACCENT_EMISSIVE}
              emissiveIntensity={0.7}
              transparent
              opacity={0.35}
            />
          </mesh>
        )}
      </group>
    </SelectablePart>
  )
}

function Microphone({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('microphone', selectedNodeName, '#15181d')
  const bottomY = PHONE.centerY - PHONE.height / 2 + 0.055

  return (
    <SelectablePart nodeName="microphone" onSelectNode={onSelectNode}>
      <mesh
        position={[-0.2, bottomY, PHONE.depth / 2 + 0.004]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.012, 0.012, 0.006, 20]} />
        <meshStandardMaterial
          color={look.color}
          metalness={0.5}
          roughness={0.35}
          emissive={look.emissive}
          emissiveIntensity={look.emissiveIntensity}
        />
        <SelectionOutline selected={look.selected} />
      </mesh>
    </SelectablePart>
  )
}

function Battery({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('battery', selectedNodeName, '#3f9a68')

  return (
    <SelectablePart nodeName="battery" onSelectNode={onSelectNode}>
      <group position={[0, 0.02, -0.012]}>
        <RoundedBox args={[0.62, 1.05, 0.03]} radius={0.04} smoothness={3}>
          <meshStandardMaterial
            color={look.color}
            metalness={0.18}
            roughness={0.38}
            emissive={look.emissive}
            emissiveIntensity={look.selected ? 0.7 : look.emissiveIntensity}
          />
          <SelectionOutline selected={look.selected} />
        </RoundedBox>
        <mesh position={[0, 0.46, 0.018]}>
          <boxGeometry args={[0.22, 0.06, 0.008]} />
          <meshStandardMaterial color="#d9dee5" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </SelectablePart>
  )
}

function Processor({ selectedNodeName, onSelectNode }: PartProps) {
  const look = usePartLook('processor', selectedNodeName, '#c6a45a')

  return (
    <SelectablePart nodeName="processor" onSelectNode={onSelectNode}>
      <group position={[0, 0.22, -0.02]}>
        <mesh>
          <boxGeometry args={[0.24, 0.24, 0.012]} />
          <meshStandardMaterial color="#2c313a" metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.16, 0.16, 0.012]} />
          <meshStandardMaterial
            color={look.color}
            metalness={0.55}
            roughness={0.28}
            emissive={look.emissive}
            emissiveIntensity={look.selected ? 0.75 : look.emissiveIntensity}
          />
          <SelectionOutline selected={look.selected} />
        </mesh>
      </group>
    </SelectablePart>
  )
}

function Lens({
  position,
  radius,
  selected,
}: {
  position: [number, number, number]
  radius: number
  selected: boolean
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius + 0.006, radius + 0.006, 0.008, 32]} />
        <meshStandardMaterial color="#c5ccd4" metalness={0.85} roughness={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]}>
        <cylinderGeometry args={[radius, radius, 0.012, 32]} />
        <meshStandardMaterial
          color="#1a1f28"
          metalness={0.9}
          roughness={0.12}
          emissive={selected ? ACCENT_EMISSIVE : '#10141c'}
          emissiveIntensity={selected ? 0.3 : 0.04}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.007]}>
        <cylinderGeometry args={[radius * 0.68, radius * 0.68, 0.008, 32]} />
        <meshPhysicalMaterial
          color="#1b2838"
          metalness={1}
          roughness={0.04}
          transmission={0.16}
          thickness={0.02}
        />
      </mesh>
    </group>
  )
}

function SelectablePart({
  nodeName,
  onSelectNode,
  children,
}: {
  nodeName: string
  onSelectNode: (nodeName: string) => void
  children: ReactNode
}) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelectNode(nodeName)
  }

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  return (
    <group
      name={nodeName}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {children}
    </group>
  )
}

function SelectionOutline({ selected }: { selected: boolean }) {
  if (!selected) {
    return null
  }

  return <Outlines thickness={2.6} color="#9ad0ff" />
}

function usePartLook(
  nodeName: string,
  selectedNodeName: string | null,
  baseColor: string,
) {
  return useMemo(() => {
    const selected = selectedNodeName === nodeName
    const dimmed = selectedNodeName != null && !selected
    const color = new THREE.Color(baseColor)

    if (dimmed) {
      color.lerp(new THREE.Color('#8b939d'), 0.32)
    }

    return {
      selected,
      color,
      emissive: selected ? ACCENT_EMISSIVE : '#000000',
      emissiveIntensity: selected ? 0.62 : 0,
    }
  }, [nodeName, selectedNodeName, baseColor])
}
