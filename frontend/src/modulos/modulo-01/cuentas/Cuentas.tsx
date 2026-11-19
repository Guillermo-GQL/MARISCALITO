import { useEffect, useState } from 'react'
import { Button, ConfirmDialog, Dropdown, useNotify } from '../../../compartido/componentes'
import { FormularioCuenta, ImportarCuentas, Ventana } from './formularios'
import { correoProtegido, duplicada, estados, exportar, fechaLocal, fechaVista, guardarCuentas, leerCuentas, nuevaCuenta, roles } from './datos'
import type { Cuenta, DatosCuenta } from './datos'
import './cuentas.css'

const acciones = {
  activar: { titulo: 'Activar cuenta', resultado: 'Cuenta activada', descripcion: 'Se habilitará nuevamente el acceso.' },
  desactivar: { titulo: 'Desactivar cuenta', resultado: 'Cuenta desactivada', descripcion: 'Se impedirá el acceso y se cerrarán sus sesiones activas. El historial se conservará.' },
  bloquear: { titulo: 'Bloquear cuenta', resultado: 'Cuenta bloqueada', descripcion: 'Se bloqueará el acceso de inmediato y se cerrarán sus sesiones activas.' },
  desbloquear: { titulo: 'Desbloquear cuenta', resultado: 'Cuenta desbloqueada', descripcion: 'Se habilitará el acceso y se reiniciará el contador de intentos fallidos.' },
  restablecer: { titulo: 'Restablecer contraseña', resultado: 'Contraseña restablecida en la demostración', descripcion: 'La contraseña quedará marcada como temporal. La cuenta requerirá un cambio de contraseña y se cerrarán sus sesiones.' },
  sesiones: { titulo: 'Cerrar todas las sesiones', resultado: 'Sesiones cerradas', descripcion: 'Se registrará el cierre de todas las sesiones activas de esta cuenta.' },
  forzar: { titulo: 'Forzar cambio de contraseña', resultado: 'Cambio de contraseña requerido', descripcion: 'Se marcará la cuenta para solicitar una nueva contraseña en el siguiente ingreso.' },
  eliminar: { titulo: 'No se puede eliminar esta cuenta', resultado: '', descripcion: 'La cuenta tiene información relacionada. Puedes desactivarla para conservar el historial.' },
}
type Accion = keyof typeof acciones
type Modal = { tipo: 'importar' } | { tipo: 'historial'; id?: string } | { tipo: 'editar'; id: string }
const filtrosIniciales = { buscar: '', rol: '', estado: '', acceso: '', creacion: '', segundoFactor: '' }

function Etiqueta({ texto }: { texto: string }) {
  return <span className={'ct-tag ct-' + texto.toLowerCase()}>{texto}</span>
}

function Avatar({ cuenta }: { cuenta: Cuenta }) {
  const iniciales = cuenta.usuario.split(/[._-]/).map(parte => parte[0]).join('').slice(0, 2)
  return <span className="ct-avatar" aria-hidden="true">{iniciales.length > 1 ? iniciales : cuenta.usuario.slice(0, 2)}</span>
}

