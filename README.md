# My Living Room

A walkable Portuguese-Goan house that is also my portfolio. Visitors walk through
the rooms to find my engineering work, my poems and the music I love.

**Status: Milestone 2, the walkable house.**

- A long turmeric hall with a floral tile floor, azulejo dado, teak beams and shuttered windows.
- Three rooms off it:
  - Work room: cobalt walls, teak floor, desk, laptop and bookshelf.
  - Music room: teal walls, chequered floor, turntable, speakers, rug and record crate.
  - Poetry room: rose walls, red-oxide floor, a big window and one armchair.
- A garden of coconut palms outside every window.
- A breeze that moves everything at once: long sheer curtains billow, bougainvillea
  sways, petals blow in through the windward windows, and palms nod.
- Background music and wind sound, generated live in the browser (no audio files).
  The wind sound swells with the same gusts you see.
- Press **E** (or click) on the note, the laptop and the turntable.
- Press **R** for the room directory, a small floor plan you can jump from.

## Run it

```bash
npm install
npm run dev      # then open the URL it prints (usually http://localhost:5173)
```

| Command | What it does |
|---|---|
| `npm test` | Runs the collision and floor-plan tests |
| `npm run typecheck` | Checks TypeScript types |
| `npm run build` | Type-checks, then builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally |

In development, open the browser console and use `__house.get()` to see the shared
state, or `__house.set({ panel: 'note' })` to change it. This isn't in the production
build.

## Check that Milestone 2 works

1. Click **Enter the house**. You should hear soft music and wind; untick the sound
   option on the welcome card first if you'd rather not.
2. Walk down the hall. Each doorway shows the room's name at the top as you step in.
3. Walk into walls, furniture and the front door. You should stop or slide along them.
4. Face the note on the bench, the laptop or the turntable. A prompt appears; press **E**.
   The note and laptop open a panel; **Back to the house** returns you to walking.
5. The turntable starts and stops the music, and the record spins while it plays.
6. Press **R**, pick a room, and you're taken there. **M** or the button at the bottom
   right mutes. **Esc** pauses.
7. Watch the curtains in the work and poetry rooms for a minute. Gusts come and go,
   and the wind sound rises with them.

If your system is set to reduce motion, the breeze is much stiller.

## How the code is organised

```
src/
  app/                  The page, keyboard shortcuts, panel and room navigation
  house/
    plan.ts             THE FLOOR PLAN: rooms, doorways, windows, as data (+ tests)
    RoomShell.tsx       Builds any room's walls, floor, ceiling, windows from the plan
    wallFrame.ts        "1m along this wall, 2m up" → world position
  rooms/<room>/         Each room's furniture, and the collision boxes for it
  entities/             Reusable things: bougainvillea, curtains, petals, palms, doors
  systems/
    collision/          Circle-vs-box collision with sliding (+ tests)
    movement/           Keyboard input, drag-to-look fallback
    interaction/        "Press E to …": what you're near and facing
    wind/               The one breeze everything follows
    audio/              Generated music and wind; mute and music controls
  state/houseStore.ts   Small shared store (which room, prompt, panel, sound)
  content/              Words you'll edit: rooms, panel text, projects
  world/                Scene, player, lights, garden, colours, textures
```

## Concepts added in Milestone 2

- **Plan as data.** `house/plan.ts` describes rooms and openings. Walls, collisions,
  the minimap and the tests all come from it, so adding a room or moving a door is an
  edit in one place.
- **Shared walls.** Each room builds its walls inside its own rectangle. Where rooms
  meet, two thin walls sit back to back, each painted its own room's colour.
- **Moving vertices.** Curtains are a grid of points pushed every frame by the wind,
  more at the hem than at the rod.
- **One wind function.** `systems/wind/wind.ts` adds a few slow sine waves together.
  Visuals and audio read it at the same moment, so a gust arrives everywhere at once.
- **A store outside React.** The render loop writes to it every frame without
  re-rendering React. Components subscribe to just the value they show.
- **Web Audio.** Oscillators, filters, an echo and a reverb, scheduled on the audio
  clock. Sound starts only after a click, as browsers require.

## Edit the content

- Room names and descriptions: `src/content/rooms.ts`
- The note and laptop text: `src/content/panels.ts`
- Projects (placeholders): `src/content/projects.ts`
- Colours: `src/world/palette.ts`
- Walking feel: `PLAYER` in `src/world/Player.tsx`
- Breeze strength and rhythm: `src/systems/wind/wind.ts`
- Music chords, scale and volume: `src/systems/audio/ambience.ts`
