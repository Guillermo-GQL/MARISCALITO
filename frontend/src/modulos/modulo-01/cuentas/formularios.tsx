import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button, UnsavedDialog } from '../../../compartido/componentes'
import { analizarImportacion, duplicada, exportar, fechaLocal, porDefecto, roles, segura, usuarioValido } from './datos'
import type { Cuenta, DatosCuenta, Estado, Rol } from './datos'

export function Ventana({ titulo, descripcion, onClose, formato = '', children }: {
  titulo: string; descripcion?: string; onClose: () => void; formato?: string; children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialogo = ref.current
    const foco = document.activeElement
    dialogo?.showModal()
    return () => {
      dialogo?.close()
      if (foco instanceof HTMLElement && foco.isConnected) foco.focus()
    }
  }, [])
  return <dialog ref={ref} className={'ct-dialog ' + formato} aria-labelledby={id} onCancel={e => {
    e.preventDefault()
    onClose()
  }}>
    <header><h2 id={id}>{titulo}</h2><Button aria-label="Cerrar" onClick={onClose}>×</Button></header>
    {descripcion && <p className="ct-muted">{descripcion}</p>}
    {children}
  </dialog>
}

export function FormularioCuenta({ cuenta, cuentas, cerrar, guardar }: {
  cuenta?: Cuenta; cuentas: Cuenta[]; cerrar: () => void
  guardar: (datos: DatosCuenta, invitar: boolean) => void
}) {
  const [error, setError] = useState('')
  const [cambios, setCambios] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const salir = () => cambios ? setConfirmarSalida(true) : cerrar()
  const base = cuenta ?? porDefecto
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    const valor = (nombre: string) => String(campos.get(nombre) ?? '')
    const usuario = valor('usuario').trim()
    const correo = valor('correo').trim().toLowerCase()
    const clave = valor('clave')
    const vencimiento = valor('vencimiento')
    if (!usuarioValido(usuario)) return setError('Escribe de 3 a 40 caracteres válidos para el nombre de usuario.')
    if (duplicada(cuentas, usuario, correo, cuenta?.id)) return setError('El nombre de usuario o correo ya existe.')
    if (!cuenta && !segura(clave)) return setError('La contraseña temporal debe cumplir todas las reglas de seguridad.')
    if (!cuenta && clave !== valor('confirmacion')) return setError('Las contraseñas no coinciden.')
    if (vencimiento && vencimiento !== cuenta?.vencimiento && vencimiento < fechaLocal()) return setError('La fecha de vencimiento ya pasó.')
    const invitar = (evento.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'invitar'
    guardar({ usuario, correo, rol: valor('rol') as Rol, estado: cuenta?.estado ?? valor('estado') as Estado,
      segundoFactor: campos.has('2fa'), forzarCambio: campos.has('cambio'),
      recuperar: campos.has('recuperar'), vencimiento, limite: Number(valor('limite')) }, invitar)
  }
  return <Ventana titulo={cuenta ? 'Editar configuración' : 'Nueva cuenta'} descripcion="Configura las credenciales y opciones de seguridad de la cuenta." onClose={salir}>
    <form onSubmit={enviar} onChange={() => { setCambios(true); setError('') }}>
      <h3>Datos de acceso</h3>
      <div className="ct-grid">
        <label>Nombre de usuario<input name="usuario" defaultValue={cuenta?.usuario} required maxLength={40}/></label>
        <label>Correo asociado<input name="correo" type="email" defaultValue={cuenta?.correo} required maxLength={150}/></label>
        {!cuenta && <>
          <label>Contraseña temporal<input name="clave" type="password" autoComplete="new-password" required maxLength={128}/></label>
          <label>Confirmar contraseña<input name="confirmacion" type="password" autoComplete="new-password" required maxLength={128}/></label>
        </>}
        <label>Rol asignado<select name="rol" required defaultValue={cuenta?.rol ?? ''}>
          <option value="">Selecciona un rol</option>{roles.map(rol => <option key={rol}>{rol}</option>)}
        </select></label>
        {!cuenta && <label>Estado inicial<select name="estado"><option>Activa</option><option>Pendiente</option><option>Inactiva</option></select></label>}
      </div>
      {!cuenta && <div className="ct-info"><strong>Contraseña segura</strong><p>Mínimo 10 caracteres, mayúscula, minúscula, número y símbolo. Usa una contraseña de prueba.</p></div>}
      <h3>Seguridad</h3>
      <div className="ct-grid">
        <div className="ct-switches">
          <label><input name="cambio" type="checkbox" role="switch" defaultChecked={base.forzarCambio}/>Solicitar cambio de contraseña en el primer ingreso</label>
          <label><input name="2fa" type="checkbox" role="switch" defaultChecked={base.segundoFactor}/>Activar autenticación de dos factores</label>
          <label><input name="recuperar" type="checkbox" role="switch" defaultChecked={base.recuperar}/>Permitir recuperación mediante correo</label>
        </div>
        <div>
          <div className="ct-grid">
            <label>Fecha de vencimiento<input name="vencimiento" type="date" defaultValue={base.vencimiento}/></label>
            <label>Intentos fallidos<input name="limite" type="number" min="1" max="20" required defaultValue={base.limite}/></label>
          </div>
          <div className="ct-info ct-warning"><strong>Principio de menor privilegio</strong><p>Asigna solo el rol y accesos necesarios.</p></div>
        </div>
      </div>
      {error && <p className="ct-error" role="alert">{error}</p>}
      <footer>
        <Button onClick={salir}>Cancelar</Button>
        {!cuenta && <Button className="ct-invite" type="submit" value="invitar">Crear y enviar invitación</Button>}
        <Button type="submit" variant="primary" value="guardar">{cuenta ? 'Guardar configuración' : 'Crear cuenta'}</Button>
      </footer>
    </form>
    {confirmarSalida && <UnsavedDialog onStay={() => setConfirmarSalida(false)} onDiscard={cerrar}/>}
  </Ventana>
}

