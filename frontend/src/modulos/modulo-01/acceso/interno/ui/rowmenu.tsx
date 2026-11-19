import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, MoreVertical } from '../iconos'

export interface MenuItem { label: string; icon?: ReactNode; onClick: () => void; tone?: 'danger'; disabled?: boolean; separador?: boolean }

/** Menú de acciones (⋮ / •••). Se dibuja en un portal para no recortarse dentro de tablas con scroll. */
export function RowMenu({ items, label = 'Acciones', variante = 'vertical' }: { items: MenuItem[]; label?: string; variante?: 'vertical' | 'horizontal' }) {
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!abierto || !btn.current || !panel.current) return
    const r = btn.current.getBoundingClientRect(), h = panel.current.offsetHeight, w = panel.current.offsetWidth
    const top = r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4
    setPos({ top, left: Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) })
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const cerrar = () => { setAbierto(false); setPos(null) }
    const click = (e: MouseEvent) => { if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) cerrar() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); btn.current?.focus() } }
    document.addEventListener('mousedown', click); document.addEventListener('keydown', key, true)
    window.addEventListener('scroll', cerrar, true); window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key, true)
      window.removeEventListener('scroll', cerrar, true); window.removeEventListener('resize', cerrar)
    }
  }, [abierto])

  const Icono = variante === 'vertical' ? MoreVertical : MoreHorizontal
  return (
    <>
      <button
        ref={btn} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={abierto}
        onClick={() => { setPos(null); setAbierto((v) => !v) }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e9f5] bg-white text-[#0e1d4d] transition hover:bg-[#f1f5fb]"
      >
        <Icono size={16} />
      </button>
      {abierto && createPortal(
        <div
          ref={panel} role="menu"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
          className="adm-root adm-toast fixed z-[70] min-w-[210px] rounded-xl border border-[#e3e9f5] bg-white p-1.5 shadow-xl"
        >
          {items.map((it, i) => (
            <div key={i}>
              {it.separador && <div className="my-1 h-px bg-[#e3e9f5]" />}
              <button
                role="menuitem" disabled={it.disabled}
                onClick={() => { setAbierto(false); setPos(null); it.onClick() }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${it.tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-[#0e1d4d] hover:bg-[#f1f5fb]'}`}
              >
                {it.icon && <span className="shrink-0 opacity-80">{it.icon}</span>}{it.label}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
