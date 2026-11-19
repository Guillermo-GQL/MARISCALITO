export const roles = ['Administrador', 'Administrativo', 'Docente', 'Estudiante'] as const
export const estados = ['Activa', 'Inactiva', 'Bloqueada', 'Pendiente', 'Vencida'] as const
export type Rol = typeof roles[number]
export type Estado = typeof estados[number]
export type Acceso = {
  fecha: string; accion: string; dispositivo?: string; navegador?: string; lugar?: string
  resultado: 'Exitoso' | 'Rechazado'
}
export type Cuenta = {
  id: string; usuario: string; correo: string; rol: Rol; estado: Estado
  creada: string; ultimo?: string; sesiones: number; clave: 'Segura' | 'Renovar' | 'Vencida' | 'Temporal'
  segundoFactor: boolean; forzarCambio: boolean; recuperar: boolean; vencimiento: string
  intentos: number; limite: number; historial: Acceso[]
}
export type DatosCuenta = Pick<Cuenta, 'usuario' | 'correo' | 'rol' | 'estado' | 'segundoFactor' | 'forzarCambio' | 'recuperar' | 'vencimiento' | 'limite'>
const claveLocal = 'mariscalito.m1.cuentas.v1'
export const porDefecto = { segundoFactor: true, forzarCambio: true, recuperar: true, vencimiento: '', limite: 5 }
export function nuevaCuenta(datos: DatosCuenta, accion = 'Cuenta creada'): Cuenta {
  const fecha = new Date().toISOString()
  return { ...datos, id: crypto.randomUUID(), creada: fecha, sesiones: 0, clave: 'Temporal', intentos: 0,
    historial: [{ fecha, accion, resultado: 'Exitoso' }] }
}
export function fechaLocal(dias = 0) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-')
}
const filas = [
  ['admin.root', 'Administrador', 'Activa', 'Segura', 2, 0, '09:30', '2024-01-12'],
  ['lparedes', 'Administrativo', 'Activa', 'Renovar', 1, 0, '08:42', '2024-03-03'],
  ['cmedina', 'Docente', 'Bloqueada', 'Vencida', 0, 1, '18:12', '2024-04-18'],
  ['jvargas', 'Docente', 'Pendiente', 'Temporal', 0, null, '', '2026-10-02'],
  ['rsoto', 'Estudiante', 'Inactiva', 'Segura', 0, 7, '13:05', '2025-02-21'],
  ['mariasalazar', 'Administrativo', 'Vencida', 'Vencida', 0, 14, '16:44', '2024-01-10'],
] as const
function ejemplos(): Cuenta[] {
  return filas.map(([usuario, rol, estado, clave, sesiones, dias, hora, creada], i) => {
    const ultimo = dias === null ? undefined : new Date(fechaLocal(dias) + 'T' + hora).toISOString()
    const rechazado = estado === 'Bloqueada' || estado === 'Vencida'
    return { ...porDefecto, id: String(1024 + i), usuario, correo: usuario + '@mariscal.example', rol, estado, clave,
      sesiones, ultimo, creada, segundoFactor: i < 2, intentos: estado === 'Bloqueada' ? 5 : i === 1 ? 1 : 0,
      historial: ultimo ? [{ fecha: ultimo, accion: estado === 'Bloqueada' ? 'Cuenta bloqueada por intentos fallidos' :
        estado === 'Vencida' ? 'Intento con cuenta vencida' : estado === 'Inactiva' ? 'Sesión cerrada por el administrador' : 'Inicio de sesión exitoso',
        dispositivo: i === 2 || i === 4 ? 'Android' : 'Windows', navegador: i === 1 ? 'Edge' : 'Chrome',
        lugar: i === 1 ? 'Tayacaja' : 'Huancavelica', resultado: rechazado ? 'Rechazado' : 'Exitoso' }] : [] }
  })
}
export function leerCuentas(): Cuenta[] {
  const guardado = localStorage.getItem(claveLocal)
  if (guardado === null) return ejemplos()
  const cuentas: Cuenta[] = JSON.parse(guardado)
  if (!Array.isArray(cuentas) || cuentas.some(c => typeof c.usuario !== 'string' || !Array.isArray(c.historial))) {
    throw new Error('Registro inválido')
  }
  return cuentas
}
export function guardarCuentas(cuentas: Cuenta[]) {
  localStorage.setItem(claveLocal, JSON.stringify(cuentas))
}
export const segura = (clave: string) => clave.length >= 10 && /[A-Z]/.test(clave) && /[a-z]/.test(clave) &&
  /[0-9]/.test(clave) && /[^\p{L}\p{N}\s]/u.test(clave)
