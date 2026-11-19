import { useState } from 'react'
import { BookOpen, Check, CheckCircle2, Lock, Mail, Pencil, ShieldCheck, User, X } from './interno/iconos'
import { Btn, Card, Field, Input, PasswordInput } from './interno/ui/kit'
import { Modal } from './interno/ui/modal'
import { useToast } from './interno/ui/toast'
import { irA } from './interno/nav'
import { conEvento, setState, useAdmin } from './interno/datos/store'
import { emailOk, iniciales } from './interno/datos/lib'
import { DEMO_USERS } from './config'
import { cerrarSesion, sesionActual } from './sesion'

/**
 * Mi perfil (#perfil). Las rutas #perfil/editar y #perfil/contrasena abren este mismo
 * perfil con su ventana ya desplegada (parámetro `abrir`).
 */
export default function Perfil({ abrir }: { abrir?: 'editar' | 'clave' }) {
  const s = useAdmin()
  const { notify } = useToast()
  const [editar, setEditar] = useState(abrir === 'editar')
  const [clave, setClave] = useState(abrir === 'clave')
  const cerrar = (cambiar: (v: boolean) => void) => () => { cambiar(false); if (abrir) irA('perfil') }
  const p = s.perfil
  const inic = iniciales(p.nombre) || 'AD'

  return (
    <div className="adm-root">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-[1.7rem] font-bold leading-tight text-[#0e1d4d]">Mi perfil</h1><p className="mt-1 text-sm text-slate-500">Tu información institucional y la seguridad de tu cuenta, en un solo lugar.</p></div>
        <Btn variant="blue" icon={Pencil} onClick={() => setEditar(true)}>Editar perfil</Btn>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-[#12307f] p-7 text-white shadow-xs sm:p-8">
        <div className="flex min-w-0 flex-wrap items-center gap-6">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-blue-50 text-3xl font-bold text-[#12307f]">{inic}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-blue-200">CUENTA INSTITUCIONAL</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{p.nombre}</h2>
            <p className="mt-1.5 text-sm text-blue-100">{p.correo}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Cuenta activa</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{p.rol}</span>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <BookOpen className="text-amber-400 sm:ml-auto" size={24} />
          <p className="mt-2 text-base font-bold">{p.institucion}</p>
          <p className="text-xs text-blue-100">{p.area}</p>
          <span className="mt-2 block h-0.5 w-8 rounded-sm bg-amber-400 sm:ml-auto" />
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <h2 className="flex items-center gap-3 text-lg font-bold text-[#0e1d4d]"><User size={18} className="text-[#12307f]" />Información de la cuenta</h2>
          <p className="ml-[30px] text-sm text-slate-500">Datos que identifican tu acceso a la plataforma.</p>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[['Nombre para mostrar', p.nombre], ['Correo institucional', p.correo], ['Rol de acceso', p.rol], ['Institución', p.institucion]].map(([k, v]) => (
              <div key={k}><dt className="text-[11px] text-slate-500">{k}</dt><dd className="mt-0.5 text-sm font-bold text-[#0e1d4d]">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-6 rounded-lg bg-[#f5f7fc] px-4 py-3 text-xs text-slate-500">El rol y la institución dependen de los permisos asignados.</p>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-3 text-lg font-bold text-[#0e1d4d]"><ShieldCheck size={18} className="text-teal-600" />Acceso y seguridad</h2>
          <p className="mt-1 text-sm text-slate-500">Cuida tus credenciales y mantén el control de tu acceso institucional.</p>
          <div className="mt-5 rounded-xl bg-[#f5f7fc] p-4"><p className="text-[11px] text-slate-500">Contraseña de acceso</p><p className="mt-1 flex items-center gap-2 text-lg tracking-[0.25em] text-[#0e1d4d]"><Lock size={14} className="text-slate-500" />••••••••••••</p></div>
          <Btn variant="outline" icon={Lock} className="mt-4 w-full" onClick={() => setClave(true)}>Cambiar contraseña</Btn>
          <p className="mt-3 text-xs text-slate-500">Usa una contraseña única y evita compartirla.</p>
        </Card>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-teal-50 px-6 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-xs"><Mail size={18} /></span>
        <div><p className="text-sm font-bold text-[#0e1d4d]">Un perfil actualizado, una mejor comunicación</p><p className="text-xs text-slate-600">Revisa tu correo institucional para recibir avisos y recuperar el acceso a tu cuenta cuando lo necesites.</p></div>
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500"><span>Información de uso institucional</span><span>Vista de ejemplo · Los datos corresponden a la cuenta activa al iniciar sesión.</span></div>

      {editar && <EditarPerfil onClose={cerrar(setEditar)} onSaved={() => notify({ titulo: 'Perfil actualizado correctamente', texto: 'Tus datos ya se muestran en el panel.' })} />}
      {clave && <CambiarClave onClose={cerrar(setClave)} />}
    </div>
  )
}

function EditarPerfil({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { perfil } = useAdmin()
  const inicial = { nombre: perfil.nombre, correo: perfil.correo }
  const [d, setD] = useState(inicial)
  const [tocado, setTocado] = useState(false)
  const dirty = JSON.stringify(d) !== JSON.stringify(inicial)
  const e = { nombre: d.nombre.trim().length < 3 ? 'Ingresa un nombre para mostrar (mín. 3 caracteres).' : '', correo: !emailOk(d.correo) ? 'Ingresa un correo institucional válido.' : '' }
  return (
    <Modal title="Editar perfil" subtitle="Actualiza los datos que se muestran en tu cuenta." onClose={onClose} dirty={dirty}
      footer={(cerrar) => <><Btn variant="outline" onClick={cerrar}>Cancelar</Btn><Btn disabled={!dirty} onClick={() => {
        setTocado(true); if (e.nombre || e.correo) return
        setState((st) => conEvento({ ...st, perfil: { ...st.perfil, nombre: d.nombre.trim(), correo: d.correo.trim() } }, { accion: 'Perfil actualizado', modulo: 'Mi perfil' }))
        onSaved(); onClose()
      }}>Guardar cambios</Btn></>}>
      <div className="grid gap-4">
        <Field label="Nombre para mostrar" required error={tocado ? e.nombre : ''}><Input value={d.nombre} maxLength={60} error={!!(tocado && e.nombre)} onChange={(x) => setD({ ...d, nombre: x.target.value })} /></Field>
        <Field label="Correo institucional" required error={tocado ? e.correo : ''}><Input type="email" value={d.correo} error={!!(tocado && e.correo)} onChange={(x) => setD({ ...d, correo: x.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rol de acceso"><Input value={perfil.rol} disabled readOnly /></Field>
          <Field label="Institución"><Input value={perfil.institucion} disabled readOnly /></Field>
        </div>
        <p className="rounded-lg bg-[#f5f7fc] px-4 py-3 text-xs text-slate-500">El rol y la institución no se modifican aquí: dependen de los permisos asignados y de la identidad del sistema.</p>
      </div>
    </Modal>
  )
}

function CambiarClave({ onClose }: { onClose: () => void }) {
  const session = sesionActual()
  const { perfil } = useAdmin()
  const [f, setF] = useState({ actual: '', nueva: '', repite: '' })
  const [tocado, setTocado] = useState(false)
  const [listo, setListo] = useState(false)
  // Si se abre el perfil sin haber iniciado sesión (demostración), se toma la cuenta del administrador.
  const claveReal = DEMO_USERS.find((u) => u.user === (session?.user ?? 'admin'))?.password ?? ''
  const dirty = !!(f.actual || f.nueva || f.repite)

  const base = (perfil.correo.split('@')[0] ?? '').toLowerCase()
  const req = [
    { ok: f.nueva.length >= 12, t: 'Al menos 12 caracteres' },
    { ok: /[A-Za-z]/.test(f.nueva) && /\d/.test(f.nueva) && /[^A-Za-z0-9]/.test(f.nueva), t: 'Combina letras, números y símbolos' },
    { ok: !!f.nueva && f.nueva !== f.actual, t: 'No reutilices contraseñas anteriores' },
    { ok: !!f.nueva && !f.nueva.toLowerCase().includes(base) && !/(password|contraseña|123456|qwerty|admin)/i.test(f.nueva), t: 'Evita datos personales o claves comunes' },
  ]
  const e = {
    actual: !f.actual ? 'Ingresa tu contraseña actual.' : f.actual !== claveReal ? 'La contraseña actual no es correcta.' : '',
    nueva: req.some((r) => !r.ok) ? 'La nueva contraseña no cumple los requisitos.' : '',
    repite: f.repite !== f.nueva || !f.repite ? 'Las contraseñas no coinciden.' : '',
  }
  const v = (k: keyof typeof e) => (tocado ? e[k] : '')

  if (listo) {
    return (
      <Modal title="Contraseña actualizada" subtitle="Protege el acceso a tu cuenta institucional." onClose={onClose} accent="teal" size="sm"
        footer={<><Btn onClick={() => { cerrarSesion(); irA('acceso') }}>Ir al inicio de sesión</Btn><Btn variant="outline" onClick={onClose}>Cerrar</Btn></>}>
        <div className="flex flex-col items-center py-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={26} /></span>
          <p className="mt-3 text-sm font-bold text-[#0e1d4d]">Cambio registrado correctamente</p>
          <p className="mt-1 text-xs text-slate-500">Por seguridad, vuelve a iniciar sesión con tu nueva contraseña.</p>
        </div>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">Prototipo: se validan las reglas y se registra el evento, pero la contraseña de demostración no se modifica (sigue siendo la original).</p>
      </Modal>
    )
  }

  return (
    <Modal title="Cambiar contraseña" subtitle="Protege el acceso a tu cuenta institucional." onClose={onClose} dirty={dirty} size="sm"
      footer={(cerrar) => <><Btn variant="outline" onClick={cerrar}>Cancelar</Btn><Btn onClick={() => {
        setTocado(true); if (Object.values(e).some(Boolean)) return
        setState((st) => conEvento({ ...st, eventos: st.eventos }, { accion: 'Contraseña renovada', modulo: 'Mi perfil' })); setListo(true)
      }}>Validar cambio</Btn></>}>
      <div className="grid gap-4">
        <Field label="Contraseña actual" error={v('actual')}><PasswordInput autoComplete="current-password" value={f.actual} error={!!v('actual')} onChange={(x) => setF({ ...f, actual: x.target.value })} /></Field>
        <Field label="Nueva contraseña" error={v('nueva')}><PasswordInput placeholder="Mínimo 12 caracteres" value={f.nueva} error={!!v('nueva')} onChange={(x) => setF({ ...f, nueva: x.target.value })} /></Field>
        <Field label="Confirmar nueva contraseña" error={v('repite')}><PasswordInput placeholder="Repite la nueva contraseña" value={f.repite} error={!!v('repite')} onChange={(x) => setF({ ...f, repite: x.target.value })} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-[#f5f7fc] p-4">
        <p className="text-xs font-bold text-[#0e1d4d]">Requisitos de seguridad</p>
        <ul className="mt-2 space-y-1.5 text-xs">
          {req.map((r) => <li key={r.t} className={`flex items-center gap-2 ${r.ok ? 'text-emerald-700' : 'text-slate-500'}`}>{r.ok ? <Check size={13} /> : <X size={13} className="text-slate-300" />}{r.t}</li>)}
        </ul>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Nunca compartas tu contraseña. El rol y los permisos no se modifican aquí.</p>
    </Modal>
  )
}
