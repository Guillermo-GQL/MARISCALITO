import type { Usuario } from './types'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const p2 = (n: number) => String(n).padStart(2, '0')

export const uid = (prefijo = 'id') => `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
export const nowISO = () => new Date().toISOString()
export const diasDesdeHoy = (d: number, hora = 9, min = 0) => {
  const x = new Date(); x.setDate(x.getDate() + d); x.setHours(hora, min, 0, 0); return x.toISOString()
}
export const hoyISODate = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` }

/** "2026-10-22" o ISO completo → dd/mm/aaaa */
export function fmtFecha(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  if (isNaN(+d)) return '—'
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`
}
export function fmtFechaLarga(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return `${p2(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtHora(iso: string) { const d = new Date(iso); return `${p2(d.getHours())}:${p2(d.getMinutes())}` }
export function fmtFechaHora(iso: string) {
  const d = new Date(iso)
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} · ${fmtHora(iso)}`
}
export function fmtCorto(iso: string) { const d = new Date(iso); return `${d.getDate()} ${MESES[d.getMonth()]} · ${fmtHora(iso)}` }
export function fmtRelativo(iso?: string | null) {
  if (!iso) return 'Nunca'
  const d = new Date(iso), h = new Date()
  const a = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime()
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((a - b) / 86400000)
  if (dias === 0) return `Hoy · ${fmtHora(iso)}`
  if (dias === 1) return `Ayer · ${fmtHora(iso)}`
  return fmtCorto(iso)
}
export const dateOnly = (iso: string) => iso.slice(0, 10)
export function diasEntre(desdeISO: string, hastaISO: string) {
  const a = new Date(dateOnly(desdeISO) + 'T12:00:00').getTime(), b = new Date(dateOnly(hastaISO) + 'T12:00:00').getTime()
  return Math.round((b - a) / 86400000)
}
export const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${p2(Math.floor(s / 60))}:${p2(s % 60)}` }

export const maskEmail = (c: string) => { const [u, d] = c.split('@'); return d ? `${u.slice(0, 2)}${'•'.repeat(Math.max(3, Math.min(5, u.length - 2)))}@${d}` : c }
export const maskDni = (d: string) => (d.length >= 4 ? `•••• ${d.slice(-4)}` : '—')
export const nombreCompleto = (u: Pick<Usuario, 'nombres' | 'apellidos'>) => `${u.nombres} ${u.apellidos}`.trim()
export const iniciales = (n: string) => {
  const w = n.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean)
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? w[0]?.[1] ?? '')).toUpperCase()
}
export const idCuenta = (id: number) => `ID-${id}`
export const normaliza = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
export function claveSegura(c: string, min = 10) {
  return c.length >= min && /[a-z]/.test(c) && /[A-Z]/.test(c) && /\d/.test(c) && /[^A-Za-z0-9]/.test(c)
}

export function descargar(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}
export const csvCelda = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
