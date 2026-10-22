# My Living Room

A walkable Portuguese-Goan house that is also my portfolio. Visitors walk through
the rooms to find my engineering work, my poems and the music I love.

**Status: Milestone 1, one walkable room.** The entrance room has turmeric walls, a
floral tile floor, an azulejo dado, teak beams, a sunlit window with green shutters,
and bougainvillea inside and out.

## Run it

```bash
npm install
npm run dev      # then open the URL it prints (usually http://localhost:5173)
```

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the collision tests |
| `npm run typecheck` | Checks TypeScript types |
| `npm run build` | Type-checks, then builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally |

## Check that Milestone 1 works

1. The welcome card appears over a blurred view of the room.
2. Click **Enter the house**. The cursor disappears and a small dot appears in the middle.
3. Move the mouse to look around. WASD or the arrow keys walk; Shift walks faster.
4. Walk into each wall, the bench, the flower pots and the front door. You should stop
   or slide along them, never pass through.
5. Walk up to the window: sunlight falls through it onto the floor, and bougainvillea
   hangs outside.
6. Press **Esc**. The mouse is released and the card returns as "Take your time."
   Click **Step back in** to continue.

Phones and tablets show a note instead of the Enter button. A touch-friendly mode is a
later milestone.

## How the code is organised

```
src/
  app/App.tsx                    Page: the 3D canvas plus HTML overlays
  world/
    HouseScene.tsx               Everything inside the 3D world
    Player.tsx                   First-person camera, walking, mouse look
    Lighting.tsx                 Sun, sky fill and bounce light
    palette.ts                   Every colour in the house
    textures.ts                  Floor tiles, azulejo, plaster and wood, drawn in code
  rooms/hallway/
    layout.ts                    The room as data: size, walls, window, door, furniture
    Hallway.tsx                  Draws the room from that data
  entities/Bougainvillea/        Flowering bushes, reusable in any room
  systems/
    collision/collision.ts       Circle-vs-box collision with sliding (+ tests)
    movement/useKeyboard.ts      Which keys are held down
  components/ui/                 HTML overlays: welcome/pause card, controls hint
  styles/global.css
```

Every file starts with a comment explaining what it does and why.

## Concepts used so far

- **Coordinates.** 1 unit = 1 metre. Y is up and the floor is at y = 0. The window wall
  is at -Z and the front door at +Z.
- **Mesh = geometry + material.** A wall is a box shape with a turmeric plaster surface.
- **Lights.** One directional "sun" casts the only shadows. A hemisphere light fakes
  light bouncing around the room.
- **The render loop.** `useFrame` runs every frame. Movement is multiplied by `delta`,
  the seconds since the last frame, so walking speed is the same on any screen.
- **Collision.** Seen from above, the player is a circle and every obstacle is a box.
  The X and Z parts of each step are tested separately, which is what lets you slide
  along walls.
- **Instancing.** The ~150 flowers on each bush are drawn in one GPU call with an
  `InstancedMesh`.

## Tuning

- Walking feel: the `PLAYER` values in `src/world/Player.tsx`.
- Colours: `src/world/palette.ts`.
- Sun direction and brightness: `src/world/Lighting.tsx`.
