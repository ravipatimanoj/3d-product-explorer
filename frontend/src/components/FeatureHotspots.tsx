import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { ProductFeature } from '../types/product'
import { resolveHotspotPosition } from './cameraOverview'
import ExplodedLayer from './ExplodedLayer'
import { EXPLODED_HOTSPOT_NODES, getExplodedOffset } from './explodedView'

interface FeatureHotspotsProps {
  features: ProductFeature[]
  selectedFeatureId: string | null
  exploded: boolean
  onSelectFeature: (feature: ProductFeature) => void
}

export default function FeatureHotspots({
  features,
  selectedFeatureId,
  exploded,
  onSelectFeature,
}: FeatureHotspotsProps) {
  return (
    <group>
      {features.map((feature) => {
        const selected = selectedFeatureId === feature.id
        if (exploded && !EXPLODED_HOTSPOT_NODES.has(feature.modelNodeName)) {
          return null
        }

        return (
          <ExplodedLayer
            key={feature.id}
            offset={getExplodedOffset(feature.modelNodeName)}
          >
            <Hotspot
              feature={feature}
              selected={selected}
              exploded={exploded}
              onSelect={onSelectFeature}
            />
          </ExplodedLayer>
        )
      })}
    </group>
  )
}

interface HotspotProps {
  feature: ProductFeature
  selected: boolean
  exploded: boolean
  onSelect: (feature: ProductFeature) => void
}

function Hotspot({ feature, selected, exploded, onSelect }: HotspotProps) {
  const [hovered, setHovered] = useState(false)
  const { x, y, z } = resolveHotspotPosition(feature)
  const pinClass = [
    'hotspot-pin',
    exploded ? 'exploded' : '',
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
      zIndexRange={[20, 0]}
      occlude={false}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div className="hotspot">
        <button
          type="button"
          className={pinClass}
          aria-label={`Focus ${feature.name}`}
          aria-pressed={selected}
          style={{ pointerEvents: 'auto' }}
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
          {selected && (
            <>
              <span className="hotspot-pulse" aria-hidden="true" />
              <span className="hotspot-pulse hotspot-pulse--delayed" aria-hidden="true" />
            </>
          )}
        </button>
        {hovered && <span className="hotspot-label">{feature.name}</span>}
      </div>
    </Html>
  )
}
