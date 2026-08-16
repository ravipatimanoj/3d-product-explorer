import { useRef, type KeyboardEvent } from 'react'
import { getPhoneAppearance } from '../phoneAppearance'

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
          const appearance = getPhoneAppearance(color)

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
                style={{ backgroundColor: appearance.swatch }}
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
