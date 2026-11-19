export const roles = ['Administrador', 'Personal adm.', 'Docente', 'Estudiante'] as const
export const estados = ['Activo', 'Inactivo', 'Bloqueado', 'Pendiente', 'Vencido'] as const
export const areas = ['Dirección', 'Secretaría', 'Convivencia', 'Matemática', 'Comunicación', 'Otra'] as const
export type Rol = typeof roles[number]
export type Estado = typeof estados[number]
export type Perfil = {
  nombres: string; apellidos: string; dni: string; nacimiento: string; telefono: string; correo: string
  usuario: string; rol: Rol; area: string; codigo: string; inicio: string; fin: string; estado: Estado
  recuperacion: string; dosPasos: boolean; cambio: boolean; acceso: boolean; actividad: boolean; invitacion: boolean
}
export type Evento = { fecha: string; accion: string; resultado: 'Exitoso' | 'Bloqueado'; responsable: string; ip?: string }
export type Usuario = Perfil & { id: string; registro: string; ultimo?: string; sesiones: number; dispositivo?: string; eventos: Evento[]; eliminado?: boolean }
export const inicial: Perfil = { nombres: '', apellidos: '', dni: '', nacimiento: '', telefono: '', correo: '', usuario: '',
  rol: 'Docente', area: '', codigo: '', inicio: '', fin: '', estado: 'Activo', recuperacion: '', dosPasos: false,
  cambio: false, acceso: true, actividad: true, invitacion: false }
export const nombre = (p: Perfil) => [p.nombres, p.apellidos].filter(Boolean).join(' ')
export const hoy = () => new Date().toLocaleDateString('sv-SE')
export const fecha = (valor = '', conHora = false) => valor
  ? new Date(valor.length === 10 ? valor + 'T00:00:00' : valor).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    }) : '—'
export const correoOculto = (correo: string) => correo.split('@')[0].slice(0, 2) + '•••@' + correo.split('@')[1]
export const estadoActual = (p: Perfil): Estado => p.estado === 'Activo' && p.fin && p.fin < hoy() ? 'Vencido' : p.estado
export const claveValida = (clave: string) => clave.length >= 10 && /[A-Z]/.test(clave) && /[a-z]/.test(clave) && /[0-9]/.test(clave) && /[^\p{L}\p{N}\s]/u.test(clave)
export const evento = (accion: string): Evento => ({ fecha: new Date().toISOString(), accion, resultado: 'Exitoso', responsable: 'Administrador de demostración' })
export function nuevo(perfil: Perfil, accion = 'Usuario creado'): Usuario {
  return { ...perfil, id: crypto.randomUUID(), registro: new Date().toISOString(), sesiones: 0, eventos: [evento(accion)] }
}
export function validar(perfil: Perfil, usuarios: Usuario[], id?: string) {
  if (!perfil.nombres || !perfil.apellidos) return 'Nombres y apellidos son obligatorios.'
  if (!/^\d{8}$/.test(perfil.dni)) return 'El DNI debe tener 8 dígitos.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.correo)) return 'Ingresa un correo válido.'
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/i.test(perfil.usuario)) return 'El usuario debe tener de 3 a 40 caracteres válidos.'
  if (!roles.includes(perfil.rol)) return 'Selecciona un rol válido.'
  if (!estados.includes(perfil.estado)) return 'Selecciona un estado válido.'
  if (perfil.nacimiento && perfil.nacimiento > hoy()) return 'Revisa la fecha de nacimiento.'
  if (perfil.inicio && perfil.fin && perfil.fin < perfil.inicio) return 'El vencimiento debe ser posterior o igual a la fecha de inicio.'
  const iguales = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
  const otros = usuarios.filter(u => u.id !== id)
  if (otros.some(u => u.dni === perfil.dni)) return 'DNI duplicado.'
  if (otros.some(u => iguales(u.correo, perfil.correo))) return 'Correo duplicado.'
  if (otros.some(u => iguales(u.usuario, perfil.usuario))) return 'Nombre de usuario duplicado.'
  return ''
}
const semilla = [
  ['Administrador', 'del sistema', 'admin.sistema', 'Administrador', 'Dirección', 'Activo'],
  ['Luis', 'Ramos', 'director', 'Administrador', 'Dirección', 'Activo'],
  ['Maribel', 'Soto', 'm.secretaria', 'Personal adm.', 'Secretaría', 'Activo'],
  ['Rosa', 'Huamán', 'r.auxiliar', 'Personal adm.', 'Convivencia', 'Inactivo'],
  ['Juan', 'Pérez Ramírez', 'juan.perez', 'Docente', 'Matemática', 'Pendiente'],
  ['Ana', 'Medina', 'ana.medina', 'Docente', 'Comunicación', 'Bloqueado'],
] as const
const almacenamiento = 'mariscalito.m1.usuarios.v1'
export function leerUsuarios(): Usuario[] {
  const datos = localStorage.getItem(almacenamiento)
  if (datos !== null) {
    const usuarios: Usuario[] = JSON.parse(datos)
    if (!Array.isArray(usuarios) || usuarios.some(u => !u || !Array.isArray(u.eventos) || typeof u.usuario !== 'string')) throw new Error('Datos locales inválidos.')
    return usuarios
  }
  return semilla.map(([nombres, apellidos, usuario, rol, area, estado], i) => {
    const ultimo = i < 3 ? new Date(hoy() + 'T08:42:00').toISOString() : undefined
    return { ...inicial, nombres, apellidos, usuario, rol, area, estado, invitacion: estado === 'Pendiente',
      correo: usuario + '@mariscal.example', dni: String(90004582 + i), id: 'demo-' + i, codigo: 'INST-00' + (i + 1),
      registro: '2025-03-12', ultimo, dispositivo: ultimo ? 'Chrome · Windows' : undefined, sesiones: ultimo ? 1 : 0,
      eventos: ultimo ? [{ fecha: ultimo, accion: 'Inicio de sesión', responsable: nombres, resultado: 'Exitoso', ip: '192.0.2.' + (i + 1) }] : [] }
  })
}
export function escribirUsuarios(usuarios: Usuario[]) {
  localStorage.setItem(almacenamiento, JSON.stringify(usuarios))
}

