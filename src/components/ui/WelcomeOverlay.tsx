import { useEffect, useRef } from 'react'

type Props = {
  /** Hidden while walking; shown again when the visitor presses Esc. */
  hidden: boolean
  /** True after the visitor has been inside once, i.e. they pressed Esc. */
  returning: boolean
}

/** Phones and tablets have no mouse to capture, so walking needs a different design. */
const canWalk = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

/**
 * The welcome card, which doubles as the pause screen and the controls guide.
 *
 * The "Enter" button has id="enter-house"; the Player's pointer-lock control
 * listens for clicks on exactly that id. Browsers only let a page capture the
 * mouse (and, later, play sound) in response to a click, so this button is
 * also our future "allow audio" moment.
 */
export function WelcomeOverlay({ hidden, returning }: Props) {
  const button = useRef<HTMLButtonElement>(null)
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
            This is my house. Somewhere inside are the things I build, the poems I write and the music I keep
            returning to. For now, only the front room is finished.
          </p>
        )}

        {canWalk ? (
          <>
            <button id="enter-house" ref={button} className="enter">
              {returning ? 'Step back in' : 'Enter the house'}
            </button>
            <ul className="controls" aria-label="Controls">
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk</li>
              <li><kbd>Mouse</kbd> to look around</li>
              <li><kbd>Shift</kbd> to walk faster</li>
              <li><kbd>Esc</kbd> to pause</li>
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
