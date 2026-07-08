/**
 * REFUGIO — js/app.js
 * ------------------------------------------------------------------
 * Punto de entrada y controlador principal. Maneja:
 *  - Arranque de la app (onboarding vs. app normal).
 *  - Routing simple basado en hash (#dashboard, #registro, etc.).
 *  - Delegación de eventos (data-action) para no atar listeners
 *    sueltos por toda la vista.
 *  - Registro del Service Worker (PWA).
 * ------------------------------------------------------------------
 */

'use strict';

const App = (() => {

  // Estado efímero de navegación (no se persiste, vive solo en memoria).
  const state = {
    fechaRegistro: UI.todayISO(),
    categoriaActiva: null,
    calAnio: new Date().getFullYear(),
    calMes: new Date().getMonth(),
    statCategoria: 'estado_animo',
    onbPaso: 1
  };

  const ROUTES = ['dashboard', 'registro', 'timeline', 'calendario', 'estadisticas', 'perfil'];

  // ------------------------------------------------------------
  // EJERCICIO DE RESPIRACIÓN GUIADA (temporizador por segundos)
  // ------------------------------------------------------------
  const FASES_RESPIRACION = [
    { nombre: 'Inhalá', segundos: 4, clase: 'fase-inhalar' },
    { nombre: 'Sostené', segundos: 4, clase: 'fase-sostener' },
    { nombre: 'Exhalá', segundos: 4, clase: 'fase-exhalar' },
    { nombre: 'Sostené', segundos: 4, clase: 'fase-sostener' }
  ];
  let respiracionIntervalId = null;
  let respiracionFaseIdx = 0;
  let respiracionSegundos = 0;

  function iniciarRespiracion() {
    detenerRespiracion();
    respiracionFaseIdx = 0;
    _aplicarFaseRespiracion();
    respiracionIntervalId = setInterval(_tickRespiracion, 1000);
  }

  function _aplicarFaseRespiracion() {
    const fase = FASES_RESPIRACION[respiracionFaseIdx];
    respiracionSegundos = fase.segundos;
    const circulo = document.getElementById('respiracion-circulo');
    if (!circulo) { detenerRespiracion(); return; } // el widget ya no está en pantalla
    circulo.className = `respiracion-circulo ${fase.clase}`;
    document.getElementById('respiracion-texto').textContent = `${fase.nombre}…`;
    document.getElementById('respiracion-contador').textContent = `${respiracionSegundos}s`;
  }

  function _tickRespiracion() {
    const contador = document.getElementById('respiracion-contador');
    if (!contador) { detenerRespiracion(); return; }
    respiracionSegundos--;
    if (respiracionSegundos <= 0) {
      respiracionFaseIdx = (respiracionFaseIdx + 1) % FASES_RESPIRACION.length;
      _aplicarFaseRespiracion();
    } else {
      contador.textContent = `${respiracionSegundos}s`;
    }
  }

  function detenerRespiracion() {
    if (respiracionIntervalId) { clearInterval(respiracionIntervalId); respiracionIntervalId = null; }
    const circulo = document.getElementById('respiracion-circulo');
    const texto = document.getElementById('respiracion-texto');
    const contador = document.getElementById('respiracion-contador');
    if (circulo) circulo.className = 'respiracion-circulo';
    if (texto) texto.textContent = 'Presioná comenzar cuando quieras';
    if (contador) contador.textContent = '';
  }

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
      // Ruta relativa: funciona tanto en local como bajo un subpath de GitHub Pages.
      navigator.serviceWorker.register('service-worker.js').catch((err) => {
        console.warn('[App] No se pudo registrar el Service Worker:', err);
      });
    }
  }

  // ------------------------------------------------------------
  // ROUTING
  // ------------------------------------------------------------

  function onHashChange() {
    detenerRespiracion();
    const ruta = (location.hash || '#dashboard').replace('#', '');
    const rutaValida = ROUTES.includes(ruta) ? ruta : 'dashboard';
    if (rutaValida !== 'registro') state.categoriaActiva = null;
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
        if (nuevaFecha > UI.todayISO()) return; // no se permite registrar a futuro
        state.fechaRegistro = nuevaFecha;
        UI.renderRegistro(state.fechaRegistro);
        break;
      }

      case 'ver-dia':
        state.fechaRegistro = el.dataset.fecha;
        state.categoriaActiva = null;
        irA('registro');
        break;

      case 'abrir-categoria':
        state.categoriaActiva = el.dataset.categoria;
        UI.renderCategoriaDetalle(state.fechaRegistro, state.categoriaActiva);
        break;

      case 'volver-registro':
        detenerRespiracion();
        state.categoriaActiva = null;
        UI.renderRegistro(state.fechaRegistro);
        break;

      case 'respirar-iniciar':
        iniciarRespiracion();
        break;

      case 'respirar-detener':
        detenerRespiracion();
        break;

      case 'borrar-registro':
        if (confirm(REFUGIO_CONTENT.FEEDBACK.confirmar_borrado)) {
          Storage.deleteEntry(el.dataset.fecha);
          UI.toast('Registro eliminado');
          irA('timeline');
        }
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
      const categoria = form.dataset.categoria;
      const data = UI.leerFormDetalle(form, categoria);
      Storage.saveEntry(fecha, data);
      detenerRespiracion();
      UI.toast(REFUGIO_CONTENT.FEEDBACK.guardado);
      state.categoriaActiva = null;
      UI.renderRegistro(fecha);
    }

    if (form.id === 'form-checklist') {
      e.preventDefault();
      const fecha = form.dataset.fecha;
      const data = UI.leerFormChecklist(form);
      Storage.saveEntry(fecha, data);
      UI.toast(REFUGIO_CONTENT.FEEDBACK.guardado);
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