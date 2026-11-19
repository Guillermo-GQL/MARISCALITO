import { useSyncExternalStore } from 'react'
import { CARGO_ACCESS, CARGO_MODULE, DEMO_USERS, isAccessId, type AccessId, type Cargo, type ModuloId } from './config'

export interface Sesion { user: string; name: string; cargo: Cargo; access: AccessId; module: ModuloId }
export type ResultadoLogin = { ok: true; sesion: Sesion } | { ok: false; motivo: 'invalid' | 'access' }

/**
 * Sesión de demostración (sin backend). Se guarda en sessionStorage, así que se pierde al cerrar la pestaña.
 * Cuando exista una API, solo hay que reemplazar iniciarSesion() y cerrarSesion().
 */
const CLAVE = 'mc-session-v2'
const CLAVE_ACCESO = 'mc-acceso-elegido'
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((o) => o())

const leer = (): Sesion | null => {
  try { return JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') } catch { return null }
}
let actual: Sesion | null = leer()

export const sesionActual = () => actual
export const useSesion = () => useSyncExternalStore((cb) => { oyentes.add(cb); return () => { oyentes.delete(cb) } }, sesionActual)

/** Valida contra los usuarios de demostración. El cargo decide el módulo; el acceso elegido debe coincidir con su grupo. */
export function iniciarSesion(access: AccessId, usuario: string, clave: string): ResultadoLogin {
  const q = usuario.trim().toLowerCase()
  const u = DEMO_USERS.find((d) => d.user === q || d.alt?.some((a) => a.toLowerCase() === q))
  if (!u || u.password !== clave) return { ok: false, motivo: 'invalid' }
  if (CARGO_ACCESS[u.cargo] !== access) return { ok: false, motivo: 'access' }
  const sesion: Sesion = { user: u.user, name: u.name, cargo: u.cargo, access, module: CARGO_MODULE[u.cargo] }
  sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  actual = sesion
  avisar()
  return { ok: true, sesion }
}

export function cerrarSesion() {
  if (!actual) return
  sessionStorage.removeItem(CLAVE)
  actual = null
  avisar()
}

/** Acceso elegido en «Elegir perfil» (por defecto, personal administrativo). */
export const accesoElegido = (): AccessId => {
  const v = sessionStorage.getItem(CLAVE_ACCESO)
  return isAccessId(v) ? v : 'personal'
}
export const elegirAcceso = (a: AccessId) => sessionStorage.setItem(CLAVE_ACCESO, a)
