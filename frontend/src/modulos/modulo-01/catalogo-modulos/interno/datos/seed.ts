import { diasDesdeHoy } from './lib'
import type {
  AdminState, Evento, Menu, Modulo, Permisos, Recuperacion, Rol, Usuario, Accion, Categoria, EstadoModulo, EstadoUsuario,
} from './types'

const DOM = '@mariscalcastilla.edu.pe'
const TODAS: Accion[] = ['consultar', 'crear', 'editar', 'desactivar']

/* ───────── Módulos (catálogo) ───────── */
const mod = (
  id: string, nombre: string, codigo: string, descripcion: string, categoria: Categoria,
  orden: number, dias: number, estado: EstadoModulo = 'activo', visible = true,
): Modulo => ({ id, nombre, codigo, descripcion, categoria, icono: 'layout', ruta: `/${codigo.toLowerCase().replace('mod-', '')}`, orden, estado, visible, actualizado: diasDesdeHoy(dias) })

const MODULOS: Modulo[] = [
  mod('MOD-DASH', 'Dashboard', 'MOD-DASH', 'Resumen general y accesos rápidos', 'Principal', 1, 0),
  mod('MOD-CFG', 'Configuración general', 'MOD-CFG', 'Identidad, módulos y menús del sistema', 'Administración', 2, 0),
  mod('MOD-CTA', 'Gestión de cuentas', 'MOD-CTA', 'Administración de cuentas del personal', 'Administración', 3, -1),
  mod('MOD-ROL', 'Roles y permisos', 'MOD-ROL', 'Roles, permisos y autorizaciones', 'Seguridad', 4, -1),
  mod('MOD-ACA', 'Gestión académica', 'MOD-ACA', 'Estructura académica institucional', 'Académico', 5, -2),
  mod('MOD-MAT', 'Matrículas', 'MOD-MAT', 'Registro y seguimiento de matrículas', 'Académico', 6, -2),
  mod('MOD-ASIS', 'Asistencia', 'MOD-ASIS', 'Control diario de asistencia', 'Académico', 7, -3),
  mod('MOD-HOR', 'Horarios', 'MOD-HOR', 'Programación de clases y responsables', 'Académico', 8, -3),
  mod('MOD-PER', 'Periodos académicos', 'MOD-PER', 'Calendario lectivo y vigencias', 'Académico', 9, -4),
  mod('MOD-REP', 'Reportes', 'MOD-REP', 'Reportes e indicadores institucionales', 'Reportes', 10, -5, 'mantenimiento'),
  mod('MOD-AUD', 'Auditoría', 'MOD-AUD', 'Bitácora de eventos de seguridad', 'Seguridad', 11, -6, 'inactivo', false),
]

/* ───────── Menús y submenús ───────── */
const men = (id: string, nombre: string, moduloId: string, ruta: string, padreId: string | null, orden: number, visible = true): Menu =>
  ({ id, nombre, codigo: `NAV-${nombre.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '-').replace(/-$/, '')}`, moduloId, padreId, ruta, icono: 'list', orden, estado: 'activo', visible })

