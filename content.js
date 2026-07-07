/**
 * REFUGIO — content.js
 * ------------------------------------------------------------------
 * Todos los textos "humanos" de la aplicación viven acá: mensajes de
 * bienvenida, aclaraciones éticas, textos de ayuda, mensajes vacíos,
 * copys de botones largos, etc.
 * Mantener el contenido separado de la lógica (ui.js) permite ajustar
 * el tono de la app sin tocar código funcional.
 * ------------------------------------------------------------------
 */

'use strict';

const REFUGIO_CONTENT = {

  APP_NAME: 'Refugio',

  TAGLINE: 'Un espacio propio para registrar cómo estás.',

  /** Disclaimer ético — se muestra en onboarding, estadísticas y PDF. */
  DISCLAIMER_CORTO:
    'Refugio no diagnostica ni reemplaza la atención profesional. Es un espacio para registrar y observar patrones propios.',

  DISCLAIMER_LARGO:
    'Esta aplicación fue pensada como un espacio de acompañamiento para registrar tu día a día: tu ánimo, tu cuerpo, tus hábitos y tus pensamientos. ' +
    'No emite diagnósticos ni sugiere tratamientos. Las correlaciones que vas a ver en la sección de Estadísticas muestran relaciones entre variables ' +
    'que registraste vos misma/o, pero una correlación NO implica causalidad: que dos cosas varíen juntas no significa que una provoque la otra. ' +
    'Si algo de lo que sentís te preocupa, te animamos a compartir esta información con un profesional de la salud mental o física de tu confianza. ' +
    'Este espacio quiere ser un puente hacia ese acompañamiento, nunca un reemplazo.',

  DISCLAIMER_PDF:
    'Este informe fue generado por la persona usuaria a partir de sus propios registros en Refugio. Los datos son subjetivos y autoinformados. ' +
    'Las correlaciones mostradas son estadísticas descriptivas simples y no implican relación causal. Este documento no constituye un diagnóstico.',

  /** Textos de onboarding (primera vez que se abre la app). */
  ONBOARDING: {
    paso1_titulo: 'Bienvenida/o a Refugio',
    paso1_texto: 'Este es un espacio privado, cálido y solo tuyo. Todo lo que registres queda guardado únicamente en este dispositivo.',
    paso2_titulo: 'Contame un poco de vos',
    paso2_texto: 'Con tu nombre, un avatar y tus pronombres, Refugio va a poder acompañarte de forma más cercana.',
    paso3_titulo: 'Antes de empezar',
    paso3_texto: 'Refugio no diagnostica ni reemplaza a un profesional. Es un espacio para observar patrones propios con amabilidad.',
    boton_continuar: 'Continuar',
    boton_empezar: 'Entrar a mi refugio'
  },

  /** Mensajes de estados vacíos (empty states) en distintas vistas. */
  EMPTY_STATES: {
    timeline: 'Todavía no hay registros. Cuando anotes tu primer día, va a aparecer acá.',
    calendario: 'Este mes todavía no tiene registros.',
    estadisticas: 'Necesitamos al menos algunos días registrados para mostrarte patrones. Segui registrando con calma.',
    correlaciones: 'Cuantos más días registres, más clara va a ser esta sección. De momento no hay suficiente información.'
  },

  /** Copys de confirmación / feedback de acciones. */
  FEEDBACK: {
    guardado: 'Tu registro de hoy se guardó ✓',
    actualizado: 'Cambios guardados ✓',
    backup_exportado: 'Copia de seguridad descargada ✓',
    backup_importado: 'Tus datos se restauraron correctamente ✓',
    pdf_generado: 'Tu informe en PDF está listo ✓',
    error_generico: 'Algo no salió como esperábamos. Podés intentar de nuevo.',
    confirmar_borrado: '¿Segura/o que querés borrar este registro? Esta acción no se puede deshacer.',
    confirmar_import: 'Importar un backup reemplazará los datos actuales de este dispositivo. ¿Querés continuar?'
  },

  /** Frases cortas de aliento, se muestran de forma aleatoria en el dashboard. */
  FRASES_DASHBOARD: [
    'Registrar tu día ya es un acto de cuidado.',
    'No hay una forma correcta de sentirse hoy.',
    'Cada pequeño patrón que descubrís es información valiosa.',
    'Ir despacio también es avanzar.',
    'Tu bienestar no se mide en comparación con nadie más.'
  ],

  NAV: {
    dashboard: 'Inicio',
    registro: 'Registro diario',
    timeline: 'Timeline',
    calendario: 'Calendario',
    estadisticas: 'Estadísticas',
    perfil: 'Perfil',
    ajustes: 'Ajustes'
  }
};