import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, ChevronUp, CheckCircle2, CircleDashed, Copy, Eye, EyeOff, GripVertical, ListTree, MoreHorizontal, Pencil, Plus, Save, Search, Trash2, TriangleAlert } from './interno/iconos'
import { Avatar, Badge, Btn, Card, EmptyState, Field, Input, PageHead, SearchBox, Segmented, Select, StatTile } from './interno/ui/kit'
import { ConfirmDialog, Modal } from './interno/ui/modal'
import { RowMenu } from './interno/ui/rowmenu'
import { useToast } from './interno/ui/toast'
import { useDirty } from './interno/guardia'
import { conEvento, setState, useAdmin } from './interno/datos/store'
import { uid } from './interno/datos/lib'
import { ICONOS, iconoDe } from './interno/catalogo-iconos'
import type { Menu } from './interno/datos/types'

const hijos = (l: Menu[], id: string) => l.filter((m) => m.padreId === id).sort((a, b) => a.orden - b.orden)
const raices = (l: Menu[]) => l.filter((m) => !m.padreId).sort((a, b) => a.orden - b.orden)
const codigoDe = (n: string) => `NAV-${n.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`

export default function MenusSubmenus() {
  const s = useAdmin()
  const { notify } = useToast()
  const [draft, setDraft] = useState<Menu[]>(s.menus)
  const [sel, setSel] = useState<string | null>('m-cfg-menu')
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => Object.fromEntries(s.menus.filter((m) => !m.padreId).map((m) => [m.id, m.id === 'm-acc'])))
  const [q, setQ] = useState(''); const [fMod, setFMod] = useState(''); const [fEst, setFEst] = useState(''); const [fNivel, setFNivel] = useState('')
  const [form, setForm] = useState<{ modo: 'nuevo' | 'editar'; menu?: Menu } | null>(null)
  const [conf, setConf] = useState<{ tipo: 'eliminar' | 'bloqueo' | 'salir'; menu: Menu } | null>(null)
  const [previa, setPrevia] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [arrastre, setArrastre] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)

  const cambios = useMemo(() => {
    const orig = new Map(s.menus.map((m) => [m.id, JSON.stringify(m)]))
    const nuevo = new Map(draft.map((m) => [m.id, JSON.stringify(m)]))
    let n = 0
    nuevo.forEach((v, k) => { if (orig.get(k) !== v) n++ })
    orig.forEach((_, k) => { if (!nuevo.has(k)) n++ })
    return n
  }, [s.menus, draft])
  const { dialogo } = useDirty(cambios > 0)

  const principales = draft.filter((m) => !m.padreId), subs = draft.filter((m) => !!m.padreId)
  const filtrando = !!(q || fMod || fEst || fNivel)
  const coincide = (m: Menu) => {
    const t = q.trim().toLowerCase()
    return (!t || `${m.nombre} ${m.codigo}`.toLowerCase().includes(t)) && (!fMod || m.moduloId === fMod) &&
      (!fEst || (fEst === 'oculto' ? !m.visible : fEst === 'visible' ? m.visible : m.estado === fEst)) &&
      (!fNivel || (fNivel === 'menu' ? !m.padreId : !!m.padreId))
  }
  const totalCoincide = draft.filter(coincide).length
  const seleccionado = draft.find((m) => m.id === sel) ?? null
  const modOf = (id: string) => s.modulos.find((m) => m.id === id)?.nombre ?? '—'

  const filasVisibles = raices(draft).flatMap((p) => {
    const hs = hijos(draft, p.id)
    const hsMatch = hs.filter(coincide)
    if (filtrando && !coincide(p) && hsMatch.length === 0) return []
    const mostrarHijos = filtrando ? hsMatch : abiertos[p.id] ? hs : []
    return [{ m: p, nivel: 0 as const, hs: hs.length }, ...mostrarHijos.map((h) => ({ m: h, nivel: 1 as const, hs: 0 }))]
  })

  const reordenar = (lista: Menu[], id: string, destinoId: string | null, delta?: number) => {
    const m = lista.find((x) => x.id === id)!
    const sib = lista.filter((x) => x.padreId === m.padreId).sort((a, b) => a.orden - b.orden)
    const de = sib.findIndex((x) => x.id === id)
    let a = destinoId ? sib.findIndex((x) => x.id === destinoId) : de + (delta ?? 0)
    if (a < 0 || a >= sib.length || a === de) return lista
    const arr = [...sib]; arr.splice(de, 1); arr.splice(a, 0, m)
    const nuevoOrden = new Map(arr.map((x, i) => [x.id, i + 1]))
    return lista.map((x) => (nuevoOrden.has(x.id) ? { ...x, orden: nuevoOrden.get(x.id)! } : x))
  }
  const mover = (m: Menu, delta: number) => setDraft((l) => reordenar(l, m.id, null, delta))

  const alternarVisible = (m: Menu) => setDraft((l) => l.map((x) => (x.id === m.id ? { ...x, visible: !x.visible } : x)))
  const duplicar = (m: Menu) => {
    const mismos = draft.filter((x) => x.padreId === m.padreId)
    let codigo = `${m.codigo}-COPIA`, i = 2
    while (draft.some((x) => x.codigo === codigo)) codigo = `${m.codigo}-COPIA${i++}`
    const copia: Menu = { ...m, id: uid('m'), nombre: `${m.nombre} (copia)`, codigo, orden: Math.max(0, ...mismos.map((x) => x.orden)) + 1 }
    setDraft((l) => [...l, copia]); setSel(copia.id)
    notify({ tipo: 'info', titulo: 'Opción duplicada', texto: m.padreId ? 'Guarda la estructura para aplicar el cambio.' : 'Se duplicó solo el menú, sin sus submenús. Guarda la estructura para aplicar.' })
  }
  const intentarEliminar = (m: Menu) => setConf({ tipo: hijos(draft, m.id).length ? 'bloqueo' : 'eliminar', menu: m })
  const eliminar = (m: Menu) => { setDraft((l) => l.filter((x) => x.id !== m.id)); if (sel === m.id) setSel(null); notify({ tipo: 'info', titulo: 'Opción quitada de la estructura', texto: 'Guarda la estructura para aplicar el cambio.' }) }

  const guardar = () => {
    setGuardando(true)
    window.setTimeout(() => {
      const ids = new Set(draft.map((m) => m.id))
      setState((st) => {
        const limpiar = (r: Record<string, string[]>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.filter((id) => ids.has(id))]))
        return conEvento({ ...st, menus: draft, asignaciones: { rol: limpiar(st.asignaciones.rol), usuario: limpiar(st.asignaciones.usuario) } }, { accion: `Estructura de menús guardada (${cambios} cambio${cambios === 1 ? '' : 's'})`, modulo: 'Menús y submenús' })
      })
      setGuardando(false)
      notify({ titulo: 'Estructura guardada correctamente', texto: 'La navegación ya refleja los cambios.' })
    }, 700)
  }

  const guardarForm = (d: Omit<Menu, 'id'>) => {
    if (form?.modo === 'editar' && form.menu) {
      setDraft((l) => l.map((x) => (x.id === form.menu!.id ? { ...x, ...d } : x))); setSel(form.menu.id)
      notify({ tipo: 'info', titulo: 'Opción actualizada', texto: 'Guarda la estructura para aplicar el cambio.' })
    } else {
      const nuevo = { ...d, id: uid('m') }
      setDraft((l) => [...l, nuevo]); setSel(nuevo.id)
      if (d.padreId) setAbiertos((a) => ({ ...a, [d.padreId!]: true }))
      notify({ titulo: 'Opción agregada', texto: 'Guarda la estructura para aplicar el cambio.' })
    }
    setForm(null)
  }

  const limpiar = () => { setQ(''); setFMod(''); setFEst(''); setFNivel('') }
  const todosAbiertos = raices(draft).every((p) => abiertos[p.id])

  return (
    <div className="adm-root">
      <PageHead
        title="Menús y submenús" subtitle="Organiza la estructura de navegación y las opciones visibles del sistema."
        badge={<span className="flex flex-wrap justify-end gap-2"><Badge tone="sky">{principales.length} menús configurados</Badge><Badge tone="sky">{subs.length} submenús</Badge></span>}
        actions={<>
          <Btn variant="outline" icon={Eye} onClick={() => setPrevia(true)}>Vista previa</Btn>
          <Btn icon={Plus} onClick={() => setForm({ modo: 'nuevo' })}>Nuevo menú</Btn>
          <Btn variant="primary" icon={Save} onClick={guardar} disabled={cambios === 0} loading={guardando}>{guardando ? 'Guardando…' : 'Guardar estructura'}</Btn>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={CheckCircle2} tone="green" label="Menús activos" value={principales.filter((m) => m.estado === 'activo').length} />
        <StatTile icon={CheckCircle2} tone="green" label="Submenús activos" value={subs.filter((m) => m.estado === 'activo').length} />
        <StatTile icon={CircleDashed} tone="gray" label="Opciones ocultas" value={draft.filter((m) => !m.visible).length} />
        <StatTile icon={TriangleAlert} tone="orange" label="Cambios sin guardar" value={cambios} />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]">
          <SearchBox value={q} onChange={setQ} placeholder="Buscar menú o submenú" />
          <Select aria-label="Módulo" value={fMod} onChange={(e) => setFMod(e.target.value)}><option value="">Todos los módulos</option>{s.modulos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</Select>
          <Select aria-label="Estado" value={fEst} onChange={(e) => setFEst(e.target.value)}><option value="">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="visible">Visible</option><option value="oculto">Oculto</option></Select>
          <Select aria-label="Nivel" value={fNivel} onChange={(e) => setFNivel(e.target.value)}><option value="">Todos los niveles</option><option value="menu">Menú principal</option><option value="sub">Submenú</option></Select>
          <Btn variant="outline" onClick={limpiar} disabled={!filtrando}>Limpiar filtros</Btn>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">{filtrando ? `${totalCoincide} resultado${totalCoincide === 1 ? '' : 's'}` : `${draft.length} resultados`} · {principales.length} menús y {subs.length} submenús</p>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-base font-bold text-[#0e1d4d]">Estructura de navegación</h2><p className="text-xs text-slate-500">Arrastra para reordenar · Selecciona para editar</p></div>
            <Btn variant="soft" size="sm" onClick={() => setAbiertos(Object.fromEntries(raices(draft).map((p) => [p.id, !todosAbiertos])))}>{todosAbiertos ? 'Vista contraída' : 'Todo expandido'}</Btn>
          </div>
          <div className="mt-4 border-t border-[#e3e9f5] pt-3">
            {filasVisibles.length === 0 && <EmptyState icon={Search} title="No hay opciones con esos filtros" text="Prueba con otros términos o limpia los filtros." action={<Btn variant="outline" onClick={limpiar}>Limpiar filtros</Btn>} />}
            <ul className="space-y-1" role="tree">
              {filasVisibles.map(({ m, nivel, hs }) => (
                <li
                  key={m.id} role="treeitem" aria-selected={sel === m.id} aria-level={nivel + 1}
                  draggable onDragStart={(e) => { setArrastre(m.id); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => { setArrastre(null); setSobre(null) }}
                  onDragOver={(e) => { const a = draft.find((x) => x.id === arrastre); if (a && a.padreId === m.padreId && a.id !== m.id) { e.preventDefault(); setSobre(m.id) } }}
                  onDrop={(e) => { e.preventDefault(); if (arrastre) setDraft((l) => reordenar(l, arrastre, m.id)); setArrastre(null); setSobre(null) }}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${nivel ? 'ml-9 bg-[#f5f7fc]/70' : 'bg-white'} ${sel === m.id ? 'border-[#0fa3a3] ring-1 ring-[#0fa3a3]' : 'border-transparent hover:border-[#e3e9f5]'} ${sobre === m.id ? 'border-dashed border-[#1553e0] bg-blue-50' : ''} ${arrastre === m.id ? 'opacity-50' : ''}`}
                >
                  <GripVertical size={16} className="shrink-0 cursor-grab text-slate-400" aria-hidden />
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSel(m.id)}>
                    <Avatar text={m.nombre[0].toUpperCase()} tone="blue" size="sm" />
                    <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${m.visible ? 'text-[#0e1d4d]' : 'text-slate-400'}`}>{m.nombre}</span>
                  </button>
                  <Badge tone="gray" className="hidden sm:inline-flex">{nivel ? 'Submenú' : 'Menú'}</Badge>
                  <button onClick={() => alternarVisible(m)} aria-label={`${m.visible ? 'Ocultar' : 'Mostrar'} ${m.nombre}`}><Badge tone={m.visible ? 'green' : 'red'}>{m.visible ? 'Visible' : 'Oculto'}</Badge></button>
                  {nivel === 0 && hs > 0 ? (
                    <button aria-label={abiertos[m.id] ? 'Contraer' : 'Expandir'} onClick={() => setAbiertos((a) => ({ ...a, [m.id]: !a[m.id] }))} className="rounded-md p-1 text-[#0e1d4d] hover:bg-[#f1f5fb]">
                      {abiertos[m.id] || filtrando ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  ) : <span className="w-6" />}
                  <RowMenu label={`Acciones de ${m.nombre}`} items={[
                    { label: 'Editar opción', icon: <Pencil size={14} />, onClick: () => setForm({ modo: 'editar', menu: m }) },
                    { label: 'Duplicar', icon: <Copy size={14} />, onClick: () => duplicar(m) },
                    { label: 'Subir', icon: <ArrowUp size={14} />, onClick: () => mover(m, -1) },
                    { label: 'Bajar', icon: <ArrowDown size={14} />, onClick: () => mover(m, 1) },
                    { label: m.visible ? 'Ocultar' : 'Mostrar', icon: m.visible ? <EyeOff size={14} /> : <Eye size={14} />, onClick: () => alternarVisible(m), separador: true },
                    { label: 'Eliminar', icon: <Trash2 size={14} />, tone: 'danger', onClick: () => intentarEliminar(m) },
                  ]} />
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="h-fit p-6 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#0e1d4d]">Detalle de la opción</h2>
            {seleccionado && <Badge tone="sky">{seleccionado.padreId ? 'Submenú seleccionado' : 'Menú seleccionado'}</Badge>}
          </div>
          {!seleccionado ? (
            <p className="mt-6 rounded-xl bg-[#f1f5fb] p-5 text-center text-sm text-slate-500">Selecciona una opción de la estructura para ver su detalle.</p>
          ) : (
            <>
              <div className="mt-5 flex items-center gap-4">
                <Avatar text={seleccionado.nombre[0].toUpperCase()} tone="blue" size="lg" />
                <div className="min-w-0"><p className="truncate text-base font-bold text-[#0e1d4d]">{seleccionado.nombre}</p><p className="truncate text-[11px] tracking-wide text-slate-400">{seleccionado.codigo}</p></div>
              </div>
              <dl className="mt-5 divide-y divide-[#e3e9f5] text-sm">
                {[
                  ['Módulo', modOf(seleccionado.moduloId)], ['Ruta', seleccionado.ruta], ['Orden', String(seleccionado.orden)],
                  ['Estado', seleccionado.estado === 'activo' ? 'Activo' : 'Inactivo'], ['Visibilidad', seleccionado.visible ? 'Visible' : 'Oculto'],
                  ['Elemento padre', draft.find((x) => x.id === seleccionado.padreId)?.nombre ?? 'Sin elemento padre'],
                ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-right text-[13px] font-medium text-[#0e1d4d]">{v}</dd></div>)}
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Btn onClick={() => setForm({ modo: 'editar', menu: seleccionado })}>Editar opción</Btn>
                <Btn variant="outline" onClick={() => duplicar(seleccionado)}>Duplicar</Btn>
              </div>
            </>
          )}
        </Card>
      </div>

      {dialogo}
      {form && <FormMenu modo={form.modo} menu={form.menu} draft={draft} onClose={() => setForm(null)} onSave={guardarForm} />}

      {previa && (
        <Modal title="Vista previa del menú" subtitle="Así se verá la navegación para los usuarios con acceso a todo." onClose={() => setPrevia(false)} accent="teal" size="sm" footer={<Btn onClick={() => setPrevia(false)}>Cerrar</Btn>}>
          <div className="rounded-xl bg-[#12298a] p-3 text-white">
            {raices(draft).filter((p) => p.visible && p.estado === 'activo').map((p) => (
              <div key={p.id} className="mb-2">
                <p className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-bold">{(() => { const I = iconoDe(p.icono); return <I size={15} className="text-teal-300" /> })()}{p.nombre}</p>
                {hijos(draft, p.id).filter((h) => h.visible && h.estado === 'activo').map((h) => <p key={h.id} className="rounded-md px-2 py-1.5 pl-9 text-xs text-white/85">{h.nombre}</p>)}
              </div>
            ))}
          </div>
          {cambios > 0 && <p className="mt-3 flex items-center gap-2 text-xs text-amber-700"><TriangleAlert size={14} />Esta vista incluye {cambios} cambio{cambios === 1 ? '' : 's'} sin guardar.</p>}
        </Modal>
      )}

      {conf?.tipo === 'eliminar' && (
        <ConfirmDialog title="¿Eliminar esta opción?" description="La opción dejará de aparecer en la navegación. Los submenús asociados deben reasignarse antes de continuar."
          note="Si existen dependencias, la eliminación será bloqueada." onCancel={() => setConf(null)} onConfirm={() => { eliminar(conf.menu); setConf(null) }} />
      )}
      {conf?.tipo === 'bloqueo' && (
        <ConfirmDialog tone="warning" icon={AlertTriangle} title="No se puede eliminar esta opción" hideConfirm cancelLabel="Entendido"
          description={<>«{conf.menu.nombre}» tiene {hijos(draft, conf.menu.id).length} submenú(s): {hijos(draft, conf.menu.id).map((h) => h.nombre).join(', ')}. Reasígnalos o elimínalos primero.</>} onCancel={() => setConf(null)} onConfirm={() => setConf(null)} />
      )}
    </div>
  )
}

type Datos = Omit<Menu, 'id'>

function FormMenu({ modo, menu, draft, onClose, onSave }: { modo: 'nuevo' | 'editar'; menu?: Menu; draft: Menu[]; onClose: () => void; onSave: (d: Datos) => void }) {
  const { modulos } = useAdmin()
  const tieneHijos = !!menu && hijos(draft, menu.id).length > 0
  const inicial: Datos = menu
    ? { nombre: menu.nombre, codigo: menu.codigo, moduloId: menu.moduloId, padreId: menu.padreId, ruta: menu.ruta, icono: menu.icono, orden: menu.orden, estado: menu.estado, visible: menu.visible }
    : { nombre: '', codigo: '', moduloId: '', padreId: null, ruta: '/', icono: '', orden: raices(draft).length + 1, estado: 'activo', visible: true }
  const [d, setD] = useState<Datos>(inicial)
  const [nivel, setNivel] = useState<'menu' | 'sub'>(menu?.padreId ? 'sub' : 'menu')
  const [tocado, setTocado] = useState(false)
  const [codigoManual, setCodigoManual] = useState(!!menu)
  const dirty = JSON.stringify({ ...d, n: nivel }) !== JSON.stringify({ ...inicial, n: menu?.padreId ? 'sub' : 'menu' })
  const padres = raices(draft).filter((p) => p.id !== menu?.id)

  const cambiarNivel = (n: 'menu' | 'sub') => {
    if (n === 'sub' && tieneHijos) return
    setNivel(n)
    setD((x) => n === 'menu' ? { ...x, padreId: null } : { ...x, padreId: x.padreId ?? padres[0]?.id ?? null })
  }
  const e = {
    nombre: d.nombre.trim().length < 3 ? 'El nombre es obligatorio (mín. 3 caracteres).' : '',
    codigo: !/^[A-Z0-9][A-Z0-9_-]{2,}$/.test(d.codigo) ? 'Usa mayúsculas, números o guiones.' : draft.some((m) => m.codigo === d.codigo && m.id !== menu?.id) ? 'Este código ya existe.' : '',
    moduloId: !d.moduloId ? 'Selecciona un módulo.' : '',
    padre: nivel === 'sub' && !d.padreId ? 'Selecciona el elemento padre.' : '',
    ruta: !/^\/[a-z0-9\-/_]*$/i.test(d.ruta) || d.ruta.length < 2 ? 'La ruta debe iniciar con "/".' : '',
    orden: !Number.isInteger(d.orden) || d.orden < 1 ? 'Ingresa un número de orden válido.' : '',
  }
  const ok = !Object.values(e).some(Boolean)
  const v = (k: keyof typeof e) => (tocado ? e[k] : '')
  const Ico = d.icono ? iconoDe(d.icono) : ListTree

  return (
    <Modal title={modo === 'nuevo' ? 'Nuevo menú o submenú' : 'Editar opción de navegación'} subtitle={modo === 'nuevo' ? 'Agrega una opción a la estructura de navegación.' : 'Actualiza la opción seleccionada.'} onClose={onClose} size="lg" dirty={dirty}
      footer={(cerrar) => <><Btn variant="outline" onClick={cerrar}>Cancelar</Btn><Btn onClick={() => { setTocado(true); if (ok) onSave({ ...d, nombre: d.nombre.trim() }) }}>Guardar opción</Btn></>}>
      <div className="mb-4"><Segmented className="w-full [&>button]:flex-1" value={nivel} onChange={cambiarNivel} options={[{ id: 'menu', label: 'Menú principal' }, { id: 'sub', label: 'Submenú' }]} /></div>
      {tieneHijos && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Este menú tiene submenús; para convertirlo en submenú reasígnalos primero.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" required error={v('nombre')}><Input value={d.nombre} error={!!v('nombre')} maxLength={40} onChange={(x) => setD({ ...d, nombre: x.target.value, codigo: codigoManual ? d.codigo : codigoDe(x.target.value) })} /></Field>
        <Field label="Código interno" required error={v('codigo')}><Input value={d.codigo} error={!!v('codigo')} maxLength={40} onChange={(x) => { setCodigoManual(true); setD({ ...d, codigo: x.target.value.toUpperCase().replace(/\s+/g, '-') }) }} /></Field>
        <Field label="Módulo" required error={v('moduloId')}><Select value={d.moduloId} error={!!v('moduloId')} onChange={(x) => setD({ ...d, moduloId: x.target.value })}><option value="">Selecciona un módulo</option>{modulos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</Select></Field>
        <Field label="Elemento padre" error={v('padre')}>
          <Select value={d.padreId ?? ''} disabled={nivel === 'menu'} error={!!v('padre')} onChange={(x) => setD({ ...d, padreId: x.target.value || null })}>
            {nivel === 'menu' ? <option value="">Sin elemento padre</option> : <><option value="">Selecciona el menú padre</option>{padres.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</>}
          </Select>
        </Field>
        <Field label="Ruta de navegación" required error={v('ruta')}><Input value={d.ruta} error={!!v('ruta')} onChange={(x) => setD({ ...d, ruta: x.target.value })} /></Field>
        <Field label="Icono"><Select value={d.icono} onChange={(x) => setD({ ...d, icono: x.target.value })}><option value="">Selecciona un icono</option>{Object.entries(ICONOS).map(([k, i]) => <option key={k} value={k}>{i.label}</option>)}</Select></Field>
        <Field label="Número de orden" required error={v('orden')}><Input type="number" min={1} value={Number.isNaN(d.orden) ? '' : d.orden} error={!!v('orden')} onChange={(x) => setD({ ...d, orden: x.target.value === '' ? NaN : Number(x.target.value) })} /></Field>
        <Field label="Estado"><Select value={d.estado} onChange={(x) => setD({ ...d, estado: x.target.value as Menu['estado'] })}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></Select></Field>
        <Field label="Visibilidad"><Select value={d.visible ? 'v' : 'o'} onChange={(x) => setD({ ...d, visible: x.target.value === 'v' })}><option value="v">Visible</option><option value="o">Oculto</option></Select></Field>
        <Field label="Nivel"><Select value={nivel} onChange={(x) => cambiarNivel(x.target.value as 'menu' | 'sub')}><option value="menu">Menú principal</option><option value="sub" disabled={tieneHijos}>Submenú</option></Select></Field>
      </div>

      <div className="mt-5 rounded-xl border border-[#e3e9f5] bg-[#f5f7fc] p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#0e1d4d]">Vista previa en el sidebar</p><Badge tone="green" dot>Actualización automática</Badge></div>
        <div className="flex items-center gap-3 rounded-xl bg-[#12307f] p-3 text-white">
          <GripVertical size={14} className="text-white/50" />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15"><Ico size={17} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{d.nombre || 'Nombre de la opción'}</p><p className="truncate text-[11px] text-white/70">{d.nombre ? `${nivel === 'sub' ? 'Submenú' : 'Menú principal'} · orden ${Number.isFinite(d.orden) ? d.orden : '—'}` : 'Nivel, orden y visibilidad pendientes'}</p></div>
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold sm:block">{nivel === 'sub' ? 'Submenú' : 'Menú'}</span>
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold sm:block">{d.visible ? 'Visible' : 'Oculto'}</span>
          <MoreHorizontal size={16} className="text-white/70" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">* Nombre obligatorio · Código único · Ruta válida · Orden numérico · Módulo requerido</p>
    </Modal>
  )
}
