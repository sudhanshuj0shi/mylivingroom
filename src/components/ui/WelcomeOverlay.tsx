import { useEffect, useRef } from 'react'
import { house, useHouse } from '../../state/houseStore'
import { startSound, toggleMute } from '../../systems/audio/controls'

/** Phones and tablets have no mouse to capture, so walking needs a different design. */
const canWalk = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

/**
 * The welcome card, which doubles as the pause screen and the controls guide.
 *
 * The "Enter" button has id="enter-house"; the Player's pointer-lock control
 * listens for clicks on exactly that id. Browsers only let a page capture the
 * mouse and start sound in response to a click, so this button does both.
 */
export function WelcomeOverlay({ hidden }: { hidden: boolean }) {
  const button = useRef<HTMLButtonElement>(null)
  const returning = useHouse((s) => s.entered)
  const muted = useHouse((s) => s.muted)

  useEffect(() => {
    if (!hidden) button.current?.focus()
  }, [hidden])

  return (
    <div className="overlay" hidden={hidden} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="card">
        <p className="eyebrow">{returning ? 'Paused' : 'Bem-vindo · Welcome'}</p>
        <h1 id="welcome-title">{returning ? 'Take your time.' : 'Come in, the door is open.'}</h1>
        {!returning && (
          <p className="lede">
            This is my house. The things I build are in the room on the left, my records are on the right, and
            straight ahead is a quiet room for poems. A note on the bench says hello.
          </p>
        )}

        {canWalk ? (
          <>
            <div className="actions">
              <button id="enter-house" ref={button} className="enter" onClick={startSound}>
                {returning ? 'Step back in' : 'Enter the house'}
              </button>
              <button className="secondary" onClick={() => house.set({ directoryOpen: true })}>
                Go to a room
              </button>
            </div>
            <label className="sound-choice">
              <input id="sound-choice" type="checkbox" checked={!muted} onChange={toggleMute} />
              Play music and the sound of the breeze
            </label>
            <ul className="controls" aria-label="Controls">
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk, <kbd>Shift</kbd> to hurry</li>
              <li><kbd>Mouse</kbd> to look around</li>
              <li><kbd>E</kbd> or click to use what’s in front of you</li>
              <li><kbd>R</kbd> rooms · <kbd>M</kbd> sound · <kbd>Esc</kbd> pause</li>
            </ul>
          </>
        ) : (
          <p className="note">
            Walking through the house needs a keyboard and mouse for now. A phone-friendly way in is coming.
          </p>
        )}
      </div>
    </div>
  )
}
