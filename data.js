/**
 * REFUGIO — data.js
 * ------------------------------------------------------------------
 * Modelo de datos de la aplicación.
 * Este archivo NO contiene lógica de negocio ni acceso a localStorage,
 * solo define la ESTRUCTURA de los datos y el catálogo de categorías
 * de seguimiento (una sola fuente de verdad para todo el resto del
 * sistema: formularios, timeline, calendario, estadísticas, PDF...).
 *
 * Cada categoría define:
 *  - id:        identificador único, se usa como key dentro de un
 *               "entry" (registro diario) y no debe cambiar nunca.
 *  - label:     nombre visible.
 *  - icon:      emoji (evita dependencias de iconografía externa).
 *  - group:     agrupa categorías en el formulario diario.
 *  - type:      "scale"   -> escala 1-5
 *               "bool"    -> sí / no
 *               "number"  -> valor numérico libre (con unidad)
 *               "text"    -> texto libre corto
 *               "longtext"-> texto libre largo (diario / gratitud)
 *               "multi"   -> selección múltiple de opciones
 *               "select"  -> selección única de opciones
 *  - unit:      unidad para type "number" (opcional).
 *  - options:   opciones para type "multi" / "select".
 *  - numeric:   true si el valor se puede promediar/correlacionar
 *               en las estadísticas (escalas y números).
 * ------------------------------------------------------------------
 */

'use strict';

