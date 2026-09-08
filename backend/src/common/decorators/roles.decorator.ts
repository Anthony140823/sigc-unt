// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum RolSistema {
  SUPERADMIN          = 'SUPERADMIN',
  ADMIN_CALIDAD       = 'ADMIN_CALIDAD',
  DIRECTOR_CALIDAD    = 'DIRECTOR_CALIDAD',
  AUDITOR_LIDER       = 'AUDITOR_LIDER',
  AUDITOR             = 'AUDITOR',
  JEFE_AREA           = 'JEFE_AREA',
  RESPONSABLE_PROCESO = 'RESPONSABLE_PROCESO',
  DIGITADOR           = 'DIGITADOR',
  CONSULTA            = 'CONSULTA',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolSistema[]) => SetMetadata(ROLES_KEY, roles);

// src/common/decorators/publico.decorator.ts
export const PUBLICO_KEY = 'isPublic';
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
