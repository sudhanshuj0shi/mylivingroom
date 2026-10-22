import { projects } from './projects'

/**
 * Text shown in the reading panels that open when you interact with things.
 *
 * Everything here is placeholder content, written to be replaced. Change the
 * words without touching any 3D code: objects in the house only refer to a
 * panel by its id ('note', 'laptop').
 */
export type PanelContent = {
  eyebrow: string
  title: string
  paragraphs: string[]
  /** Optional list of items, e.g. projects. */
  items?: Array<{ title: string; text: string; tags?: string[]; link?: string }>
  signoff?: string
}

export const panels = {
  note: {
    eyebrow: 'A note on the bench',
    title: 'Welcome, and thank you for coming in.',
    paragraphs: [
      'I’m Sudhanshu, a frontend engineer of about five years. I like building useful products and finding out how things work underneath.',
      'I also write poems, and I spend a lot of my listening time on techno, drum and bass and dubstep. This house is where those parts of me live together.',
      'The door on the left leads to my work. The one on the right is where the records are. Straight ahead, past the archway, is a quiet room I’m still preparing.',
    ],
    signoff: 'Make yourself at home.',
  },
  laptop: {
    eyebrow: 'On the laptop',
    title: 'Selected work',
    paragraphs: ['A few things I have built. Full case studies, with the problem, my part and what came of it, are on their way.'],
    items: projects.map((p) => ({ title: p.title, text: p.summary, tags: p.tags, link: p.link })),
  },
} satisfies Record<string, PanelContent>

export type PanelId = keyof typeof panels
