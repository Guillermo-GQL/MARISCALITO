import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import { Button, ConfirmDialog, useNotify } from '../../../compartido/componentes'
import './identidad.css'

type Config = { nombre: string; version: string; institucion: string; logo: string | null }
type Archivo = { nombre: string; tamano: number; tipo: string }
type Modo = 'lectura' | 'edicion' | 'guardando'
type Dialogo = 'restablecer' | 'eliminar-logo' | 'salir' | null
type Resultado = 'guardado' | 'restablecido' | null
type Campo = 'nombre' | 'version' | 'institucion'

const CONFIG_INICIAL: Config = {
  nombre: 'Sistema de Gestión de Matrículas y Asistencias',
  version: '1.0.0',
  institucion: 'I.E. Mariscal Castilla',
  logo: '/escudo.png',
}

// La última configuración guardada vive fuera del componente para que no se pierda al cambiar de sección.
let configuracionGuardada: Config = CONFIG_INICIAL

const TAMANO_MAXIMO = 2 * 1024 * 1024
const TIPOS_VALIDOS = ['image/png', 'image/jpeg']

const iguales = (a: Config, b: Config) =>
  a.nombre === b.nombre && a.version === b.version && a.institucion === b.institucion && a.logo === b.logo

const validar = (config: Config) => {
  const errores: Partial<Record<Campo, string>> = {}
  if (!config.nombre.trim()) errores.nombre = 'Ingresa el nombre del sistema.'
  if (!/^\d+\.\d+\.\d+$/.test(config.version.trim())) errores.version = 'Usa el formato mayor.menor.revisión, por ejemplo 1.0.1.'
  if (!config.institucion.trim()) errores.institucion = 'Ingresa el nombre completo de la institución.'
  return errores
}

const formatoKb = (bytes: number) => Math.max(1, Math.round(bytes / 1024)) + ' KB'

type NombreIcono = 'candado' | 'lapiz' | 'subir' | 'info' | 'check' | 'alerta' | 'imagen' | 'reiniciar' | 'cerrar' | 'guardar'
const TRAZOS: Record<NombreIcono, ReactNode> = {
  candado: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  lapiz: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  subir: <><path d="M7 18a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 10.7 1A3.5 3.5 0 0 1 17 18" /><path d="M12 12v8M9 14.5l3-3 3 3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>,
  alerta: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  imagen: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M5 17l5-5 3 3 2-2 4 4" /></>,
  reiniciar: <><path d="M4 12a8 8 0 1 0 2.6-5.9" /><path d="M4 4v4h4" /></>,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  guardar: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>,
}

function Icono({ nombre, tamano = 18 }: { nombre: NombreIcono; tamano?: number }) {
  return <svg className="id-icono" width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TRAZOS[nombre]}</svg>
}

type Campos = { id: Campo; etiqueta: string; ayuda: string }
const CAMPOS: Campos[] = [
  { id: 'nombre', etiqueta: 'Nombre del sistema', ayuda: 'Nombre visible en el acceso y navegación de la plataforma.' },
  { id: 'version', etiqueta: 'Versión actual', ayuda: 'Utiliza el formato de versión mayor.menor.revisión.' },
  { id: 'institucion', etiqueta: 'Nombre completo de la institución educativa', ayuda: 'Escribe la denominación institucional oficial.' },
]