const MENUS: Menu[] = [
  men('m-cfg', 'Configuración general', 'MOD-CFG', '/admin/configuracion', null, 1),
  men('m-cfg-ident', 'Identidad del sistema', 'MOD-CFG', '/admin/identidad', 'm-cfg', 1),
  men('m-cfg-mod', 'Catálogo de módulos', 'MOD-CFG', '/admin/modulos', 'm-cfg', 2),
  men('m-cfg-menu', 'Menús y submenús', 'MOD-CFG', '/admin/menus', 'm-cfg', 3),
  men('m-acc', 'Gestión de accesos', 'MOD-CTA', '/admin/accesos', null, 2),
  men('m-acc-usr', 'Gestión de usuarios', 'MOD-CTA', '/admin/usuarios', 'm-acc', 1),
  men('m-acc-rol', 'Roles y permisos', 'MOD-ROL', '/admin/roles', 'm-acc', 2),
  men('m-acc-cta', 'Cuentas de usuario', 'MOD-CTA', '/admin/cuentas', 'm-acc', 3),
  men('m-acc-asg', 'Asignación de menús', 'MOD-ROL', '/admin/asignacion', 'm-acc', 4, false),
  men('m-seg', 'Seguridad', 'MOD-ROL', '/admin/seguridad', null, 3),
  men('m-seg-rec', 'Recuperación de cuentas', 'MOD-CTA', '/admin/recuperacion', 'm-seg', 1),
  men('m-seg-est', 'Estados y vigencia', 'MOD-CTA', '/admin/estados', 'm-seg', 2),
  men('m-par', 'Parámetros', 'MOD-PER', '/admin/parametros', null, 4),
  men('m-par-per', 'Periodos académicos', 'MOD-PER', '/admin/periodos', 'm-par', 1),
  men('m-mat', 'Matrículas', 'MOD-MAT', '/personal/matriculas', null, 5),
  men('m-mat-sol', 'Solicitudes de matrícula', 'MOD-MAT', '/personal/matriculas', 'm-mat', 1),
  men('m-mat-vac', 'Vacantes', 'MOD-MAT', '/personal/vacantes', 'm-mat', 2),
  men('m-asi', 'Asistencia', 'MOD-ASIS', '/docente/asistencia', null, 6),
  men('m-asi-reg', 'Registro diario', 'MOD-ASIS', '/docente/asistencia', 'm-asi', 1),
  men('m-asi-rep', 'Reportes de asistencia', 'MOD-ASIS', '/docente/reportes', 'm-asi', 2),
  men('m-hor', 'Horarios', 'MOD-HOR', '/docente/horario', null, 7),
  men('m-hor-sec', 'Horario por sección', 'MOD-HOR', '/docente/horario', 'm-hor', 1),
  men('m-aca', 'Gestión académica', 'MOD-ACA', '/personal/academica', null, 8),
  men('m-aca-sec', 'Secciones y aulas', 'MOD-ACA', '/personal/secciones', 'm-aca', 1),
  men('m-aca-cur', 'Cursos', 'MOD-ACA', '/personal/cursos', 'm-aca', 2),
]
const ADMIN_MENUS = MENUS.filter((m) => m.id.startsWith('m-cfg') || m.id.startsWith('m-acc') || m.id.startsWith('m-seg') || m.id.startsWith('m-par')).map((m) => m.id)
const menusDe = (...padres: string[]) => MENUS.filter((m) => padres.includes(m.id) || (m.padreId && padres.includes(m.padreId))).map((m) => m.id)

/* ───────── Roles y permisos ───────── */
const ROLES: Rol[] = [
  { id: 'rol-admin', codigo: 'ROL_ADMIN', nombre: 'Administrador del sistema', descripcion: 'Configura el sistema y administra los accesos', estado: 'activo', protegido: true },
  { id: 'rol-personal', codigo: 'ROL_PERSONAL', nombre: 'Personal administrativo', descripcion: 'Gestiona los procesos administrativos', estado: 'activo' },
  { id: 'rol-docente', codigo: 'ROL_DOCENTE', nombre: 'Docente', descripcion: 'Realiza funciones académicas asignadas', estado: 'activo' },
  { id: 'rol-estudiante', codigo: 'ROL_ESTUDIANTE', nombre: 'Estudiante', descripcion: 'Consulta servicios académicos habilitados', estado: 'activo' },
]
const todos = Object.fromEntries(MODULOS.map((m) => [m.id, [...TODAS]]))
const PERMISOS: Permisos = {
  'rol-admin': todos,
  'rol-personal': {
    'MOD-DASH': ['consultar'], 'MOD-ACA': ['consultar', 'crear', 'editar'], 'MOD-MAT': ['consultar', 'crear', 'editar', 'desactivar'],
    'MOD-ASIS': ['consultar'], 'MOD-HOR': ['consultar', 'editar'], 'MOD-REP': ['consultar'],
  },
  'rol-docente': { 'MOD-DASH': ['consultar'], 'MOD-ASIS': ['consultar', 'crear', 'editar'], 'MOD-HOR': ['consultar'] },
  'rol-estudiante': { 'MOD-DASH': ['consultar'], 'MOD-MAT': ['consultar'], 'MOD-ASIS': ['consultar'], 'MOD-HOR': ['consultar'] },
}

