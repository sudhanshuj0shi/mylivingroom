import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { house } from '../../state/houseStore'

/**
 * Fallback look controls: click and drag to turn the camera.
 *
 * Normally the Enter button captures the mouse ("pointer lock"). Some places
 * refuse that, such as a page embedded in a sandboxed frame. Without a
 * fallback, clicking Enter would do nothing. So: if the lock fails, or hasn't
 * happened shortly after the first Enter click, we switch to dragging instead.
 *
 * Rotation uses Euler angles in 'YXZ' order: turn left/right (Y) first, then
 * tilt up/down (X). That order keeps the horizon level, like turning your
 * head. Pitch is clamped so you can't flip upside down.
 */
export function useDragLook() {
  const { camera, gl } = useThree()

  useEffect(() => {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    const canvas = gl.domElement
    let dragging = false
    let timer: number | undefined

    const activate = () => {
      const s = house.get()
      // Once mouse capture has worked, a later refusal (e.g. re-entering too
      // quickly after Esc) just leaves you on the pause card instead.
      if (document.pointerLockElement || s.mouseLockWorked || (s.walking && s.lookMode === 'drag')) return
      house.set({ walking: true, entered: true, lookMode: 'drag' })
    }

    // After the Enter click, give pointer lock a moment; if it didn't happen, fall back.
    const onEnterClick = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(activate, 500)
    }
    const isDragWalking = () => {
      const s = house.get()
      return s.walking && s.lookMode === 'drag'
    }
    const onDown = (e: PointerEvent) => {
      if (!isDragWalking()) return
      dragging = true
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging || !isDragWalking()) return
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= e.movementX * 0.004
      euler.x -= e.movementY * 0.004
      euler.x = Math.max(-1.4, Math.min(1.4, euler.x))
      camera.quaternion.setFromEuler(euler)
    }
    const onUp = () => {
      dragging = false
    }

    const enter = document.getElementById('enter-house')
    enter?.addEventListener('click', onEnterClick)
    document.addEventListener('pointerlockerror', activate)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    return () => {
      window.clearTimeout(timer)
      enter?.removeEventListener('click', onEnterClick)
      document.removeEventListener('pointerlockerror', activate)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
    }
  }, [camera, gl])
}
