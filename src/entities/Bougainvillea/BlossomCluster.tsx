import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../../world/palette'

type Props = {
  position?: [number, number, number]
  /** Rough size of the bush, in metres. */
  radius?: number
  /** How many flower bracts to draw. */
  count?: number
  /** Changes the random layout, so neighbouring clusters don't look identical. */
  seed?: number
  /** Gentle movement, as if in a breeze. Off for reduced motion later. */
  sway?: boolean
}

/**
 * A bougainvillea bush: a few leafy blobs covered in small magenta bracts.
 *
 * The bracts use an InstancedMesh. Drawing 150 separate meshes would mean 150
 * draw calls (150 separate requests to the graphics card). An InstancedMesh
 * draws many copies of one shape in a single call, each with its own position,
 * rotation, scale and colour. That is how scenes stay fast with lots of small
 * repeated things, like flowers, leaves or dust.
 */
export function BlossomCluster({ position = [0, 0, 0], radius = 0.45, count = 150, seed = 1, sway = true }: Props) {
  const group = useRef<THREE.Group>(null)
  const bracts = useRef<THREE.InstancedMesh>(null)

  // Positions are worked out once and remembered.
  const { leaves, flowers } = useMemo(() => layoutBush(radius, count, seed), [radius, count, seed])

  useLayoutEffect(() => {
    const mesh = bracts.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const colours = [palette.bougainvillea, palette.bougainvilleaLight, '#B8186A', '#F07AB4'].map((c) => new THREE.Color(c))
    flowers.forEach((f, i) => {
      dummy.position.set(...f.position)
      dummy.rotation.set(...f.rotation)
      dummy.scale.set(f.scale, f.scale * 0.35, f.scale) // flattened, like a papery bract
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, colours[i % colours.length])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [flowers])

  // A slow, small sway. `clock.elapsedTime` is seconds since the page loaded.
  useFrame(({ clock }) => {
    if (!sway || !group.current) return
    const time = clock.elapsedTime + seed * 10
    group.current.rotation.z = Math.sin(time * 0.6) * 0.025
    group.current.rotation.x = Math.sin(time * 0.43) * 0.02
  })

  return (
    <group position={position}>
      <group ref={group}>
        {leaves.map((leaf, i) => (
          <mesh key={i} position={leaf.position} scale={leaf.scale} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={i % 2 ? palette.leaf : palette.leafDark} roughness={0.85} flatShading />
          </mesh>
        ))}
        <instancedMesh ref={bracts} args={[undefined, undefined, flowers.length]} castShadow>
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
    const phi = Math.acos(1 - rand() * 1.3) // biased towards the top
    const r = leaf.scale * (0.95 + rand() * 0.15)
    return {
      position: [
        leaf.position[0] + r * Math.sin(phi) * Math.cos(theta),
        leaf.position[1] + r * Math.cos(phi),
        leaf.position[2] + r * Math.sin(phi) * Math.sin(theta),
      ] as [number, number, number],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
      scale: 0.035 + rand() * 0.03,
    }
  })

  return { leaves, flowers }
}
