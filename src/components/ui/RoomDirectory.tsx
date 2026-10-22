import { useEffect, useRef } from 'react'
import { useHouse } from '../../state/houseStore'
import { HOUSE_BOUNDS, rooms } from '../../house/plan'
import { roomInfo, roomOrder } from '../../content/rooms'
import { closeDirectory, goToRoom } from '../../app/navigation'

/**
 * The room directory: a small floor plan drawn from the same plan data as the
 * 3D house, plus a list of rooms. Choosing one takes you straight there, so
 * visitors who don't want to explore can still reach everything.
 */
export function RoomDirectory() {
  const current = useHouse((s) => s.currentRoom)
  const entered = useHouse((s) => s.entered)
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])

  const pad = 0.6
  const vb = [HOUSE_BOUNDS.x0 - pad, HOUSE_BOUNDS.z0 - pad, HOUSE_BOUNDS.x1 - HOUSE_BOUNDS.x0 + pad * 2, HOUSE_BOUNDS.z1 - HOUSE_BOUNDS.z0 + pad * 2]

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="directory-title">
      <div className="card directory">
        <p className="eyebrow">Room directory</p>
        <h2 id="directory-title">Where would you like to go?</h2>

        {/* The plan uses the same metres as the 3D world: SVG x = world x, SVG y = world z. */}
        <svg className="plan" viewBox={vb.join(' ')} aria-hidden="true">
          {roomOrder.map((id) => {
            const r = rooms[id]
            return (
              <g key={id} className="plan-room" onClick={() => goToRoom(id)}>
                <rect x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill={r.wall} />
                <text x={(r.x0 + r.x1) / 2} y={(r.z0 + r.z1) / 2} textAnchor="middle" dominantBaseline="middle">
                  {roomInfo[id].name.replace('The ', '')}
                </text>
                {entered && current === id && <circle cx={(r.x0 + r.x1) / 2} cy={(r.z0 + r.z1) / 2 + 1.1} r={0.32} className="here" />}
              </g>
            )
          })}
        </svg>

        <ul className="room-list">
          {roomOrder.map((id, i) => (
            <li key={id}>
              <button ref={i === 0 ? first : undefined} onClick={() => goToRoom(id)}>
                <span className="swatch" style={{ background: rooms[id].wall }} aria-hidden="true" />
                <span className="room-text">
                  <strong>
                    {roomInfo[id].name}
                    {entered && current === id && <span className="badge">You are here</span>}
                  </strong>
                  <span>{roomInfo[id].description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button className="secondary" onClick={closeDirectory}>
          Close
        </button>
      </div>
    </div>
  )
}