/* ───────── Usuarios ───────── */
const u = (
  id: number, usuario: string, nombres: string, apellidos: string, dni: string, cargo: string, rolId: string, area: string,
  estado: EstadoUsuario, acceso: [number, number, number] | null, registroDias: number,
  extra: Partial<Usuario> = {},
): Usuario => ({
  id, usuario, nombres, apellidos, dni, correo: `${usuario}${DOM}`, telefono: '', cargo, rolId, area, estado,
  ultimoAcceso: acceso ? diasDesdeHoy(acceso[0], acceso[1], acceso[2]) : null,
  registro: diasDesdeHoy(registroDias), vigenciaInicio: diasDesdeHoy(registroDias).slice(0, 10), vigenciaFin: null,
  dosFA: false, cambiarClave: false, claveEstado: 'segura', sesiones: 0,
  historial: [{ fecha: diasDesdeHoy(registroDias), de: null, a: estado === 'pendiente' ? 'pendiente' : 'activa', motivo: 'Alta de la cuenta', por: 'admin' }],
  ...extra,
})

const USUARIOS: Usuario[] = [
  u(1024, 'admin', 'Administrador', 'del sistema', '40125482', 'Administrador TI', 'rol-admin', 'Dirección', 'activa', [0, 8, 42], -600, { dosFA: true, sesiones: 1, telefono: '964 100 200' }),
  u(1025, 'director', 'Rubén', 'Quispe Huamán', '20481190', 'Director', 'rol-personal', 'Dirección', 'activa', [0, 7, 58], -590, { dosFA: true, sesiones: 1 }),
  u(1026, 'subdirector', 'Elena', 'Paucar Rojas', '31447741', 'Subdirector', 'rol-personal', 'Dirección', 'activa', [-1, 17, 5], -590, { claveEstado: 'renovar', sesiones: 1 }),
  u(1027, 'crojas', 'Carmen', 'Rojas Villegas', '40726308', 'Secretaría', 'rol-personal', 'Secretaría', 'activa', [-1, 16, 22], -560, { claveEstado: 'renovar', sesiones: 2 }),
  u(1028, 'rauxiliar', 'Rosa', 'Ayala Mendoza', '43096308', 'Auxiliar', 'rol-personal', 'Convivencia', 'inactiva', [-18, 10, 15], -540, { vigenciaFin: diasDesdeHoy(-10).slice(0, 10) }),
  u(1029, 'vlazo', 'Víctor', 'Lazo Condori', '41239056', 'Docente', 'rol-docente', 'Matemática', 'activa', [0, 8, 5], -500, { sesiones: 1, dosFA: true }),
  u(1030, 'aquincho', 'Ana', 'Quincho Salas', '42889517', 'Docente', 'rol-docente', 'Comunicación', 'bloqueada', [-1, 18, 12], -480, { claveEstado: 'vencida' }),
  u(1031, 'rmedina', 'Raúl', 'Medina Torres', '40773315', 'Docente', 'rol-docente', 'Ciencia y Tecnología', 'activa', [-2, 11, 30], -470, { vigenciaFin: diasDesdeHoy(18).slice(0, 10) }),
  u(1032, 'svargas', 'Sonia', 'Vargas Pariona', '45220091', 'Docente', 'rol-docente', 'Historia y Geografía', 'pendiente', null, -3, { claveEstado: 'temporal', cambiarClave: true, vigenciaInicio: diasDesdeHoy(-3).slice(0, 10) }),
  u(1033, 'lquispe', 'Luis', 'Quispe Huamán', '74512036', 'Estudiante', 'rol-estudiante', '1° A', 'activa', [0, 9, 30], -240, { sesiones: 1 }),
  u(1034, 'rccora', 'Rosa', 'Ccora Mendoza', '75021487', 'Estudiante', 'rol-estudiante', '2° B', 'activa', [-3, 13, 5], -240),
  u(1035, 'jsalazar', 'Jorge', 'Salazar Torres', '73890145', 'Estudiante', 'rol-estudiante', '3° A', 'suspendida', [-20, 9, 10], -240, { vigenciaFin: diasDesdeHoy(40).slice(0, 10) }),
  u(1036, 'ehuaroc', 'Elena', 'Huaroc Paucar', '76214530', 'Estudiante', 'rol-estudiante', '4° A', 'activa', [-5, 8, 47], -240, { vigenciaFin: diasDesdeHoy(9).slice(0, 10) }),
  u(1037, 'jramos', 'Jhon', 'Ramos Yauli', '72845109', 'Estudiante', 'rol-estudiante', '5° B', 'pendiente', null, -1, { claveEstado: 'temporal', cambiarClave: true }),
]

