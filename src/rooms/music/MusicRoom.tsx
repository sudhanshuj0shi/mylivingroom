import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from '../../world/palette'
import { repeated, woodTexture } from '../../world/textures'
import { boxFromCenter, type Box2D } from '../../systems/collision/collision'
import { useInteractable } from '../../systems/interaction/interaction'
import { house } from '../../state/houseStore'
import { toggleMusic } from '../../systems/audio/controls'
import { WALL, rooms } from '../../house/plan'

const room = rooms.music

const CABINET = { x: 5, z: room.z1 - WALL - 0.26, width: 1.8, depth: 0.5, height: 0.62 }
const SPEAKERS: Array<[number, number]> = [
  [3.55, CABINET.z],
  [6.45, CABINET.z],
]
const ARMCHAIR = { x: 5, z: 0.6 }
const CRATE = { x: room.x0 + WALL + 0.45, z: room.z0 + WALL + 0.35 }
const TURNTABLE = new THREE.Vector3(CABINET.x, CABINET.height + 0.08, CABINET.z)

export const musicColliders: Box2D[] = [
  boxFromCenter(5, CABINET.z, 3.25, 0.55), // cabinet and both speakers
  boxFromCenter(ARMCHAIR.x, ARMCHAIR.z, 0.95, 0.9),
  boxFromCenter(CRATE.x, CRATE.z, 0.7, 0.45),
]

/**
 * The music room: a turntable on a teak cabinet between two speakers, a round
 * rug, an armchair facing the music, and a crate of brightly coloured records.
 * Using the turntable starts or stops the background music, and the record
 * spins while it plays.
 */
export function MusicRoom() {
  useInteractable({
    id: 'turntable',
    position: TURNTABLE,
    range: 2.4,
    label: () => (house.get().musicOn && !house.get().muted ? 'Lift the needle' : 'Play the record'),
    action: toggleMusic,
  })

  const map = useMemo(() => repeated(woodTexture(), 2, 1), [])
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.6} />

  return (
    <group>
      <Rug />
      <group position={[CABINET.x, 0, CABINET.z]}>
        <mesh position={[0, CABINET.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[CABINET.width, CABINET.height, CABINET.depth]} />
          {teak}
        </mesh>
      </group>
      <Turntable />
      {SPEAKERS.map(([x, z]) => (
        <Speaker key={x} position={[x, 0, z]} />
      ))}
      <Armchair />
      <RecordCrate />
      <FloorLamp position={[room.x1 - 0.8, 0, room.z1 - 0.8]} />
      <RecordFrames />
    </group>
  )
}

