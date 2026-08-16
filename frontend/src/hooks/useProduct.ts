import { useCallback, useEffect, useState } from 'react'
import { getProduct } from '../services/productApi'
import type { Product, ProductFeature } from '../types/product'

const PRODUCT_ID = 'smartphone-001'

interface UseProductResult {
  product: Product | null
  selectedFeature: ProductFeature | null
  loading: boolean
  error: string | null
  selectFeature: (feature: ProductFeature) => void
  retry: () => void
}

export function useProduct(): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedFeature, setSelectedFeature] =
    useState<ProductFeature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadProduct = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const productData = await getProduct(PRODUCT_ID)

      setProduct(productData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load product data.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProduct()
  }, [loadProduct, retryCount])

  const selectFeature = (feature: ProductFeature) => {
    setSelectedFeature(feature)
  }

  const retry = () => {
    setRetryCount((count) => count + 1)
  }

  return {
    product,
    selectedFeature,
    loading,
    error,
    selectFeature,
    retry,
  }
}