import { house, saveMuted } from '../../state/houseStore'
import { setMusicOn, setMuted, startAmbience } from './ambience'

/**
 * The few things the rest of the app does with sound. Keeping them here means
 * the store (what the UI shows) and the audio engine (what you hear) are
 * always changed together.
 */

/** Call from the Enter click: browsers only allow sound to start after a click or key press. */
export function startSound() {
  const { muted, musicOn } = house.get()
  startAmbience(muted, musicOn)
}

export function toggleMute() {
  const muted = !house.get().muted
  house.set({ muted })
  saveMuted(muted)
  setMuted(muted)
  // If sound was off when the visitor entered, it never started; start it now.
  if (!muted && house.get().entered) startSound()
}

/** The turntable: start or stop the music (the wind keeps blowing either way). */
export function toggleMusic() {
  const { musicOn, muted } = house.get()
  if (muted) {
    // Pressing play on a muted house should be heard.
    house.set({ musicOn: true })
    setMusicOn(true)
    toggleMute()
    return
  }
  house.set({ musicOn: !musicOn })
  setMusicOn(!musicOn)
}
