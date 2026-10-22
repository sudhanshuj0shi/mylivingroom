import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useKeyboard } from '../systems/movement/useKeyboard'
import { moveWithCollision, type Box2D } from '../systems/collision/collision'

/** Tuning values. Change these and reload to feel the difference. */
export const PLAYER = {
  eyeHeight: 1.6, // metres; an average adult's eye level
  radius: 0.3, // how close you can get to walls and furniture
  walkSpeed: 2.0, // metres per second; a relaxed indoor walk
  runSpeed: 3.6,
  // How quickly you speed up and slow down. Higher = snappier, lower = floatier.
  acceleration: 10,
}

type Props = {
  colliders: readonly Box2D[]
  /** Where the visitor starts, on the floor. */
  start: [number, number]
  /** Called when the mouse is captured (true) or released (false). */
  onLockChange: (locked: boolean) => void
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
 * movement into camera rotation, like most first-person games.
 *
 * Walking: every frame we
 *   1. read the held keys and turn them into a direction relative to where
 *      the camera faces (W = the way you're looking, flattened onto the floor);
 *   2. ease the current velocity towards that target (no instant starts/stops);
 *   3. move by velocity × delta, then let the collision code stop or slide us.
 *
 * `delta` is the time since the last frame, in seconds. Multiplying by it is
 * what makes walking speed the same on a 60Hz laptop and a 144Hz monitor:
 * a faster screen runs more frames, each moving a smaller distance.
 */
export function Player({ colliders, start, onLockChange }: Props) {
  const camera = useThree((state) => state.camera)
  const keys = useKeyboard()
  const velocity = useRef(new THREE.Vector3())
  const initialised = useRef(false)
  // Movement only happens while the mouse is captured, i.e. while you're "in" the house.
  const locked = useRef(false)

  useFrame((_, rawDelta) => {
    if (!initialised.current) {
      camera.position.set(start[0], PLAYER.eyeHeight, start[1])
      camera.lookAt(0, PLAYER.eyeHeight, -10) // face the window
      initialised.current = true
    }

    // If the tab was hidden, the next delta can be huge; cap it so we never jump through a wall.
    const delta = Math.min(rawDelta, 0.05)
    const held = locked.current ? keys.current : NO_KEYS

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
  })

  return (
    <PointerLockControls
      // Only the "Enter" button captures the mouse, not every click on the page.
      selector="#enter-house"
      onLock={() => {
        locked.current = true
        onLockChange(true)
      }}
      onUnlock={() => {
        locked.current = false
        keys.current.clear()
        onLockChange(false)
      }}
    />
  )
}
