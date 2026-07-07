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
    calAnio: new Date().getFullYear(),
    calMes: new Date().getMonth(),
    statCategoria: 'estado_animo',
    onbPaso: 1
  };

  const ROUTES = ['dashboard', 'registro', 'timeline', 'calendario', 'estadisticas', 'perfil'];

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
      case 'registro': UI.renderRegistro(state.fechaRegistro); break;
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
        irA('registro');
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

    if (form.id === 'form-registro') {
      e.preventDefault();
      const fecha = form.dataset.fecha;
      const data = UI.leerFormRegistro(form);
      Storage.saveEntry(fecha, data);
      UI.toast(REFUGIO_CONTENT.FEEDBACK.guardado);
      irA('dashboard');
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