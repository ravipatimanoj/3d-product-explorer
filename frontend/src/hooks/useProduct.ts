import { useCallback, useEffect, useRef, useState } from 'react'
import { getProduct, getProducts } from '../services/productApi'
import type { Product, ProductFeature } from '../types/product'

export const DEFAULT_PRODUCT_ID = 'smartphone-001'

interface UseProductResult {
  products: Product[]
  selectedProductId: string
  product: Product | null
  selectedFeature: ProductFeature | null
  loading: boolean
  error: string | null
  selectProduct: (productId: string) => void
  selectFeature: (feature: ProductFeature) => void
  retry: () => void
}

export function useProduct(): UseProductResult {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState(DEFAULT_PRODUCT_ID)
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedFeature, setSelectedFeature] =
    useState<ProductFeature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const selectedProductIdRef = useRef(selectedProductId)
  const loadRequestRef = useRef(0)

  selectedProductIdRef.current = selectedProductId

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const catalog = await getProducts()
      const preferredId = catalog.some(
        (item) => item.id === selectedProductIdRef.current,
      )
        ? selectedProductIdRef.current
        : DEFAULT_PRODUCT_ID
      const selected =
        catalog.find((item) => item.id === preferredId) ?? catalog[0] ?? null

      setProducts(catalog)
      setSelectedProductId(selected?.id ?? DEFAULT_PRODUCT_ID)
      setProduct(selected)
      setSelectedFeature(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load product data.',
      )
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog, retryCount])

  const selectProduct = (productId: string) => {
    if (productId === selectedProductId) {
      return
    }

    const requestId = ++loadRequestRef.current
    setSelectedProductId(productId)
    setSelectedFeature(null)
    setError(null)

    const cached = products.find((item) => item.id === productId)
    if (cached) {
      setProduct(cached)
    }

    void getProduct(productId)
      .then((detail) => {
        if (requestId !== loadRequestRef.current) {
          return
        }

        setProduct(detail)
        setProducts((current) =>
          current.map((item) => (item.id === detail.id ? detail : item)),
        )
      })
      .catch((err: unknown) => {
        if (requestId !== loadRequestRef.current || cached) {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load product data.',
        )
      })
  }

  const selectFeature = (feature: ProductFeature) => {
    setSelectedFeature(feature)
  }

  const retry = () => {
    setRetryCount((count) => count + 1)
  }

  return {
    products,
    selectedProductId,
    product,
    selectedFeature,
    loading,
    error,
    selectProduct,
    selectFeature,
    retry,
  }
}
