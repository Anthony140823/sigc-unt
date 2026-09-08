// src/common/interfaces/jwt-payload.interface.ts
export interface UsuarioJwtPayload {
  sub: string;           // UUID del usuario
  username: string;
  email: string;
  roles: string[];
  area_id?: string;
  iat?: number;
  exp?: number;
}

// src/common/interfaces/paginacion.interface.ts
export interface OpcionesPaginacion {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface RespuestaPaginada<T> {
  datos: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    tieneSiguiente: boolean;
    tieneAnterior: boolean;
  };
}

// src/common/interfaces/respuesta-api.interface.ts
export interface RespuestaApi<T = any> {
  exito: boolean;
  mensaje: string;
  datos?: T;
  timestamp: string;
  ruta?: string;
}

// src/common/interfaces/usuario-request.interface.ts
import { Request } from 'express';


export interface RequestConUsuario extends Request {
  user: UsuarioJwtPayload;
}
