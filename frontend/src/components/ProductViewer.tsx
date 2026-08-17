import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import CameraRig from './CameraRig'
import {
  OVERVIEW_CAMERA,
  OVERVIEW_FOV,
  OVERVIEW_TARGET,
  resolveFeatureFocus,
} from './cameraOverview'
import Product3DRenderer, {
  ProductModelPlaceholder,
} from './Product3DRenderer'
import { cameraCommand, explodedMode, flashLit } from './explodedView'
import { getProduct3DCapabilities } from '../product3DCapabilities'
import type { Product, ProductFeature } from '../types/product'

interface ProductViewerProps {
  product: Product
  selectedFeature: ProductFeature | null
  selectedColor: string
  flashOn: boolean
  exploded: boolean
  onSelectFeature: (feature: ProductFeature) => void
  onExplodedChange: (exploded: boolean) => void
  onResetView: () => void
  focusNonce: number
  overviewNonce: number
}

export default function ProductViewer({
  product,
  selectedFeature,
  selectedColor,
  flashOn,
  exploded,
  onSelectFeature,
  onExplodedChange,
  onResetView,
  focusNonce,
  overviewNonce,
}: ProductViewerProps) {
  const capabilities = getProduct3DCapabilities(product.id)
  const selectedNodeName = selectedFeature?.modelNodeName ?? null
  const focus = resolveFeatureFocus(
    capabilities.featureFocus ? selectedFeature : null,
    capabilities.explodedView && exploded,
  )

  explodedMode.current = capabilities.explodedView && exploded
  flashLit.current = capabilities.flash && flashOn
  cameraCommand.focusNonce = capabilities.featureFocus ? focusNonce : 0
  cameraCommand.overviewNonce = overviewNonce
  cameraCommand.featureId = capabilities.featureFocus
    ? selectedFeature?.id ?? null
    : null
  cameraCommand.cameraPosition = capabilities.featureFocus
    ? focus.cameraPosition
    : null
  cameraCommand.lookAt = capabilities.featureFocus ? focus.lookAt : null

  const handleToggleExploded = () => {
    onExplodedChange(!exploded)
  }

  const handleSelectNode = (nodeName: string) => {
    const feature = product.features.find(
      (item) => item.modelNodeName === nodeName,
    )

    if (feature) {
      onSelectFeature(feature)
    }
  }

  return (
    <div className="product-viewer-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap
        }}
        camera={{
          position: [OVERVIEW_CAMERA.x, OVERVIEW_CAMERA.y, OVERVIEW_CAMERA.z],
          fov: OVERVIEW_FOV,
        }}
      >
        <color attach="background" args={['#d7dee6']} />

        <hemisphereLight args={['#f7f9fb', '#c5ced8', 0.82]} />
        <ambientLight intensity={0.48} />
        <directionalLight
          position={[4.2, 7.2, 5]}
          intensity={1.52}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-5, 3.2, 2.4]}
          intensity={0.58}
          color="#ffffff"
        />
        <directionalLight
          position={[1.8, 2.4, -5.5]}
          intensity={1.28}
          color="#e7eef6"
        />
        <spotLight
          position={[-2.2, 5.4, 3.2]}
          angle={0.5}
          penumbra={0.9}
          intensity={0.42}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.05, 0]}
          receiveShadow
        >
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#c5cdd6" roughness={0.92} metalness={0} />
        </mesh>

        <Product3DRenderer
          product={product}
          selectedNodeName={selectedNodeName}
          selectedColor={selectedColor}
          selectedFeatureId={selectedFeature?.id ?? null}
          exploded={exploded}
          onSelectNode={handleSelectNode}
          onSelectFeature={onSelectFeature}
        />

        <CameraRig />

        <ContactShadows
          position={[0, -1.04, 0]}
          opacity={0.34}
          scale={7.2}
          blur={2.6}
          far={4}
          color="#6b7280"
        />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          target={[OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z]}
          minDistance={0.35}
          maxDistance={14}
        />
      </Canvas>
      {capabilities.interactiveModel ? (
        <div className="viewer-controls">
          {capabilities.explodedView ? (
            <button
              type="button"
              className="explode-view-button"
              aria-pressed={exploded}
              onClick={handleToggleExploded}
            >
              {exploded ? 'Assembled View' : 'Exploded View'}
            </button>
          ) : null}
          {capabilities.featureFocus ? (
            <button
              type="button"
              className="reset-view-button"
              onClick={onResetView}
            >
              View Full Phone
            </button>
          ) : null}
        </div>
      ) : (
        <ProductModelPlaceholder category={product.category} />
      )}
    </div>
  )
}
