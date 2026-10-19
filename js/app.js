(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- cuenta regresiva a la lista oficial ---------- */
  var meta = new Date('2026-11-13T00:00:00-04:00');
  var dias = Math.ceil((meta - new Date()) / 86400000);
  if (dias > 0) { $('dias').textContent = dias; $('dias-texto').textContent = (dias === 1 ? 'día' : 'días') + ' para el 13 de noviembre de 2026'; }
  else { $('dias').textContent = '✓'; $('dias-texto').textContent = 'La lista oficial 2027/2028 ya fue publicada en si.se'; }

  /* ---------- maestrias: filtros y busqueda ---------- */
  var area = 'todas';
  var filtros = $('filtros');
  function botonFiltro(clave, texto) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'filtro'; b.textContent = texto;
    b.setAttribute('aria-pressed', clave === area ? 'true' : 'false');
    b.addEventListener('click', function () {
      area = clave;
      filtros.querySelectorAll('.filtro').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      pintar();
    });
    filtros.appendChild(b);
  }
  botonFiltro('todas', 'Todas');
  Object.keys(AREAS).forEach(function (k) { botonFiltro(k, AREAS[k]); });

  function sinTildes(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function pintar() {
    var q = sinTildes($('buscar').value.trim());
    var lista = $('lista-m'); lista.textContent = '';
    var n = 0;
    MAESTRIAS.forEach(function (m) {
      if (area !== 'todas' && m[0] !== area) return;
      if (q && sinTildes(m.slice(1, 4).join(' ')).indexOf(q) === -1) return;
      n++;
      var d = document.createElement('div'); d.className = 'm';
      d.innerHTML = '<span class="a"></span><span class="t"></span><span class="u"></span>' +
        '<span class="d"><span class="dur"></span><span class="cod"></span><span>Inglés</span></span>' +
        '<a target="_blank" rel="noopener">Ver programa en la universidad</a>';
      d.querySelector('.a').textContent = AREAS[m[0]];
      d.querySelector('.t').textContent = m[1];
      d.querySelector('.u').textContent = m[2] + ' · ' + m[3];
      d.querySelector('.dur').textContent = m[4] === 1 ? '1 año (60 créditos)' : '2 años (120 créditos)';
      d.querySelector('.cod').textContent = 'Código ' + m[5];
      var a = d.querySelector('a'); a.href = m[6];
      a.setAttribute('aria-label', 'Ver ' + m[1] + ' en ' + m[2] + ' (abre otra pestaña)');
      lista.appendChild(d);
    });
    $('contador').textContent = n === 1 ? '1 maestría' : n + ' maestrías';
  }
  $('buscar').addEventListener('input', pintar);
  pintar();

  /* ---------- casillas de areas en el formulario ---------- */
  var checks = $('areas-checks');
  Object.keys(AREAS).forEach(function (k) {
    var l = document.createElement('label'); l.className = 'check';
    l.innerHTML = '<input type="checkbox" name="areas"><span></span>';
    l.querySelector('input').value = AREAS[k];
    l.querySelector('span').textContent = AREAS[k];
    checks.appendChild(l);
  });

  /* ---------- archivo CV ---------- */
  var MAX = 5 * 1024 * 1024;
  $('cv').addEventListener('change', function () {
    var f = this.files[0];
    $('zona-cv').classList.toggle('lleno', !!f);
    $('cv-texto').innerHTML = f ? '<span class="nombre"></span><br><small>Toca para cambiarlo</small>' : 'Toca aquí para elegir tu CV en PDF';
    if (f) $('cv-texto').querySelector('.nombre').textContent = f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)';
  });

  /* ---------- envio ---------- */
  var estado = $('estado');
  function avisar(tipo, texto) { estado.className = 'estado ' + tipo; estado.textContent = texto; }

  var cfg = window.SUECIA_CFG;
  var sb = (window.supabase && cfg) ? window.supabase.createClient(cfg.url, cfg.anon, { auth: { persistSession: false } }) : null;

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  $('formulario').addEventListener('submit', async function (e) {
    e.preventDefault();
    var form = this;
    var faltan = [];
    ['nombre', 'correo', 'celular', 'vinculo', 'unidad', 'grado', 'anios', 'ingles'].forEach(function (id) {
      if (!$(id).value.trim()) faltan.push($(id));
    });
    var f = $('cv').files[0];
    if (faltan.length) { avisar('error', 'Falta completar: ' + faltan.map(function (x) { return form.querySelector('label[for="' + x.id + '"]').firstChild.textContent.trim(); }).join(', ') + '.'); faltan[0].focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('correo').value.trim())) { avisar('error', 'Revisa tu correo electrónico.'); $('correo').focus(); return; }
    if (!f) { avisar('error', 'Adjunta tu CV en PDF.'); $('cv').focus(); return; }
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { avisar('error', 'El CV debe ser un archivo PDF.'); return; }
    if (f.size > MAX) { avisar('error', 'Tu CV pesa más de 5 MB. Comprímelo o expórtalo de nuevo en PDF y vuelve a intentarlo.'); return; }
    if (!$('consentimiento').checked) { avisar('error', 'Marca la casilla de autorización para enviar.'); $('consentimiento').focus(); return; }
    if (!sb) { avisar('error', 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'); return; }

    var boton = $('enviar'); boton.disabled = true; boton.textContent = 'Enviando...';
    avisar('info', 'Subiendo tu CV, no cierres esta página.');
    try {
      var ruta = uuid() + '.pdf';
      var sub = await sb.storage.from(cfg.bucket).upload(ruta, f, { contentType: 'application/pdf', upsert: false });
      if (sub.error) throw sub.error;
      var areas = Array.prototype.map.call(form.querySelectorAll('input[name=areas]:checked'), function (x) { return x.value; });
      var fila = {
        nombre: $('nombre').value.trim(), ci: $('ci').value.trim() || null,
        correo: $('correo').value.trim(), celular: $('celular').value.trim(),
        vinculo: $('vinculo').value, unidad: $('unidad').value, grado: $('grado').value,
        titulo: $('titulo').value.trim() || null, anios_trabajo: $('anios').value, ingles: $('ingles').value,
        areas: areas, liderazgo: $('liderazgo').value.trim() || null, comentario: $('comentario').value.trim() || null,
        cv_ruta: ruta, consentimiento: true
      };
      var ins = await sb.from(cfg.tabla).insert(fila);
      if (ins.error) throw ins.error;
      form.reset(); $('zona-cv').classList.remove('lleno'); $('cv-texto').textContent = 'Toca aquí para elegir tu CV en PDF';
      avisar('ok', '¡Registro recibido, ' + fila.nombre.split(' ')[0] + '! La Dirección de Carrera de Relaciones Internacionales te contactará por correo o WhatsApp para iniciar la asesoría.');
    } catch (err) {
      console.error(err);
      avisar('error', 'No se pudo enviar tu registro. Inténtalo de nuevo en unos minutos o escribe a rrii.fcj@uagrm.edu.bo adjuntando tu CV.');
    } finally {
      boton.disabled = false; boton.textContent = 'Enviar mi registro';
    }
  });
})();
