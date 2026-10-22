import { useSyncExternalStore } from 'react'
import type { RoomId } from '../house/plan'
import type { PanelId } from '../content/panels'

/**
 * A tiny shared store for things both the 3D world and the HTML overlays need
 * to know: which room you're in, what you're looking at, which panel is open.
 *
 * Why not React state in App? The 3D scene and the HTML overlays are siblings,
 * and the player updates some of this every frame. A store outside React lets
 * the render loop write to it cheaply (no re-render per frame), while
 * components that display it re-render only when the slice they read changes.
 *
 * This is the same idea as Zustand, written out in ~40 lines so you can see
 * how it works. If it grows, swapping it for Zustand is a small change.
 */

export type LookMode = 'mouse' | 'drag'

export type HouseState = {
  /** Walking: keys move you and the mouse looks around. */
  walking: boolean
  /** Has the visitor pressed Enter at least once? */
  entered: boolean
  lookMode: LookMode
  /** True once mouse capture has worked, so later failures pause instead of switching to drag. */
  mouseLockWorked: boolean
  currentRoom: RoomId | null
  /** What "E" would do right now, e.g. "Read the note". */
  prompt: { id: string; label: string } | null
  panel: PanelId | null
  directoryOpen: boolean
  muted: boolean
  musicOn: boolean
  /** A place to move the player to; the Player picks it up on its next frame. */
  teleport: { x: number; z: number; lookAt: [number, number] } | null
}

let state: HouseState = {
  walking: false,
  entered: false,
  lookMode: 'mouse',
  mouseLockWorked: false,
  currentRoom: null,
  prompt: null,
  panel: null,
  directoryOpen: false,
  muted: readMuted(),
  musicOn: true,
  teleport: null,
}

const listeners = new Set<() => void>()

export const house = {
  get: () => state,
  set(patch: Partial<HouseState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** Read one value in a component; it re-renders only when that value changes. */
export function useHouse<T>(select: (s: HouseState) => T): T {
  return useSyncExternalStore(house.subscribe, () => select(state))
}

function readMuted() {
  try {
    return localStorage.getItem('house:muted') === '1'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean) {
  try {
    localStorage.setItem('house:muted', muted ? '1' : '0')
  } catch {
    // Storage can be blocked (private windows); sound still mutes for this visit.
  }
}

// While developing, `window.__house` lets you inspect and change the store from
// the browser console, e.g. __house.get() or __house.set({ panel: 'note' }).
// `import.meta.env.DEV` is false in the production build, so this is left out there.
if (import.meta.env.DEV) {
  ;(window as unknown as { __house: typeof house }).__house = house
}
