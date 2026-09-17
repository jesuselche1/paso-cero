// ==========================================================
// Paso Cero — lógica de la página de lección
// 1. Crea el editor (CodeMirror)
// 2. Carga Python en el navegador (Pyodide)
// 3. Al pulsar «Comprobar», ejecuta el código y muestra el resultado
// 4. Si hay un error, lo explica en castellano sencillo
// ==========================================================

const CODIGO_INICIAL = 'print("Hola")';
const SALIDA_ESPERADA = "Hola, mundo";

// --- Elementos de la página ---
const botonComprobar = document.getElementById("boton-comprobar");
const botonReiniciar = document.getElementById("boton-reiniciar");
const estado = document.getElementById("estado");
const cajaResultado = document.getElementById("resultado");
const salida = document.getElementById("salida");
const cajaError = document.getElementById("error");
const errorMensaje = document.getElementById("error-mensaje");
const errorTecnico = document.getElementById("error-tecnico");
const acierto = document.getElementById("acierto");

// --- 1. Editor ---
const editor = CodeMirror.fromTextArea(document.getElementById("codigo"), {
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

botonReiniciar.addEventListener("click", () => {
  editor.setValue(CODIGO_INICIAL);
  ocultarTodo();
  editor.focus();
});

// --- 2. Cargar Python ---
let pyodide = null;
let textoSalida = "";

async function prepararPython() {
  try {
    pyodide = await loadPyodide();

    // Todo lo que Python "imprima" lo guardamos en textoSalida
    const decodificador = new TextDecoder();
    const recoger = {
      write: (bytes) => {
        textoSalida += decodificador.decode(bytes, { stream: true });
        return bytes.length;
      },
    };
    pyodide.setStdout(recoger);
    pyodide.setStderr(recoger);

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
botonComprobar.addEventListener("click", comprobar);

async function comprobar() {
  if (!pyodide || botonComprobar.disabled) return;

  botonComprobar.disabled = true;
  estado.textContent = "Ejecutando…";
  ocultarTodo();
  textoSalida = "";

  // Cada ejecución empieza "limpia", sin variables de la vez anterior
  const espacio = pyodide.globals.get("dict")();

  try {
    await pyodide.runPythonAsync(editor.getValue(), { globals: espacio });
    pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
    mostrarSalida(textoSalida);

    if (textoSalida.trim() === SALIDA_ESPERADA) {
      acierto.hidden = false;
    }
    estado.textContent = "";
  } catch (fallo) {
    // Si el programa llegó a mostrar algo antes del error, lo enseñamos
    pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
    if (textoSalida.trim() !== "") mostrarSalida(textoSalida);
    mostrarError(fallo);
    estado.textContent = "";
  } finally {
    espacio.destroy();
    botonComprobar.disabled = false;
  }
}

function mostrarSalida(texto) {
  cajaResultado.hidden = false;
  if (texto.trim() === "") {
    salida.textContent = "(Tu programa no ha mostrado nada. ¿Te falta un print()?)";
    salida.classList.add("salida-vacia");
  } else {
    salida.textContent = texto;
    salida.classList.remove("salida-vacia");
  }
}

function ocultarTodo() {
  cajaResultado.hidden = true;
  cajaError.hidden = true;
  acierto.hidden = true;
}

// --- 4. Errores en castellano ---
function mostrarError(fallo) {
  const textoOriginal = String(fallo.message || fallo);
  const { tipo, detalle, linea } = analizarError(textoOriginal);

  let mensaje = traducirError(tipo, detalle);
  if (linea) mensaje = `En la línea ${linea}: ${mensaje}`;

  errorMensaje.textContent = mensaje;
  errorTecnico.textContent = limpiarTraza(textoOriginal);
  cajaError.hidden = false;
}

// Saca el tipo de error, su detalle y la línea donde ocurrió
function analizarError(texto) {
  const lineas = texto.trim().split("\n");
  const ultima = lineas[lineas.length - 1] || "";
  const partes = ultima.match(/^(\w+):\s*(.*)$/);

  // Buscamos la última mención a una línea del código del alumno
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

function traducirError(tipo, detalle) {
  switch (tipo) {
    case "SyntaxError":
      if (/never closed/.test(detalle)) {
        return "has abierto un paréntesis, corchete o llave y no lo has cerrado.";
      }
      if (/unterminated string/.test(detalle)) {
        return "has abierto unas comillas y no las has cerrado. El texto debe ir entre dos comillas, así: \"Hola\".";
      }
      if (/unmatched/.test(detalle)) {
        return "sobra un paréntesis, corchete o llave de cierre.";
      }
      if (/Did you mean/.test(detalle) || /invalid syntax/.test(detalle)) {
        return "Python no entiende cómo está escrita esta línea. Revisa que no falten comillas, paréntesis o dos puntos (:).";
      }
      return "hay algo mal escrito y Python no puede entender el código. Revisa comillas, paréntesis y dos puntos (:).";

    case "IndentationError":
    case "TabError":
      return "los espacios al principio de la línea no son correctos. En Python, los espacios de la izquierda importan: revisa que estén bien alineados.";

    case "NameError": {
      const nombre = (detalle.match(/name '(.+?)'/) || [])[1];
      if (nombre) {
        return `Python no conoce «${nombre}». Comprueba que está bien escrito (mayúsculas incluidas). Si querías escribir un texto, ponlo entre comillas: "${nombre}".`;
      }
      return "usas un nombre que Python no conoce. Comprueba que está bien escrito.";
    }

    case "TypeError":
      if (/can only concatenate str/.test(detalle) || /unsupported operand/.test(detalle)) {
        return "intentas juntar tipos de datos que no encajan, por ejemplo un texto y un número. Puedes convertir el número a texto con str().";
      }
      return "estás usando un dato de una forma que no le corresponde (por ejemplo, sumar texto con números).";

    case "ZeroDivisionError":
      return "estás dividiendo entre cero, y eso no se puede hacer.";

    case "ValueError":
      return "el valor que usas no es válido para esa operación. Por ejemplo, int(\"hola\") falla porque \"hola\" no es un número.";

    case "IndexError":
      return "intentas usar una posición que no existe en la lista. Recuerda que se empieza a contar desde 0.";

    case "KeyError":
      return "buscas una clave que no existe en el diccionario.";

    case "AttributeError":
      return "usas algo que ese dato no tiene. Revisa que el nombre después del punto esté bien escrito.";

    case "ModuleNotFoundError":
    case "ImportError":
      return "el módulo que intentas importar no existe o no está disponible aquí.";

    default:
      return "ha ocurrido un error al ejecutar tu código. Abre el mensaje original de abajo para ver más detalles.";
  }
}
