import { useEffect, useState } from 'react'
import { Button, ConfirmDialog, Dropdown, useNotify } from '../../../compartido/componentes'
import { Avatar, Dialogo, Etiqueta, Exportar, Formulario, Importar } from './dialogosUsuarios'
import { areas, correoOculto, escribirUsuarios, estadoActual, estados, evento, fecha, hoy, leerUsuarios, nombre, nuevo, roles, validar } from './datosUsuarios'
import type { Perfil, Usuario } from './datosUsuarios'
import './usuarios.css'

const acciones = {
  activar: ['Activar usuario', 'Usuario activado', 'Se habilitará el acceso si la vigencia del usuario lo permite.'],
  desactivar: ['Desactivar usuario', 'Usuario desactivado', 'Se impedirá el acceso y se cerrarán las sesiones de demostración.'],
  bloquear: ['Bloquear usuario', 'Usuario bloqueado', 'Se bloqueará el acceso y se cerrarán sus sesiones de demostración.'],
  restablecer: ['Restablecer contraseña', 'Restablecimiento registrado', 'Se registrará la solicitud y se exigirá cambiar la contraseña en el siguiente acceso de demostración.'],
  eliminar: ['Eliminar usuario', 'Usuario eliminado', 'Se retirará el usuario del listado y se conservará su historial de auditoría.'],
} as const
type Accion = keyof typeof acciones
type Modal = 'importar' | 'exportar' | 'historial'
const filtroInicial = { texto: '', rol: '', estado: '', area: '', registro: '' }
const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const permisos: Record<Perfil['rol'], string[]> = {
  Administrador: ['Administrar sistema', 'Gestión de usuarios', 'Roles y permisos', 'Auditoría'],
  'Personal adm.': ['Consultar registros institucionales'],
  Docente: ['Consultar asignaciones docentes'],
  Estudiante: ['Consultar información personal'],
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [ruta, setRuta] = useState(() => location.hash)
  const [filtros, setFiltros] = useState(filtroInicial)
  const [modal, setModal] = useState<{ tipo: Modal; id?: string }>()
  const [confirmacion, setConfirmacion] = useState<{ accion: Accion; id: string }>()
  const [errorAccion, setErrorAccion] = useState('')
  const notify = useNotify()
  const activos = usuarios.filter(u => !u.eliminado)
  const seleccionado = activos.find(u => u.id === history.state?.usuarioId)
  const confirmado = activos.find(u => u.id === confirmacion?.id)
  const auditado = usuarios.find(u => u.id === modal?.id)
  const [incluirBajas, setIncluirBajas] = useState(false)
  const esNuevo = ruta === '#usuarios/nuevo'
  const esEdicion = ruta === '#usuarios/editar'
  const esDetalle = ruta === '#usuarios/detalle'

  function cargar() {
    try { setUsuarios(leerUsuarios()); setEstado('listo') }
    catch { setEstado('error') }
  }
  useEffect(() => {
    cargar()
    const sync = () => { setRuta(location.hash); setModal(undefined); setConfirmacion(undefined) }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  function ir(destino: string, id?: string) {
    location.hash = destino
    if (id) history.replaceState({ ...history.state, usuarioId: id }, '')
  }
  const volver = () => ir('#usuarios')
  function guardar(cambio: (lista: Usuario[]) => Usuario[]) {
    try {
      const siguiente = cambio(leerUsuarios())
      escribirUsuarios(siguiente)
      setUsuarios(siguiente)
      return ''
    } catch (e) { return e instanceof Error ? e.message : 'No se pudo guardar el cambio.' }
  }
  function avisar(mensaje: string, cerrarRuta = false) {
    if (cerrarRuta) {
      window.addEventListener('hashchange', () => notify({ type: 'success', message: mensaje }), { once: true })
      volver()
    } else notify({ type: 'success', message: mensaje })
  }
  function guardarPerfil(perfil: Perfil) {
    const id = esEdicion ? seleccionado?.id : undefined
    const error = guardar(lista => {
      const existente = lista.find(u => u.id === id && !u.eliminado)
      if (id && !existente) throw new Error('El usuario ya no está disponible.')
      const problema = validar(perfil, lista.filter(u => !u.eliminado), id)
      if (problema) throw new Error(problema)
      return existente ? lista.map(u => u.id === id ? {
        ...u, ...perfil, sesiones: perfil.acceso && estadoActual(perfil) === 'Activo' ? u.sesiones : 0,
        eventos: [evento('Usuario actualizado'), ...u.eventos],
      } : u) : [nuevo(perfil), ...lista]
    })
    if (error) return error
    avisar(id ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', true)
  }
  function auditar(id: string) {
    setIncluirBajas(false)
    setModal({ tipo: 'historial', id })
  }
  function pedir(accion: Accion, usuario: Usuario) {
    setErrorAccion('')
    setConfirmacion({ accion, id: usuario.id })
  }
  function ejecutar() {
    if (!confirmacion || !confirmado) return
    const { accion, id } = confirmacion
    const error = guardar(lista => {
      if (!lista.some(u => u.id === id && !u.eliminado)) throw new Error('El usuario ya no está disponible.')
      return lista.map(u => {
        if (u.id !== id) return u
        const estadoNuevo = accion === 'activar' ? 'Activo' : accion === 'desactivar' || accion === 'eliminar' ? 'Inactivo' :
          accion === 'bloquear' ? 'Bloqueado' : u.estado
        return { ...u, estado: estadoNuevo, acceso: accion === 'restablecer' ? u.acceso : accion === 'activar',
          sesiones: accion === 'activar' ? u.sesiones : 0, cambio: accion === 'restablecer' || u.cambio,
          eliminado: accion === 'eliminar', eventos: [evento(acciones[accion][1]), ...u.eventos] }
      })
    })
    if (error) return setErrorAccion(error)
    setConfirmacion(undefined)
    avisar(acciones[accion][1], accion === 'eliminar' && esDetalle)
  }
  const visibles = activos.filter(u => {
    const criterio = normalizar(filtros.texto.trim())
    return normalizar([nombre(u), u.usuario, u.dni, u.correo, u.codigo].join(' ')).includes(criterio) &&
      (!filtros.rol || u.rol === filtros.rol) && (!filtros.estado || estadoActual(u) === filtros.estado) &&
      (!filtros.area || u.area === filtros.area) && (!filtros.registro || u.registro.slice(0, 10) === filtros.registro)
  })
  const resumen = [
    ['✓', 'Usuarios activos', activos.filter(u => estadoActual(u) === 'Activo').length, 'activo'],
    ['○', 'Usuarios inactivos', activos.filter(u => estadoActual(u) === 'Inactivo').length, 'inactivo'],
    ['!', 'Usuarios bloqueados', activos.filter(u => estadoActual(u) === 'Bloqueado').length, 'bloqueado'],
    ['◷', 'Invitaciones pendientes', activos.filter(u => u.invitacion && estadoActual(u) === 'Pendiente').length, 'pendiente'],
    ['+', 'Registrados este mes', activos.filter(u => u.registro.slice(0, 7) === hoy().slice(0, 7)).length, 'mes'],
  ] as const
  function filtro(campo: keyof typeof filtros, valor: string) {
    setFiltros(previo => ({ ...previo, [campo]: valor }))
  }
  function menu(u: Usuario) {
    const opciones: Accion[] = estadoActual(u) === 'Activo' ? ['desactivar', 'bloquear'] :
      estadoActual(u) === 'Bloqueado' ? ['activar', 'desactivar'] : ['activar', 'bloquear']
    return <Dropdown label="Acciones" options={[
      { label: 'Ver detalle', onSelect: () => ir('#usuarios/detalle', u.id) },
      { label: 'Editar usuario', onSelect: () => ir('#usuarios/editar', u.id) },
      ...[...opciones, 'restablecer' as const].map(accion => ({ label: acciones[accion][0], onSelect: () => pedir(accion, u) })),
      { label: 'Historial y auditoría', onSelect: () => auditar(u.id) },
      { label: 'Eliminar usuario', onSelect: () => pedir('eliminar', u) },
    ]}/>
  }
  return <section className="gu">
    <header className="gu-heading">
      <div><h1>Gestión de usuarios</h1><p>Registra, consulta y administra los usuarios del sistema.</p></div>
      {estado === 'listo' && <div className="gu-actions">
        <span className="gu-chip">{activos.length} usuarios registrados</span>
        <Button onClick={() => setModal({ tipo: 'importar' })}>Importar usuarios</Button>
        <Button onClick={() => setModal({ tipo: 'exportar' })}>Exportar usuarios</Button>
        <Button variant="primary" onClick={() => ir('#usuarios/nuevo')}>+ Nuevo usuario</Button>
      </div>}
    </header>
    {estado !== 'listo' ? <div className="gu-card gu-empty" role={estado === 'error' ? 'alert' : 'status'}>{
      estado === 'error' ? <><p>No se pudieron cargar los usuarios.</p><Button onClick={cargar}>Reintentar</Button></> : 'Cargando usuarios…'
    }</div> : <>
      <div className="gu-stats">{resumen.map(([icono, texto, total, tono]) => <div className="gu-card gu-stat" key={texto}>
        <span className={'gu-icon gu-' + tono} aria-hidden="true">{icono}</span><div><span>{texto}</span><strong>{total}</strong></div>
      </div>)}</div>
      <div className="gu-card gu-filters">
        <div className="gu-filter-fields">
          <label>Buscar usuarios<input type="search" placeholder="Nombre, DNI, correo o código" value={filtros.texto} onChange={e => filtro('texto', e.target.value)}/></label>
          <label>Rol<select value={filtros.rol} onChange={e => filtro('rol', e.target.value)}><option value="">Todos los roles</option>{roles.map(r => <option key={r}>{r}</option>)}</select></label>
          <label>Estado<select value={filtros.estado} onChange={e => filtro('estado', e.target.value)}><option value="">Todos los estados</option>{estados.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Área<select value={filtros.area} onChange={e => filtro('area', e.target.value)}><option value="">Todas las áreas</option>{[...new Set([...areas, ...activos.map(u => u.area).filter(Boolean)])].map(a => <option key={a}>{a}</option>)}</select></label>
          <label>Fecha de registro<input type="date" value={filtros.registro} onChange={e => filtro('registro', e.target.value)}/></label>
        </div>
        <div className="gu-filter-footer"><strong role="status">{visibles.length} resultados</strong><span>DNI y correo parcialmente protegidos.</span>
          <Button onClick={() => setFiltros(filtroInicial)}>Limpiar filtros</Button></div>
      </div>
      <div className="gu-card gu-list">
        <div className="gu-section-head"><div><h2>Usuarios registrados</h2><p>Vigencia, rol y actividad reciente.</p></div>
          {usuarios.some(u => u.eliminado) && <Button onClick={() => { setIncluirBajas(true); setModal({ tipo: 'historial' }) }}>Auditoría de bajas</Button>}
        </div>
        {visibles.length ? <>
          <div className="gu-table"><table><thead><tr>{['Usuario', 'Documento', 'Correo', 'Rol', 'Área', 'Estado', 'Último acceso', 'Registro', 'Acciones'].map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead>
            <tbody>{visibles.map(u => <tr key={u.id}>
              <td><button className="gu-person" onClick={() => ir('#usuarios/detalle', u.id)}><Avatar usuario={u}/><span><strong>{nombre(u)}</strong><small>@{u.usuario}</small></span></button></td>
              <td>DNI •••• {u.dni.slice(-4)}</td><td>{correoOculto(u.correo)}</td><td><span className="gu-chip">{u.rol}</span></td><td>{u.area || '—'}</td>
              <td><Etiqueta estado={estadoActual(u)}/></td><td>{fecha(u.ultimo, true)}</td><td>{fecha(u.registro)}</td><td>{menu(u)}</td>
            </tr>)}</tbody></table></div>
          <div className="gu-mobile">{visibles.map(u => <article className="gu-card" key={u.id}>
            <button className="gu-person" onClick={() => ir('#usuarios/detalle', u.id)}><Avatar usuario={u}/><span><strong>{nombre(u)}</strong><small>@{u.usuario} · DNI •••• {u.dni.slice(-4)}</small></span></button>
            <p>{correoOculto(u.correo)}</p><footer><Etiqueta estado={estadoActual(u)}/><span className="gu-chip">{u.rol}</span>{menu(u)}</footer>
          </article>)}</div>
        </> : <div className="gu-empty"><strong>{activos.length ? 'No se encontraron usuarios' : 'Aún no hay usuarios registrados'}</strong>
          <p>{activos.length ? 'Prueba con otros filtros.' : 'Crea un usuario o importa una lista.'}</p>
          <Button onClick={() => activos.length ? setFiltros(filtroInicial) : ir('#usuarios/nuevo')}>{activos.length ? 'Limpiar filtros' : 'Nuevo usuario'}</Button></div>}
      </div>
      {(esNuevo || esEdicion && seleccionado) && <Formulario key={seleccionado?.id ?? 'nuevo'} usuario={esEdicion ? seleccionado : undefined} existentes={activos} cerrar={volver} guardar={guardarPerfil}/>}
      {(esEdicion || esDetalle) && !seleccionado && <Dialogo titulo="Selecciona un usuario" cerrar={volver}><p>Abre el registro desde la lista de usuarios.</p><footer><Button onClick={volver}>Volver a usuarios</Button></footer></Dialogo>}
      {esDetalle && seleccionado && <Dialogo titulo="Detalle del usuario" ancho="gu-detail" cerrar={volver}>
        <div className="gu-profile"><Avatar usuario={seleccionado}/><div><strong>{nombre(seleccionado)}</strong><p>@{seleccionado.usuario}</p><Etiqueta estado={estadoActual(seleccionado)}/></div></div>
        <dl className="gu-data">{[['Rol', seleccionado.rol], ['Correo', correoOculto(seleccionado.correo)], ['DNI', '•••• ' + seleccionado.dni.slice(-4)],
          ['Área', seleccionado.area || '—'], ['Registro', fecha(seleccionado.registro)], ['Último acceso', fecha(seleccionado.ultimo, true)],
          ['Dispositivo', seleccionado.dispositivo ?? '—'], ['Sesiones activas', seleccionado.sesiones], ['Vencimiento', fecha(seleccionado.fin)]]
          .map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <h3>Permisos heredados del rol</h3><div className="gu-options">{permisos[seleccionado.rol].map(p => <span className="gu-chip" key={p}>✓ {p}</span>)}</div>
        <h3>Actividad reciente</h3>
        {seleccionado.eventos.length ? <ul className="gu-recent">{seleccionado.eventos.slice(0, 3).map((e, i) => <li key={i}>{e.accion} · {fecha(e.fecha, true)}</li>)}</ul> : <p>Sin eventos registrados.</p>}
        <footer><Button variant="primary" onClick={() => ir('#usuarios/editar', seleccionado.id)}>Editar usuario</Button>
          <Button onClick={() => auditar(seleccionado.id)}>Ver historial</Button>{menu(seleccionado)}</footer>
      </Dialogo>}
      {modal?.tipo === 'importar' && <Importar existentes={activos} cerrar={() => setModal(undefined)} guardar={lote => {
        const error = guardar(lista => {
          const vigentes = lista.filter(u => !u.eliminado)
          for (const perfil of lote) {
            const problema = validar(perfil, vigentes)
            if (problema) throw new Error(problema)
            vigentes.push(perfil)
          }
          return [...lote, ...lista]
        })
        if (error) return error
        setModal(undefined)
        avisar('Importación completada · ' + lote.length + ' registros')
      }}/>}
      {modal?.tipo === 'exportar' && <Exportar usuarios={activos} filtrados={visibles} cerrar={() => setModal(undefined)}/>}
      {modal?.tipo === 'historial' && <Dialogo titulo={incluirBajas ? 'Auditoría de bajas' : 'Historial y auditoría'} descripcion="Trazabilidad de accesos y cambios del usuario." ancho="gu-medium" cerrar={() => setModal(undefined)}>
        {incluirBajas && <label>Usuario eliminado<select value={modal.id ?? ''} onChange={e => setModal({ tipo: 'historial', id: e.target.value })}>
          <option value="">Selecciona un registro</option>{usuarios.filter(u => u.eliminado).map(u => <option key={u.id} value={u.id}>{nombre(u)} · @{u.usuario}</option>)}
        </select></label>}
        {auditado && <>
          <div className="gu-profile"><Avatar usuario={auditado}/><div><strong>{nombre(auditado)}</strong><p>{auditado.rol} · DNI •••• {auditado.dni.slice(-4)} · {correoOculto(auditado.correo)}</p></div></div>
          {auditado.eventos.length ? <div className="gu-table"><table><thead><tr>{['Acción', 'Responsable', 'Fecha y hora', 'IP', 'Resultado'].map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead>
            <tbody>{auditado.eventos.map((e, i) => <tr key={i}><td>{e.accion}</td><td>{e.responsable}</td><td>{fecha(e.fecha, true)}</td><td>{e.ip ?? '—'}</td><td><Etiqueta estado={e.resultado}/></td></tr>)}</tbody></table></div> : <p>Sin eventos registrados.</p>}
        </>}
        <footer><Button variant="primary" onClick={() => setModal(undefined)}>Cerrar historial</Button></footer>
      </Dialogo>}
      {confirmacion && confirmado && <ConfirmDialog title={acciones[confirmacion.accion][0]}
        danger={['bloquear', 'eliminar', 'desactivar'].includes(confirmacion.accion)} confirmLabel={acciones[confirmacion.accion][0]}
        onClose={() => setConfirmacion(undefined)} onConfirm={ejecutar}>
        <strong>{nombre(confirmado)}</strong><p>{acciones[confirmacion.accion][2]}</p>
        {errorAccion && <p className="gu-error" role="alert">{errorAccion}</p>}
      </ConfirmDialog>}
    </>}
  </section>
}
