// ==========================================================
// Paso Cero — mapa de proyectos de la página de inicio
// Dibuja los 9 proyectos como un camino: terminados,
// disponibles y bloqueados.
// ==========================================================

const mapa = document.getElementById("mapa");
const botonEmpezar = document.getElementById("boton-empezar");

for (let numero = 1; numero <= TOTAL_PROYECTOS; numero++) {
  mapa.appendChild(crearParada(datosProyecto(numero)));
}

actualizarBotonEmpezar();

function crearParada(proyecto) {
  const completado = estaCompletado(proyecto.numero);
  const desbloqueado = estaDesbloqueado(proyecto.numero);
  const estado = completado ? "completado" : desbloqueado ? "disponible" : "bloqueado";

  const parada = document.createElement("li");
  parada.className = `parada parada-${estado}`;

  // Círculo con el número, un ✓ o un candado
  const marca = document.createElement("span");
  marca.className = "marca";
  marca.setAttribute("aria-hidden", "true");
  marca.textContent = completado ? "✓" : desbloqueado ? proyecto.numero : "🔒";
  parada.appendChild(marca);

  // Tarjeta con el texto
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";

  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = `Proyecto ${proyecto.numero} · ${textoEstado(estado, proyecto)}`;

  const titulo = document.createElement("h3");
  titulo.textContent = proyecto.titulo || "Muy pronto";

  const descripcion = document.createElement("p");
  descripcion.textContent =
    proyecto.descripcion || "Termina los proyectos anteriores para descubrirlo.";

  // Solo se puede entrar si está abierto y la página ya existe
  const contenedor =
    desbloqueado && proyecto.url ? document.createElement("a") : tarjeta;
  if (contenedor !== tarjeta) {
    contenedor.href = proyecto.url;
    tarjeta.appendChild(contenedor);
  }
  contenedor.append(etiqueta, titulo, descripcion);

  parada.appendChild(tarjeta);
  return parada;
}

function textoEstado(estado, proyecto) {
  if (estado === "completado") return "Terminado";
  if (estado === "bloqueado") return "Bloqueado";
  return proyecto.url ? "Disponible" : "Próximamente";
}

// El botón grande lleva al primer proyecto pendiente que ya exista
function actualizarBotonEmpezar() {
  const pendiente = PROYECTOS.find(
    (p) => p.url && estaDesbloqueado(p.numero) && !estaCompletado(p.numero)
  );
  if (!pendiente) {
    if (leerCompletados().length) botonEmpezar.textContent = "Repasar el primer proyecto";
    return;
  }
  if (pendiente.numero === 1) return;
  botonEmpezar.href = pendiente.url;
  botonEmpezar.textContent = `Continuar: Proyecto ${pendiente.numero}`;
}
