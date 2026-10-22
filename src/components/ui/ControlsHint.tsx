import { useHouse } from '../../state/houseStore'

/** A quiet reminder of the controls while walking; it fades out after a few seconds (see CSS). */
export function ControlsHint() {
  const mode = useHouse((s) => s.lookMode)
  return (
    <>
      {mode === 'mouse' && <div className="crosshair" aria-hidden="true" />}
      <p className="hint" role="status">
        <kbd>WASD</kbd> walk · {mode === 'drag' && <><kbd>Drag</kbd> look · </>}
        <kbd>E</kbd> use · <kbd>R</kbd> rooms · <kbd>Esc</kbd> pause
      </p>
    </>
  )
}
