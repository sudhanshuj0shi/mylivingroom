import { useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../../world/palette'
import { azulejoTexture, floorTileTexture, plasterTexture, repeated, woodTexture } from '../../world/textures'
import { FlowerPot } from '../../entities/Bougainvillea/FlowerPot'
import { BlossomCluster } from '../../entities/Bougainvillea/BlossomCluster'
import { DOOR, ROOM, WINDOW, furniture, walls } from './layout'

const halfW = ROOM.width / 2
const halfD = ROOM.depth / 2

/** Size of one floor tile and one azulejo tile, in metres. */
const FLOOR_TILE = 0.5
const AZULEJO_TILE = 0.22
const DADO_HEIGHT = 1.1

/**
 * The entrance room: turmeric walls, a floral tile floor, teak ceiling beams,
 * an open window with green shutters, and bougainvillea inside and out.
 *
 * Everything here is built from simple shapes (boxes, planes, cylinders).
 * A mesh is always a shape ("geometry") plus a surface ("material"); the
 * material decides colour, roughness and which texture is painted on it.
 */
export function Hallway() {
  return (
    <group>
      <Floor />
      <Ceiling />
      {walls.map((w) => (
        <Wall key={w.name} position={w.position} size={w.size} />
      ))}
      <Dado side="west" />
      <Dado side="east" />
      <Beams />
      <Window />
      <FrontDoor />
      <Bench />
      <FlowerPot position={furniture.potByWindow.position} seed={3} />
      <FlowerPot position={furniture.potByDoor.position} seed={8} />
    </group>
  )
}

function Floor() {
  const map = useMemo(() => repeated(floorTileTexture(), ROOM.width / FLOOR_TILE, ROOM.depth / FLOOR_TILE), [])
  // A plane is created standing up (facing +Z); rotating it -90° around X lays it flat.
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM.width, ROOM.depth]} />
      <meshStandardMaterial map={map} roughness={0.55} />
    </mesh>
  )
}

function Ceiling() {
  // A thin box rather than a flat plane, so it blocks the sun from above (planes
  // only cast shadows from one side, which let sunlight leak onto the walls).
  return (
    <mesh position={[0, ROOM.height + 0.1, 0]} castShadow receiveShadow>
      <boxGeometry args={[ROOM.width + 0.4, 0.2, ROOM.depth + 0.4]} />
      <meshStandardMaterial color={palette.limeWhite} roughness={1} />
    </mesh>
  )
}

function Wall({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  // Repeat the plaster roughly once every 2m so blotches stay the same size on every wall.
  const map = useMemo(() => repeated(plasterTexture(), Math.max(size[0], size[2]) / 2, size[1] / 2), [size])
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={palette.turmeric} map={map} roughness={0.95} />
    </mesh>
  )
}

