import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './ui/modal'

/**
 * Guardia de "cambios sin guardar" para pantallas con edición (Menús y submenús).
 * Si hay cambios y la persona hace clic en un enlace a otra pantalla (menú lateral,
 * ruta de navegación, perfil) o intenta recargar, se pide confirmar antes de salir.
 * Devuelve el diálogo para pintarlo dentro de la pantalla.
 */
export function useDirty(dirty: boolean) {
  const sucio = useRef(dirty)
  sucio.current = dirty
  const [destino, setDestino] = useState<string | null>(null)

  useEffect(() => {
    // Fase de captura: se ve el clic antes de que el enlace cambie de pantalla.
    const alHacerClic = (e: MouseEvent) => {
      if (!sucio.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const enlace = (e.target as Element | null)?.closest?.('a[href^="#"]')
      if (!enlace || enlace.classList.contains('skip-link')) return
      const nuevo = enlace.getAttribute('href') ?? ''
      if (nuevo.length < 2 || nuevo === location.hash) return
      e.preventDefault()
      e.stopPropagation()
      setDestino(nuevo)
    }
    const alRecargar = (e: BeforeUnloadEvent) => { if (sucio.current) { e.preventDefault(); e.returnValue = '' } }
    document.addEventListener('click', alHacerClic, true)
    window.addEventListener('beforeunload', alRecargar)
    return () => {
      document.removeEventListener('click', alHacerClic, true)
      window.removeEventListener('beforeunload', alRecargar)
    }
  }, [])

  const dialogo = destino !== null && (
    <ConfirmDialog
      tone="warning" title="Hay cambios sin guardar" description="Hay cambios sin guardar. ¿Deseas salir de esta pantalla?"
      confirmLabel="Sí, salir" cancelLabel="No, permanecer"
      onCancel={() => setDestino(null)}
      onConfirm={() => { sucio.current = false; const d = destino; setDestino(null); location.hash = d }}
    />
  )
  return { dialogo }
}
