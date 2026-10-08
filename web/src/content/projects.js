import { WORK } from '../config/site'

/**
 * Every file in ./projects becomes a project (files starting with "_" are
 * skipped). The file name is the project's id and link: #work/<file-name>.
 */
const modules = import.meta.glob(['./projects/*.js', '!./projects/_*.js'], { eager: true, import: 'default' })

const REQUIRED = ['title', 'headline', 'summary', 'challenge', 'solution', 'steps', 'results']
const REQUIRED_COMING_SOON = ['title', 'headline']

const all = Object.entries(modules)
  .map(([path, project]) => {
    const id = path.match(/([^/]+)\.js$/)[1]
    if (import.meta.env.DEV) {
      const missing = (project.comingSoon ? REQUIRED_COMING_SOON : REQUIRED).filter((key) => project[key] == null)
      if (missing.length) console.warn(`[projects] "${id}" is missing: ${missing.join(', ')}`)
    }
    return { tags: [], services: [], steps: [], highlights: [], nextPhase: [], outcomes: [], results: [], ...project, id }
  })
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title))

/** Published projects in display order, numbered 01, 02, … */
export const PROJECTS = all
  .filter((p) => WORK.showDrafts || !p.draft)
  .map((p, i) => ({ ...p, number: String(i + 1).padStart(2, '0') }))

/** Projects that open a case-study modal (not "coming soon"). */
export const CASE_STUDIES = PROJECTS.filter((p) => !p.comingSoon)
