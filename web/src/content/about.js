/**
 * About section. `story` and `team` are optional: each block only renders
 * once it has content, so nothing placeholder-ish ever reaches the page.
 */
export const ABOUT = {
  headline: 'AI that gives people their time back.',
  intro:
    "She Tech builds AI, automation and custom software for teams who would rather spend their hours on judgement calls than on copy-paste. AI is at the centre of what we do, but we measure our work in time saved, errors avoided and money recovered, not in buzzwords.",

  /** The story behind the name: one or more paragraphs. */
  story: [],

  /** { name, role, bio?, photo? } where photo is a path under /public, e.g. '/team/jane.jpg' */
  team: [],

  values: [
    {
      title: 'Outcomes over hype',
      body: "We only build AI where it saves real time or money, and we'll tell you when a simpler fix will do.",
    },
    {
      title: 'People stay in charge',
      body: 'AI should take the drudgery away, not the judgement. People review what matters before anything goes out.',
    },
    {
      title: 'Honest and clear',
      body: 'Plain language, realistic timelines and numbers we can stand behind.',
    },
  ],
}
