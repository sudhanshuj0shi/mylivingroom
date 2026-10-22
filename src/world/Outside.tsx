import { palette } from './palette'
import { PalmTree } from '../entities/PalmTree'
import { HOUSE_BOUNDS } from '../house/plan'

/** Palms placed so that each window looks out onto at least one. */
const PALMS: Array<{ position: [number, number, number]; height: number; lean: number; heading: number }> = [
  { position: [-6.5, 0, -6], height: 8, lean: 0.18, heading: 2.6 }, // outside the hall's west window
  { position: [6.5, 0, -6.5], height: 9, lean: 0.14, heading: 0.4 }, // hall's east window
  { position: [-13, 0, 0.5], height: 10, lean: 0.2, heading: 2.9 }, // work room window
  { position: [-16, 0, 5], height: 8.5, lean: 0.1, heading: 1.8 },
  { position: [13.5, 0, 3], height: 9.5, lean: 0.16, heading: 0.1 }, // music room window
  { position: [17, 0, -1.5], height: 8, lean: 0.12, heading: 5.8 },
  { position: [-3.5, 0, -21], height: 9, lean: 0.17, heading: 4.4 }, // poetry room window
  { position: [3, 0, -24], height: 11, lean: 0.1, heading: 1.2 },
  { position: [8.5, 0, -19], height: 8, lean: 0.22, heading: 5.2 },
]

/**
 * The garden around the house: grass, a laterite plinth the house stands on,
 * and coconut palms. You only ever see it through windows, so it can stay
 * simple; fog in HouseScene softens it into the sky in the distance.
 */
export function Outside() {
  const cx = (HOUSE_BOUNDS.x0 + HOUSE_BOUNDS.x1) / 2
  const cz = (HOUSE_BOUNDS.z0 + HOUSE_BOUNDS.z1) / 2
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color={palette.grass} roughness={1} />
      </mesh>
      {/* Laterite plinth: Goan houses sit on a low base of the local red stone. */}
      <mesh position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HOUSE_BOUNDS.x1 - HOUSE_BOUNDS.x0 + 3, HOUSE_BOUNDS.z1 - HOUSE_BOUNDS.z0 + 3]} />
        <meshStandardMaterial color={palette.laterite} roughness={1} />
      </mesh>
      {PALMS.map((p, i) => (
        <PalmTree key={i} {...p} seed={i + 1} />
      ))}
    </group>
  )
}
