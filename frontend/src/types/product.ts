export interface Position {
  x: number
  y: number
  z: number
}

export interface FeatureSpecification {
  name: string
  value: string
}

export interface ProductFeature {
  id: string
  name: string
  description: string
  category: string
  modelNodeName: string
  position: Position
  cameraPosition: Position
  specifications: FeatureSpecification[]
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  defaultColor: string
  availableColors: string[]
  features: ProductFeature[]
}
