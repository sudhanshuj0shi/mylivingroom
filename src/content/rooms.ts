import type { RoomId } from '../house/plan'

/**
 * What each room is called and where the room directory drops you.
 * Edit names and descriptions freely; positions are in metres (see house/plan.ts).
 */
export type RoomInfo = {
  name: string
  description: string
  /** Where you stand when you arrive from the directory, and what you face. */
  spawn: [number, number]
  lookAt: [number, number]
}

export const roomInfo: Record<RoomId, RoomInfo> = {
  hall: {
    name: 'The Hall',
    description: 'Where every visit starts. A note waits on the bench.',
    spawn: [0, 4.4],
    lookAt: [0, -10],
  },
  work: {
    name: 'The Work Room',
    description: 'The desk, the laptop and the things I have built.',
    spawn: [-3.4, 2],
    lookAt: [-8, 2],
  },
  poetry: {
    name: 'The Poetry Room',
    description: 'A quiet room with a big window. Its poems arrive soon.',
    spawn: [0, -9.2],
    lookAt: [0, -15],
  },
  music: {
    name: 'The Music Room',
    description: 'Records, speakers, and a turntable you can play.',
    spawn: [5, 1],
    lookAt: [5, 6],
  },
}

/** The order rooms are listed in the directory. */
export const roomOrder: RoomId[] = ['hall', 'work', 'poetry', 'music']
