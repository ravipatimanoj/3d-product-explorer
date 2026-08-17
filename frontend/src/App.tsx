import { useEffect, useState } from 'react'
import AiAssistant from './components/AiAssistant'
import FeaturePanel from './components/FeaturePanel'
import ProductSelector from './components/ProductSelector'
import ProductViewer from './components/ProductViewer'
import { useProduct } from './hooks/useProduct'
import { getProduct3DCapabilities } from './product3DCapabilities'
import type { AiAction } from './types/ai'
import type { ProductFeature } from './types/product'
import './App.css'

function App() {
  const {
    products,
    selectedProductId,
    product,
    selectedFeature,
    loading,
    error,
    selectProduct,
    selectFeature,
    retry,
  } = useProduct()
  const [focusNonce, setFocusNonce] = useState(0)
  const [overviewNonce, setOverviewNonce] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [pendingExplodedFocus, setPendingExplodedFocus] = useState(false)
  const capabilities = getProduct3DCapabilities(selectedProductId)

  useEffect(() => {
    if (!product) {
      return
    }

    setSelectedColor(product.defaultColor)
  }, [product?.id, product?.defaultColor])

  useEffect(() => {
    if (!exploded || !pendingExplodedFocus || !selectedFeature) {
      return
    }

    setFocusNonce((value) => value + 1)
    setPendingExplodedFocus(false)
  }, [exploded, pendingExplodedFocus, selectedFeature])

  const handleSelectProduct = (productId: string) => {
    setFlashOn(false)
    setExploded(false)
    setSelectedColor(null)
    setFocusNonce(0)
    setOverviewNonce((value) => value + 1)
    setPendingExplodedFocus(false)
    selectProduct(productId)
  }

  const handleSelectFeature = (feature: ProductFeature) => {
    if (!capabilities.featureFocus) {
      return
    }

    if (
      capabilities.flash &&
      feature.modelNodeName === 'flash' &&
      selectedFeature?.id === feature.id
    ) {
      setFlashOn((on) => !on)
      return
    }

    setFlashOn(capabilities.flash && feature.modelNodeName === 'flash')
    selectFeature(feature)
    setFocusNonce((value) => value + 1)
  }

  const handleSelectColor = (color: string) => {
    setSelectedColor(color)
  }

  const handleResetView = () => {
    setOverviewNonce((value) => value + 1)
  }

  const handleAiAction = (action: AiAction | null) => {
    if (!action || !product) {
      return
    }

    switch (action.type) {
      case 'FOCUS_FEATURE': {
        if (!capabilities.featureFocus || !action.featureId) {
          return
        }
        const feature = product.features.find(
          (item) => item.id === action.featureId,
        )
        if (feature) {
          selectFeature(feature)
          setFocusNonce((value) => value + 1)
        }
        return
      }
      case 'EXPLODE_PRODUCT': {
        if (!capabilities.explodedView) {
          return
        }
        const feature = action.featureId
          ? product.features.find((item) => item.id === action.featureId)
          : null
        setExploded(true)
        if (feature && capabilities.featureFocus) {
          selectFeature(feature)
          if (exploded) {
            setFocusNonce((value) => value + 1)
          } else {
            setPendingExplodedFocus(true)
          }
        }
        return
      }
      case 'ASSEMBLE_PRODUCT':
        if (capabilities.explodedView) {
          setExploded(false)
        }
        return
      case 'TOGGLE_FLASH':
        if (capabilities.flash && typeof action.enabled === 'boolean') {
          setFlashOn(action.enabled)
        }
        return
      default:
        return
    }
  }

  const header = (
    <header className="header">
      <div className="header-copy">
        <h1>3D Product Explorer</h1>
        <p>Explore the product and discover its features</p>
      </div>
      <ProductSelector
        products={products}
        selectedProductId={selectedProductId}
        onSelectProduct={handleSelectProduct}
      />
    </header>
  )

  if (loading) {
    return (
      <div className="app">
        {header}
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
        {header}
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
        {header}
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
      {header}

      <main className="main-content">
        <section className="product-viewer">
          <div className="viewer-container">
            <ProductViewer
              key={selectedProductId}
              product={product}
              selectedFeature={
                capabilities.featureFocus ? selectedFeature : null
              }
              selectedColor={selectedColor ?? product.defaultColor}
              flashOn={capabilities.flash && flashOn}
              exploded={capabilities.explodedView && exploded}
              onSelectFeature={handleSelectFeature}
              onExplodedChange={setExploded}
              onResetView={handleResetView}
              focusNonce={focusNonce}
              overviewNonce={overviewNonce}
            />
          </div>
        </section>

        <aside className="product-sidebar">
          <FeaturePanel
            product={product}
            selectedFeature={capabilities.featureFocus ? selectedFeature : null}
            selectedColor={selectedColor ?? product.defaultColor}
            capabilities={capabilities}
            onSelectFeature={handleSelectFeature}
            onSelectColor={handleSelectColor}
          />
          <AiAssistant
            key={product.id}
            productId={product.id}
            viewerActionsAvailable={capabilities.interactiveModel}
            onAction={handleAiAction}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
