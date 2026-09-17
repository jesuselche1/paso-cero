// ==========================================================
// Paso Cero — Python en segundo plano (Web Worker)
// Ejecuta el código de la persona fuera de la página, para que
// un bucle infinito nunca deje la página congelada.
//
// Mensajes que recibe de la página:
//   { tipo: "ejecutar", codigo }   ejecuta un programa
//   { tipo: "respuesta", valor }   lo que la persona ha escrito en input()
// Mensajes que envía a la página:
//   { tipo: "listo" }                         Python está cargado
//   { tipo: "fallo-carga" }                   no se pudo cargar Python
//   { tipo: "salida", texto }                 texto que el programa muestra
//   { tipo: "pedir", mensaje }                el programa llama a input()
//   { tipo: "fin", error, demasiadaSalida }   el programa ha terminado
// ==========================================================

const URL_PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
importScripts(URL_PYODIDE + "pyodide.js");

// Si un programa escribe más que esto, casi seguro es un bucle infinito
const LIMITE_SALIDA = 50000;

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
let pendiente = "";        // salida que aún no se ha enviado a la página
let totalSalida = 0;
let demasiadaSalida = false;
let respuestaPendiente = null;

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
    totalSalida = 0;
    demasiadaSalida = false;

    // Cada ejecución empieza "limpia", sin variables de la vez anterior
    const espacio = pyodide.globals.get("dict")();
    let error = null;
    try {
      await ejecutarPython(data.codigo, espacio, pedirTexto);
    } catch (fallo) {
      error = String(fallo.message || fallo);
    } finally {
      try {
        pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
      } catch {
        // Nada que vaciar
      }
      espacio.destroy();
    }

    enviarSalida();
    postMessage({ tipo: "fin", error, demasiadaSalida });
  }
});
