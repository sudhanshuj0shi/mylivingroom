import { boxFromCenter, type Box2D } from '../../systems/collision/collision'

/**
 * The test room, described as data.
 *
 * Coordinate system (the same everywhere in this project):
 *   - 1 unit = 1 metre.
 *   - Y points up. The floor is at y = 0.
 *   - X runs left/right, Z runs front/back. The room's centre is at x = 0, z = 0.
 *   - "North" is -Z (the window wall); "south" is +Z (the front door).
 *
 * The walls listed here are used twice: once to draw them, once to build the
 * collision boxes. Keeping one list means what you see and what stops you can
 * never drift apart.
 */

export const ROOM = {
  width: 6, // along X
  depth: 8, // along Z
  height: 4, // tall ceilings, as in old Goan houses
  wall: 0.2, // wall thickness
} as const

export const WINDOW = { left: -1, right: 1, bottom: 1, top: 3 } as const
export const DOOR = { left: -0.7, right: 0.7, top: 2.6 } as const

export type WallPiece = {
  name: string
  /** Centre of the box. */
  position: [number, number, number]
  /** Full size of the box. */
  size: [number, number, number]
}

const halfW = ROOM.width / 2
const halfD = ROOM.depth / 2
const t = ROOM.wall
const H = ROOM.height

/** Make a wall piece from its edges, which is easier to read than centres. */
function piece(name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): WallPiece {
  return {
    name,
    position: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    size: [x1 - x0, y1 - y0, z1 - z0],
  }
}

const northZ: [number, number] = [-halfD - t, -halfD]
const southZ: [number, number] = [halfD, halfD + t]

export const walls: WallPiece[] = [
  // West and east walls run the full depth (and overlap the corners).
  piece('west', -halfW - t, -halfW, 0, H, -halfD - t, halfD + t),
  piece('east', halfW, halfW + t, 0, H, -halfD - t, halfD + t),

  // North wall, built around the window opening.
  piece('north-left', -halfW, WINDOW.left, 0, H, ...northZ),
  piece('north-right', WINDOW.right, halfW, 0, H, ...northZ),
  piece('north-sill', WINDOW.left, WINDOW.right, 0, WINDOW.bottom, ...northZ),
  piece('north-lintel', WINDOW.left, WINDOW.right, WINDOW.top, H, ...northZ),

  // South wall, built around the front door.
  piece('south-left', -halfW, DOOR.left, 0, H, ...southZ),
  piece('south-right', DOOR.right, halfW, 0, H, ...southZ),
  piece('south-lintel', DOOR.left, DOOR.right, DOOR.top, H, ...southZ),
]

/** Furniture footprints, also as data, so collisions match what is drawn. */
export const furniture = {
  bench: { position: [-2.55, 0, 0.5] as [number, number, number], size: [0.5, 0.45, 1.8] as [number, number, number] },
  potByWindow: { position: [2.3, 0, -3.3] as [number, number, number], radius: 0.3 },
  potByDoor: { position: [-2.3, 0, 3.3] as [number, number, number], radius: 0.3 },
}

/**
 * Everything the player can bump into, seen from above.
 * Wall pieces that start above head height (the lintels) are skipped because
 * you walk under them.
 */
export function buildColliders(): Box2D[] {
  const boxes: Box2D[] = walls
    .filter((w) => w.position[1] - w.size[1] / 2 < 1.8)
    .map((w) => boxFromCenter(w.position[0], w.position[2], w.size[0], w.size[2]))

  // The front door is closed for now, so the doorway is blocked too.
  boxes.push(boxFromCenter(0, halfD + t / 2, DOOR.right - DOOR.left, t))

  const { bench, potByWindow, potByDoor } = furniture
  boxes.push(boxFromCenter(bench.position[0], bench.position[2], bench.size[0], bench.size[2]))
  for (const pot of [potByWindow, potByDoor]) {
    boxes.push(boxFromCenter(pot.position[0], pot.position[2], pot.radius * 2, pot.radius * 2))
  }

  // The open shutters stick out from the window wall into the room.
  boxes.push(boxFromCenter(-1.5, -halfD + 0.18, 1.0, 0.36))
  boxes.push(boxFromCenter(1.5, -halfD + 0.18, 1.0, 0.36))
  return boxes
}
