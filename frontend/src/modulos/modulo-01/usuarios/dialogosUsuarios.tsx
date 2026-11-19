import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button, UnsavedDialog } from '../../../compartido/componentes'
import { areas, claveValida, columnasImportacion, correoOculto, descargarCsv, estadoActual, estados, fecha, inicial, leerArchivo, nombre, roles, validar } from './datosUsuarios'
import type { Perfil, Usuario } from './datosUsuarios'

export function Dialogo({ titulo, descripcion, ancho, cerrar, children }: {
  titulo: string; descripcion?: string; ancho?: string; cerrar: () => void; children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialogo = ref.current
    const previo = document.activeElement
    dialogo?.showModal()
    return () => {
      dialogo?.close()
      if (previo instanceof HTMLElement && previo.isConnected) previo.focus()
    }
  }, [])
  return <dialog ref={ref} className={'gu-dialog ' + (ancho ?? '')} aria-labelledby={id} onCancel={e => { e.preventDefault(); cerrar() }}>
    <header><div><h2 id={id}>{titulo}</h2>{descripcion && <p>{descripcion}</p>}</div><Button aria-label="Cerrar" onClick={cerrar}>×</Button></header>
    {children}
  </dialog>
}
export function Etiqueta({ estado }: { estado: string }) {
  return <span className={'gu-tag gu-' + estado.toLowerCase()}>{estado}</span>
}
export function Avatar({ usuario }: { usuario: Usuario }) {
  return <span className="gu-avatar" aria-hidden="true">{(usuario.nombres[0] + (usuario.apellidos[0] ?? '')).toUpperCase()}</span>
}
export function Formulario({ usuario, existentes, cerrar, guardar }: {
  usuario?: Usuario; existentes: Usuario[]; cerrar: () => void; guardar: (perfil: Perfil) => string | void
}) {
  const base = usuario ?? inicial
  const [error, setError] = useState('')
  const [cambios, setCambios] = useState(false)
  const [descartar, setDescartar] = useState(false)
  const salir = () => cambios ? setDescartar(true) : cerrar()
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const valor = (campo: string) => String(datos.get(campo) ?? '').trim()
    const textuales = ['nombres', 'apellidos', 'dni', 'nacimiento', 'telefono', 'correo', 'usuario', 'rol', 'area', 'codigo', 'inicio', 'fin', 'estado', 'recuperacion'] as const
    const perfil: Perfil = { ...inicial, ...Object.fromEntries(textuales.map(campo => [campo, valor(campo)])),
      dosPasos: datos.has('dosPasos'), cambio: datos.has('cambio'), acceso: datos.has('acceso'),
      actividad: datos.has('actividad'), invitacion: datos.has('invitacion') }
    const problema = validar(perfil, existentes, usuario?.id)
    if (problema) return setError(problema)
    if (!usuario && !claveValida(String(datos.get('clave')))) return setError('La contraseña de prueba necesita 10 caracteres, mayúscula, minúscula, número y símbolo.')
    if (!usuario && datos.get('clave') !== datos.get('confirmacion')) return setError('Las contraseñas deben coincidir.')
    const fallo = guardar(perfil)
    if (fallo) setError(fallo)
  }
  return <Dialogo titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'} descripcion="Registra los datos personales, institucionales y de acceso." ancho="gu-wide" cerrar={salir}>
    <form onSubmit={enviar} onChange={() => { setCambios(true); setError('') }}>
      <h3>Datos personales</h3>
      <div className="gu-fields">
        <label>Nombres *<input name="nombres" required maxLength={100} defaultValue={base.nombres}/></label>
        <label>Apellidos *<input name="apellidos" required maxLength={100} defaultValue={base.apellidos}/></label>
        <label>DNI *<input name="dni" required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} defaultValue={base.dni}/></label>
        <label>Fecha de nacimiento<input name="nacimiento" type="date" defaultValue={base.nacimiento}/></label>
        <label>Teléfono<input name="telefono" type="tel" maxLength={25} defaultValue={base.telefono}/></label>
        <label>Correo institucional *<input name="correo" type="email" required maxLength={150} defaultValue={base.correo}/></label>
      </div>
      <h3>Datos de acceso</h3>
      <div className="gu-fields">
        <label>Nombre de usuario *<input name="usuario" required maxLength={40} defaultValue={base.usuario}/></label>
        {!usuario && <>
          <label>Contraseña temporal *<input name="clave" type="password" autoComplete="new-password" required maxLength={128}/></label>
          <label>Confirmar contraseña *<input name="confirmacion" type="password" autoComplete="new-password" required maxLength={128}/></label>
        </>}
        <label>Método de recuperación<select name="recuperacion" defaultValue={base.recuperacion}><option value="">Selecciona</option><option>Correo institucional</option><option>Administrador</option></select></label>
        <label className="gu-check"><input name="dosPasos" type="checkbox" role="switch" defaultChecked={base.dosPasos}/> Autenticación en dos pasos</label>
      </div>
      <h3>Datos institucionales</h3>
      <div className="gu-fields">
        <label>Rol *<select name="rol" required defaultValue={usuario?.rol ?? ''}><option value="">Selecciona un rol</option>{roles.map(rol => <option key={rol}>{rol}</option>)}</select></label>
        <label>Área o dependencia<select name="area" defaultValue={base.area}><option value="">Selecciona un área</option>{[...new Set([...areas, ...(base.area ? [base.area] : [])])].map(area => <option key={area}>{area}</option>)}</select></label>
        <label>Código institucional<input name="codigo" maxLength={35} defaultValue={base.codigo}/></label>
        <label>Fecha de inicio<input type="date" name="inicio" defaultValue={base.inicio}/></label>
        <label>Fecha de vencimiento<input type="date" name="fin" defaultValue={base.fin}/></label>
        <label>Estado<select name="estado" defaultValue={base.estado}>{estados.map(estado => <option key={estado}>{estado}</option>)}</select></label>
      </div>
      <h3>Seguridad</h3>
      <div className="gu-options">
        {([['cambio', 'Solicitar cambio de contraseña en el primer acceso'], ['acceso', 'Permitir acceso al sistema'],
          ['actividad', 'Registrar actividad del usuario'], ['invitacion', 'Registrar invitación de demostración']] as const).map(([campo, texto]) =>
          <label className="gu-check" key={campo}><input name={campo} type="checkbox" defaultChecked={base[campo]}/> {texto}</label>)}
      </div>
      {error && <p className="gu-error" role="alert">{error}</p>}
      <footer><Button onClick={salir}>Cancelar</Button><Button type="submit" variant="primary">{usuario ? 'Guardar cambios' : 'Crear usuario'}</Button></footer>
    </form>
    {descartar && <UnsavedDialog onStay={() => setDescartar(false)} onDiscard={cerrar}/>}
  </Dialogo>
}
export function Importar({ existentes, cerrar, guardar }: { existentes: Usuario[]; cerrar: () => void; guardar: (usuarios: Usuario[]) => string | void }) {
  const input = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File>()
  const [revision, setRevision] = useState<Awaited<ReturnType<typeof leerArchivo>>>()
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  async function abrir(file?: File) {
    if (!file || cargando) return
    setArchivo(file)
    setError('')
    setRevision(undefined)
    setCargando(true)
    try { setRevision(await leerArchivo(file, existentes)) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.') }
    finally { setCargando(false) }
  }
  return <Dialogo titulo="Importar usuarios" descripcion="Carga una plantilla XLSX o CSV y valida los registros antes de importar." ancho="gu-medium" cerrar={cerrar}>
    <div className="gu-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void abrir(e.dataTransfer.files[0]) }}>
      <strong>{archivo?.name ?? 'Arrastra el archivo aquí o selecciona uno'}</strong>
      <p>CSV o XLSX · máximo 5 MB</p>
      <input hidden ref={input} type="file" accept=".csv,.xlsx" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void abrir(file) }}/>
      <Button onClick={() => input.current?.click()} disabled={cargando}>Seleccionar archivo</Button>
    </div>
    <Button onClick={() => descargarCsv('plantilla-usuarios.csv', [columnasImportacion])}>Descargar plantilla CSV</Button>
    {cargando && <p role="status">Validando registros…</p>}
    {revision && <div className="gu-preview">
      <strong>Vista previa de registros</strong>
      <p>{revision.usuarios.length} válidos · {revision.duplicados} duplicados · {revision.errores.length - revision.duplicados} con errores</p>
      <ul>{revision.errores.slice(0, 15).map(item => <li key={item}>{item}</li>)}</ul>
      {revision.errores.length > 15 && <p>{revision.errores.length - 15} observaciones adicionales.</p>}
      <ul>{revision.usuarios.slice(0, 5).map(usuario => <li key={usuario.id}>{nombre(usuario)} · {usuario.rol}</li>)}</ul>
    </div>}
    {error && <p role="alert" className="gu-error">{error}</p>}
    <footer><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" disabled={!revision?.usuarios.length || !!revision.errores.length} onClick={() => {
      if (revision) setError(guardar(revision.usuarios) ?? '')
    }}>Importar usuarios</Button></footer>
  </Dialogo>
}
const encabezado = ['Usuario', 'Identificador', 'DNI', 'Correo', 'Rol', 'Área', 'Estado', 'Registro']
const campos = (u: Usuario) => [nombre(u), u.usuario, '•••• ' + u.dni.slice(-4), correoOculto(u.correo), u.rol, u.area, estadoActual(u), fecha(u.registro)]
export function Exportar({ usuarios, filtrados, cerrar }: { usuarios: Usuario[]; filtrados: Usuario[]; cerrar: () => void }) {
  const [alcance, setAlcance] = useState('filtrados')
  const [rol, setRol] = useState<string>(roles[0])
  const [estado, setEstado] = useState<string>(estados[0])
  const [formato, setFormato] = useState('Excel')
  const [imprimir, setImprimir] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const datos = alcance === 'filtrados' ? filtrados : usuarios.filter(u => {
    if (alcance === 'activos') return estadoActual(u) === 'Activo'
    if (alcance === 'rol') return u.rol === rol
    if (alcance === 'estado') return estadoActual(u) === estado
    return true
  })
  useEffect(() => {
    if (!imprimir) return
    const timer = window.setTimeout(() => { window.print(); setImprimir(false) }, 0)
    return () => window.clearTimeout(timer)
  }, [imprimir])
  async function exportar() {
    setError('')
    setOcupado(true)
    try {
      const filas = [encabezado, ...datos.map(campos)]
      if (formato === 'CSV') descargarCsv('usuarios-mariscalito.csv', filas)
      else if (formato === 'Excel') {
        const { default: escribir } = await import('write-excel-file/browser')
        await escribir(filas.map(fila => fila.map(value => ({ value }))), { sheet: 'Usuarios' }).toFile('usuarios-mariscalito.xlsx')
      } else { setImprimir(true); return }
      cerrar()
    } catch { setError('No se pudo exportar el archivo.') }
    finally { setOcupado(false) }
  }
  return <Dialogo titulo="Exportar usuarios" descripcion="Selecciona el alcance y el formato del archivo." cerrar={cerrar}>
    <h3>Contenido</h3>
    {([['filtrados', 'Usuarios filtrados'], ['todos', 'Todos los usuarios'], ['activos', 'Usuarios activos'], ['rol', 'Usuarios por rol'], ['estado', 'Usuarios por estado']] as const).map(([valor, etiqueta]) =>
      <label key={valor} className="gu-check"><input type="radio" name="alcance" checked={alcance === valor} onChange={() => setAlcance(valor)}/> {etiqueta}</label>)}
    {alcance === 'rol' && <label>Rol<select value={rol} onChange={e => setRol(e.target.value)}>{roles.map(r => <option key={r}>{r}</option>)}</select></label>}
    {alcance === 'estado' && <label>Estado<select value={estado} onChange={e => setEstado(e.target.value)}>{estados.map(s => <option key={s}>{s}</option>)}</select></label>}
    <h3>Formato</h3>
    <div className="gu-options">{['Excel', 'CSV', 'PDF'].map(item => <label className="gu-check" key={item}><input type="radio" name="formato" checked={formato === item} onChange={() => setFormato(item)}/> {item}</label>)}</div>
    <p>{datos.length} registros{formato === 'PDF' ? ' · selecciona Guardar como PDF al imprimir.' : ''}</p>
    {error && <p role="alert" className="gu-error">{error}</p>}
    <footer><Button onClick={cerrar}>Cancelar</Button><Button variant="primary" disabled={ocupado} onClick={exportar}>Exportar archivo</Button></footer>
    {imprimir && <div className="gu-print"><h1>Gestión de usuarios · Mariscalito</h1><table><thead><tr>{encabezado.map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{datos.map(u => <tr key={u.id}>{campos(u).map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table></div>}
  </Dialogo>
}
