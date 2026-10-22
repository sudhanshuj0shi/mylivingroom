import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MOTION_SCALE, windStrength, windTime } from '../systems/wind/wind'

type Props = {
  /** Centre of the curtain's top edge (where it hangs from the rod). */
  position: [number, number, number]
  /** Turns the curtain so its front faces into the room. */
  rotationY: number
  width: number
  height: number
  seed?: number
}

const SEGMENTS_X = 18
const SEGMENTS_Y = 26

/**
 * A sheer cotton curtain that billows into the room when the breeze gusts.
 *
 * This is the first time we move the *vertices* of a shape instead of the
 * whole shape. A plane is a grid of points (vertices). Each frame we push
 * every point forwards (along the plane's local Z, which faces the room) by
 * an amount that depends on:
 *   - how far down the curtain it is: the top is fixed to the rod, the hem
 *     swings most;
 *   - the wind strength right now;
 *   - a couple of travelling sine waves, which make ripples run across it.
 * Then `computeVertexNormals` recalculates which way each bit of the surface
 * faces, so light and shade follow the new folds.
 */
export function Curtain({ position, rotationY, width, height, seed = 0 }: Props) {
  const mesh = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, SEGMENTS_X, SEGMENTS_Y)
    g.translate(0, -height / 2, 0) // put the top edge at y = 0, so `position` is the rod
    return g
  }, [width, height])

  // Keep the flat starting shape, so every frame starts from the same place.
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])

  useFrame(() => {
    const t = windTime() + seed * 3.1
    const wind = windStrength(windTime()) * MOTION_SCALE
    const positions = geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i < positions.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      // 0 at the rod, 1 at the hem. Clamped: rounding can make the top row a hair above 0,
      // and a fractional power of a negative number is NaN, which breaks the whole mesh.
      const hang = Math.min(1, Math.max(0, -y / height))

      const pleats = Math.sin(x * 16 + seed) * 0.025 // folds the fabric always has
      const billow = Math.pow(hang, 1.5) * wind * 0.5 * (0.75 + 0.25 * Math.sin(x * 2.5 + t * 1.6))
      const ripple = Math.sin(x * 8 - t * 2.4 + y * 1.5) * 0.03 * (0.3 + wind) * Math.pow(hang, 0.7)
      // A gust also lifts the hem a little, as the cloth swings out.
      const lift = Math.pow(hang, 2) * wind * 0.12

      positions.setXYZ(i, x, y + lift, pleats + billow + ripple)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh ref={mesh} geometry={geometry} position={position} rotation={[0, rotationY, 0]} frustumCulled={false}>
      <meshStandardMaterial
        color="#FFF8EC"
        roughness={0.9}
        transparent
        opacity={0.62}
        side={THREE.DoubleSide}
        // Sheer fabric: don't hide things drawn later behind it.
        depthWrite={false}
      />
    </mesh>
  )
}
