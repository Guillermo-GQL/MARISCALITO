import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ConfirmDialog, useNotify } from '../../../compartido/componentes'
import { actualizarCuenta, calcularVigencia, consultar, estados, normalizar, verFecha, vigencias } from './datosVigencia'
import type { CuentaVigencia, Estado } from './datosVigencia'
import './vigencia.css'

const filtrosIniciales = { buscar: '', estado: '', vigencia: '' }
const estadoClase = (estado: string) => 'ev-tag ev-' + estado.toLowerCase()

function Gestionar({ cuenta, cerrar, guardar }: {
  cuenta: CuentaVigencia; cerrar: () => void
  guardar: (datos: Parameters<typeof actualizarCuenta>[1]) => string
}) {
  const [vista, setVista] = useState<'resumen' | 'vigencia' | 'estado'>('resumen')
  const [error, setError] = useState('')
  const [estado, setEstado] = useState(cuenta.estado)
  const titulo = useId()
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const ref = dialogo.current
    const foco = document.activeElement
    ref?.showModal()
    return () => {
      ref?.close()
      if (foco instanceof HTMLElement && foco.isConnected) foco.focus()
    }
  }, [])
  function cancelar() { setVista('resumen'); setError('') }
  function guardarFechas(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const inicio = String(datos.get('inicio') ?? '')
    const fin = String(datos.get('fin') ?? '')
    if (!inicio || !fin || fin < inicio) return setError('La fecha de fin debe ser igual o posterior a la fecha de inicio.')
    const resultado = guardar({ inicio, fin })
    if (resultado) setError(resultado)
    else cancelar()
  }
  const correo = cuenta.correo.slice(0, 2) + '••••@' + cuenta.correo.split('@')[1]
  return <dialog className="ev-dialog" ref={dialogo} aria-labelledby={titulo} onCancel={e => {
    e.preventDefault()
    if (vista === 'resumen') cerrar()
    else cancelar()
  }}>
    <header><h2 id={titulo}>Gestionar cuenta</h2><Button aria-label="Cerrar" onClick={cerrar}>×</Button></header>
    <dl className="ev-profile">
      {[
        ['Usuario', cuenta.nombre], ['Nombre de usuario', cuenta.usuario], ['DNI protegido', '••••••' + cuenta.dni.slice(-2)],
        ['Correo protegido', correo], ['Fecha de inicio', verFecha(cuenta.inicio)], ['Fecha de fin', verFecha(cuenta.fin)],
        ['Vigencia', calcularVigencia(cuenta)], ['Estado actual', <span className={estadoClase(cuenta.estado)}>{cuenta.estado}</span>],
      ].map(([label, valor]) => <div key={String(label)}><dt>{label}</dt><dd>{valor}</dd></div>)}
    </dl>
    <div className="ev-history"><strong>Historial breve</strong>
      {cuenta.historial.length ? <ul>{cuenta.historial.slice(0, 5).map((evento, i) =>
        <li key={evento.fecha + i}>{new Date(evento.fecha).toLocaleString('es-PE')} · {evento.texto}</li>)}</ul> : <p>Sin cambios registrados.</p>}
    </div>
    {vista === 'vigencia' && <form onSubmit={guardarFechas}>
      <h3>Editar vigencia</h3>
      <div className="ev-edit-fields">
        <label>Fecha de inicio<input type="date" name="inicio" required defaultValue={cuenta.inicio}/></label>
        <label>Fecha de fin<input type="date" name="fin" required defaultValue={cuenta.fin}/></label>
      </div>
      {error && <p className="ev-error" role="alert">{error}</p>}
      <footer><Button onClick={cancelar}>Cancelar</Button><Button variant="primary" type="submit">Guardar vigencia</Button></footer>
    </form>}
    {vista === 'resumen' && <footer>
      <Button variant="primary" onClick={() => setVista('vigencia')}>Editar vigencia</Button>
      <Button onClick={() => { setEstado(cuenta.estado); setVista('estado') }}>Cambiar estado</Button>
      <Button onClick={cerrar}>Cerrar</Button>
    </footer>}
    {vista === 'estado' && <ConfirmDialog title="Cambiar estado" confirmLabel="Guardar estado" onClose={cancelar} onConfirm={() => {
      if (estado === cuenta.estado) return cancelar()
      const resultado = guardar({ estado })
      if (resultado) setError(resultado)
      else cancelar()
    }}>
      <label className="ev-control">Nuevo estado<select value={estado} onChange={e => { setEstado(e.target.value as Estado); setError('') }}>
        {estados.map(e => <option key={e}>{e}</option>)}
      </select></label>
      {error && <p className="ev-error" role="alert">{error}</p>}
    </ConfirmDialog>}
  </dialog>
}

