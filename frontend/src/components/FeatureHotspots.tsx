import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { ProductFeature } from '../types/product'

interface FeatureHotspotsProps {
  features: ProductFeature[]
  selectedFeatureId: string | null
  onSelectFeature: (feature: ProductFeature) => void
}

export default function FeatureHotspots({
  features,
  selectedFeatureId,
  onSelectFeature,
}: FeatureHotspotsProps) {
  return (
    <group>
      {features.map((feature) => (
        <Hotspot
          key={feature.id}
          feature={feature}
          selected={selectedFeatureId === feature.id}
          onSelect={onSelectFeature}
        />
      ))}
    </group>
  )
}

interface HotspotProps {
  feature: ProductFeature
  selected: boolean
  onSelect: (feature: ProductFeature) => void
}

function Hotspot({ feature, selected, onSelect }: HotspotProps) {
  const [hovered, setHovered] = useState(false)
  const { x, y, z } = feature.position
  const pinClass = [
    'hotspot-pin',
    selected ? 'selected' : '',
    hovered ? 'hovered' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Html
      position={[x, y, z]}
      center
      sprite
      zIndexRange={[40, 0]}
      occlude={false}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="hotspot">
        <button
          type="button"
          className={pinClass}
          aria-label={`Focus ${feature.name}`}
          aria-pressed={selected}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(feature)
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <span className="hotspot-core" aria-hidden="true" />
        </button>
        {hovered && <span className="hotspot-label">{feature.name}</span>}
      </div>
    </Html>
  )
}
