/**
 * funciones.js — Lógica de Patitas: catálogo, vistas, adopción y seguimiento.
 * Depende de datos.js (MASCOTAS, CATEGORIAS, EXT_IMG).
 */
"use strict";

/* ===================== Configuración ===================== */
const CLAVE = "patitas_estado_v2";   // Llave de localStorage
const NUM_OLVIDADOS = 5;            // Mascotas en el carrusel de "los olvidados"
const POR_PAGINA = 12;               // Tarjetas que se muestran por tanda en el catálogo
const ETAPAS = ["Solicitud recibida", "Visita de revisión", "Entrega de la mascota", "Seguimiento a 30 días", "Adopción completada"];
const FRASES_ENERGIA = [
  "De ritmo tranquilo; ideal para un hogar calmado.",
  "De carácter sereno, disfruta la rutina y la compañía suave.",
  "Equilibrado: juega un rato y también sabe descansar.",
  "Muy activo; necesita espacio y tiempo de juego a diario.",
  "Pura energía; busca a alguien con mucho tiempo para jugar."
];

/* ===================== Estado ===================== */
let estado = { vistas: {}, adopciones: {}, extras: [] };
try {
  const guardado = JSON.parse(localStorage.getItem(CLAVE));
  if (guardado) estado = { vistas: guardado.vistas || {}, adopciones: guardado.adopciones || {}, extras: guardado.extras || [] };
} catch (e) { /* sin almacenamiento */ }

let filtro = "Todas";      // Categoría seleccionada
let texto = "";            // Texto del buscador
let verAdoptadas = false;  // ¿Mostrar también las adoptadas?
let limite = POR_PAGINA;   // Cuántas tarjetas se muestran en el catálogo
let fichaActual = null;    // Mascota abierta en el modal

/* ===================== Utilidades ===================== */
const $ = s => document.querySelector(s);
const mostrar = (el, si) => el.classList.toggle("is-hidden", !si);
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); return true; } catch (e) { return false; } };
const vistasDe = id => estado.vistas[id] || 0;
const estaAdoptada = id => Boolean(estado.adopciones[id]);
const todas = () => [...MASCOTAS, ...estado.extras];
const porId = id => todas().find(m => m.id === id);
const rutaImagen = m => m.imagen || `img/${m.id}.${EXT_IMG}`;
const descripcion = m => `${FRASES_ENERGIA[m.energia - 1]} ${m.cuidado}`;
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function aviso(msg) {
  const n = $("#toast");
  n.textContent = msg;
  mostrar(n, true);
  setTimeout(() => mostrar(n, false), 3000);
}

document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.prefijo && !img.dataset.fallo) {
    img.dataset.fallo = "1";
    img.src = `img/placeholder-${img.dataset.prefijo}.svg`;
  }
}, true);

/* ===================== Dibujado ===================== */
function mensajeTriste(m) {
  const v = vistasDe(m.id);
  return v === 0 ? "Nadie ha abierto mi ficha todavía. ¿Me llevas?"
    : `Solo ${v} ${v === 1 ? "persona me ha visto" : "personas me han visto"}. ¿Me llevas?`;
}

/** HTML de una tarjeta. prioridad=true optimiza el LCP para la primera foto */
function tarjeta(m, destacada, prioridad = false) {
  const adoptada = estaAdoptada(m.id);
  const etiqueta = adoptada ? "Ya tiene hogar" : (destacada ? "Llévanos, por favor" : "Ver ficha");
  const claseBtn = destacada ? "is-warning" : "is-link";
  return `<div class="${destacada ? "slide" : "column is-3-desktop is-6-tablet"}">
    <article class="card ${destacada ? "destacada" : ""} ${adoptada ? "adoptada" : ""}" data-id="${m.id}">
      <div class="card-image">
        <figure class="image is-4by3">
          <img src="${rutaImagen(m)}" data-prefijo="${m.prefijo}" alt="${m.cat}: ${m.nombre}" width="400" height="300" ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
        </figure>
        <span class="tag is-dark vistas">👁 ${vistasDe(m.id)}</span>
      </div>
      <div class="card-content">
        <h3 class="title is-5 mb-2">${m.nombre}</h3>
        <div class="tags">
          <span class="tag is-info is-light">${m.cat}</span><span class="tag is-light">${m.raza}</span><span class="tag is-light">${m.edad}</span>
          ${adoptada ? '<span class="tag is-success">Adoptada</span>' : ""}
          ${m.imagen ? '<span class="tag is-primary is-light">Agregada</span>' : ""}
        </div>
        ${destacada ? `<p class="mb-3">${mensajeTriste(m)}</p>` : ""}
        <button class="button ${claseBtn} is-fullwidth" data-ver="${m.id}" ${adoptada ? "disabled" : ""}>${etiqueta}</button>
      </div>
    </article>
  </div>`;
}

