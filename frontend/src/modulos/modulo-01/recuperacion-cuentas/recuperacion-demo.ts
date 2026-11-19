export const recoveryLifetime = 60_000
const storageKey = 'mariscalito.m1.recuperacion.v1'
const states = ['Pendiente', 'Enlace enviado', 'Recuperada', 'Vencida', 'Cancelada'] as const
export type RecoveryStatus = (typeof states)[number]
export type RecoveryRequest = {
  id: string
  name: string
  username: string
  email: string
  requestedAt: number
  status: RecoveryStatus
  code?: string
  expiresAt?: number
}

function demoRequests(): RecoveryRequest[] {
  const now = Date.now()
  return [
    { id: 'ana', name: 'Ana López', username: 'ana.torres', email: 'ana@example.com', requestedAt: now - 90_000, status: 'Pendiente' },
    { id: 'luis', name: 'Luis Mendoza', username: 'luis.mendoza', email: 'luis@example.com', requestedAt: now - 10_000,
      status: 'Enlace enviado', code: crypto.randomUUID(), expiresAt: now + recoveryLifetime },
    { id: 'maria', name: 'María Cárdenas', username: 'maria.cardenas', email: 'maria@example.com', requestedAt: now - 150_000,
      status: 'Recuperada' },
    { id: 'jorge', name: 'Jorge Salazar', username: 'jorge.salazar', email: 'jorge@example.com', requestedAt: now - 86_400_000,
      status: 'Vencida', expiresAt: now - 86_340_000 },
    { id: 'rosa', name: 'Rosa Huamán', username: 'rosa.huaman', email: 'rosa@example.com', requestedAt: now - 86_500_000, status: 'Cancelada' },
    { id: 'elena', name: 'Elena Rojas', username: 'elena.rojas', email: 'elena@example.com', requestedAt: now - 90_000_000, status: 'Pendiente' },
  ]
}

function isRequest(value: unknown): value is RecoveryRequest {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return ['id', 'name', 'username', 'email'].every(key => typeof row[key] === 'string')
    && typeof row.requestedAt === 'number' && Number.isFinite(row.requestedAt)
    && states.some(status => status === row.status)
    && (row.code === undefined || typeof row.code === 'string')
    && (row.expiresAt === undefined || (typeof row.expiresAt === 'number' && Number.isFinite(row.expiresAt)))
    && (row.status !== 'Enlace enviado' || (typeof row.code === 'string' && typeof row.expiresAt === 'number'))
}

export function readRequests(): RecoveryRequest[] {
  const stored = localStorage.getItem(storageKey)
  if (stored === null) {
    const initial = demoRequests()
    saveRequests(initial)
    return initial
  }
  const rows: unknown = JSON.parse(stored)
  if (!Array.isArray(rows) || !rows.every(isRequest)) throw new Error('El registro de demostración no es válido.')
  return rows
}

export function saveRequests(rows: RecoveryRequest[]) {
  localStorage.setItem(storageKey, JSON.stringify(rows))
}

export function statusAt(row: RecoveryRequest, time = Date.now()): RecoveryStatus {
  return row.status === 'Enlace enviado' && (row.expiresAt ?? 0) <= time ? 'Vencida' : row.status
}

export function issueLink(row: RecoveryRequest, time = Date.now()): RecoveryRequest {
  return { ...row, status: 'Enlace enviado', code: crypto.randomUUID(), expiresAt: time + recoveryLifetime }
}

export function protectedEmail(email: string) {
  const [local, domain] = email.split('@')
  return domain ? local.slice(0, 2) + '****@' + domain : 'Correo protegido'
}
