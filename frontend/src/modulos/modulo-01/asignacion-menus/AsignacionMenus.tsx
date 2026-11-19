import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, ConfirmDialog, useNotify } from '../../../compartido/componentes'
import './asignacion-menus.css'

const groups = [
  { label: 'Configuración general', items: ['Identidad del sistema', 'Catálogo de módulos', 'Menús y submenús'] },
  { label: 'Gestión de accesos', items: ['Gestión de usuarios', 'Roles y permisos', 'Cuentas de usuario', 'Asignación de menús'] },
  { label: 'Seguridad', items: ['Estados y vigencia'] },
  { label: 'Parámetros', items: ['Periodos académicos'] },
]
const allMenus = groups.flatMap(group => group.items)
const roles = [
  { id: 'admin', initials: 'AD', name: 'Administrador del sistema', detail: 'Control total' },
  { id: 'personal', initials: 'PA', name: 'Personal administrativo', detail: 'Acceso operativo' },
  { id: 'docente', initials: 'DO', name: 'Docente', detail: 'Acceso académico' },
  { id: 'estudiante', initials: 'ES', name: 'Estudiante', detail: 'Acceso de consulta' },
]
const people = [
  { id: 'lucia', initials: 'LM', name: 'Lucía Medina Torres', detail: 'Docente · lmedina', role: 'docente' },
  { id: 'mariana', initials: 'MR', name: 'Mariana Rivera', detail: 'Personal administrativo · mrivera', role: 'personal' },
  { id: 'diego', initials: 'DC', name: 'Diego Cruz', detail: 'Estudiante · dcruz', role: 'estudiante' },
]
const defaults: Record<string, string[]> = {
  admin: allMenus.filter(menu => !['Menús y submenús', 'Estados y vigencia'].includes(menu)),
  personal: ['Catálogo de módulos', 'Gestión de usuarios', 'Cuentas de usuario', 'Periodos académicos'],
  docente: ['Periodos académicos'],
  estudiante: [],
}
const storageKey = 'mariscalito.m1.asignacion-menus'
type Assignments = Record<string, string[]>
type Recipient = (typeof roles)[number] | (typeof people)[number]
type View = { state: 'loading' | 'error' } | { state: 'ready'; assignments: Assignments }

function loadAssignments(): Assignments {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return {}
  const value: unknown = JSON.parse(saved)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuración inválida')
  const result: Assignments = {}
  for (const recipient of [...roles, ...people]) {
    const items: unknown = (value as Record<string, unknown>)[recipient.id]
    if (items === undefined) continue
    if (!Array.isArray(items) || items.some(item => typeof item !== 'string' || !allMenus.includes(item))) {
      throw new Error('Menús no reconocidos')
    }
    result[recipient.id] = [...new Set(items)]
  }
  return result
}

function menusFor(assignments: Assignments, recipient: Recipient) {
  return assignments[recipient.id] ?? ('role' in recipient ? assignments[recipient.role] ?? defaults[recipient.role] : defaults[recipient.id])
}

function Dialog({ title, description, children, onClose, wide = false }: {
  title: string; description: string; children: ReactNode; onClose: () => void; wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} className={'am-dialog' + (wide ? ' am-wide' : '')} aria-label={title}
    onCancel={event => { event.preventDefault(); onClose() }}>
    <header>
      <div><h2>{title}</h2><p>{description}</p></div>
      <Button className="am-close" aria-label="Cerrar" onClick={onClose}>×</Button>
    </header>
    {children}
  </dialog>
}

export function AsignacionMenus() {
  const [view, setView] = useState<View>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setView({ state: 'ready', assignments: loadAssignments() }) }
      catch { setView({ state: 'error' }) }
    }, 230)
    return () => window.clearTimeout(timer)
  }, [attempt])

  return <div className="am">
    {view.state === 'ready' ? <Assignment initial={view.assignments} /> : <>
      <h1>Asignación de menús</h1>
      <section className="am-card am-state" aria-busy={view.state === 'loading'}>
        {view.state === 'loading' ? <p role="status">Cargando asignaciones…</p> : <>
          <p role="alert">No pudimos cargar las asignaciones.</p>
          <Button onClick={() => { setView({ state: 'loading' }); setAttempt(value => value + 1) }}>Reintentar</Button>
        </>}
      </section>
    </>}
  </div>
}

