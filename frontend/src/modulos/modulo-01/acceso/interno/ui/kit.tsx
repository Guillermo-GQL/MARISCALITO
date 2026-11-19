import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { useState } from 'react'
import '../admin.css'
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Search, type Icono } from '../iconos'

/* ───────── Botones ───────── */
const BTN = {
  primary: 'bg-[#12307f] text-white hover:bg-[#0d2566] border-transparent',
  teal: 'bg-[#0fa3a3] text-white hover:bg-[#0c8b8b] border-transparent',
  blue: 'bg-[#1553e0] text-white hover:bg-blue-700 border-transparent',
  outline: 'bg-white text-[#12307f] border-[#e3e9f5] hover:bg-[#f1f5fb]',
  soft: 'bg-blue-50 text-blue-700 border-transparent hover:bg-blue-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
  dangerSoft: 'bg-red-50 text-red-600 border-transparent hover:bg-red-100',
  dangerOutline: 'bg-white text-red-600 border-red-500 hover:bg-red-50',
  ghost: 'bg-transparent text-[#12307f] border-transparent hover:bg-[#f1f5fb]',
} as const

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BTN
  size?: 'sm' | 'md'
  icon?: Icono
  loading?: boolean
}
export function Btn({ variant = 'primary', size = 'md', icon: Icon, loading, children, className = '', disabled, type = 'button', ...rest }: BtnProps) {
  return (
    <button
      type={type} disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-semibold transition disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-200 disabled:text-slate-400 ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} ${BTN[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={size === 'sm' ? 14 : 16} /> : null}
      {children}
    </button>
  )
}

/* ───────── Contenedores ───────── */
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`min-w-0 rounded-2xl border border-[#e3e9f5] bg-white shadow-xs ${className}`}>{children}</section>
)

export function PageHead({ title, subtitle, badge, actions }: { title: string; subtitle?: string; badge?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[1.7rem] font-bold leading-tight text-[#0e1d4d]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {(badge || actions) && (
        <div className="flex flex-col items-end gap-3">
          {badge}
          {actions && <div className="flex flex-wrap justify-end gap-2.5">{actions}</div>}
        </div>
      )}
    </div>
  )
}

/* ───────── Badges ───────── */
const TONOS = {
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  sky: 'bg-[#eaf0fb] text-[#12307f]',
  orange: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-slate-100 text-slate-600',
  teal: 'bg-teal-50 text-teal-700',
} as const
const SOLIDOS = {
  green: 'bg-emerald-600 text-white', blue: 'bg-blue-600 text-white', orange: 'bg-amber-500 text-white',
  red: 'bg-red-600 text-white', gray: 'bg-slate-200 text-slate-600', teal: 'bg-teal-600 text-white', sky: 'bg-[#12307f] text-white',
} as const
export type Tono = keyof typeof TONOS

