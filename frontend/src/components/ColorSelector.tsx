import { useRef, type KeyboardEvent } from 'react'
import { getPhoneAppearance } from '../phoneAppearance'

const GENERIC_SWATCHES: Record<string, string> = {
  Graphite: '#4b5563',
  Midnight: '#1f2937',
  Ivory: '#f4efe4',
  'Stainless Steel': '#c9d0d6',
  'Black Stainless': '#2c3036',
  White: '#f8fafc',
  Slate: '#64748b',
}

function getColorSwatch(colorName: string): string {
  return GENERIC_SWATCHES[colorName] ?? getPhoneAppearance(colorName).swatch
}

interface ColorSelectorProps {
  colors: string[]
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorSelector({
  colors,
  selectedColor,
  onSelectColor,
}: ColorSelectorProps) {
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())

  if (colors.length === 0) {
    return null
  }

  const focusColor = (color: string) => {
    optionRefs.current.get(color)?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = colors.indexOf(selectedColor)
    if (currentIndex < 0) {
      return
    }

    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % colors.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + colors.length) % colors.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = colors.length - 1
    }

    if (nextIndex == null) {
      return
    }

    event.preventDefault()
    const nextColor = colors[nextIndex]
    onSelectColor(nextColor)
    focusColor(nextColor)
  }

  return (
    <div className="color-card">
      <h3>Color</h3>
      <div
        className="color-options"
        role="radiogroup"
        aria-label="Product color"
        onKeyDown={handleKeyDown}
      >
        {colors.map((color) => {
          const selected = color === selectedColor
          return (
            <button
              key={color}
              ref={(node) => {
                if (node) {
                  optionRefs.current.set(color, node)
                } else {
                  optionRefs.current.delete(color)
                }
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'color-option selected' : 'color-option'}
              onClick={() => onSelectColor(color)}
            >
              <span
                className="color-swatch"
                style={{ backgroundColor: getColorSwatch(color) }}
                aria-hidden="true"
              />
              <span className="color-name">{color}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
