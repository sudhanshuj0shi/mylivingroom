import { useEffect, useRef } from 'react'
import { panels, type PanelContent, type PanelId } from '../../content/panels'
import { closePanel } from '../../app/navigation'

/**
 * A reading panel: plain, accessible HTML over the 3D view. The words come
 * from content/panels.ts, so editing them never touches the scene.
 */
export function InfoPanel({ id }: { id: PanelId }) {
  const content: PanelContent = panels[id]
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => close.current?.focus(), [id])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <article className="card panel">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2 id="panel-title">{content.title}</h2>
        {content.paragraphs.map((p, i) => (
          <p key={i} className="body">
            {p}
          </p>
        ))}
        {content.items && (
          <ul className="items">
            {content.items.map((item) => (
              <li key={item.title}>
                <h3>{item.link ? <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</h3>
                <p>{item.text}</p>
                {item.tags && (
                  <p className="tags">
                    {item.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {content.signoff && <p className="signoff">{content.signoff}</p>}
        <button ref={close} className="enter" onClick={closePanel}>
          Back to the house
        </button>
      </article>
    </div>
  )
}
