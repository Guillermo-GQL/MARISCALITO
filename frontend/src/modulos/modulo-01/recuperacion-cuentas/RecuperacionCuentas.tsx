import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button, useNotify } from '../../../compartido/componentes'
import campus from './colegio.png'
import { issueLink, protectedEmail, readRequests, recoveryLifetime, saveRequests, statusAt } from './recuperacion-demo'
import type { RecoveryRequest, RecoveryStatus } from './recuperacion-demo'
import './recuperacion.css'

const stateClasses: Record<RecoveryStatus, string> = {
  Pendiente: 'pending', 'Enlace enviado': 'sent', Recuperada: 'recovered', Vencida: 'expired', Cancelada: 'cancelled',
}
const dateFormat = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' })
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const recoverPath = '#acceso/recuperar'
const resetPath = (code: string) => '#acceso/restablecer?enlace=' + encodeURIComponent(code)
const demoDocuments: Record<string, string> = {
  ana: '70001234', luis: '70005678', maria: '70009012', jorge: '70001357', rosa: '70002468', elena: '70003142',
}

type RecoveryNotice = { title: string; detail: string }

function RecoveryDialog({ className, title, description, onDismiss, showClose = true, children }: {
  className: string
  title: string
  description?: string
  onDismiss?: () => void
  showClose?: boolean
  children?: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    element.showModal()
    return () => element.close()
  }, [])

  return <dialog ref={dialog} className={'rc-modal ' + className} aria-labelledby={titleId}
    aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); onDismiss?.() }}>
    <header className="rc-dialog-heading">
      <h2 id={titleId}>{title}</h2>
      {onDismiss && showClose && <button type="button" className="rc-dialog-close" aria-label="Cerrar ventana" onClick={onDismiss}>×</button>}
    </header>
    {description && <p className="rc-dialog-description" id={descriptionId}>{description}</p>}
    {children}
  </dialog>
}

function useClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  return now
}

function Badge({ status }: { status: RecoveryStatus }) {
  return <span className={'rc-badge rc-' + stateClasses[status]}>{status}</span>
}

