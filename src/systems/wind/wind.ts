/**
 * The breeze. One function, used by everything that moves in the wind:
 * curtains, flowers, petals, palm trees and the wind you hear.
 *
 * Because they all ask the same function at the same moment, a gust arrives
 * everywhere together: the curtains lift, the bougainvillea leans and the
 * wind sound swells at once. That shared timing is most of what makes it feel
 * like one breeze rather than lots of separate wobbling animations.
 *
 * Strength is built from a few slow sine waves at unrelated speeds. Added
 * together they rarely line up, so the pattern never visibly repeats, and
 * every so often they peak together into a stronger gust.
 */

/** Seconds since the page loaded. Shared by visuals and audio so gusts line up. */
export function windTime() {
  return performance.now() / 1000
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Visitors who ask their system for less motion get a much stiller breeze. */
export const MOTION_SCALE = reducedMotion ? 0.15 : 1

/** Wind strength at time t, from about 0.15 (a still moment) to 1 (a gust). */
export function windStrength(t: number) {
  const slow = Math.sin(t * 0.09) * 0.5 + 0.5 // a calm or breezy minute
  const mid = Math.sin(t * 0.31 + 1.7) * 0.5 + 0.5 // swells every ~20s
  const quick = Math.sin(t * 0.83 + 0.4) * 0.5 + 0.5 // small puffs
  const gust = Math.pow(mid * slow, 2) // only strong when both line up
  return Math.min(1, 0.15 + slow * 0.25 + quick * 0.12 + gust * 0.55)
}

/**
 * The way the breeze blows, as a flat (x, z) direction. It comes from the
 * north-west, the same side as the sun, in through the windows.
 */
export const WIND_DIRECTION: [number, number] = [0.55, 0.835]
