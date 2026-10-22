import type { LookMode } from '../../world/Player'

/** A quiet reminder of the controls while walking; it fades out after a few seconds (see CSS). */
export function ControlsHint({ mode }: { mode: LookMode }) {
  return (
    <>
      {mode === 'mouse' && <div className="crosshair" aria-hidden="true" />}
      <p className="hint" role="status">
        <kbd>WASD</kbd> walk · {mode === 'drag' && <><kbd>Drag</kbd> look · </>}
        <kbd>Shift</kbd> faster · <kbd>Esc</kbd> pause
      </p>
    </>
  )
}
