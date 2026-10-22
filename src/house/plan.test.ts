import { describe, expect, it } from 'vitest'
import { moveWithCollision } from '../systems/collision/collision'
import { buildWallPieces, openings, roomAt, rooms, wallColliders } from './plan'

const colliders = wallColliders()
const RADIUS = 0.3

/** Walk in a straight line in small steps, like the player does, and return where you end up. */
function walk(from: [number, number], to: [number, number], steps = 400) {
  let x = from[0]
  let z = from[1]
  const dx = (to[0] - from[0]) / steps
  const dz = (to[1] - from[1]) / steps
  for (let i = 0; i < steps; i++) ({ x, z } = moveWithCollision(x, z, dx, dz, RADIUS, colliders))
  return { x, z }
}

describe('floor plan', () => {
  it('cuts each doorway into both rooms at the same place', () => {
    const hallWest = openings.hall.west!.find((o) => o.kind === 'doorway')!
    const workEast = openings.work.east!.find((o) => o.kind === 'doorway')!
    expect(hallWest).toBe(workEast)
  })

  it('leaves a gap in the wall pieces where a doorway is', () => {
    const pieces = buildWallPieces(rooms.hall).filter((p) => p.side === 'west' && p.y0 === 0)
    // No floor-level piece of the hall's west wall covers z = 2 (the work room doorway).
    const blocking = pieces.filter((p) => Math.abs(p.position[2] - 2) < p.size[2] / 2)
    expect(blocking).toHaveLength(0)
  })

  it('lets you walk from the hall into every room through its doorway', () => {
    expect(roomAt(...Object.values(walk([0, 2], [-4, 2])) as [number, number])).toBe('work')
    expect(roomAt(...Object.values(walk([0, 2], [4, 2])) as [number, number])).toBe('music')
    expect(roomAt(...Object.values(walk([0, -6], [0, -11])) as [number, number])).toBe('poetry')
  })

  it('stops you walking through a solid wall between rooms', () => {
    const end = walk([0, 4.5], [-4, 4.5])
    expect(roomAt(end.x, end.z)).toBe('hall')
  })

  it('keeps the front door shut', () => {
    const end = walk([0, 3], [0, 9])
    expect(end.z).toBeLessThan(rooms.hall.z1)
  })
})