export function Badge({ tone = 'gray', solid, dot, icon: Icon, children, className = '' }: { tone?: Tono; solid?: boolean; dot?: boolean; icon?: Icono; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${solid ? SOLIDOS[tone] : TONOS[tone]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

/* ───────── Tarjetas de indicadores ───────── */
const ICONO_TONO = {
  green: 'bg-emerald-50 text-emerald-600', gray: 'bg-slate-100 text-slate-500', red: 'bg-red-50 text-red-500',
  orange: 'bg-amber-50 text-amber-500', blue: 'bg-blue-50 text-blue-600', teal: 'bg-teal-50 text-teal-600', navy: 'bg-[#eaf0fb] text-[#12307f]',
} as const
const BARRA_TONO = { green: 'bg-emerald-500', gray: 'bg-slate-500', red: 'bg-red-500', orange: 'bg-amber-500', blue: 'bg-blue-500', teal: 'bg-teal-500', navy: 'bg-[#12307f]' } as const
export type TonoIcono = keyof typeof ICONO_TONO

export function StatTile({ icon: Icon, tone, label, value, sub, subTone, bar }: {
  icon: Icono; tone: TonoIcono; label: string; value: ReactNode; sub?: ReactNode; subTone?: 'green' | 'red' | 'orange' | 'teal' | 'gray'; bar?: number
}) {
  const subCls = { green: 'text-emerald-600', red: 'text-red-600', orange: 'text-amber-600', teal: 'text-teal-600', gray: 'text-slate-400' }[subTone ?? 'gray']
  return (
    <div className="rounded-2xl border border-[#e3e9f5] bg-white p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICONO_TONO[tone]}`}><Icon size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-2xl font-bold leading-tight text-[#0e1d4d]">{value}</p>
            {sub && <span className={`pb-0.5 text-[11px] font-semibold ${subCls}`}>{sub}</span>}
          </div>
        </div>
      </div>
      {bar !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${BARRA_TONO[tone]}`} style={{ width: `${Math.max(3, Math.min(100, bar))}%` }} />
        </div>
      )}
    </div>
  )
}

/** Indicador compacto con borde de color (Periodos / Recuperación). */
export function MiniStat({ label, value, hint, color }: { label: string; value: ReactNode; hint?: string; color: 'blue' | 'teal' | 'orange' | 'red' }) {
  const c = { blue: 'text-blue-600 border-l-blue-600', teal: 'text-teal-600 border-l-teal-600', orange: 'text-amber-500 border-l-amber-500', red: 'text-red-600 border-l-red-600' }[color]
  return (
    <div className={`rounded-xl border border-[#e3e9f5] border-l-4 bg-white px-4 py-3 shadow-xs ${c.split(' ').slice(1).join(' ')}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-[#0e1d4d]">{value}</p>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

/* ───────── Formularios ───────── */
export function Field({ label, required, error, hint, children, className = '' }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-[#0e1d4d]">{label}{required && ' *'}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-[11px] font-medium text-red-600">{error}</span>
        : hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  )
}

const CAMPO = 'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#0e1d4d] placeholder:text-slate-400 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
const campoCls = (error?: boolean) => `${CAMPO} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#e3e9f5] focus:border-[#1553e0] focus:ring-blue-200'}`

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ error, className = '', ...p }, ref) => <input ref={ref} className={`${campoCls(error)} ${className}`} {...p} />,
)
Input.displayName = 'Input'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { error?: boolean }>(
  ({ error, className = '', ...p }, ref) => {
    const [ver, setVer] = useState(false)
    return (
      <div className="relative">
        <input ref={ref} type={ver ? 'text' : 'password'} autoComplete="new-password" className={`${campoCls(error)} pr-11 ${className}`} {...p} />
        <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {ver ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ error, className = '', ...p }, ref) => <textarea ref={ref} rows={3} className={`${campoCls(error)} resize-none ${className}`} {...p} />,
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ error, className = '', children, ...p }, ref) => (
    <div className="relative">
      <select ref={ref} className={`${campoCls(error).replace('text-sm', 'text-[13px]')} appearance-none pr-9 ${className}`} {...p}>{children}</select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  ),
)
Select.displayName = 'Select'

export function SearchBox({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className={`${campoCls()} pl-10`}
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label, disabled, small }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; small?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${small ? 'h-5 w-9' : 'h-6 w-11'} ${checked ? 'bg-[#0fa3a3]' : 'bg-slate-300'}`}
    >
      <span className={`inline-block rounded-full bg-white shadow-sm transition ${small ? 'h-4 w-4' : 'h-5 w-5'} ${checked ? (small ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5'}`} />
    </button>
  )
}

export function Check({ checked, onChange, label, indeterminate, disabled, tone = 'teal' }: { checked: boolean; onChange?: (v: boolean) => void; label: string; indeterminate?: boolean; disabled?: boolean; tone?: 'teal' | 'blue' }) {
  const on = checked || indeterminate
  return (
    <button
      type="button" role="checkbox" aria-checked={indeterminate ? 'mixed' : checked} aria-label={label} disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? (tone === 'blue' ? 'border-[#1553e0] bg-[#1553e0] text-white' : 'border-[#0fa3a3] bg-[#0fa3a3] text-white') : 'border-slate-300 bg-white hover:border-slate-400'}`}
    >
      {indeterminate ? <span className="h-0.5 w-2.5 rounded-sm bg-white" /> : checked ? <CheckSvg /> : null}
    </button>
  )
}
function CheckSvg() { return <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.7l4.5-5" /></svg> }

/** Opción tipo "interruptor + texto" usada en las secciones de seguridad de los formularios. */
export function ToggleRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#0e1d4d]">
      <Toggle checked={checked} onChange={onChange} label={label} small />
      <span>{label}</span>
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className = '' }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; className?: string }) {
  return (
    <div role="tablist" className={`inline-flex rounded-xl border border-[#e3e9f5] bg-[#f1f5fb] p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.id} role="tab" aria-selected={value === o.id} type="button" onClick={() => onChange(o.id)}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${value === o.id ? 'bg-[#12307f] text-white shadow-sm' : 'text-[#12307f] hover:bg-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ───────── Estados vacíos / carga ───────── */
export function EmptyState({ icon: Icon, title, text, action }: { icon: Icono; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#12307f]"><Icon size={22} /></span>
      <p className="mt-5 text-base font-bold text-[#0e1d4d]">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingState({ title, text, icon: Icon }: { title: string; text: string; icon: Icono }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center" role="status" aria-busy="true">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600"><Icon size={26} className="animate-spin" style={{ animationDuration: '1.6s' }} /></span>
      <p className="mt-5 text-base font-bold text-[#0e1d4d]">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      <div className="mt-8 w-full max-w-xl space-y-3">
        {[40, 55, 70, 82].map((w, i) => <div key={i} className="h-3 animate-pulse rounded-full bg-blue-100" style={{ width: `${w}%` }} />)}
      </div>
    </div>
  )
}

/* ───────── Paginación ───────── */
export function Pager({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (total <= size) return null
  const desde = (page - 1) * size + 1, hasta = Math.min(total, page * size)
  return (
    <div className="flex items-center justify-between border-t border-[#e3e9f5] px-5 py-3 text-xs text-slate-500">
      <span>Mostrando {desde}–{hasta} de {total}</span>
      <div className="flex items-center gap-1.5">
        <button aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-[#e3e9f5] p-1.5 hover:bg-[#f1f5fb] disabled:opacity-40"><ChevronLeft size={14} /></button>
        <span className="px-2 font-semibold text-[#0e1d4d]">{page} / {pages}</span>
        <button aria-label="Página siguiente" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-[#e3e9f5] p-1.5 hover:bg-[#f1f5fb] disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

export const Avatar = ({ text, tone = 'blue', size = 'md' }: { text: string; tone?: 'blue' | 'teal' | 'violet' | 'amber' | 'navy' | 'rose' | 'gray'; size?: 'sm' | 'md' | 'lg' }) => {
  const c = { blue: 'bg-blue-100 text-blue-700', teal: 'bg-teal-500 text-white', violet: 'bg-violet-500 text-white', amber: 'bg-amber-700 text-white', navy: 'bg-[#12307f] text-white', rose: 'bg-rose-500 text-white', gray: 'bg-slate-100 text-slate-600' }[tone]
  const s = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' }[size]
  return <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${c} ${s}`}>{text}</span>
}
const AVATAR_TONOS = ['navy', 'teal', 'violet', 'amber', 'blue', 'rose'] as const
export const tonoAvatar = (id: number | string) => AVATAR_TONOS[(typeof id === 'number' ? id : [...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_TONOS.length]

export function Banner({ tone = 'green', title, children, icon: Icon, onClose }: { tone?: 'green' | 'blue' | 'orange' | 'red'; title?: string; children?: ReactNode; icon?: Icono; onClose?: () => void }) {
  const c = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-800', orange: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700' }[tone]
  return (
    <div className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm ${c}`} role="status">
      {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80"><Icon size={18} /></span>}
      <div className="min-w-0 flex-1">{title && <p className="font-bold">{title}</p>}{children && <p className="text-xs opacity-90">{children}</p>}</div>
      {onClose && <button onClick={onClose} aria-label="Cerrar" className="rounded-sm p-1 opacity-60 hover:opacity-100">✕</button>}
    </div>
  )
}

/* ───────── Tablas ───────── */
export const TH = 'px-4 py-3 text-left text-[11px] font-semibold text-slate-600 whitespace-nowrap'
export const TD = 'px-4 py-3 align-middle text-[13px] text-slate-600'
export const THEAD = 'bg-[#eaf0fb]'
