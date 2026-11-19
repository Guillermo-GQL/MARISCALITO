import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Eye, EyeOff, GripVertical, Pencil, Plus, Power, Search, Trash2, Wrench, ChevronRight, MoreHorizontal, ListFilter } from './interno/iconos'
import { Avatar, Badge, Btn, Card, EmptyState, Field, Input, PageHead, Pager, SearchBox, Select, StatTile, TD, TH, THEAD, Textarea, Toggle } from './interno/ui/kit'
import { ConfirmDialog, Modal } from './interno/ui/modal'
import { RowMenu } from './interno/ui/rowmenu'
import { useToast } from './interno/ui/toast'
import { conEvento, setState, useAdmin } from './interno/datos/store'
import { fmtFecha, nowISO, uid } from './interno/datos/lib'
import { ICONOS, iconoDe } from './interno/catalogo-iconos'
import type { Categoria, EstadoModulo, Modulo } from './interno/datos/types'

const CATEGORIAS: Categoria[] = ['Principal', 'Administración', 'Seguridad', 'Académico', 'Reportes']
const ESTADO_TONO: Record<EstadoModulo, 'green' | 'gray' | 'orange'> = { activo: 'green', inactivo: 'gray', mantenimiento: 'orange' }
const ESTADO_LABEL: Record<EstadoModulo, string> = { activo: 'Activo', inactivo: 'Inactivo', mantenimiento: 'Mantenimiento' }
const PAGE = 8