function edadEnMeses(m) {
  const n = parseInt(m.edad, 10);
  if (isNaN(n)) return 0;
  return /mes/i.test(m.edad) ? n : n * 12;
}

/** Dibuja los olvidados evitando el forced reflow y marcando el LCP en el primer slide */
function dibujarOlvidados() {
  const lista = todas().filter(m => !estaAdoptada(m.id))
    .sort((a, b) => vistasDe(a.id) - vistasDe(b.id) || edadEnMeses(b) - edadEnMeses(a))
    .slice(0, NUM_OLVIDADOS);
  const pista = $("#olvidadosGrid");
  const pos = pista.scrollLeft;
  pista.innerHTML = lista.map((m, i) => tarjeta(m, true, i === 0)).join("");
  if (pos > 0) {
    pista.style.scrollBehavior = "auto";
    pista.scrollLeft = pos;
    pista.style.scrollBehavior = "";
  }
  programarIndicador();
}

/** Actualiza el indicador DESPUÉS de que el navegador calcule el diseño (evita forced reflow) */
function programarIndicador() {
  requestAnimationFrame(() => requestAnimationFrame(actualizarIndicador));
}

function pasoCarrusel() {
  const pista = $("#olvidadosGrid"), s = pista.firstElementChild;
  return s ? s.getBoundingClientRect().width + (parseFloat(getComputedStyle(pista).columnGap) || 0) : 0;
}

function actualizarIndicador() {
  const pista = $("#olvidadosGrid"), n = pista.children.length, paso = pasoCarrusel();
  $("#carPrev").disabled = pista.scrollLeft < 5;
  $("#carNext").disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 5;
  if (!paso) { $("#carIndicador").textContent = `${n} mascotas`; return; }
  const a = Math.round(pista.scrollLeft / paso) + 1;
  const b = Math.min(n, a + Math.max(1, Math.round(pista.clientWidth / paso)) - 1);
  $("#carIndicador").textContent = a === b ? `${a} de ${n}` : `${a}–${b} de ${n}`;
}

function dibujarCatalogo() {
  const disponibles = c => todas().filter(m => (c === "Todas" || m.cat === c) && !estaAdoptada(m.id)).length;
  const nombres = ["Todas", ...CATEGORIAS.map(c => c.nombre)];
  $("#tabs").innerHTML = nombres.map(c =>
    `<li class="${c === filtro ? "is-active" : ""}"><a href="#catalogo" data-filtro="${c}" ${c === filtro ? 'aria-current="page"' : ""}>${c} (${disponibles(c)})</a></li>`).join("");

  const t = texto.trim().toLowerCase();
  const lista = todas().filter(m =>
    (filtro === "Todas" || m.cat === filtro) &&
    (verAdoptadas || !estaAdoptada(m.id)) &&
    (m.nombre + " " + m.raza).toLowerCase().includes(t));

  $("#grid").innerHTML = lista.slice(0, limite).map(m => tarjeta(m, false)).join("");
  mostrar($("#vacio"), lista.length === 0);
  mostrar($("#btnMas"), lista.length > limite);
  $("#btnMas").textContent = `Mostrar más (${lista.length - limite} restantes)`;
}

function dibujarSeguimiento() {
  const ids = Object.keys(estado.adopciones);
  mostrar($("#segVacio"), ids.length === 0);
  $("#navAdop").textContent = ids.length;
  $("#segLista").innerHTML = ids.map(id => {
    const m = porId(id), a = estado.adopciones[id];
    const terminada = a.etapa >= ETAPAS.length - 1;
    return `<article class="box"><div class="columns is-vcentered">
      <div class="column is-3"><figure class="image is-4by3"><img src="${rutaImagen(m)}" data-prefijo="${m.prefijo}" alt="${m.nombre}" width="400" height="300" loading="lazy" decoding="async"></figure></div>
      <div class="column">
        <h3 class="title is-5 mb-1">${m.nombre} · ${esc(a.folio)}</h3>
        <p class="mb-2">Adoptante: ${esc(a.adoptante)} (${esc(a.correo)}) · ${new Date(a.fecha).toLocaleDateString("es-MX")}</p>
        <progress class="progress is-success mb-1" value="${a.etapa + 1}" max="${ETAPAS.length}" aria-label="Avance de la adopción de ${m.nombre}"></progress>
        <p class="mb-3"><strong>${ETAPAS[a.etapa]}</strong> (etapa ${a.etapa + 1} de ${ETAPAS.length})</p>
        <div class="buttons">
          <button class="button is-success" data-avanzar="${id}" ${terminada ? "disabled" : ""}>${terminada ? "Completada" : "Avanzar etapa (simulación)"}</button>
          <button class="button is-light" data-cancelar="${id}">Cancelar adopción</button>
        </div>
      </div></div></article>`;
  }).join("");
}