function Historial({ cuentas, id, cerrar }: { cuentas: Cuenta[]; id?: string; cerrar: () => void }) {
  const [buscar, setBuscar] = useState('')
  const [resultado, setResultado] = useState('')
  const [dias, setDias] = useState('30')
  const claves = ['Fecha y hora', 'Usuario', 'Acción', 'Dispositivo', 'Navegador', 'Ubicación', 'Resultado']
  const filas = cuentas.filter(cuenta => !id || id === cuenta.id).flatMap(cuenta => cuenta.historial.map(acceso => ({ ...acceso, usuario: cuenta.usuario })))
    .filter(acceso => (!resultado || acceso.resultado === resultado) &&
      (!dias || acceso.fecha >= new Date(fechaLocal(Number(dias) - 1) + 'T00:00:00').toISOString()) &&
      (acceso.usuario + ' ' + acceso.accion).toLowerCase().includes(buscar.trim().toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const campos = (fila: typeof filas[number]) => [fila.fecha, fila.usuario, fila.accion, fila.dispositivo ?? '—', fila.navegador ?? '—', fila.lugar ?? '—', fila.resultado]
  return <Ventana titulo="Historial de accesos" descripcion="Auditoría de inicios de sesión y eventos de seguridad." formato="ct-audit" onClose={cerrar}>
    <div className="ct-audit-filters">
      <label>Buscar<input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Usuario o acción…"/></label>
      <label>Resultado<select value={resultado} onChange={e => setResultado(e.target.value)}><option value="">Todos</option><option>Exitoso</option><option>Rechazado</option></select></label>
      <label>Fecha<select value={dias} onChange={e => setDias(e.target.value)}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="">Todas las fechas</option></select></label>
      <Button onClick={() => exportar('auditoria-cuentas.csv', [claves, ...filas.map(campos)])}>Exportar auditoría</Button>
    </div>
    <div className="ct-table-scroll"><table><thead><tr>{claves.map(clave => <th scope="col" key={clave}>{clave}</th>)}</tr></thead>
      <tbody>{filas.map((fila, i) => <tr key={fila.fecha + fila.usuario + i}><td>{fechaVista(fila.fecha, true)}</td>
        {campos(fila).slice(1, -1).map((campo, j) => <td key={j}>{campo}</td>)}<td><Etiqueta texto={fila.resultado}/></td></tr>)}</tbody>
    </table></div>
    {!filas.length && <p className="ct-empty">No hay eventos para estos filtros.</p>}
  </Ventana>
}

export function Cuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando')
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [modal, setModal] = useState<Modal>()
  const [pendiente, setPendiente] = useState<{ cuenta: Cuenta; accion: Accion }>()
  const [hash, setHash] = useState(() => location.hash)
  const notify = useNotify()
  const detalle = hash === '#cuentas/detalle'
  const nueva = hash === '#cuentas/nueva'
  const id = detalle ? String(history.state?.cuentaId ?? '') : ''
  const actual = cuentas.find(cuenta => cuenta.id === id)
  const editar = modal?.tipo === 'editar' ? cuentas.find(cuenta => cuenta.id === modal.id) : undefined

  function cargar() {
    try {
      setCuentas(leerCuentas())
      setEstado('lista')
    } catch {
      setEstado('error')
    }
  }
  useEffect(() => {
    const sync = () => { setHash(location.hash); setModal(undefined); setPendiente(undefined) }
    window.addEventListener('hashchange', sync)
    cargar()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  function ir(ruta: string, cuentaId?: string) {
    if (location.hash === ruta) return
    location.hash = ruta
    if (cuentaId) history.replaceState({ ...history.state, cuentaId }, '')
  }
  const cerrarRuta = () => ir('#cuentas')
  function persistir(cambio: (vigentes: Cuenta[]) => Cuenta[]) {
    try {
      const siguientes = cambio(leerCuentas())
      guardarCuentas(siguientes)
      setCuentas(siguientes)
      return true
    } catch (error) {
      notify({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar el cambio.' })
      return false
    }
  }
  function avisoRuta(mensaje: string, descripcion?: string) {
    if (nueva) {
      // El proveedor compartido limpia avisos al cambiar de vista.
      window.addEventListener('hashchange', () => notify({ type: 'success', message: mensaje, description: descripcion }), { once: true })
      cerrarRuta()
    } else notify({ type: 'success', message: mensaje, description: descripcion })
  }
  function guardar(datos: DatosCuenta, invitar: boolean) {
    const guardada = persistir(vigentes => {
      if (duplicada(vigentes, datos.usuario, datos.correo, editar?.id)) throw new Error('El usuario o correo ya existe.')
      if (editar) return vigentes.map(cuenta => cuenta.id === editar.id ? {
        ...cuenta, ...datos, estado: cuenta.estado, historial: [{ fecha: new Date().toISOString(), accion: 'Configuración actualizada', resultado: 'Exitoso' }, ...cuenta.historial],
      } : cuenta)
      return [...vigentes, nuevaCuenta({ ...datos, estado: invitar ? 'Pendiente' : datos.estado }, invitar ? 'Invitación registrada en la demostración' : 'Cuenta creada')]
    })
    if (guardada) {
      setModal(undefined)
      avisoRuta(editar ? 'Configuración guardada' : 'Cuenta creada', invitar ? 'La invitación quedó registrada como simulación.' : undefined)
    }
  }
  function aplicar() {
    if (!pendiente) return
    const { cuenta, accion } = pendiente
    if (accion === 'eliminar') {
      setPendiente(cuenta.estado === 'Inactiva' ? undefined : { cuenta, accion: 'desactivar' })
      return
    }
    const nuevoEstado = accion === 'desactivar' ? 'Inactiva' : accion === 'bloquear' ? 'Bloqueada' :
      accion === 'activar' || accion === 'desbloquear' ? 'Activa' : undefined
    const guardado = persistir(vigentes => vigentes.map(item => {
      if (item.id !== cuenta.id) return item
      const cerrarSesiones = accion === 'sesiones' || accion === 'restablecer' || nuevoEstado === 'Bloqueada' || nuevoEstado === 'Inactiva'
      return { ...item, estado: nuevoEstado ?? item.estado, sesiones: cerrarSesiones ? 0 : item.sesiones,
        intentos: accion === 'desbloquear' || accion === 'restablecer' ? 0 : item.intentos,
        forzarCambio: accion === 'forzar' || accion === 'restablecer' || item.forzarCambio,
        clave: accion === 'restablecer' ? 'Temporal' : accion === 'forzar' ? 'Renovar' : item.clave,
        historial: [{ fecha: new Date().toISOString(), accion: acciones[accion].resultado, resultado: 'Exitoso' }, ...item.historial] }
    }))
    setPendiente(undefined)
    if (guardado) notify({ type: 'success', message: acciones[accion].resultado })
  }

  function opciones(cuenta: Cuenta) {
    const disponibles: Accion[] = [
      ...(cuenta.estado === 'Bloqueada' ? ['desbloquear'] as const : cuenta.estado !== 'Activa' ? ['activar'] as const : []),
      ...(cuenta.estado !== 'Inactiva' ? ['desactivar'] as const : []),
      ...(cuenta.estado !== 'Bloqueada' ? ['bloquear'] as const : []),
      'restablecer', 'sesiones', 'forzar',
    ]
    return disponibles
  }
  const mostrar = cuentas.filter(cuenta => {
    const buscar = filtros.buscar.trim().toLowerCase()
    return (cuenta.usuario + ' ' + cuenta.correo + ' ' + cuenta.id).toLowerCase().includes(buscar) &&
      (!filtros.rol || cuenta.rol === filtros.rol) && (!filtros.estado || cuenta.estado === filtros.estado) &&
      (!filtros.segundoFactor || cuenta.segundoFactor === (filtros.segundoFactor === 'Sí')) &&
      (!filtros.creacion || cuenta.creada.slice(0, 10) === filtros.creacion) &&
      (!filtros.acceso || (filtros.acceso === 'Nunca' ? !cuenta.ultimo : Boolean(cuenta.ultimo &&
        cuenta.ultimo >= new Date(fechaLocal(filtros.acceso === 'Hoy' ? 0 : 6) + 'T00:00:00').toISOString())))
  })
  const sesiones = cuentas.reduce((total, cuenta) => total + cuenta.sesiones, 0)
  const stats = [
    ['✓', 'Cuentas activas', cuentas.filter(c => c.estado === 'Activa').length, 'activa'],
    ['○', 'Cuentas inactivas', cuentas.filter(c => c.estado === 'Inactiva').length, 'inactiva'],
    ['!', 'Cuentas bloqueadas', cuentas.filter(c => c.estado === 'Bloqueada').length, 'bloqueada'],
    ['↻', 'Contraseñas por renovar', cuentas.filter(c => c.clave === 'Renovar' || c.clave === 'Vencida').length, 'pendiente'],
    ['●', 'Sesiones activas', sesiones, 'sesiones'],
  ] as const
  const filtro = (campo: keyof typeof filtros, valor: string) => setFiltros(anteriores => ({ ...anteriores, [campo]: valor }))
  const abrirHistorial = (id?: string) => setModal({ tipo: 'historial', id })
  return <section className="ct">
    <header className="ct-heading">
      <div><h1>Cuentas de usuario</h1><p>Administra credenciales, estados de acceso y seguridad de las cuentas del sistema.</p></div>
      {estado === 'lista' && <div className="ct-toolbar">
        <Button onClick={() => abrirHistorial()}>↗ Historial de accesos</Button>
        <Button onClick={() => exportar('cuentas.csv', [['Usuario', 'Correo asociado', 'Rol', 'Estado', 'Último acceso', 'Contraseña', 'Sesiones', 'Creación'],
          ...mostrar.map(c => [c.usuario, correoProtegido(c.correo), c.rol, c.estado, c.ultimo ?? '', c.clave, c.sesiones, c.creada])])}>↓ Exportar</Button>
        <Button onClick={() => setModal({ tipo: 'importar' })}>⇧ Importar cuentas</Button>
        <span className="ct-total">{cuentas.length} cuentas</span>
        <Button className="ct-new" variant="primary" onClick={() => ir('#cuentas/nueva')}>＋ Nueva cuenta</Button>
      </div>}
    </header>
    {estado !== 'lista' ? <div className="ct-card ct-empty" role={estado === 'error' ? 'alert' : 'status'}>
      {estado === 'error' ? <><p>No se pudieron cargar las cuentas de este navegador.</p><Button onClick={cargar}>Reintentar</Button></> : 'Cargando cuentas…'}
    </div> : <>
      <div className="ct-metrics" aria-label="Resumen de cuentas">{stats.map(([icono, nombre, cantidad, tono]) =>
        <div className={'ct-card ct-metric ct-' + tono} key={nombre}>
          <div><span className="ct-metric-icon" aria-hidden="true">{icono}</span><div><strong>{cantidad}</strong><span>{nombre}</span></div></div>
          <progress value={cantidad} max={Math.max(cuentas.length, sesiones, 1)} aria-label={nombre}/>
        </div>)}</div>
      <div className="ct-card ct-filters">
        <h2>Buscar y filtrar cuentas</h2>
        <div className="ct-filter-fields">
          <label>Buscar<input type="search" placeholder="Buscar cuenta de usuario…" value={filtros.buscar} onChange={e => filtro('buscar', e.target.value)}/></label>
          <label>Rol<select value={filtros.rol} onChange={e => filtro('rol', e.target.value)}><option value="">Todos los roles</option>{roles.map(rol => <option key={rol}>{rol}</option>)}</select></label>
          <label>Estado<select value={filtros.estado} onChange={e => filtro('estado', e.target.value)}><option value="">Todos los estados</option>{estados.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Último acceso<select value={filtros.acceso} onChange={e => filtro('acceso', e.target.value)}><option value="">Cualquier fecha</option><option>Hoy</option><option>Últimos 7 días</option><option>Nunca</option></select></label>
          <label>Fecha de creación<input type="date" value={filtros.creacion} onChange={e => filtro('creacion', e.target.value)}/></label>
          <label>2FA<select value={filtros.segundoFactor} onChange={e => filtro('segundoFactor', e.target.value)}><option value="">Todos</option><option>Sí</option><option>No</option></select></label>
        </div>
        <div className="ct-filter-footer"><span role="status">{mostrar.length} resultados</span><button className="ct-link" onClick={() => setFiltros(filtrosIniciales)}>Limpiar filtros</button></div>
      </div>
      <div className="ct-card ct-list">
        <h2>Cuentas registradas</h2><p>Las credenciales se muestran protegidas. Nunca se visualizan contraseñas reales.</p>
        <div className="ct-table-scroll"><table>
          <thead><tr>{['Usuario', 'Correo asociado', 'Rol', 'Estado', 'Último acceso', 'Contraseña', 'Sesiones', 'Creación', 'Acciones'].map(columna => <th key={columna} scope="col">{columna}</th>)}</tr></thead>
          <tbody>{mostrar.map(cuenta => <tr key={cuenta.id}>
            <td><button className="ct-user" onClick={() => ir('#cuentas/detalle', cuenta.id)}><Avatar cuenta={cuenta}/><span><strong>{cuenta.usuario}</strong><small>ID-{cuenta.id.slice(0, 8)}</small></span></button></td>
            <td>{correoProtegido(cuenta.correo)}</td><td>{cuenta.rol}</td><td><Etiqueta texto={cuenta.estado}/></td>
            <td>{cuenta.ultimo ? fechaVista(cuenta.ultimo, true) : 'Nunca'}</td><td data-clave={cuenta.clave}>{cuenta.clave}</td>
            <td>{cuenta.sesiones ? <span className="ct-session">{cuenta.sesiones} {cuenta.sesiones === 1 ? 'activa' : 'activas'}</span> : 0}</td>
            <td>{fechaVista(cuenta.creada)}</td>
            <td><Dropdown label="•••" options={[
              { label: 'Ver detalles', onSelect: () => ir('#cuentas/detalle', cuenta.id) },
              { label: 'Editar configuración', onSelect: () => setModal({ tipo: 'editar', id: cuenta.id }) },
              ...opciones(cuenta).map(accion => ({ label: acciones[accion].titulo, onSelect: () => setPendiente({ cuenta, accion }) })),
              { label: 'Ver historial de accesos', onSelect: () => abrirHistorial(cuenta.id) },
              { label: 'Eliminar cuenta', onSelect: () => setPendiente({ cuenta, accion: 'eliminar' }) },
            ]}/></td>
          </tr>)}</tbody>
        </table></div>
        <div className="ct-mobile-list">{mostrar.map(cuenta => <article className="ct-card" key={cuenta.id}>
          <header><Avatar cuenta={cuenta}/><div><strong>{cuenta.usuario}</strong><small>{cuenta.rol}</small></div><Etiqueta texto={cuenta.estado}/></header>
          <p>{correoProtegido(cuenta.correo)}</p><p>Último acceso · {cuenta.ultimo ? fechaVista(cuenta.ultimo, true) : 'Nunca'} <span className="ct-session">{cuenta.sesiones} sesiones</span></p>
          <Button onClick={() => ir('#cuentas/detalle', cuenta.id)}>Ver detalles</Button>
        </article>)}</div>
        {!mostrar.length && <div className="ct-empty"><strong>No se encontraron cuentas</strong><p>Cambia los filtros para ver otros resultados.</p><Button onClick={() => setFiltros(filtrosIniciales)}>Limpiar filtros</Button></div>}
      </div>
      {nueva && <FormularioCuenta cuentas={cuentas} cerrar={cerrarRuta} guardar={guardar}/>}
      {detalle && <Ventana titulo="Detalle de la cuenta" descripcion="Credenciales, sesiones y seguridad de acceso." onClose={cerrarRuta} formato="ct-detail">
        {actual ? <>
          <div className="ct-profile"><Avatar cuenta={actual}/><div><strong>{actual.usuario}</strong><small>{correoProtegido(actual.correo)}</small><p>{actual.rol}</p></div><Etiqueta texto={actual.estado}/></div>
          <h3>Datos de acceso</h3>
          <dl className="ct-grid ct-data">{[
            ['Fecha de creación', fechaVista(actual.creada)], ['Último acceso', actual.ultimo ? fechaVista(actual.ultimo, true) : 'Nunca'],
            ['Último dispositivo', actual.historial.find(acceso => acceso.dispositivo)?.dispositivo ?? 'Sin registro'],
            ['Dirección IP', 'Sin registro'], ['Autenticación 2FA', actual.segundoFactor ? 'Activada' : 'Desactivada'],
            ['Intentos fallidos', actual.intentos + ' de ' + actual.limite], ['Sesiones activas', actual.sesiones],
            ['Vencimiento', actual.vencimiento ? fechaVista(actual.vencimiento) : 'Sin vencimiento'],
          ].map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>)}</dl>
          <div className="ct-info"><strong>Estado de seguridad</strong><p>Contraseña · {actual.clave} · {actual.sesiones} sesiones activas</p>
            <p>{actual.forzarCambio ? 'Cambio de contraseña requerido' : 'Cambio de contraseña opcional'} · {actual.recuperar ? 'Recuperación por correo habilitada' : 'Recuperación por correo deshabilitada'}</p></div>
          <h3>Acciones de seguridad</h3>
          <div className="ct-grid">
            {opciones(actual).map(accion => <Button key={accion} variant={accion === 'bloquear' ? 'danger' : 'secondary'}
              onClick={() => setPendiente({ cuenta: actual, accion })}>{acciones[accion].titulo}</Button>)}
            <Button variant="primary" onClick={() => abrirHistorial(actual.id)}>Ver auditoría</Button>
            <Button onClick={() => setModal({ tipo: 'editar', id: actual.id })}>Editar configuración</Button>
            <Button onClick={() => setPendiente({ cuenta: actual, accion: 'eliminar' })}>Eliminar cuenta</Button>
          </div>
          <h3>Historial de seguridad</h3>
          {actual.historial.length ? <ul className="ct-muted">{actual.historial.slice(0, 4).map((acceso, i) =>
            <li key={acceso.fecha + i}>{fechaVista(acceso.fecha, true)} · {acceso.accion}</li>)}</ul> : <p className="ct-muted">Sin eventos registrados.</p>}
        </> : <div className="ct-empty"><p>Selecciona una cuenta de la lista para consultar sus datos.</p><Button onClick={cerrarRuta}>Volver a cuentas</Button></div>}
      </Ventana>}
      {modal?.tipo === 'historial' && <Historial cuentas={cuentas} id={modal.id} cerrar={() => setModal(undefined)}/>}
      {editar && <FormularioCuenta cuenta={editar} cuentas={cuentas} cerrar={() => setModal(undefined)} guardar={guardar}/>}
      {modal?.tipo === 'importar' && <ImportarCuentas cuentas={cuentas} cerrar={() => setModal(undefined)} importar={lote => {
        if (!persistir(vigentes => {
          if (lote.some(cuenta => duplicada(vigentes, cuenta.usuario, cuenta.correo))) throw new Error('Hay cuentas duplicadas. Vuelve a seleccionar y validar el archivo.')
          return [...vigentes, ...lote]
        })) return
        setModal(undefined)
        notify({ type: 'success', message: lote.length + ' cuentas importadas' })
      }}/>}
      {pendiente && <ConfirmDialog key={pendiente.accion} title={acciones[pendiente.accion].titulo}
        danger={pendiente.accion === 'bloquear' || pendiente.accion === 'desactivar'}
        confirmLabel={pendiente.accion === 'eliminar' ? pendiente.cuenta.estado === 'Inactiva' ? 'Entendido' : 'Desactivar cuenta' : acciones[pendiente.accion].titulo}
        onClose={() => setPendiente(undefined)} onConfirm={aplicar}>
        <strong>{pendiente.cuenta.usuario}</strong><p>{acciones[pendiente.accion].descripcion}</p>
      </ConfirmDialog>}
    </>}
  </section>
}
