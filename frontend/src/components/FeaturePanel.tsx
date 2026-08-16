import ColorSelector from './ColorSelector'
import type { Product, ProductFeature } from '../types/product'

interface FeaturePanelProps {
  product: Product
  selectedFeature: ProductFeature | null
  selectedColor: string
  onSelectFeature: (feature: ProductFeature) => void
  onSelectColor: (color: string) => void
}

export default function FeaturePanel({
  product,
  selectedFeature,
  selectedColor,
  onSelectFeature,
  onSelectColor,
}: FeaturePanelProps) {
  return (
    <section className="product-info">
      <h2>{product.name}</h2>
      <p>{product.description}</p>

      <ColorSelector
        colors={product.availableColors}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
      />

      <div className="feature-card">
        <h3>Product Features</h3>
        <div className="feature-list">
          {product.features.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className={
                selectedFeature?.id === feature.id
                  ? 'feature-button selected'
                  : 'feature-button'
              }
              onClick={() => onSelectFeature(feature)}
            >
              {feature.name}
            </button>
          ))}
        </div>
      </div>

      {selectedFeature && (
        <div className="selected-feature">
          <p className="selected-feature-category">{selectedFeature.category}</p>
          <h3>{selectedFeature.name}</h3>
          <p>{selectedFeature.description}</p>

          <h4>Specifications</h4>
          <ul>
            {selectedFeature.specifications.map((specification) => (
              <li key={specification.name}>
                <strong>{specification.name}:</strong> {specification.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
