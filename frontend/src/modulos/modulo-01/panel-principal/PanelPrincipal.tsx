import type { ReactNode } from 'react'
import './panel.css'

type NombreIcono = 'graduacion' | 'maletin' | 'usuarios' | 'escudo' | 'actividad' | 'reloj' | 'calendario' | 'info' | 'alerta'

const TRAZOS: Record<NombreIcono, ReactNode> = {
  graduacion: <><path d="M3 9l9-4 9 4-9 4z" /><path d="M7 11.2V15c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-3.8" /><path d="M21 9v5" /></>,
  maletin: <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12h16" /></>,
  usuarios: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17 14.3c2 .6 3.5 2.3 3.5 4.7" /></>,
  escudo: <><path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  actividad: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendario: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alerta: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
}

function Icono({ nombre, tamano = 20 }: { nombre: NombreIcono; tamano?: number }) {
  return <svg className="pp-icono" width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TRAZOS[nombre]}</svg>
}

const INDICADORES: { id: string; etiqueta: string; icono: NombreIcono; tono: string }[] = [
  { id: 'docentes', etiqueta: 'Docentes registrados', icono: 'graduacion', tono: 'azul' },
  { id: 'administrativo', etiqueta: 'Personal administrativo registrado', icono: 'maletin', tono: 'verde' },
  { id: 'auxiliares', etiqueta: 'Auxiliares registrados', icono: 'usuarios', tono: 'amarillo' },
  { id: 'administradores', etiqueta: 'Administradores registrados', icono: 'escudo', tono: 'gris' },
]

const ROLES = [
  { id: 'docentes', etiqueta: 'Docentes', color: '#102d8a' },
  { id: 'administrativo', etiqueta: 'Personal administrativo', color: '#0ea5a8' },
  { id: 'auxiliares', etiqueta: 'Auxiliares', color: '#d4ab2d' },
  { id: 'administradores', etiqueta: 'Administradores', color: '#8a9bb5' },
]

const DIAS = ['15 oct', '16 oct', '17 oct', '18 oct', '19 oct', '20 oct', '21 oct']
const COLUMNAS = ['Usuario', 'Rol', 'Acción realizada', 'Módulo', 'Fecha y hora', 'Resultado']

const AVISOS: { id: string; etiqueta: string; icono: NombreIcono; tono: string }[] = [
  { id: 'modulos', etiqueta: 'Módulos por configurar', icono: 'reloj', tono: 'naranja' },
  { id: 'periodos', etiqueta: 'Periodos próximos a vencer', icono: 'calendario', tono: 'naranja' },
  { id: 'cuentas', etiqueta: 'Cuentas nuevas y cambios de rol', icono: 'info', tono: 'azul' },
  { id: 'accesos', etiqueta: 'Intentos de acceso sospechosos', icono: 'escudo', tono: 'rojo' },
  { id: 'mantenimiento', etiqueta: 'Mantenimiento e interrupciones', icono: 'alerta', tono: 'rojo' },
]

// El Figma muestra el panel en espera de sincronización: sin datos reales, con "—" en lugar de cifras.
export function PanelPrincipal() {
  return <div className="pp-pantalla">
    <header className="pp-encabezado">
      <div>
        <h1>Administrar sistema</h1>
        <p>Resumen general y monitoreo de la plataforma</p>
      </div>
      <span className="pp-estado" role="status"><i aria-hidden="true" />En espera de sincronización</span>
    </header>

    <section className="pp-indicadores" aria-label="Usuarios registrados por rol">
      {INDICADORES.map(item => <article className="pp-indicador" key={item.id}>
        <span className={'pp-icono-circulo pp-tono-' + item.tono}><Icono nombre={item.icono} /></span>
        <p className="pp-indicador-titulo"><span className="pp-guion" aria-label="Sin datos" />{item.etiqueta}</p>
        <p className="pp-indicador-variacion">— % · Variación reciente</p>
        <small>Actualizado: sin sincronizar</small>
      </article>)}
    </section>

    <section className="pp-resumen" aria-label="Resumen de actividad">
      <article className="pp-resumen-item">
        <span className="pp-tono-verde-texto"><Icono nombre="usuarios" /></span>
        <p>Usuarios conectados ahora</p>
        <span className="pp-guion" aria-label="Sin datos" />
      </article>
      <article className="pp-resumen-item">
        <span className="pp-tono-verde-texto"><Icono nombre="actividad" /></span>
        <p>Actividad registrada durante el día</p>
        <span className="pp-guion" aria-label="Sin datos" />
      </article>
    </section>

    <div className="pp-graficos">
      <section className="pp-tarjeta" aria-labelledby="pp-roles">
        <h2 id="pp-roles">Usuarios por rol</h2>
        <p className="pp-subtitulo">Distribución de cuentas registradas</p>
        <div className="pp-roles">
          <div className="pp-dona" role="img" aria-label="Sin datos para mostrar la distribución">
            <span className="pp-guion" /><small>Sin datos</small>
          </div>
          <ul className="pp-leyenda">
            {ROLES.map(rol => <li key={rol.id}>
              <i style={{ background: rol.color }} aria-hidden="true" /><span>{rol.etiqueta}</span><b>—</b>
            </li>)}
          </ul>
        </div>
        <p className="pp-nota">Los totales se mostrarán al sincronizar los datos</p>
      </section>

      <section className="pp-tarjeta" aria-labelledby="pp-actividad">
        <div className="pp-titulo-con-leyenda">
          <div>
            <h2 id="pp-actividad">Actividad del sistema</h2>
            <p className="pp-subtitulo">Últimos siete días · 15–21 oct 2026</p>
          </div>
          <span className="pp-leyenda-eventos"><i aria-hidden="true" />Eventos</span>
        </div>
        <div className="pp-lineas" role="img" aria-label="Sin actividad sincronizada para este periodo">
          <span>Sin actividad sincronizada para este periodo</span>
        </div>
        <ol className="pp-dias">{DIAS.map(dia => <li key={dia}>{dia}</li>)}</ol>
      </section>
    </div>

    <div className="pp-inferior">
      <section className="pp-tarjeta" aria-labelledby="pp-reciente">
        <h2 id="pp-reciente">Actividad reciente del sistema</h2>
        <p className="pp-subtitulo">Trazabilidad de cambios y accesos a la plataforma</p>
        <div className="pp-tabla-contenedor">
          <table className="pp-tabla">
            <thead><tr>{COLUMNAS.map(columna => <th key={columna} scope="col">{columna}</th>)}</tr></thead>
          </table>
        </div>
        <div className="pp-vacio">
          <Icono nombre="actividad" tamano={26} />
          <strong>Aún no hay actividad sincronizada</strong>
          <small>Los eventos reales aparecerán aquí al conectar el sistema</small>
        </div>
      </section>

      <section className="pp-tarjeta" aria-labelledby="pp-avisos">
        <h2 id="pp-avisos">Avisos del sistema</h2>
        <p className="pp-subtitulo">Pendientes de sincronización</p>
        <ul className="pp-avisos">
          {AVISOS.map(aviso => <li key={aviso.id}>
            <span className={'pp-icono-circulo pp-icono-pequeno pp-tono-' + aviso.tono}><Icono nombre={aviso.icono} tamano={16} /></span>
            <span>{aviso.etiqueta}</span><b>—</b>
          </li>)}
        </ul>
      </section>
    </div>

    <footer className="pp-pie">
      <span>I.E. Mariscal Castilla · Sistema de Gestión de Matrículas y Asistencias<br />Versión 1.0.0 · 2026</span>
      <span>Última actualización: pendiente de sincronización</span>
    </footer>
  </div>
}
