-- Seed checklists and items for all audit types
BEGIN;

INSERT INTO sigc_unt.checklists (tipo_auditoria_id, nombre, descripcion, version, esta_activo)
VALUES
  (1, 'Checklist Auditoria Interna ISO 9001', 'Lista de verificacion para auditorias internas basada en ISO 9001:2015', '1.0', true),
  (2, 'Checklist Auditoria Externa', 'Lista de verificacion para auditorias externas', '1.0', true),
  (3, 'Checklist Auditoria de Seguimiento', 'Lista de verificacion para auditorias de seguimiento', '1.0', true),
  (4, 'Checklist Auditoria de Certificacion', 'Lista de verificacion para auditorias de certificacion', '1.0', true),
  (5, 'Checklist Auditoria Inicial', 'Lista de verificacion para auditorias iniciales o linea base', '1.0', true)
ON CONFLICT DO NOTHING;

-- Items for Interna (tipo_auditoria_id = 1)
DO $$
DECLARE
  cl_id UUID;
BEGIN
  SELECT id INTO cl_id FROM sigc_unt.checklists WHERE tipo_auditoria_id = 1 LIMIT 1;

  INSERT INTO sigc_unt.items_checklist (checklist_id, criterio_referencia, pregunta, descripcion_ayuda, tipo_respuesta, obligatorio, orden)
  VALUES
    (cl_id, '4.1', 'La organizacion ha determinado los factores externos e internos relevantes?', 'Verificar que se ha realizado el analisis del contexto de la organizacion', 'SI_NO', true, 1),
    (cl_id, '4.4', 'El SGC y sus procesos estan definidos y documentados?', 'Revisar mapa de procesos, interacciones y criterios', 'SI_NO', true, 2),
    (cl_id, '5.1', 'La alta direccion demuestra liderazgo y compromiso?', 'Verificar politica de calidad, objetivos y revision por la direccion', 'SI_NO', true, 3),
    (cl_id, '5.2', 'La politica de calidad esta definida y comunicada?', 'Revisar que la politica sea adecuada y este disponible para las partes interesadas', 'SI_NO', true, 4),
    (cl_id, '5.3', 'Los roles, responsabilidades y autoridades estan asignados?', 'Verificar organigrama, descripcion de puestos y matriz RACI', 'SI_NO', true, 5),
    (cl_id, '6.1', 'Se han determinado los riesgos y oportunidades?', 'Revisar matriz de riesgos y planes de mitigacion', 'SI_NO', true, 6),
    (cl_id, '6.2', 'Los objetivos de calidad estan establecidos en las funciones pertinentes?', 'Verificar que los objetivos sean medibles, coherentes y tengan plazos', 'SI_NO', true, 7),
    (cl_id, '7.1', 'La organizacion proporciona los recursos necesarios?', 'Verificar disponibilidad de recursos humanos, infraestructura y ambiente', 'SI_NO', true, 8),
    (cl_id, '7.2', 'El personal es competente?', 'Revisar perfiles de puesto, capacitaciones y evaluaciones de competencia', 'SI_NO', true, 9),
    (cl_id, '7.4', 'La comunicacion interna es efectiva?', 'Verificar canales de comunicacion y registro de comunicaciones', 'SI_NO', false, 10),
    (cl_id, '7.5', 'La informacion documentada esta controlada?', 'Revisar control de documentos, versiones, codigos y registros', 'SI_NO', true, 11),
    (cl_id, '8.1', 'Las operaciones estan planificadas y controladas?', 'Verificar planificacion operativa, controles y criterios de aceptacion', 'SI_NO', true, 12),
    (cl_id, '8.2', 'Los requisitos de los productos/servicios se determinan y revisan?', 'Revisar contratos, ordenes de servicio y comunicacion con el cliente', 'SI_NO', true, 13),
    (cl_id, '8.4', 'Los proveedores externos son evaluados y controlados?', 'Verificar listado de proveedores, evaluaciones y criterios de seleccion', 'SI_NO', true, 14),
    (cl_id, '8.5', 'La produccion y prestacion del servicio esta controlada?', 'Revisar instructivos, registros de produccion y trazabilidad', 'SI_NO', true, 15),
    (cl_id, '8.6', 'La liberacion de productos/servicios se realiza de forma controlada?', 'Verificar criterios de aceptacion y registros de liberacion', 'SI_NO', true, 16),
    (cl_id, '8.7', 'Las salidas no conformes se identifican y controlan?', 'Revisar registros de NC, acciones tomadas y autorizaciones', 'SI_NO', true, 17),
    (cl_id, '9.1', 'Se realiza el seguimiento, medicion, analisis y evaluacion?', 'Verificar indicadores, semaforos y dashboards de gestion', 'SI_NO', true, 18),
    (cl_id, '9.1.2', 'La satisfaccion del cliente se evalua?', 'Revisar encuestas, quejas, reclamos y su tratamiento', 'SI_NO', true, 19),
    (cl_id, '9.2', 'Se realizan auditorias internas a intervalos planificados?', 'Verificar plan de auditorias, informes y cierre de hallazgos', 'SI_NO', true, 20),
    (cl_id, '9.3', 'La direccion realiza la revision del SGC?', 'Verificar actas de revision, entradas, salidas y decisiones', 'SI_NO', true, 21),
    (cl_id, '10.1', 'Las no conformidades se manejan adecuadamente?', 'Revisar registro de NC, analisis de causa raiz y acciones correctivas', 'SI_NO', true, 22),
    (cl_id, '10.3', 'La organizacion mejora continuamente?', 'Verificar plan de mejora, acciones preventivas y oportunidades de mejora', 'SI_NO', true, 23);

  -- Items for Externa (tipo_auditoria_id = 2)
  SELECT id INTO cl_id FROM sigc_unt.checklists WHERE tipo_auditoria_id = 2 LIMIT 1;
  IF cl_id IS NULL THEN RAISE EXCEPTION 'Checklist for tipo_auditoria 2 not found'; END IF;

  INSERT INTO sigc_unt.items_checklist (checklist_id, criterio_referencia, pregunta, descripcion_ayuda, tipo_respuesta, obligatorio, orden)
  VALUES
    (cl_id, 'G-DOC', 'La documentacion del SGC esta completa y actualizada?', 'Revisar manual, procedimientos, registros y politica de calidad', 'SI_NO', true, 1),
    (cl_id, 'G-IMP', 'El SGC se implementa conforme a la documentacion?', 'Verificar que las practicas reales coinciden con lo documentado', 'SI_NO', true, 2),
    (cl_id, 'G-MED', 'Los procesos de medicion y seguimiento son efectivos?', 'Revisar indicadores, metas y resultados de desempeno', 'SI_NO', true, 3),
    (cl_id, 'G-MEJ', 'Se evidencia la mejora continua del sistema?', 'Verificar acciones correctivas, preventivas y de mejora implementadas', 'SI_NO', true, 4);

  -- Items for Seguimiento (tipo_auditoria_id = 3)
  SELECT id INTO cl_id FROM sigc_unt.checklists WHERE tipo_auditoria_id = 3 LIMIT 1;

  INSERT INTO sigc_unt.items_checklist (checklist_id, criterio_referencia, pregunta, descripcion_ayuda, tipo_respuesta, obligatorio, orden)
  VALUES
    (cl_id, 'S-NC', 'Las no conformidades previas fueron cerradas efectivamente?', 'Verificar cierre de hallazgos de la auditoria anterior', 'SI_NO', true, 1),
    (cl_id, 'S-ACC', 'Las acciones correctivas se implementaron y verificaron?', 'Revisar efectividad de las acciones tomadas', 'SI_NO', true, 2),
    (cl_id, 'S-MEJ', 'Se mantienen las mejoras implementadas?', 'Verificar sostenibilidad de las mejoras en el tiempo', 'SI_NO', true, 3);

  -- Items for Certificacion (tipo_auditoria_id = 4)
  SELECT id INTO cl_id FROM sigc_unt.checklists WHERE tipo_auditoria_id = 4 LIMIT 1;

  INSERT INTO sigc_unt.items_checklist (checklist_id, criterio_referencia, pregunta, descripcion_ayuda, tipo_respuesta, obligatorio, orden)
  VALUES
    (cl_id, 'C-CON', 'El SGC cumple con todos los requisitos de la norma?', 'Verificar cumplimiento integral de la norma de referencia', 'SI_NO', true, 1),
    (cl_id, 'C-EFI', 'El SGC es eficaz para lograr los resultados previstos?', 'Evaluar la eficacia del sistema basada en resultados', 'SI_NO', true, 2),
    (cl_id, 'C-MEJ', 'Existe evidencia de mejora continua sostenida?', 'Revisar tendencias de indicadores y acciones de mejora', 'SI_NO', true, 3);

  -- Items for Inicial (tipo_auditoria_id = 5)
  SELECT id INTO cl_id FROM sigc_unt.checklists WHERE tipo_auditoria_id = 5 LIMIT 1;

  INSERT INTO sigc_unt.items_checklist (checklist_id, criterio_referencia, pregunta, descripcion_ayuda, tipo_respuesta, obligatorio, orden)
  VALUES
    (cl_id, 'I-DOC', 'Existe documentacion basica del SGC?', 'Verificar si existe politica, objetivos, procedimientos y registros', 'SI_NO', true, 1),
    (cl_id, 'I-PRO', 'Los procesos estan identificados y mapeados?', 'Revisar mapa de procesos, interacciones y responsables', 'SI_NO', true, 2),
    (cl_id, 'I-IND', 'Existen indicadores de gestion definidos?', 'Verificar si hay indicadores definidos con metas y frecuencias', 'SI_NO', true, 3),
    (cl_id, 'I-CAP', 'El personal conoce el SGC?', 'Evaluar el nivel de conocimiento del personal sobre el sistema', 'SI_NO', false, 4);
END $$;

COMMIT;
