import { boxFromCenter, type Box2D } from '../systems/collision/collision'
import { palette } from '../world/palette'

/**
 * The floor plan of the whole house, as data.
 *
 * Seen from above (north is -Z, at the top of this sketch):
 *
 *                 ┌───────────────┐
 *                 │    POETRY     │  big window on the north wall
 *                 └──────┐ ┌──────┘
 *        window ▸ │ HALL │       ◂ window       (open courtyards either side)
 *    ┌────────────┤      ├────────────┐
 *    │    WORK    ▸      ◂   MUSIC    │  each with a window on its outer wall
 *    │            │      │            │
 *    └────────────┤      ├────────────┘
 *                 └─door─┘                      front door at the south
 *
 * Coordinates: 1 unit = 1 metre, Y up, floor at y = 0.
 *
 * How walls work: each room builds its own four walls *inside* its rectangle,
 * each `WALL` thick. Where two rooms touch, their walls sit back to back, so a
 * shared wall is painted in each room's own colour on its own side. A doorway
 * is declared once with `connect()` and cut into both rooms' walls, so the two
 * halves can never get out of line.
 */

export const WALL = 0.12
export const CEILING = 4

export type RoomId = 'hall' | 'work' | 'music' | 'poetry'
export type Side = 'north' | 'south' | 'east' | 'west'

export type Rect = { x0: number; x1: number; z0: number; z1: number }

export type FloorKind = 'floral' | 'teak' | 'checker' | 'redOxide'

export type RoomPlan = Rect & {
  id: RoomId
  wall: string
  floor: FloorKind
  /** Blue-and-white tiles along the lower walls. */
  dado: boolean
  /** Teak beams across the ceiling. */
  beams: boolean
}

export type Opening = {
  kind: 'doorway' | 'frontDoor' | 'window'
  /** Centre along the wall: an X value on north/south walls, a Z value on east/west walls. */
  center: number
  width: number
  bottom: number
  top: number
  /** Windows only: bougainvillea growing outside (and petals blowing in). */
  blossoms?: boolean
  /** Windows only: louvred shutters or long sheer curtains. */
  dressing?: 'shutters' | 'curtains'
}

export const rooms: Record<RoomId, RoomPlan> = {
  hall: { id: 'hall', x0: -1.8, x1: 1.8, z0: -8, z1: 6, wall: palette.turmeric, floor: 'floral', dado: true, beams: true },
  work: { id: 'work', x0: -8, x1: -1.8, z0: -2, z1: 6, wall: palette.workWall, floor: 'teak', dado: false, beams: true },
  music: { id: 'music', x0: 1.8, x1: 8, z0: -2, z1: 6, wall: palette.musicWall, floor: 'checker', dado: false, beams: true },
  poetry: { id: 'poetry', x0: -3.5, x1: 3.5, z0: -15, z1: -8, wall: palette.poetryWall, floor: 'redOxide', dado: false, beams: false },
}

export const openings: Record<RoomId, Partial<Record<Side, Opening[]>>> = { hall: {}, work: {}, music: {}, poetry: {} }

function add(room: RoomId, side: Side, opening: Opening) {
  ;(openings[room][side] ??= []).push(opening)
}

/** A doorway between two rooms, cut into both of their walls. */
function connect(a: RoomId, sideA: Side, b: RoomId, sideB: Side, center: number, width: number, top: number) {
  const opening: Opening = { kind: 'doorway', center, width, bottom: 0, top }
  add(a, sideA, opening)
  add(b, sideB, opening)
}

connect('hall', 'west', 'work', 'east', 2, 1.4, 2.8)
connect('hall', 'east', 'music', 'west', 2, 1.4, 2.8)
connect('hall', 'north', 'poetry', 'south', 0, 1.8, 3.1)

add('hall', 'south', { kind: 'frontDoor', center: 0, width: 1.4, bottom: 0, top: 2.7 })
add('hall', 'west', { kind: 'window', center: -5, width: 1.6, bottom: 1, top: 3, blossoms: true, dressing: 'shutters' })
add('hall', 'east', { kind: 'window', center: -5, width: 1.6, bottom: 1, top: 3, blossoms: true, dressing: 'shutters' })
add('work', 'west', { kind: 'window', center: 2, width: 2, bottom: 1, top: 3, blossoms: true, dressing: 'curtains' })
add('music', 'east', { kind: 'window', center: 2, width: 2, bottom: 1, top: 3, dressing: 'curtains' })
add('poetry', 'north', { kind: 'window', center: 0, width: 2.6, bottom: 0.6, top: 3.4, blossoms: true, dressing: 'curtains' })

