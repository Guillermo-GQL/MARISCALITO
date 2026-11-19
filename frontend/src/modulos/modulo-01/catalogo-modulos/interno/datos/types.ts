/** Tipos del Módulo 1 (Administrador). Alineados con el modelo lógico de datos. */

export interface Sistema { nombre: string; version: string; institucion: string; logo: string | null }

export type Categoria = 'Principal' | 'Administración' | 'Seguridad' | 'Académico' | 'Reportes'
export type EstadoModulo = 'activo' | 'inactivo' | 'mantenimiento'
export interface Modulo {
  id: string; nombre: string; codigo: string; descripcion: string; categoria: Categoria
  icono: string; ruta: string; orden: number; estado: EstadoModulo; visible: boolean; actualizado: string
}

export interface Menu {
  id: string; nombre: string; codigo: string; moduloId: string; padreId: string | null
  ruta: string; icono: string; orden: number; estado: 'activo' | 'inactivo'; visible: boolean
}

export interface Rol { id: string; codigo: string; nombre: string; descripcion: string; estado: 'activo' | 'inactivo'; protegido?: boolean }

export type Accion = 'consultar' | 'crear' | 'editar' | 'desactivar'
export const ACCIONES: { id: Accion; label: string; ayuda: string }[] = [
  { id: 'consultar', label: 'Consultar', ayuda: 'Ver y buscar información' },
  { id: 'crear', label: 'Crear', ayuda: 'Registrar nuevos datos' },
  { id: 'editar', label: 'Editar', ayuda: 'Actualizar registros existentes' },
  { id: 'desactivar', label: 'Desactivar', ayuda: 'Inhabilitar con confirmación' },
]
/** permiso_rol: rol → módulo → acciones */
export type Permisos = Record<string, Record<string, Accion[]>>

export type EstadoUsuario = 'activa' | 'inactiva' | 'bloqueada' | 'pendiente' | 'suspendida'
export type EstadoClave = 'segura' | 'renovar' | 'vencida' | 'temporal'
export interface HistorialEstado { fecha: string; de: EstadoUsuario | null; a: EstadoUsuario; motivo: string; por: string }
export interface Usuario {
  id: number            // 1024 → "ID-1024"
  usuario: string
  nombres: string; apellidos: string; dni: string; correo: string; telefono: string
  cargo: string; rolId: string; area: string
  estado: EstadoUsuario
  ultimoAcceso: string | null; registro: string
  vigenciaInicio: string | null; vigenciaFin: string | null
  dosFA: boolean; cambiarClave: boolean; claveEstado: EstadoClave; sesiones: number
  historial: HistorialEstado[]
  nacimiento?: string; metodoRecup?: string; codigo?: string; intentosMax?: number
}

export interface Asignaciones { rol: Record<string, string[]>; usuario: Record<string, string[]> }

export type EstadoRecuperacion = 'pendiente' | 'enlace' | 'recuperada' | 'vencida' | 'cancelada'
export interface Recuperacion {
  id: string; usuarioId: number; nombre: string; cuenta: string; correo: string; dni: string
  solicitud: string; vence: string | null; autoExpira: boolean
  estado: EstadoRecuperacion; historial: { fecha: string; texto: string }[]
}

export type EstadoPeriodo = 'programado' | 'vigente' | 'cerrado'
export type TipoPeriodo = 'Trimestre' | 'Bimestre' | 'Semestre' | 'Anual'
export interface Periodo { id: string; anio: number; nombre: string; tipo: TipoPeriodo; inicio: string; fin: string; estado: EstadoPeriodo }

export interface Perfil { nombre: string; correo: string; rol: string; institucion: string; area: string }

export interface Evento {
  id: string; fecha: string; usuario: string; rol: string; accion: string; modulo: string
  resultado: 'exitoso' | 'rechazado'; dispositivo: string; navegador: string; ubicacion: string
}

export interface AdminState {
  v: 1
  sistema: Sistema; modulos: Modulo[]; menus: Menu[]; roles: Rol[]; permisos: Permisos
  usuarios: Usuario[]; asignaciones: Asignaciones; recuperaciones: Recuperacion[]
  periodos: Periodo[]; perfil: Perfil; eventos: Evento[]
}
