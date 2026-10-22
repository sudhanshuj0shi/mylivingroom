import { palette } from './palette'

/**
 * Three lights, each with one job.
 *
 * 1. The sun: a directional light. Its rays are parallel, like real sunlight,
 *    so only its direction matters. It is the only light that casts shadows,
 *    because shadows are the most expensive thing we draw. Placed outside the
 *    north window and aimed at the floor, the walls block it everywhere except
 *    the window, which is what paints the bright patch on the tiles.
 *
 * 2. A hemisphere light: soft light from above (warm sky colour) and below
 *    (terracotta, as if bounced off the red floor). It stops shadowed areas
 *    from going black, the way real rooms are lit by light bouncing around.
 *
 * 3. A dim point light high in the room for a little extra warm bounce.
 *
 * Later we can "bake" this lighting into textures in Blender for richer
 * results; for now real-time lights are easier to experiment with.
 */
export function Lighting() {
  return (
    <>
      <directionalLight
        color={palette.sun}
        intensity={4.2}
        position={[1.5, 7, -10]}
        castShadow
        // A bigger shadow map means sharper shadows; 2048 is a good balance.
        shadow-mapSize={[2048, 2048]}
        // The shadow camera is the box of space where shadows are calculated.
        // It only needs to cover the room.
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <hemisphereLight args={[palette.skyFill, palette.groundFill, 1.9]} />
      <pointLight color="#FFC98A" intensity={9} distance={10} decay={2} position={[0, 3.4, 0.5]} />
    </>
  )
}
