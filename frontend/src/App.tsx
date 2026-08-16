import { useEffect, useState } from 'react'
import FeaturePanel from './components/FeaturePanel'
import ProductViewer from './components/ProductViewer'
import { useProduct } from './hooks/useProduct'
import type { ProductFeature } from './types/product'
import './App.css'

function App() {
  const {
    product,
    selectedFeature,
    loading,
    error,
    selectFeature,
    retry,
  } = useProduct()
  const [focusNonce, setFocusNonce] = useState(0)
  const [overviewNonce, setOverviewNonce] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [flashOn, setFlashOn] = useState(false)

  useEffect(() => {
    if (!product) {
      return
    }

    setSelectedColor((current) =>
      current && product.availableColors.includes(current)
        ? current
        : product.defaultColor,
    )
  }, [product])

  const handleSelectFeature = (feature: ProductFeature) => {
    if (
      feature.modelNodeName === 'flash' &&
      selectedFeature?.id === feature.id
    ) {
      setFlashOn((on) => !on)
      return
    }

    setFlashOn(feature.modelNodeName === 'flash')
    selectFeature(feature)
    setFocusNonce((value) => value + 1)
  }

  const handleSelectColor = (color: string) => {
    setSelectedColor(color)
  }

  const handleResetView = () => {
    setOverviewNonce((value) => value + 1)
  }

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>3D Product Explorer</h1>
          <p>Explore the product and discover its features</p>
        </header>
        <main className="main-content main-content--status">
          <div className="status-card loading" role="status" aria-live="polite">
            <p className="status-kicker">Product Explorer</p>
            <h2>Loading</h2>
            <p>Preparing 3D model</p>
            <div className="loading-track" aria-hidden="true" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <h1>3D Product Explorer</h1>
          <p>Explore the product and discover its features</p>
        </header>
        <main className="main-content main-content--status">
          <div className="status-card error">
            <h2>Unable to load product</h2>
            <p>{error}</p>
            <button type="button" onClick={retry}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="app">
        <header className="header">
          <h1>3D Product Explorer</h1>
          <p>Explore the product and discover its features</p>
        </header>
        <main className="main-content main-content--status">
          <div className="status-card empty-state">
            <h2>No product found</h2>
            <p>The product service did not return any product data.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>3D Product Explorer</h1>
        <p>Explore the product and discover its features</p>
      </header>

      <main className="main-content">
        <section className="product-viewer">
          <div className="viewer-container">
            <ProductViewer
              product={product}
              selectedFeature={selectedFeature}
              selectedColor={selectedColor ?? product.defaultColor}
              flashOn={flashOn}
              onSelectFeature={handleSelectFeature}
              onResetView={handleResetView}
              focusNonce={focusNonce}
              overviewNonce={overviewNonce}
            />
          </div>
        </section>

        <FeaturePanel
          product={product}
          selectedFeature={selectedFeature}
          selectedColor={selectedColor ?? product.defaultColor}
          onSelectFeature={handleSelectFeature}
          onSelectColor={handleSelectColor}
        />
      </main>
    </div>
  )
}

export default App
