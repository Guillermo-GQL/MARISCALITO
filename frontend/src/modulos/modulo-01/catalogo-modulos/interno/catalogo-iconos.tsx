import { BarChart3, BookOpen, CalendarDays, ClipboardList, GraduationCap, LayoutGrid, ListTree, Settings, ShieldCheck, Users, type Icono } from './iconos'

export const ICONOS: Record<string, { label: string; Icon: Icono }> = {
  layout: { label: 'Panel', Icon: LayoutGrid },
  list: { label: 'Lista', Icon: ListTree },
  users: { label: 'Usuarios', Icon: Users },
  shield: { label: 'Seguridad', Icon: ShieldCheck },
  book: { label: 'Libro', Icon: BookOpen },
  calendar: { label: 'Calendario', Icon: CalendarDays },
  clipboard: { label: 'Registro', Icon: ClipboardList },
  school: { label: 'Académico', Icon: GraduationCap },
  chart: { label: 'Reportes', Icon: BarChart3 },
  settings: { label: 'Configuración', Icon: Settings },
}
export const iconoDe = (k: string): Icono => (ICONOS[k] ?? ICONOS.layout).Icon
