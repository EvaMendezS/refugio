/**
 * REFUGIO — js/analytics.js
 * ------------------------------------------------------------------
 * Cálculo de estadísticas, correlaciones entre variables numéricas y
 * dibujo de gráficos simples sobre <canvas>, sin librerías externas.
 * ------------------------------------------------------------------
 */

'use strict';

const Analytics = (() => {

  /** Categorías numéricas (aptas para promedios / correlaciones). */
  function numericCategories() {
    return REFUGIO_DATA.CATEGORIES.filter((c) => c.numeric);
  }

  /** Devuelve pares [fecha, valor] de una categoría, ignorando vacíos. */
  function seriesFor(entries, catId) {
    return entries
      .filter((e) => e[catId] !== undefined && e[catId] !== null && e[catId] !== '')
      .map((e) => ({ fecha: e.fecha, valor: Number(e[catId]) }))
      .filter((p) => !Number.isNaN(p.valor));
  }

  function average(nums) {
    if (!nums.length) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return sum / nums.length;
  }

  /** Racha de días consecutivos con registro, contando desde hoy hacia atrás. */
  function currentStreak(entries) {
    const set = new Set(entries.map((e) => e.fecha));
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (set.has(iso)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Resumen general para el dashboard y estadísticas:
   * promedio de cada categoría numérica en los últimos N días.
   */
  function summary(entries, days = 30) {
    const limite = new Date();
    limite.setDate(limite.getDate() - days);
    const recientes = entries.filter((e) => new Date(e.fecha) >= limite);

    return numericCategories().map((cat) => {
      const serie = seriesFor(recientes, cat.id);
      return {
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        promedio: average(serie.map((p) => p.valor)),
        registros: serie.length
      };
    });
  }

  /** Coeficiente de correlación de Pearson entre dos arreglos numéricos alineados. */
  function pearson(x, y) {
    const n = x.length;
    if (n < 3) return null; // Muy pocos datos para que tenga sentido.
    const mediaX = average(x);
    const mediaY = average(y);
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mediaX;
      const dy = y[i] - mediaY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    if (den === 0) return null;
    return num / den;
  }

  /**
   * Calcula correlaciones entre todos los pares de categorías numéricas
   * que tengan al menos `minDias` días en común.
   */
  function correlationMatrix(entries, minDias = 5) {
    const cats = numericCategories();
    const resultados = [];

    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const a = cats[i], b = cats[j];
        const comunes = entries.filter((e) =>
          e[a.id] !== undefined && e[a.id] !== null && e[a.id] !== '' &&
          e[b.id] !== undefined && e[b.id] !== null && e[b.id] !== ''
        );
        if (comunes.length < minDias) continue;

        const x = comunes.map((e) => Number(e[a.id]));
        const y = comunes.map((e) => Number(e[b.id]));
        const r = pearson(x, y);
        if (r === null) continue;

        resultados.push({
          a: a.label, aId: a.id, b: b.label, bId: b.id,
          r: Math.round(r * 100) / 100,
          n: comunes.length
        });
      }
    }
    // Ordenamos por fuerza de correlación (valor absoluto) descendente.
    resultados.sort((r1, r2) => Math.abs(r2.r) - Math.abs(r1.r));
    return resultados;
  }

  function interpretaCorrelacion(r) {
    const abs = Math.abs(r);
    let fuerza = 'muy débil';
    if (abs >= 0.7) fuerza = 'fuerte';
    else if (abs >= 0.5) fuerza = 'moderada';
    else if (abs >= 0.3) fuerza = 'leve';
    const direccion = r >= 0 ? 'directa (suben o bajan juntas)' : 'inversa (una sube cuando la otra baja)';
    return `Relación ${fuerza}, de forma ${direccion}.`;
  }

  // ------------------------- DIBUJO EN CANVAS -------------------------

  /** Limpia y prepara un canvas con la resolución del dispositivo (retina-friendly). */
  function _prepCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, rect.width, rect.height);
    return { ctx, w: rect.width, h: rect.height };
  }

  /**
   * Dibuja un gráfico de línea simple para una serie de puntos {fecha, valor}.
   * Sin dependencias externas: solo Canvas 2D API.
   */
  function drawLineChart(canvas, puntos, opciones = {}) {
    if (!canvas || !puntos.length) return;
    const { ctx, w, h } = _prepCanvas(canvas);
    const pad = 28;
    const color = opciones.color || getComputedStyle(document.body).getPropertyValue('--ok-fuerte').trim() || '#0B7A54';
    const min = opciones.min !== undefined ? opciones.min : Math.min(...puntos.map(p => p.valor));
    const max = opciones.max !== undefined ? opciones.max : Math.max(...puntos.map(p => p.valor));
    const rango = (max - min) || 1;

    const x = (i) => pad + (i / Math.max(1, puntos.length - 1)) * (w - pad * 2);
    const y = (v) => h - pad - ((v - min) / rango) * (h - pad * 2);

    // Líneas guía horizontales
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yy = pad + (i / 3) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, yy);
      ctx.lineTo(w - pad, yy);
      ctx.stroke();
    }

    // Línea de la serie
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    puntos.forEach((p, i) => {
      const px = x(i), py = y(p.valor);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Puntos
    ctx.fillStyle = color;
    puntos.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(x(i), y(p.valor), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /** Dibuja un gráfico de barras simple (para promedios comparados, etc). */
  function drawBarChart(canvas, items, opciones = {}) {
    if (!canvas || !items.length) return;
    const { ctx, w, h } = _prepCanvas(canvas);
    const pad = 24;
    const color = opciones.color || getComputedStyle(document.body).getPropertyValue('--acento-fuerte').trim() || '#5F7A2C';
    const max = opciones.max !== undefined ? opciones.max : Math.max(...items.map(i => i.valor), 1);
    const anchoBarra = (w - pad * 2) / items.length * 0.6;
    const espacio = (w - pad * 2) / items.length;

    items.forEach((item, i) => {
      const alto = ((item.valor || 0) / max) * (h - pad * 2);
      const bx = pad + i * espacio + (espacio - anchoBarra) / 2;
      const by = h - pad - alto;
      ctx.fillStyle = color;
      ctx.beginPath();
      const r = 6;
      ctx.moveTo(bx, by + alto);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.lineTo(bx + anchoBarra - r, by);
      ctx.quadraticCurveTo(bx + anchoBarra, by, bx + anchoBarra, by + r);
      ctx.lineTo(bx + anchoBarra, by + alto);
      ctx.closePath();
      ctx.fill();

      // etiqueta
      ctx.fillStyle = '#6B6B6B';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, bx + anchoBarra / 2, h - 6);
    });
  }

  return {
    numericCategories, seriesFor, average, currentStreak,
    summary, pearson, correlationMatrix, interpretaCorrelacion,
    drawLineChart, drawBarChart
  };
})();