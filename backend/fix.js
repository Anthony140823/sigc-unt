const fs = require('fs');

function prepend(file, text) {
  const c = fs.readFileSync(file, 'utf8');
  if (!c.includes(text)) fs.writeFileSync(file, text + '\n' + c);
}

prepend('src/modules/indicadores/dto/actualizar-indicador.dto.ts', "import { CrearIndicadorDto } from './crear-indicador.dto';");
prepend('src/modules/documentos/dto/actualizar-documento.dto.ts', "import { CrearDocumentoDto } from './crear-documento.dto';");
prepend('src/modules/procesos/dto/actualizar-proceso.dto.ts', "import { CrearProcesoDto } from './crear-proceso.dto';");
prepend('src/modules/riesgos/dto/actualizar-riesgo.dto.ts', "import { CrearRiesgoDto } from './crear-riesgo.dto';");
prepend('src/modules/usuarios/dto/actualizar-usuario.dto.ts', "import { CrearUsuarioDto } from './crear-usuario.dto';");
prepend('src/modules/indicadores/dto/filtrar-indicadores.dto.ts', "import { Transform } from 'class-transformer';");
prepend('src/modules/indicadores/dto/registrar-medicion.dto.ts', "import { Transform } from 'class-transformer';");
prepend('src/modules/usuarios/dto/filtrar-usuarios.dto.ts', "export enum TipoUsuario { ADMIN = 'ADMIN', EVALUADOR = 'EVALUADOR', CONSULTA = 'CONSULTA', AUDITOR = 'AUDITOR' }");

// also fix some implicit any types
const f1 = 'src/modules/acreditacion/acreditacion.service.ts';
fs.writeFileSync(f1, fs.readFileSync(f1, 'utf8').replace(/c\.autoevaluaciones/g, '(c as any).autoevaluaciones').replace(/\(c\)/g, '(c: any)').replace(/\(f\)/g, '(f: any)').replace(/\(p\)/g, '(p: any)').replace(/\(acc, ae\)/g, '(acc: any, ae: any)'));

const f2 = 'src/modules/dashboard/dashboard.service.ts';
fs.writeFileSync(f2, fs.readFileSync(f2, 'utf8').replace(/\(acc: any, s\)/g, '(acc: any, s: any)'));

const f3 = 'src/modules/indicadores/indicadores.service.ts';
fs.writeFileSync(f3, fs.readFileSync(f3, 'utf8').replace(/\(acc: any, r\)/g, '(acc: any, r: any)'));

const f4 = 'src/database/prisma.service.ts';
fs.writeFileSync(f4, fs.readFileSync(f4, 'utf8').replace(/\(params, next\)/g, '(params: any, next: any)'));
