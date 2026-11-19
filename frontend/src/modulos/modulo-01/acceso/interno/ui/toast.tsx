import { useMemo } from 'react'
import { useNotify } from '../../../../../compartido/componentes'

export type ToastTipo = 'success' | 'warning' | 'error' | 'info'

/**
 * Avisos del Módulo 1. Usan el sistema global de notificaciones de la base
 * (`useNotify`), así que se ven y duran igual que en el resto de pantallas.
 */
export function useToast() {
  const notificar = useNotify()
  return useMemo(() => ({
    notify: ({ tipo = 'success', titulo, texto }: { tipo?: ToastTipo; titulo: string; texto?: string }) =>
      notificar({ type: tipo, message: titulo, description: texto }),
    /** La base ya cierra los avisos al abrir diálogos o cambiar de pantalla. */
    dismiss: () => {},
  }), [notificar])
}
