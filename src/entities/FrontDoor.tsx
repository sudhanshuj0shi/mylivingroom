import { useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../world/palette'
import { repeated, woodTexture } from '../world/textures'

type Props = {
  /** Centre of the doorway at floor level, in the middle of the wall. */
  position: [number, number, number]
  width: number
  height: number
}

/** Teak double front door with raised panels and brass knobs. Closed for now. */
export function FrontDoor({ position, width, height }: Props) {
  const map = useMemo(() => repeated(woodTexture(), 1, 3), [])
  const leafWidth = width / 2
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C9A13B', metalness: 0.9, roughness: 0.3 }), [])
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.65} />

  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * leafWidth) / 2, height / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[leafWidth - 0.01, height, 0.08]} />
            {teak}
          </mesh>
          {/* Raised panels on the room side */}
          {[0.65, -0.1, -0.85].map((py) => (
            <mesh key={py} position={[0, py, -0.05]} castShadow>
              <boxGeometry args={[leafWidth - 0.16, 0.6, 0.03]} />
              {teak}
            </mesh>
          ))}
          <mesh position={[-s * (leafWidth / 2 - 0.08), -0.25, -0.07]} material={brass}>
            <sphereGeometry args={[0.03, 12, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
