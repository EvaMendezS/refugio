/**
 * REFUGIO — js/ui.js
 * ------------------------------------------------------------------
 * Renderizado de todas las vistas de la aplicación. Trabaja siempre
 * sobre el contenedor #app-view y usa Storage/Analytics como única
 * fuente de datos. No hay routing complejo: app.js decide qué vista
 * pintar y llama a la función correspondiente de este módulo.
 *
 * MODELO DE REGISTRO DIARIO (actualizado a pestañas):
 * En vez de un formulario largo con todas las categorías juntas, el
 * registro diario ahora es una grilla de "pestañas" (una por
 * categoría). Al tocar una, se abre un panel de detalle con el campo
 * principal de esa categoría + todos los campos ampliados que definí
 * en REFUGIO_DATA.DETAILS (ver data.js). Ansiedad y pánico además
 * muestran un ejercicio de respiración guiada animado.
 * ------------------------------------------------------------------
 */

'use strict';

const UI = (() => {

  const view = () => document.getElementById('app-view');

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
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
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

  /** Porcentaje de categorías con al menos un dato cargado en el entry del día. */
  function _porcentajeCompletado(entry) {
    if (!entry) return 0;
    const total = REFUGIO_DATA.CATEGORIES.length;
    const llenas = REFUGIO_DATA.CATEGORIES.filter((c) => {
      const v = entry[c.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    return Math.round((llenas / total) * 100);
  }

  /** Genera el SVG del anillo de progreso (sin librerías, solo stroke-dasharray). */
  function _anilloProgresoSVG(pct) {
    const r = 26, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return `
      <svg class="progreso-anillo" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--gris-borde)" stroke-width="7"></circle>
        <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--rosa)" stroke-width="7"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
          transform="rotate(-90 32 32)"></circle>
      </svg>`;
  }

  function renderDashboard(profile) {
    const entries = Storage.getEntriesSorted();
    const hoy = todayISO();
    const registroHoy = Storage.getEntry(hoy);
    const racha = Analytics.currentStreak(entries);
    const frase = REFUGIO_CONTENT.FRASES_DASHBOARD[Math.floor(Math.random() * REFUGIO_CONTENT.FRASES_DASHBOARD.length)];
    const pctHoy = _porcentajeCompletado(registroHoy);

    const desde = new Date();
    desde.setDate(desde.getDate() - 13);
    const ultimos14 = entries.filter((e) => new Date(e.fecha) >= desde);
    const serieAnimo = Analytics.seriesFor(ultimos14, 'estado_animo');

    const resumen = Analytics.summary(entries, 7).filter((r) => r.registros > 0).slice(0, 4);

    view().innerHTML = `
      <section class="dashboard">
        <div class="dash-hero">
          <p class="dash-greeting">${greeting()}, ${esc(profile.nombre)} ${esc(profile.avatar)}</p>
          <p class="dash-frase">${frase}</p>
        </div>

        <div class="dash-cards">
          <div class="card card--anillo">
            ${_anilloProgresoSVG(pctHoy)}
            <div>
              <span class="card-label">Hoy completaste</span>
              <div class="progreso-anillo-texto">${pctHoy}%</div>
            </div>
          </div>
          <div class="card card--accent-rosa">
            <span class="card-label">Racha de registros</span>
            <span class="card-value">${racha} ${racha === 1 ? 'día' : 'días'}</span>
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
  // CAMPOS GENÉRICOS (usados tanto en categorías principales
  // como en los campos ampliados de DETAILS)
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
      case 'date':
        return `<input type="date" name="${cat.id}" value="${esc(val)}">`;
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

  /** Une la definición principal de una categoría con sus campos ampliados (DETAILS). */
  function camposDeCategoria(catId) {
    const principal = REFUGIO_DATA.CATEGORIES.find((c) => c.id === catId);
    const detalle = REFUGIO_DATA.DETAILS[catId];
    const extra = (detalle && detalle.campos) || [];
    return { principal, extra, breathing: !!(detalle && detalle.breathing) };
  }

  /** ¿Esta categoría tiene algún dato cargado en el entry del día? */
  function _categoriaCompleta(entry, catId) {
    if (!entry) return false;
    const { principal, extra } = camposDeCategoria(catId);
    const campos = [principal].concat(extra).filter(Boolean);
    return campos.some((c) => {
      const v = entry[c.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  }

  /** Texto corto que resume el valor principal cargado hoy, para la lista. */
  function _previewCategoria(entry, cat) {
    if (!entry) return 'Sin registrar todavía';
    const v = entry[cat.id];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      return 'Sin registrar todavía';
    }
    switch (cat.type) {
      case 'scale': return cat.scaleLabels ? cat.scaleLabels[Number(v)] : v;
      case 'bool': return v === true || v === '1' ? 'Sí' : 'No';
      case 'multi': return v.join(', ');
      case 'number': return `${v}${cat.unit ? ' ' + cat.unit : ''}`;
      case 'longtext': return String(v).slice(0, 48) + (String(v).length > 48 ? '…' : '');
      default: return String(v);
    }
  }

  // ==========================================================
  // REGISTRO DIARIO — LISTA VERTICAL DE CATEGORÍAS
  // ==========================================================

  function renderRegistro(dateStr) {
    const entry = Storage.getEntry(dateStr) || {};
    const settings = Storage.getSettings();
    const checklistGuardado = entry.checklist || [];

    const grupos = REFUGIO_DATA.GROUPS.map((grupo) => {
      const cats = REFUGIO_DATA.CATEGORIES.filter((c) => c.group === grupo.id);
      const filas = cats.map((cat) => {
        const completo = _categoriaCompleta(entry, cat.id);
        return `
          <button type="button" class="cat-row ${completo ? 'cat-row--completo' : ''}" data-action="abrir-categoria" data-cat="${cat.id}">
            ${completo ? '<span class="cat-row-check"></span>' : ''}
            <span class="cat-row-icon">${cat.icon}</span>
            <span class="cat-row-texto">
              <span class="cat-row-label">${cat.label}</span>
              <span class="cat-row-preview">${esc(_previewCategoria(entry, cat))}</span>
            </span>
            <span class="cat-row-arrow">›</span>
          </button>`;
      }).join('');
      return `
        <h2 class="registro-grupo-titulo">${grupo.icon} ${grupo.label}</h2>
        <div class="cat-list">${filas}</div>`;
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

        <p class="text-muted">Tocá una categoría para completar su registro. Las que ya tienen datos hoy se marcan en verde.</p>

        ${grupos}

        <div class="checklist-panel">
          <h3>✅ Checklist de autocuidado</h3>
          <div class="checklist-grid" id="checklist-grid">${checklistHTML}</div>
        </div>
      </section>`;
  }

  // ==========================================================
  // PANEL DE DETALLE DE UNA CATEGORÍA (la "pestaña" abierta)
  // ==========================================================

  function renderCategoriaDetalle(dateStr, catId) {
    const entry = Storage.getEntry(dateStr) || {};
    const { principal, extra, breathing } = camposDeCategoria(catId);
    if (!principal) { renderRegistro(dateStr); return; }

    const campoPrincipalHTML = `
      <div class="campo campo--${principal.type}">
        <label class="campo-label">${principal.label}</label>
        ${_campoHTML(principal, entry[principal.id])}
      </div>`;

    const camposExtraHTML = extra.map((cat) => `
      <div class="campo campo--${cat.type}">
        <label class="campo-label">${cat.icon ? cat.icon + ' ' : ''}${cat.label}</label>
        ${_campoHTML(cat, entry[cat.id])}
      </div>`).join('');

    const breathingHTML = breathing ? `
      <div class="grupo-registro">
        <legend style="display:block;margin-bottom:12px;">🌬️ Respiración guiada</legend>
        <div class="respiracion-box">
          <div class="respiracion-circulo-wrap">
            <div class="respiracion-circulo" id="resp-circulo"></div>
          </div>
          <div class="respiracion-texto" id="resp-texto">Presioná iniciar cuando quieras</div>
          <div class="respiracion-contador" id="resp-contador"></div>
          <div class="respiracion-controles">
            <button type="button" class="btn btn--secondary" data-action="resp-iniciar" id="btn-resp-iniciar">▶️ Iniciar</button>
            <button type="button" class="btn btn--secondary" data-action="resp-detener" id="btn-resp-detener" hidden>⏹️ Detener</button>
          </div>
          <p class="texto-pequeno text-muted" style="margin-top:10px;">Inhalá 4s · Sostené 4s · Exhalá 4s · Sostené 2s. Repetilo las veces que necesites.</p>
        </div>
      </div>` : '';

    view().innerHTML = `
      <section class="vista-detalle-categoria">
        <div class="detalle-header">
          <button class="btn-icon" data-action="cerrar-categoria" aria-label="Volver">‹</button>
          <span class="cat-row-icon">${principal.icon}</span>
          <div>
            <h1>${principal.label}</h1>
            <p class="text-muted">${formatFechaCorta(dateStr)}</p>
          </div>
        </div>

        ${breathingHTML}

        <form id="form-detalle-categoria" data-fecha="${dateStr}" data-cat="${catId}">
          <fieldset class="grupo-registro">
            <legend>Registro</legend>
            ${campoPrincipalHTML}
          </fieldset>

          ${camposExtraHTML ? `
          <fieldset class="grupo-registro">
            <legend>Detalle</legend>
            ${camposExtraHTML}
          </fieldset>` : ''}

          <button type="submit" class="btn btn--primary btn--full">Guardar</button>
          <button type="button" class="btn btn--secondary btn--full" data-action="cerrar-categoria">Volver sin guardar</button>
        </form>
      </section>`;
  }

  /** Lee un formulario de detalle de categoría (campo principal + extras). */
  function leerFormDetalle(form, catId) {
    const { principal, extra } = camposDeCategoria(catId);
    const campos = [principal].concat(extra).filter(Boolean);
    const fd = new FormData(form);
    const data = {};

    campos.forEach((cat) => {
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
    const scaleColors = ['#E4E2DD', '#D3DEB4', '#B9CC85', '#9CB856', '#7C9A3F'];

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
    renderRegistro, renderCategoriaDetalle, leerFormDetalle, camposDeCategoria,
    renderTimeline, renderCalendario, renderEstadisticas
  };
})();