import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { HouseScene } from '../world/HouseScene'
import { WelcomeOverlay } from '../components/ui/WelcomeOverlay'
import { ControlsHint } from '../components/ui/ControlsHint'

/**
 * The page: the 3D canvas filling the screen, with plain HTML on top of it.
 *
 * Anything with real text (welcome, help, later project panels and poems) is
 * HTML, not 3D. HTML is sharper, accessible to screen readers, selectable, and
 * styled with the CSS you already know.
 */
export function App() {
  const [locked, setLocked] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  return (
    <>
      <Canvas
        className="scene"
        shadows
        // Never render at more than 2× pixel density: 3× phones would triple the work for little gain.
        dpr={[1, 2]}
        camera={{ fov: 70, near: 0.05, far: 60, position: [0, 1.6, 2.6] }}
        // Neutral tone mapping keeps the paint colours saturated instead of washing them out.
        gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
      >
        <HouseScene
          onLockChange={(isLocked) => {
            setLocked(isLocked)
            if (isLocked) setHasEntered(true)
          }}
        />
      </Canvas>
      <div className="vignette" aria-hidden="true" />
      {locked && <ControlsHint />}
      {/* Kept mounted while hidden: the pointer-lock control is wired to this exact button element. */}
      <WelcomeOverlay hidden={locked} returning={hasEntered} />
    </>
  )
}