/** One box of wall, described by where it runs along its wall and how high. */
export type WallPiece = {
  room: RoomId
  side: Side
  position: [number, number, number]
  size: [number, number, number]
  /** The y range, kept for working out dado tiles and collisions. */
  y0: number
  y1: number
}

/**
 * Where a side's wall slab runs. North/south walls run the full width; east/west
 * walls stop short of the corners so the boxes don't overlap and flicker.
 */
export function wallLine(room: RoomPlan, side: Side) {
  switch (side) {
    case 'north':
      return { axis: 'x' as const, from: room.x0, to: room.x1, depth: [room.z0, room.z0 + WALL] as const }
    case 'south':
      return { axis: 'x' as const, from: room.x0, to: room.x1, depth: [room.z1 - WALL, room.z1] as const }
    case 'west':
      return { axis: 'z' as const, from: room.z0 + WALL, to: room.z1 - WALL, depth: [room.x0, room.x0 + WALL] as const }
    case 'east':
      return { axis: 'z' as const, from: room.z0 + WALL, to: room.z1 - WALL, depth: [room.x1 - WALL, room.x1] as const }
  }
}

/** Inner face of a wall: its coordinate, and which way is "into the room". */
export function innerFace(room: RoomPlan, side: Side) {
  switch (side) {
    case 'north':
      return { coord: room.z0 + WALL, normal: [0, 0, 1] as const }
    case 'south':
      return { coord: room.z1 - WALL, normal: [0, 0, -1] as const }
    case 'west':
      return { coord: room.x0 + WALL, normal: [1, 0, 0] as const }
    case 'east':
      return { coord: room.x1 - WALL, normal: [-1, 0, 0] as const }
  }
}

const SIDES: Side[] = ['north', 'south', 'east', 'west']

/** Cut one room's walls into boxes around its doors and windows. */
export function buildWallPieces(room: RoomPlan): WallPiece[] {
  const pieces: WallPiece[] = []

  for (const side of SIDES) {
    const line = wallLine(room, side)
    const holes = [...(openings[room.id][side] ?? [])].sort((a, b) => a.center - b.center)

    const push = (a0: number, a1: number, y0: number, y1: number) => {
      if (a1 - a0 < 0.001 || y1 - y0 < 0.001) return
      const [d0, d1] = line.depth
      const along = (a0 + a1) / 2
      const across = (d0 + d1) / 2
      const length = a1 - a0
      const thick = d1 - d0
      pieces.push({
        room: room.id,
        side,
        position: line.axis === 'x' ? [along, (y0 + y1) / 2, across] : [across, (y0 + y1) / 2, along],
        size: line.axis === 'x' ? [length, y1 - y0, thick] : [thick, y1 - y0, length],
        y0,
        y1,
      })
    }

    let cursor = line.from
    for (const hole of holes) {
      const left = hole.center - hole.width / 2
      const right = hole.center + hole.width / 2
      push(cursor, left, 0, CEILING) // solid wall up to the opening
      push(left, right, 0, hole.bottom) // under a window
      push(left, right, hole.top, CEILING) // above a door or window
      cursor = right
    }
    push(cursor, line.to, 0, CEILING)
  }
  return pieces
}

export const allWallPieces: WallPiece[] = Object.values(rooms).flatMap(buildWallPieces)

/** Walls you can bump into, seen from above. Lintels above head height are skipped. */
export function wallColliders(): Box2D[] {
  const boxes = allWallPieces
    .filter((p) => p.y0 < 1.8)
    .map((p) => boxFromCenter(p.position[0], p.position[2], p.size[0], p.size[2]))
  // The front door is closed, so its doorway is solid.
  const hall = rooms.hall
  boxes.push(boxFromCenter(0, hall.z1 - WALL / 2, 1.4, WALL))
  return boxes
}

/** Which room contains this point? Used for the room name and the room directory. */
export function roomAt(x: number, z: number): RoomId | null {
  for (const room of Object.values(rooms)) {
    if (x >= room.x0 && x <= room.x1 && z >= room.z0 && z <= room.z1) return room.id
  }
  return null
}

export const HOUSE_BOUNDS: Rect = {
  x0: Math.min(...Object.values(rooms).map((r) => r.x0)),
  x1: Math.max(...Object.values(rooms).map((r) => r.x1)),
  z0: Math.min(...Object.values(rooms).map((r) => r.z0)),
  z1: Math.max(...Object.values(rooms).map((r) => r.z1)),
}