export function ImportarCuentas({ cuentas, cerrar, importar }: {
  cuentas: Cuenta[]; cerrar: () => void; importar: (cuentas: Cuenta[]) => void
}) {
  const [archivo, setArchivo] = useState<File>()
  const [errores, setErrores] = useState<string[]>([])
  const [validadas, setValidadas] = useState<Cuenta[]>([])
  const [validando, setValidando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)
  function elegir(file?: File) {
    setArchivo(file)
    setErrores([])
    setValidadas([])
  }
  async function validar() {
    if (!archivo || !/\.csv$/i.test(archivo.name) || archivo.size > 5 * 1024 * 1024) {
      setErrores(['Selecciona un archivo CSV de hasta 5 MB.'])
      return
    }
    setValidando(true)
    try {
      const resultado = analizarImportacion(await archivo.text(), cuentas)
      setErrores(resultado.errores)
      setValidadas(resultado.errores.length ? [] : resultado.cuentas)
    } catch (error) {
      setErrores([error instanceof Error ? error.message : 'No se pudo leer el archivo.'])
    } finally {
      setValidando(false)
    }
  }
  return <Ventana titulo="Importar cuentas" descripcion="Carga un CSV con usuarios y credenciales iniciales de prueba." formato="ct-import" onClose={cerrar}>
    <div className="ct-drop" onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault()
      if (!validando) elegir(e.dataTransfer.files[0])
    }}>
      <strong>{archivo?.name ?? 'Arrastra el archivo CSV o selecciónalo desde tu equipo'}</strong>
      <p>Máximo 5 MB · Validación antes de importar</p>
      <input ref={entrada} type="file" accept=".csv,text/csv" hidden onChange={e => elegir(e.target.files?.[0])}/>
      <Button disabled={validando} onClick={() => entrada.current?.click()}>Seleccionar archivo</Button>
    </div>
    <div className="ct-info"><strong>Validaciones incluidas</strong><p>Usuario único, correo válido, rol obligatorio y contraseña temporal segura.</p>
      <button className="ct-link" onClick={() => exportar('plantilla-cuentas.csv', [['usuario', 'correo', 'rol', 'contrasena']])}>Descargar plantilla CSV</button>
    </div>
    {!!errores.length && <div role="alert" className="ct-error">{errores.slice(0, 8).map(error => <p key={error}>{error}</p>)}{errores.length > 8 && <p>{errores.length - 8} errores adicionales.</p>}</div>}
    {!!validadas.length && <p role="status">{validadas.length} cuentas listas para importar.</p>}
    <footer><Button onClick={cerrar}>Cancelar</Button>
      {validadas.length ? <Button variant="primary" onClick={() => importar(validadas)}>Importar cuentas</Button> :
        <Button variant="primary" disabled={validando} onClick={validar}>{validando ? 'Validando…' : 'Validar archivo'}</Button>}
    </footer>
  </Ventana>
}
