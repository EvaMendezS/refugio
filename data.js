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

  /** Paleta de la app (se refleja también en styles.css como variables). */
  PALETTE: {
    rosa: '#F6D9DE',
    rosaFuerte: '#E8A6B4',
    salvia: '#B7C9B7',
    salviaFuerte: '#8FA98C',
    blanco: '#FFFFFF',
    gris: '#F4F3F1',
    grisTexto: '#6B6B6B',
    texto: '#3A3A3A'
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