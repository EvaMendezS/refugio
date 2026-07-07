/**
 * REFUGIO — js/storage.js
 * ------------------------------------------------------------------
 * Capa única de acceso a localStorage. Ningún otro archivo debe llamar
 * a localStorage directamente: todo pasa por acá para poder cambiar
 * la implementación en el futuro (por ejemplo IndexedDB) sin tocar
 * el resto de la app.
 *
 * Estructura guardada:
 *  refugio_profile  -> { nombre, avatar, pronombres, creado }
 *  refugio_entries  -> { "YYYY-MM-DD": { ...valores por categoría, checklist:[], updated } }
 *  refugio_settings -> { modoOscuro, checklistTemplate: [...] }
 * ------------------------------------------------------------------
 */

'use strict';

const Storage = (() => {

  const KEYS = REFUGIO_DATA.STORAGE_KEYS;

  /** Lee y parsea JSON de localStorage de forma segura. */
  function _read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[Storage] Error leyendo "${key}":`, err);
      return fallback;
    }
  }

  /** Serializa y guarda en localStorage de forma segura. */
  function _write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[Storage] Error guardando "${key}":`, err);
      return false;
    }
  }

  // ------------------------- PERFIL -------------------------

  function getProfile() {
    return _read(KEYS.PROFILE, null);
  }

  function saveProfile(profile) {
    const actual = getProfile() || {};
    const nuevo = Object.assign({}, actual, profile, {
      actualizado: new Date().toISOString()
    });
    if (!nuevo.creado) nuevo.creado = new Date().toISOString();
    _write(KEYS.PROFILE, nuevo);
    return nuevo;
  }

  function hasProfile() {
    const p = getProfile();
    return !!(p && p.nombre);
  }

  // ------------------------- REGISTROS (ENTRIES) -------------------------

  function getAllEntries() {
    return _read(KEYS.ENTRIES, {});
  }

  function getEntry(dateStr) {
    const entries = getAllEntries();
    return entries[dateStr] || null;
  }

  function saveEntry(dateStr, data) {
    const entries = getAllEntries();
    const existente = entries[dateStr] || {};
    entries[dateStr] = Object.assign({}, existente, data, {
      fecha: dateStr,
      updated: new Date().toISOString()
    });
    _write(KEYS.ENTRIES, entries);
    return entries[dateStr];
  }

  function deleteEntry(dateStr) {
    const entries = getAllEntries();
    delete entries[dateStr];
    _write(KEYS.ENTRIES, entries);
  }

  /** Devuelve las entradas ordenadas por fecha ascendente. */
  function getEntriesSorted() {
    const entries = getAllEntries();
    return Object.keys(entries)
      .sort()
      .map((k) => entries[k]);
  }

  // ------------------------- SETTINGS -------------------------

  function getSettings() {
    return _read(KEYS.SETTINGS, {
      modoOscuro: false,
      checklistTemplate: REFUGIO_DATA.DEFAULT_CHECKLIST.slice()
    });
  }

  function saveSettings(partial) {
    const actual = getSettings();
    const nuevo = Object.assign({}, actual, partial);
    _write(KEYS.SETTINGS, nuevo);
    return nuevo;
  }

  // ------------------------- BACKUP / IMPORT -------------------------

  /** Genera un objeto plano con TODO el estado de la app. */
  function exportAll() {
    return {
      schema: REFUGIO_DATA.SCHEMA_VERSION,
      exportadoEn: new Date().toISOString(),
      profile: getProfile(),
      entries: getAllEntries(),
      settings: getSettings()
    };
  }

  /** Descarga el backup como archivo .json. */
  function downloadBackup() {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `refugio_backup_${fecha}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importa un backup previamente exportado.
   * @param {Object} data - objeto ya parseado (ver exportAll()).
   * @returns {boolean} true si se importó correctamente.
   */
  function importAll(data) {
    try {
      if (!data || typeof data !== 'object') throw new Error('Formato inválido');
      if (data.profile) _write(KEYS.PROFILE, data.profile);
      if (data.entries) _write(KEYS.ENTRIES, data.entries);
      if (data.settings) _write(KEYS.SETTINGS, data.settings);
      return true;
    } catch (err) {
      console.error('[Storage] Error importando backup:', err);
      return false;
    }
  }

  /** Borra TODOS los datos de Refugio (usado en "reiniciar app"). */
  function wipeAll() {
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  }

  return {
    getProfile, saveProfile, hasProfile,
    getAllEntries, getEntry, saveEntry, deleteEntry, getEntriesSorted,
    getSettings, saveSettings,
    exportAll, downloadBackup, importAll, wipeAll
  };
})();