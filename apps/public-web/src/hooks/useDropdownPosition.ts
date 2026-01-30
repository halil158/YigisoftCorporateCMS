import { useState, useEffect, useCallback, RefObject } from 'react'

interface DropdownPosition {
  /** Whether dropdown should open to the left instead of right */
  flipHorizontal: boolean
  /** Whether dropdown should open above instead of below */
  flipVertical: boolean
  /** Whether this item is near the right edge of the viewport */
  isNearRightEdge: boolean
}

/**
 * Hook to determine optimal dropdown positioning based on viewport constraints.
 * Prevents dropdowns from causing horizontal overflow.
 */
export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement>,
  dropdownWidth: number = 200,
  dropdownHeight: number = 300
): DropdownPosition {
  const [position, setPosition] = useState<DropdownPosition>({
    flipHorizontal: false,
    flipVertical: false,
    isNearRightEdge: false,
  })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Check if dropdown would overflow right edge
    const spaceOnRight = viewportWidth - rect.right
    const spaceOnLeft = rect.left
    const flipHorizontal = spaceOnRight < dropdownWidth && spaceOnLeft > spaceOnRight

    // Check if dropdown would overflow bottom edge
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const flipVertical = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    // Check if the trigger itself is in the right portion of the viewport
    const isNearRightEdge = rect.left > viewportWidth * 0.6

    setPosition({ flipHorizontal, flipVertical, isNearRightEdge })
  }, [triggerRef, dropdownWidth, dropdownHeight])

  useEffect(() => {
    updatePosition()

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  return position
}

/**
 * Simple check if an element would overflow the viewport when positioned.
 * Use this for submenus that need runtime flip detection.
 */
export function checkSubmenuOverflow(
  parentRect: DOMRect,
  submenuWidth: number = 200
): { flipToLeft: boolean } {
  const viewportWidth = window.innerWidth
  const rightEdgeIfOpenRight = parentRect.right + submenuWidth
  const leftEdgeIfOpenLeft = parentRect.left - submenuWidth

  // Prefer opening to the right, but flip if it would overflow
  const flipToLeft = rightEdgeIfOpenRight > viewportWidth && leftEdgeIfOpenLeft >= 0

  return { flipToLeft }
}
