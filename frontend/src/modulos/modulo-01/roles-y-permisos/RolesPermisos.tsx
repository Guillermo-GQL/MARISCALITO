import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './roles.css'

const modules = ['Administración del sistema', 'Configuración', 'Gestión académica', 'Comunicación']
const actions = [
  ['Consultar', 'Ver y buscar información'],
  ['Crear', 'Registrar nuevos datos'],
  ['Editar', 'Actualizar registros existentes'],
  ['Desactivar', 'Inhabilitar con confirmación'],
]
const colors = ['#142b84', '#0ea5a8', '#d4ab2d', '#7c3aed']
type Role = { id: string; name: string; code: string; description: string; active: boolean; users: number; permissions: Record<string, number> }
const initialRoles: Role[] = [
  { id: 'admin', name: 'Administrador del sistema', code: '', description: 'Configura el sistema y administra los accesos', active: true, users: 1, permissions: Object.fromEntries(modules.map(module => [module, 15])) },
  { id: 'personal', name: 'Personal administrativo', code: '', description: 'Gestiona los procesos administrativos', active: true, users: 5, permissions: { [modules[0]]: 1 } },
  { id: 'docente', name: 'Docente', code: '', description: 'Realiza funciones académicas asignadas', active: true, users: 24, permissions: { [modules[2]]: 1 } },
  { id: 'estudiante', name: 'Estudiante', code: '', description: 'Consulta servicios académicos habilitados', active: true, users: 98, permissions: { [modules[2]]: 1 } },
]
const storageKey = 'mariscalito:m1:roles:v1'
function readRoles(): Role[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return JSON.parse(raw)
  } catch {
    // Use the demo records when storage is unavailable.
  }
  return initialRoles
}
type DialogState = { kind: 'create' } | { kind: 'edit' | 'permissions' | 'status'; role: Role; module?: string }
type Notice = { message: string; detail?: string; tone: 'success' | 'warning' | 'error' }

