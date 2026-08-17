export interface Product3DCapabilities {
  interactiveModel: boolean
  hotspots: boolean
  featureFocus: boolean
  explodedView: boolean
  flash: boolean
  colorCustomization: boolean
}

const UNSUPPORTED_3D_CAPABILITIES: Product3DCapabilities = {
  interactiveModel: false,
  hotspots: false,
  featureFocus: false,
  explodedView: false,
  flash: false,
  colorCustomization: false,
}

const PRODUCT_3D_CAPABILITIES: Record<string, Product3DCapabilities> = {
  'smartphone-001': {
    interactiveModel: true,
    hotspots: true,
    featureFocus: true,
    explodedView: true,
    flash: true,
    colorCustomization: true,
  },
  'tv-001': UNSUPPORTED_3D_CAPABILITIES,
  'refrigerator-001': UNSUPPORTED_3D_CAPABILITIES,
}

export function getProduct3DCapabilities(
  productId: string,
): Product3DCapabilities {
  return PRODUCT_3D_CAPABILITIES[productId] ?? UNSUPPORTED_3D_CAPABILITIES
}