export const columnasImportacion = ['nombres', 'apellidos', 'dni', 'correo', 'usuario', 'rol', 'area', 'codigo']
function separarCsv(texto: string) {
  texto = texto.replace(/^\uFEFF/, '')
  const sep = texto.split(/\r?\n/, 1)[0].includes(';') ? ';' : ','
  const filas: string[][] = [[]]
  let campo = '', comillas = false, cerrado = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += c; i++ }
      else if (c === '"') { comillas = false; cerrado = true }
      else campo += c
    } else if (c === sep || c === '\r' || c === '\n') {
      filas.at(-1)!.push(campo.trim())
      campo = ''
      cerrado = false
      if (c !== sep) {
        if (c === '\r' && texto[i + 1] === '\n') i++
        filas.push([])
      }
    } else if (c === '"' && !campo && !cerrado) comillas = true
    else if (c === '"' || cerrado) throw new Error('Revisa las comillas del archivo CSV.')
    else campo += c
  }
  if (comillas) throw new Error('El archivo contiene un campo entre comillas sin cerrar.')
  filas.at(-1)!.push(campo.trim())
  return filas
}
export async function leerArchivo(archivo: File, existentes: Usuario[]) {
  if (archivo.size > 5 * 1024 ** 2 || !/\.(csv|xlsx)$/i.test(archivo.name)) throw new Error('Selecciona un CSV o XLSX de hasta 5 MB.')
  const filas = /\.csv$/i.test(archivo.name) ? separarCsv(await archivo.text()) :
    (await (await import('read-excel-file/browser')).readSheet(archivo)).map(fila => fila.map(celda => String(celda ?? '').trim()))
  const cabecera = filas.shift()?.map(c => c.toLowerCase()) ?? []
  if (cabecera.length !== columnasImportacion.length || columnasImportacion.some(c => !cabecera.includes(c))) throw new Error('Las columnas deben coincidir con la plantilla.')
  const usuarios: Usuario[] = []
  const errores: string[] = []
  let duplicados = 0
  filas.forEach((fila, i) => {
    if (fila.every(c => !c)) return
    const campos = Object.fromEntries(cabecera.map((c, j) => [c, fila[j] ?? '']))
    const perfil = { ...inicial, ...campos, estado: 'Pendiente' as const }
    const error = fila.length > cabecera.length ? 'Hay columnas adicionales.' : validar(perfil, [...existentes, ...usuarios])
    if (error) {
      if (error.includes('duplicad')) duplicados++
      errores.push('Fila ' + (i + 2) + ' · ' + error)
    } else usuarios.push(nuevo(perfil, 'Usuario importado'))
  })
  if (!usuarios.length && !errores.length) errores.push('El archivo no contiene usuarios.')
  return { usuarios, errores, duplicados }
}
export function descargarCsv(archivo: string, filas: string[][]) {
  const csv = filas.map(fila => fila.map(c => '"' + (/^\s*[=+\-@]/.test(c) ? "'" + c : c).replaceAll('"', '""') + '"').join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = archivo
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