/* ───────── Recuperación de cuentas ───────── */
const rec = (id: string, usuarioId: number, nombre: string, cuenta: string, dni: string, min: number, estado: Recuperacion['estado'], venceMin: number | null, hist: string[]): Recuperacion => {
  const t0 = new Date(Date.now() - min * 60000)
  return {
    id, usuarioId, nombre, cuenta, correo: `${cuenta.slice(0, 2)}****@gmail.com`, dni, solicitud: t0.toISOString(),
    vence: venceMin === null ? null : new Date(t0.getTime() + venceMin * 60000).toISOString(), autoExpira: false, estado,
    historial: hist.map((h, i) => ({ fecha: new Date(t0.getTime() + i * 20000).toISOString(), texto: h })),
  }
}
const RECUPERACIONES: Recuperacion[] = [
  rec('rc-1', 1027, 'Carmen Rojas', 'crojas', '40726308', 12, 'pendiente', 1, ['Solicitud creada por el usuario', 'Enlace generado']),
  rec('rc-2', 1029, 'Víctor Lazo', 'vlazo', '41239056', 20, 'enlace', 1, ['Solicitud creada por el usuario', 'Enlace generado', 'Enlace enviado al correo']),
  rec('rc-3', 1031, 'Raúl Medina', 'rmedina', '40773315', 95, 'recuperada', 1, ['Solicitud creada por el usuario', 'Enlace enviado al correo', 'Contraseña restablecida por el usuario']),
  rec('rc-4', 1030, 'Ana Quincho', 'aquincho', '42889517', 24 * 60 + 40, 'vencida', 1, ['Solicitud creada por el usuario', 'Enlace enviado al correo', 'Enlace vencido sin uso']),
  rec('rc-5', 1034, 'Rosa Ccora', 'rccora', '75021487', 24 * 60 + 150, 'cancelada', null, ['Solicitud creada por el usuario', 'Solicitud cancelada por el administrador']),
]

/* ───────── Bitácora (eventos de acceso y seguridad) ───────── */
const ev = (dias: number, h: number, m: number, usuario: string, rol: string, accion: string, modulo: string, ok = true, disp = 'Windows', nav = 'Chrome', ubi = 'Huancavelica'): Evento =>
  ({ id: `ev-${dias}-${h}-${m}-${usuario}`, fecha: diasDesdeHoy(dias, h, m), usuario, rol, accion, modulo, resultado: ok ? 'exitoso' : 'rechazado', dispositivo: disp, navegador: nav, ubicacion: ubi })

