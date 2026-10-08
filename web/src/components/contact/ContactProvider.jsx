import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ContactDialog } from './ContactDialog'

/**
 * Any link to one of these hashes opens the contact dialog, so CTAs anywhere
 * (including content files) need no JS: <a href="#book">, <a href="#message">.
 */
export const CONTACT_LINKS = { book: '#book', message: '#message' }
const TAB_BY_HASH = { [CONTACT_LINKS.book]: 'call', [CONTACT_LINKS.message]: 'message' }

const ContactContext = createContext({ openContact: () => {} })

/** openContact('call' | 'message', prefill?) — prefill: { message, interest, project, … } */
export const useContact = () => useContext(ContactContext)

export function ContactProvider({ children }) {
  const [state, setState] = useState({ open: false, tab: 'call', prefill: {}, formKey: 0 })

  const openContact = useCallback((tab = 'call', prefill = {}) => {
    setState((s) => ({ open: true, tab, prefill, formKey: s.formKey + 1 }))
  }, [])
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])
  const setTab = useCallback((tab) => setState((s) => ({ ...s, tab })), [])

  useEffect(() => {
    // Capture phase, so this runs before the smooth-scroll link handler
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const tab = TAB_BY_HASH[e.target.closest?.('a[href]')?.getAttribute('href')]
      if (!tab) return
      e.preventDefault()
      openContact(tab)
    }
    // Shared links (example.com/#book) and typed-in hashes open the dialog too.
    // The hash is then cleared so Back doesn't reopen it.
    const fromHash = () => {
      const tab = TAB_BY_HASH[window.location.hash]
      if (!tab) return
      history.replaceState(null, '', window.location.pathname + window.location.search)
      openContact(tab)
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', fromHash)
    fromHash()
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', fromHash)
    }
  }, [openContact])

  const value = useMemo(() => ({ openContact }), [openContact])

  return (
    <ContactContext value={value}>
      {children}
      <ContactDialog {...state} onClose={close} onTabChange={setTab} />
    </ContactContext>
  )
}
