import { useHouse } from '../../state/houseStore'
import { toggleMute } from '../../systems/audio/controls'

/** Always-available mute button (also M). Clickable whenever the cursor is visible. */
export function SoundButton() {
  const muted = useHouse((s) => s.muted)
  const entered = useHouse((s) => s.entered)
  if (!entered) return null
  return (
    <button className="sound" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </svg>
      <span>{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
  )
}
