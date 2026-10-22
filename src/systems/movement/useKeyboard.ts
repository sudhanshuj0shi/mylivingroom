import { useEffect, useRef } from 'react'

/**
 * Tracks which keys are held down.
 *
 * It returns a ref, not state, on purpose. State would re-render React on
 * every key press; the movement code reads the ref 60+ times a second inside
 * the render loop instead, which costs nothing.
 *
 * We use `event.code` ("KeyW") rather than `event.key` ("w") so the keys stay
 * in the same physical place on non-QWERTY keyboards.
 */
export function useKeyboard() {
  const pressed = useRef(new Set<string>())

  useEffect(() => {
    const down = (e: KeyboardEvent) => pressed.current.add(e.code)
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code)
    // If the window loses focus mid-step, forget held keys so you don't keep walking.
    const clear = () => pressed.current.clear()

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  return pressed
}
