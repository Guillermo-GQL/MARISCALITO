import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeftRight, Eye, EyeOff, Lock, LogIn, User } from './interno/iconos'
import { irA } from './interno/nav'
import { ACCESS, CARGO_ACCESS, CARGO_LABEL, DEMO_USERS, MODULO_LABEL } from './config'
import { FachadaPanel, FachadaTitulo, Logo } from './Marca'
import { accesoElegido, cerrarSesion, iniciarSesion } from './sesion'
import './interno/admin.css'

const CAMPO = 'w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-[#14305e] placeholder:text-slate-400 focus:border-[#2447b3] focus:outline-none focus:ring-2 focus:ring-[#2447b3]/20'

/** Ingresar al sistema (#acceso). Entrar a esta pantalla equivale a cerrar la sesión. */
export default function Login() {
  const [access] = useState(accesoElegido)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  useEffect(() => { cerrarSesion() }, [])

  const cfg = ACCESS[access]
  const demo = DEMO_USERS.filter((u) => CARGO_ACCESS[u.cargo] === access)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!user.trim() || !pass) return setError('Completa tu usuario y contraseña.')
    const r = iniciarSesion(access, user, pass)
    if (!r.ok) {
      return setError(r.motivo === 'access'
        ? 'Este usuario no pertenece a este acceso. Usa «Cambiar rol» para ingresar por el correcto.'
        : 'Usuario o contraseña incorrectos.')
    }
    if (r.sesion.module !== 'admin') {
      cerrarSesion()
      return setError(`Tus credenciales son correctas, pero el módulo «${MODULO_LABEL[r.sesion.module]}» aún no está disponible en esta versión. Por ahora solo ingresa el Administrador.`)
    }
    irA('panel')
  }

  return (
    <div className="adm-root flex min-h-screen bg-slate-50 text-slate-600">
      <FachadaPanel footer>
        <Logo className="h-20 self-start" />
        <div className="mt-6"><FachadaTitulo size="md" /></div>
      </FachadaPanel>

      <main id="contenido" tabIndex={-1} className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
        <a
          href="#acceso/cambiar-rol"
          className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#e0b53d] bg-white px-4 py-2 text-xs font-bold text-[#0b1a52] transition hover:bg-amber-50"
        >
          <ArrowLeftRight size={15} className="text-[#1d3a9e]" /> Cambiar rol
        </a>

        <div className="mb-8 lg:hidden"><Logo className="h-20" /></div>

        <form onSubmit={onSubmit} noValidate className="w-full max-w-[420px] rounded-3xl border border-slate-200/70 bg-white p-8 shadow-lg">
          <span className="inline-block w-full rounded-md bg-[#eaf0fe] px-6 py-1.5 text-xs font-semibold text-[#2447b3]">{cfg.badge}</span>
          <h1 className="mt-4 text-2xl font-bold text-[#0f2447]">Iniciar sesión</h1>

          <label htmlFor="user" className="mt-8 block text-xs font-bold text-[#0f2447]">{cfg.userLabel}</label>
          <div className="relative mt-2">
            <User size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="user" className={CAMPO} placeholder={cfg.userPlaceholder} autoComplete="username" value={user}
              onChange={(e) => { setUser(e.target.value); setError('') }} />
          </div>

          <label htmlFor="pass" className="mt-5 block text-xs font-bold text-[#0f2447]">Contraseña</label>
          <div className="relative mt-2">
            <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="pass" type={show ? 'text' : 'password'} className={CAMPO + ' pr-12'} placeholder="Ingresa tu contraseña" autoComplete="current-password"
              value={pass} onChange={(e) => { setPass(e.target.value); setError('') }} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0f2447]">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="mt-3 text-right">
            <button type="button" onClick={() => setForgot((f) => !f)} className="text-xs font-medium text-[#2447b3] hover:underline">¿Olvidaste tu contraseña?</button>
            {forgot && <p className="mt-1 text-xs text-slate-500">Comunícate con secretaría o con el administrador para restablecerla.</p>}
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">{error}</p>}

          <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#162f86] py-3 text-sm font-bold text-white transition hover:bg-[#10236b]">
            <LogIn size={17} /> Ingresar al sistema
          </button>

          <div className="mt-6 rounded-xl border border-dashed border-[#2447b3]/40 bg-[#eaf0fe]/60 p-4">
            <p className="text-xs font-semibold text-[#1d3a9e]">Cuentas de demostración (clic para rellenar)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demo.map((d) => (
                <button key={d.user} type="button" title={`${d.user} / ${d.password}`}
                  onClick={() => { setUser(d.user); setPass(d.password); setError('') }}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0f2447] shadow-xs ring-1 ring-slate-200 transition hover:ring-[#2447b3]">
                  {CARGO_LABEL[d.cargo]}
                </button>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
