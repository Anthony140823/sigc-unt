const fs = require('fs');

function prepend(file, text) {
  const c = fs.readFileSync(file, 'utf8');
  if (!c.includes(text)) fs.writeFileSync(file, text + '\n' + c);
}

// Fix 1 & 2
const jwtF = 'src/common/interfaces/jwt-payload.interface.ts';
if (fs.existsSync(jwtF)) {
    let c = fs.readFileSync(jwtF, 'utf8');
    c = c.replace(/import \{ UsuarioJwtPayload \} from '.\/jwt-payload.interface';/, '');
    fs.writeFileSync(jwtF, c);
}

const pipeF = 'src/common/pipes/parse-uuid.pipe.ts';
if (fs.existsSync(pipeF)) {
    let c = fs.readFileSync(pipeF, 'utf8');
    c = c.replace(/import \{ PipeTransform, Injectable, ArgumentMetadata \} from '@nestjs\/common';/, '');
    fs.writeFileSync(pipeF, c);
}

// Fix 3
const areaDir = 'src/modules/areas/dto';
if (!fs.existsSync(areaDir)) fs.mkdirSync(areaDir, {recursive: true});
fs.writeFileSync(areaDir + '/actualizar-area.dto.ts', "import { PartialType } from '@nestjs/swagger';\nimport { CrearAreaDto } from './crear-area.dto';\nexport class ActualizarAreaDto extends PartialType(CrearAreaDto) {}\n");

// Fix 4
const auditF = 'src/modules/auditorias/dto/responder-checklist.dto.ts';
if (fs.existsSync(auditF)) {
    let c = fs.readFileSync(auditF, 'utf8');
    if (!c.includes('ApiPropertyOptional')) {
        c = c.replace(/import \{ ApiProperty \} from '@nestjs\/swagger';/, "import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';");
        fs.writeFileSync(auditF, c);
    }
}

// Fix 5
const capaDir = 'src/modules/capa/dto';
if (!fs.existsSync(capaDir)) fs.mkdirSync(capaDir, {recursive: true});
fs.writeFileSync(capaDir + '/actualizar-no-conformidad.dto.ts', "import { PartialType } from '@nestjs/swagger';\nimport { CrearNoConformidadDto } from './crear-no-conformidad.dto';\nexport class ActualizarNoConformidadDto extends PartialType(CrearNoConformidadDto) {}\n");

// Fix 6
const capaS = 'src/modules/capa/capa.service.ts';
if (fs.existsSync(capaS)) {
    let c = fs.readFileSync(capaS, 'utf8');
    c = c.replace(/CrearAnalisisCausaRizDto/g, 'CrearAnalisisCausaRaizDto');
    fs.writeFileSync(capaS, c);
}