function Dialog({ title, subtitle, variant, close, children }: { title: string; subtitle?: string; variant?: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} className={variant ? 'rp-dialog ' + variant : 'rp-dialog'} aria-labelledby="rp-dialog-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="rp-dialog-head">
      <button className="rp-close" type="button" onClick={close} aria-label="Cerrar">×</button>
      <h2 id="rp-dialog-title">{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {children}
  </dialog>
}
const userCount = (count: number) => count + (count === 1 ? ' usuario' : ' usuarios')
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

export function RolesPermisos() {
  const [roles, setRoles] = useState(readRoles)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState('admin')
  const [dialog, setDialog] = useState<DialogState>()
  const [notice, setNotice] = useState<Notice>()
  const [savedChanges, setSavedChanges] = useState(0)
  const shown = roles.filter(role => normalize(role.name + ' ' + role.code).includes(normalize(query)) &&
    (status === 'all' || role.active === (status === 'active')))
  const selectedRole = roles.find(role => role.id === selected) ?? roles[0]
  const users = roles.reduce((sum, role) => sum + role.users, 0)
  const permissionCount = roles.reduce((sum, role) => sum + Object.values(role.permissions).reduce((total, mask) =>
    total + actions.filter((_, index) => mask & (1 << index)).length, 0), 0)
  const close = () => setDialog(undefined)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(undefined), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  function update(role: Role, message: string, detail?: string) {
    const next = roles.some(item => item.id === role.id)
      ? roles.map(item => item.id === role.id ? role : item)
      : [...roles, role]
    setRoles(next)
    setSavedChanges(count => count + 1)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setNotice({ message, detail, tone: 'success' })
    } catch {
      setNotice({ message: message + ' Los cambios estarán disponibles durante esta sesión.', tone: 'warning' })
    }
    close()
  }

  function changeStatus(role: Role) {
    if (role.id === 'admin' && role.active) {
      setNotice({ message: 'Acción no permitida', detail: 'No puedes desactivar el único administrador activo.', tone: 'error' })
      return
    }
    setDialog({ kind: 'status', role })
  }
  const openPermissions = (role: Role, module?: string) => setDialog({ kind: 'permissions', role, module })

  return <section className="rp" aria-labelledby="rp-title">
    <div className="rp-heading">
      <div>
        <h1 id="rp-title">Roles y permisos</h1>
        <p className="rp-desktop">Crea roles y define las acciones que pueden realizar en el sistema.</p>
        <p className="rp-small">Controla accesos y acciones del sistema.</p>
      </div>
      <button className="rp-new" type="button" onClick={() => setDialog({ kind: 'create' })}>+ Nuevo rol</button>
    </div>

    {notice && <div className={'rp-announcement rp-toast-' + notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'}>
      <span className="rp-toast-icon" aria-hidden="true">{notice.tone === 'success' ? '✓' : '!'}</span>
      <div><strong>{notice.message}</strong>{notice.detail && <p>{notice.detail}</p>}</div>
      <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(undefined)}>×</button>
    </div>}

    <div className="rp-desktop">
      <div className="rp-panel">
        <h2>Roles institucionales</h2>
        <p>Consulta los roles disponibles o administra sus permisos.</p>
        <div className="rp-filters">
          <label className="rp-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Buscar por nombre o código" placeholder="Buscar por nombre o código" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <select aria-label="Filtrar por estado" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <table>
          <colgroup>
            <col className="rp-col-role" /><col className="rp-col-description" />
            <col className="rp-col-state" /><col className="rp-col-actions" />
          </colgroup>
          <thead><tr><th>Rol</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {shown.map(role => <tr key={role.id}>
              <th scope="row"><div className="rp-role-name">
                <span className={role.id === 'admin' ? 'rp-initial rp-initial-admin' : 'rp-initial'} aria-hidden="true">{role.name[0]?.toUpperCase()}</span>
                <div><strong>{role.name}</strong><small>Código: {role.code || 'por sincronizar'}</small></div>
              </div></th>
              <td>{role.description || '—'}</td>
              <td><Badge active={role.active} /></td>
              <td><div className="rp-actions">
                <button type="button" onClick={() => setDialog({ kind: 'edit', role })}>Editar</button>
                <button type="button" className="rp-permission" onClick={() => openPermissions(role)}>Permisos</button>
                <button type="button" className={role.active ? 'rp-danger' : 'rp-permission'} onClick={() => changeStatus(role)}>{role.active ? 'Desactivar' : 'Reactivar'}</button>
              </div></td>
            </tr>)}
            {shown.length === 0 && <tr><td colSpan={4}>No se encontraron roles.</td></tr>}
          </tbody>
        </table>
      </div>
      <aside className="rp-note"><strong>Seguridad de los roles</strong><p>Los permisos se configuran por acción. Desactivar un rol requiere confirmación y no elimina sus registros.</p></aside>
    </div>

    <div className="rp-small">
      <div className="rp-stats" aria-label="Resumen">
        {[[roles.length, 'Roles'], [users, 'Usuarios'], [permissionCount, 'Permisos'], [savedChanges, 'Cambios']].map(([value, label]) =>
          <div key={label}><strong>{value}</strong> <span>{label}</span></div>)}
      </div>
      <div className="rp-mobile-summary">
        <p>{roles.length} roles · {users} usuarios · {permissionCount} permisos</p>
        <p>{savedChanges} {savedChanges === 1 ? 'cambio guardado' : 'cambios guardados'}</p>
      </div>
      <h2 className="rp-mobile-title">Selecciona un rol</h2>
      <div className="rp-cards">
        {roles.map((role, index) => <article key={role.id} className={role.id === selectedRole.id ? 'rp-selected' : ''}>
          <h3>{role.name}</h3><p>{userCount(role.users)}</p>
          <div><Badge active={role.active} /><button type="button" onClick={() => {
            setSelected(role.id)
            if (window.matchMedia('(max-width: 600px)').matches) openPermissions(role)
          }}>Configurar</button></div>
          <span aria-hidden="true" style={{ backgroundColor: colors[index % colors.length] }} />
        </article>)}
      </div>
      <div className="rp-selected-panel">
        <h2>{selectedRole.name}</h2><p>{selectedRole.id === 'admin' ? 'Acceso total · ' : ''}{userCount(selectedRole.users)}</p>
        <div className="rp-actions">
          <button type="button" onClick={() => setDialog({ kind: 'edit', role: selectedRole })}>Editar</button>
          <button type="button" className="rp-danger" onClick={() => changeStatus(selectedRole)}>{selectedRole.active ? 'Desactivar' : 'Reactivar'}</button>
        </div>
      </div>
      <h2 className="rp-module-title">Permisos por módulos</h2>
      <div className="rp-modules">
        {modules.map(module => {
          const count = actions.filter((_, index) => selectedRole.permissions[module] & (1 << index)).length
          return <button type="button" key={module} onClick={() => openPermissions(selectedRole, module)}>
            <strong>{module} · {count}/{actions.length}</strong><span aria-hidden="true" className={count ? 'rp-on' : ''} /> <span aria-hidden="true">›</span>
          </button>
        })}
      </div>
    </div>

    {dialog?.kind === 'create' && <RoleForm roles={roles} close={close} save={update} />}
    {dialog?.kind === 'edit' && <RoleForm role={dialog.role} roles={roles} close={close} save={update} />}
    {dialog?.kind === 'permissions' && <Permissions role={dialog.role} initialModule={dialog.module} close={close} save={update} />}
    {dialog?.kind === 'status' && <Dialog title={dialog.role.active ? '¿Desactivar rol?' : 'Reactivar rol'}
      variant={dialog.role.active ? 'rp-deactivate' : undefined}
      subtitle={dialog.role.active ? '¿Quieres desactivar el rol «' + dialog.role.name + '»?' : undefined} close={close}>
      <div className="rp-dialog-body">
        {dialog.role.active ? <div className="rp-warning">
          <span aria-hidden="true">!</span>
          <div><strong>Antes de continuar, verifica las cuentas asociadas.</strong>
            <p>La desactivación debe quedar registrada en la auditoría.</p></div>
        </div> : <p>¿Confirmas reactivar el rol {dialog.role.name}?</p>}
        <footer><button type="button" autoFocus onClick={close}>{dialog.role.active ? 'No, cancelar' : 'Cancelar'}</button>
          <button type="button" className={dialog.role.active ? 'rp-confirm-danger' : 'rp-primary'} onClick={() => {
            const role = dialog.role
            update({ ...role, active: !role.active },
              role.active ? 'Rol desactivado correctamente' : 'Rol reactivado correctamente', role.name)
          }}>{dialog.role.active ? 'Sí, desactivar' : 'Reactivar'}</button></footer>
      </div>
    </Dialog>}
  </section>
}

