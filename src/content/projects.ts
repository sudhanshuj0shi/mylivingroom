/**
 * Your projects. PLACEHOLDERS: replace with real ones.
 * The work room (Milestone 3) will show each as a full case study, so later
 * we'll add fields for the problem, your contribution, decisions and outcome.
 */
export type Project = {
  title: string
  summary: string
  tags: string[]
  link?: string
}

export const projects: Project[] = [
  {
    title: 'Project one (placeholder)',
    summary: 'A product I helped build: what it does and who it is for, in a sentence.',
    tags: ['React', 'TypeScript'],
  },
  {
    title: 'Project two (placeholder)',
    summary: 'A tricky frontend problem and the approach that solved it.',
    tags: ['Performance', 'Design systems'],
  },
  {
    title: 'Project three (placeholder)',
    summary: 'Something built for curiosity: an experiment, a tool or a side project.',
    tags: ['Three.js', 'Web Audio'],
  },
]
