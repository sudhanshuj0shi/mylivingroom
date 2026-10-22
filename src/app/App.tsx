import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { HouseScene } from '../world/HouseScene'
import { pauseForPanel } from '../world/Player'
import { house, useHouse } from '../state/houseStore'
import { interact } from '../systems/interaction/interaction'
import { toggleMute } from '../systems/audio/controls'
import { closeDirectory, closePanel } from './navigation'
import { WelcomeOverlay } from '../components/ui/WelcomeOverlay'
import { ControlsHint } from '../components/ui/ControlsHint'
import { InteractPrompt } from '../components/ui/InteractPrompt'
import { InfoPanel } from '../components/ui/InfoPanel'
import { RoomDirectory } from '../components/ui/RoomDirectory'
import { RoomToast } from '../components/ui/RoomToast'
import { SoundButton } from '../components/ui/SoundButton'

/**
 * The page: the 3D canvas filling the screen, with plain HTML on top of it.
 *
 * Anything with real text (welcome, help, panels, the room directory) is HTML,
 * not 3D: sharper, readable by screen readers, selectable, and styled with CSS.
 */
export function App() {
  const walking = useHouse((s) => s.walking)
  const panel = useHouse((s) => s.panel)
  const directoryOpen = useHouse((s) => s.directoryOpen)

  // Opening a panel or the directory hands the mouse back so you can read and click.
  useEffect(() => {
    if (panel || directoryOpen) pauseForPanel()
  }, [panel, directoryOpen])

  useHotkeys()

  const reading = panel !== null || directoryOpen
  return (
    <>
      <Canvas
        className="scene"
        shadows
        // Never render at more than 2× pixel density: 3× phones would triple the work for little gain.
        dpr={[1, 2]}
        camera={{ fov: 70, near: 0.05, far: 120, position: [0, 1.6, 4.4] }}
        // Neutral tone mapping keeps the paint colours saturated instead of washing them out.
        gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
      >
        <HouseScene />
      </Canvas>
      <div className="vignette" aria-hidden="true" />
      <RoomToast />
      {walking && <InteractPrompt />}
      {walking && <ControlsHint />}
      <SoundButton />
      {panel && <InfoPanel id={panel} />}
      {directoryOpen && <RoomDirectory />}
      {/* Kept mounted while hidden: the pointer-lock control is wired to this exact button element. */}
      <WelcomeOverlay hidden={walking || reading} />
    </>
  )
}

/** Keyboard shortcuts: E use, R rooms, M sound, Esc close or pause. */
function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const s = house.get()
      switch (e.code) {
        case 'KeyE':
          if (s.walking) interact()
          break
        case 'KeyR':
          if (!s.entered || s.panel) break
          if (s.directoryOpen) closeDirectory()
          else house.set({ directoryOpen: true })
          break
        case 'KeyM':
          if (s.entered) toggleMute()
          break
        case 'Escape':
          if (s.panel) closePanel()
          else if (s.directoryOpen) closeDirectory()
          else if (s.walking && s.lookMode === 'drag') house.set({ walking: false })
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
