import { useSyncExternalStore } from 'react'
import { crearSeed } from './seed'
import type { AdminState, Evento } from './types'
import { nowISO, uid } from './lib'

/**
 * Almacén de datos del Módulo 1. Todo vive en localStorage del navegador (sin backend).
 * En producción esto será la API / base de datos PostgreSQL del modelo lógico.
 */
const KEY = 'mc-admin-v1'

function cargar(): AdminState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AdminState
      if (s && s.v === 1 && Array.isArray(s.usuarios)) return s
    }
  } catch { /* datos corruptos o sin acceso: se parte de la semilla */ }
  return crearSeed()
}

let state: AdminState = cargar()
let persistError = false
const listeners = new Set<() => void>()

function persistir() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); persistError = false } catch { persistError = true }
}

export const getState = () => state
export const hayErrorDeGuardado = () => persistError
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function setState(fn: (s: AdminState) => AdminState) {
  state = fn(state)
  persistir()
  listeners.forEach((l) => l())
}

export function resetStore() {
  state = crearSeed()
  persistir()
  listeners.forEach((l) => l())
}

export const useAdmin = () => useSyncExternalStore(subscribe, getState)

/** Agrega un evento a la bitácora (tabla `bitacora` del modelo). */
export function conEvento(s: AdminState, e: Partial<Evento> & Pick<Evento, 'accion' | 'modulo'>): AdminState {
  const evento: Evento = {
    id: uid('ev'), fecha: nowISO(), usuario: 'admin', rol: 'Administrador', resultado: 'exitoso',
    dispositivo: 'Windows', navegador: 'Chrome', ubicacion: 'Huancavelica', ...e,
  }
  return { ...s, eventos: [evento, ...s.eventos].slice(0, 300) }
}
