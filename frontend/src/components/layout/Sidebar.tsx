// src/components/layout/Sidebar.tsx
'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, BarChart3, GitBranch, Target, ClipboardList, Users, HelpCircle, Shield, Home, FileCheck, ChevronDown, ChevronLeft, ChevronRight, Menu, X, Bell, Inbox, BarChart2, Layers, ClipboardCheck, AlertTriangle, Award, Building2, Smile
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  section: 'principal' | 'gestion' | 'administracion';
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    section: 'principal',
  },
  {
    href: '/notificaciones',
    label: 'Notificaciones',
    icon: <Inbox className="h-4 w-4" />,
    section: 'principal',
  },
  {
    href: '/documentos',
    label: 'Gestión Documental',
    icon: <FileText className="h-4 w-4" />,
    section: 'gestion',
    roles: ['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA', 'RESPONSABLE_PROCESO', 'DIGITADOR', 'CONSULTA'],
  },
  {
    href: '/procesos',
    label: 'Mapa de Procesos',
    icon: <GitBranch className="h-4 w-4" />,
    section: 'gestion',
  },
  {
    href: '/indicadores',
    label: 'Indicadores',
    icon: <BarChart2 className="h-4 w-4" />,
    section: 'gestion',
  },
  {
    href: '/bsc',
    label: 'BSC (Estratégicos)',
    icon: <Layers className="h-4 w-4" />,
    section: 'gestion',
  },
  {
    href: '/auditorias',
    label: 'Auditorías',
    icon: <ClipboardCheck className="h-4 w-4" />,
    section: 'gestion',
    roles: ['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'AUDITOR_LIDER', 'AUDITOR'],
  },
  {
    href: '/capa',
    label: 'CAPA',
    icon: <AlertTriangle className="h-4 w-4" />,
    section: 'gestion',
  },
  {
    href: '/riesgos',
    label: 'Riesgos',
    icon: <Target className="h-4 w-4" />,
    section: 'gestion',
    roles: ['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA'],
  },
  {
    href: '/encuestas',
    label: 'Encuestas',
    icon: <Smile className="h-4 w-4" />,
    section: 'gestion',
    roles: ['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA'],
  },
  {
    href: '/acreditacion',
    label: 'Acreditación',
    icon: <Award className="h-4 w-4" />,
    section: 'gestion',
    roles: ['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA', 'RESPONSABLE_PROCESO'],
  },
  {
    href: '/mantenedores',
    label: 'Mantenedores',
    icon: <Building2 className="h-4 w-4" />,
    section: 'administracion',
    roles: ['SUPERADMIN', 'ADMIN_CALIDAD'],
  },
  {
    href: '/usuarios',
    label: 'Usuarios',
    icon: <Users className="h-4 w-4" />,
    section: 'administracion',
    roles: ['SUPERADMIN', 'ADMIN_CALIDAD'],
  },
  {
    href: '/roles-permisos',
    label: 'Roles y Permisos',
    icon: <Shield className="h-4 w-4" />,
    section: 'administracion',
    roles: ['SUPERADMIN', 'ADMIN_CALIDAD'],
  },
];

const SECTION_TITLES: Record<NavItem['section'], string> = {
  principal: 'Inicio',
  gestion: 'Módulos SIGC',
  administracion: 'Administración',
};

export function Sidebar() {
  const pathname = usePathname();
  const { tieneRol } = useAuthStore();

  const itemsVisibles = NAV_ITEMS.filter((item) => !item.roles || tieneRol(item.roles));
  const itemsPorSeccion = (section: NavItem['section']) =>
    itemsVisibles.filter((item) => item.section === section);

  const estaActivo = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-2 py-4 lg:px-3" aria-label="Opciones del sistema">
      {(['principal', 'gestion', 'administracion'] as const).map((section) => {
        const sectionItems = itemsPorSeccion(section);
        if (sectionItems.length === 0) return null;

        return (
          <div key={section} className="space-y-2">
            <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 lg:block">
              {SECTION_TITLES[section]}
            </p>
            <div className="space-y-1">
              {sectionItems.map((item) => {
                const activo = estaActivo(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-150 lg:justify-start',
                      activo
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
                    )}
                    aria-current={activo ? 'page' : undefined}
                    title={item.label}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                        activo ? 'bg-blue-100 text-blue-700' : 'text-gray-500 group-hover:text-blue-700',
                      )}
                    >
                      {item.icon}
                    </span>
                    <div className="hidden min-w-0 flex-1 lg:block">
                      <span className="block truncate font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="hidden rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 lg:inline-flex">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      'hidden h-4 w-4 flex-shrink-0 lg:block',
                      activo ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-400',
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
