export interface PhoneAppearance {
  frameColor: string
  backGlassColor: string
  frameMetalness: number
  frameRoughness: number
  backMetalness: number
  backRoughness: number
  backClearcoat: number
  backClearcoatRoughness: number
  swatch: string
}

const NATURAL_APPEARANCE: PhoneAppearance = {
  frameColor: '#e6d4be',
  backGlassColor: '#e4d1b6',
  frameMetalness: 0.46,
  frameRoughness: 0.34,
  backMetalness: 0.1,
  backRoughness: 0.28,
  backClearcoat: 0.78,
  backClearcoatRoughness: 0.2,
  swatch: '#d9cfc0',
}

const APPEARANCES: Record<string, PhoneAppearance> = {
  Natural: NATURAL_APPEARANCE,
  Black: {
    frameColor: '#3a4048',
    backGlassColor: '#2a3038',
    frameMetalness: 0.5,
    frameRoughness: 0.32,
    backMetalness: 0.22,
    backRoughness: 0.24,
    backClearcoat: 0.82,
    backClearcoatRoughness: 0.14,
    swatch: '#1f232a',
  },
  Silver: {
    frameColor: '#c8ced6',
    backGlassColor: '#e8edf2',
    frameMetalness: 0.48,
    frameRoughness: 0.26,
    backMetalness: 0.14,
    backRoughness: 0.22,
    backClearcoat: 0.86,
    backClearcoatRoughness: 0.12,
    swatch: '#c5cbd3',
  },
  Blue: {
    frameColor: '#4a6fa3',
    backGlassColor: '#5f93cc',
    frameMetalness: 0.44,
    frameRoughness: 0.32,
    backMetalness: 0.12,
    backRoughness: 0.26,
    backClearcoat: 0.8,
    backClearcoatRoughness: 0.16,
    swatch: '#3d5a80',
  },
}

export function getPhoneAppearance(colorName: string): PhoneAppearance {
  return APPEARANCES[colorName] ?? NATURAL_APPEARANCE
}
