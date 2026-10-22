import { describe, expect, it } from 'vitest'
import { boxFromCenter, circleHitsBox, moveWithCollision } from './collision'

// A wall running along X, 1m in front of the player (at z = -1), 0.2m thick.
const wall = boxFromCenter(0, -1, 10, 0.2)
const radius = 0.3

describe('circleHitsBox', () => {
  it('detects overlap only within the radius', () => {
    expect(circleHitsBox(0, -0.5, radius, wall)).toBe(false) // 0.4m from the wall face
    expect(circleHitsBox(0, -0.7, radius, wall)).toBe(true) // 0.2m from the wall face
  })
})

describe('moveWithCollision', () => {
  it('moves freely in open space', () => {
    expect(moveWithCollision(0, 0, 0.1, 0.1, radius, [wall])).toEqual({ x: 0.1, z: 0.1 })
  })

  it('stops at a wall', () => {
    const result = moveWithCollision(0, -0.55, 0, -0.1, radius, [wall])
    expect(result.z).toBe(-0.55)
  })

  it('slides along a wall when walking into it at an angle', () => {
    const result = moveWithCollision(0, -0.55, 0.1, -0.1, radius, [wall])
    expect(result).toEqual({ x: 0.1, z: -0.55 })
  })

  it('never ends up inside a wall, even after many steps', () => {
    let pos = { x: 0, z: 0 }
    for (let i = 0; i < 200; i++) pos = moveWithCollision(pos.x, pos.z, 0, -0.06, radius, [wall])
    expect(circleHitsBox(pos.x, pos.z, radius, wall)).toBe(false)
  })
})
