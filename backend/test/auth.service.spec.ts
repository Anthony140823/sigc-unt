// test/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsuariosService } from '../src/modules/usuarios/usuarios.service';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock de PrismaService
const mockPrismaService = {
  usuarios: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tokens_refresco: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  log_sesiones: {
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiresIn': '7d',
    };
    return config[key];
  }),
};

const mockEventEmitter = { emit: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: UsuariosService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('validarCredenciales', () => {
    it('debe retornar null si el usuario no existe', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);
      const resultado = await service.validarCredenciales('noexiste', 'pass123');
      expect(resultado).toBeNull();
    });

    it('debe retornar null y registrar intento fallido si la contraseña es incorrecta', async () => {
      const passwordHash = await bcrypt.hash('password-correcto', 10);
      prisma.usuarios.findFirst.mockResolvedValue({
        id: 'uuid-test',
        password_hash: passwordHash,
        bloqueado_hasta: null,
        intentos_login: 0,
        usuarios_roles: [],
        areas: null,
      });
      prisma.usuarios.update.mockResolvedValue({});

      const resultado = await service.validarCredenciales('jperez', 'password-incorrecto');
      expect(resultado).toBeNull();
      expect(prisma.usuarios.update).toHaveBeenCalledWith({
        where: { id: 'uuid-test' },
        data: { intentos_login: 1 },
      });
    });

    it('debe retornar el usuario si las credenciales son correctas', async () => {
      const passwordHash = await bcrypt.hash('Mi@Pass2025', 10);
      const usuarioMock = {
        id: 'uuid-test',
        username: 'jperez',
        password_hash: passwordHash,
        bloqueado_hasta: null,
        intentos_login: 2,
        usuarios_roles: [{ roles: { codigo: 'JEFE_AREA' } }],
        areas: { id: 'area-id', nombre: 'Oficina TI' },
      };
      prisma.usuarios.findFirst.mockResolvedValue(usuarioMock);
      prisma.usuarios.update.mockResolvedValue(usuarioMock);

      const resultado = await service.validarCredenciales('jperez', 'Mi@Pass2025');
      expect(resultado).toEqual(usuarioMock);
      expect(prisma.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ intentos_login: 0 }),
        }),
      );
    });

    it('debe lanzar UnauthorizedException si la cuenta está bloqueada', async () => {
      const bloqueadoHasta = new Date();
      bloqueadoHasta.setHours(bloqueadoHasta.getHours() + 1);
      prisma.usuarios.findFirst.mockResolvedValue({
        id: 'uuid-test',
        password_hash: 'hash',
        bloqueado_hasta: bloqueadoHasta,
        intentos_login: 5,
        usuarios_roles: [],
      });

      await expect(
        service.validarCredenciales('jperez', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('debe generar access_token y refresh_token al hacer login exitoso', async () => {
      const usuarioMock = {
        id: 'uuid-test',
        username: 'jperez',
        email: 'jperez@unitru.edu.pe',
        nombres: 'Juan',
        apellidos: 'Pérez',
        area_id: 'area-id',
        usuarios_roles: [{ roles: { codigo: 'JEFE_AREA' } }],
        areas: { id: 'area-id', nombre: 'OCAL' },
      };
      prisma.tokens_refresco.create.mockResolvedValue({ id: 1 });
      prisma.log_sesiones.create.mockResolvedValue({});

      const resultado = await service.login(usuarioMock, '192.168.1.1', 'Mozilla/5.0');

      expect(resultado).toHaveProperty('access_token');
      expect(resultado).toHaveProperty('refresh_token');
      expect(resultado).toHaveProperty('usuario');
      expect(resultado.usuario.roles).toContain('JEFE_AREA');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('debe revocar tokens y registrar la sesión', async () => {
      prisma.tokens_refresco.updateMany.mockResolvedValue({ count: 2 });
      prisma.log_sesiones.create.mockResolvedValue({});

      const resultado = await service.logout('uuid-test', '192.168.1.1');
      expect(resultado.mensaje).toContain('Sesión cerrada');
      expect(prisma.tokens_refresco.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usuario_id: 'uuid-test', revocado: false },
          data: { revocado: true },
        }),
      );
    });
  });
});

// ================================================================
// test/documentos.service.spec.ts
// ================================================================
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DocumentosService } from '../src/modules/documentos/documentos.service';
import { MinioService } from '../src/modules/documentos/minio.service';

const mockPrismaDoc = {
  documentos: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  versiones_documento: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  aprobaciones_documento: { create: jest.fn() },
  estados_flujo: { findFirst: jest.fn() },
};

const mockMinioService = {
  subirArchivo: jest.fn(),
  generarUrlDescarga: jest.fn(),
  generarNombreArchivo: jest.fn().mockReturnValue('docs/test-file.pdf'),
};

describe('DocumentosService', () => {
  let service: DocumentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        { provide: PrismaService, useValue: mockPrismaDoc },
        { provide: MinioService, useValue: mockMinioService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
    jest.clearAllMocks();
  });

  describe('crear', () => {
    it('debe lanzar ConflictException si el código ya existe', async () => {
      mockPrismaDoc.documentos.findFirst.mockResolvedValueOnce({
        id: 'existing', codigo: 'POL-GD-001',
      });

      await expect(
        service.crear(
          {
            codigo: 'POL-GD-001',
            titulo: 'Test',
            tipo_documento_id: 1,
            area_id: 'area-uuid',
          } as any,
          'usuario-uuid',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear el documento con estado BORRADOR', async () => {
      mockPrismaDoc.documentos.findFirst.mockResolvedValueOnce(null);
      mockPrismaDoc.estados_flujo.findFirst.mockResolvedValueOnce({ id: 1, codigo: 'BORRADOR' });
      mockPrismaDoc.documentos.create.mockResolvedValueOnce({
        id: 'new-doc-uuid',
        codigo: 'POL-GD-002',
        titulo: 'Nueva Política',
        estados_flujo: { codigo: 'BORRADOR' },
      });

      const resultado = await service.crear(
        {
          codigo: 'POL-GD-002',
          titulo: 'Nueva Política',
          tipo_documento_id: 1,
          area_id: 'area-uuid',
        } as any,
        'usuario-uuid',
      );

      expect(resultado.codigo).toBe('POL-GD-002');
      expect(mockPrismaDoc.documentos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            codigo: 'POL-GD-002',
            estado_id: 1,
          }),
        }),
      );
    });
  });

  describe('cambiarEstado', () => {
    it('debe rechazar transición inválida', async () => {
      mockPrismaDoc.documentos.findUnique.mockResolvedValueOnce({
        id: 'doc-uuid',
        eliminado_en: null,
        estados_flujo: { codigo: 'BORRADOR' },
        versiones_documento: [],
      });

      await expect(
        service.cambiarEstado(
          'doc-uuid',
          { nuevo_estado: 'PUBLICADO' },   // saltar APROBADO
          'usuario-uuid',
        ),
      ).rejects.toThrow();
    });
  });
});
