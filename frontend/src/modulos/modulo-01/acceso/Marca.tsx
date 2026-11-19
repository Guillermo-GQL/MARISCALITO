import type { ReactNode } from 'react'

export function Logo({ className = 'h-20' }: { className?: string }) {
  return <img src={new URL('./imagenes/logo.png', import.meta.url).href} alt="Escudo I.E. Mariscal Castilla" className={`${className} w-auto object-contain`} />
}

/** Panel izquierdo con la fachada del colegio teñida de azul (bienvenida y login). */
export function FachadaPanel({ children, footer = false }: { children: ReactNode; footer?: boolean }) {
  return (
    <aside
      className="relative hidden min-h-screen bg-[#162f86] bg-cover bg-center lg:block lg:w-[55%]"
      style={{ backgroundImage: `url('${new URL('./imagenes/fachada.jpg', import.meta.url).href}')` }}
    >
      <div className="absolute inset-0 bg-[#1d3a9e]/75" />
      <div className="relative flex h-full flex-col p-12 text-white xl:p-16">
        {children}
        {footer && (
          <div className="mt-auto" aria-hidden>
            <div className="flex items-center gap-2">
              <span className="h-px w-14 bg-white/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#e0b53d]" />
            </div>
            <span className="mt-3 block h-px w-36 bg-white/40" />
          </div>
        )}
      </div>
    </aside>
  )
}

/** Título + línea dorada + datos del colegio que se repiten en el panel izquierdo. */
export function FachadaTitulo({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  return (
    <>
      <h1 className={`${size === 'lg' ? 'text-4xl' : 'text-[2.1rem]'} font-bold leading-tight`}>
        Sistema de Matrícula<br />y Asistencia
      </h1>
      <span className={`block h-[3px] rounded-full bg-[#d4a72c] ${size === 'lg' ? 'mb-7 mt-3 w-14' : 'mb-4 mt-2.5 w-9'}`} />
      <p className="text-xl font-semibold">I.E. Mariscal Castilla</p>
      <p className="mt-1 text-sm text-white/85">Secundaria · Daniel Hernández,<br />Tayacaja – Huancavelica</p>
    </>
  )
}
