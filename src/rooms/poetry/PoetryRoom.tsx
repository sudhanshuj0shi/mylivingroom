import { useMemo } from 'react'
import { palette } from '../../world/palette'
import { repeated, woodTexture } from '../../world/textures'
import { boxFromCenter, type Box2D } from '../../systems/collision/collision'

const CHAIR = { x: 1.7, z: -13.3, heading: -2.5 }

export const poetryColliders: Box2D[] = [boxFromCenter(CHAIR.x, CHAIR.z, 0.8, 0.8)]

/**
 * The poetry room, kept almost empty on purpose: a rose-coloured room, a
 * large window with long curtains, petals drifting in on the breeze, and one
 * old armchair turned towards the light. The poems arrive in Milestone 4.
 */
export function PoetryRoom() {
  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const wood = <meshStandardMaterial color="#5A321C" map={map} roughness={0.55} />
  const seat = <meshStandardMaterial color={palette.shutterGreen} roughness={0.95} />

  return (
    // An antique armchair with green upholstery, angled towards the window.
    <group position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, CHAIR.heading, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.1, 0.58]} />
        {seat}
      </mesh>
      <mesh position={[0, 0.82, -0.28]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.56, 0.72, 0.08]} />
        {seat}
      </mesh>
      {/* Carved frame around the back */}
      <mesh position={[0, 1.2, -0.33]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.08, 0.025, 8, 20, Math.PI]} />
        {wood}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.32, 0.6, 0]} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.56]} />
            {wood}
          </mesh>
          <mesh position={[s * 0.32, 0.5, 0.25]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            {wood}
          </mesh>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[s * 0.27, 0.19, sz * 0.25]} rotation={[sz * 0.08, 0, s * -0.08]} castShadow>
              <cylinderGeometry args={[0.02, 0.028, 0.38, 8]} />
              {wood}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
