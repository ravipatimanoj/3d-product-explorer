import { DEFAULT_PRODUCT_ID } from '../hooks/useProduct'
import type { Product } from '../types/product'

interface ProductSelectorProps {
  products: Product[]
  selectedProductId: string
  onSelectProduct: (productId: string) => void
}

export default function ProductSelector({
  products,
  selectedProductId,
  onSelectProduct,
}: ProductSelectorProps) {
  if (products.length === 0) {
    return null
  }

  const orderedProducts = [
    ...products.filter((product) => product.id === DEFAULT_PRODUCT_ID),
    ...products.filter((product) => product.id !== DEFAULT_PRODUCT_ID),
  ]

  return (
    <div className="product-selector" role="tablist" aria-label="Products">
      {orderedProducts.map((product) => {
        const selected = product.id === selectedProductId

        return (
          <button
            key={product.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={product.name}
            className={
              selected
                ? 'product-selector-option selected'
                : 'product-selector-option'
            }
            onClick={() => onSelectProduct(product.id)}
          >
            <span className="product-selector-category">{product.category}</span>
            <span className="product-selector-name">{product.name}</span>
          </button>
        )
      })}
    </div>
  )
}
