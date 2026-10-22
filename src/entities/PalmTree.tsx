import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../world/palette'
import { MOTION_SCALE, WIND_DIRECTION, windStrength, windTime } from '../systems/wind/wind'

type Props = {
  position: [number, number, number]
  height?: number
  /** The trunk's lean, in radians, and which way (around Y) it leans. */
  lean?: number
  heading?: number
  seed?: number
}

/**
 * A coconut palm, seen through the windows. Made of a curved trunk (a stack
 * of short cylinders, each a little more tilted) and a crown of drooping
 * fronds. The crown nods with the breeze; fronds flutter individually.
 */
export function PalmTree({ position, height = 9, lean = 0.12, heading = 0, seed = 1 }: Props) {
  const crown = useRef<THREE.Group>(null)
  const fronds = useRef<Array<THREE.Group | null>>([])

  // The trunk: segments that curve gently, getting thinner towards the top.
  const segments = useMemo(() => {
    const out: { position: THREE.Vector3; tilt: number; radius: number; length: number }[] = []
    const count = 8
    const length = height / count
    const p = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      const tilt = lean * (i / count) * 1.6
      const dir = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), 0)
      out.push({ position: p.clone().addScaledVector(dir, length / 2), tilt, radius: 0.2 - i * 0.012, length: length * 1.05 })
      p.addScaledVector(dir, length)
    }
    return { out, top: p.clone() }
  }, [height, lean])

  const frondAngles = useMemo(() => Array.from({ length: 11 }, (_, i) => (i / 11) * Math.PI * 2 + seed), [seed])

  useFrame(() => {
    const t = windTime() + seed * 5
    const wind = windStrength(windTime()) * MOTION_SCALE
    const [wx, wz] = WIND_DIRECTION
    if (crown.current) {
      const nod = wind * 0.08 + Math.sin(t * 0.9) * 0.03 * wind
      crown.current.rotation.x = wz * nod
      crown.current.rotation.z = -wx * nod
    }
    fronds.current.forEach((f, i) => {
      if (f) f.rotation.z = -0.5 - Math.sin(t * 2.2 + i) * 0.08 * (0.3 + wind)
    })
  })

  return (
    <group position={position} rotation={[0, heading, 0]}>
      {segments.out.map((s, i) => (
        <mesh key={i} position={s.position} rotation={[0, 0, -s.tilt]} castShadow>
          <cylinderGeometry args={[s.radius * 0.92, s.radius, s.length, 10]} />
          <meshStandardMaterial color={palette.palmTrunk} roughness={1} />
        </mesh>
      ))}
      <group ref={crown} position={segments.top}>
        {frondAngles.map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            <group
              ref={(g) => {
                fronds.current[i] = g
              }}
              rotation={[0, 0, -0.5]}
            >
              {/* A long cone, squashed flat, makes a decent frond: wide at the base, pointed at the tip.
                  It is rotated to point along X, so squashing its local X flattens it vertically. */}
              <mesh position={[1.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.12, 1, 1]} castShadow>
                <coneGeometry args={[0.45, 2.9, 6]} />
                <meshStandardMaterial color={i % 2 ? palette.palmLeaf : palette.leafDark} roughness={0.8} flatShading />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