function dibujar() {
  dibujarOlvidados();
  dibujarCatalogo();
  dibujarSeguimiento();
  $("#total").textContent = todas().reduce((s, m) => s + vistasDe(m.id), 0);
  $("#disponibles").textContent = todas().filter(m => !estaAdoptada(m.id)).length;
}

/* ===================== Ficha (modal) ===================== */
function abrirFicha(id) {
  const m = porId(id);
  if (!m) return;
  fichaActual = m;
  estado.vistas[id] = vistasDe(id) + 1;
  guardar();

  const img = $("#mImg");
  delete img.dataset.fallo;
  img.dataset.prefijo = m.prefijo;
  img.src = rutaImagen(m);
  img.alt = `${m.cat}: ${m.nombre}`;
  $("#mTitulo").textContent = m.nombre;
  $("#mTags").innerHTML = `<span class="tag is-info">${m.cat}</span><span class="tag">${m.raza}</span><span class="tag">${m.edad}</span>`;
  $("#mDesc").textContent = descripcion(m);
  $("#mEnergia").value = m.energia;
  $("#mVistas").textContent = vistasDe(id);
  $("#btnAdoptar").disabled = estaAdoptada(id);
  mostrar($("#btnQuitar"), Boolean(m.imagen));
  $("#formAdopcion").reset();
  mostrar($("#formAdopcion"), false);

  $("#modal").classList.add("is-active");
  document.documentElement.classList.add("is-clipped");
  $("#modal .delete").focus();
  dibujar();
}

function cerrarFicha() {
  if (!$("#modal").classList.contains("is-active")) return;
  $("#modal").classList.remove("is-active");
  document.documentElement.classList.remove("is-clipped");
  if (fichaActual) {
    const b = document.querySelector(`[data-ver="${fichaActual.id}"]`);
    if (b && !b.disabled) b.focus();
  }
}

function confirmarAdopcion(e) {
  e.preventDefault();
  const m = fichaActual;
  if (!m || estaAdoptada(m.id)) return;
  estado.adopciones[m.id] = {
    adoptante: $("#adNombre").value.trim(),
    correo: $("#adCorreo").value.trim(),
    fecha: new Date().toISOString(),
    folio: "PAT-" + m.id.toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase(),
    etapa: 0
  };
  guardar();
  cerrarFicha();
  dibujar();
  aviso(`¡Solicitud enviada! ${m.nombre} ya está en tu seguimiento.`);
}

/* ===================== Agregar y quitar mascotas ===================== */
const TAM_MAX_SVG = 200 * 1024;
$("#agCat").innerHTML = CATEGORIAS.map(c => `<option value="${c.prefijo}">${c.nombre}</option>`).join("");

function abrirAgregar() {
  $("#formAgregar").reset();
  $("#agNombreArchivo").textContent = "Ningún archivo";
  mostrar($("#agError"), false);
  $("#modalAgregar").classList.add("is-active");
  document.documentElement.classList.add("is-clipped");
  $("#agCat").focus();
}

function cerrarAgregar() {
  const m = $("#modalAgregar");
  if (!m.classList.contains("is-active")) return;
  m.classList.remove("is-active");
  document.documentElement.classList.remove("is-clipped");
  $("#btnAgregar").focus();
}

function errorAgregar(msg) {
  const e = $("#agError");
  e.textContent = msg;
  mostrar(e, true);
}

async function guardarMascota(e) {
  e.preventDefault();
  const archivo = $("#agArchivo").files[0];
  if (!archivo) return errorAgregar("Elige un archivo SVG.");
  if (archivo.size > TAM_MAX_SVG) return errorAgregar("El SVG pesa más de 200 KB. Optimízalo e inténtalo de nuevo.");
  const svg = await archivo.text();
  if (!/<svg[\s>]/i.test(svg)) return errorAgregar("El archivo no parece un SVG válido.");

  const cat = CATEGORIAS.find(c => c.prefijo === $("#agCat").value);
  const numero = Math.max(0, ...todas().filter(m => m.prefijo === cat.prefijo)
    .map(m => parseInt(m.id.slice(cat.prefijo.length), 10))) + 1;
  const nueva = {
    id: cat.prefijo + numero, prefijo: cat.prefijo, cat: cat.nombre,
    nombre: $("#agNombre").value.trim() || `${cat.nombre} ${numero}`,
    raza: $("#agRaza").value.trim() || "Sin raza definida",
    edad: "Edad por confirmar", energia: 3, cuidado: cat.cuidado,
    imagen: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
  };
  estado.extras.push(nueva);
  if (!guardar()) {
    estado.extras.pop();
    return errorAgregar("No hay espacio para guardar la imagen en este navegador.");
  }
  filtro = cat.nombre; texto = ""; limite = POR_PAGINA;
  $("#buscar").value = "";
  cerrarAgregar();
  dibujar();
  aviso(`${nueva.nombre} agregado a ${cat.nombre}.`);
}

