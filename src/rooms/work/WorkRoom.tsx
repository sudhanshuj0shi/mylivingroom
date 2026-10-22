import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { palette } from '../../world/palette'
import { repeated, woodTexture } from '../../world/textures'
import { boxFromCenter, type Box2D } from '../../systems/collision/collision'
import { useInteractable } from '../../systems/interaction/interaction'
import { house } from '../../state/houseStore'
import { WALL, rooms } from '../../house/plan'

const room = rooms.work

const DESK = { x: room.x0 + WALL + 0.38, z: 2, depth: 0.75, length: 1.8, height: 0.76 }
const CHAIR = { x: DESK.x + 0.85, z: 2 }
const SHELF = { x: -5, z: room.z0 + WALL + 0.17, width: 1.8, depth: 0.32, height: 2.2 }
const LAPTOP = new THREE.Vector3(DESK.x + 0.05, DESK.height + 0.12, DESK.z)

export const workColliders: Box2D[] = [
  boxFromCenter(DESK.x, DESK.z, DESK.depth, DESK.length),
  boxFromCenter(CHAIR.x, CHAIR.z, 0.5, 0.5),
  boxFromCenter(SHELF.x, SHELF.z, SHELF.width, SHELF.depth),
]

/**
 * The work room: a teak desk under the window with the laptop, a chair, a
 * bookshelf of colourful spines and a desk lamp. Milestone 3 fills it with
 * real projects and a career timeline; for now the laptop opens a preview.
 */
export function WorkRoom() {
  useInteractable({
    id: 'laptop',
    position: LAPTOP,
    label: () => 'Open the laptop',
    action: () => house.set({ panel: 'laptop' }),
  })

  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.6} />

  return (
    <group>
      {/* Desk */}
      <group position={[DESK.x, 0, DESK.z]}>
        <mesh position={[0, DESK.height - 0.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[DESK.depth, 0.06, DESK.length]} />
          {teak}
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[(sx * (DESK.depth - 0.1)) / 2, (DESK.height - 0.06) / 2, (sz * (DESK.length - 0.1)) / 2]} castShadow>
              <boxGeometry args={[0.06, DESK.height - 0.06, 0.06]} />
              {teak}
            </mesh>
          )),
        )}
      </group>

      <Laptop />
      <DeskLamp position={[DESK.x - 0.15, DESK.height, DESK.z + 0.65]} />
      <Chair />
      <Bookshelf />
    </group>
  )
}

/** A laptop with a softly glowing screen of code, facing into the room. */
function Laptop() {
  const screen = useMemo(() => codeScreenTexture(), [])
  return (
    <group position={[LAPTOP.x, DESK.height, LAPTOP.z]}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.24, 0.02, 0.34]} />
        <meshStandardMaterial color="#B9BCC2" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* The lid, hinged at the back edge (towards the window) and tilted back a little */}
      <group position={[-0.12, 0.02, 0]} rotation={[0, 0, 0.25]}>
        <mesh position={[0, 0.115, 0]} castShadow>
          <boxGeometry args={[0.012, 0.23, 0.34]} />
          <meshStandardMaterial color="#B9BCC2" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0.007, 0.115, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.31, 0.2]} />
          {/* Emissive: the screen gives off its own light, so it reads as "on" even in shadow. */}
          <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.55} />
        </mesh>
      </group>
    </group>
  )
}

function codeScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 310
  canvas.height = 200
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1D2433'
  ctx.fillRect(0, 0, 310, 200)
  const colours = ['#F2B347', '#E0679F', '#7FC8E8', '#9DD39A', '#E8E1D5']
  let seed = 5
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let line = 0; line < 14; line++) {
    let x = 14 + Math.floor(rand() * 3) * 14
    const y = 14 + line * 13
    const words = 1 + Math.floor(rand() * 4)
    for (let w = 0; w < words; w++) {
      const len = 12 + rand() * 50
      ctx.fillStyle = colours[Math.floor(rand() * colours.length)]
      ctx.fillRect(x, y, len, 5)
      x += len + 6
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.03, 20]} />
        <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.38, 8]} />
        <meshStandardMaterial color="#C9A13B" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0.04, 0.4, 0]} rotation={[0, 0, 0.5]} castShadow>
        <coneGeometry args={[0.1, 0.14, 20, 1, true]} />
        <meshStandardMaterial color={palette.shutterGreen} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <pointLight position={[0.08, 0.32, 0]} color="#FFC57A" intensity={1.6} distance={3} decay={2} />
    </group>
  )
}

function Chair() {
  const map = useMemo(() => repeated(woodTexture(), 1, 1), [])
  const teak = <meshStandardMaterial color={palette.teak} map={map} roughness={0.6} />
  return (
    // Turned to face the desk.
    <group position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.05, 0.44]} />
        {teak}
      </mesh>
      {/* Woven cane seat, a classic in old Goan homes */}
      <mesh position={[0, 0.49, 0]}>
        <boxGeometry args={[0.38, 0.01, 0.36]} />
        <meshStandardMaterial color="#D8B878" roughness={0.9} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.2, 0.22, sz * 0.19]} castShadow>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
            {teak}
          </mesh>
        )),
      )}
      <mesh position={[0, 0.78, 0.2]} castShadow>
        <boxGeometry args={[0.46, 0.6, 0.04]} />
        {teak}
      </mesh>
    </group>
  )
}

/** A bookshelf; the books are one InstancedMesh with a colour per spine. */
function Bookshelf() {
  const map = useMemo(() => repeated(woodTexture(), 1, 2), [])
  const books = useRef<THREE.InstancedMesh>(null)
  const shelves = 5
  const layout = useMemo(() => {
    let seed = 13
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const out: { x: number; y: number; w: number; h: number; tilt: number; colour: string }[] = []
    const colours = [palette.cobalt, palette.bougainvillea, palette.turmeric, palette.shutterGreen, palette.redOxide, '#F2E3C6', palette.musicWall, '#2B2B33']
    for (let s = 0; s < shelves - 1; s++) {
      let x = -SHELF.width / 2 + 0.06
      while (x < SHELF.width / 2 - 0.12) {
        const w = 0.025 + rand() * 0.035
        const h = 0.2 + rand() * 0.12
        if (rand() < 0.08) {
          x += 0.08 // the odd gap
          continue
        }
        out.push({ x: x + w / 2, y: 0.08 + s * (SHELF.height / shelves) + h / 2, w, h, tilt: rand() < 0.05 ? 0.25 : 0, colour: colours[Math.floor(rand() * colours.length)] })
        x += w + 0.003
      }
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const m = books.current
    if (!m) return
    const d = new THREE.Object3D()
    layout.forEach((b, i) => {
      d.position.set(b.x, b.y, 0)
      d.rotation.set(0, 0, b.tilt)
      d.scale.set(b.w, b.h, 0.2)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, new THREE.Color(b.colour))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [layout])

  const wood = <meshStandardMaterial color={palette.teak} map={map} roughness={0.7} />
  return (
    <group position={[SHELF.x, 0, SHELF.z]}>
      {Array.from({ length: shelves }, (_, s) => (
        <mesh key={s} position={[0, 0.04 + s * (SHELF.height / shelves), 0]} castShadow receiveShadow>
          <boxGeometry args={[SHELF.width, 0.03, SHELF.depth]} />
          {wood}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * SHELF.width) / 2, SHELF.height / 2 - 0.2, 0]} castShadow>
          <boxGeometry args={[0.04, SHELF.height - 0.3, SHELF.depth]} />
          {wood}
        </mesh>
      ))}
      <instancedMesh ref={books} args={[undefined, undefined, layout.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  )
}
