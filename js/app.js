/**
 * REFUGIO — js/app.js
 * ------------------------------------------------------------------
 * Punto de entrada y controlador principal. Maneja:
 *  - Arranque de la app (onboarding vs. app normal).
 *  - Routing simple basado en hash (#dashboard, #registro, etc.).
 *  - Navegación interna entre la grilla de pestañas del registro
 *    diario y el panel de detalle de cada categoría.
 *  - El temporizador del ejercicio de respiración guiada.
 *  - Delegación de eventos (data-action).
 *  - Registro del Service Worker (PWA).
 * ------------------------------------------------------------------
 */

'use strict';

const App = (() => {

  const state = {
    fechaRegistro: UI.todayISO(),
    categoriaActiva: null,   // catId de la pestaña abierta dentro de "registro", o null = grilla
    calAnio: new Date().getFullYear(),
    calMes: new Date().getMonth(),
    statCategoria: 'estado_animo',
    onbPaso: 1
  };

  const ROUTES = ['dashboard', 'registro', 'timeline', 'calendario', 'estadisticas', 'perfil'];

  // ------------------------------------------------------------
  // RESPIRACIÓN GUIADA — temporizador por segundos
  // ------------------------------------------------------------
  const BreathingTimer = (() => {
    const FASES = [
      { clase: 'fase-inhalar', texto: 'Inhalá...', seg: 4 },
      { clase: 'fase-sostener', texto: 'Sostené', seg: 4 },
      { clase: 'fase-exhalar', texto: 'Exhalá...', seg: 4 },
      { clase: 'fase-sostener', texto: 'Sostené', seg: 2 }
    ];
    let faseIdx = 0;
    let restante = 0;
    let intervalId = null;

    function _tick() {
      const circulo = document.getElementById('resp-circulo');
      const texto = document.getElementById('resp-texto');
      const contador = document.getElementById('resp-contador');
      if (!circulo || !texto || !contador) { stop(); return; }

      if (restante <= 0) {
        faseIdx = (faseIdx + 1) % FASES.length;
        restante = FASES[faseIdx].seg;
        FASES.forEach((f) => circulo.classList.remove(f.clase));
        circulo.classList.add(FASES[faseIdx].clase);
        texto.textContent = FASES[faseIdx].texto;
      }
      contador.textContent = `${restante} s`;
      restante--;
    }

    function start() {
      stop();
      faseIdx = -1;
      restante = 0;
      const iniciar = document.getElementById('btn-resp-iniciar');
      const detener = document.getElementById('btn-resp-detener');
      if (iniciar) iniciar.hidden = true;
      if (detener) detener.hidden = false;
      _tick();
      intervalId = setInterval(_tick, 1000);
    }

    function stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      const circulo = document.getElementById('resp-circulo');
      const texto = document.getElementById('resp-texto');
      const contador = document.getElementById('resp-contador');
      const iniciar = document.getElementById('btn-resp-iniciar');
      const detener = document.getElementById('btn-resp-detener');
      if (circulo) FASES.forEach((f) => circulo.classList.remove(f.clase));
      if (texto) texto.textContent = 'Presioná iniciar cuando quieras';
      if (contador) contador.textContent = '';
      if (iniciar) iniciar.hidden = false;
      if (detener) detener.hidden = true;
    }

    return { start, stop };
  })();

  // ------------------------------------------------------------
  // ARRANQUE
  // ------------------------------------------------------------

  function init() {
    aplicarModoOscuro();
    bindGlobalEvents();
    registrarServiceWorker();

    if (!Storage.hasProfile()) {
      document.getElementById('bottom-nav').hidden = true;
      UI.renderOnboarding(1);
    } else {
      document.getElementById('bottom-nav').hidden = false;
      window.addEventListener('hashchange', onHashChange);
      if (!location.hash) location.hash = '#dashboard';
      onHashChange();
    }
  }

  function aplicarModoOscuro() {
    const settings = Storage.getSettings();
    document.body.classList.toggle('modo-oscuro', !!settings.modoOscuro);
  }

  function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch((err) => {
        console.warn('[App] No se pudo registrar el Service Worker:', err);
      });
    }
  }

  // ------------------------------------------------------------
  // ROUTING
  // ------------------------------------------------------------

  function onHashChange() {
    BreathingTimer.stop();
    state.categoriaActiva = null; // toda navegación por hash vuelve a la grilla
    const ruta = (location.hash || '#dashboard').replace('#', '');
    const rutaValida = ROUTES.includes(ruta) ? ruta : 'dashboard';
    marcarNavActiva(rutaValida);
    render(rutaValida);
  }

  function marcarNavActiva(ruta) {
    document.querySelectorAll('#bottom-nav .nav-item').forEach((el) => {
      el.classList.toggle('nav-item--activa', el.dataset.ruta === ruta);
    });
  }

  function render(ruta) {
    const profile = Storage.getProfile();
    switch (ruta) {
      case 'dashboard': UI.renderDashboard(profile); break;
      case 'registro':
        if (state.categoriaActiva) {
          UI.renderCategoriaDetalle(state.fechaRegistro, state.categoriaActiva);
        } else {
          UI.renderRegistro(state.fechaRegistro);
        }
        break;
      case 'timeline': UI.renderTimeline(); break;
      case 'calendario': UI.renderCalendario(state.calAnio, state.calMes); break;
      case 'estadisticas': UI.renderEstadisticas(state.statCategoria); break;
      case 'perfil': UI.renderPerfil(profile); break;
    }
  }

  function irA(ruta) {
    location.hash = `#${ruta}`;
  }

  // ------------------------------------------------------------
  // EVENTOS GLOBALES (delegación sobre document.body)
  // ------------------------------------------------------------

  function bindGlobalEvents() {
    document.body.addEventListener('click', onClickDelegado);
    document.body.addEventListener('submit', onSubmitDelegado);
    document.body.addEventListener('change', onChangeDelegado);
  }

  function onClickDelegado(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const accion = el.dataset.action;

    switch (accion) {
      case 'onb-next':
        state.onbPaso = Number(el.dataset.paso);
        UI.renderOnboarding(state.onbPaso);
        break;

      case 'onb-finish':
        finalizarOnboarding();
        break;

      case 'ir-registro':
        state.fechaRegistro = UI.todayISO();
        state.categoriaActiva = null;
        irA('registro');
        break;

      case 'cambiar-fecha': {
        const dir = Number(el.dataset.dir);
        const f = new Date(state.fechaRegistro);
        f.setDate(f.getDate() + dir);
        const nuevaFecha = f.toISOString().slice(0, 10);
        if (nuevaFecha > UI.todayISO()) return;
        state.fechaRegistro = nuevaFecha;
        UI.renderRegistro(state.fechaRegistro);
        break;
      }

      case 'abrir-categoria':
        BreathingTimer.stop();
        state.categoriaActiva = el.dataset.cat;
        render('registro');
        break;

      case 'cerrar-categoria':
        BreathingTimer.stop();
        state.categoriaActiva = null;
        render('registro');
        break;

      case 'resp-iniciar':
        BreathingTimer.start();
        break;

      case 'resp-detener':
        BreathingTimer.stop();
        break;

      case 'ver-dia':
        state.fechaRegistro = el.dataset.fecha;
        state.categoriaActiva = null;
        irA('registro');
        break;

      case 'cal-mes': {
        const dir = Number(el.dataset.dir);
        state.calMes += dir;
        if (state.calMes > 11) { state.calMes = 0; state.calAnio++; }
        if (state.calMes < 0) { state.calMes = 11; state.calAnio--; }
        UI.renderCalendario(state.calAnio, state.calMes);
        break;
      }

      case 'export-backup':
        Storage.downloadBackup();
        UI.toast(REFUGIO_CONTENT.FEEDBACK.backup_exportado);
        break;

      case 'wipe-all':
        if (confirm('Esto borrará TODOS tus datos de este dispositivo de forma permanente. ¿Continuar?')) {
          Storage.wipeAll();
          location.hash = '';
          location.reload();
        }
        break;

      case 'exportar-pdf':
        exportarPDF();
        break;
    }
  }

  function onSubmitDelegado(e) {
    const form = e.target;

    if (form.id === 'form-perfil-onb') {
      e.preventDefault();
      const fd = new FormData(form);
      Storage.saveProfile({
        nombre: fd.get('nombre').trim(),
        avatar: fd.get('avatar'),
        pronombres: fd.get('pronombres')
      });
      state.onbPaso = 3;
      UI.renderOnboarding(3);
    }

    if (form.id === 'form-perfil') {
      e.preventDefault();
      const fd = new FormData(form);
      Storage.saveProfile({
        nombre: fd.get('nombre').trim(),
        avatar: fd.get('avatar'),
        pronombres: fd.get('pronombres')
      });
      UI.toast(REFUGIO_CONTENT.FEEDBACK.actualizado);
      render('perfil');
    }

    if (form.id === 'form-detalle-categoria') {
      e.preventDefault();
      const fecha = form.dataset.fecha;
      const catId = form.dataset.cat;
      const data = UI.leerFormDetalle(form, catId);
      Storage.saveEntry(fecha, data);
      UI.toast(REFUGIO_CONTENT.FEEDBACK.guardado);
      BreathingTimer.stop();
      state.categoriaActiva = null;
      render('registro');
    }
  }

  function onChangeDelegado(e) {
    const el = e.target;

    if (el.id === 'toggle-dark') {
      Storage.saveSettings({ modoOscuro: el.checked });
      aplicarModoOscuro();
    }

    if (el.id === 'select-categoria-stat') {
      state.statCategoria = el.value;
      UI.renderEstadisticas(state.statCategoria);
    }

    if (el.id === 'input-import') {
      importarBackupDesdeArchivo(el.files[0]);
    }

    // Checklist de autocuidado: autoguardado inmediato al tildar/destildar.
    if (el.name === 'checklist' && el.closest('#checklist-grid')) {
      const grid = document.getElementById('checklist-grid');
      const seleccionados = Array.from(grid.querySelectorAll('input[name="checklist"]:checked')).map((i) => i.value);
      Storage.saveEntry(state.fechaRegistro, { checklist: seleccionados });
      UI.toast(REFUGIO_CONTENT.FEEDBACK.actualizado);
    }
  }

  // ------------------------------------------------------------
  // ACCIONES COMPUESTAS
  // ------------------------------------------------------------

  function finalizarOnboarding() {
    document.getElementById('bottom-nav').hidden = false;
    window.addEventListener('hashchange', onHashChange);
    location.hash = '#dashboard';
    onHashChange();
  }

  function importarBackupDesdeArchivo(file) {
    if (!file) return;
    if (!confirm(REFUGIO_CONTENT.FEEDBACK.confirmar_import)) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const ok = Storage.importAll(data);
        if (ok) {
          UI.toast(REFUGIO_CONTENT.FEEDBACK.backup_importado);
          setTimeout(() => location.reload(), 1200);
        } else {
          UI.toast(REFUGIO_CONTENT.FEEDBACK.error_generico);
        }
      } catch (err) {
        console.error(err);
        UI.toast(REFUGIO_CONTENT.FEEDBACK.error_generico);
      }
    };
    reader.readAsText(file);
  }

  function exportarPDF() {
    const desde = document.getElementById('pdf-desde').value;
    const hasta = document.getElementById('pdf-hasta').value;
    const entries = Storage.getEntriesSorted();
    const profile = Storage.getProfile();
    const ok = PDFExport.exportar(entries, profile, { desde, hasta, dias: 30 });
    if (ok) UI.toast(REFUGIO_CONTENT.FEEDBACK.pdf_generado);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);