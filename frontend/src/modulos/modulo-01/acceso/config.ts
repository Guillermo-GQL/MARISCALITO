import { GraduationCap, ShieldCheck, type Icono } from './interno/iconos'

/** Módulo (panel) al que se llega después de iniciar sesión. */
export type ModuloId = 'admin' | 'personal' | 'docente' | 'estudiante' | 'tutor'
/** Cada uno de los dos accesos de la pantalla de bienvenida. */
export type AccessId = 'estudiante' | 'personal'
/** Cargo real del usuario; define el acceso y el módulo. */
export type Cargo =
  | 'administrador' | 'director' | 'subdirector' | 'secretaria' | 'auxiliar' | 'docente'
  | 'estudiante' | 'tutor'

export const MODULO_LABEL: Record<ModuloId, string> = {
  admin: 'Administrador', personal: 'Personal administrativo', docente: 'Docente', estudiante: 'Estudiante', tutor: 'Tutor',
}

export interface AccessConfig {
  id: AccessId
  label: string        // título de la tarjeta de bienvenida
  badge: string        // etiqueta sobre "Iniciar sesión"
  description: string
  userLabel: string
  userPlaceholder: string
  icon: Icono
}

export const ACCESS: Record<AccessId, AccessConfig> = {
  estudiante: {
    id: 'estudiante',
    label: 'Estudiante',
    badge: 'Estudiante o tutor',
    description: 'Consulta tu matrícula, asistencia y progreso académico.',
    userLabel: 'Usuario o DNI',
    userPlaceholder: 'Ingresa tu usuario o DNI',
    icon: GraduationCap,
  },
  personal: {
    id: 'personal',
    label: 'Personal administrativo',
    badge: 'Personal administrativo',
    description: 'Gestiona matrícula, asistencia y procesos académicos del colegio.',
    userLabel: 'Usuario o correo institucional',
    userPlaceholder: 'Ingresa tu usuario o correo',
    icon: ShieldCheck,
  },
}

export const ACCESS_ORDER: AccessId[] = ['estudiante', 'personal']
export const isAccessId = (v: string | null | undefined): v is AccessId => !!v && v in ACCESS

export const CARGO_LABEL: Record<Cargo, string> = {
  administrador: 'Administrador del sistema',
  director: 'Director',
  subdirector: 'Subdirector',
  secretaria: 'Secretaría',
  auxiliar: 'Auxiliar',
  docente: 'Docente',
  estudiante: 'Estudiante',
  tutor: 'Tutor',
}

export const CARGO_ACCESS: Record<Cargo, AccessId> = {
  administrador: 'personal',
  director: 'personal',
  subdirector: 'personal',
  secretaria: 'personal',
  auxiliar: 'personal',
  docente: 'personal',
  estudiante: 'estudiante',
  tutor: 'estudiante',
}

/** Director, subdirector, secretaría y auxiliar comparten por ahora el módulo de personal. */
export const CARGO_MODULE: Record<Cargo, ModuloId> = {
  administrador: 'admin',
  director: 'personal',
  subdirector: 'personal',
  secretaria: 'personal',
  auxiliar: 'personal',
  docente: 'docente',
  estudiante: 'estudiante',
  tutor: 'tutor',
}

/* ───────── Usuarios de demostración (sin backend) ───────── */

export interface DemoUser { user: string; password: string; name: string; cargo: Cargo; alt?: string[] }

const DOMINIO = '@mariscalcastilla.edu.pe'

export const DEMO_USERS: DemoUser[] = [
  { user: 'admin', password: 'admin123', name: 'Administrador del sistema', cargo: 'administrador', alt: [`admin${DOMINIO}`] },
  { user: 'director', password: 'director123', name: 'Director', cargo: 'director', alt: [`director${DOMINIO}`] },
  { user: 'subdirector', password: 'subdirector123', name: 'Subdirector', cargo: 'subdirector', alt: [`subdirector${DOMINIO}`] },
  { user: 'secretaria', password: 'secre123', name: 'Carmen Rojas', cargo: 'secretaria', alt: [`secretaria${DOMINIO}`] },
  { user: 'docente', password: 'docente123', name: 'Prof. Víctor Lazo', cargo: 'docente', alt: [`docente${DOMINIO}`] },
  { user: 'auxiliar', password: 'auxiliar123', name: 'Auxiliar de educación', cargo: 'auxiliar', alt: [`auxiliar${DOMINIO}`] },
  { user: 'estudiante', password: 'estudiante123', name: 'Luis Quispe Huamán', cargo: 'estudiante', alt: ['74512036'] },
  { user: 'tutor', password: 'tutor123', name: 'María Huamán (tutora)', cargo: 'tutor', alt: ['41256378'] },
]
