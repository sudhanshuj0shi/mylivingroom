import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useKeyboard } from '../systems/movement/useKeyboard'
import { useDragLook } from '../systems/movement/useDragLook'
import { moveWithCollision, type Box2D } from '../systems/collision/collision'
import { interact } from '../systems/interaction/interaction'
import { house } from '../state/houseStore'
import { roomAt } from '../house/plan'
import { roomInfo } from '../content/rooms'

/** Tuning values. Change these and reload to feel the difference. */
export const PLAYER = {
  eyeHeight: 1.6, // metres; an average adult's eye level
  radius: 0.3, // how close you can get to walls and furniture
  walkSpeed: 2.0, // metres per second; a relaxed indoor walk
  runSpeed: 3.6,
  // How quickly you speed up and slow down. Higher = snappier, lower = floatier.
  acceleration: 10,
}

// Reused every frame instead of creating new objects 60 times a second.
const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const wish = new THREE.Vector3()
const NO_KEYS = new Set<string>()

/**
 * The visitor: a camera at eye height that walks and looks around.
 *
 * Looking: PointerLockControls (from Drei) hides the cursor and turns mouse
 * movement into camera rotation. If the browser refuses that, useDragLook
 * lets you click and drag instead.
 *
 * Walking: every frame we
 *   1. read the held keys and turn them into a direction relative to where
 *      the camera faces (W = the way you're looking, flattened onto the floor);
 *   2. ease the current velocity towards that target (no instant starts/stops);
 *   3. move by velocity × delta, then let the collision code stop or slide us.
 *
 * `delta` is the time since the last frame, in seconds. Multiplying by it is
 * what makes walking speed the same on a 60Hz laptop and a 144Hz monitor.
 *
 * It also tells the shared store which room you're in, and picks up
 * teleports requested by the room directory.
 */
export function Player({ colliders }: { colliders: readonly Box2D[] }) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const keys = useKeyboard()
  const velocity = useRef(new THREE.Vector3())
  const initialised = useRef(false)

  useDragLook()

  // Clicking while walking with a captured mouse uses whatever you're facing, like pressing E.
  useEffect(() => {
    const onClick = () => {
      const { walking, lookMode } = house.get()
      if (walking && lookMode === 'mouse') interact()
    }
    canvas.addEventListener('mousedown', onClick)
    return () => canvas.removeEventListener('mousedown', onClick)
  }, [canvas])

  useFrame((_, rawDelta) => {
    if (!initialised.current) {
      const { spawn, lookAt } = roomInfo.hall
      camera.position.set(spawn[0], PLAYER.eyeHeight, spawn[1])
      camera.lookAt(lookAt[0], PLAYER.eyeHeight, lookAt[1])
      initialised.current = true
    }

    const state = house.get()

    // A teleport from the room directory: jump there and face the room.
    if (state.teleport) {
      const { x, z, lookAt } = state.teleport
      camera.position.set(x, PLAYER.eyeHeight, z)
      camera.lookAt(lookAt[0], PLAYER.eyeHeight, lookAt[1])
      velocity.current.set(0, 0, 0)
      house.set({ teleport: null })
    }

    // If the tab was hidden, the next delta can be huge; cap it so we never jump through a wall.
    const delta = Math.min(rawDelta, 0.05)
    const held = state.walking ? keys.current : NO_KEYS

    // 1. Direction from keys, relative to where the camera faces.
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, camera.up).normalize()

    wish.set(0, 0, 0)
    if (held.has('KeyW') || held.has('ArrowUp')) wish.add(forward)
    if (held.has('KeyS') || held.has('ArrowDown')) wish.sub(forward)
    if (held.has('KeyD') || held.has('ArrowRight')) wish.add(right)
    if (held.has('KeyA') || held.has('ArrowLeft')) wish.sub(right)
    // Normalise so walking diagonally isn't faster than walking straight.
    if (wish.lengthSq() > 0) wish.normalize()

    const running = held.has('ShiftLeft') || held.has('ShiftRight')
    wish.multiplyScalar(running ? PLAYER.runSpeed : PLAYER.walkSpeed)

    // 2. Ease towards the target velocity. `1 - exp(-k·dt)` is a smoothing
    //    factor that behaves the same at any frame rate.
    const blend = 1 - Math.exp(-PLAYER.acceleration * delta)
    velocity.current.lerp(wish, blend)

    // 3. Move, respecting walls and furniture.
    const next = moveWithCollision(
      camera.position.x,
      camera.position.z,
      velocity.current.x * delta,
      velocity.current.z * delta,
      PLAYER.radius,
      colliders,
    )
    camera.position.set(next.x, PLAYER.eyeHeight, next.z)

    // Which room are we in? Only tell the store when it changes.
    const room = roomAt(next.x, next.z)
    if (room && room !== state.currentRoom) house.set({ currentRoom: room })
  })

  return (
    <PointerLockControls
      // Only the "Enter" button captures the mouse, not every click on the page.
      selector="#enter-house"
      onLock={() => house.set({ walking: true, entered: true, lookMode: 'mouse', mouseLockWorked: true })}
      onUnlock={() => {
        keys.current.clear()
        house.set({ walking: false })
      }}
    />
  )
}

/**
 * Go back to walking after a panel or the directory closes. Must run inside a
 * click or key press, because browsers only capture the mouse in response to one.
 */
export function resumeWalking() {
  const { lookMode } = house.get()
  if (lookMode === 'drag') {
    house.set({ walking: true })
    return
  }
  const canvas = document.querySelector('canvas')
  try {
    const result = canvas?.requestPointerLock() as unknown as Promise<void> | undefined
    // Newer browsers return a promise; if capture is refused, the pause card shows instead.
    result?.catch?.(() => house.set({ walking: false }))
  } catch {
    house.set({ walking: false })
  }
}

/** Stop walking to read something: release the mouse so the visitor can use the panel. */
export function pauseForPanel() {
  house.set({ walking: false })
  if (document.pointerLockElement) document.exitPointerLock()
}
