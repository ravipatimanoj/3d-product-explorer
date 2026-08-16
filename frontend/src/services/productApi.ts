import type { Product, ProductFeature } from '../types/product'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`)
  return handleResponse<Product[]>(response)
}

export async function getProduct(productId: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`)
  return handleResponse<Product>(response)
}

export async function getProductFeatures(productId: string): Promise<ProductFeature[]> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/features`)
  return handleResponse<ProductFeature[]>(response)
}

export async function getProductFeature(
  productId: string,
  featureId: string,
): Promise<ProductFeature> {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/features/${featureId}`,
  )
  return handleResponse<ProductFeature>(response)
}