function quitarMascota() {
  const m = fichaActual;
  if (!m || !m.imagen || !confirm(`¿Quitar a ${m.nombre} del catálogo?`)) return;
  estado.extras = estado.extras.filter(x => x.id !== m.id);
  delete estado.vistas[m.id];
  delete estado.adopciones[m.id];
  guardar();
  fichaActual = null;
  cerrarFicha();
  dibujar();
  aviso("Mascota quitada.");
}

/* ===================== Eventos ===================== */
document.addEventListener("click", e => {
  const t = e.target;
  const ver = t.closest("[data-ver]");
  if (ver) return abrirFicha(ver.dataset.ver);

  const carta = t.closest(".card[data-id]");
  if (carta && !estaAdoptada(carta.dataset.id)) return abrirFicha(carta.dataset.id);

  const f = t.closest("[data-filtro]");
  if (f) { e.preventDefault(); filtro = f.dataset.filtro; limite = POR_PAGINA; return dibujarCatalogo(); }

  const av = t.closest("[data-avanzar]");
  if (av) {
    const a = estado.adopciones[av.dataset.avanzar];
    a.etapa = Math.min(a.etapa + 1, ETAPAS.length - 1);
    guardar();
    return dibujarSeguimiento();
  }

  const ca = t.closest("[data-cancelar]");
  if (ca) {
    delete estado.adopciones[ca.dataset.cancelar];
    guardar();
    dibujar();
    return aviso("Adopción cancelada: la mascota vuelve al catálogo.");
  }
});

$("#burger").addEventListener("click", e => {
  const abierto = $("#menu").classList.toggle("is-active");
  e.currentTarget.classList.toggle("is-active", abierto);
  e.currentTarget.setAttribute("aria-expanded", abierto);
});
$("#buscar").addEventListener("input", e => { texto = e.target.value; limite = POR_PAGINA; dibujarCatalogo(); });
$("#verAdoptadas").addEventListener("change", e => { verAdoptadas = e.target.checked; limite = POR_PAGINA; dibujarCatalogo(); });
$("#btnMas").addEventListener("click", () => { limite += POR_PAGINA; dibujarCatalogo(); });

$("#btnAdoptar").addEventListener("click", () => { mostrar($("#formAdopcion"), true); $("#adNombre").focus(); });
$("#formAdopcion").addEventListener("submit", confirmarAdopcion);
$("#modal .modal-background").addEventListener("click", cerrarFicha);
$("#modal .delete").addEventListener("click", cerrarFicha);
$("#modal .cerrar").addEventListener("click", cerrarFicha);
document.addEventListener("keydown", e => { if (e.key === "Escape") { cerrarFicha(); cerrarAgregar(); } });

$("#reset").addEventListener("click", () => {
  if (!confirm("¿Borrar vistas, adopciones y mascotas agregadas y empezar de nuevo?")) return;
  estado = { vistas: {}, adopciones: {}, extras: [] };
  guardar();
  dibujar();
  aviso("Demo reiniciada.");
});

$("#carPrev").addEventListener("click", () => $("#olvidadosGrid").scrollBy({ left: -pasoCarrusel() }));
$("#carNext").addEventListener("click", () => $("#olvidadosGrid").scrollBy({ left: pasoCarrusel() }));
let esperando = false;
$("#olvidadosGrid").addEventListener("scroll", () => {
  if (esperando) return;
  esperando = true;
  requestAnimationFrame(() => { esperando = false; actualizarIndicador(); });
}, { passive: true });
window.addEventListener("resize", actualizarIndicador);

$("#btnAgregar").addEventListener("click", abrirAgregar);
$("#formAgregar").addEventListener("submit", guardarMascota);
$("#agArchivo").addEventListener("change", e => {
  $("#agNombreArchivo").textContent = e.target.files[0] ? e.target.files[0].name : "Ningún archivo";
});
$("#modalAgregar .modal-background").addEventListener("click", cerrarAgregar);
$("#modalAgregar .delete").addEventListener("click", cerrarAgregar);
$("#modalAgregar .cerrar").addEventListener("click", cerrarAgregar);
$("#btnQuitar").addEventListener("click", quitarMascota);

dibujar();