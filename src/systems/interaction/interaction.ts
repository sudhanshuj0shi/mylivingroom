import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { house } from '../../state/houseStore'

/**
 * "Press E to …"
 *
 * Objects that can be used register themselves here with a point in space, a
 * label and an action. Every few frames we check which registered object you
 * are near *and* roughly facing, and show its label as a prompt. Pressing E
 * (or clicking) runs the action.
 *
 * Why not click exactly on the 3D object (raycasting)? Precise clicks on small
 * 3D things are fiddly, especially while the mouse is captured. "Near and
 * facing" is forgiving: if the laptop is in front of you, E uses it.
 */

export type Interactable = {
  id: string
  position: THREE.Vector3
  label: () => string
  action: () => void
  /** How close you need to be, in metres. */
  range?: number
}

const registry = new Map<string, Interactable>()

/** Register an object as usable while the component is mounted. */
export function useInteractable(item: Interactable) {
  // Keep the latest label/action without re-registering every render.
  const latest = useRef(item)
  latest.current = item
  useEffect(() => {
    const id = item.id
    registry.set(id, {
      id,
      position: item.position,
      range: item.range,
      label: () => latest.current.label(),
      action: () => latest.current.action(),
    })
    return () => {
      registry.delete(id)
    }
  }, [item.id, item.position, item.range])
}

/** Run whatever the current prompt points at. */
export function interact() {
  const prompt = house.get().prompt
  if (prompt) registry.get(prompt.id)?.action()
}

const forward = new THREE.Vector3()
const toItem = new THREE.Vector3()

/** Chooses the best object to prompt for. Lives inside the 3D scene. */
export function InteractionSystem() {
  const camera = useThree((s) => s.camera)
  const frame = useRef(0)

  useFrame(() => {
    // Checking every 4th frame is plenty for a prompt, and cheaper.
    if (++frame.current % 4) return
    const { walking, prompt } = house.get()
    if (!walking) {
      if (prompt) house.set({ prompt: null })
      return
    }

    camera.getWorldDirection(forward)
    let best: Interactable | null = null
    let bestScore = -Infinity

    for (const item of registry.values()) {
      toItem.copy(item.position).sub(camera.position)
      const distance = toItem.length()
      if (distance > (item.range ?? 2.2)) continue
      // How directly you face it: 1 = dead ahead, 0 = at 90°.
      const facing = toItem.normalize().dot(forward)
      if (facing < 0.8) continue
      const score = facing - distance * 0.1
      if (score > bestScore) {
        bestScore = score
        best = item
      }
    }

    const label = best?.label() ?? null
    if (best?.id !== prompt?.id || label !== prompt?.label) {
      house.set({ prompt: best && label ? { id: best.id, label } : null })
    }
  })

  return null
}
