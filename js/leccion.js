// ==========================================================
// Paso Cero — lógica compartida de todas las lecciones
// Cada página define antes un objeto LECCION con sus datos:
// código inicial, pista, cómo se comprueba, lo aprendido...
//
// 1. Crea el editor (CodeMirror)
// 2. Carga Python (Pyodide) en segundo plano, en un Web Worker
// 3. «Ejecutar» prueba el programa respondiendo tú; «Comprobar» lo ejecuta
//    con las respuestas de prueba de la lección y compara el resultado
//    con el esperado
// 4. Si hay un error, lo explica en castellano sencillo
// 5. Si el reto está superado, muestra la pantalla de proyecto terminado
// ==========================================================

// --- Elementos de la página ---
const porId = (id) => document.getElementById(id);
const botonComprobar = porId("boton-comprobar");
const botonEjecutar = porId("boton-ejecutar");
const botonReiniciar = porId("boton-reiniciar");
const botonPista = porId("boton-pista");
const cajaPista = porId("pista");
const estado = porId("estado");
const cajaResultado = porId("resultado");
const salida = porId("salida");
const formEntrada = porId("entrada");
const campoEntrada = porId("entrada-campo");
const cajaError = porId("error");
const errorMensaje = porId("error-mensaje");
const errorLinea = porId("error-linea");
const errorTecnico = porId("error-tecnico");
const detallesError = cajaError.querySelector("details");
const tituloError = porId("error-titulo");
const comparacion = porId("comparacion");
const textoEsperado = porId("esperado");
const textoObtenido = porId("obtenido");
const consejo = porId("consejo");
const infoPrueba = porId("info-prueba");
const nota = porId("nota");
const acierto = porId("acierto");

// --- 1. Editor ---
const editor = CodeMirror.fromTextArea(porId("codigo"), {
  mode: "python",
  lineNumbers: true,
  indentUnit: 4,
  tabSize: 4,
  // Al pulsar Tab se insertan 4 espacios, como recomienda Python
  extraKeys: {
    Tab: (cm) => cm.replaceSelection("    "),
    "Ctrl-Enter": () => comprobar(),
    "Cmd-Enter": () => comprobar(),
  },
});
editor.setValue(LECCION.codigoInicial);

botonReiniciar.addEventListener("click", () => {
  cancelarEjecucion();
  editor.setValue(LECCION.codigoInicial);
  ocultarTodo();
  editor.focus();
});

// Botón de pista (solo si la lección tiene una)
if (botonPista && LECCION.pista) {
  cajaPista.querySelector("p").textContent = LECCION.pista;
  botonPista.hidden = false;
  botonPista.addEventListener("click", () => {
    cajaPista.hidden = !cajaPista.hidden;
    botonPista.textContent = cajaPista.hidden ? "Pedir pista" : "Ocultar pista";
  });
}

// --- 2. Python en segundo plano ---
// Python funciona dentro de un «trabajador» (js/python-worker.js), así
// que aunque el programa se quede atascado, la página sigue respondiendo.

// Los límites contra los bucles infinitos están en js/ajustes.js

let trabajador = null;
let pythonListo = false;

function arrancarPython() {
  pythonListo = false;
  botonComprobar.disabled = true;
  if (botonEjecutar) botonEjecutar.disabled = true;
  const nuevo = new Worker("js/python-worker.js");
  // Solo atendemos al trabajador actual, no a uno que ya hemos parado
  nuevo.addEventListener("message", ({ data }) => {
    if (nuevo === trabajador) recibirMensaje(data);
  });
  nuevo.addEventListener("error", (evento) => {
    console.error(evento);
    if (nuevo === trabajador) avisarFalloCarga();
  });
  trabajador = nuevo;
}

// Para el programa en marcha y carga un Python nuevo
function reiniciarPython() {
  trabajador.terminate();
  estado.textContent = "Reiniciando Python…";
  arrancarPython();
}

function avisarFalloCarga() {
  estado.textContent =
    "No se ha podido cargar Python. Revisa tu conexión a internet y recarga la página.";
}

