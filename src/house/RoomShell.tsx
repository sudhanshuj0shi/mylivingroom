import { useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../world/palette'
import {
  azulejoTexture,
  checkerTexture,
  floorTileTexture,
  plasterTexture,
  redOxideTexture,
  repeated,
  teakFloorTexture,
  woodTexture,
} from '../world/textures'
import { BlossomCluster } from '../entities/Bougainvillea/BlossomCluster'
import { Curtain } from '../entities/Curtain'
import { DriftingPetals } from '../entities/DriftingPetals'
import { Shutter } from '../entities/Shutter'
import { WIND_DIRECTION } from '../systems/wind/wind'
import { CEILING, WALL, buildWallPieces, innerFace, openings, type FloorKind, type Opening, type RoomPlan, type Side, type WallPiece } from './plan'
import { wallFrame } from './wallFrame'

/**
 * Builds any room from its plan: floor, ceiling, painted walls, door and
 * window frames, curtains or shutters, and bougainvillea outside the windows.
 * Furniture lives in each room's own component (rooms/<name>/), which keeps
 * this file about architecture only.
 */
export function RoomShell({ room }: { room: RoomPlan }) {
  const pieces = useMemo(() => buildWallPieces(room), [room])
  const sides = Object.entries(openings[room.id]) as Array<[Side, Opening[]]>

  return (
    <group>
      <Floor room={room} />
      <Ceiling room={room} />
      {pieces.map((piece, i) => (
        <Wall key={i} piece={piece} colour={room.wall} />
      ))}
      {room.dado && pieces.filter((p) => p.y0 === 0).map((p, i) => <Dado key={i} room={room} piece={p} />)}
      {room.beams && <Beams room={room} />}
      {sides.flatMap(([side, list]) =>
        list.map((opening, i) =>
          opening.kind === 'window' ? (
            <Window key={`${side}${i}`} room={room} side={side} opening={opening} />
          ) : (
            <DoorTrim key={`${side}${i}`} room={room} side={side} opening={opening} />
          ),
        ),
      )}
      {/* Warm light bouncing around the room, so corners aren't black. No shadows: they're expensive. */}
      <pointLight
        color="#FFCF96"
        intensity={10}
        distance={11}
        decay={2}
        position={[(room.x0 + room.x1) / 2, CEILING - 0.6, (room.z0 + room.z1) / 2]}
      />
    </group>
  )
}

/** Tile size in metres for each floor, so patterns are the same real size everywhere. */
const FLOOR_TEXTURES: Record<FloorKind, { texture: () => THREE.Texture; tile: number; roughness: number }> = {
  floral: { texture: floorTileTexture, tile: 0.5, roughness: 0.55 },
  teak: { texture: teakFloorTexture, tile: 1.6, roughness: 0.6 },
  checker: { texture: checkerTexture, tile: 0.6, roughness: 0.35 },
  redOxide: { texture: redOxideTexture, tile: 3, roughness: 0.3 },
}

function Floor({ room }: { room: RoomPlan }) {
  const width = room.x1 - room.x0
  const depth = room.z1 - room.z0
  const spec = FLOOR_TEXTURES[room.floor]
  const map = useMemo(() => repeated(spec.texture(), width / spec.tile, depth / spec.tile), [spec, width, depth])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(room.x0 + room.x1) / 2, 0, (room.z0 + room.z1) / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={map} roughness={spec.roughness} />
    </mesh>
  )
}

function Ceiling({ room }: { room: RoomPlan }) {
  // A thin box, not a plane, so it blocks sunlight from above.
  return (
    <mesh position={[(room.x0 + room.x1) / 2, CEILING + 0.1, (room.z0 + room.z1) / 2]} castShadow receiveShadow>
      <boxGeometry args={[room.x1 - room.x0, 0.2, room.z1 - room.z0]} />
      <meshStandardMaterial color={palette.limeWhite} roughness={1} />
    </mesh>
  )
}

function Wall({ piece, colour }: { piece: WallPiece; colour: string }) {
  const [sx, sy, sz] = piece.size
  const map = useMemo(() => repeated(plasterTexture(), Math.max(sx, sz) / 2, sy / 2), [sx, sy, sz])
  return (
    <mesh position={piece.position} castShadow receiveShadow>
      <boxGeometry args={piece.size} />
      <meshStandardMaterial color={colour} map={map} roughness={0.95} />
    </mesh>
  )
}

const DADO_HEIGHT = 1.1
const AZULEJO_TILE = 0.22

