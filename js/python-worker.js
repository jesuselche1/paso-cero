// ==========================================================
// Paso Cero — Python en segundo plano (Web Worker)
// Ejecuta el código de la persona fuera de la página, para que
// un bucle infinito nunca deje la página congelada.
//
// Mensajes que recibe de la página:
//   { tipo: "ejecutar", codigo, entradas, preparacion }
//       ejecuta un programa. Si vienen «entradas», input() las usa una a una
//       en vez de preguntar a la persona: así se comprueban las lecciones.
//   { tipo: "respuesta", valor }   lo que la persona ha escrito en input()
// Mensajes que envía a la página:
//   { tipo: "listo" }                         Python está cargado
//   { tipo: "fallo-carga" }                   no se pudo cargar Python
//   { tipo: "salida", texto }                 texto que el programa muestra
//   { tipo: "pedir", mensaje }                el programa llama a input()
//   { tipo: "fin", error, demasiadaSalida, salidaPruebas }
//       el programa ha terminado. «salidaPruebas» es solo lo que ha impreso,
//       sin las preguntas ni las respuestas, para poder compararlo.
// ==========================================================

// LIMITE_SALIDA y URL_PYODIDE viven en js/ajustes.js
importScripts("ajustes.js");
importScripts(URL_PYODIDE + "pyodide.js");

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


async def ejecutar(fuente, espacio, pedir_texto, preparacion=""):
    if preparacion:
        exec(preparacion, espacio)

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
let pendiente = "";        // salida que aún no se ha enviado a la página
let totalSalida = 0;
let demasiadaSalida = false;
let descartando = false;   // true mientras se tira la cola de un programa parado
let respuestaPendiente = null;
let entradasAutomaticas = null;  // respuestas de prueba, cuando las hay
let salidaPruebas = "";          // solo lo que imprime el programa

// Enviamos la salida por trozos para no saturar la página
function enviarSalida() {
  if (!pendiente) return;
  postMessage({ tipo: "salida", texto: pendiente });
  pendiente = "";
}

async function preparar() {
  pyodide = await loadPyodide({ indexURL: URL_PYODIDE });

  const decodificador = new TextDecoder();
  const recoger = {
    write: (bytes) => {
      // Al parar un programa queda texto a medio escribir: se tira,
      // para que no aparezca en la ejecución siguiente
      if (descartando) return bytes.length;
      // Al pasar el límite, cada print() da error y el programa se para
      if (demasiadaSalida) throw new Error("Demasiada salida");
      const texto = decodificador.decode(bytes, { stream: true });
      totalSalida += texto.length;
      if (totalSalida > LIMITE_SALIDA) {
        demasiadaSalida = true;
        enviarSalida();
        throw new Error("Demasiada salida");
      }
      pendiente += texto;
      salidaPruebas += texto;
      if (pendiente.length > 2000) enviarSalida();
      return bytes.length;
    },
  };
  pyodide.setStdout(recoger);
  pyodide.setStderr(recoger);
  // Nunca abrir ventanas emergentes para pedir datos
  pyodide.setStdin({ error: true });

  pyodide.FS.writeFile("/home/pyodide/paso_cero.py", AYUDANTE_PYTHON);
  ejecutarPython = pyodide.pyimport("paso_cero").ejecutar;
}

const preparado = preparar().then(
  () => postMessage({ tipo: "listo" }),
  (fallo) => {
    console.error(fallo);
    postMessage({ tipo: "fallo-carga" });
  }
);

// input(): pide el dato a la página y espera la respuesta
function pedirTexto(mensaje) {
  enviarSalida();

  // Durante una comprobación, las respuestas ya están decididas
  if (entradasAutomaticas) {
    const valor = entradasAutomaticas.length ? entradasAutomaticas.shift() : "";
    // Se muestra la conversación, pero no cuenta para la comparación
    postMessage({ tipo: "salida", texto: mensaje + valor + "\n" });
    return Promise.resolve(valor);
  }

  postMessage({ tipo: "pedir", mensaje });
  return new Promise((resolver) => {
    respuestaPendiente = resolver;
  });
}

self.addEventListener("message", async ({ data }) => {
  if (data.tipo === "respuesta") {
    const resolver = respuestaPendiente;
    respuestaPendiente = null;
    if (resolver) resolver(data.valor);
    return;
  }

  if (data.tipo === "ejecutar") {
    await preparado;
    pendiente = "";
    salidaPruebas = "";
    totalSalida = 0;
    demasiadaSalida = false;
    entradasAutomaticas = data.entradas ? [...data.entradas] : null;

    // Cada ejecución empieza "limpia", sin variables de la vez anterior
    const espacio = pyodide.globals.get("dict")();
    let error = null;
    try {
      await ejecutarPython(data.codigo, espacio, pedirTexto, data.preparacion || "");
    } catch (fallo) {
      error = String(fallo.message || fallo);
    } finally {
      // Si el programa se paró por escribir demasiado, lo que quede en la
      // cola es basura de ese bucle: se vacía sin guardarla
      descartando = demasiadaSalida;
      try {
        pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
      } catch {
        // Nada que vaciar
      }
      descartando = false;
      espacio.destroy();
    }

    enviarSalida();
    postMessage({ tipo: "fin", error, demasiadaSalida, salidaPruebas });
    demasiadaSalida = false;
  }
});