function recibirMensaje(mensaje) {
  switch (mensaje.tipo) {
    case "listo":
      pythonListo = true;
      botonComprobar.disabled = ejecutando;
      if (botonEjecutar) botonEjecutar.disabled = ejecutando;
      if (!ejecutando) {
        estado.textContent = "Python está listo. Escribe tu código y pulsa «Comprobar».";
      }
      break;
    case "fallo-carga":
      avisarFalloCarga();
      break;
    case "salida":
      escribirSalida(mensaje.texto);
      break;
    case "pedir":
      dejarDeVigilar();
      pedirTexto(mensaje.mensaje);
      break;
    case "fin":
      terminarEjecucion({
        error: mensaje.error,
        salidaPruebas: mensaje.salidaPruebas || "",
        motivo: mensaje.demasiadaSalida ? "demasiada-salida" : null,
      });
      break;
  }
}

arrancarPython();

// --- 3. Ejecutar y comprobar ---
// Hay dos formas de ejecutar el programa:
//   · «Ejecutar»: la persona responde a mano. Sirve para probar y jugar.
//   · «Comprobar»: se ejecuta una vez por cada prueba de la lección, con
//     respuestas automáticas, y se compara lo que imprime con lo esperado.
let textoSalida = "";
let ejecutando = false;
let esperandoEntrada = false;
let finEjecucion = null;
let temporizador = null;

botonComprobar.addEventListener("click", comprobar);
if (botonEjecutar) botonEjecutar.addEventListener("click", ejecutarAMano);

// Ejecuta el programa una vez. Si le pasas «prueba», las respuestas
// salen de ahí y no se le pregunta nada a la persona.
async function ejecutarPrograma(codigo, prueba) {
  ejecutando = true;
  botonComprobar.disabled = true;
  if (botonEjecutar) botonEjecutar.disabled = true;
  textoSalida = "";
  salida.textContent = "";
  salida.classList.remove("salida-vacia");

  const resultado = await new Promise((resolver) => {
    finEjecucion = resolver;
    trabajador.postMessage({
      tipo: "ejecutar",
      codigo,
      entradas: prueba ? prueba.entradas : null,
      preparacion: prueba ? prueba.preparacion : null,
    });
    vigilar();
  });

  ejecutando = false;
  esperandoEntrada = false;
  formEntrada.hidden = true;
  botonComprobar.disabled = !pythonListo;
  if (botonEjecutar) botonEjecutar.disabled = !pythonListo;
  if (pythonListo) estado.textContent = "";
  return resultado;
}

// Muestra los avisos comunes (parada, error). Devuelve true si hubo problema.
function hayProblema(resultado, codigo) {
  if (resultado.motivo === "cancelado") {
    ocultarTodo();
    return true;
  }

  if (textoSalida.trim() === "") cajaResultado.hidden = true;

  if (resultado.motivo === "demasiado-tiempo" || resultado.motivo === "demasiada-salida") {
    const inicio =
      resultado.motivo === "demasiado-tiempo"
        ? `Tu programa llevaba más de ${LIMITE_SEGUNDOS} segundos sin terminar y lo hemos parado. `
        : "Tu programa ha escrito muchísimas líneas y lo hemos parado. ";
    mostrarAviso(
      inicio +
        "Seguramente hay un bucle infinito: un while que nunca acaba. " +
        "Comprueba que dentro del while cambia algo que haga que termine (por ejemplo, un input())."
    );
    return true;
  }

  if (resultado.error) {
    mostrarError(resultado.error, codigo);
    return true;
  }

  return false;
}

// Botón «Ejecutar»: la persona responde a mano y no se juzga el resultado
async function ejecutarAMano() {
  if (!pythonListo || ejecutando) return;
  const codigo = editor.getValue();
  ocultarTodo();
  estado.textContent = "Ejecutando…";

  const resultado = await ejecutarPrograma(codigo, null);
  if (hayProblema(resultado, codigo)) return;

  if (textoSalida.trim() === "") {
    cajaResultado.hidden = false;
    salida.textContent = "(Tu programa no ha mostrado nada. ¿Te falta un print()?)";
    salida.classList.add("salida-vacia");
  }
}

