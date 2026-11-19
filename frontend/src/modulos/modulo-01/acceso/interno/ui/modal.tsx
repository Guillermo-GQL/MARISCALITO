import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, type Icono } from '../iconos'
import { useToast } from './toast'
import { Btn } from './kit'

const pila: number[] = []
let contador = 0

const ANCHO = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-4xl' } as const
const ACENTO = { navy: 'border-t-[#12307f]', teal: 'border-t-[#0fa3a3]', gold: 'border-t-amber-400', red: 'border-t-red-500' } as const

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** Puede ser una función que recibe `cerrar` (respeta la confirmación de cambios sin guardar). */
  footer?: ReactNode | ((cerrar: () => void) => ReactNode)
  size?: keyof typeof ANCHO
  accent?: keyof typeof ACENTO
  /** Si hay cambios sin guardar se pide confirmación antes de cerrar (Figma: "Hay cambios sin guardar"). */
  dirty?: boolean
  z?: number
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'md', accent = 'navy', dirty = false, z = 60 }: ModalProps) {
  const id = useRef(++contador).current
  const ref = useRef<HTMLDivElement>(null)
  const [preguntar, setPreguntar] = useState(false)
  const { dismiss } = useToast()
  const tituloId = useId()

  const pedirCierre = () => (dirty ? setPreguntar(true) : onClose())
  const cierreRef = useRef(pedirCierre)
  cierreRef.current = pedirCierre

  useEffect(() => {
    dismiss() // el aviso se cierra al abrir un modal
    pila.push(id)
    const previo = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled]),textarea:not([disabled])')
      ;(el ?? ref.current)?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pila[pila.length - 1] === id) { e.stopPropagation(); cierreRef.current() }
      if (e.key === 'Tab' && pila[pila.length - 1] === id && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      pila.splice(pila.indexOf(id), 1)
      document.body.style.overflow = overflow
      previo?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="adm-root fixed inset-0 flex items-center justify-center bg-slate-700/55 p-3 sm:p-6" style={{ zIndex: z }} onMouseDown={(e) => { if (e.target === e.currentTarget) pedirCierre() }}>
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1}
        className={`adm-modal flex max-h-[94vh] w-full flex-col overflow-hidden rounded-2xl border-t-[3px] bg-white shadow-2xl outline-none ${ANCHO[size]} ${ACENTO[accent]}`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div>
            <h2 id={tituloId} className="text-base font-bold text-[#0e1d4d]">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={pedirCierre} aria-label="Cerrar" className="rounded-md p-1 text-[#0e1d4d] hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-1">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e3e9f5] px-6 py-4">{typeof footer === 'function' ? footer(pedirCierre) : footer}</div>}
      </div>

      {preguntar && (
        <ConfirmDialog
          tone="warning" title="Hay cambios sin guardar" description="Hay cambios sin guardar. ¿Deseas salir de esta pantalla?"
          confirmLabel="Sí, salir" cancelLabel="No, permanecer"
          onConfirm={() => { setPreguntar(false); onClose() }} onCancel={() => setPreguntar(false)}
        />
      )}
    </div>,
    document.body,
  )
}

interface ConfirmProps {
  title: string
  description: ReactNode
  note?: ReactNode
  tone?: 'danger' | 'warning' | 'info'
  icon?: Icono
  confirmLabel?: string
  cancelLabel?: string
  /** Para diálogos de bloqueo ("No se puede eliminar…") donde solo hay una acción alterna. */
  hideConfirm?: boolean
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

const TONO = {
  danger: { borde: 'border-t-red-500', circ: 'bg-red-50 text-red-600', btn: 'danger' as const },
  warning: { borde: 'border-t-amber-400', circ: 'bg-amber-100 text-amber-600', btn: 'primary' as const },
  info: { borde: 'border-t-[#12307f]', circ: 'bg-[#f1f5fb] text-[#12307f]', btn: 'primary' as const },
}

export function ConfirmDialog({
  title, description, note, tone = 'danger', icon: Icon = AlertTriangle, confirmLabel = 'Sí, continuar', cancelLabel = 'No, cancelar',
  hideConfirm, onConfirm, onCancel, busy,
}: ConfirmProps) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useRef(++contador).current
  const tituloId = useId()
  const t = TONO[tone]

  useEffect(() => {
    pila.push(id)
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pila[pila.length - 1] === id) { e.stopPropagation(); onCancel() }
    }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('button[data-cancel]')?.focus()
    return () => { document.removeEventListener('keydown', onKey); pila.splice(pila.indexOf(id), 1); prev?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="adm-root fixed inset-0 z-[80] flex items-center justify-center bg-slate-700/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={tituloId} className={`adm-modal w-full max-w-md rounded-2xl border-t-[3px] bg-white p-6 shadow-2xl ${t.borde}`}>
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.circ}`}><Icon size={20} /></span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={tituloId} className="text-base font-bold text-[#0e1d4d]">{title}</h2>
            <div className="mt-2 text-sm text-slate-500">{description}</div>
          </div>
          <button onClick={onCancel} aria-label="Cerrar" className="rounded-md p-1 text-[#0e1d4d] hover:bg-slate-100"><X size={16} /></button>
        </div>
        {note && <div className="mt-4 rounded-lg bg-[#f1f5fb] px-4 py-3 text-xs font-medium text-[#0e1d4d]">{note}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {!hideConfirm && <Btn variant={t.btn} onClick={onConfirm} loading={busy}>{confirmLabel}</Btn>}
          <Btn variant="outline" onClick={onCancel} data-cancel>{cancelLabel}</Btn>
        </div>
      </div>
    </div>,
    document.body,
  )
}