function Badge({ active }: { active: boolean }) {
  return <span className={'rp-badge' + (active ? '' : ' rp-inactive')}>{active ? 'Activo' : 'Inactivo'}</span>
}

function RoleForm({ role, roles, close, save }: { role?: Role; roles: Role[]; close: () => void; save: (role: Role, message: string) => void }) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const code = String(data.get('code')).trim()
    const description = String(data.get('description')).trim()
    if (!name || (!role && !code)) {
      setError('Completa el nombre y el código interno.')
      return
    }
    if (roles.some(item => item.id !== role?.id && (normalize(item.name) === normalize(name) ||
      (code && normalize(item.code) === normalize(code))))) {
      setError('Ya existe un rol con ese nombre o código interno.')
      return
    }
    save({
      id: role?.id ?? String(Date.now()), name, code, description, active: role?.active ?? true,
      users: role?.users ?? 0, permissions: role?.permissions ?? {},
    }, role ? 'Rol actualizado.' : 'Rol creado.')
  }
  return <Dialog title={role ? 'Editar rol' : 'Nuevo rol'} subtitle={role ? 'Actualiza los datos del perfil de acceso.' : 'Crea un perfil de acceso reutilizable y seguro.'} close={close}>
    <form className="rp-dialog-body rp-form" onSubmit={submit}>
      <div className="rp-fields">
        <label>Nombre del rol<input name="name" required maxLength={80} defaultValue={role?.name} /></label>
        <label>Código interno<input name="code" required={!role} maxLength={32} placeholder="ROL_" defaultValue={role?.code} /></label>
      </div>
      <label>Descripción<textarea name="description" rows={2} maxLength={240} placeholder="Describe el alcance y responsabilidades" defaultValue={role?.description} /></label>
      <div className="rp-form-status"><strong>{role ? 'Estado actual' : 'Estado inicial'}</strong><div><Badge active={role?.active ?? true} /></div></div>
      <p className="rp-note">Los permisos de acción se configuran desde la lista de roles.</p>
      {error && <p role="alert" className="rp-error">{error}</p>}
      <footer><button type="button" onClick={close}>Cancelar</button><button className="rp-primary" type="submit">{role ? 'Guardar cambios' : 'Crear rol'}</button></footer>
    </form>
  </Dialog>
}

function Permissions({ role, initialModule, close, save }: { role: Role; initialModule?: string; close: () => void; save: (role: Role, message: string, detail: string) => void }) {
  const [module, setModule] = useState(initialModule ?? modules[0])
  const [draft, setDraft] = useState(role.permissions)
  const mask = draft[module] ?? 0
  const changed = modules.some(item => (draft[item] ?? 0) !== (role.permissions[item] ?? 0))
  return <Dialog title="Configurar permisos del rol" subtitle="Selecciona qué acciones permite este rol en un módulo." variant="rp-permissions-dialog" close={close}>
    <form className="rp-dialog-body rp-form" onSubmit={event => {
      event.preventDefault()
      if (changed) save({ ...role, permissions: draft }, 'Permisos guardados correctamente', role.name)
    }}>
      <label className="rp-module-select">Módulo del sistema
        <select value={module} onChange={event => setModule(event.target.value)}>{modules.map(item => <option key={item}>{item}</option>)}</select>
      </label>
      <div className="rp-checkboxes">
        {actions.map(([label, hint], index) => <label key={label}>
          <input type="checkbox" checked={Boolean(mask & (1 << index))} onChange={() => setDraft({ ...draft, [module]: mask ^ (1 << index) })} />
          <span><strong>{label}</strong><small>{hint}</small></span>
        </label>)}
      </div>
      <p>Aplica únicamente los permisos necesarios para el rol seleccionado.</p>
      <footer><button type="button" onClick={close}>Cancelar</button><button className="rp-primary" type="submit" disabled={!changed}>Aplicar</button></footer>
    </form>
  </Dialog>
}