export function RecuperacionCuentas() {
  const [rows, setRows] = useState<RecoveryRequest[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reload, setReload] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [action, setAction] = useState<'send' | 'cancel'>()
  const [notice, setNotice] = useState<RecoveryNotice>()
  const now = useClock()
  const notify = useNotify()
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setRows(readRequests()); setLoadError(false) }
      catch { setLoadError(true) }
      finally { setIsRefreshing(false) }
    }, reload === 0 ? 230 : 650)
    return () => window.clearTimeout(timer)
  }, [reload])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(undefined), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function refresh() {
    setIsRefreshing(true)
    setReload(value => value + 1)
  }

  function perform() {
    if (!selectedId || !action) return
    try {
      const current = readRequests()
      const target = current.find(item => item.id === selectedId)
      if (!target || ['Recuperada', 'Cancelada'].includes(statusAt(target))) {
        setRows(current)
        notify({ type: 'warning', message: 'La solicitud ya está cerrada.' })
        setAction(undefined)
        return
      }
      const updated: RecoveryRequest = action === 'send'
        ? issueLink(target)
        : { ...target, status: 'Cancelada', code: undefined, expiresAt: undefined }
      const next = current.map(item => item.id === target.id ? updated : item)
      saveRequests(next)
      setRows(next)
      setAction(undefined)
      setSelectedId('')
      setNotice(action === 'send'
        ? {
          title: target.status === 'Pendiente' ? 'Enlace generado correctamente' : 'Enlace reenviado correctamente',
          detail: 'La solicitud tiene una nueva vigencia de 1 minuto.',
        }
        : { title: 'Solicitud cancelada', detail: 'El enlace ya no está disponible.' })
    } catch {
      setAction(undefined)
      notify({ type: 'error', message: 'No se pudo actualizar la solicitud.' })
    }
  }

  const today = new Date(now).toDateString()
  const filtered = (rows ?? []).filter(row => {
    const matchesQuery = normalize(`${row.name} ${row.username} ${row.email} ${demoDocuments[row.id] ?? ''}`).includes(normalize(query.trim()))
    return matchesQuery && (!stateFilter || statusAt(row, now) === stateFilter) &&
      (!dateFilter || (dateFilter === 'today' ? new Date(row.requestedAt).toDateString() === today : now - row.requestedAt <= 604_800_000))
  })
  const statusCounts = ['Pendiente', 'Enlace enviado', 'Vencida'].map(status => rows?.filter(row => statusAt(row, now) === status).length ?? 0)
  const selected = rows?.find(row => row.id === selectedId)
  const selectedState = selected && statusAt(selected, now)
  const selectedDocument = selected && demoDocuments[selected.id]
  const selectedExpiry = selected?.expiresAt
  const secondsLeft = selectedExpiry ? Math.min(60, Math.ceil(Math.max(0, selectedExpiry - now) / 1000)) : 0
  const countdown = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`
  const isFirstLink = selectedState === 'Pendiente'

  return <section className="rc">
    <header className="rc-heading">
      <div><h1>Recuperación de cuentas</h1><p>Administra las solicitudes de recuperación y restablecimiento de acceso de los usuarios.</p></div>
      {rows && <span className="rc-total">{statusCounts.reduce((sum, count) => sum + count, 0)} solicitudes activas</span>}
    </header>
    <div className="rc-metrics">
      {['Solicitudes pendientes', 'Enlaces enviados', 'Solicitudes vencidas'].map((label, index) => <div className="rc-card" key={label}>
        <strong className={'rc-metric rc-metric-' + index}>{rows ? statusCounts[index] : '—'}</strong>
        <div><b>{label}</b><small>{['Requieren atención', 'Enlaces todavía válidos', 'Requieren revisión'][index]}</small></div>
      </div>)}
    </div>
    <div className="rc-card rc-filters">
      <strong>Buscar solicitudes</strong>
      <div>
        <input type="search" aria-label="Nombre, usuario, DNI o correo" placeholder="Nombre, usuario, DNI o correo" value={query} onChange={event => setQuery(event.target.value)} />
        <select aria-label="Filtrar por estado" value={stateFilter} onChange={event => setStateFilter(event.target.value)}>
          <option value="">Todos los estados</option>{Object.keys(stateClasses).map(state => <option key={state}>{state}</option>)}
        </select>
        <select aria-label="Filtrar por fecha" value={dateFilter} onChange={event => setDateFilter(event.target.value)}>
          <option value="">Cualquier fecha</option><option value="today">Hoy</option><option value="week">Últimos 7 días</option>
        </select>
        <Button onClick={() => { setQuery(''); setStateFilter(''); setDateFilter('') }}>Limpiar filtros</Button>
        <Button variant="primary" onClick={refresh}>Actualizar</Button>
      </div>
    </div>
    <div className="rc-card rc-requests" aria-busy={isRefreshing || (!rows && !loadError)}>
      <h2>Solicitudes de recuperación</h2><p>Los enlaces vencen automáticamente después de 1 minuto.</p>
      <table className="rc-table">
        <thead><tr>{['Usuario', 'Cuenta', 'Correo protegido', 'Fecha de solicitud', 'Vencimiento', 'Estado', 'Acción'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{loadError || !rows || filtered.length === 0 ? <tr className="rc-state-row"><td colSpan={7}>
          {loadError ? <div className="rc-state" role="alert"><strong>No pudimos cargar las solicitudes.</strong><Button onClick={refresh}>Reintentar</Button></div>
            : !rows ? <div className="rc-state" role="status">Cargando solicitudes…</div>
              : <div className="rc-state" role="status"><strong>No se encontraron solicitudes de recuperación</strong><p>Prueba con otros términos o limpia los filtros.</p></div>}
        </td></tr> : filtered.map(row => <tr key={row.id}>
          <td data-label="Usuario"><strong>{row.name}</strong></td><td data-label="Cuenta">{row.username}</td>
          <td data-label="Correo protegido">{protectedEmail(row.email)}</td><td data-label="Fecha de solicitud">{dateFormat.format(row.requestedAt)}</td>
          <td data-label="Vencimiento">{row.expiresAt ? timeFormat.format(row.expiresAt) : '—'}</td>
          <td data-label="Estado"><Badge status={statusAt(row, now)} /></td>
          <td data-label="Acción"><Button aria-label={`Detalle de ${row.name}`} onClick={() => setSelectedId(row.id)}>…</Button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {isRefreshing && <RecoveryDialog className="rc-update" title="Actualizando solicitudes..."
      description="Estamos actualizando las solicitudes. Un momento, por favor." />}
    {selected && selectedState && <RecoveryDialog className="rc-detail" title="Detalle de recuperación" onDismiss={() => setSelectedId('')}>
      <div className="rc-detail-content">
        <dl>
          <div className="rc-detail-wide"><dt>Usuario</dt><dd><strong>{selected.name}</strong></dd></div>
          <div className="rc-detail-wide"><dt>Nombre de usuario</dt><dd>{selected.username}</dd></div>
          <div><dt>DNI protegido</dt><dd>{selectedDocument ? `••••••${selectedDocument.slice(-2)}` : '—'}</dd></div>
          <div><dt>Fecha de solicitud</dt><dd>{dateFormat.format(selected.requestedAt)}</dd></div>
          <div><dt>Correo protegido</dt><dd>{protectedEmail(selected.email)}</dd></div>
          <div><dt>Vencimiento</dt><dd>{selectedExpiry ? timeFormat.format(selectedExpiry) : '—'}</dd></div>
          <div className="rc-detail-wide"><dt>Vigencia del enlace</dt><dd>
            {selectedState === 'Enlace enviado' ? <span className="rc-countdown">{countdown} restantes</span> : '—'}
          </dd></div>
          <div className="rc-detail-wide"><dt>Estado actual</dt><dd><Badge status={selectedState} /></dd></div>
        </dl>
        <div className="rc-history">
          <b>Historial breve</b><p>{timeFormat.format(selected.requestedAt)} · Solicitud creada por el usuario</p>
          {selectedExpiry && <p>{timeFormat.format(selectedExpiry - recoveryLifetime)} · Enlace generado</p>}
          {selectedState === 'Enlace enviado' && selected.code && <a href={resetPath(selected.code)}>Abrir enlace de demostración</a>}
        </div>
        <footer>
          {!['Cancelada', 'Recuperada'].includes(selectedState) && <div className="rc-detail-actions">
            <Button variant="primary" onClick={() => setAction('send')}>{isFirstLink ? 'Enviar enlace' : 'Reenviar enlace'}</Button>
            <Button onClick={() => setAction('cancel')}>Cancelar solicitud</Button>
          </div>}
          <Button className="rc-detail-dismiss" onClick={() => setSelectedId('')}>Cerrar</Button>
        </footer>
      </div>
    </RecoveryDialog>}
    {action === 'send' && selected && <RecoveryDialog className="rc-confirm rc-confirm-send"
      title={isFirstLink ? '¿Deseas enviar el enlace de recuperación a este usuario?' : '¿Deseas reenviar el enlace de recuperación a este usuario?'}
      description="Se generará un nuevo enlace con vigencia de 1 minuto." onDismiss={() => setAction(undefined)}>
      <footer>
        <Button variant="primary" onClick={perform}>{isFirstLink ? 'Sí, enviar' : 'Sí, reenviar'}</Button>
        <Button autoFocus onClick={() => setAction(undefined)}>No, cancelar</Button>
      </footer>
    </RecoveryDialog>}
    {action === 'cancel' && selected && <RecoveryDialog className="rc-confirm rc-confirm-cancel"
      title="¿Cancelar esta solicitud?" description="El enlace dejará de funcionar y el usuario deberá iniciar una nueva recuperación."
      showClose={false} onDismiss={() => setAction(undefined)}>
      <footer>
        <Button onClick={perform}>Sí, cancelar solicitud</Button>
        <Button variant="primary" autoFocus onClick={() => setAction(undefined)}>No, continuar</Button>
      </footer>
    </RecoveryDialog>}
    <div className="rc-notice-region" role="status">
      {notice && <div className="rc-notice"><strong>{notice.title}</strong><p>{notice.detail}</p></div>}
    </div>
  </section>
}

function RecoveryShell({ children }: { children: ReactNode }) {
  return <main className="rc-public">
    <section className="rc-campus" style={{ backgroundImage: `linear-gradient(#173685cc,#173685dd), url("${campus}")` }}>
      <img src="/escudo.png" alt="" /><h2>Sistema de Matrícula<br />y Asistencia</h2>
      <span /><strong>I.E. Mariscal Castilla</strong><p>Secundaria · Daniel Hernández,<br />Tayacaja – Huancavelica</p>
    </section>
    <section className="rc-access">
      <article className="rc-form">{children}</article>
    </section>
  </main>
}

