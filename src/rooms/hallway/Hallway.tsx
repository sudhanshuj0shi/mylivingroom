import { useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../../world/palette'
import { repeated, woodTexture } from '../../world/textures'
import { FlowerPot } from '../../entities/Bougainvillea/FlowerPot'
import { FrontDoor } from '../../entities/FrontDoor'
import { boxFromCenter, type Box2D } from '../../systems/collision/collision'
import { useInteractable } from '../../systems/interaction/interaction'
import { house } from '../../state/houseStore'
import { WALL, rooms } from '../../house/plan'

const hall = rooms.hall

/** Furniture positions, used for both drawing and collisions. */
const BENCH = { x: hall.x0 + WALL + 0.27, z: -1, width: 0.5, length: 1.8, height: 0.45 }
const POTS: Array<[number, number]> = [
  [-1.3, 5.4],
  [1.3, 5.4],
  [-1.3, -7.4],
  [1.3, -7.4],
]
const NOTE_POSITION = new THREE.Vector3(BENCH.x, BENCH.height + 0.1, -0.6)

export const hallColliders: Box2D[] = [
  boxFromCenter(BENCH.x, BENCH.z, BENCH.width, BENCH.length),
  ...POTS.map(([x, z]) => boxFromCenter(x, z, 0.6, 0.6)),
]

/** The hall's furniture: a bench with a welcome note, flower pots, the front door. */
export function Hallway() {
  useInteractable({
    id: 'note',
    position: NOTE_POSITION,
    label: () => 'Read the note',
    action: () => house.set({ panel: 'note' }),
  })

  return (
    <group>
      <Bench />
      <Note />
      {POTS.map(([x, z], i) => (
        <FlowerPot key={i} position={[x, 0, z]} seed={3 + i * 5} />
      ))}
      <FrontDoor position={[0, 0, hall.z1 - WALL / 2]} width={1.4} height={2.7} />
    </group>
  )
}

/** A teak bench with a cobalt cushion, against the west wall. */
function Bench() {
  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const { x, z, width: w, length: d, height: h } = BENCH
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.7} />
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        {teak}
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * (w - 0.08)) / 2, (h - 0.06) / 2, (sz * (d - 0.08)) / 2]} castShadow>
            <boxGeometry args={[0.06, h - 0.06, 0.06]} />
            {teak}
          </mesh>
        )),
      )}
      <mesh position={[0, h + 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.08, d - 0.1]} />
        <meshStandardMaterial color={palette.cobalt} roughness={0.95} />
      </mesh>
    </group>
  )
}

/** A folded note lying on the cushion, tied with a pink ribbon so it catches the eye. */
function Note() {
  return (
    <group position={NOTE_POSITION} rotation={[0, 0.4, 0]}>
      <mesh position={[0, -0.005, 0]} castShadow>
        <boxGeometry args={[0.2, 0.01, 0.15]} />
        <meshStandardMaterial color="#FBF6EA" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[0.025, 0.012, 0.152]} />
        <meshStandardMaterial color={palette.bougainvillea} roughness={0.6} />
      </mesh>
    </group>
  )
}