// Botón «Comprobar»: pasa todas las pruebas de la lección
async function comprobar() {
  if (!pythonListo || ejecutando) return;
  const codigo = editor.getValue();
  const pruebas = LECCION.pruebas || [];
  ocultarTodo();

  for (let i = 0; i < pruebas.length; i++) {
    const prueba = pruebas[i];
    estado.textContent =
      pruebas.length > 1 ? `Comprobando… (prueba ${i + 1} de ${pruebas.length})` : "Comprobando…";
    contarPrueba(i, pruebas.length, prueba);

    const resultado = await ejecutarPrograma(codigo, prueba);
    if (hayProblema(resultado, codigo)) return;

    if (!coincide(resultado.salidaPruebas, prueba.esperado)) {
      mostrarComparacion(prueba.esperado, resultado.salidaPruebas, codigo);
      return;
    }
  }

  // Algunas lecciones piden además usar algo concreto (por ejemplo, float)
  if (LECCION.requisito && !LECCION.requisito(quitarComentarios(codigo))) {
    nota.textContent = LECCION.notaSiNoCorrecto;
    nota.hidden = false;
    return;
  }

  retoSuperado();
}

// Dice qué prueba se está ejecutando, encima del resultado
function contarPrueba(indice, total, prueba) {
  if (!infoPrueba) return;
  if (total <= 1 && !(prueba.entradas || []).length) {
    infoPrueba.hidden = true;
    return;
  }
  const respuestas = (prueba.entradas || []).join(", ");
  const cual = total > 1 ? `Prueba ${indice + 1} de ${total}` : "Prueba";
  infoPrueba.textContent = respuestas ? `${cual} · respondiendo: ${respuestas}` : cual;
  infoPrueba.hidden = false;
}

// Compara sin tener en cuenta los espacios sobrantes ni las mayúsculas
function coincide(obtenido, esperado) {
  return limpiarParaComparar(obtenido) === limpiarParaComparar(esperado);
}

function limpiarParaComparar(texto) {
  return String(texto ?? "")
    .normalize("NFC")
    .replace(/\r/g, "")
    .split("\n")
    .map((linea) => linea.trim())
    .join("\n")
    .trim()
    .toLowerCase();
}

// El programa funciona, pero no sale lo que pide el reto
function mostrarComparacion(esperado, obtenido, codigo) {
  mostrarCaja({
    titulo: TITULO_CASI,
    mensaje: "Tu programa funciona, pero no hace lo que pide el reto.",
    comparacion: {
      esperado,
      obtenido: obtenido.trim() === "" ? "(nada)" : obtenido.trim(),
      consejo: buscarFalloTipico({ esperado, obtenido, codigo }),
    },
  });
}

// --- Fallos típicos ---
// Cada fallo mira el resultado esperado, el obtenido y el código, y
// devuelve un consejo o null. Se prueban en orden y gana el primero.
// Para añadir uno propio de una lección, ponlo en LECCION.fallosTipicos.
const CONSEJO_GENERAL = "Fíjate en la diferencia.";

const FALLOS_TIPICOS = [
  // La variable se ha quedado dentro de las comillas
  ({ esperado, obtenido, codigo }) => {
    const nombre = nombresDeVariables(codigo).find(
      (v) => contienePalabra(obtenido, v) && !contienePalabra(esperado, v)
    );
    if (!nombre) return null;
    return (
      `Ha salido la palabra "${nombre}" en lugar de lo que hay guardado dentro. ` +
      "Eso pasa cuando la variable se queda dentro de las comillas. " +
      "Recuerda: con comillas = el texto tal cual; sin comillas = mira qué hay dentro de la caja."
    );
  },

  // Solo cambian espacios o signos de puntuación
  ({ esperado, obtenido }) => {
    if (soloLetrasYNumeros(esperado) !== soloLetrasYNumeros(obtenido)) return null;
    return "¡Muy cerca! Solo cambia algún espacio o signo. Compáralas letra a letra.";
  },
];

