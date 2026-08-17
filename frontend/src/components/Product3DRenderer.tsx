import FeatureHotspots from './FeatureHotspots'
import SmartphoneModel from './SmartphoneModel'
import { getProduct3DCapabilities } from '../product3DCapabilities'
import type { Product, ProductFeature } from '../types/product'

export type Product3DRendererId = 'smartphone' | 'tv' | 'refrigerator' | 'none'

export function getProduct3DRendererId(productId: string): Product3DRendererId {
  switch (productId) {
    case 'smartphone-001':
      return 'smartphone'
    case 'tv-001':
      return 'tv'
    case 'refrigerator-001':
      return 'refrigerator'
    default:
      return 'none'
  }
}

interface Product3DRendererProps {
  product: Product
  selectedNodeName: string | null
  selectedColor: string
  selectedFeatureId: string | null
  exploded: boolean
  onSelectNode: (nodeName: string) => void
  onSelectFeature: (feature: ProductFeature) => void
}

export default function Product3DRenderer({
  product,
  selectedNodeName,
  selectedColor,
  selectedFeatureId,
  exploded,
  onSelectNode,
  onSelectFeature,
}: Product3DRendererProps) {
  const capabilities = getProduct3DCapabilities(product.id)

  switch (getProduct3DRendererId(product.id)) {
    case 'smartphone':
      return (
        <>
          {capabilities.interactiveModel ? (
            <SmartphoneModel
              selectedNodeName={selectedNodeName}
              selectedColor={
                capabilities.colorCustomization ? selectedColor : product.defaultColor
              }
              onSelectNode={onSelectNode}
            />
          ) : null}
          {capabilities.hotspots ? (
            <FeatureHotspots
              features={product.features}
              selectedFeatureId={selectedFeatureId}
              exploded={exploded}
              onSelectFeature={onSelectFeature}
            />
          ) : null}
        </>
      )
    case 'tv':
    case 'refrigerator':
    case 'none':
      return null
  }
}

interface ProductModelPlaceholderProps {
  category: string
}

export function ProductModelPlaceholder({
  category,
}: ProductModelPlaceholderProps) {
  return (
    <div className="model-placeholder" role="status">
      <p className="model-placeholder-kicker">{category}</p>
      <h2>3D model coming soon</h2>
    </div>
  )
}
