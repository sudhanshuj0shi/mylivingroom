import { useMemo } from 'react'
import { palette } from '../world/palette'
import { repeated, woodTexture } from '../world/textures'

type Props = {
  /** Where the hinge is, in the window's local frame (X along the wall, +Z into the room). */
  hinge: [number, number, number]
  side: 'left' | 'right'
  width: number
  height: number
}

/**
 * A louvred shutter swung open into the room.
 *
 * The trick for hinges: put the shutter inside a group whose origin is the
 * hinge, offset the panel by half its width, then rotate the group. Rotating
 * a group spins its children around the group's origin, i.e. around the hinge.
 */
export function Shutter({ hinge, side, width, height }: Props) {
  const map = useMemo(() => repeated(woodTexture(), 1, 2), [])
  const direction = side === 'left' ? 1 : -1 // which way the closed panel extends from the hinge
  const openAngle = side === 'left' ? -2.8 : 2.8 // about 160°, nearly flat against the wall
  const material = <meshStandardMaterial color={palette.shutterGreen} map={map} roughness={0.7} />
  const slats = Array.from({ length: 9 }, (_, i) => -height / 2 + 0.25 + i * ((height - 0.5) / 8))

  return (
    <group position={hinge} rotation={[0, openAngle, 0]}>
      <group position={[(direction * width) / 2, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.03]} />
          {material}
        </mesh>
        {/* Louvres: thin slats tilted like real shutter blades */}
        {slats.map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[width - 0.14, 0.11, 0.015]} />
            {material}
          </mesh>
        ))}
      </group>
    </group>
  )
}
