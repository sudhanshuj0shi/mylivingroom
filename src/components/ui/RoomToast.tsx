import { useHouse } from '../../state/houseStore'
import { roomInfo } from '../../content/rooms'

/** Fades the room's name in and out at the top of the screen as you walk into it. */
export function RoomToast() {
  const room = useHouse((s) => s.currentRoom)
  const walking = useHouse((s) => s.walking)
  if (!room || !walking) return null
  // The key restarts the CSS animation each time the room changes.
  return (
    <p className="room-toast" key={room} role="status">
      {roomInfo[room].name}
    </p>
  )
}