export default function CatalogoModulos() {
  const s = useAdmin()
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [est, setEst] = useState('')
  const [vis, setVis] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<{ modo: 'nuevo' | 'editar'; mod?: Modulo } | null>(null)
  const [detalle, setDetalle] = useState<Modulo | null>(null)
  const [conf, setConf] = useState<{ tipo: 'desactivar' | 'eliminar' | 'bloqueo'; mod: Modulo } | null>(null)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return [...s.modulos]
      .filter((m) => !t || `${m.nombre} ${m.descripcion} ${m.codigo}`.toLowerCase().includes(t))
      .filter((m) => !cat || m.categoria === cat)
      .filter((m) => !est || m.estado === est)
      .filter((m) => !vis || (vis === 'visible' ? m.visible : !m.visible))
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
  }, [s.modulos, q, cat, est, vis])

  const ultima = s.modulos.reduce((a, m) => (m.actualizado > a ? m.actualizado : a), '')
  const hayFiltros = !!(q || cat || est || vis)
  const limpiar = () => { setQ(''); setCat(''); setEst(''); setVis(''); setPage(1) }
  const filas = lista.slice((page - 1) * PAGE, page * PAGE)

  const parchear = (id: string, patch: Partial<Modulo>, accion: string) =>
    setState((st) => conEvento({ ...st, modulos: st.modulos.map((m) => (m.id === id ? { ...m, ...patch, actualizado: nowISO() } : m)) }, { accion, modulo: 'Catálogo de módulos' }))

  const alternarEstado = (m: Modulo) => {
    if (m.estado === 'activo') setConf({ tipo: 'desactivar', mod: m })
    else { parchear(m.id, { estado: 'activo' }, `Módulo activado: ${m.nombre}`); notify({ titulo: 'Módulo activado', texto: `${m.nombre} vuelve a estar disponible.` }) }
  }
  const alternarVisible = (m: Modulo) => { parchear(m.id, { visible: !m.visible }, `Visibilidad de módulo: ${m.nombre}`); notify({ tipo: 'info', titulo: m.visible ? 'Módulo oculto del menú' : 'Módulo visible en el menú' }) }

  const dependencias = (m: Modulo) => ({
    menus: s.menus.filter((x) => x.moduloId === m.id).length,
    permisos: Object.values(s.permisos).filter((p) => (p[m.id]?.length ?? 0) > 0).length,
  })
  const intentarEliminar = (m: Modulo) => {
    const d = dependencias(m)
    setConf({ tipo: d.menus || d.permisos ? 'bloqueo' : 'eliminar', mod: m })
  }

  const eliminar = (m: Modulo) => {
    setState((st) => conEvento({ ...st, modulos: st.modulos.filter((x) => x.id !== m.id) }, { accion: `Módulo eliminado: ${m.nombre}`, modulo: 'Catálogo de módulos' }))
    notify({ titulo: 'Módulo eliminado', texto: `${m.nombre} se quitó del catálogo.` })
  }

  return (
    <div className="adm-root">
      <PageHead
        title="Catálogo de módulos" subtitle="Administra las funcionalidades disponibles y la navegación del sistema."
        badge={<span className="flex items-center gap-3"><Badge tone="sky">{s.modulos.length} módulos registrados</Badge><Btn icon={Plus} onClick={() => setForm({ modo: 'nuevo' })}>Nuevo módulo</Btn></span>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={CheckCircle2} tone="green" label="Módulos activos" value={s.modulos.filter((m) => m.estado === 'activo').length} />
        <StatTile icon={Power} tone="gray" label="Módulos inactivos" value={s.modulos.filter((m) => m.estado === 'inactivo').length} />
        <StatTile icon={Wrench} tone="orange" label="En mantenimiento" value={s.modulos.filter((m) => m.estado === 'mantenimiento').length} />
        <StatTile icon={Clock} tone="blue" label="Última actualización" value={<span className="text-xl">{fmtFecha(ultima)}</span>} />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Buscar por nombre, descripción o código" />
          <Select aria-label="Categoría" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }}><option value="">Todas las categorías</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select aria-label="Estado" value={est} onChange={(e) => { setEst(e.target.value); setPage(1) }}><option value="">Todos los estados</option>{(Object.keys(ESTADO_LABEL) as EstadoModulo[]).map((k) => <option key={k} value={k}>{ESTADO_LABEL[k]}</option>)}</Select>
          <Select aria-label="Visibilidad" value={vis} onChange={(e) => { setVis(e.target.value); setPage(1) }}><option value="">Visible / Oculto</option><option value="visible">Visible</option><option value="oculto">Oculto</option></Select>
          <Btn variant="outline" onClick={limpiar} disabled={!hayFiltros}>Limpiar filtros</Btn>
        </div>
        <p className="mt-3 text-xs text-slate-500"><span className="font-bold text-[#0e1d4d]">{lista.length} resultado{lista.length === 1 ? '' : 's'}</span><span className="ml-3">Los resultados se actualizan automáticamente</span></p>
      </Card>

      <Card className="mt-5">
        <div className="px-6 pt-6"><h2 className="text-base font-bold text-[#0e1d4d]">Módulos registrados</h2><p className="text-xs text-slate-500">Gestiona estado, visibilidad, orden y navegación.</p></div>
        <div className="mt-4 overflow-x-auto px-3">
          <table className="w-full min-w-[960px] text-left">
            <thead className={THEAD}><tr>{['Módulo', 'Descripción', 'Categoría', 'Estado', 'Visibilidad', 'Orden', 'Actualización', 'Acciones'].map((h, i) => <th key={h} className={`${TH} ${i === 7 ? 'text-center' : ''} ${i === 0 ? 'rounded-l-lg' : ''} ${i === 7 ? 'rounded-r-lg' : ''}`}>{h}</th>)}</tr></thead>
            <tbody>
              {filas.map((m) => (
                <tr key={m.id} className="border-b border-[#e3e9f5] last:border-0 hover:bg-[#f5f7fc]/60">
                  <td className={TD}>
                    <div className="flex items-center gap-3">
                      <Avatar text={abrev(m, s.modulos)} tone="blue" />
                      <div><p className="font-bold text-[#0e1d4d]">{m.nombre}</p><p className="text-[11px] text-slate-400">{m.codigo}</p></div>
                    </div>
                  </td>
                  <td className={`${TD} max-w-[220px]`}>{m.descripcion}</td>
                  <td className={TD}><Badge tone="sky">{m.categoria}</Badge></td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <Badge tone={ESTADO_TONO[m.estado]}>{ESTADO_LABEL[m.estado]}</Badge>
                      <Toggle small checked={m.estado === 'activo'} onChange={() => alternarEstado(m)} label={`Estado de ${m.nombre}`} disabled={m.estado === 'mantenimiento'} />
                    </div>
                  </td>
                  <td className={TD}>
                    <button onClick={() => alternarVisible(m)} aria-label={`${m.visible ? 'Ocultar' : 'Mostrar'} ${m.nombre} en el menú`}>
                      <Badge tone={m.visible ? 'blue' : 'gray'} dot>{m.visible ? 'Visible' : 'Oculto'}</Badge>
                    </button>
                  </td>
                  <td className={`${TD} font-bold text-[#0e1d4d]`}>{m.orden}</td>
                  <td className={`${TD} whitespace-nowrap`}>{fmtFecha(m.actualizado)}</td>
                  <td className={`${TD} text-center`}>
                    <RowMenu label={`Acciones de ${m.nombre}`} items={[
                      { label: 'Ver detalles', icon: <ChevronRight size={14} />, onClick: () => setDetalle(m) },
                      { label: 'Editar módulo', icon: <Pencil size={14} />, onClick: () => setForm({ modo: 'editar', mod: m }) },
                      { label: m.visible ? 'Ocultar del menú' : 'Mostrar en el menú', icon: m.visible ? <EyeOff size={14} /> : <Eye size={14} />, onClick: () => alternarVisible(m) },
                      { label: m.estado === 'activo' ? 'Desactivar módulo' : 'Activar módulo', icon: <Power size={14} />, onClick: () => alternarEstado(m), separador: true },
                      { label: 'Eliminar módulo', icon: <Trash2 size={14} />, tone: 'danger', onClick: () => intentarEliminar(m) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 && (
          <EmptyState icon={Search} title="No se encontraron módulos con los filtros seleccionados" text="Prueba con otros términos o limpia los filtros aplicados."
            action={hayFiltros ? <Btn variant="outline" onClick={limpiar}>Limpiar filtros</Btn> : undefined} />
        )}
        <Pager page={page} total={lista.length} size={PAGE} onPage={setPage} />
        <div className="h-3" />
      </Card>

      {form && <FormModulo modo={form.modo} mod={form.mod} modulos={s.modulos} onClose={() => setForm(null)} onSave={(d) => {
        if (form.modo === 'nuevo') {
          setState((st) => conEvento({ ...st, modulos: [...st.modulos, { ...d, id: uid('mod'), actualizado: nowISO() }] }, { accion: `Nuevo módulo registrado: ${d.nombre}`, modulo: 'Catálogo de módulos' }))
          notify({ titulo: 'Módulo creado correctamente', texto: `${d.nombre} ya forma parte del catálogo.` })
        } else {
          parchear(form.mod!.id, d, `Módulo actualizado: ${d.nombre}`)
          notify({ titulo: 'Módulo actualizado correctamente' })
        }
        setForm(null)
      }} />}

      {detalle && (
        <Modal title="Detalle del módulo" subtitle={detalle.codigo} onClose={() => setDetalle(null)} accent="teal"
          footer={<><Btn variant="outline" onClick={() => { const m = detalle; setDetalle(null); setForm({ modo: 'editar', mod: m }) }}>Editar módulo</Btn><Btn onClick={() => setDetalle(null)}>Cerrar</Btn></>}>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {[
              ['Nombre', detalle.nombre], ['Código interno', detalle.codigo], ['Categoría', detalle.categoria], ['Ruta de navegación', detalle.ruta],
              ['Estado', ESTADO_LABEL[detalle.estado]], ['Visibilidad', detalle.visible ? 'Visible en el menú' : 'Oculto'], ['Orden', String(detalle.orden)], ['Última actualización', fmtFecha(detalle.actualizado)],
              ['Menús asociados', String(dependencias(detalle).menus)], ['Roles con acceso', String(dependencias(detalle).permisos)],
            ].map(([k, v]) => <div key={k}><dt className="text-[11px] text-slate-500">{k}</dt><dd className="font-semibold text-[#0e1d4d]">{v}</dd></div>)}
            <div className="sm:col-span-2"><dt className="text-[11px] text-slate-500">Descripción</dt><dd className="font-semibold text-[#0e1d4d]">{detalle.descripcion || '—'}</dd></div>
          </dl>
        </Modal>
      )}

      {conf?.tipo === 'desactivar' && (
        <ConfirmDialog title="¿Desactivar este módulo?" description="El módulo dejará de mostrarse para los usuarios autorizados, pero la información asociada no será eliminada."
          onCancel={() => setConf(null)}
          onConfirm={() => { parchear(conf.mod.id, { estado: 'inactivo' }, `Módulo desactivado: ${conf.mod.nombre}`); setConf(null); notify({ tipo: 'info', titulo: 'Módulo desactivado', texto: `${conf.mod.nombre} ya no se muestra a los usuarios.` }) }} />
      )}
      {conf?.tipo === 'eliminar' && (
        <ConfirmDialog title="¿Eliminar este módulo?" description="Esta acción puede afectar las rutas y permisos asociados. Verifica que el módulo no tenga información relacionada."
          onCancel={() => setConf(null)} onConfirm={() => { eliminar(conf.mod); setConf(null) }} />
      )}
      {conf?.tipo === 'bloqueo' && (
        <ConfirmDialog tone="warning" icon={AlertTriangle} title="No se puede eliminar este módulo"
          description={<>El módulo tiene información asociada a rutas y permisos ({dependencias(conf.mod).menus} menú(s), {dependencias(conf.mod).permisos} rol(es)). Puedes <b>desactivarlo en su lugar</b>.</>}
          confirmLabel="Desactivar módulo" cancelLabel="Cerrar" hideConfirm={conf.mod.estado !== 'activo'}
          onCancel={() => setConf(null)}
          onConfirm={() => { parchear(conf.mod.id, { estado: 'inactivo' }, `Módulo desactivado: ${conf.mod.nombre}`); setConf(null); notify({ tipo: 'info', titulo: 'Módulo desactivado' }) }} />
      )}
    </div>
  )
}

/** Inicial del módulo; usa dos letras cuando otro módulo anterior comparte la misma inicial (ej. A / As). */
const abrev = (m: Modulo, todos: Modulo[]) => {
  const choca = todos.some((x) => x.id !== m.id && x.orden < m.orden && x.nombre[0]?.toUpperCase() === m.nombre[0]?.toUpperCase())
  return choca ? m.nombre[0].toUpperCase() + m.nombre[1]?.toLowerCase() : (m.nombre[0] ?? '?').toUpperCase()
}

type Datos = Omit<Modulo, 'id' | 'actualizado'>

function FormModulo({ modo, mod, modulos, onClose, onSave }: { modo: 'nuevo' | 'editar'; mod?: Modulo; modulos: Modulo[]; onClose: () => void; onSave: (d: Datos) => void }) {
  const inicial: Datos = mod
    ? { nombre: mod.nombre, codigo: mod.codigo, descripcion: mod.descripcion, categoria: mod.categoria, icono: mod.icono, ruta: mod.ruta, orden: mod.orden, estado: mod.estado, visible: mod.visible }
    : { nombre: '', codigo: '', descripcion: '', categoria: '' as Categoria, icono: '', ruta: '/', orden: Math.max(0, ...modulos.map((m) => m.orden)) + 1, estado: 'activo', visible: true }
  const [d, setD] = useState<Datos>(inicial)
  const [tocado, setTocado] = useState(false)
  const dirty = JSON.stringify(d) !== JSON.stringify(inicial)

  const e = {
    nombre: d.nombre.trim().length < 3 ? 'El nombre es obligatorio (mín. 3 caracteres).' : '',
    codigo: !/^[A-Z0-9][A-Z0-9_-]{2,}$/.test(d.codigo) ? 'Usa mayúsculas, números o guiones (ej. MOD-NOTAS).'
      : modulos.some((m) => m.codigo === d.codigo && m.id !== mod?.id) ? 'Este código ya existe.' : '',
    categoria: !d.categoria ? 'Selecciona una categoría.' : '',
    ruta: !/^\/[a-z0-9\-/_]*$/i.test(d.ruta) || d.ruta.length < 2 ? 'La ruta debe iniciar con "/" (ej. /notas).' : '',
    orden: !Number.isInteger(d.orden) || d.orden < 1 ? 'Ingresa un número de orden válido.' : '',
  }
  const ok = !Object.values(e).some(Boolean)
  const v = (k: keyof typeof e) => (tocado ? e[k] : '')
  const Ico = d.icono ? iconoDe(d.icono) : ListFilter

  return (
    <Modal title={modo === 'nuevo' ? 'Nuevo módulo' : 'Editar módulo'} subtitle={modo === 'nuevo' ? 'Registra una nueva funcionalidad para la plataforma.' : 'Actualiza los datos del módulo.'} onClose={onClose} size="lg" dirty={dirty}
      footer={(cerrar) => <><Btn variant="outline" onClick={cerrar}>Cancelar</Btn><Btn onClick={() => { setTocado(true); if (ok) onSave({ ...d, nombre: d.nombre.trim(), descripcion: d.descripcion.trim() }) }}>Guardar módulo</Btn></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del módulo" required error={v('nombre')}><Input value={d.nombre} error={!!v('nombre')} maxLength={50} onChange={(x) => setD({ ...d, nombre: x.target.value })} /></Field>
        <Field label="Código interno" required error={v('codigo')}><Input value={d.codigo} error={!!v('codigo')} maxLength={20} onChange={(x) => setD({ ...d, codigo: x.target.value.toUpperCase().replace(/\s+/g, '-') })} /></Field>
        <Field label="Descripción" className="sm:col-span-2"><Textarea value={d.descripcion} placeholder="Describe brevemente la función del módulo" maxLength={120} onChange={(x) => setD({ ...d, descripcion: x.target.value })} /></Field>
        <Field label="Categoría" required error={v('categoria')}><Select value={d.categoria} error={!!v('categoria')} onChange={(x) => setD({ ...d, categoria: x.target.value as Categoria })}><option value="">Selecciona una categoría</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Icono"><Select value={d.icono} onChange={(x) => setD({ ...d, icono: x.target.value })}><option value="">Selecciona un icono</option>{Object.entries(ICONOS).map(([k, i]) => <option key={k} value={k}>{i.label}</option>)}</Select></Field>
        <Field label="Ruta de navegación" required error={v('ruta')}><Input value={d.ruta} error={!!v('ruta')} onChange={(x) => setD({ ...d, ruta: x.target.value })} /></Field>
        <Field label="Número de orden" required error={v('orden')}><Input type="number" min={1} value={Number.isNaN(d.orden) ? '' : d.orden} error={!!v('orden')} onChange={(x) => setD({ ...d, orden: x.target.value === '' ? NaN : Number(x.target.value) })} /></Field>
        <Field label="Estado inicial"><Select value={d.estado} onChange={(x) => setD({ ...d, estado: x.target.value as EstadoModulo })}>{(Object.keys(ESTADO_LABEL) as EstadoModulo[]).map((k) => <option key={k} value={k}>{ESTADO_LABEL[k]}</option>)}</Select></Field>
        <Field label="Visibilidad en el menú"><Select value={d.visible ? 'v' : 'o'} onChange={(x) => setD({ ...d, visible: x.target.value === 'v' })}><option value="v">Visible</option><option value="o">Oculto</option></Select></Field>
      </div>

      <div className="mt-5 rounded-xl border border-[#e3e9f5] bg-[#f5f7fc] p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#0e1d4d]">Vista previa en el menú</p><Badge tone="green" dot>Vista previa en tiempo real</Badge></div>
        <div className="flex items-center gap-4 rounded-xl bg-[#12307f] p-3 text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0fa3a3]"><Ico size={20} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{d.nombre || 'Nombre del módulo'}</p><p className="truncate text-[11px] text-white/70">{d.descripcion || 'Descripción y acceso principal'}</p></div>
          <span className="hidden rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold sm:block">{String(Number.isFinite(d.orden) ? d.orden : 0).padStart(2, '0')}</span>
          <span className={`hidden rounded-full px-3 py-1 text-[10px] font-bold sm:block ${d.estado === 'activo' ? 'bg-[#0fa3a3]' : 'bg-white/20'}`}>{ESTADO_LABEL[d.estado]}</span>
          <GripVertical size={14} className="hidden text-white/50 sm:block" /><MoreHorizontal size={16} className="text-white/70" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">* Nombre obligatorio · Código único · Ruta válida · Orden numérico · Categoría requerida</p>
    </Modal>
  )
}