/** A band of azulejo tiles along the lower part of a side wall, topped with a white moulding. */
function Dado({ side }: { side: 'west' | 'east' }) {
  const map = useMemo(() => repeated(azulejoTexture(), ROOM.depth / AZULEJO_TILE, DADO_HEIGHT / AZULEJO_TILE), [])
  const x = side === 'west' ? -halfW + 0.005 : halfW - 0.005
  // Turn the plane so its front faces into the room.
  const rotationY = side === 'west' ? Math.PI / 2 : -Math.PI / 2
  return (
    <group>
      <mesh position={[x, DADO_HEIGHT / 2, 0]} rotation={[0, rotationY, 0]} receiveShadow>
        <planeGeometry args={[ROOM.depth, DADO_HEIGHT]} />
        <meshStandardMaterial map={map} roughness={0.25} />
      </mesh>
      <mesh position={[side === 'west' ? -halfW + 0.03 : halfW - 0.03, DADO_HEIGHT + 0.03, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, ROOM.depth]} />
        <meshStandardMaterial color={palette.limeWhite} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Teak beams across the ceiling. */
function Beams() {
  const map = useMemo(() => repeated(woodTexture(), 1, 4), [])
  return (
    <group>
      {[-3, -1, 1, 3].map((z) => (
        <mesh key={z} position={[0, ROOM.height - 0.11, z]} castShadow>
          <boxGeometry args={[ROOM.width, 0.22, 0.18]} />
          <meshStandardMaterial color={palette.teak} map={map} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Window() {
  const z = -halfD
  const width = WINDOW.right - WINDOW.left
  const height = WINDOW.top - WINDOW.bottom
  const midY = (WINDOW.top + WINDOW.bottom) / 2
  const frame = <meshStandardMaterial color={palette.limeWhite} roughness={0.8} />

  return (
    <group>
      {/* White frame around the opening, a little proud of the wall */}
      <mesh position={[0, WINDOW.top + 0.06, z + 0.03]} castShadow>
        <boxGeometry args={[width + 0.24, 0.12, 0.08]} />
        {frame}
      </mesh>
      <mesh position={[WINDOW.left - 0.06, midY, z + 0.03]} castShadow>
        <boxGeometry args={[0.12, height, 0.08]} />
        {frame}
      </mesh>
      <mesh position={[WINDOW.right + 0.06, midY, z + 0.03]} castShadow>
        <boxGeometry args={[0.12, height, 0.08]} />
        {frame}
      </mesh>
      {/* Deep sill: Goan walls are thick, so window ledges are wide */}
      <mesh position={[0, WINDOW.bottom - 0.03, z + 0.08]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.3, 0.06, 0.3]} />
        {frame}
      </mesh>

      <Shutter hinge={[WINDOW.left, midY, z]} side="left" width={width / 2} height={height} />
      <Shutter hinge={[WINDOW.right, midY, z]} side="right" width={width / 2} height={height} />

      {/* Bougainvillea climbing over the outside of the window */}
      <BlossomCluster position={[-0.75, WINDOW.top - 0.35, z - 0.55]} radius={0.42} count={170} seed={21} />
      <BlossomCluster position={[0.15, WINDOW.top - 0.2, z - 0.65]} radius={0.38} count={150} seed={22} />
      <BlossomCluster position={[0.85, WINDOW.top - 0.5, z - 0.5]} radius={0.4} count={170} seed={23} />
      <BlossomCluster position={[0.9, WINDOW.bottom + 0.25, z - 0.55]} radius={0.34} count={120} seed={24} />
    </group>
  )
}

/**
 * A louvred shutter swung open into the room.
 *
 * The trick for hinges: put the shutter inside a group whose origin is the
 * hinge, offset the panel by half its width, then rotate the group. Rotating
 * a group spins its children around the group's origin, i.e. around the hinge.
 */
function Shutter({ hinge, side, width, height }: { hinge: [number, number, number]; side: 'left' | 'right'; width: number; height: number }) {
  const map = useMemo(() => repeated(woodTexture(), 1, 2), [])
  const direction = side === 'left' ? 1 : -1 // which way the closed panel extends from the hinge
  const openAngle = side === 'left' ? -2.8 : 2.8 // about 160°, nearly flat against the wall
  const material = <meshStandardMaterial color={palette.shutterGreen} map={map} roughness={0.7} />

  const slats = Array.from({ length: 9 }, (_, i) => -height / 2 + 0.25 + i * ((height - 0.5) / 8))

  return (
    <group position={hinge} rotation={[0, openAngle, 0]}>
      <group position={[(direction * width) / 2, 0, 0]}>
        {/* Outer frame of the shutter */}
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.03]} />
          {material}
        </mesh>
        {/* Louvres: thin slats tilted like real shutter blades */}
        {slats.map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[width - 0.14, 0.11, 0.015]} />
            {material}
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Teak double front door with raised panels and brass handles. */
function FrontDoor() {
  const map = useMemo(() => repeated(woodTexture(), 1, 3), [])
  const leafWidth = (DOOR.right - DOOR.left) / 2
  const z = halfD + 0.1
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.65} />
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C9A13B', metalness: 0.9, roughness: 0.3 }), [])

  return (
    <group>
      {[-1, 1].map((s) => {
        const x = (s * leafWidth) / 2
        return (
          <group key={s} position={[x, DOOR.top / 2, z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[leafWidth - 0.01, DOOR.top, 0.08]} />
              {teak}
            </mesh>
            {/* Raised panels on the room side */}
            {[0.65, -0.1, -0.85].map((py) => (
              <mesh key={py} position={[0, py, -0.05]} castShadow>
                <boxGeometry args={[leafWidth - 0.16, 0.6, 0.03]} />
                {teak}
              </mesh>
            ))}
            <mesh position={[-s * (leafWidth / 2 - 0.08), -0.25, -0.07]} material={brass}>
              <sphereGeometry args={[0.03, 12, 12]} />
            </mesh>
          </group>
        )
      })}
      {/* Painted door surround */}
      <mesh position={[0, DOOR.top + 0.08, halfD - 0.02]} castShadow>
        <boxGeometry args={[DOOR.right - DOOR.left + 0.3, 0.16, 0.06]} />
        <meshStandardMaterial color={palette.limeWhite} roughness={0.8} />
      </mesh>
      {[DOOR.left - 0.07, DOOR.right + 0.07].map((x) => (
        <mesh key={x} position={[x, DOOR.top / 2, halfD - 0.02]} castShadow>
          <boxGeometry args={[0.14, DOOR.top, 0.06]} />
          <meshStandardMaterial color={palette.limeWhite} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** A teak bench with a cobalt cushion, against the west wall. */
function Bench() {
  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const { position, size } = furniture.bench
  const [w, h, d] = size
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.7} />
  return (
    <group position={position}>
      <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        {teak}
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * (w - 0.08)) / 2, (h - 0.06) / 2, (sz * (d - 0.08)) / 2]} castShadow>
            <boxGeometry args={[0.06, h - 0.06, 0.06]} />
            {teak}
          </mesh>
        )),
      )}
      <mesh position={[0, h + 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.08, d - 0.1]} />
        <meshStandardMaterial color={palette.cobalt} roughness={0.95} />
      </mesh>
    </group>
  )
}
