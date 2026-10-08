import { useCallback, useEffect, useRef, useState } from 'react'

const PATTERN = /^#work\/([\w-]+)$/

/**
 * Keeps the open project in the URL (#work/<id>) so case studies are
 * shareable, open on page load, and close with the browser's Back button.
 * Plain links to "#work/<id>" (e.g. from the navbar) open them too.
 */
export function useProjectRoute(projects) {
  const find = useCallback(
    () => {
      const id = window.location.hash.match(PATTERN)?.[1]
      return projects.find((p) => p.id === id) ?? null
    },
    [projects],
  )

  const [active, setActive] = useState(find)
  const pushedByUs = useRef(false)

  useEffect(() => {
    const sync = () => {
      const project = find()
      if (!project) pushedByUs.current = false
      setActive(project)
    }
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [find])

  const open = useCallback((project) => {
    history.pushState({ project: project.id }, '', `#work/${project.id}`)
    pushedByUs.current = true
    setActive(project)
  }, [])

  const close = useCallback(() => {
    if (pushedByUs.current) {
      pushedByUs.current = false
      history.back() // popstate → sync → null
    } else {
      history.replaceState(null, '', '#work')
      setActive(null)
    }
  }, [])

  return { active, open, close }
}
