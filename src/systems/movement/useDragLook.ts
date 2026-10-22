import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Fallback look controls: click and drag to turn the camera.
 *
 * Normally the Enter button captures the mouse ("pointer lock"). Some places
 * refuse that, such as a page embedded in a sandboxed frame, or a browser
 * that blocks it. Without a fallback the visitor would click Enter and
 * nothing would happen. So: if the lock fails or hasn't happened shortly after
 * the click, we switch to dragging instead.
 *
 * Rotation uses Euler angles in 'YXZ' order: turn left/right (Y) first, then
 * tilt up/down (X). That order keeps the horizon level, like turning your
 * head. Pitch is clamped so you can't flip upside down.
 */
export function useDragLook(options: {
  /** Called when drag mode starts (true) or the visitor presses Esc in it (false). */
  onActiveChange: (active: boolean) => void
}) {
  const { camera, gl } = useThree()
  const active = useRef(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    const canvas = gl.domElement
    let dragging = false
    let timer: number | undefined

    const activate = () => {
      if (active.current || document.pointerLockElement) return
      active.current = true
      optionsRef.current.onActiveChange(true)
    }
    const deactivate = () => {
      if (!active.current) return
      active.current = false
      dragging = false
      optionsRef.current.onActiveChange(false)
    }

    // After the Enter click, give pointer lock a moment; if it didn't happen, fall back.
    const onEnterClick = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(activate, 500)
    }
    const onDown = (e: PointerEvent) => {
      if (!active.current) return
      dragging = true
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!active.current || !dragging) return
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= e.movementX * 0.004
      euler.x -= e.movementY * 0.004
      euler.x = Math.max(-1.4, Math.min(1.4, euler.x))
      camera.quaternion.setFromEuler(euler)
    }
    const onUp = () => {
      dragging = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') deactivate()
    }

    const enter = document.getElementById('enter-house')
    enter?.addEventListener('click', onEnterClick)
    document.addEventListener('pointerlockerror', activate)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      enter?.removeEventListener('click', onEnterClick)
      document.removeEventListener('pointerlockerror', activate)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [camera, gl])
}
