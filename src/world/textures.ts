import * as THREE from 'three'
import { palette } from './palette'

/**
 * Textures drawn in code with the browser's 2D canvas.
 *
 * Why draw them instead of downloading images? For a first milestone it means
 * no image files to find or license, and every pattern can be changed here in
 * a few lines. Later we can swap any of these for a photographed texture
 * without touching the room code, because rooms only ask for "the floor tile".
 *
 * Each texture is one tile. `RepeatWrapping` tells Three.js to repeat it across
 * a surface, and `repeat` says how many times.
 */

const cache = new Map<string, THREE.CanvasTexture>()

function makeTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const cached = cache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)

  const texture = new THREE.CanvasTexture(canvas)
  // Colours painted on a canvas are sRGB, so Three.js must be told; otherwise
  // they look washed out.
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8 // keeps the floor sharp when seen at a low angle
  cache.set(key, texture)
  return texture
}

/** A deterministic random generator, so textures look the same on every load. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Scatter faint specks so flat paint and tile look hand-made, not digital. */
function addGrain(ctx: CanvasRenderingContext2D, s: number, amount: number, seed: number) {
  const rand = seeded(seed)
  for (let i = 0; i < amount; i++) {
    const shade = rand() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${0.025 + rand() * 0.04})`
    const r = 0.5 + rand() * 1.8
    ctx.fillRect(rand() * s, rand() * s, r, r)
  }
}

/** One petal-shaped path from the centre outward, rotated by `angle`. */
function petal(ctx: CanvasRenderingContext2D, cx: number, cy: number, length: number, width: number, angle: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(width, -length * 0.55, 0, -length)
  ctx.quadraticCurveTo(-width, -length * 0.55, 0, 0)
  ctx.fill()
  ctx.restore()
}

/**
 * Floral cement floor tile: cream ground, a red-oxide four-petal flower in the
 * middle, and quarter-flowers in each corner that join up with the neighbouring
 * tiles into a second flower. Repeated, it makes a continuous floral carpet.
 */
export function floorTileTexture() {
  return makeTexture('floor', 512, (ctx, s) => {
    const c = s / 2
    ctx.fillStyle = '#EFE2C8'
    ctx.fillRect(0, 0, s, s)

    // Inner diamond band
    ctx.strokeStyle = palette.redOxide
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(c, s * 0.08)
    ctx.lineTo(s * 0.92, c)
    ctx.lineTo(c, s * 0.92)
    ctx.lineTo(s * 0.08, c)
    ctx.closePath()
    ctx.stroke()

    // Central flower: four big petals and four small ones between them
    ctx.fillStyle = palette.redOxide
    for (let i = 0; i < 4; i++) petal(ctx, c, c, s * 0.3, s * 0.12, (i * Math.PI) / 2)
    ctx.fillStyle = palette.shutterGreen
    for (let i = 0; i < 4; i++) petal(ctx, c, c, s * 0.18, s * 0.06, (i * Math.PI) / 2 + Math.PI / 4)
    ctx.fillStyle = palette.turmeric
    ctx.beginPath()
    ctx.arc(c, c, s * 0.045, 0, Math.PI * 2)
    ctx.fill()

    // Corner quarter-flowers (they meet the next tile's corners)
    const corners: Array<[number, number]> = [[0, 0], [s, 0], [0, s], [s, s]]
    for (const [x, y] of corners) {
      ctx.fillStyle = palette.turmeric
      for (let i = 0; i < 4; i++) petal(ctx, x, y, s * 0.16, s * 0.07, (i * Math.PI) / 2 + Math.PI / 4)
      ctx.fillStyle = palette.redOxide
      ctx.beginPath()
      ctx.arc(x, y, s * 0.04, 0, Math.PI * 2)
      ctx.fill()
    }

    // Grout line
    ctx.strokeStyle = 'rgba(80,40,20,0.35)'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, s, s)

    addGrain(ctx, s, 5000, 7)
  })
}

/**
 * Blue-and-white azulejo tile with an eight-petal rosette. Used as a dado: the
 * band of tiles along the lower part of a wall.
 */
export function azulejoTexture() {
  return makeTexture('azulejo', 256, (ctx, s) => {
    const c = s / 2
    ctx.fillStyle = '#F7F3EA'
    ctx.fillRect(0, 0, s, s)

    ctx.fillStyle = palette.azulejoBlue
    for (let i = 0; i < 8; i++) petal(ctx, c, c, s * 0.36, s * 0.1, (i * Math.PI) / 4)
    ctx.fillStyle = '#F7F3EA'
    ctx.beginPath()
    ctx.arc(c, c, s * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.azulejoBlue
    ctx.beginPath()
    ctx.arc(c, c, s * 0.04, 0, Math.PI * 2)
    ctx.fill()

    // Corner leaves, forming a small four-leaf motif where four tiles meet
    for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]] as Array<[number, number]>) {
      for (let i = 0; i < 4; i++) petal(ctx, x, y, s * 0.14, s * 0.05, (i * Math.PI) / 2 + Math.PI / 4)
    }

    ctx.strokeStyle = 'rgba(30,78,156,0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, s - 2, s - 2)
    addGrain(ctx, s, 1500, 11)
  })
}

/**
 * Lime plaster: a near-white mottled texture. A material multiplies its colour
 * by its texture, so `color="turmeric"` + this map gives uneven turmeric paint.
 */
export function plasterTexture() {
  return makeTexture('plaster', 512, (ctx, s) => {
    ctx.fillStyle = '#F2F2F2'
    ctx.fillRect(0, 0, s, s)
    const rand = seeded(3)
    // Large soft blotches: the uneven brush strokes of lime-wash
    for (let i = 0; i < 260; i++) {
      const x = rand() * s
      const y = rand() * s
      const r = 20 + rand() * 70
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const light = rand() > 0.5
      g.addColorStop(0, light ? 'rgba(255,255,255,0.12)' : 'rgba(150,140,130,0.045)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    addGrain(ctx, s, 9000, 5)
  })
}

/** Teak wood grain for doors, frames and shutters. */
export function woodTexture() {
  return makeTexture('wood', 256, (ctx, s) => {
    ctx.fillStyle = '#E9E2DA'
    ctx.fillRect(0, 0, s, s)
    const rand = seeded(19)
    for (let i = 0; i < 70; i++) {
      const x = rand() * s
      ctx.strokeStyle = `rgba(60,35,20,${0.05 + rand() * 0.12})`
      ctx.lineWidth = 0.5 + rand() * 2.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + rand() * 8 - 4, s * 0.33, x + rand() * 8 - 4, s * 0.66, x, s)
      ctx.stroke()
    }
  })
}

/**
 * A copy of a texture with its own repeat count. The copy shares the same
 * image on the GPU, so it is cheap; it only lets a 6m wall and a 2m wall
 * tile the same pattern at the same physical size.
 */
export function repeated(texture: THREE.Texture, x: number, y: number) {
  const copy = texture.clone()
  copy.repeat.set(x, y)
  copy.needsUpdate = true
  return copy
}