function buscarFalloTipico(datos) {
  const fallos = [...(LECCION.fallosTipicos || []), ...FALLOS_TIPICOS];
  for (const fallo of fallos) {
    const consejo = fallo(datos);
    if (consejo) return consejo;
  }
  return CONSEJO_GENERAL;
}

// Nombres de las cajitas del código: lo que hay antes de un = (pero no de ==)
function nombresDeVariables(codigo) {
  const nombres = [...quitarComentarios(codigo || "").matchAll(/^[ \t]*([A-Za-zÁ-ÿ_]\w*)\s*=(?!=)/gm)];
  return [...new Set(nombres.map((n) => n[1]))];
}

function contienePalabra(texto, palabra) {
  return new RegExp(`(^|[^\\wÁ-ÿ])${palabra}([^\\wÁ-ÿ]|$)`, "i").test(String(texto));
}

function soloLetrasYNumeros(texto) {
  return String(texto)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function terminarEjecucion(resultado) {
  dejarDeVigilar();
  const resolver = finEjecucion;
  finEjecucion = null;
  if (resolver) resolver(resultado);
}

// Vigilancia de bucles infinitos
function vigilar() {
  dejarDeVigilar();
  temporizador = setTimeout(() => {
    reiniciarPython();
    terminarEjecucion({ motivo: "demasiado-tiempo" });
  }, LIMITE_SEGUNDOS * 1000);
}

function dejarDeVigilar() {
  clearTimeout(temporizador);
}

function escribirSalida(texto) {
  textoSalida += texto;
  salida.textContent = textoSalida;
  cajaResultado.hidden = false;
}

// input(): muestra la pregunta y espera a que la persona escriba
function pedirTexto(mensaje) {
  escribirSalida(mensaje);
  esperandoEntrada = true;
  campoEntrada.value = "";
  formEntrada.hidden = false;
  campoEntrada.focus();
  estado.textContent = "Tu programa está esperando: escribe la respuesta y pulsa «Enviar».";
}

formEntrada.addEventListener("submit", (evento) => {
  evento.preventDefault();
  enviarEntrada();
});

// Intro también envía la respuesta
campoEntrada.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter" || evento.isComposing) return;
  evento.preventDefault();
  enviarEntrada();
});

function enviarEntrada() {
  if (!esperandoEntrada) return;
  const valor = campoEntrada.value;
  esperandoEntrada = false;
  formEntrada.hidden = true;
  // Como en una terminal: lo escrito aparece junto a la pregunta
  escribirSalida(valor + "\n");
  estado.textContent = "Ejecutando…";
  trabajador.postMessage({ tipo: "respuesta", valor });
  vigilar();
}

// «Volver a empezar» con un programa en marcha: lo paramos
function cancelarEjecucion() {
  if (!ejecutando) return;
  reiniciarPython();
  terminarEjecucion({ motivo: "cancelado" });
}

function ocultarTodo() {
  cajaResultado.hidden = true;
  cajaError.hidden = true;
  comparacion.hidden = true;
  nota.hidden = true;
  acierto.hidden = true;
  formEntrada.hidden = true;
  if (infoPrueba) infoPrueba.hidden = true;
}

// --- 4. Errores en castellano ---
const TITULO_ERROR = "Vaya, algo no ha funcionado";
const TITULO_CASI = "Casi lo tienes";

// El único sitio que enseña el recuadro naranja. Cada trozo se muestra
// o se oculta aquí, así no puede quedarse uno visible por descuido.
function mostrarCaja({ titulo, mensaje, linea = null, tecnico = null, comparacion: datos = null }) {
  tituloError.textContent = titulo;
  errorMensaje.textContent = mensaje;

  errorLinea.textContent = linea ? `Mira la línea ${linea}.` : "";
  errorLinea.hidden = !linea;

  errorTecnico.textContent = tecnico || "";
  detallesError.hidden = !tecnico;

  if (datos) {
    textoEsperado.textContent = datos.esperado;
    textoObtenido.textContent = datos.obtenido;
    consejo.textContent = datos.consejo;
  }
  comparacion.hidden = !datos;

  cajaError.hidden = false;
}

