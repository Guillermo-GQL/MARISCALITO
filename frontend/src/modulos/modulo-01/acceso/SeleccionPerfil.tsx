import { irA } from './interno/nav'
import { ACCESS, ACCESS_ORDER, type AccessId } from './config'
import { FachadaPanel, FachadaTitulo, Logo } from './Marca'
import { elegirAcceso, useSesion } from './sesion'
import './interno/admin.css'

const tono = { estudiante: 'bg-emerald-50 text-[#162f86]', personal: 'bg-[#eaf0fe] text-[#162f86]' } as const

/** Elegir perfil / Cambiar rol (#acceso/perfiles y #acceso/cambiar-rol). */
export default function SeleccionPerfil() {
  const sesion = useSesion()
  const ingresar = (id: AccessId) => {
    if (sesion?.access === id) return irA('panel')
    elegirAcceso(id)
    irA('acceso')
  }
  return (
    <div className="adm-root flex min-h-screen bg-slate-50 text-slate-600">
      <FachadaPanel>
        <div className="pt-12"><FachadaTitulo /></div>
      </FachadaPanel>

      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="flex w-full max-w-[460px] flex-1 flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-24" />
            <h1 className="mt-5 text-3xl font-extrabold tracking-wide text-[#0f2447]">BIENVENIDO</h1>
            <p className="mt-6 text-sm text-slate-500">Elige el perfil con el que deseas ingresar al sistema</p>
          </div>

          <div className="mt-8 space-y-5">
            {ACCESS_ORDER.map((id) => {
              const a = ACCESS[id]
              const Icon = a.icon
              const activo = sesion?.access === id
              return (
                <div key={id} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-xs ${tono[id]}`}>
                      <Icon size={28} strokeWidth={1.6} />
                    </span>
                    <h2 className="text-xl font-semibold text-[#0f2447]">{a.label}</h2>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{a.description}</p>
                  <button
                    type="button" onClick={() => ingresar(id)}
                    className="mt-5 inline-flex items-center rounded-full bg-[#162f86] px-6 py-2 text-xs font-bold text-white transition hover:bg-[#10236b]"
                  >
                    {activo ? 'Continuar' : 'Ingresar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500">¿Problemas para ingresar? Contacta al administrador del sistema</p>
      </main>
    </div>
  )
}
