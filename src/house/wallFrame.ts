import { innerFace, type RoomPlan, type Side } from './plan'

/**
 * Turns "a point on this wall" into world coordinates.
 *
 * Doors, windows, curtains and trims are easiest to describe relative to the
 * wall they sit on: "1.2m along the wall, 2m up, 5cm out from its face". This
 * returns a position and a Y rotation for a group. Inside that group,
 *   - local X runs along the wall,
 *   - local Y is up,
 *   - local +Z points into the room.
 * so the same window code works on every wall of every room.
 */
export function wallFrame(room: RoomPlan, side: Side, along: number, y = 0, out = 0) {
  const face = innerFace(room, side)
  const [nx, , nz] = face.normal
  const position: [number, number, number] =
    side === 'north' || side === 'south'
      ? [along, y, face.coord + nz * out]
      : [face.coord + nx * out, y, along]
  // Rotate a group whose front faces +Z so that its front faces the room.
  const rotationY = Math.atan2(nx, nz)
  return { position, rotationY }
}