function mostrarError(textoOriginal, codigo) {
  const { tipo, detalle, linea } = analizarError(textoOriginal);
  const textoLinea = linea ? codigo.split("\n")[linea - 1] || "" : "";

  // Primero, los mensajes propios de esta lección. Cada uno puede
  // fijarse en el tipo de error, en su detalle y en la línea que falla.
  const propio = (LECCION.errores || []).find(
    (e) =>
      e.tipo === tipo &&
      (!e.patron || e.patron.test(detalle)) &&
      (!e.linea || e.linea.test(textoLinea))
  );
  mostrarCaja({
    titulo: TITULO_ERROR,
    mensaje: propio ? propio.mensaje : traducirError(tipo, detalle),
    linea,
    tecnico: limpiarTraza(textoOriginal),
  });
}

// Aviso naranja sin mensaje técnico (por ejemplo, un bucle infinito)
function mostrarAviso(mensaje) {
  mostrarCaja({ titulo: TITULO_ERROR, mensaje });
}

// Saca el tipo de error, su detalle y la línea donde ocurrió
function analizarError(texto) {
  const lineas = texto.trim().split("\n");
  const ultima = lineas[lineas.length - 1] || "";
  const partes = ultima.match(/^(\w+):\s*(.*)$/);

  // Buscamos la última mención a una línea del código de la persona
  const coincidencias = [...texto.matchAll(/File "<exec>", line (\d+)/g)];
  const linea = coincidencias.length
    ? coincidencias[coincidencias.length - 1][1]
    : null;

  return {
    tipo: partes ? partes[1] : "",
    detalle: partes ? partes[2] : ultima,
    linea,
  };
}

// Quita las líneas internas de Pyodide, que solo confunden
function limpiarTraza(texto) {
  const inicio = texto.indexOf('File "<exec>"');
  if (inicio === -1) return texto.trim();
  return texto.slice(inicio).trim();
}

