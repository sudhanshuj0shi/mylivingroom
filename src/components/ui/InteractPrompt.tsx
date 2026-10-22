import { useHouse } from '../../state/houseStore'

/** "E · Read the note": shown when you're near and facing something you can use. */
export function InteractPrompt() {
  const prompt = useHouse((s) => s.prompt)
  if (!prompt) return null
  return (
    <p className="prompt" role="status" key={prompt.id}>
      <kbd>E</kbd> {prompt.label}
    </p>
  )
}