export const usuarioValido = (usuario: string) => /^[a-z0-9][a-z0-9._-]{2,39}$/i.test(usuario)
export const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
export const duplicada = (cuentas: Cuenta[], usuario: string, correo: string, id?: string) =>
  cuentas.some(c => c.id !== id && (c.usuario.toLowerCase() === usuario.toLowerCase() || c.correo.toLowerCase() === correo.toLowerCase()))
export function correoProtegido(correo: string) {
  const [nombre, dominio] = correo.split('@')
  return nombre[0] + '••••@' + dominio
}
export function fechaVista(fecha: string, hora = false) {
  const date = new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha)
  if (hora) {
    const dia = fecha >= new Date(fechaLocal() + 'T00:00:00').toISOString() ? 'Hoy' :
      fecha >= new Date(fechaLocal(1) + 'T00:00:00').toISOString() ? 'Ayer' :
        date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    return dia + ' · ' + date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function exportar(nombre: string, filas: (string | number)[][]) {
  const csv = filas.map(fila => fila.map(celda => {
    const valor = String(celda)
    return '"' + (/^[\s]*[=+\-@]/.test(valor) ? "'" + valor : valor).replaceAll('"', '""') + '"'
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function analizarImportacion(texto: string, existentes: Cuenta[]) {
  texto = texto.replace(/^\uFEFF/, '')
  // Las comillas dobles permiten campos con comas y saltos de línea.
  const filas: string[][] = [[]]
  let campo = ''
  let entreComillas = false
  let cerrado = false
  for (let i = 0; i < texto.length; i++) {
    const letra = texto[i]
    if (entreComillas) {
      if (letra === '"' && texto[i + 1] === '"') { campo += '"'; i++; continue }
      if (letra === '"') { entreComillas = false; cerrado = true } else campo += letra
      continue
    }
    if (letra === ',' || letra === '\n' || letra === '\r') {
      filas.at(-1)!.push(campo.trim())
      campo = ''
      cerrado = false
      if (letra !== ',') {
        if (letra === '\r' && texto[i + 1] === '\n') i++
        filas.push([])
      }
    } else if (letra === '"' && !campo && !cerrado) entreComillas = true
    else if (letra === '"' || cerrado) throw new Error('Hay comillas fuera de lugar en el archivo CSV.')
    else campo += letra
  }
  if (entreComillas) throw new Error('Hay un campo sin cerrar en el archivo CSV.')
  filas.at(-1)!.push(campo.trim())
  if (filas.shift()?.join(',').toLowerCase() !== 'usuario,correo,rol,contrasena') {
    throw new Error('Usa la plantilla CSV con las columnas usuario, correo, rol y contrasena.')
  }
  const errores: string[] = []
  const cuentas: Cuenta[] = []
  filas.forEach((fila, i) => {
    if (fila.every(valor => !valor)) return
    const [usuario, correo, rol, clave] = fila
    const motivo = fila.length !== 4 ? 'se esperan cuatro columnas' :
      !usuarioValido(usuario) ? 'nombre de usuario inválido' : !correoValido(correo) ? 'correo inválido' :
        !roles.includes(rol as Rol) ? 'rol inválido' : !segura(clave) ? 'contraseña temporal débil' :
          duplicada(existentes, usuario, correo) || duplicada(cuentas, usuario, correo) ? 'usuario o correo duplicado' : ''
    if (motivo) errores.push('Fila ' + (i + 2) + ' · ' + motivo)
    else cuentas.push(nuevaCuenta({ ...porDefecto, usuario, correo, rol: rol as Rol, estado: 'Pendiente' }, 'Cuenta importada'))
  })
  if (!errores.length && !cuentas.length) errores.push('El archivo no contiene cuentas.')
  return { errores, cuentas }
}
