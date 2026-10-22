import { useMemo } from 'react'
import { Lighting } from './Lighting'
import { palette } from './palette'
import { Player, type LookMode } from './Player'
import { Hallway } from '../rooms/hallway/Hallway'
import { buildColliders } from '../rooms/hallway/layout'

type Props = {
  onLockChange: (locked: boolean, mode: LookMode) => void
}

/**
 * Everything inside the 3D world. For now: one room, its lights, and you.
 * In Milestone 2 this is where the other rooms join the hallway.
 */
export function HouseScene({ onLockChange }: Props) {
  const colliders = useMemo(() => buildColliders(), [])

  return (
    <>
      {/* The colour you see through the window: a clear afternoon sky. */}
      <color attach="background" args={[palette.sky]} />
      <Lighting />
      <Hallway />
      <Player colliders={colliders} start={[0, 2.6]} onLockChange={onLockChange} />
    </>
  )
}