function Assignment({ initial }: { initial: Assignments }) {
  const notify = useNotify()
  const [saved, setSaved] = useState(initial)
  const [recipient, setRecipient] = useState<Recipient>(roles[0])
  const [mode, setMode] = useState<'roles' | 'users'>('roles')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string[] | null>(null)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [confirm, setConfirm] = useState<{ apply: () => void }>()
  const [dialog, setDialog] = useState<'preview' | 'copy'>()
  const [source, setSource] = useState(roles[0].id)
  const [target, setTarget] = useState(roles[2].id)
  const chooser = useRef<HTMLElement>(null)
  const baseline = menusFor(saved, recipient)
  const selection = draft ?? baseline
  const added = selection.filter(menu => !baseline.includes(menu))
  const removed = baseline.filter(menu => !selection.includes(menu))
  const changeCount = added.length + removed.length
  const matches = people.filter(person =>
    `${person.name} ${person.detail}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const visibleGroups = groups.filter(group => group.items.some(menu => selection.includes(menu)))

  function choose(next: Recipient, nextMode: typeof mode) {
    if (next.id === recipient.id && nextMode === mode) return
    const apply = () => {
      setRecipient(next)
      setMode(nextMode)
      setDraft(null)
      setSuccess(false)
    }
    if (changeCount) setConfirm({ apply })
    else apply()
  }

  function toggle(items: string[]) {
    const remove = items.every(menu => selection.includes(menu))
    setDraft(remove ? selection.filter(menu => !items.includes(menu)) : [...new Set([...selection, ...items])])
    setSuccess(false)
  }

  function save() {
    const next = { ...saved, [recipient.id]: selection }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setSaved(next)
      setDraft(null)
      setSuccess(true)
      notify({ type: 'success', message: 'Cambios guardados' })
    } catch {
      notify({ type: 'error', message: 'No se pudieron guardar los cambios. Reintenta cuando el almacenamiento esté disponible.' })
    }
  }

  function copyConfiguration() {
    const destination = roles.find(role => role.id === target)
    const origin = roles.find(role => role.id === source)
    if (!destination || !origin || destination.id === origin.id) return
    const apply = () => {
      setRecipient(destination)
      setMode('roles')
      setDraft([...menusFor(saved, origin)])
      setSuccess(false)
      notify({ type: 'success', message: 'Vista previa actualizada' })
    }
    setDialog(undefined)
    if (changeCount) setConfirm({ apply })
    else apply()
  }

  const tools = <>
    <Button onClick={() => setDialog('copy')}>Copiar configuración</Button>
    <Button onClick={() => setDialog('preview')}>Vista previa</Button>
  </>

  return <>
    <header className="am-heading">
      <div><h1>Asignación de menús</h1><p>Selecciona un rol y define los menús que podrá visualizar.</p></div>
      <div className="am-actions">
        <Button disabled={!changeCount} onClick={() => setConfirm({ apply: () => { setDraft(null); setSuccess(false) } })}>Cancelar cambios</Button>
        <Button variant="primary" disabled={!changeCount} onClick={save}>Guardar cambios</Button>
      </div>
      <div className="am-mobile-tools">
        <Button className="am-new" onClick={() => { chooser.current?.scrollIntoView({ block: 'start' }); chooser.current?.querySelector('button')?.focus() }}>＋ Nueva asignación</Button>
        {tools}
      </div>
    </header>

    <section className="am-card" ref={chooser} aria-labelledby="am-recipient">
      <div className="am-recipient-title">
        <h2 id="am-recipient">¿A quién deseas asignar menús?</h2>
        <div className="am-tabs" role="group" aria-label="Tipo de destinatario">
          <button type="button" aria-pressed={mode === 'roles'} onClick={() => choose(roles[0], 'roles')}>Por rol</button>
          <button type="button" aria-pressed={mode === 'users'} onClick={() => choose(people[0], 'users')}>Por usuario</button>
        </div>
      </div>
      {mode === 'users' && <input className="am-search" type="search" placeholder="Buscar por nombre o usuario" aria-label="Buscar por nombre o usuario"
        value={search} onChange={event => setSearch(event.target.value)} />}
      <div className="am-recipients">
        {(mode === 'roles' ? roles : matches).map(item =>
          <button type="button" key={item.id} className="am-recipient" aria-pressed={item.id === recipient.id} onClick={() => choose(item, mode)}>
            <span className="am-initial">{item.initials}</span><span><strong>{item.name}</strong><small>{item.detail}</small></span>
            <span className="am-active">Activo</span>
          </button>
        )}
        {mode === 'users' && !matches.length && <p className="am-state" role="status">No se encontraron usuarios.</p>}
      </div>
    </section>

    <div className="am-columns">
      <section className="am-card" aria-labelledby="am-menus">
        <h2 id="am-menus">Menús disponibles</h2><p>Marca o desmarca los módulos, menús y submenús visibles.</p>
        <div className="am-tree">
          {groups.map(group => {
            const count = group.items.filter(menu => selection.includes(menu)).length
            const open = !collapsed.includes(group.label)
            return <div key={group.label}>
              <div className="am-row am-group">
                <button type="button" className="am-arrow" aria-label={`${open ? 'Contraer' : 'Expandir'} ${group.label}`} aria-expanded={open}
                  onClick={() => setCollapsed(open ? [...collapsed, group.label] : collapsed.filter(label => label !== group.label))}>{open ? '⌄' : '›'}</button>
                <label>
                  <input type="checkbox" ref={element => { if (element) element.indeterminate = count > 0 && count < group.items.length }}
                    checked={count === group.items.length} onChange={() => toggle(group.items)} />
                  <span className="am-initial">{group.label[0]}</span><strong>{group.label}</strong>
                </label>
                <span data-on={count === group.items.length}>{count === group.items.length ? 'Asignado' : count ? 'Parcial' : 'No asignado'}</span>
              </div>
              {open && group.items.map(menu => <div className="am-row am-child" key={menu}>
                <label><input type="checkbox" checked={selection.includes(menu)} onChange={() => toggle([menu])} />
                  <span className="am-initial">{menu[0]}</span>{menu}</label>
                <span data-on={selection.includes(menu)}>{selection.includes(menu) ? 'Asignado' : 'No asignado'}</span>
              </div>)}
            </div>
          })}
        </div>
      </section>

      <aside className="am-card am-summary" aria-labelledby="am-summary">
        <h2 id="am-summary">Cambios pendientes</h2>
        <p>{changeCount ? 'Revisa la modificación antes de guardar.' : 'La configuración está actualizada.'}</p>
        <div className="am-summary-content" aria-live="polite">
          {changeCount ? <>
            <span className="am-count">{changeCount} {changeCount === 1 ? 'cambio' : 'cambios'}</span>
            {added.map(menu => <div className="am-change" key={menu}><small>＋ Asignar menú</small><strong>{menu}</strong></div>)}
            {removed.map(menu => <div className="am-change am-removed" key={menu}><small>− Quitar menú</small><strong>{menu}</strong></div>)}
          </> : <div className={'am-state' + (success ? ' am-success' : '')}>
            <span aria-hidden="true">✓</span><strong>{success ? 'Cambios guardados' : 'Todo está actualizado'}</strong>
            <p>{success ? 'La nueva visibilidad ya está activa.' : 'No hay modificaciones pendientes.'}</p>
          </div>}
        </div>
        <p className="am-note">Los permisos para crear, editar o eliminar se administran en Roles y permisos.</p>
        <div className="am-desktop-tools">{tools}</div>
      </aside>
    </div>

    {confirm && <ConfirmDialog title="Hay cambios sin guardar" cancelLabel="Seguir editando" confirmLabel="Descartar cambios"
      onClose={() => setConfirm(undefined)} onConfirm={() => { confirm.apply(); setConfirm(undefined) }}>
      Se descartarán las modificaciones pendientes. ¿Deseas continuar?
    </ConfirmDialog>}

    {dialog === 'preview' && <Dialog wide title="Vista previa de navegación" description="Comprueba la experiencia del rol antes de guardar."
      onClose={() => setDialog(undefined)}>
      <div className="am-preview">
        <div className="am-preview-menu"><img src="/escudo.png" alt="" /><strong>I.E. Mariscal Castilla</strong>
          {selection.map(menu => <span key={menu}>› {menu}</span>)}
        </div>
        <div className="am-preview-content">
          <h2>Asignación de menús</h2><p>Opciones visibles para {recipient.name}.</p>
          <div className="am-preview-counts"><strong>{visibleGroups.length} grupos visibles</strong><strong>{selection.length} menús visibles</strong></div>
          <section className="am-card"><h2>Navegación disponible</h2>
            {visibleGroups.length ? visibleGroups.map(group => <div className="am-visible" key={group.label}>{group.label}<span className="am-active">Visible</span></div>) :
              <p role="status">Este destinatario no tiene menús visibles.</p>}
          </section>
          {!!changeCount && <p className="am-success" role="status">Vista previa actualizada. Los cambios se muestran antes de guardar.</p>}
        </div>
      </div>
    </Dialog>}

    {dialog === 'copy' && <Dialog title="Copiar configuración" description="Replica la navegación de un rol y revisa el resultado antes de guardar."
      onClose={() => setDialog(undefined)}>
      <div className="am-copy">
        <label>Configuración de origen<select value={source} onChange={event => setSource(event.target.value)}>
          {roles.map(role => <option value={role.id} key={role.id}>{role.name} · {menusFor(saved, role).length} menús</option>)}
        </select></label>
        <label>Aplicar a<select value={target} onChange={event => setTarget(event.target.value)}>
          {roles.map(role => <option value={role.id} key={role.id}>{role.name}</option>)}
        </select></label>
        <p className="am-caution">Se copiará únicamente la visibilidad de navegación. Los permisos se conservan.</p>
        <div className="am-actions"><Button onClick={() => setDialog(undefined)}>Cancelar</Button>
          <Button variant="primary" disabled={source === target} onClick={copyConfiguration}>Copiar configuración</Button></div>
      </div>
    </Dialog>}
  </>
}
