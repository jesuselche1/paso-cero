// ==========================================================
// Paso Cero — monta la página de una lección
// La dirección dice cuál: leccion.html?p=2
// 1. Carga el contenido de esa lección (js/lecciones/leccion-2.js)
// 2. Lo coloca en la plantilla
// 3. Carga js/leccion.js, que hace funcionar el editor
// ==========================================================

const numeroLeccion = Number(new URLSearchParams(location.search).get("p")) || 1;
const proyecto = datosProyecto(numeroLeccion);

if (!proyecto.url) {
  mostrarQueNoExiste();
} else {
  cargarGuion(`js/lecciones/leccion-${numeroLeccion}.js`)
    .then(montar)
    .then(() => cargarGuion("js/leccion.js"))
    .catch((fallo) => {
      console.error(fallo);
      mostrarQueNoExiste();
    });
}

function cargarGuion(ruta) {
  return new Promise((listo, fallo) => {
    const etiqueta = document.createElement("script");
    etiqueta.src = ruta;
    etiqueta.onload = listo;
    etiqueta.onerror = () => fallo(new Error(`No se ha podido cargar ${ruta}`));
    document.body.appendChild(etiqueta);
  });
}

function montar() {
  // El título sale del mapa, así solo está escrito en un sitio
  LECCION.titulo = proyecto.titulo;

  document.title = `${proyecto.titulo} — Paso Cero`;
  document.getElementById("etiqueta-proyecto").textContent =
    `Proyecto ${numeroLeccion} de ${TOTAL_PROYECTOS}`;
  document.getElementById("titulo-proyecto").textContent = proyecto.titulo;
  document.getElementById("texto-reto").innerHTML = LECCION.textoReto;

  // Las cuatro partes de texto de la lección
  for (const [parte, contenido] of [
    ["reto", LECCION.reto],
    ["saber", LECCION.saber],
    ["ia", LECCION.ia],
    ["mejoralo", LECCION.mejoralo],
  ]) {
    document.getElementById(`parte-${parte}`).innerHTML = contenido;
  }
}

// Si alguien pide una lección que todavía no existe
function mostrarQueNoExiste() {
  document.title = "Lección no encontrada — Paso Cero";
  document.querySelector("main").innerHTML = `
    <h1>Esta lección todavía no existe</h1>
    <p>Puede que aún esté por escribir o que la dirección no sea correcta.</p>
    <p><a class="boton" href="index.html">Volver al mapa</a></p>
  `;
}
