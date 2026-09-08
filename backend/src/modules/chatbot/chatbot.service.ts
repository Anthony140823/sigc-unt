import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface RespuestaChat {
  mensaje: string;
  acciones?: { etiqueta: string; ruta: string }[];
}

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(mensaje: string): Promise<RespuestaChat> {
    const texto = mensaje.toLowerCase().trim();

    // ── Saludos ────────────────────────────────────────────────
    if (this.coincide(texto, ['hola', 'buenos dias', 'buenas tardes', 'hey', 'alo', 'saludos'])) {
      return {
        mensaje: '¡Hola! Soy el asistente virtual del **SIGC-UNT**. Puedo ayudarte a:\n\n' +
          '• Navegar por los módulos del sistema\n' +
          '• Explicar cómo usar cada funcionalidad\n' +
          '• Mostrar estadísticas rápidas\n' +
          '• Responder dudas sobre procesos de calidad\n\n' +
          '¿En qué puedo ayudarte?',
        acciones: [
          { etiqueta: '📋 ¿Qué módulos hay?', ruta: '' },
          { etiqueta: '📊 Estadísticas rápidas', ruta: '' },
          { etiqueta: '❓ ¿Cómo funciona?', ruta: '' },
        ],
      };
    }

    if (this.coincide(texto, ['gracias', 'graci', 'thank', 'thanks', 'vale', 'ok'])) {
      return {
        mensaje: '¡De nada! Si tienes más preguntas, aquí estoy. 😊',
      };
    }

    // ── Módulos / Catálogo ─────────────────────────────────────
    if (this.coincide(texto, ['modulos', 'módulos', 'que hay', 'opciones', 'menu', 'menú', 'secciones', 'listado'])) {
      return {
        mensaje: 'El **SIGC-UNT** tiene los siguientes módulos:\n\n' +
          '1. 📄 **Gestión Documental** — Documentos, versiones, flujo de aprobación\n' +
          '2. 🗺️ **Mapa de Procesos** — Procesos, RACI, BPMN\n' +
          '3. 📊 **Indicadores** — KPIs, semáforos, mediciones\n' +
          '4. 🎯 **BSC** — Balanced Scorecard, objetivos estratégicos\n' +
          '5. 📋 **Auditorías** — Planes, checklists, hallazgos\n' +
          '6. 🔧 **CAPA** — No conformidades, causa raíz, acciones\n' +
          '7. ⚠️ **Riesgos** — Matriz de riesgos, mitigaciones\n' +
          '8. 📝 **Encuestas** — Creación, participación, resultados\n' +
          '9. 🎓 **Acreditación** — Autoevaluación, estándares\n' +
          '10. 👥 **Usuarios** — Gestión de usuarios y roles\n\n' +
          '¿Sobre cuál te gustaría saber más?',
        acciones: [
          { etiqueta: 'Gestión Documental', ruta: '/documentos' },
          { etiqueta: 'Indicadores', ruta: '/indicadores' },
          { etiqueta: 'CAPA', ruta: '/capa' },
          { etiqueta: 'Auditorías', ruta: '/auditorias' },
        ],
      };
    }

    // ── Dashboard ──────────────────────────────────────────────
    if (this.coincide(texto, ['dashboard', 'tablero', 'inicio', 'panel', 'resumen'])) {
      return {
        mensaje: 'El **Dashboard** te muestra un resumen ejecutivo, táctico y operativo del SGC.\n\n' +
          '• **Ejecutivo**: KPIs globales para rectoría\n' +
          '• **Táctico**: NC por estado, semáforos, riesgos (filtrable por área)\n' +
          '• **Operativo**: Tus tareas pendientes, notificaciones\n\n' +
          'Puedes acceder desde la barra lateral en "Dashboard".',
        acciones: [
          { etiqueta: 'Ir al Dashboard', ruta: '/dashboard' },
        ],
      };
    }

    // ── Gestión Documental ─────────────────────────────────────
    if (this.coincide(texto, ['documento', 'documental', 'gestion documental', 'gd', 'crear documento', 'nuevo documento', 'version', 'versiones', 'aprobar documento', 'publicar documento'])) {
      return {
        mensaje: '**Gestión Documental** — Ciclo de vida completo de documentos:\n\n' +
          '1. **Crear**: Ve a Documentos → "Nuevo documento". Completa código, título, tipo, adjunta archivo.\n' +
          '2. **Flujo**: Borrador → En Revisión → Aprobado → Publicado → Obsoleto.\n' +
          '3. **Versiones**: Cada documento puede tener múltiples versiones.\n' +
          '4. **Búsqueda**: Busca por código, título o palabras clave.\n\n' +
          '🔹 *Tip*: Usa tipos documentales (procedimientos, formatos, manuales) para organizar mejor.',
        acciones: [
          { etiqueta: 'Ir a Documentos', ruta: '/documentos' },
          { etiqueta: 'Crear documento', ruta: '/documentos/nuevo' },
        ],
      };
    }

    // ── Procesos ───────────────────────────────────────────────
    if (this.coincide(texto, ['procesos', 'mapa de procesos', 'proceso', 'macroproceso', 'raci', 'bpmn', 'subproceso'])) {
      return {
        mensaje: '**Mapa de Procesos** — Gestión de la estructura de procesos:\n\n' +
          '• **Macroprocesos**: Estratégicos, Misionales y de Soporte\n' +
          '• **Procesos**: Cada uno con objetivo, alcance, entradas/salidas\n' +
          '• **Subprocesos**: Anidados dentro de cada proceso\n' +
          '• **Matriz RACI**: Asigna Responsable, Aprobador, Consultado, Informado\n' +
          '• **Diagramas BPMN**: Soporte para almacenar diagramas\n\n' +
          'Puedes ver el árbol completo desde "Mapa de Procesos".',
        acciones: [
          { etiqueta: 'Ir a Procesos', ruta: '/procesos' },
        ],
      };
    }

    // ── Indicadores ────────────────────────────────────────────
    if (this.coincide(texto, ['indicador', 'indicadores', 'kpi', 'kpis', 'medicion', 'mediciones', 'semáforo', 'semaforo', 'meta', 'tendencia'])) {
      return {
        mensaje: '**Indicadores** — KPIs del SGC:\n\n' +
          '• **Crear**: Define fórmula, unidad, meta, frecuencia, tendencia\n' +
          '• **Mediciones**: Registra valores reales cada período\n' +
          '• **Semáforo**: Automático (VERDE = en meta, AMARILLO = alerta, ROJO = fuera de meta)\n' +
          '• **Historial**: Gráfico de tendencia a 12 meses\n' +
          '• **Vinculación**: Asocia a objetivos estratégicos del PEI\n\n' +
          '🟢 *Tip*: Revisa el semáforo mensual para detectar desviaciones a tiempo.',
        acciones: [
          { etiqueta: 'Ir a Indicadores', ruta: '/indicadores' },
          { etiqueta: 'Nuevo indicador', ruta: '/indicadores/nuevo' },
          { etiqueta: 'Ver BSC', ruta: '/bsc' },
        ],
      };
    }

    // ── BSC ────────────────────────────────────────────────────
    if (this.coincide(texto, ['bsc', 'balanced scorecard', 'estrategico', 'objetivo estrategico', 'perspectiva', 'mapa estrategico'])) {
      return {
        mensaje: '**BSC (Balanced Scorecard)** — Visión estratégica:\n\n' +
          'Agrupa los **objetivos estratégicos** por perspectiva (Clientes, Procesos, Financiera, Aprendizaje) y muestra sus indicadores asociados con semáforo.\n\n' +
          '• Ve a "BSC (Estratégicos)" en el menú lateral\n' +
          '• Cada objetivo muestra sus KPIs y última medición\n' +
          '• Haz clic en un objetivo para ver sus indicadores',
        acciones: [
          { etiqueta: 'Ir a BSC', ruta: '/bsc' },
          { etiqueta: 'Indicadores', ruta: '/indicadores' },
        ],
      };
    }

    // ── Auditorías ─────────────────────────────────────────────
    if (this.coincide(texto, ['auditoria', 'auditorías', 'auditar', 'plan de auditoria', 'checklist', 'hallazgo', 'hallazgos', 'auditor', 'auditor lider'])) {
      return {
        mensaje: '**Auditorías** — Gestión completa de auditorías:\n\n' +
          '1. **Plan Anual**: Crea el plan de auditorías del año\n' +
          '2. **Ejecución**: Programa auditorías con equipo, alcance y fechas\n' +
          '3. **Checklists**: Usa plantillas predefinidas para evaluar cumplimiento\n' +
          '4. **Hallazgos**: Registra no conformidades, observaciones y oportunidades de mejora\n' +
          '5. **Informe**: Genera reportes con resumen de hallazgos\n\n' +
          '🔹 *Tip*: Los hallazgos pueden derivar automáticamente en NC del módulo CAPA.',
        acciones: [
          { etiqueta: 'Ir a Auditorías', ruta: '/auditorias' },
        ],
      };
    }

    // ── CAPA ───────────────────────────────────────────────────
    if (this.coincide(texto, ['capa', 'no conformidad', 'nc', 'no conformidades', 'accion correctiva', 'causa raiz', 'ishikawa', '5 porques', 'accion preventiva'])) {
      return {
        mensaje: '**CAPA** — Acciones Correctivas y Preventivas:\n\n' +
          '1. **Registrar NC**: Describe la no conformidad, origen, área\n' +
          '2. **Analizar Causa Raíz**: Usa el método que prefieras:\n' +
          '   • 5 Porqués • Ishikawa (diagrama visual) • Pareto • FTA • 8D\n' +
          '3. **Plan de Acción**: Define acciones correctivas/preventivas con responsables y fechas\n' +
          '4. **Verificar Efectividad**: Confirma que la acción resolvió el problema\n' +
          '5. **Alertas**: El sistema te avisa si una acción está por vencer\n\n' +
          '🟢 *Tip*: El detalle de cada NC muestra el diagrama de Ishikawa si usaste ese método.',
        acciones: [
          { etiqueta: 'Ir a CAPA', ruta: '/capa' },
          { etiqueta: 'Ver ejemplo NC', ruta: '/capa/cb0d08a9-4ef5-4df3-8dc2-976bb67d601d' },
        ],
      };
    }

    // ── Riesgos ────────────────────────────────────────────────
    if (this.coincide(texto, ['riesgo', 'riesgos', 'matriz de riesgo', 'mapa de calor', 'mitigacion', 'control', 'probabilidad', 'impacto'])) {
      return {
        mensaje: '**Riesgos** — Gestión de riesgos:\n\n' +
          '1. **Identificar**: Registra el riesgo con causa, consecuencia, tipo\n' +
          '2. **Evaluar**: Probabilidad x Impacto = Nivel de riesgo\n' +
          '3. **Mapa de Calor**: Visualización agregada de todos los riesgos\n' +
          '4. **Mitigar**: Define estrategias (Evitar, Reducir, Transferir, Aceptar)\n' +
          '5. **Seguimiento**: Monitorea la evolución del riesgo periódicamente\n\n' +
          '🔹 *Tip*: Vincula riesgos a objetivos estratégicos para ver el impacto en el BSC.',
        acciones: [
          { etiqueta: 'Ir a Riesgos', ruta: '/riesgos' },
        ],
      };
    }

    // ── Encuestas ──────────────────────────────────────────────
    if (this.coincide(texto, ['encuesta', 'encuestas', 'sondeo', 'cuestionario', 'likert', 'satisfaccion', 'participacion'])) {
      return {
        mensaje: '**Encuestas** — Creación y gestión de encuestas:\n\n' +
          '1. **Diseño**: Crea secciones y preguntas (texto, numérica, opción múltiple, Likert)\n' +
          '2. **Publicación**: Activa la encuesta para recibir respuestas\n' +
          '3. **Participación**: Soporta respuestas anónimas (token) o identificadas\n' +
          '4. **Resultados**: Estadísticas agregadas por pregunta\n' +
          '5. **Población**: Dirige a estudiantes, docentes, administrativos\n\n' +
          '📊 *Tip*: Usa preguntas abiertas + análisis de sentimiento para insights cualitativos.',
        acciones: [
          { etiqueta: 'Ir a Encuestas', ruta: '/encuestas' },
        ],
      };
    }

    // ── Acreditación ───────────────────────────────────────────
    if (this.coincide(texto, ['acreditacion', 'acreditación', 'autoevaluacion', 'autoevaluación', 'sineace', 'sunedu', 'estandar', 'criterio', 'matriz cumplimiento'])) {
      return {
        mensaje: '**Acreditación** — Procesos de acreditación:\n\n' +
          '1. **Iniciar**: Crea un proceso para un programa académico vs un estándar\n' +
          '2. **Autoevaluación**: Evalúa cada criterio con puntuación, fortalezas y debilidades\n' +
          '3. **Matriz de Cumplimiento**: Vista completa factor por factor\n' +
          '4. **Evidencias**: Adjunta documentos a cada evaluación\n' +
          '5. **Flujo**: Planificación → Autoevaluación → Informe Previo → Visita Externa → Acreditado\n\n' +
          '🎯 *Tip*: La matriz de cumplimiento se recalcula automáticamente.',
        acciones: [
          { etiqueta: 'Ir a Acreditación', ruta: '/acreditacion' },
        ],
      };
    }

    // ── Usuarios ───────────────────────────────────────────────
    if (this.coincide(texto, ['usuario', 'usuarios', 'rol', 'roles', 'permiso', 'cuenta', 'contraseña', 'password'])) {
      return {
        mensaje: '**Usuarios** — Administración de usuarios:\n\n' +
          '• Roles disponibles: SUPERADMIN, ADMIN_CALIDAD, DIRECTOR_CALIDAD, JEFE_AREA, RESPONSABLE_PROCESO, AUDITOR_LIDER, AUDITOR, DIGITADOR, CONSULTA\n' +
          '• Puedes asignar múltiples roles a un usuario\n' +
          '• Los roles pueden tener ámbito (ej: JEFE_AREA de una facultad específica)\n' +
          '• Puedes activar/desactivar usuarios temporalmente\n\n' +
          '🔹 *Tip*: Los roles controlan el acceso a cada módulo del sistema.',
        acciones: [
          { etiqueta: 'Ir a Usuarios', ruta: '/usuarios' },
        ],
      };
    }

    // ── Mantenedores ───────────────────────────────────────────
    if (this.coincide(texto, ['mantenedor', 'mantenedores', 'facultad', 'programa academico', 'area', 'checklist plantilla'])) {
      return {
        mensaje: '**Mantenedores** — Catálogos del sistema:\n\n' +
          '• **Facultades**: CRUD de facultades universitarias\n' +
          '• **Programas Académicos**: Pre-grado, maestría, doctorado, etc.\n' +
          '• **Áreas**: Estructura jerárquica de oficinas y departamentos\n' +
          '• **Checklists**: Plantillas de checklist con ítems para auditorías\n\n' +
          'Accede desde "Mantenedores" en el menú (solo SUPERADMIN y ADMIN_CALIDAD).',
        acciones: [
          { etiqueta: 'Ir a Mantenedores', ruta: '/mantenedores' },
        ],
      };
    }

    // ── Exportación ────────────────────────────────────────────
    if (this.coincide(texto, ['exportar', 'exportacion', 'csv', 'excel', 'xlsx', 'descargar'])) {
      return {
        mensaje: '**Exportación** — Casi todos los listados tienen botones de exportación:\n\n' +
          '• **CSV** (📄): Formato de texto plano, abre en Excel o Google Sheets\n' +
          '• **Excel** (📊): Formato nativo con cabeceras en negrita y estilos\n' +
          '• **PDF** (📕): Disponible en vistas de detalle (checklists)\n\n' +
          'Busca los botones 📥 en la cabecera de cada listado.',
      };
    }

    // ── Tema oscuro ────────────────────────────────────────────
    if (this.coincide(texto, ['tema oscuro', 'dark mode', 'modo oscuro', 'tema', 'oscuro', 'claro', 'light'])) {
      return {
        mensaje: '**Tema Oscuro/Claro**:\n\n' +
          'Puedes cambiar entre tema claro y oscuro usando el botón 🌙/☀️ en la barra superior (Topbar), al lado derecho.\n\n' +
          'El sistema recuerda tu preferencia incluso después de cerrar sesión.',
      };
    }

    // ── Estadísticas rápidas ───────────────────────────────────
    if (this.coincide(texto, ['estadisticas', 'estadísticas', 'cuantos', 'cuántos', 'total', 'cantidad', 'contar', 'reporte', 'stats'])) {
      const stats = await this.obtenerEstadisticas();

      return {
        mensaje: `**Estadísticas rápidas del SIGC-UNT:**\n\n` +
          `📄 **Documentos:** ${stats.documentos} registrados\n` +
          `🗺️ **Procesos:** ${stats.procesos} en el mapa\n` +
          `📊 **Indicadores:** ${stats.indicadores} (${stats.semaforoVerde} 🟢 ${stats.semaforoAmarillo} 🟡 ${stats.semaforoRojo} 🔴)\n` +
          `🔧 **No Conformidades:** ${stats.nc} registradas\n` +
          `⚠️ **Riesgos:** ${stats.riesgos} identificados\n` +
          `📝 **Encuestas:** ${stats.encuestas} creadas\n` +
          `👥 **Usuarios:** ${stats.usuarios} en el sistema\n` +
          `🎓 **Programas:** ${stats.programas} académicos\n\n` +
          `_Datos actualizados al momento de la consulta._`,
      };
    }

    // ── Ayuda general ──────────────────────────────────────────
    if (this.coincide(texto, ['ayuda', 'help', 'como', 'cómo', 'que puedes', 'funciones', 'que haces', 'q haces'])) {
      return {
        mensaje: 'Puedo ayudarte con:\n\n' +
          '• **Info de módulos**: "¿qué es CAPA?", "¿cómo funciona BSC?"\n' +
          '• **Guías rápidas**: "¿cómo creo un documento?"\n' +
          '• **Estadísticas**: "estadísticas rápidas", "cuántos usuarios hay"\n' +
          '• **Navegación**: "llévame a indicadores", "dónde está el BSC"\n' +
          '• **Generales**: "tema oscuro", "exportar datos"\n\n' +
          '¿Qué necesitas saber?',
        acciones: [
          { etiqueta: '📋 Módulos', ruta: '' },
          { etiqueta: '📊 Estadísticas', ruta: '' },
          { etiqueta: '❓ Cómo crear documento', ruta: '' },
        ],
      };
    }

    // ── Navegación (ir a...) ───────────────────────────────────
    const rutaMatch = this.buscarRuta(texto);
    if (rutaMatch) {
      return {
        mensaje: `Puedes acceder a **${rutaMatch.label}** desde el menú lateral o haciendo clic aquí:`,
        acciones: [{ etiqueta: `Ir a ${rutaMatch.label}`, ruta: rutaMatch.ruta }],
      };
    }

    // ── Fallback ───────────────────────────────────────────────
    return {
      mensaje: 'No entendí tu consulta. 😅 Intenta preguntar de otra forma:\n\n' +
        '• "¿Qué módulos hay?"\n' +
        '• "¿Cómo funciona CAPA?"\n' +
        '• "Estadísticas rápidas"\n' +
        '• "Ir a indicadores"\n' +
        '• "Ayuda"',
      acciones: [
        { etiqueta: '📋 Ver módulos', ruta: '' },
        { etiqueta: '📊 Estadísticas', ruta: '' },
        { etiqueta: '❓ Ayuda', ruta: '' },
      ],
    };
  }

  // ── Utilidades ───────────────────────────────────────────────

  private coincide(texto: string, patrones: string[]): boolean {
    return patrones.some((p) => texto.includes(p));
  }

  private buscarRuta(texto: string): { label: string; ruta: string } | null {
    const rutas: [string[], string, string][] = [
      [['ir a dashboard', 'ir a inicio', 'llévame al dashboard', 'abrir dashboard'], 'Dashboard', '/dashboard'],
      [['ir a documentos', 'abrir documentos', 'ir a gestion documental', 'ir a gd'], 'Gestión Documental', '/documentos'],
      [['ir a procesos', 'abrir procesos', 'ir a mapa de procesos'], 'Mapa de Procesos', '/procesos'],
      [['ir a indicadores', 'abrir indicadores', 'ir a kpi'], 'Indicadores', '/indicadores'],
      [['ir a bsc', 'abrir bsc', 'ir a balanced scorecard', 'ir a estrategico'], 'BSC', '/bsc'],
      [['ir a auditorias', 'abrir auditorias', 'ir a auditoría'], 'Auditorías', '/auditorias'],
      [['ir a capa', 'abrir capa', 'ir a no conformidades', 'ir a nc'], 'CAPA', '/capa'],
      [['ir a riesgos', 'abrir riesgos', 'ir a matriz de riesgos'], 'Riesgos', '/riesgos'],
      [['ir a encuestas', 'abrir encuestas'], 'Encuestas', '/encuestas'],
      [['ir a acreditacion', 'abrir acreditacion'], 'Acreditación', '/acreditacion'],
      [['ir a usuarios', 'abrir usuarios', 'ir a usuario'], 'Usuarios', '/usuarios'],
      [['ir a mantenedores', 'abrir mantenedores'], 'Mantenedores', '/mantenedores'],
    ];

    for (const [patrones, label, ruta] of rutas) {
      if (patrones.some((p) => texto.includes(p))) {
        return { label, ruta };
      }
    }
    return null;
  }

  private async obtenerEstadisticas() {
    const [documentos, procesos, indicadores, nc, riesgos, encuestas, usuarios, programas] = await Promise.all([
      this.prisma.documentos.count({ where: { esta_activo: true } }),
      this.prisma.procesos.count({ where: { esta_activo: true } }),
      this.prisma.indicadores.count({ where: { esta_activo: true } }),
      this.prisma.no_conformidades.count(),
      this.prisma.riesgos.count({ where: { activo: true } }),
      this.prisma.encuestas.count(),
      this.prisma.usuarios.count({ where: { esta_activo: true } }),
      this.prisma.programas_academicos.count({ where: { esta_activo: true } }),
    ]);

    const semaforos = await this.prisma.mediciones_indicador.groupBy({
      by: ['estado_semaforo'],
      _count: true,
    });
    const semaforoVerde = semaforos.find((s) => s.estado_semaforo === 'VERDE')?._count ?? 0;
    const semaforoAmarillo = semaforos.find((s) => s.estado_semaforo === 'AMARILLO')?._count ?? 0;
    const semaforoRojo = semaforos.find((s) => s.estado_semaforo === 'ROJO')?._count ?? 0;

    return { documentos, procesos, indicadores, semaforoVerde, semaforoAmarillo, semaforoRojo, nc, riesgos, encuestas, usuarios, programas };
  }
}
