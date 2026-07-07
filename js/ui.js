/**
 * REFUGIO — js/ui.js
 * ------------------------------------------------------------------
 * Renderizado de todas las vistas de la aplicación. Trabaja siempre
 * sobre el contenedor #app-view y usa Storage/Analytics como única
 * fuente de datos. No hay routing complejo: app.js decide qué vista
 * pintar y llama a la función correspondiente de este módulo.
 * ------------------------------------------------------------------
 */

'use strict';

const UI = (() => {

  const view = () => document.getElementById('app-view');

  /** Escapa HTML básico para evitar inyección al mostrar texto libre del usuario. */
  function esc(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // corrige a hora local
    return d.toISOString().slice(0, 10);
  }

  function formatFechaLarga(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatFechaCorta(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  /** Muestra una notificación breve tipo "toast" en la esquina de la pantalla. */
  function toast(mensaje) {
    let cont = document.getElementById('toast-container');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'toast-container';
      document.body.appendChild(cont);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = mensaje;
    cont.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--visible'));
    setTimeout(() => {
      el.classList.remove('toast--visible');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function greeting() {
    const h = new Date().getHours();
    let franja = 'manana';
    if (h >= 12 && h < 19) franja = 'tarde';
    else if (h >= 19 || h < 6) franja = 'noche';
    const opciones = REFUGIO_DATA.GREETINGS[franja];
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  // ==========================================================
  // ONBOARDING
  // ==========================================================

  function renderOnboarding(paso = 1) {
    const c = REFUGIO_CONTENT.ONBOARDING;
    let contenido = '';

    if (paso === 1) {
      contenido = `
        <div class="onb-icon">🌿</div>
        <h1>${c.paso1_titulo}</h1>
        <p>${c.paso1_texto}</p>
        <button class="btn btn--primary" data-action="onb-next" data-paso="2">${c.boton_continuar}</button>`;
    } else if (paso === 2) {
      const avatares = REFUGIO_DATA.AVATARS
        .map((a, i) => `<button type="button" class="avatar-opt" data-avatar="${a}" ${i === 0 ? 'aria-pressed="true"' : ''}>${a}</button>`)
        .join('');
      const pronombres = REFUGIO_DATA.PRONOUNS
        .map((p) => `<option value="${p}">${p}</option>`).join('');

      contenido = `
        <h1>${c.paso2_titulo}</h1>
        <p>${c.paso2_texto}</p>
        <form id="form-perfil-onb" class="form-onb">
          <label>Tu nombre
            <input type="text" name="nombre" required maxlength="40" placeholder="¿Cómo te llamamos?">
          </label>
          <label>Elegí un avatar
            <div class="avatar-grid" id="avatar-grid">${avatares}</div>
          </label>
          <label>Pronombres
            <select name="pronombres">${pronombres}</select>
          </label>
          <input type="hidden" name="avatar" value="${REFUGIO_DATA.AVATARS[0]}">
          <button type="submit" class="btn btn--primary">${c.boton_continuar}</button>
        </form>`;
    } else if (paso === 3) {
      contenido = `
        <div class="onb-icon">💗</div>
        <h1>${c.paso3_titulo}</h1>
        <p>${c.paso3_texto}</p>
        <div class="disclaimer-box">${REFUGIO_CONTENT.DISCLAIMER_LARGO}</div>
        <button class="btn btn--primary" data-action="onb-finish">${c.boton_empezar}</button>`;
    }

    view().innerHTML = `<section class="onboarding">${contenido}</section>`;

    if (paso === 2) {
      const grid = document.getElementById('avatar-grid');
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.avatar-opt');
        if (!btn) return;
        grid.querySelectorAll('.avatar-opt').forEach((b) => b.removeAttribute('aria-pressed'));
        btn.setAttribute('aria-pressed', 'true');
        document.querySelector('input[name="avatar"]').value = btn.dataset.avatar;
      });
    }
  }

  // ==========================================================
  // PERFIL
  // ==========================================================

  function renderPerfil(profile) {
    const avatares = REFUGIO_DATA.AVATARS
      .map((a) => `<button type="button" class="avatar-opt" data-avatar="${a}" ${a === profile.avatar ? 'aria-pressed="true"' : ''}>${a}</button>`)
      .join('');
    const pronombres = REFUGIO_DATA.PRONOUNS
      .map((p) => `<option value="${p}" ${p === profile.pronombres ? 'selected' : ''}>${p}</option>`).join('');

    view().innerHTML = `
      <section class="vista-perfil">
        <h1>Tu perfil</h1>
        <p class="text-muted">Esta información es solo tuya y queda guardada en este dispositivo.</p>
        <form id="form-perfil">
          <label>Nombre
            <input type="text" name="nombre" required maxlength="40" value="${esc(profile.nombre)}">
          </label>
          <label>Avatar
            <div class="avatar-grid" id="avatar-grid">${avatares}</div>
          </label>
          <label>Pronombres
            <select name="pronombres">${pronombres}</select>
          </label>
          <input type="hidden" name="avatar" value="${esc(profile.avatar)}">
          <button type="submit" class="btn btn--primary">Guardar cambios</button>
        </form>

        <hr>
        <h2>Datos y privacidad</h2>
        <p class="text-muted">Todos tus datos viven únicamente en este navegador. Podés respaldarlos o restaurarlos cuando quieras.</p>
        <div class="acciones-fila">
          <button class="btn btn--secondary" data-action="export-backup">⬇️ Descargar backup</button>
          <label class="btn btn--secondary" for="input-import">⬆️ Importar backup</label>
          <input type="file" id="input-import" accept="application/json" style="display:none">
        </div>
        <button class="btn btn--danger" data-action="wipe-all">🗑️ Borrar todos mis datos</button>

        <hr>
        <h2>Apariencia</h2>
        <label class="switch-row">
          <span>Modo oscuro</span>
          <input type="checkbox" id="toggle-dark" ${Storage.getSettings().modoOscuro ? 'checked' : ''}>
        </label>

        <div class="disclaimer-box">${REFUGIO_CONTENT.DISCLAIMER_CORTO}</div>
      </section>`;

    const grid = document.getElementById('avatar-grid');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.avatar-opt');
      if (!btn) return;
      grid.querySelectorAll('.avatar-opt').forEach((b) => b.removeAttribute('aria-pressed'));
      btn.setAttribute('aria-pressed', 'true');
      document.querySelector('input[name="avatar"]').value = btn.dataset.avatar;
    });
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  function renderDashboard(profile) {
    const entries = Storage.getEntriesSorted();
    const hoy = todayISO();
    const registroHoy = Storage.getEntry(hoy);
    const racha = Analytics.currentStreak(entries);
    const frase = REFUGIO_CONTENT.FRASES_DASHBOARD[Math.floor(Math.random() * REFUGIO_CONTENT.FRASES_DASHBOARD.length)];

    const desde = new Date();
    desde.setDate(desde.getDate() - 13);
    const ultimos14 = entries.filter((e) => new Date(e.fecha) >= desde);
    const serieAnimo = Analytics.seriesFor(ultimos14, 'estado_animo');

    const resumen = Analytics.summary(entries, 7).filter((r) => r.registros > 0).slice(0, 4);

    view().innerHTML = `
      <section class="dashboard">
        <header class="dash-header">
          <div>
            <p class="dash-greeting">${greeting()}, ${esc(profile.nombre)} ${esc(profile.avatar)}</p>
            <p class="dash-frase">${frase}</p>
          </div>
        </header>

        <div class="dash-cards">
          <div class="card card--accent-rosa">
            <span class="card-label">Racha de registros</span>
            <span class="card-value">${racha} ${racha === 1 ? 'día' : 'días'}</span>
          </div>
          <div class="card card--accent-salvia">
            <span class="card-label">Registro de hoy</span>
            <span class="card-value">${registroHoy ? '✓ Completo' : 'Pendiente'}</span>
          </div>
        </div>

        <button class="btn btn--primary btn--full" data-action="ir-registro">
          ${registroHoy ? '✏️ Editar el registro de hoy' : '📝 Registrar cómo estoy hoy'}
        </button>

        ${serieAnimo.length > 1 ? `
        <div class="panel">
          <h3>Ánimo — últimos 14 días</h3>
          <canvas id="chart-animo-dash" class="chart chart--small"></canvas>
        </div>` : ''}

        ${resumen.length ? `
        <div class="panel">
          <h3>Tu semana en números</h3>
          <ul class="lista-resumen">
            ${resumen.map(r => `<li><span>${r.icon} ${r.label}</span><strong>${r.promedio.toFixed(1)}</strong></li>`).join('')}
          </ul>
        </div>` : `<div class="empty-state">${REFUGIO_CONTENT.EMPTY_STATES.timeline}</div>`}

        <div class="disclaimer-box">${REFUGIO_CONTENT.DISCLAIMER_CORTO}</div>
      </section>`;

    if (serieAnimo.length > 1) {
      Analytics.drawLineChart(document.getElementById('chart-animo-dash'), serieAnimo, { min: 0, max: 4 });
    }
  }

  // ==========================================================
  // REGISTRO DIARIO
  // ==========================================================

  function _campoHTML(cat, valorActual) {
    const val = valorActual !== undefined ? valorActual : '';
    switch (cat.type) {
      case 'scale': {
        const opts = (cat.scaleLabels || []).map((lbl, i) => `
          <label class="scale-opt">
            <input type="radio" name="${cat.id}" value="${i}" ${String(val) === String(i) ? 'checked' : ''}>
            <span>${i + 1}<small>${lbl}</small></span>
          </label>`).join('');
        return `<div class="scale-group">${opts}</div>`;
      }
      case 'bool':
        return `
          <div class="bool-group">
            <label class="bool-opt"><input type="radio" name="${cat.id}" value="1" ${val === true || val === '1' ? 'checked' : ''}><span>Sí</span></label>
            <label class="bool-opt"><input type="radio" name="${cat.id}" value="0" ${val === false || val === '0' ? 'checked' : ''}><span>No</span></label>
          </div>`;
      case 'number':
        return `<input type="number" min="0" step="0.5" name="${cat.id}" value="${esc(val)}" placeholder="${cat.unit || ''}">`;
      case 'text':
        return `<input type="text" name="${cat.id}" value="${esc(val)}" maxlength="200">`;
      case 'longtext':
        return `<textarea name="${cat.id}" rows="3" maxlength="2000">${esc(val)}</textarea>`;
      case 'select': {
        const opts = cat.options.map((o) => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
        return `<select name="${cat.id}"><option value="">—</option>${opts}</select>`;
      }
      case 'multi': {
        const seleccion = Array.isArray(val) ? val : [];
        const opts = cat.options.map((o) => `
          <label class="chip">
            <input type="checkbox" name="${cat.id}" value="${o}" ${seleccion.includes(o) ? 'checked' : ''}>
            <span>${o}</span>
          </label>`).join('');
        return `<div class="chip-group">${opts}</div>`;
      }
      default:
        return `<input type="text" name="${cat.id}" value="${esc(val)}">`;
    }
  }

  function renderRegistro(dateStr) {
    const entry = Storage.getEntry(dateStr) || {};
    const settings = Storage.getSettings();
    const checklistGuardado = entry.checklist || [];

    const grupos = REFUGIO_DATA.GROUPS.map((grupo) => {
      const cats = REFUGIO_DATA.CATEGORIES.filter((c) => c.group === grupo.id);
      const campos = cats.map((cat) => `
        <div class="campo campo--${cat.type}">
          <label class="campo-label">${cat.icon} ${cat.label}</label>
          ${_campoHTML(cat, entry[cat.id])}
        </div>`).join('');
      return `
        <fieldset class="grupo-registro">
          <legend>${grupo.icon} ${grupo.label}</legend>
          ${campos}
        </fieldset>`;
    }).join('');

    const checklistHTML = settings.checklistTemplate.map((item) => `
      <label class="checklist-item">
        <input type="checkbox" name="checklist" value="${esc(item)}" ${checklistGuardado.includes(item) ? 'checked' : ''}>
        <span>${esc(item)}</span>
      </label>`).join('');

    view().innerHTML = `
      <section class="vista-registro">
        <div class="registro-header">
          <button class="btn-icon" data-action="cambiar-fecha" data-dir="-1" aria-label="Día anterior">‹</button>
          <div>
            <h1>Registro diario</h1>
            <p class="text-muted">${formatFechaLarga(dateStr)}</p>
          </div>
          <button class="btn-icon" data-action="cambiar-fecha" data-dir="1" aria-label="Día siguiente" ${dateStr >= todayISO() ? 'disabled' : ''}>›</button>
        </div>

        <form id="form-registro" data-fecha="${dateStr}">
          ${grupos}

          <fieldset class="grupo-registro">
            <legend>✅ Checklist de autocuidado</legend>
            <div class="checklist-grid">${checklistHTML}</div>
          </fieldset>

          <button type="submit" class="btn btn--primary btn--full">Guardar registro</button>
          ${entry.fecha ? `<button type="button" class="btn btn--danger btn--full" data-action="borrar-registro" data-fecha="${dateStr}">Borrar este registro</button>` : ''}
        </form>
      </section>`;
  }

  function leerFormRegistro(form) {
    const fd = new FormData(form);
    const data = {};

    REFUGIO_DATA.CATEGORIES.forEach((cat) => {
      if (cat.type === 'multi') {
        data[cat.id] = fd.getAll(cat.id);
      } else if (cat.type === 'bool') {
        const v = fd.get(cat.id);
        data[cat.id] = v === null ? undefined : v === '1';
      } else {
        const v = fd.get(cat.id);
        data[cat.id] = v === '' || v === null ? undefined : v;
      }
    });

    data.checklist = fd.getAll('checklist');
    return data;
  }

  // ==========================================================
  // TIMELINE
  // ==========================================================

  function renderTimeline() {
    const entries = Storage.getEntriesSorted().reverse();

    if (!entries.length) {
      view().innerHTML = `
        <section class="vista-timeline">
          <h1>Timeline</h1>
          <div class="empty-state">${REFUGIO_CONTENT.EMPTY_STATES.timeline}</div>
        </section>`;
      return;
    }

    const scaleEmojis = ['😞', '😕', '😐', '🙂', '😄'];

    const items = entries.map((e) => {
      const animoIdx = e.estado_animo !== undefined ? Number(e.estado_animo) : null;
      const emociones = Array.isArray(e.emociones) ? e.emociones.slice(0, 3).join(', ') : '';
      return `
        <article class="timeline-card" data-action="ver-dia" data-fecha="${e.fecha}">
          <div class="timeline-emoji">${animoIdx !== null ? scaleEmojis[animoIdx] : '📅'}</div>
          <div class="timeline-info">
            <strong>${formatFechaCorta(e.fecha)}</strong>
            <span class="text-muted">${emociones || 'Sin emociones registradas'}</span>
          </div>
          <span class="timeline-arrow">›</span>
        </article>`;
    }).join('');

    view().innerHTML = `
      <section class="vista-timeline">
        <h1>Timeline</h1>
        <p class="text-muted">Todos tus registros, del más reciente al más antiguo.</p>
        <div class="timeline-list">${items}</div>
      </section>`;
  }

  // ==========================================================
  // CALENDARIO EMOCIONAL
  // ==========================================================

  function renderCalendario(year, month) {
    const entries = Storage.getAllEntries();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const nombreMes = primerDia.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const scaleColors = ['#D98A98', '#E8B4B4', '#E6D6B8', '#C7D9B7', '#8FA98C'];

    let celdas = '';
    const offset = (primerDia.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) celdas += `<div class="cal-celda cal-celda--vacia"></div>`;

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const entry = entries[iso];
      const animoIdx = entry && entry.estado_animo !== undefined ? Number(entry.estado_animo) : null;
      const color = animoIdx !== null ? scaleColors[animoIdx] : 'transparent';
      const esHoy = iso === todayISO();
      celdas += `
        <button type="button" class="cal-celda ${esHoy ? 'cal-celda--hoy' : ''}" data-action="ver-dia" data-fecha="${iso}"
          style="--color-animo:${color}">
          <span>${dia}</span>
        </button>`;
    }

    const totalRegistrosMes = Object.keys(entries).filter(f => f.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;

    view().innerHTML = `
      <section class="vista-calendario">
        <div class="cal-header">
          <button class="btn-icon" data-action="cal-mes" data-dir="-1">‹</button>
          <h1>${nombreMes}</h1>
          <button class="btn-icon" data-action="cal-mes" data-dir="1">›</button>
        </div>
        <div class="cal-dias-semana">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div class="cal-grid">${celdas}</div>
        <div class="cal-legend">
          ${scaleColors.map((c, i) => `<span class="cal-legend-item"><i style="background:${c}"></i> ${i + 1}</span>`).join('')}
        </div>
        ${totalRegistrosMes === 0 ? `<div class="empty-state">${REFUGIO_CONTENT.EMPTY_STATES.calendario}</div>` : ''}
      </section>`;
  }

  // ==========================================================
  // ESTADÍSTICAS Y CORRELACIONES
  // ==========================================================

  function renderEstadisticas(categoriaSeleccionada) {
    const entries = Storage.getEntriesSorted();

    if (entries.length < 3) {
      view().innerHTML = `
        <section class="vista-stats">
          <h1>Estadísticas</h1>
          <div class="empty-state">${REFUGIO_CONTENT.EMPTY_STATES.estadisticas}</div>
        </section>`;
      return;
    }

    const numericCats = Analytics.numericCategories();
    const catId = categoriaSeleccionada || 'estado_animo';
    const catActual = numericCats.find((c) => c.id === catId) || numericCats[0];
    const serie = Analytics.seriesFor(entries, catActual.id);

    const opcionesSelect = numericCats.map((c) =>
      `<option value="${c.id}" ${c.id === catActual.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('');

    const resumen30 = Analytics.summary(entries, 30).filter((r) => r.registros > 0);
    const correlaciones = Analytics.correlationMatrix(entries, 5);

    const filasCorrelacion = correlaciones.length ? correlaciones.slice(0, 12).map((c) => `
      <tr>
        <td>${c.a} ↔ ${c.b}</td>
        <td class="${c.r >= 0 ? 'r-pos' : 'r-neg'}">${c.r}</td>
        <td>${c.n} días</td>
      </tr>`).join('') : '';

    view().innerHTML = `
      <section class="vista-stats">
        <h1>Estadísticas</h1>

        <div class="panel">
          <div class="panel-header-row">
            <h3>Evolución</h3>
            <select id="select-categoria-stat">${opcionesSelect}</select>
          </div>
          ${serie.length > 1
            ? `<canvas id="chart-evolucion" class="chart"></canvas>`
            : `<p class="text-muted">Todavía no hay suficientes registros de esta categoría.</p>`}
        </div>

        <div class="panel">
          <h3>Promedios últimos 30 días</h3>
          <canvas id="chart-barras" class="chart"></canvas>
        </div>

        <div class="panel">
          <h3>Correlaciones entre variables</h3>
          ${correlaciones.length ? `
            <table class="tabla-correlaciones">
              <thead><tr><th>Variables</th><th>r</th><th>Muestra</th></tr></thead>
              <tbody>${filasCorrelacion}</tbody>
            </table>
            <p class="text-muted texto-pequeno">Recordá: una correlación no implica causalidad. Estos son solo patrones estadísticos entre tus propios registros.</p>
          ` : `<div class="empty-state">${REFUGIO_CONTENT.EMPTY_STATES.correlaciones}</div>`}
        </div>

        <div class="panel">
          <h3>📄 Exportar informe para profesionales</h3>
          <p class="text-muted">Generá un PDF con tu resumen y registros para compartir con quien acompañe tu proceso.</p>
          <div class="acciones-fila">
            <label>Desde <input type="date" id="pdf-desde"></label>
            <label>Hasta <input type="date" id="pdf-hasta"></label>
          </div>
          <button class="btn btn--primary" data-action="exportar-pdf">Generar PDF</button>
        </div>
      </section>`;

    if (serie.length > 1) {
      Analytics.drawLineChart(document.getElementById('chart-evolucion'), serie, { min: 0, max: catActual.type === 'scale' ? 4 : undefined });
    }
    if (resumen30.length) {
      Analytics.drawBarChart(document.getElementById('chart-barras'),
        resumen30.map((r) => ({ label: r.icon, valor: r.promedio })));
    }

    const hastaInput = document.getElementById('pdf-hasta');
    const desdeInput = document.getElementById('pdf-desde');
    if (hastaInput && desdeInput) {
      const hoy = new Date();
      const haceUnMes = new Date();
      haceUnMes.setDate(hoy.getDate() - 30);
      hastaInput.value = todayISO();
      desdeInput.value = haceUnMes.toISOString().slice(0, 10);
    }
  }

  return {
    esc, todayISO, formatFechaLarga, formatFechaCorta, toast, greeting,
    renderOnboarding, renderPerfil, renderDashboard,
    renderRegistro, leerFormRegistro,
    renderTimeline, renderCalendario, renderEstadisticas
  };
})();