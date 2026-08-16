import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function TestObject() {
  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <boxGeometry args={[2, 3, 0.6]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  )
}

function ProductViewer() {
  return (
    <div className="product-viewer-canvas">
      <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
        />

        <TestObject />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
        />
      </Canvas>
    </div>
  )
}

export default ProductViewer