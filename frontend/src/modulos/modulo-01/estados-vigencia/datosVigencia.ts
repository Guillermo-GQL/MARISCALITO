export const estados = ['Activo', 'Bloqueado', 'Pendiente', 'Inactivo', 'Suspendido'] as const
export const vigencias = ['Vigente', 'Próximo a vencer', 'Vencido', 'Por iniciar'] as const
export type Estado = typeof estados[number]
export type Vigencia = typeof vigencias[number]
export type CuentaVigencia = {
  id: string; nombre: string; usuario: string; dni: string; correo: string; rol: string
  inicio: string; fin: string; estado: Estado; historial: { fecha: string; texto: string }[]
}
const almacenamiento = 'mariscalito.m1.vigencia.v1'
export function fechaLocal(dias = 0) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-')
}
export function calcularVigencia(cuenta: Pick<CuentaVigencia, 'inicio' | 'fin'>): Vigencia {
  const hoy = fechaLocal()
  if (cuenta.fin < hoy) return 'Vencido'
  if (cuenta.inicio > hoy) return 'Por iniciar'
  return cuenta.fin <= fechaLocal(30) ? 'Próximo a vencer' : 'Vigente'
}
export const verFecha = (fecha: string) => fecha.split('-').reverse().join('/')
export const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const muestra = [
  ['Ana López', 'ana.lopez', 'Docente', -120, 240, 'Activo'],
  ['Luis Mendoza', 'luis.mendoza', 'Personal administrativo', -160, 12, 'Bloqueado'],
  ['María Cárdenas', 'maria.cardenas', 'Docente', -80, 160, 'Pendiente'],
  ['Jorge Salazar', 'jorge.salazar', 'Personal administrativo', -300, -45, 'Inactivo'],
  ['Rosa Huamán', 'rosa.huaman', 'Estudiante', -45, 320, 'Suspendido'],
  ['Elena Rojas', 'elena.rojas', 'Docente', -200, 21, 'Activo'],
  ['Carlos Ramos', 'carlos.ramos', 'Estudiante', 10, 190, 'Pendiente'],
] as const
export function consultar(): CuentaVigencia[] {
  const contenido = localStorage.getItem(almacenamiento)
  if (contenido !== null) {
    const cuentas: CuentaVigencia[] = JSON.parse(contenido)
    if (!Array.isArray(cuentas) || cuentas.some(c => !c || !Array.isArray(c.historial) || !estados.includes(c.estado))) {
      throw new Error('El registro local tiene un formato inválido.')
    }
    return cuentas
  }
  return muestra.map(([nombre, usuario, rol, inicio, fin, estado], i) => ({
    id: usuario, nombre, usuario, rol, dni: String(90000042 + i), correo: usuario + '@mariscal.example',
    inicio: fechaLocal(inicio), fin: fechaLocal(fin), estado, historial: [],
  }))
}
export function actualizarCuenta(id: string, datos: Pick<CuentaVigencia, 'inicio' | 'fin'> | Pick<CuentaVigencia, 'estado'>) {
  const cuentas = consultar()
  if (!cuentas.some(c => c.id === id)) throw new Error('La cuenta ya no está disponible.')
  const nuevas = cuentas.map(cuenta => {
    if (cuenta.id !== id) return cuenta
    const cambio = 'estado' in datos ? 'Estado cambiado a ' + datos.estado :
      'Vigencia actualizada del ' + verFecha(datos.inicio) + ' al ' + verFecha(datos.fin)
    return { ...cuenta, ...datos, historial: [{ fecha: new Date().toISOString(), texto: cambio }, ...cuenta.historial] }
  })
  localStorage.setItem(almacenamiento, JSON.stringify(nuevas))
  return nuevas
}