/** Turntable; the platter spins up and slows down smoothly, like a real one. */
function Turntable() {
  const platter = useRef<THREE.Group>(null)
  const speed = useRef(0)

  useFrame((_, delta) => {
    const { musicOn, muted } = house.get()
    const target = musicOn && !muted ? 3.49 : 0 // 33⅓ rpm is about 3.49 radians per second
    speed.current += (target - speed.current) * Math.min(1, delta * 1.5)
    if (platter.current) platter.current.rotation.y -= speed.current * delta
  })

  return (
    <group position={[TURNTABLE.x, CABINET.height, TURNTABLE.z]}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.46, 0.08, 0.36]} />
        <meshStandardMaterial color="#3A2416" roughness={0.5} />
      </mesh>
      <group ref={platter} position={[-0.04, 0.09, 0]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.015, 40]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        {/* Record label: off-centre stripe so you can see it turning */}
        <mesh position={[0, 0.009, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.002, 30]} />
          <meshStandardMaterial color={palette.bougainvillea} roughness={0.6} />
        </mesh>
        <mesh position={[0.025, 0.0105, 0]}>
          <boxGeometry args={[0.05, 0.001, 0.012]} />
          <meshStandardMaterial color={palette.turmeric} />
        </mesh>
      </group>
      {/* Tonearm */}
      <mesh position={[0.17, 0.11, -0.1]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.05, 12]} />
        <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 0.135, -0.02]} rotation={[0, 0.85, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.22, 8]} />
        <meshStandardMaterial color="#D8D8D8" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Speaker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 1.1, 0.34]} />
        <meshStandardMaterial color="#2A1A12" roughness={0.6} />
      </mesh>
      {/* Woofer and tweeter, facing into the room (-Z) */}
      {[
        [0.35, 0.12],
        [0.8, 0.06],
      ].map(([y, r]) => (
        <mesh key={y} position={[0, y + 0.2, -0.171]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r, r, 0.01, 24]} />
          <meshStandardMaterial color="#0F0F12" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** A round rug in concentric bands of colour. */
function Rug() {
  const bands = [
    { r: 1.7, colour: palette.redOxide },
    { r: 1.5, colour: palette.turmeric },
    { r: 1.2, colour: palette.musicWall },
    { r: 0.85, colour: palette.bougainvillea },
    { r: 0.45, colour: palette.limeWhite },
  ]
  return (
    <group position={[5, 0, 2]}>
      {bands.map((b, i) => (
        <mesh key={i} position={[0, 0.004 + i * 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[b.r, 64]} />
          <meshStandardMaterial color={b.colour} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Armchair() {
  const fabric = <meshStandardMaterial color={palette.turmeric} roughness={0.95} />
  return (
    // Facing the turntable (+Z).
    <group position={[ARMCHAIR.x, 0, ARMCHAIR.z]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.3, 0.8]} />
        {fabric}
      </mesh>
      <mesh position={[0, 0.45, 0.06]} castShadow>
        <boxGeometry args={[0.66, 0.12, 0.66]} />
        <meshStandardMaterial color={palette.bougainvilleaLight} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.7, -0.33]} castShadow>
        <boxGeometry args={[0.9, 0.8, 0.16]} />
        {fabric}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.4, 0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.8]} />
          {fabric}
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.38, 0.05, sz * 0.33]}>
            <cylinderGeometry args={[0.025, 0.02, 0.1, 8]} />
            <meshStandardMaterial color={palette.teak} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** A wooden crate full of record sleeves, each a bold colour. */
function RecordCrate() {
  const sleeves = useRef<THREE.InstancedMesh>(null)
  const colours = [palette.bougainvillea, palette.cobalt, palette.turmeric, palette.musicWall, palette.redOxide, '#F07AB4', palette.shutterGreen, '#F2E3C6', '#2B2B33', '#E66B2E', '#7FC8E8', '#9DD39A']
  useLayoutEffect(() => {
    const m = sleeves.current
    if (!m) return
    const d = new THREE.Object3D()
    colours.forEach((c, i) => {
      d.position.set(-0.26 + i * 0.045, 0.3, 0)
      d.rotation.set(0, 0, (i % 3) * 0.06 - 0.06)
      d.scale.set(0.012, 0.31, 0.31)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, new THREE.Color(c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const wood = <meshStandardMaterial color="#9A6A3E" map={map} roughness={0.8} />
  return (
    <group position={[CRATE.x, 0, CRATE.z]}>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.04, 0.36]} />
        {wood}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`side${s}`} position={[0, 0.14, s * 0.17]} castShadow>
          <boxGeometry args={[0.66, 0.24, 0.02]} />
          {wood}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`end${s}`} position={[s * 0.32, 0.14, 0]} castShadow>
          <boxGeometry args={[0.02, 0.24, 0.36]} />
          {wood}
        </mesh>
      ))}
      <instancedMesh ref={sleeves} args={[undefined, undefined, colours.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
        <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
        <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 0.3, 24, 1, true]} />
        <meshStandardMaterial color="#F5D9A6" side={THREE.DoubleSide} emissive="#FFB65C" emissiveIntensity={0.35} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 1.45, 0]} color="#FFB65C" intensity={1.4} distance={5} decay={2} />
    </group>
  )
}

/**
 * Three framed record sleeves above the turntable. The artwork is drawn in
 * code (bold circles and stripes), so it's original and needs no image files.
 * Later these can show the covers of your own mixes or productions.
 */
function RecordFrames() {
  const designs = useMemo(() => [sleeveArt(0), sleeveArt(1), sleeveArt(2)], [])
  const z = room.z1 - WALL - 0.03
  return (
    <group>
      {designs.map((art, i) => (
        <group key={i} position={[4.15 + i * 0.85, 2.05, z]} rotation={[0, Math.PI, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.62, 0.04]} />
            <meshStandardMaterial color="#1C1410" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[0.52, 0.52]} />
            <meshStandardMaterial map={art} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function sleeveArt(variant: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const schemes = [
    [palette.bougainvillea, palette.turmeric, '#1C1A1E'],
    [palette.cobalt, '#F2E3C6', palette.redOxide],
    [palette.turmeric, palette.musicWall, palette.bougainvilleaLight],
  ]
  const [bg, a, b] = schemes[variant % schemes.length]
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 256, 256)
  if (variant === 0) {
    // Concentric rings, like a record seen from above
    for (let r = 110; r > 10; r -= 18) {
      ctx.strokeStyle = r % 36 ? a : b
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(128, 128, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (variant === 1) {
    // A sound wave across the middle
    ctx.strokeStyle = a
    ctx.lineWidth = 6
    ctx.beginPath()
    for (let x = 0; x <= 256; x += 4) {
      const y = 128 + Math.sin(x * 0.08) * 60 * Math.sin((x / 256) * Math.PI)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = b
    ctx.fillRect(24, 200, 90, 14)
  } else {
    // Bold stripes and a sun
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? a : b
      ctx.fillRect(0, 140 + i * 20, 256, 20)
    }
    ctx.fillStyle = '#F7F3EA'
    ctx.beginPath()
    ctx.arc(128, 120, 50, 0, Math.PI * 2)
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
