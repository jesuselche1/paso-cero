// ==========================================================
// Paso Cero — lógica compartida de todas las lecciones
// Cada página define antes un objeto LECCION con sus datos:
// código inicial, pista, cómo se comprueba, lo aprendido...
//
// 1. Crea el editor (CodeMirror)
// 2. Carga Python en el navegador (Pyodide)
// 3. Al pulsar «Comprobar», ejecuta el código y muestra el resultado
//    (input() pide los datos en una caja dentro de la página)
// 4. Si hay un error, lo explica en castellano sencillo
// 5. Si el reto está superado, muestra la pantalla de proyecto terminado
// ==========================================================

// --- Elementos de la página ---
const porId = (id) => document.getElementById(id);
const botonComprobar = porId("boton-comprobar");
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

// --- 2. Cargar Python ---

// Este código Python se carga una vez. Antes de ejecutar el programa
// de la persona, cambia cada input() por una versión que espera a que
// escriba en la caja de la página, en vez de abrir una ventana emergente.
const AYUDANTE_PYTHON = `
import ast
import sys


class _EsperarEntrada(ast.NodeTransformer):
    # Dentro de funciones no se puede esperar, así que no entramos
    def visit_FunctionDef(self, nodo):
        return nodo

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_Lambda = visit_FunctionDef

    def visit_Call(self, nodo):
        self.generic_visit(nodo)
        if isinstance(nodo.func, ast.Name) and nodo.func.id == "input":
            nodo.func = ast.copy_location(
                ast.Name(id="__entrada__", ctx=ast.Load()), nodo.func
            )
            return ast.copy_location(ast.Await(value=nodo), nodo)
        return nodo


async def ejecutar(fuente, espacio, pedir_texto):
    async def __entrada__(mensaje=""):
        sys.stdout.flush()
        return str(await pedir_texto(str(mensaje)))

    espacio["__entrada__"] = __entrada__
    arbol = ast.parse(fuente, "<exec>")
    arbol = ast.fix_missing_locations(_EsperarEntrada().visit(arbol))
    codigo = compile(arbol, "<exec>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    resultado = eval(codigo, espacio)
    if resultado is not None:
        await resultado
`;

let pyodide = null;
let ejecutarPython = null;

async function prepararPython() {
  try {
    pyodide = await loadPyodide();

    // Todo lo que Python "imprima" aparece en el recuadro de resultado
    const decodificador = new TextDecoder();
    const recoger = {
      write: (bytes) => {
        escribirSalida(decodificador.decode(bytes, { stream: true }));
        return bytes.length;
      },
    };
    pyodide.setStdout(recoger);
    pyodide.setStderr(recoger);
    // Nunca abrir ventanas emergentes para pedir datos
    pyodide.setStdin({ error: true });

    pyodide.FS.writeFile("/home/pyodide/paso_cero.py", AYUDANTE_PYTHON);
    ejecutarPython = pyodide.pyimport("paso_cero").ejecutar;

    botonComprobar.disabled = false;
    estado.textContent = "Python está listo. Escribe tu código y pulsa «Comprobar».";
  } catch (fallo) {
    console.error(fallo);
    estado.textContent =
      "No se ha podido cargar Python. Revisa tu conexión a internet y recarga la página.";
  }
}

prepararPython();

// --- 3. Ejecutar el código ---
let textoSalida = "";
let ejecutando = false;
let cancelado = false;
let entradaPendiente = null;

botonComprobar.addEventListener("click", comprobar);

async function comprobar() {
  if (!ejecutarPython || ejecutando) return;

  ejecutando = true;
  cancelado = false;
  botonComprobar.disabled = true;
  estado.textContent = "Ejecutando…";
  ocultarTodo();
  textoSalida = "";
  salida.textContent = "";
  salida.classList.remove("salida-vacia");

  const codigo = editor.getValue();
  // Cada ejecución empieza "limpia", sin variables de la vez anterior
  const espacio = pyodide.globals.get("dict")();
  let fallo = null;

  try {
    await ejecutarPython(codigo, espacio, pedirTexto);
  } catch (error) {
    fallo = error;
  } finally {
    vaciarSalidas();
    espacio.destroy();
    formEntrada.hidden = true;
    entradaPendiente = null;
    ejecutando = false;
    botonComprobar.disabled = false;
    estado.textContent = "";
  }

  if (cancelado) {
    ocultarTodo();
    return;
  }

  if (fallo) {
    // Si el programa llegó a mostrar algo antes del error, se queda visible
    if (textoSalida.trim() === "") cajaResultado.hidden = true;
    mostrarError(fallo);
    return;
  }

  if (textoSalida.trim() === "") {
    cajaResultado.hidden = false;
    salida.textContent = "(Tu programa no ha mostrado nada. ¿Te falta un print()?)";
    salida.classList.add("salida-vacia");
  }

  if (LECCION.esCorrecto({ codigo, salida: textoSalida })) {
    retoSuperado();
  } else {
    nota.textContent = LECCION.notaSiNoCorrecto;
    nota.hidden = false;
  }
}

function escribirSalida(texto) {
  textoSalida += texto;
  salida.textContent = textoSalida;
  cajaResultado.hidden = false;
}

function vaciarSalidas() {
  try {
    pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
  } catch {
    // Nada que vaciar
  }
}

// input(): muestra la pregunta y espera a que la persona escriba
function pedirTexto(mensaje) {
  escribirSalida(mensaje);
  campoEntrada.value = "";
  formEntrada.hidden = false;
  campoEntrada.focus();
  estado.textContent = "Tu programa está esperando: escribe la respuesta y pulsa «Enviar».";
  return new Promise((resolver, rechazar) => {
    entradaPendiente = { resolver, rechazar };
  });
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
  if (!entradaPendiente) return;
  const valor = campoEntrada.value;
  const { resolver } = entradaPendiente;
  entradaPendiente = null;
  formEntrada.hidden = true;
  // Como en una terminal: lo escrito aparece junto a la pregunta
  escribirSalida(valor + "\n");
  estado.textContent = "Ejecutando…";
  resolver(valor);
}

function cancelarEjecucion() {
  if (!ejecutando) return;
  cancelado = true;
  if (entradaPendiente) entradaPendiente.rechazar(new Error("Ejecución cancelada"));
}

function ocultarTodo() {
  cajaResultado.hidden = true;
  cajaError.hidden = true;
  nota.hidden = true;
  acierto.hidden = true;
  formEntrada.hidden = true;
}

// --- 4. Errores en castellano ---
function mostrarError(fallo) {
  const textoOriginal = String(fallo.message || fallo);
  const { tipo, detalle, linea } = analizarError(textoOriginal);

  // Primero, los mensajes propios de esta lección
  const propio = (LECCION.errores || []).find(
    (e) => e.tipo === tipo && e.patron.test(detalle)
  );
  errorMensaje.textContent = propio ? propio.mensaje : traducirError(tipo, detalle);

  errorLinea.textContent = linea ? `Mira la línea ${linea}.` : "";
  errorLinea.hidden = !linea;
  errorTecnico.textContent = limpiarTraza(textoOriginal);
  cajaError.hidden = false;
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