const REFUGIO_DATA = {

  /** Versión del esquema de datos. Se usa para futuras migraciones. */
  SCHEMA_VERSION: 1,

  /** Clave raíz usada en localStorage (ver storage.js). */
  STORAGE_KEYS: {
    PROFILE: 'refugio_profile',
    ENTRIES: 'refugio_entries',
    SETTINGS: 'refugio_settings',
    CHECKLIST_TEMPLATE: 'refugio_checklist_template'
  },

  /** Paleta de la app (se refleja también en styles.css como variables).
   *  Estilo "matcha barbie": minimalista sobre crema, con verde matcha
   *  y rosa Barbie como acentos vibrantes (no pastel apagado). */
  PALETTE: {
    rosa: '#FF2E93',
    rosaFuerte: '#C71585',
    verde: '#A9C23F',
    verdeFuerte: '#748E2C',
    crema: '#FBF9F3',
    gris: '#F3F0E6',
    grisBorde: '#E9E3D3',
    grisTexto: '#8A8478',
    texto: '#18160F'
  },

  /** Grupos en los que se organiza el registro diario. */
  GROUPS: [
    { id: 'animo', label: 'Ánimo y emociones', icon: '💗' },
    { id: 'cuerpo', label: 'Cuerpo y salud física', icon: '🌿' },
    { id: 'habitos', label: 'Hábitos y consumo', icon: '☕' },
    { id: 'mente', label: 'Mente y foco', icon: '🧠' },
    { id: 'vida', label: 'Vida diaria', icon: '🏡' },
    { id: 'reflexion', label: 'Reflexión', icon: '📓' }
  ],

  /** Catálogo completo de categorías de seguimiento. */
  CATEGORIES: [
    // ---------- ÁNIMO Y EMOCIONES ----------
    { id: 'estado_animo', label: 'Estado de ánimo', icon: '😊', group: 'animo', type: 'scale', numeric: true,
      scaleLabels: ['Muy bajo', 'Bajo', 'Neutro', 'Bueno', 'Muy bueno'] },
    { id: 'emociones', label: 'Emociones', icon: '🎭', group: 'animo', type: 'multi', numeric: false,
      options: ['Alegría', 'Tristeza', 'Miedo', 'Enojo', 'Sorpresa', 'Asco', 'Calma', 'Culpa', 'Vergüenza',
        'Esperanza', 'Ternura', 'Nostalgia', 'Orgullo', 'Frustración', 'Amor'] },
    { id: 'ansiedad', label: 'Ansiedad', icon: '🌪️', group: 'animo', type: 'scale', numeric: true,
      scaleLabels: ['Nada', 'Leve', 'Moderada', 'Alta', 'Muy alta'] },
    { id: 'panico', label: 'Ataques de pánico', icon: '⚡', group: 'animo', type: 'number', numeric: true, unit: 'episodios' },
    { id: 'estres', label: 'Estrés', icon: '🔥', group: 'animo', type: 'scale', numeric: true,
      scaleLabels: ['Nada', 'Leve', 'Moderado', 'Alto', 'Muy alto'] },
    { id: 'energia', label: 'Energía', icon: '🔋', group: 'animo', type: 'scale', numeric: true,
      scaleLabels: ['Agotada/o', 'Baja', 'Media', 'Buena', 'Plena'] },

    // ---------- CUERPO Y SALUD FÍSICA ----------
    { id: 'sueno_horas', label: 'Horas de sueño', icon: '😴', group: 'cuerpo', type: 'number', numeric: true, unit: 'horas' },
    { id: 'sueno_calidad', label: 'Calidad del sueño', icon: '🌙', group: 'cuerpo', type: 'scale', numeric: true,
      scaleLabels: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Muy buena'] },
    { id: 'suenos', label: 'Sueños (oníricos)', icon: '💭', group: 'cuerpo', type: 'text', numeric: false },
    { id: 'migrana', label: 'Migrañas', icon: '🤕', group: 'cuerpo', type: 'scale', numeric: true,
      scaleLabels: ['Ninguna', 'Leve', 'Moderada', 'Fuerte', 'Muy fuerte'] },
    { id: 'dolor', label: 'Dolor físico', icon: '🩹', group: 'cuerpo', type: 'scale', numeric: true,
      scaleLabels: ['Ninguno', 'Leve', 'Moderado', 'Fuerte', 'Muy fuerte'] },
    { id: 'ciclo', label: 'Ciclo menstrual', icon: '🌸', group: 'cuerpo', type: 'select', numeric: false,
      options: ['No aplica hoy', 'Menstruación', 'Premenstrual', 'Ovulación', 'Otro'] },
    { id: 'ejercicio', label: 'Ejercicio', icon: '🏃‍♀️', group: 'cuerpo', type: 'number', numeric: true, unit: 'minutos' },

    // ---------- HÁBITOS Y CONSUMO ----------
    { id: 'alimentacion', label: 'Alimentación', icon: '🍽️', group: 'habitos', type: 'scale', numeric: true,
      scaleLabels: ['Muy desordenada', 'Desordenada', 'Regular', 'Cuidada', 'Muy cuidada'] },
    { id: 'agua', label: 'Agua', icon: '💧', group: 'habitos', type: 'number', numeric: true, unit: 'vasos' },
    { id: 'cafe', label: 'Café', icon: '☕', group: 'habitos', type: 'number', numeric: true, unit: 'tazas' },
    { id: 'alcohol', label: 'Alcohol', icon: '🍷', group: 'habitos', type: 'number', numeric: true, unit: 'tragos' },
    { id: 'medicacion', label: 'Medicación', icon: '💊', group: 'habitos', type: 'bool', numeric: false },

    // ---------- MENTE Y FOCO ----------
    { id: 'concentracion', label: 'Concentración', icon: '🎯', group: 'mente', type: 'scale', numeric: true,
      scaleLabels: ['Nula', 'Baja', 'Media', 'Buena', 'Excelente'] },
    { id: 'trabajo', label: 'Trabajo / estudio', icon: '💼', group: 'mente', type: 'scale', numeric: true,
      scaleLabels: ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'] },

    // ---------- VIDA DIARIA ----------
    { id: 'relaciones', label: 'Relaciones', icon: '🤝', group: 'vida', type: 'scale', numeric: true,
      scaleLabels: ['Muy tensas', 'Tensas', 'Neutras', 'Buenas', 'Muy buenas'] },

    // ---------- REFLEXIÓN ----------
    { id: 'gratitud', label: 'Gratitud', icon: '🙏', group: 'reflexion', type: 'longtext', numeric: false },
    { id: 'diario_libre', label: 'Diario libre', icon: '📓', group: 'reflexion', type: 'longtext', numeric: false }
  ],

  /**
   * DETAILS — campos ampliados por categoría, usados en la pestaña de
   * detalle de cada categoría dentro del registro diario. Cada campo
   * usa la misma estructura que una categoría (id, label, type, etc.)
   * y se guarda directamente como una clave más del "entry" del día,
   * por eso cada id debe ser único en toda la app.
   * La propiedad "breathing: true" activa el ejercicio de respiración
   * animado dentro de esa pestaña (ver ui.js -> renderCategoriaDetalle).
   */
  DETAILS: {
    ansiedad: {
      breathing: true,
      campos: [
        { id: 'ansiedad_sintomas', label: 'Síntomas físicos', icon: '⚡', type: 'multi',
          options: ['Taquicardia', 'Falta de aire', 'Tensión muscular', 'Náuseas', 'Mareo', 'Sudoración', 'Temblor', 'Nudo en la garganta'] },
        { id: 'ansiedad_desencadenante', label: '¿Qué lo disparó?', icon: '🎯', type: 'text' },
        { id: 'ansiedad_pensamientos', label: 'Pensamientos que aparecieron', icon: '💭', type: 'longtext' },
        { id: 'ansiedad_estrategia', label: '¿Qué usaste para regularte?', icon: '🧰', type: 'multi',
          options: ['Respiración', 'Caminar', 'Hablar con alguien', 'Medicación', 'Distracción', 'Ninguna'] }
      ]
    },
    panico: {
      breathing: true,
      campos: [
        { id: 'panico_sintomas', label: 'Síntomas durante el episodio', icon: '⚡', type: 'multi',
          options: ['Taquicardia', 'Falta de aire', 'Mareo', 'Sudoración', 'Temblor', 'Sensación de muerte inminente', 'Despersonalización'] },
        { id: 'panico_duracion', label: 'Duración aproximada', icon: '⏱️', type: 'number', unit: 'minutos' },
        { id: 'panico_lugar', label: '¿Dónde estabas?', icon: '📍', type: 'text' },
        { id: 'panico_ayuda', label: '¿Recibiste ayuda de alguien?', icon: '🤲', type: 'bool' }
      ]
    },
    migrana: {
      campos: [
        { id: 'migrana_hora_inicio', label: 'Hora en que empezó', icon: '🕐', type: 'text' },
        { id: 'migrana_ubicacion', label: 'Ubicación del dolor', icon: '📍', type: 'select',
          options: ['Un lado', 'Ambos lados', 'Nuca', 'Frente', 'Detrás de los ojos'] },
        { id: 'migrana_aura', label: '¿Hubo aura previa?', icon: '✨', type: 'bool' },
        { id: 'migrana_aura_sintomas', label: 'Síntomas del aura', icon: '👁️', type: 'multi',
          options: ['Destellos de luz', 'Puntos ciegos', 'Hormigueo', 'Dificultad para hablar', 'Visión borrosa'] },
        { id: 'migrana_nausea', label: '¿Náuseas o vómitos?', icon: '🤢', type: 'bool' },
        { id: 'migrana_fotofobia', label: '¿Sensibilidad a la luz?', icon: '💡', type: 'bool' },
        { id: 'migrana_fonofobia', label: '¿Sensibilidad al sonido?', icon: '🔊', type: 'bool' },
        { id: 'migrana_duracion', label: 'Duración total', icon: '⏱️', type: 'number', unit: 'horas' },
        { id: 'migrana_desencadenantes', label: 'Posibles desencadenantes', icon: '🎯', type: 'multi',
          options: ['Estrés', 'Falta de sueño', 'Ayuno', 'Alcohol', 'Cambios hormonales', 'Clima', 'Pantallas', 'Ruido o luz fuerte', 'Alimentos específicos'] },
        { id: 'migrana_relacion_ciclo', label: '¿Coincide con tu ciclo menstrual?', icon: '🌸', type: 'bool' },
        { id: 'migrana_medicacion', label: '¿Tomaste medicación?', icon: '💊', type: 'bool' },
        { id: 'migrana_medicacion_nombre', label: '¿Cuál?', icon: '💊', type: 'text' },
        { id: 'migrana_medicacion_efectividad', label: '¿Qué tan efectiva fue?', icon: '📈', type: 'scale',
          scaleLabels: ['Nada', 'Poco', 'Algo', 'Bastante', 'Totalmente'] },
        { id: 'migrana_impacto', label: 'Impacto en tu día', icon: '📉', type: 'select',
          options: ['Pude seguir con normalidad', 'Tuve que bajar el ritmo', 'Tuve que parar actividades', 'Quedé en cama'] }
      ]
    },
    dolor: {
      campos: [
        { id: 'dolor_zona', label: 'Zona del cuerpo', icon: '📍', type: 'text' },
        { id: 'dolor_tipo', label: 'Tipo de dolor', icon: '🩹', type: 'select',
          options: ['Punzante', 'Sordo', 'Quemante', 'Opresivo', 'Pulsátil'] },
        { id: 'dolor_duracion', label: 'Duración', icon: '⏱️', type: 'number', unit: 'horas' }
      ]
    },
    sueno_calidad: {
      campos: [
        { id: 'sueno_despertares', label: 'Veces que te despertaste', icon: '🌙', type: 'number' },
        { id: 'sueno_siesta', label: '¿Hiciste siesta?', icon: '😴', type: 'bool' },
        { id: 'sueno_notas', label: 'Notas sobre el descanso', icon: '📝', type: 'longtext' }
      ]
    },
    ciclo: {
      campos: [
        { id: 'ciclo_fecha_inicio', label: 'Fecha de inicio del período (si empezó hoy)', icon: '🗓️', type: 'date' },
        { id: 'ciclo_duracion_dias', label: 'Duración habitual del período', icon: '📆', type: 'number', unit: 'días' },
        { id: 'ciclo_flujo', label: 'Flujo', icon: '🌸', type: 'select', options: ['Leve', 'Moderado', 'Abundante'] },
        { id: 'ciclo_sintomas', label: 'Síntomas', icon: '⚡', type: 'multi',
          options: ['Cólicos', 'Dolor de espalda', 'Hinchazón', 'Dolor de cabeza', 'Cambios de ánimo', 'Sensibilidad'] }
      ]
    },
    medicacion: {
      campos: [
        { id: 'medicacion_detalle', label: '¿Qué medicación?', icon: '💊', type: 'text' },
        { id: 'medicacion_efectos', label: 'Efectos notados', icon: '📝', type: 'longtext' }
      ]
    },
    ejercicio: {
      campos: [
        { id: 'ejercicio_tipo', label: 'Tipo de actividad', icon: '🏃‍♀️', type: 'select',
          options: ['Caminata', 'Cardio', 'Fuerza', 'Yoga', 'Otro'] },
        { id: 'ejercicio_intensidad', label: 'Intensidad', icon: '🔥', type: 'scale',
          scaleLabels: ['Muy suave', 'Suave', 'Moderada', 'Intensa', 'Muy intensa'] }
      ]
    },
    estres: {
      campos: [
        { id: 'estres_fuente', label: '¿De dónde vino?', icon: '🎯', type: 'text' },
        { id: 'estres_sintomas', label: 'Cómo se manifestó', icon: '⚡', type: 'multi',
          options: ['Tensión muscular', 'Irritabilidad', 'Insomnio', 'Dificultad para concentrarse'] }
      ]
    },
    energia: {
      campos: [
        { id: 'energia_momento', label: '¿En qué momento bajó más?', icon: '🕐', type: 'select',
          options: ['Mañana', 'Tarde', 'Noche', 'Todo el día'] }
      ]
    },
    alimentacion: {
      campos: [
        { id: 'alimentacion_comidas', label: 'Comidas realizadas', icon: '🍽️', type: 'number' },
        { id: 'alimentacion_notas', label: 'Notas', icon: '📝', type: 'longtext' }
      ]
    },
    concentracion: { campos: [{ id: 'concentracion_notas', label: 'Notas', icon: '📝', type: 'longtext' }] },
    trabajo: { campos: [{ id: 'trabajo_notas', label: 'Notas', icon: '📝', type: 'longtext' }] },
    relaciones: { campos: [{ id: 'relaciones_notas', label: 'Con quién / qué pasó', icon: '📝', type: 'longtext' }] },
    estado_animo: { campos: [{ id: 'animo_detonante', label: '¿Qué influyó hoy?', icon: '🎯', type: 'text' }] }
  },

  /** Ítems por defecto del checklist de autocuidado (editable por el usuario). */
  DEFAULT_CHECKLIST: [
    'Tomé mi medicación',
    'Comí al menos 3 veces',
    'Tomé agua suficiente',
    'Salí a tomar aire',
    'Me moví / hice ejercicio',
    'Hablé con alguien de confianza',
    'Tuve un momento de descanso real',
    'Practiqué algo de autocuidado'
  ],

  /** Avatares disponibles para el perfil (emoji, sin imágenes externas). */
  AVATARS: ['🌷', '🌿', '🌙', '🌸', '🕊️', '🦋', '🌊', '🌻', '⭐', '🍃'],

  /** Pronombres sugeridos (el usuario puede escribir otros). */
  PRONOUNS: ['ella/la', 'él/lo', 'elle/le', 'prefiero no decir', 'otro'],

  /** Frases cálidas de bienvenida, rotan según el momento del día. */
  GREETINGS: {
    manana: ['Buenos días', 'Que tengas una mañana amable', 'Un nuevo día para vos'],
    tarde: ['Buenas tardes', 'Espero que tu día vaya con calma', 'Un momento para vos'],
    noche: ['Buenas noches', 'Es hora de mirar hacia adentro', 'Gracias por llegar hasta acá hoy']
  }
};

// Congelamos el catálogo para evitar mutaciones accidentales desde otros módulos.
Object.freeze(REFUGIO_DATA.CATEGORIES);
Object.freeze(REFUGIO_DATA.GROUPS);
Object.freeze(REFUGIO_DATA.DETAILS);