/** Azulejo tiles on the lower part of one wall piece, topped by a white moulding. */
function Dado({ room, piece }: { room: RoomPlan; piece: WallPiece }) {
  const length = piece.side === 'north' || piece.side === 'south' ? piece.size[0] : piece.size[2]
  const height = Math.min(DADO_HEIGHT, piece.y1)
  const along = piece.side === 'north' || piece.side === 'south' ? piece.position[0] : piece.position[2]
  const map = useMemo(() => repeated(azulejoTexture(), length / AZULEJO_TILE, height / AZULEJO_TILE), [length, height])
  const { position, rotationY } = wallFrame(room, piece.side, along, 0, 0.004)
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial map={map} roughness={0.25} />
      </mesh>
      {height === DADO_HEIGHT && (
        <mesh position={[0, height + 0.03, 0.02]} castShadow>
          <boxGeometry args={[length, 0.06, 0.05]} />
          <meshStandardMaterial color={palette.limeWhite} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

/** Teak beams across the shorter span of the room, about every 2m. */
function Beams({ room }: { room: RoomPlan }) {
  const width = room.x1 - room.x0
  const depth = room.z1 - room.z0
  const acrossX = width <= depth // beams span the short way, like real joists
  const span = acrossX ? depth : width
  const count = Math.max(1, Math.round(span / 2))
  const map = useMemo(() => repeated(woodTexture(), 1, 4), [])
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const offset = -span / 2 + ((i + 0.5) * span) / count
        const cx = (room.x0 + room.x1) / 2
        const cz = (room.z0 + room.z1) / 2
        return (
          <mesh
            key={i}
            position={acrossX ? [cx, CEILING - 0.11, cz + offset] : [cx + offset, CEILING - 0.11, cz]}
            castShadow
          >
            <boxGeometry args={acrossX ? [width, 0.22, 0.18] : [0.18, 0.22, depth]} />
            <meshStandardMaterial color={palette.teak} map={map} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

const trimMaterial = new THREE.MeshStandardMaterial({ color: palette.limeWhite, roughness: 0.8 })

/** White painted surround on a doorway, on this room's side. */
function DoorTrim({ room, side, opening }: { room: RoomPlan; side: Side; opening: Opening }) {
  const { position, rotationY } = wallFrame(room, side, opening.center, 0, 0.02)
  const half = opening.width / 2
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (half + 0.07), opening.top / 2, 0]} material={trimMaterial} castShadow>
          <boxGeometry args={[0.14, opening.top, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, opening.top + 0.08, 0]} material={trimMaterial} castShadow>
        <boxGeometry args={[opening.width + 0.42, 0.16, 0.05]} />
      </mesh>
    </group>
  )
}

function Window({ room, side, opening }: { room: RoomPlan; side: Side; opening: Opening }) {
  const { position, rotationY } = wallFrame(room, side, opening.center)
  const half = opening.width / 2
  const height = opening.top - opening.bottom
  const midY = (opening.top + opening.bottom) / 2
  const rodY = opening.top + 0.28
  const seed = Math.round(opening.center * 13 + room.x0 * 7)
  // Outside is on the other side of the wall: negative local Z.
  const outside = -(WALL + 0.55)

  return (
    <group>
      <group position={position} rotation={[0, rotationY, 0]}>
        {/* Frame and deep sill */}
        <mesh position={[0, opening.top + 0.06, 0.03]} material={trimMaterial} castShadow>
          <boxGeometry args={[opening.width + 0.24, 0.12, 0.08]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (half + 0.06), midY, 0.03]} material={trimMaterial} castShadow>
            <boxGeometry args={[0.12, height, 0.08]} />
          </mesh>
        ))}
        <mesh position={[0, opening.bottom - 0.03, 0.04]} material={trimMaterial} castShadow receiveShadow>
          <boxGeometry args={[opening.width + 0.3, 0.06, 0.3]} />
        </mesh>

        {opening.dressing === 'shutters' && (
          <>
            <Shutter hinge={[-half, midY, 0]} side="left" width={half} height={height} />
            <Shutter hinge={[half, midY, 0]} side="right" width={half} height={height} />
          </>
        )}

        {opening.dressing === 'curtains' && (
          <>
            {/* Brass rod */}
            <mesh position={[0, rodY, 0.1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, opening.width + 1.1, 8]} />
              <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.35} />
            </mesh>
            <Curtain position={[-half - 0.05, rodY, 0.1]} rotationY={0} width={0.85} height={rodY - 0.04} seed={seed} />
            <Curtain position={[half + 0.05, rodY, 0.1]} rotationY={0} width={0.85} height={rodY - 0.04} seed={seed + 1} />
          </>
        )}

        {/* A small red-tiled awning outside, typical of Goan windows; the bougainvillea hangs from it. */}
        <group position={[0, opening.top + 0.32, -(WALL + 0.36)]} rotation={[-0.35, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[opening.width + 0.7, 0.05, 0.75]} />
            <meshStandardMaterial color={palette.redOxide} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <boxGeometry args={[opening.width + 0.66, 0.01, 0.72]} />
            <meshStandardMaterial color={palette.limeWhite} roughness={1} />
          </mesh>
        </group>

        {opening.blossoms && (
          <>
            <BlossomCluster position={[-half * 0.75, opening.top - 0.35, outside]} radius={0.42} count={170} seed={seed + 21} />
            <BlossomCluster position={[half * 0.15, opening.top - 0.2, outside - 0.1]} radius={0.38} count={150} seed={seed + 22} />
            <BlossomCluster position={[half * 0.85, opening.top - 0.5, outside + 0.05]} radius={0.4} count={170} seed={seed + 23} />
            <BlossomCluster position={[half * 0.9, opening.bottom + 0.25, outside]} radius={0.34} count={120} seed={seed + 24} />
          </>
        )}
      </group>
      {opening.blossoms && <PetalsThroughWindow room={room} side={side} opening={opening} />}
    </group>
  )
}

/** Petals blown in through a window, drifting across the near half of the room. */
function PetalsThroughWindow({ room, side, opening }: { room: RoomPlan; side: Side; opening: Opening }) {
  // Only windows the breeze blows *into* get petals; on the leeward side they'd fly out.
  const normal = innerFace(room, side).normal
  if (normal[0] * WIND_DIRECTION[0] + normal[2] * WIND_DIRECTION[1] < 0.2) return null
  const a = wallFrame(room, side, opening.center - opening.width, 0.02, -0.6).position
  const b = wallFrame(room, side, opening.center + opening.width, opening.top, 3).position
  const min: [number, number, number] = [Math.min(a[0], b[0]), 0.02, Math.min(a[2], b[2])]
  const max: [number, number, number] = [Math.max(a[0], b[0]), opening.top, Math.max(a[2], b[2])]
  return <DriftingPetals min={min} max={max} count={28} seed={Math.round(opening.center * 3 + room.z0)} />
}
