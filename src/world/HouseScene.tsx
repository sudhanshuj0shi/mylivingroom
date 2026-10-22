import { useMemo } from 'react'
import { Lighting } from './Lighting'
import { Outside } from './Outside'
import { palette } from './palette'
import { Player } from './Player'
import { RoomShell } from '../house/RoomShell'
import { rooms, wallColliders } from '../house/plan'
import { Hallway, hallColliders } from '../rooms/hallway/Hallway'
import { WorkRoom, workColliders } from '../rooms/work/WorkRoom'
import { MusicRoom, musicColliders } from '../rooms/music/MusicRoom'
import { PoetryRoom, poetryColliders } from '../rooms/poetry/PoetryRoom'
import { InteractionSystem } from '../systems/interaction/interaction'

/**
 * Everything inside the 3D world: the garden, the four rooms (architecture
 * from the plan, furniture from each room's own file), lights, and you.
 */
export function HouseScene() {
  // Every wall piece and piece of furniture you can bump into, in one list.
  const colliders = useMemo(
    () => [...wallColliders(), ...hallColliders, ...workColliders, ...musicColliders, ...poetryColliders],
    [],
  )

  return (
    <>
      {/* The colour you see through the windows: a clear afternoon sky. */}
      <color attach="background" args={[palette.sky]} />
      {/* Fog fades the distant garden into the sky, so there's no hard edge to the world. */}
      <fog attach="fog" args={[palette.sky, 28, 75]} />
      <Lighting />
      <Outside />

      {Object.values(rooms).map((room) => (
        <RoomShell key={room.id} room={room} />
      ))}
      <Hallway />
      <WorkRoom />
      <MusicRoom />
      <PoetryRoom />

      <Player colliders={colliders} />
      <InteractionSystem />
    </>
  )
}
