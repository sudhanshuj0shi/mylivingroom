import { palette } from './palette'

/**
 * Two lights for the whole house (each room adds its own soft bounce light,
 * and lamps add their own).
 *
 * 1. The sun: a directional light. Its rays are parallel, like real sunlight,
 *    so only its direction matters. It comes from the north-west and high up,
 *    so it shines in through the north window of the poetry room and the
 *    west windows of the hall and the work room. It is the only light that
 *    casts shadows, because shadows are the most expensive thing we draw.
 *
 * 2. A hemisphere light: soft light from above (warm sky colour) and below
 *    (terracotta, as if bounced off the floor). It stops shadowed areas going
 *    black, the way real rooms are lit by light bouncing around.
 */
export function Lighting() {
  return (
    <>
      <directionalLight
        color={palette.sun}
        intensity={4.2}
        // Aimed at the origin (the default target) from the north-west, high up.
        position={[-8, 12, -14]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        // The shadow camera is the box of space where shadows are calculated.
        // It needs to cover the whole house, and not much more.
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <hemisphereLight args={[palette.skyFill, palette.groundFill, 2.1]} />
    </>
  )
}
