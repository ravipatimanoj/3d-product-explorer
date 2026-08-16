import ProductViewer from './components/ProductViewer'
import { useProduct } from './hooks/useProduct'
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

  if (loading) {
    return (
      <div className="app">
        <main className="main-content">
          <div className="loading">
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
        <main className="main-content">
          <div className="error">
            <h2>Unable to load product</h2>
            <p>{error}</p>
            <button onClick={retry}>Try Again</button>
          </div>
        </main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="app">
        <main className="main-content">
          <div className="empty-state">
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
    <ProductViewer />
  </div>
        </section>

        <section className="product-info">
          <h2>{product.name}</h2>

          <p>{product.description}</p>

          <div className="feature-card">
            <h3>Product Features</h3>

            <div className="feature-list">
              {product.features.map((feature) => (
                <button
                  key={feature.id}
                  className={
                    selectedFeature?.id === feature.id
                      ? 'feature-button selected'
                      : 'feature-button'
                  }
                  onClick={() => selectFeature(feature)}
                >
                  {feature.name}
                </button>
              ))}
            </div>
          </div>

          {selectedFeature && (
            <div className="selected-feature">
              <h3>{selectedFeature.name}</h3>

              <p>{selectedFeature.description}</p>

              <h4>Specifications</h4>

              <ul>
                {selectedFeature.specifications.map((specification) => (
                  <li key={specification.name}>
                    <strong>{specification.name}:</strong>{' '}
                    {specification.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App