export function SolicitarRecuperacion() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<RecoveryRequest>()
  const [error, setError] = useState('')
  const emailId = useId()

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    try {
      const normalized = email.trim().toLowerCase()
      const rows = readRequests()
      const previous = rows.find(row => row.email.toLowerCase() === normalized)
      const id = crypto.randomUUID()
      const next = issueLink({ id, email: normalized, name: previous?.name ?? 'Usuario de demostración',
        username: previous?.username ?? normalized.split('@')[0], requestedAt: Date.now(), status: 'Pendiente' })
      const pending = rows.map(row => row.email === normalized && statusAt(row) === 'Enlace enviado'
        ? { ...row, status: 'Vencida' as const, code: undefined, expiresAt: Date.now() } : row)
      saveRequests([next, ...pending])
      setSent(next)
      setError('')
    } catch {
      setError('No se pudo generar el enlace. Vuelve a intentarlo.')
    }
  }
  return <RecoveryShell>
    <h1>{sent ? 'Enlace enviado' : 'Recuperar cuenta'}</h1>
    <p>{sent ? 'El enlace será válido durante 1 minuto.' : 'Ingresa el correo registrado para recibir un enlace temporal.'}</p>
    <form onSubmit={send}>
      {sent ? <><label>Información</label><div className="rc-demo-link"><a href={resetPath(sent.code ?? '')}>Abrir enlace de demostración</a></div></>
        : <><label htmlFor={emailId}>Correo de recuperación</label><input id={emailId} type="email" autoComplete="email" placeholder="ejemplo@correo.com"
          value={email} onChange={event => setEmail(event.target.value)} required /></>}
      {error && <p className="rc-form-error" role="alert">{error}</p>}
      <div className="rc-return"><a href="#acceso">Volver al inicio de sesión</a></div>
      <Button className="rc-gold" type="submit">{sent ? 'Reenviar enlace' : 'Enviar enlace'}</Button>
      <small>Demostración local. El enlace se muestra en pantalla.</small>
    </form>
  </RecoveryShell>
}