export function IdentidadSistema() {
  const notificar = useNotify()
  const baseId = useId()
  const entradaArchivo = useRef<HTMLInputElement>(null)
  const temporizadores = useRef<number[]>([])
  const urlsTemporales = useRef<string[]>([])

  const [modo, setModo] = useState<Modo>('lectura')
  const [guardada, setGuardada] = useState<Config>(configuracionGuardada)
  const [borrador, setBorrador] = useState<Config>(configuracionGuardada)
  const [archivo, setArchivo] = useState<Archivo | null>(null)
  const [cargando, setCargando] = useState<Archivo | null>(null)
  const [errorLogo, setErrorLogo] = useState(false)
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({})
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [destinoSalida, setDestinoSalida] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado>(null)

  const editando = modo === 'edicion'
  const bloqueado = modo !== 'edicion'
  const hayCambios = !iguales(borrador, guardada)
  const logoEliminado = hayCambios && borrador.logo === null && guardada.logo !== null

  useEffect(() => () => {
    temporizadores.current.forEach(window.clearTimeout)
    urlsTemporales.current.forEach(URL.revokeObjectURL)
  }, [])

  // Aviso del navegador al recargar o cerrar la pestaña con cambios pendientes.
  useEffect(() => {
    if (!hayCambios) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  // Con cambios sin guardar, los enlaces internos piden confirmación antes de salir de la pantalla.
  useEffect(() => {
    if (!hayCambios) return
    const interceptar = (evento: MouseEvent) => {
      const enlace = (evento.target as Element | null)?.closest?.('a[href^="#"]')
      const destino = enlace?.getAttribute('href')
      if (!destino || destino === '#identidad') return
      evento.preventDefault()
      evento.stopPropagation()
      setDestinoSalida(destino)
      setDialogo('salir')
    }
    document.addEventListener('click', interceptar, true)
    return () => document.removeEventListener('click', interceptar, true)
  }, [hayCambios])

  const programar = (accion: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(accion, ms))
  }

  const cambiarCampo = (campo: Campo, valor: string) => {
    setBorrador(actual => ({ ...actual, [campo]: valor }))
    setErrores(actual => ({ ...actual, [campo]: undefined }))
  }

  const empezarEdicion = () => {
    setResultado(null)
    setErrorLogo(false)
    setModo('edicion')
  }

  const salirDeEdicion = () => {
    setBorrador(guardada)
    setArchivo(null)
    setCargando(null)
    setErrorLogo(false)
    setErrores({})
    setModo('lectura')
  }

  const cancelar = () => {
    if (hayCambios) { setDestinoSalida(null); setDialogo('salir') } else salirDeEdicion()
  }

  const confirmarSalida = () => {
    setDialogo(null)
    if (destinoSalida) { location.hash = destinoSalida.slice(1); return }
    salirDeEdicion()
  }

  const confirmarRestablecer = () => {
    setDialogo(null)
    setBorrador(guardada)
    setArchivo(null)
    setCargando(null)
    setErrorLogo(false)
    setErrores({})
    setModo('lectura')
    setResultado('restablecido')
    notificar({ type: 'success', message: 'Configuración restablecida correctamente' })
  }

  const confirmarEliminarLogo = () => {
    setDialogo(null)
    setArchivo(null)
    setErrorLogo(false)
    setBorrador(actual => ({ ...actual, logo: null }))
  }

  const guardar = () => {
    const encontrados = validar(borrador)
    setErrores(encontrados)
    const primero = (Object.keys(encontrados) as Campo[])[0]
    if (primero) { document.getElementById(baseId + primero)?.focus(); return }
    setModo('guardando')
    programar(() => {
      const nueva = { ...borrador, nombre: borrador.nombre.trim(), version: borrador.version.trim(), institucion: borrador.institucion.trim() }
      configuracionGuardada = nueva
      setGuardada(nueva)
      setBorrador(nueva)
      setArchivo(null)
      setModo('lectura')
      setResultado('guardado')
      notificar({ type: 'success', message: 'Cambios guardados correctamente' })
    }, 1200)
  }

  const elegirArchivo = (archivoElegido?: File) => {
    if (!archivoElegido || !editando || cargando) return
    if (!TIPOS_VALIDOS.includes(archivoElegido.type) || archivoElegido.size > TAMANO_MAXIMO) {
      setErrorLogo(true)
      notificar({ type: 'error', message: 'Archivo no válido. Usa un logo PNG, JPG o JPEG de hasta 2 MB.' })
      return
    }
    setErrorLogo(false)
    const informacion: Archivo = { nombre: archivoElegido.name, tamano: archivoElegido.size, tipo: archivoElegido.type === 'image/png' ? 'PNG' : 'JPG' }
    setCargando(informacion)
    const url = URL.createObjectURL(archivoElegido)
    urlsTemporales.current.push(url)
    programar(() => {
      setBorrador(actual => ({ ...actual, logo: url }))
      setArchivo(informacion)
      setCargando(null)
    }, 1000)
  }

  const alSeleccionar = (evento: ChangeEvent<HTMLInputElement>) => {
    elegirArchivo(evento.target.files?.[0])
    evento.target.value = ''
  }

  const alSoltar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault()
    elegirArchivo(evento.dataTransfer.files?.[0])
  }

  // Estado de la pantalla, mostrado junto al título.
  const estado = modo === 'guardando'
    ? { texto: 'Guardando configuración…', tono: 'info' }
    : cargando
      ? { texto: 'Cargando logo', tono: 'info' }
      : modo === 'lectura'
        ? { texto: 'Solo lectura', tono: 'neutro' }
        : hayCambios
          ? { texto: 'Cambios sin guardar', tono: 'aviso' }
          : { texto: 'Editando', tono: 'info' }

  // Mensaje y etiqueta de la vista previa.
  const vista = modo === 'guardando'
    ? { etiqueta: 'Actualizando…', mensaje: 'Guardando configuración', tono: 'info' }
    : cargando
      ? { etiqueta: 'Actualizando…', mensaje: 'Cargando logo seleccionado', tono: 'info' }
      : errorLogo
        ? { etiqueta: 'Vista previa no guardada', mensaje: 'No se pudo cargar el logo seleccionado', tono: 'error' }
        : logoEliminado
          ? { etiqueta: 'Vista previa no guardada', mensaje: 'Logo eliminado, cambios sin guardar', tono: 'aviso' }
          : hayCambios
            ? { etiqueta: 'Vista previa no guardada', mensaje: 'Vista previa no guardada', tono: 'aviso' }
            : resultado === 'guardado'
              ? { etiqueta: 'Guardado', mensaje: 'Cambios guardados correctamente', tono: 'exito' }
              : resultado === 'restablecido'
                ? { etiqueta: 'Guardado', mensaje: 'Configuración restablecida correctamente', tono: 'exito' }
                : { etiqueta: 'Vista previa actualizada', mensaje: 'Vista previa actualizada', tono: 'exito' }

  const zonaLogo = (() => {
    if (cargando) return {
      titulo: 'Cargando ' + cargando.nombre + ' · ' + formatoKb(cargando.tamano),
      lineas: ['Validando formato ' + cargando.tipo, 'Tamaño del archivo: ' + formatoKb(cargando.tamano), 'La vista previa conservará el logo anterior hasta finalizar'],
    }
    if (borrador.logo === null) return {
      titulo: 'Sin logo institucional',
      lineas: ['Agrega un archivo PNG, JPG o JPEG', 'Tamaño máximo: 2 MB', 'La vista previa usa un contenedor alternativo'],
    }
    if (archivo) return {
      titulo: archivo.nombre,
      lineas: [archivo.tipo + ' · ' + formatoKb(archivo.tamano) + ' · Carga completada', 'Vista previa actualizada al instante', 'Reemplaza o elimina el archivo antes de guardar'],
    }
    return {
      titulo: 'Selecciona o arrastra el logo institucional',
      lineas: ['Formatos permitidos: PNG, JPG o JPEG', 'Tamaño máximo: 2 MB', 'Se recomienda una imagen cuadrada'],
    }
  })()

  const sinLogo = borrador.logo === null && !cargando
  const textoBotonLogo = cargando ? 'Procesando archivo' : sinLogo ? 'Agregar logo' : archivo ? 'Reemplazar archivo' : 'Seleccionar archivo'
  const nombreInstitucionVista = borrador.institucion.trim() || 'Institución educativa'

  return <div className="id-pantalla">
    <header className="id-encabezado">
      <div>
        <h1>Identidad del sistema</h1>
        <p>Configura la información institucional visible en la plataforma</p>
      </div>
      <span className={'id-estado id-estado-' + estado.tono} role="status">
        {modo === 'lectura' && !cargando && <Icono nombre="candado" tamano={13} />}{estado.texto}
      </span>
    </header>

    <div className="id-acciones" role="group" aria-label="Acciones de la configuración">
      <Button variant="primary" className="id-editar" disabled={editando || modo === 'guardando'} onClick={empezarEdicion}>
        <Icono nombre="lapiz" tamano={16} />Editar
      </Button>
      <Button className={editando ? 'id-restablecer id-restablecer-rojo' : 'id-restablecer'} disabled={modo === 'guardando'} onClick={() => setDialogo('restablecer')}>
        <Icono nombre="reiniciar" tamano={16} />Restablecer
      </Button>
      <Button className="id-guardar" disabled={!editando || !hayCambios || !!cargando} onClick={guardar}>
        {modo === 'guardando'
          ? <><span className="id-girando" aria-hidden="true" />Guardando…</>
          : <><Icono nombre="guardar" tamano={16} />Guardar cambios</>}
      </Button>
      {editando &&
        <Button className="id-cancelar" onClick={cancelar}><Icono nombre="cerrar" tamano={16} />Cancelar</Button>}
    </div>

    <div className="id-rejilla">
      <div className="id-columna">
        <section className="id-tarjeta" aria-labelledby={baseId + 'info'}>
          <h2 id={baseId + 'info'}>Información del sistema</h2>
          <p className="id-subtitulo">Datos principales de identificación de la plataforma</p>
          {CAMPOS.map(campo => <div className="id-campo" key={campo.id}>
            <label htmlFor={baseId + campo.id}>{campo.etiqueta} <span aria-hidden="true">*</span></label>
            <div className="id-entrada">
              <input id={baseId + campo.id} value={borrador[campo.id]} disabled={bloqueado} required
                aria-invalid={errores[campo.id] ? true : undefined}
                aria-describedby={baseId + campo.id + 'ayuda'}
                onChange={evento => cambiarCampo(campo.id, evento.target.value)} />
              <Icono nombre={bloqueado ? 'candado' : 'lapiz'} tamano={16} />
            </div>
            <small id={baseId + campo.id + 'ayuda'} className={errores[campo.id] ? 'id-error' : undefined}>
              {errores[campo.id] ?? campo.ayuda}
            </small>
          </div>)}
          <p className="id-obligatorios">* Campos obligatorios</p>
        </section>

        <section className="id-tarjeta" aria-labelledby={baseId + 'logo'}>
          <h2 id={baseId + 'logo'}>Logo institucional</h2>
          <p className="id-subtitulo">Este logotipo aparecerá en el inicio de sesión, menú y documentos del sistema.</p>
          <div className="id-logo">
            <div className={'id-logo-miniatura' + (borrador.logo ? '' : ' id-logo-vacio')} aria-hidden="true">
              {borrador.logo ? <img src={borrador.logo} alt="" /> : <Icono nombre="imagen" tamano={26} />}
            </div>
            <div className={'id-zona' + (bloqueado ? ' id-zona-bloqueada' : '') + (errorLogo ? ' id-zona-error' : '')}
              onDragOver={evento => { if (editando) evento.preventDefault() }} onDrop={alSoltar}>
              <p className="id-zona-titulo"><Icono nombre="subir" tamano={20} />{zonaLogo.titulo}</p>
              {zonaLogo.lineas.map(linea => <small key={linea}>{linea}</small>)}
              {cargando && <div className="id-progreso" role="progressbar" aria-label="Cargando logo"><span /></div>}
              <div className="id-zona-botones">
                <input ref={entradaArchivo} type="file" accept="image/png,image/jpeg" hidden onChange={alSeleccionar} />
                <Button disabled={bloqueado || !!cargando} onClick={() => entradaArchivo.current?.click()}>
                  <Icono nombre="subir" tamano={16} />{textoBotonLogo}
                </Button>
                {editando && borrador.logo !== null && !cargando &&
                  <Button variant="danger" onClick={() => setDialogo('eliminar-logo')}>Eliminar logo</Button>}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="id-columna">
        <section className="id-tarjeta id-vista" aria-label="Vista previa institucional">
          <div className="id-mini">
            <div className="id-mini-cabecera">
              <span className="id-mini-logo">
                {borrador.logo ? <img src={borrador.logo} alt="" /> : <Icono nombre="imagen" tamano={14} />}
              </span>
              <span className="id-mini-institucion"><strong>{nombreInstitucionVista}</strong><small>Administrador del sistema</small></span>
              <span className="id-mini-punto" /><span className="id-mini-avatar">TI</span>
            </div>
            <div className="id-mini-cuerpo">
              <ul className="id-mini-menu">
                <li>Panel principal</li><li className="id-activo">Identidad</li><li>Módulos</li><li>Menús</li>
              </ul>
              <div className="id-mini-contenido">
                <div className="id-mini-titulo">
                  <div><strong>{borrador.nombre.trim() || 'Nombre del sistema'}</strong><small>Versión {borrador.version.trim() || '—'}</small></div>
                  <span className={'id-mini-etiqueta id-tono-' + vista.tono}>{vista.etiqueta}</span>
                </div>
                <dl className="id-mini-datos">
                  <div><dd>12</dd><dt>Módulos</dt></div>
                  <div><dd>277</dd><dt>Usuarios</dt></div>
                  <div><dd>6</dd><dt>Accesos</dt></div>
                </dl>
                <div className="id-mini-modulo">
                  <small>MÓDULO SELECCIONADO</small>
                  <div><strong>Administrar sistema</strong><span>Activo</span></div>
                  <i className="id-barra id-barra-azul" /><i className="id-barra id-barra-amarilla" />
                </div>
                <p className={'id-mini-mensaje id-tono-' + vista.tono} role="status">{vista.mensaje}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="id-tarjeta id-recomendaciones" aria-labelledby={baseId + 'rec'}>
          <h2 id={baseId + 'rec'}>Recomendaciones</h2>
          <ul>
            <li>Utiliza un logo institucional de buena resolución.</li>
            <li>Se recomienda una imagen cuadrada.</li>
            <li>El tamaño máximo permitido es de 2 MB.</li>
            <li>Los cambios se reflejarán en el login y en el menú principal.</li>
            <li>Revisa la vista previa antes de guardar.</li>
          </ul>
        </section>

        <p className="id-nota"><Icono nombre="info" tamano={16} /><span>La vista previa se actualiza al editar.<br />Los cambios serán definitivos únicamente al guardar la configuración.</span></p>
      </div>
    </div>

    {dialogo === 'restablecer' &&
      <ConfirmDialog title="¿Restablecer configuración?" danger confirmLabel="Sí, restablecer" cancelLabel="No, cancelar"
        onClose={() => setDialogo(null)} onConfirm={confirmarRestablecer}>
        Se descartarán los cambios no guardados y se restaurará la última configuración guardada.
      </ConfirmDialog>}
    {dialogo === 'eliminar-logo' &&
      <ConfirmDialog title="¿Eliminar logo institucional?" danger confirmLabel="Sí, eliminar" cancelLabel="No, cancelar"
        onClose={() => setDialogo(null)} onConfirm={confirmarEliminarLogo}>
        El logo se retirará de la vista previa. El cambio se aplicará al guardar la configuración.
      </ConfirmDialog>}
    {dialogo === 'salir' &&
      <ConfirmDialog title="Hay cambios sin guardar" confirmLabel="Sí, salir" cancelLabel="No, permanecer"
        onClose={() => { setDialogo(null); setDestinoSalida(null) }} onConfirm={confirmarSalida}>
        Hay cambios sin guardar. ¿Deseas salir de esta pantalla?
      </ConfirmDialog>}
  </div>
}
