import { house } from '../state/houseStore'
import { resumeWalking } from '../world/Player'
import { roomInfo } from '../content/rooms'
import { startSound } from '../systems/audio/controls'
import type { RoomId } from '../house/plan'

/** Close a reading panel and go back to walking. */
export function closePanel() {
  house.set({ panel: null })
  resumeWalking()
}

/** Close the room directory; if the visitor was already inside, go back to walking. */
export function closeDirectory() {
  house.set({ directoryOpen: false })
  if (house.get().entered) resumeWalking()
}

/** Jump to a room from the directory. Called from a click, so it can also start sound and capture the mouse. */
export function goToRoom(id: RoomId) {
  const { spawn, lookAt } = roomInfo[id]
  startSound()
  house.set({ teleport: { x: spawn[0], z: spawn[1], lookAt }, directoryOpen: false, entered: true })
  resumeWalking()
}