// Quita los comentarios (#...) para comprobar el código sin trampas
function quitarComentarios(codigo) {
  return codigo
    .split("\n")
    .map((linea) => linea.replace(/#.*$/, ""))
    .join("\n");
}

function traducirError(tipo, detalle) {
  switch (tipo) {
    case "SyntaxError":
      if (/never closed/.test(detalle)) {
        return "Has abierto un paréntesis, corchete o llave y no lo has cerrado.";
      }
      if (/unterminated string/.test(detalle)) {
        return "Has abierto unas comillas y no las has cerrado. El texto debe ir entre dos comillas, así: \"Hola\".";
      }
      if (/unmatched/.test(detalle)) {
        return "Sobra un paréntesis, corchete o llave de cierre.";
      }
      if (/Did you mean/.test(detalle) || /invalid syntax/.test(detalle)) {
        return "Python no entiende cómo está escrita esta línea. Revisa que no falten comillas, paréntesis o dos puntos (:).";
      }
      return "Hay algo mal escrito y Python no puede entender el código. Revisa comillas, paréntesis y dos puntos (:).";

    case "IndentationError":
    case "TabError":
      return "Los espacios al principio de la línea no son correctos. En Python, los espacios de la izquierda importan: revisa que estén bien alineados.";

    case "NameError": {
      const nombre = (detalle.match(/name '(.+?)'/) || [])[1];
      if (nombre) {
        return `Python no conoce «${nombre}». Comprueba que está bien escrito (mayúsculas incluidas). Si querías escribir un texto, ponlo entre comillas: "${nombre}".`;
      }
      return "Usas un nombre que Python no conoce. Comprueba que está bien escrito.";
    }

    case "TypeError":
      if (/can only concatenate str/.test(detalle) || /unsupported operand/.test(detalle)) {
        return "Intentas juntar tipos de datos que no encajan, por ejemplo un texto y un número. Puedes convertir el número a texto con str().";
      }
      return "Estás usando un dato de una forma que no le corresponde (por ejemplo, sumar texto con números).";

    case "ZeroDivisionError":
      return "Estás dividiendo entre cero, y eso no se puede hacer.";

    case "ValueError":
      if (/could not convert string to float/.test(detalle)) {
        return "Lo que se ha escrito no es un número. Escribe solo cifras y usa punto para los decimales: 86.50, no 86,50.";
      }
      if (/invalid literal for int/.test(detalle)) {
        return "Lo que se ha escrito no es un número entero. Escribe solo cifras, sin letras ni decimales.";
      }
      return "El valor que usas no es válido para esa operación. Por ejemplo, float(\"hola\") falla porque \"hola\" no es un número.";

    case "IndexError":
      return "Intentas usar una posición que no existe en la lista. Recuerda que se empieza a contar desde 0.";

    case "KeyError":
      return "Buscas una clave que no existe en el diccionario.";

    case "AttributeError":
      return "Usas algo que ese dato no tiene. Revisa que el nombre después del punto esté bien escrito.";

    case "ModuleNotFoundError":
    case "ImportError":
      return "El módulo que intentas importar no existe o no está disponible aquí.";

    case "OSError":
      return "Por ahora, input() solo funciona fuera de las funciones (def). Úsalo en el cuerpo principal del programa.";

    default:
      return "Ha ocurrido un error al ejecutar tu código. Abre el mensaje original de abajo para ver más detalles.";
  }
}

// --- 5. Proyecto terminado ---
let pantallaMostrada = false;

function retoSuperado() {
  marcarCompletado(LECCION.numero);
  // La pantalla sale la primera vez; después basta con el mensaje verde
  if (pantallaMostrada) {
    acierto.hidden = false;
    return;
  }
  pantallaMostrada = true;
  abrirPantallaTerminado();
}

function abrirPantallaTerminado() {
  const siguiente =
    LECCION.numero < TOTAL_PROYECTOS ? datosProyecto(LECCION.numero + 1) : null;

  const pantalla = document.createElement("dialog");
  pantalla.className = "terminado";
  pantalla.setAttribute("aria-labelledby", "terminado-titulo");
  pantalla.innerHTML = `
    <div class="terminado-icono" aria-hidden="true">🎉</div>
    <span class="etiqueta">Proyecto ${LECCION.numero} de ${TOTAL_PROYECTOS}</span>
    <h2 id="terminado-titulo">¡Proyecto terminado!</h2>
    <p>Has completado «${escapar(LECCION.titulo)}».</p>
    <h3>Lo que has aprendido</h3>
    <ul class="chips">
      ${LECCION.aprendido.map((a) => `<li>${escapar(a)}</li>`).join("")}
    </ul>
    ${
      siguiente
        ? `<div class="desbloqueado">
             <span aria-hidden="true">🔓</span>
             Desbloqueado: <strong>Proyecto ${siguiente.numero}${
               siguiente.titulo ? ` · ${escapar(siguiente.titulo)}` : ""
             }</strong>
             ${siguiente.url ? "" : "<br><small>Muy pronto disponible</small>"}
           </div>`
        : ""
    }
    <div class="acciones">
      ${
        siguiente && siguiente.url
          ? `<a class="boton" href="${siguiente.url}">Ir al proyecto ${siguiente.numero}</a>
             <a class="boton boton-secundario" href="index.html">Ver el mapa</a>`
          : `<a class="boton" href="index.html">Ver el mapa</a>`
      }
      <button class="boton boton-secundario" type="button">Quedarme en este proyecto</button>
    </div>
  `;

  const cerrar = () => {
    if (pantalla.open) pantalla.close();
    pantalla.remove();
    acierto.hidden = false;
  };
  pantalla.querySelector("button").addEventListener("click", cerrar);
  // La tecla Escape también cierra la pantalla
  pantalla.addEventListener("close", cerrar);
  document.body.appendChild(pantalla);
  pantalla.showModal();
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
