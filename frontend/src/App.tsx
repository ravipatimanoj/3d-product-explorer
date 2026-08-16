import { useState } from 'react'
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

  const handleSelectFeature = (feature: ProductFeature) => {
    selectFeature(feature)
    setFocusNonce((value) => value + 1)
  }

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>3D Product Explorer</h1>
          <p>Explore the product and discover its features</p>
        </header>
        <main className="main-content main-content--status">
          <div className="status-card loading">
            <h2>Loading product...</h2>
            <p>Connecting to the product service.</p>
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
              onSelectFeature={handleSelectFeature}
              focusNonce={focusNonce}
            />
          </div>
        </section>

        <FeaturePanel
          product={product}
          selectedFeature={selectedFeature}
          onSelectFeature={handleSelectFeature}
        />
      </main>
    </div>
  )
}

export default App