export function EstadosVigencia() {
  const [cuentas, setCuentas] = useState<CuentaVigencia[]>([])
  const [estadoCarga, setEstadoCarga] = useState<'cargando' | 'lista' | 'error'>('cargando')
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [seleccion, setSeleccion] = useState<string>()
  const notify = useNotify()
  function cargar() {
    try { setCuentas(consultar()); setEstadoCarga('lista') }
    catch { setEstadoCarga('error') }
  }
  useEffect(cargar, [])
  const elegida = cuentas.find(c => c.id === seleccion)
  const lista = cuentas.map(cuenta => ({ ...cuenta, vigencia: calcularVigencia(cuenta) }))
  const busqueda = normalizar(filtros.buscar.trim())
  const visibles = lista.filter(c => normalizar([c.nombre, c.usuario, c.dni, c.correo].join(' ')).includes(busqueda) &&
    (!filtros.estado || c.estado === filtros.estado) && (!filtros.vigencia || c.vigencia === filtros.vigencia))
  const tarjetas = [
    ['Cuentas activas', 'Usuarios habilitados', lista.filter(c => c.estado === 'Activo' && (c.vigencia === 'Vigente' || c.vigencia === 'Próximo a vencer')).length, 'activas'],
    ['Próximas a vencer', 'Requieren renovación', lista.filter(c => c.vigencia === 'Próximo a vencer').length, 'proximas'],
    ['Cuentas bloqueadas', 'Requieren revisión', lista.filter(c => c.estado === 'Bloqueado').length, 'bloqueadas'],
  ] as const
  return <section className="ev">
    <header className="ev-heading"><div><h1>Estados y vigencia</h1><p>Administra el estado y el período de acceso de las cuentas de usuario.</p></div>
      {estadoCarga === 'lista' && <span className="ev-total">{cuentas.length} cuentas registradas</span>}
    </header>
    {estadoCarga !== 'lista' ? <div className="ev-card ev-empty" role={estadoCarga === 'error' ? 'alert' : 'status'}>
      {estadoCarga === 'error' ? <><p>No se pudieron cargar los datos locales.</p><Button onClick={cargar}>Reintentar</Button></> : 'Cargando estados y vigencias…'}
    </div> : <>
      <div className="ev-stats">{tarjetas.map(([titulo, subtitulo, total, tono]) => <div className={'ev-card ev-stat ev-' + tono} key={titulo}>
        <strong>{total}</strong><div><b>{titulo}</b><small>{subtitulo}</small></div>
      </div>)}</div>
      <div className="ev-card ev-filters"><h2>Buscar cuentas</h2>
        <div className="ev-fields">
          <input aria-label="Buscar cuentas" type="search" placeholder="Nombre, usuario, DNI o correo" value={filtros.buscar} onChange={e => setFiltros({ ...filtros, buscar: e.target.value })}/>
          <select aria-label="Estado" value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}><option value="">Todos los estados</option>{estados.map(e => <option key={e}>{e}</option>)}</select>
          <select aria-label="Vigencia" value={filtros.vigencia} onChange={e => setFiltros({ ...filtros, vigencia: e.target.value })}><option value="">Todas las vigencias</option>{vigencias.map(v => <option key={v}>{v}</option>)}</select>
          <Button onClick={() => setFiltros(filtrosIniciales)}>Limpiar filtros</Button>
          <Button variant="primary" onClick={cargar}>Actualizar</Button>
        </div>
      </div>
      <div className="ev-card ev-list"><header><div><h2>Estados y vigencia de cuentas</h2><p>Consulta y administra el acceso y la vigencia de los usuarios.</p></div>
        <span className="ev-count" role="status">{visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'}</span></header>
        {visibles.length ? <div className="ev-table"><table>
          <thead><tr>{['Usuario', 'Rol', 'Fecha de inicio', 'Fecha de fin', 'Vigencia', 'Estado', 'Acción'].map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead>
          <tbody>{visibles.map(c => <tr key={c.id}><th scope="row">{c.nombre}</th><td>{c.rol}</td><td>{verFecha(c.inicio)}</td><td>{verFecha(c.fin)}</td><td>{c.vigencia}</td>
            <td><span className={estadoClase(c.estado)}>{c.estado}</span></td>
            <td><Button aria-label={'Gestionar ' + c.nombre} onClick={() => setSeleccion(c.id)}>Gestionar</Button></td></tr>)}</tbody>
        </table></div> : <div className="ev-empty"><strong>No se encontraron cuentas</strong><p>Cambia los filtros para ver otros resultados.</p></div>}
      </div>
    </>}
    {elegida && <Gestionar key={elegida.id} cuenta={elegida} cerrar={() => setSeleccion(undefined)} guardar={datos => {
      try {
        setCuentas(actualizarCuenta(elegida.id, datos))
        notify({ type: 'success', message: 'estado' in datos ? 'Estado actualizado' : 'Vigencia actualizada' })
        return ''
      } catch (error) { return error instanceof Error ? error.message : 'No se pudo guardar el cambio.' }
    }}/>}
  </section>
}
