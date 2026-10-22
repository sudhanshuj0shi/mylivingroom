/**
 * Collision, kept deliberately simple.
 *
 * The house is made of rectangular rooms, so we don't need a physics engine.
 * We look at the world from above (the X/Z plane, ignoring height):
 *   - every wall or piece of furniture is a rectangle, an "AABB"
 *     (axis-aligned bounding box: a box whose sides line up with X and Z);
 *   - the player is a circle with a radius, like a person's shoulders.
 *
 * Each frame the player wants to move from where they are by some amount.
 * We try the X part of the move and the Z part separately. If moving along
 * X would push the circle into a box, we cancel only the X part. That is what
 * lets you slide along a wall when you walk into it at an angle, instead of
 * sticking to it.
 */

export type Box2D = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** A box from its centre and size, the way Three.js describes a mesh. */
export function boxFromCenter(x: number, z: number, width: number, depth: number): Box2D {
  return { minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 }
}

/** Does a circle at (x, z) with this radius overlap the box? */
export function circleHitsBox(x: number, z: number, radius: number, box: Box2D): boolean {
  // Find the point on the box closest to the circle's centre...
  const closestX = Math.max(box.minX, Math.min(x, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ))
  // ...and check whether it is within the radius.
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz < radius * radius
}

function hitsAny(x: number, z: number, radius: number, boxes: readonly Box2D[]) {
  return boxes.some((box) => circleHitsBox(x, z, radius, box))
}

/**
 * Move from (x, z) by (dx, dz), stopping at boxes and sliding along them.
 * Returns the position the player actually ends up at.
 */
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  boxes: readonly Box2D[],
): { x: number; z: number } {
  let nextX = x + dx
  if (hitsAny(nextX, z, radius, boxes)) nextX = x

  let nextZ = z + dz
  if (hitsAny(nextX, nextZ, radius, boxes)) nextZ = z

  return { x: nextX, z: nextZ }
}
