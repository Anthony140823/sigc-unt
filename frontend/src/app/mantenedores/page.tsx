'use client';
import Link from 'next/link';
import {
  Building2, GraduationCap, LayoutGrid, ClipboardCheck,
  Shield, Database,
} from 'lucide-react';

const mantenedores = [
  {
    titulo: 'Facultades',
    descripcion: 'Gestión de facultades: crear, editar y administrar facultades universitarias.',
    icono: Building2,
    href: '/mantenedores/facultades',
    color: 'blue',
  },
  {
    titulo: 'Programas Académicos',
    descripcion: 'Administración de programas académicos (pregrado, maestría, doctorado, etc.).',
    icono: GraduationCap,
    href: '/mantenedores/programas',
    color: 'green',
  },
  {
    titulo: 'Áreas',
    descripcion: 'Gestión de áreas institucionales: creación y edición de áreas.',
    icono: LayoutGrid,
    href: '/mantenedores/areas',
    color: 'purple',
  },
  {
    titulo: 'Checklists de Auditoría',
    descripcion: 'Gestión de plantillas de checklist por tipo de auditoría.',
    icono: ClipboardCheck,
    href: '/mantenedores/checklists',
    color: 'orange',
  },
  {
    titulo: 'Roles del Sistema',
    descripcion: 'Creación y edición de roles, niveles jerárquicos y descripciones.',
    icono: Shield,
    href: '/mantenedores/roles',
    color: 'red',
  },
  {
    titulo: 'Catálogos',
    descripcion: 'Tipos de documento, frecuencias, tipos de auditoría, estándares y objetivos estratégicos.',
    icono: Database,
    href: '/mantenedores/catalogos',
    color: 'teal',
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200',   iconBg: 'bg-blue-100' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',ring: 'ring-emerald-200',iconBg: 'bg-emerald-100' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', iconBg: 'bg-violet-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', iconBg: 'bg-orange-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',    iconBg: 'bg-red-100' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   ring: 'ring-teal-200',   iconBg: 'bg-teal-100' },
};

export default function MantenedoresHub() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Mantenedores</h2>
        <p className="text-xs text-gray-400 mt-0.5">Seleccione un mantenedor para administrar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mantenedores.map((m) => {
          const colors = colorMap[m.color];
          const Icon = m.icono;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`${colors.bg} rounded-xl p-5 ring-1 ${colors.ring} hover:shadow-md transition-shadow group`}
            >
              <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <h3 className={`text-sm font-semibold ${colors.text} group-hover:underline`}>{m.titulo}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.descripcion}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