function currentCode() {
  return new URLSearchParams(location.hash.split('?')[1] ?? '').get('enlace')
}

export function RestablecerCuenta() {
  const now = useClock()
  const [code, setCode] = useState(currentCode)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const update = () => { setCode(currentCode()); setDone(false); setError('') }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const [requests, setRequests] = useState<{ code: string; rows: RecoveryRequest[] }>()
  useEffect(() => {
    if (!code) return
    try { setRequests({ code, rows: readRequests() }) }
    catch { setRequests({ code, rows: [] }); setError('No se pudo comprobar el enlace.') }
  }, [code])
  const request = code && requests?.code === code ? requests.rows.find(row => row.code === code) : undefined
  const valid = request && statusAt(request, now) === 'Enlace enviado'
  if (code && requests?.code !== code) return <RecoveryShell><p role="status">Comprobando el enlace…</p></RecoveryShell>

  function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = String(values.get('password') ?? '')
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      setError('Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.')
      return
    }
    if (password !== values.get('confirm')) {
      setError('Las contraseñas deben coincidir.')
      return
    }
    try {
      const current = readRequests()
      const target = current.find(row => row.code === code)
      if (!code) return
      if (!target || statusAt(target) !== 'Enlace enviado') { setRequests({ code, rows: current }); return }
      const next = current.map(row => row.id === target.id ? { ...row, status: 'Recuperada' as const, code: undefined } : row)
      saveRequests(next)
      setRequests({ code, rows: next })
      setError('')
      setDone(true)
    } catch { setError('No se pudo completar la recuperación.') }
  }

  return <RecoveryShell>
    <h1>{done ? 'Contraseña restablecida' : valid ? 'Crear nueva contraseña' : 'Enlace vencido'}</h1>
    {done ? <><p role="status">La recuperación de demostración se completó.</p><a className="rc-gold rc-link-button" href="#acceso">Volver al inicio de sesión</a></> :
      valid ? <>
        <p>Mínimo 8 caracteres · 1 mayúscula · 1 minúscula · 1 número · 1 carácter especial.</p>
        <form onSubmit={reset}>
          <label>Nueva contraseña<input type="password" name="password" autoComplete="new-password" required /></label>
          <label>Confirmar contraseña<input type="password" name="confirm" autoComplete="new-password" required /></label>
          {error && <p className="rc-form-error" role="alert">{error}</p>}
          <div className="rc-return"><a href="#acceso">Volver al inicio de sesión</a></div>
          <Button className="rc-gold" type="submit">Guardar nueva contraseña</Button>
          <small>Usa una contraseña ficticia para la prueba.</small>
        </form>
      </> : <>
        <p>El enlace ya no está disponible. Solicita uno nuevo.</p>
        {error && <p className="rc-form-error" role="alert">{error}</p>}
        <div className="rc-return"><a href="#acceso">Volver al inicio de sesión</a></div>
        <a className="rc-gold rc-link-button" href={recoverPath}>Solicitar nuevo enlace</a>
      </>}
  </RecoveryShell>
}
