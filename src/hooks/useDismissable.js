import { useEffect } from 'react'

// Shared overlay behaviour: close on Escape and lock background scroll while
// open. Used by slide-overs and modals so dismissal is consistent everywhere.
export default function useDismissable(onClose) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
}
