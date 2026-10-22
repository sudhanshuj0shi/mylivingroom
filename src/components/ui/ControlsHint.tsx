/** A quiet reminder of the controls while walking; it fades out after a few seconds (see CSS). */
export function ControlsHint() {
  return (
    <>
      <div className="crosshair" aria-hidden="true" />
      <p className="hint" role="status">
        <kbd>WASD</kbd> walk · <kbd>Shift</kbd> faster · <kbd>Esc</kbd> pause
      </p>
    </>
  )
}
