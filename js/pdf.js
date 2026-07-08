/**
 * REFUGIO — js/pdf.js
 * ------------------------------------------------------------------
 * Exportación de un informe a PDF para compartir con profesionales.
 *
 * Decisión de arquitectura: para que Refugio funcione 100% offline y
 * sea compatible con GitHub Pages sin depender de CDNs externas
 * (que romperían el uso sin conexión), la exportación a PDF se
 * resuelve generando un documento HTML imprimible y disparando
 * window.print(), donde el usuario elige "Guardar como PDF" desde el
 * diálogo nativo del navegador. Esto es 100% estándar, no requiere
 * librerías (jsPDF, etc.) y funciona sin internet.
 * ------------------------------------------------------------------
 */

'use strict';

const PDFExport = (() => {

  /** Construye el HTML del informe a partir del rango de fechas elegido. */
  function _buildReportHTML(entries, profile, rango) {
    const nombre = (profile && profile.nombre) || 'Persona usuaria';
    const desde = rango.desde, hasta = rango.hasta;
    const resumen = Analytics.summary(entries, rango.dias || 30);
    const correlaciones = Analytics.correlationMatrix(entries, 5).slice(0, 8);

    const filasResumen = resumen
      .filter((r) => r.registros > 0)
      .map((r) => `
        <tr>
          <td>${r.icon} ${r.label}</td>
          <td>${r.promedio !== null ? r.promedio.toFixed(1) : '—'}</td>
          <td>${r.registros}</td>
        </tr>`).join('');

    const filasCorrelaciones = correlaciones.length
      ? correlaciones.map((c) => `
        <tr>
          <td>${c.a} ↔ ${c.b}</td>
          <td>${c.r}</td>
          <td>${c.n}</td>
          <td>${Analytics.interpretaCorrelacion(c.r)}</td>
        </tr>`).join('')
      : `<tr><td colspan="4">Aún no hay suficientes datos en común para calcular correlaciones.</td></tr>`;

    // Construye un mapa id -> definición de campo, incluyendo tanto las
    // categorías principales como los campos ampliados de cada pestaña,
    // para poder listar TODO lo registrado ese día en el informe.
    const todosLosCampos = REFUGIO_DATA.CATEGORIES.slice();
    Object.keys(REFUGIO_DATA.DETAILS).forEach((catId) => {
      const detalle = REFUGIO_DATA.DETAILS[catId];
      (detalle.campos || []).forEach((campo) => todosLosCampos.push(campo));
    });

    const filasEntradas = entries
      .filter(e => e.fecha >= desde && e.fecha <= hasta)
      .map((e) => {
        const campos = todosLosCampos
          .filter((c) => e[c.id] !== undefined && e[c.id] !== null && e[c.id] !== '' &&
            c.type !== 'longtext' &&
            !(Array.isArray(e[c.id]) && e[c.id].length === 0))
          .map((c) => `<strong>${c.icon || ''} ${c.label}:</strong> ${Array.isArray(e[c.id]) ? e[c.id].join(', ') : (e[c.id] === true ? 'Sí' : e[c.id] === false ? 'No' : e[c.id])}`)
          .join(' &nbsp;•&nbsp; ');
        const camposLibres = todosLosCampos.filter((c) => c.type === 'longtext' && e[c.id]);
        const libre = camposLibres
          .map((c) => `<p class="rep-libre"><em>${c.label}:</em> ${e[c.id]}</p>`)
          .join('');
        return `
          <div class="rep-dia">
            <h4>${e.fecha}</h4>
            <p>${campos || 'Sin datos cuantitativos.'}</p>
            ${libre}
          </div>`;
      }).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe Refugio — ${nombre}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #221F1D; padding: 32px; max-width: 800px; margin: auto; }
  h1 { color: #B81C74; margin-bottom: 4px; }
  h2 { color: #4F9E2E; border-bottom: 2px solid #E4E0DA; padding-bottom: 4px; margin-top: 32px; }
  .subt { color: #726C66; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
  th { color: #726C66; font-weight: 600; }
  .disclaimer { background: #F4F2F0; border-left: 4px solid #4F9E2E; padding: 12px 16px; font-size: 12px; margin-top: 24px; border-radius: 6px; }
  .rep-dia { border-bottom: 1px solid #eee; padding: 10px 0; font-size: 13px; }
  .rep-dia h4 { margin: 0 0 4px 0; color: #B81C74; }
  .rep-libre { margin: 4px 0; font-style: italic; color: #555; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Informe de Refugio</h1>
  <p class="subt">Preparado para ${nombre} · período ${desde} a ${hasta} · generado ${new Date().toLocaleDateString('es-AR')}</p>

  <div class="disclaimer">${REFUGIO_CONTENT.DISCLAIMER_PDF}</div>

  <h2>Resumen del período</h2>
  <table>
    <thead><tr><th>Categoría</th><th>Promedio</th><th>Días registrados</th></tr></thead>
    <tbody>${filasResumen || '<tr><td colspan="3">Sin datos numéricos en este período.</td></tr>'}</tbody>
  </table>

  <h2>Correlaciones observadas</h2>
  <table>
    <thead><tr><th>Variables</th><th>Coeficiente (r)</th><th>Días en común</th><th>Interpretación</th></tr></thead>
    <tbody>${filasCorrelaciones}</tbody>
  </table>

  <h2>Registros diarios del período</h2>
  ${filasEntradas || '<p>No hay registros en el rango seleccionado.</p>'}

</body>
</html>`;
  }

  /**
   * Abre una ventana nueva con el informe listo para imprimir/guardar como PDF.
   * @param {Array} entries - entradas ya ordenadas (Storage.getEntriesSorted()).
   * @param {Object} profile - perfil actual.
   * @param {Object} rango - { desde: 'YYYY-MM-DD', hasta: 'YYYY-MM-DD', dias }
   */
  function exportar(entries, profile, rango) {
    const html = _buildReportHTML(entries, profile, rango);
    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('Tu navegador bloqueó la ventana emergente. Habilitá pop-ups para exportar el PDF.');
      return false;
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    // Pequeña espera para que el navegador termine de pintar antes de imprimir.
    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 300);
    return true;
  }

  return { exportar };
})();