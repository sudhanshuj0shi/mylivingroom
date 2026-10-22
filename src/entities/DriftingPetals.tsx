import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../world/palette'
import { MOTION_SCALE, WIND_DIRECTION, windStrength, windTime } from '../systems/wind/wind'

type Props = {
  /** The box petals drift inside, in world coordinates. */
  min: [number, number, number]
  max: [number, number, number]
  count?: number
  seed?: number
}

/**
 * Bougainvillea petals blown in through a window, drifting and slowly falling.
 *
 * Each petal has a position and a spin. Every frame it moves with the wind,
 * sinks a little, and swirls along a small circle. When it lands or leaves
 * its box, it reappears high on the upwind side: a loop that looks endless.
 * Like the bush's flowers, all petals are one InstancedMesh, so it is one
 * draw call however many there are.
 */
export function DriftingPetals({ min, max, count = 36, seed = 1 }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const petals = useMemo(() => {
    let s = seed * 7919
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    return Array.from({ length: count }, () => ({
      p: new THREE.Vector3(lerp(min[0], max[0], rand()), lerp(min[1], max[1], rand()), lerp(min[2], max[2], rand())),
      spin: new THREE.Vector3(rand() * 6, rand() * 6, rand() * 6),
      speed: 0.6 + rand() * 0.8,
      fall: 0.08 + rand() * 0.12,
      phase: rand() * Math.PI * 2,
      rand,
    }))
    // Compare the box by value: a new array with the same numbers shouldn't restart the petals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, min.join(), max.join()])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const colours = [palette.bougainvillea, palette.bougainvilleaLight, '#F07AB4'].map((c) => new THREE.Color(c))
    petals.forEach((_, i) => m.setColorAt(i, colours[i % colours.length]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [petals])

  useFrame((_, rawDelta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(rawDelta, 0.05) * MOTION_SCALE
    const t = windTime()
    const wind = windStrength(t)
    const [wx, wz] = WIND_DIRECTION

    petals.forEach((petal, i) => {
      const { p } = petal
      const push = (0.15 + wind * 0.7) * petal.speed
      p.x += (wx * push + Math.sin(t * 1.3 + petal.phase) * 0.2) * dt
      p.z += (wz * push + Math.cos(t * 1.1 + petal.phase) * 0.2) * dt
      p.y -= (petal.fall - wind * 0.06 + Math.sin(t * 2 + petal.phase) * 0.05) * dt

      const out = p.x > max[0] || p.x < min[0] || p.z > max[2] || p.z < min[2] || p.y < min[1]
      if (out) {
        // Back to the upwind end of the box, high up.
        p.set(
          wx > 0 ? min[0] : max[0],
          lerp((min[1] + max[1]) / 2, max[1], petal.rand()),
          lerp(min[2], max[2], petal.rand()),
        )
        if (petal.rand() > 0.5) p.set(lerp(min[0], max[0], petal.rand()), p.y, wz > 0 ? min[2] : max[2])
      }

      dummy.position.copy(p)
      dummy.rotation.set(t * petal.spin.x, t * petal.spin.y, t * petal.spin.z)
      dummy.scale.set(0.045, 0.004, 0.035)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshStandardMaterial roughness={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
