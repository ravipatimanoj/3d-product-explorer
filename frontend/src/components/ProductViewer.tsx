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
import FeatureHotspots from './FeatureHotspots'
import SmartphoneModel from './SmartphoneModel'
import type { Product, ProductFeature } from '../types/product'

interface ProductViewerProps {
  product: Product
  selectedFeature: ProductFeature | null
  selectedColor: string
  onSelectFeature: (feature: ProductFeature) => void
  onResetView: () => void
  focusNonce: number
  overviewNonce: number
}

export default function ProductViewer({
  product,
  selectedFeature,
  selectedColor,
  onSelectFeature,
  onResetView,
  focusNonce,
  overviewNonce,
}: ProductViewerProps) {
  const selectedNodeName = selectedFeature?.modelNodeName ?? null
  const focus = resolveFeatureFocus(selectedFeature)

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

        <hemisphereLight args={['#f7f9fb', '#c5ced8', 0.9]} />
        <ambientLight intensity={0.62} />
        <directionalLight
          position={[4.2, 7.2, 5]}
          intensity={1.45}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-5, 3.2, 2.4]}
          intensity={0.62}
          color="#ffffff"
        />
        <directionalLight
          position={[1.8, 2.4, -5.5]}
          intensity={1.45}
          color="#e7eef6"
        />
        <spotLight
          position={[-2.2, 5.4, 3.2]}
          angle={0.5}
          penumbra={0.9}
          intensity={0.45}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.05, 0]}
          receiveShadow
        >
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#c5cdd6" roughness={0.92} metalness={0} />
        </mesh>

        <SmartphoneModel
          selectedNodeName={selectedNodeName}
          selectedColor={selectedColor}
          onSelectNode={handleSelectNode}
        />

        <FeatureHotspots
          features={product.features}
          selectedFeatureId={selectedFeature?.id ?? null}
          onSelectFeature={onSelectFeature}
        />

        <CameraRig
          cameraPosition={focus.cameraPosition}
          lookAt={focus.lookAt}
          focusNonce={focusNonce}
          overviewNonce={overviewNonce}
        />

        <ContactShadows
          position={[0, -1.04, 0]}
          opacity={0.28}
          scale={8}
          blur={2.8}
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
          minDistance={2.1}
          maxDistance={12}
        />
      </Canvas>
      <button
        type="button"
        className="reset-view-button"
        onClick={onResetView}
      >
        View Full Phone
      </button>
    </div>
  )
}