const EVENTOS: Evento[] = [
  ev(0, 8, 42, 'admin', 'Administrador', 'Inicio de sesión exitoso', 'Acceso'),
  ev(0, 8, 5, 'vlazo', 'Docente', 'Inicio de sesión exitoso', 'Acceso', true, 'Android', 'Chrome', 'Tayacaja'),
  ev(0, 7, 58, 'director', 'Personal adm.', 'Inicio de sesión exitoso', 'Acceso', true, 'Windows', 'Edge'),
  ev(0, 9, 30, 'lquispe', 'Estudiante', 'Inicio de sesión exitoso', 'Acceso', true, 'Android', 'Chrome', 'Tayacaja'),
  ev(-1, 18, 12, 'aquincho', 'Docente', 'Cuenta bloqueada por intentos fallidos', 'Seguridad', false, 'Android', 'Chrome'),
  ev(-1, 17, 5, 'subdirector', 'Personal adm.', 'Contraseña restablecida', 'Seguridad', true, 'Windows', 'Chrome', 'Tayacaja'),
  ev(-1, 16, 22, 'crojas', 'Personal adm.', 'Actualización de matrícula', 'Matrículas', true, 'Windows', 'Edge'),
  ev(-1, 14, 3, 'admin', 'Administrador', 'Rol actualizado: Docente', 'Roles y permisos'),
  ev(-2, 11, 30, 'rmedina', 'Docente', 'Registro de asistencia', 'Asistencia', true, 'Android', 'Chrome'),
  ev(-2, 10, 12, 'admin', 'Administrador', 'Nuevo módulo registrado', 'Catálogo de módulos'),
  ev(-2, 9, 47, 'desconocido', '—', 'Intento con cuenta vencida', 'Seguridad', false, 'Windows', 'Firefox', 'Lima'),
  ev(-3, 13, 5, 'rccora', 'Estudiante', 'Consulta de horario', 'Horarios', true, 'Android', 'App móvil'),
  ev(-3, 11, 2, 'admin', 'Administrador', 'Sesión cerrada por el administrador', 'Cuentas de usuario'),
  ev(-3, 8, 20, 'vlazo', 'Docente', 'Registro de asistencia', 'Asistencia', true, 'Android', 'Chrome'),
  ev(-4, 15, 40, 'director', 'Personal adm.', 'Aprobación de apertura de sección', 'Gestión académica'),
  ev(-4, 9, 18, 'desconocido', '—', 'Intento de acceso fallido', 'Seguridad', false, 'Windows', 'Chrome', 'Lima'),
  ev(-5, 8, 47, 'ehuaroc', 'Estudiante', 'Inicio de sesión exitoso', 'Acceso', true, 'Android', 'Chrome'),
  ev(-5, 12, 10, 'admin', 'Administrador', 'Nuevo usuario creado: svargas', 'Gestión de usuarios'),
  ev(-6, 10, 33, 'crojas', 'Personal adm.', 'Inicio de sesión exitoso', 'Acceso'),
  ev(-6, 17, 21, 'admin', 'Administrador', 'Periodo académico actualizado', 'Periodos académicos'),
  ev(-6, 6, 15, 'jsalazar', 'Estudiante', 'Intento con contraseña incorrecta', 'Seguridad', false, 'Android', 'Chrome', 'Tayacaja'),
  ev(-7, 9, 0, 'admin', 'Administrador', 'Inicio de sesión exitoso', 'Acceso'),
]

export function crearSeed(): AdminState {
  return {
    v: 1,
    sistema: { nombre: 'Sistema de Gestión de Matrículas y Asistencias', version: '1.0.0', institucion: 'I.E. Mariscal Castilla', logo: null },
    modulos: MODULOS,
    menus: MENUS,
    roles: ROLES,
    permisos: PERMISOS,
    usuarios: USUARIOS,
    asignaciones: {
      rol: {
        'rol-admin': ADMIN_MENUS,
        'rol-personal': menusDe('m-mat', 'm-asi', 'm-hor', 'm-aca'),
        'rol-docente': menusDe('m-asi', 'm-hor'),
        'rol-estudiante': ['m-mat', 'm-mat-sol', 'm-asi', 'm-asi-reg', 'm-hor', 'm-hor-sec'],
      },
      usuario: {},
    },
    recuperaciones: RECUPERACIONES,
    periodos: [
      { id: 'pe-2026', anio: 2026, nombre: 'Año lectivo 2026', tipo: 'Trimestre', inicio: '2026-03-16', fin: '2026-12-19', estado: 'vigente' },
      { id: 'pe-2025', anio: 2025, nombre: 'Año lectivo 2025', tipo: 'Trimestre', inicio: '2025-03-17', fin: '2025-12-19', estado: 'cerrado' },
    ],
    perfil: { nombre: 'Administrador del sistema', correo: `admin${DOM}`, rol: 'Administrador TI', institucion: 'I.E. Mariscal Castilla', area: 'Administración del sistema' },
    eventos: EVENTOS,
  }
}
