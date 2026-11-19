/** Navega a otra pantalla del sistema. La base usa rutas con # (ej. 'perfil' o 'acceso/perfiles'). */
export const irA = (ruta: string) => { location.hash = ruta.replace(/^#/, '') }
