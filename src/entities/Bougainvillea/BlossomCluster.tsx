import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../../world/palette'
import { MOTION_SCALE, WIND_DIRECTION, windStrength, windTime } from '../../systems/wind/wind'

type Props = {
  position?: [number, number, number]
  /** Rough size of the bush, in metres. */
  radius?: number
  /** How many flower bracts to draw. */
  count?: number
  /** Changes the random layout, so neighbouring clusters don't look identical. */
  seed?: number
  /** Indoors the breeze is gentler than outside. */
  shelter?: number
}

/**
 * A bougainvillea bush: a few leafy blobs covered in small magenta bracts,
 * moving in the breeze.
 *
 * The bracts use an InstancedMesh: many copies of one shape drawn in a single
 * GPU call, each with its own position, rotation, scale and colour.
 *
 * Wind, in two layers:
 *   - the whole bush leans downwind, more in a gust, and bobs a little;
 *   - every bract flutters on its own, each with a different phase, so the
 *     surface shimmers like papery petals instead of moving as one block.
 * The flutter rewrites each bract's matrix every frame. A few thousand
 * matrix updates per frame is cheap for the CPU; if we ever add many more
 * bushes, the next step would be doing this in a shader on the GPU.
 */
export function BlossomCluster({ position = [0, 0, 0], radius = 0.45, count = 150, seed = 1, shelter = 1 }: Props) {
  const bush = useRef<THREE.Group>(null)
  const leafRefs = useRef<Array<THREE.Mesh | null>>([])
  const bracts = useRef<THREE.InstancedMesh>(null)

  const { leaves, flowers } = useMemo(() => layoutBush(radius, count, seed), [radius, count, seed])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Colours are set once, before the first frame is drawn. (The shader that
  // draws per-instance colours is chosen when the mesh first renders, so the
  // colours must exist by then.)
  useLayoutEffect(() => {
    const mesh = bracts.current
    if (!mesh) return
    const colours = [palette.bougainvillea, palette.bougainvilleaLight, '#B8186A', '#F07AB4'].map((c) => new THREE.Color(c))
    flowers.forEach((_, i) => mesh.setColorAt(i, colours[i % colours.length]))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [flowers])

  useFrame(() => {
    const t = windTime() + seed * 7.3
    const wind = windStrength(windTime()) * MOTION_SCALE * shelter
    const [wx, wz] = WIND_DIRECTION

    // Lean the whole bush downwind. Tipping around X moves the top along Z,
    // tipping around Z moves it along X (hence the minus sign).
    if (bush.current) {
      const lean = wind * 0.09 + Math.sin(t * 1.3) * 0.02 * wind
      bush.current.rotation.x = wz * lean
      bush.current.rotation.z = -wx * lean
    }

    leafRefs.current.forEach((leaf, i) => {
      if (!leaf) return
      const base = leaves[i]
      const wobble = Math.sin(t * 2.1 + i * 1.9) * 0.025 * wind
      leaf.position.set(base.position[0] + wx * wobble, base.position[1], base.position[2] + wz * wobble)
    })

    const mesh = bracts.current
    if (!mesh) return
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i]
      const flutter = Math.sin(t * (3 + f.speed) + f.phase) * 0.45 * (0.3 + wind)
      dummy.position.set(f.position[0] + wx * wind * 0.02, f.position[1], f.position[2] + wz * wind * 0.02)
      dummy.rotation.set(f.rotation[0] + flutter, f.rotation[1], f.rotation[2] + flutter * 0.6)
      dummy.scale.set(f.scale, f.scale * 0.35, f.scale) // flattened, like a papery bract
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={position}>
      <group ref={bush}>
        {leaves.map((leaf, i) => (
          <mesh
            key={i}
            ref={(m) => {
              leafRefs.current[i] = m
            }}
            position={leaf.position}
            scale={leaf.scale}
            castShadow
            receiveShadow
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={i % 2 ? palette.leaf : palette.leafDark} roughness={0.85} flatShading />
          </mesh>
        ))}
        <instancedMesh ref={bracts} args={[undefined, undefined, flowers.length]} castShadow frustumCulled={false}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial roughness={0.6} flatShading />
        </instancedMesh>
      </group>
    </group>
  )
}

function seeded(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function layoutBush(radius: number, count: number, seed: number) {
  const rand = seeded(seed)

  // A handful of overlapping leafy blobs make the bush's shape.
  const leaves = Array.from({ length: 6 }, () => {
    const a = rand() * Math.PI * 2
    const d = rand() * radius * 0.5
    return {
      position: [Math.cos(a) * d, rand() * radius * 0.6, Math.sin(a) * d] as [number, number, number],
      scale: radius * (0.45 + rand() * 0.25),
    }
  })

  // Bracts sit just outside the leaf blobs, mostly on the upper half.
  const flowers = Array.from({ length: count }, (_, i) => {
    const leaf = leaves[i % leaves.length]
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(1 - rand() * 1.75) // most of the blob, a little sparser underneath
    const r = leaf.scale * (0.95 + rand() * 0.15)
    return {
      position: [
        leaf.position[0] + r * Math.sin(phi) * Math.cos(theta),
        leaf.position[1] + r * Math.cos(phi),
        leaf.position[2] + r * Math.sin(phi) * Math.sin(theta),
      ] as [number, number, number],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.035 + rand() * 0.03,
      phase: rand() * Math.PI * 2,
      speed: rand() * 2,
    }
  })

  return { leaves, flowers }
}
